// --- Configuración Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPDlaizuJ8MdLhbEV9ny4utP098pqnmcg",
    authDomain: "pdfsdam.firebaseapp.com",
    databaseURL: "https://pdfsdam-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pdfsdam",
    appId: "1:836229684120:web:fd1dfcf58113c95fb129ed",
    measurementId: "G-PXS4C0EZN9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- Configuración OAuth Google Drive ---
const GOOGLE_CLIENT_ID = "836229684120-8t8tisi28lck0af74b76rdeufapdtse7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

function getAuthUrl() {
    const params = new URLSearchParams({
        response_type: "token",
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: window.location.origin + window.location.pathname,
        scope: SCOPES,
        prompt: "consent"
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function getAccessTokenFromHash() {
    const h = new URLSearchParams(window.location.hash.slice(1));
    return h.get("access_token");
}

let accessToken = getAccessTokenFromHash();
if (accessToken) {
    // Mostrar secciones al iniciar sesión
    document.getElementById("loginStatus").textContent = "✅ Login correcto con Google Drive.";
    document.getElementById("uploadSection").style.display = "block";
    document.getElementById("manageSection").style.display = "block";
    cargarListaPDFs();
}
// Botón login con Google
document.getElementById("loginBtn").addEventListener("click", () => {
    window.location.href = getAuthUrl();
});

// --- Subida a Drive ---
async function uploadPdfToDrive(fileBlob, filename) {
    const metadata = { name: filename, mimeType: "application/pdf" };

    const boundary = "-------3141592653589793";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const filePart = `${delimiter}Content-Type: application/pdf\r\n\r\n`;

    const reader = await fileBlob.arrayBuffer();
    const body = new Blob([metadataPart, filePart, new Uint8Array(reader), closeDelimiter], { type: `multipart/related; boundary=${boundary}` });

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}` },
        body
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json(); // { id, name, ... }
}

async function makeFilePublic(fileId) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "reader", type: "anyone" })
    });
}

// --- Guardar metadatos en DB ---
async function saveMetadata(meta) {
    const newRef = push(ref(db, "pdfs"));
    await set(newRef, meta);
    return newRef.key;
}

// --- Manejo de subida ---
const input = document.getElementById("pdfInput");
const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");
const link = document.getElementById("downloadLink");

input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
        status.textContent = "Selecciona un archivo PDF válido.";
        return;
    }

    const asignatura = document.getElementById("asignatura").value;
    const tipo = document.getElementById("tipo").value;
    const tema = document.getElementById("tema").value;
    const nombre = document.getElementById("nombre").value || file.name;

    try {
        status.textContent = "⏳ Subiendo a Drive...";
        progress.value = 10;

        const driveFile = await uploadPdfToDrive(file, nombre);
        progress.value = 70;

        await makeFilePublic(driveFile.id);
        progress.value = 90;

        const urlPreview = `https://drive.google.com/file/d/${driveFile.id}/preview`;
        const urlDownload = `https://drive.google.com/uc?export=download&id=${driveFile.id}`;

        const meta = {
            asignatura,
            tipo,
            tema,
            nombre,
            driveFileId: driveFile.id,
            urlPreview,
            urlDownload,
            size: file.size,
            createdAt: Date.now()
        };
        await saveMetadata(meta);

        progress.value = 100;
        status.textContent = "✅ PDF subido correctamente.";
        link.href = urlPreview;
        link.style.display = "inline";

        cargarListaPDFs();
    } catch (err) {
        status.textContent = "❌ Error: " + err.message;
    }
});

// --- Listar PDFs desde DB ---
async function cargarListaPDFs() {
    const pdfList = document.getElementById("pdfList");
    pdfList.innerHTML = "";

    const snapshot = await get(ref(db, "pdfs"));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    Object.entries(data).forEach(([id, pdf]) => {
        const div = document.createElement("div");
        div.className = "pdf-item";

        const a = document.createElement("a");
        a.href = pdf.urlPreview;
        a.textContent = `${pdf.asignatura} - ${pdf.tipo} - ${pdf.tema} - ${pdf.nombre}`;
        a.target = "_blank";

        const btn = document.createElement("button");
        btn.textContent = "Eliminar";
        btn.addEventListener("click", async () => {
            try {
                await set(ref(db, "pdfs/" + id), null);
                div.remove();
            } catch (err) {
                alert("Error al eliminar: " + err.message);
            }
        });

        div.appendChild(a);
        div.appendChild(btn);
        pdfList.appendChild(div);
    });
}