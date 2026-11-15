// --- Configuración Firebase (solo para DB) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPDlaizuJ8MdLhbEV9ny4utP098pqnmcg",
    authDomain: "pdfsdam.firebaseapp.com",
    databaseURL: "https://pdfsdam-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pdfsdam",
    appId: "1:836229684120:web:fd1dfcf58113c95fb129ed",
    measurementId: "G-PXS4C0EZN9"
};

const app = initializeApp(firebaseConfig);
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

// --- Lógica principal ---
document.addEventListener("DOMContentLoaded", () => {
    let accessToken = getAccessTokenFromHash();

    const loginBtn = document.getElementById("loginBtn");
    const input    = document.getElementById("pdfInput");
    const progress = document.getElementById("uploadProgress");
    const status   = document.getElementById("uploadStatus");
    const link     = document.getElementById("downloadLink");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = getAuthUrl();
        });
    }

    if (accessToken) {
        console.log("✅ Token activo:", accessToken);
        document.getElementById("loginStatus").textContent = "✅ Login correcto con Google Drive.";
        document.getElementById("uploadSection").style.display = "block";
        document.getElementById("manageSection").style.display = "block";
        document.getElementById("asignaturasSection").style.display = "block";
        cargarListaPDFs();
        cargarAsignaturasEnSelect();
    }

    // ==========================================
    // CARGAR ASIGNATURAS DINÁMICAS EN EL SELECT
    // ==========================================
    function cargarAsignaturasEnSelect() {
        const selectEl = document.getElementById("asignatura");
        if (!selectEl) return;

        onValue(ref(db, "asignaturas"), snapshot => {
            // Eliminar opciones dinámicas previas
            selectEl.querySelectorAll('option.dynamic-opt').forEach(o => o.remove());

            if (!snapshot.exists()) return;
            const asignaturas = snapshot.val();

            Object.entries(asignaturas).forEach(([id, data]) => {
                // Evitar duplicar las 5 estáticas
                const estaticas = ["programacion", "sistemas", "bases", "entornos", "lenguajes"];
                if (estaticas.includes(id)) return;

                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = data.nombre || id;
                opt.className = 'dynamic-opt';
                selectEl.appendChild(opt);
            });
        });
    }

    // ==========================================
    // GESTIÓN DE ASIGNATURAS
    // ==========================================
    const crearAsignaturaBtn = document.getElementById("crearAsignaturaBtn");
    const asignaturaStatus   = document.getElementById("asignaturaStatus");

    if (crearAsignaturaBtn) {
        crearAsignaturaBtn.addEventListener("click", async () => {
            const id          = document.getElementById("asignaturaId").value.trim().toLowerCase().replace(/\s+/g, "-");
            const nombre      = document.getElementById("asignaturaNombre").value.trim();
            const curso       = parseInt(document.getElementById("asignaturaCurso").value, 10);
            const descripcion = document.getElementById("asignaturaDesc").value.trim();

            if (!id || !nombre) {
                asignaturaStatus.textContent = "⚠️ El ID y el nombre son obligatorios.";
                return;
            }

            if (!/^[a-z0-9-]+$/.test(id)) {
                asignaturaStatus.textContent = "⚠️ El ID solo puede contener letras minúsculas, números y guiones.";
                return;
            }

            try {
                asignaturaStatus.textContent = "⏳ Guardando...";
                await set(ref(db, "asignaturas/" + id), {
                    id,
                    nombre,
                    curso,
                    descripcion,
                    createdAt: Date.now()
                });
                asignaturaStatus.textContent = `✅ Asignatura "${nombre}" creada correctamente.`;
                document.getElementById("asignaturaId").value = "";
                document.getElementById("asignaturaNombre").value = "";
                document.getElementById("asignaturaDesc").value = "";
            } catch (err) {
                asignaturaStatus.textContent = "❌ Error: " + err.message;
            }
        });
    }

    // ==========================================
    // SUBIDA A DRIVE
    // ==========================================
    async function uploadFileToDrive(fileBlob, filename) {
        const ext = filename.split(".").pop().toLowerCase();

        let mimeType = "application/octet-stream";
        if (ext === "pdf")  mimeType = "application/pdf";
        if (ext === "java") mimeType = "text/x-java-source";
        if (ext === "rar")  mimeType = "application/vnd.rar";

        const metadata = { name: filename, mimeType };

        const boundary    = "-------3141592653589793";
        const delimiter   = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
        const filePart     = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

        const reader = await fileBlob.arrayBuffer();
        const body = new Blob([metadataPart, filePart, new Uint8Array(reader), closeDelimiter], {
            type: `multipart/related; boundary=${boundary}`
        });

        const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}` },
            body
        });

        if (!res.ok) throw new Error(await res.text());
        return res.json();
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

    async function saveMetadata(meta) {
        const newRef = push(ref(db, "pdfs"));
        await set(newRef, meta);
        return newRef.key;
    }

    // --- Manejo de subida ---
    if (input) {
        input.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            const tipo = document.getElementById("tipo").value;

            if (!file) {
                status.textContent = "Selecciona un archivo válido.";
                return;
            }

            if (tipo === "resumenes") {
                if (file.type !== "application/pdf") {
                    status.textContent = "Solo se permiten PDFs para resúmenes.";
                    return;
                }
            }

            if (tipo === "ejercicios") {
                const ext = file.name.split(".").pop().toLowerCase();
                if (!["pdf", "java", "rar"].includes(ext)) {
                    status.textContent = "Solo se permiten PDF, Java o RAR para ejercicios.";
                    return;
                }
            }

            const asignatura = document.getElementById("asignatura").value;
            const tema       = document.getElementById("tema").value;
            const nombre     = document.getElementById("nombre").value || file.name;

            try {
                status.textContent = "⏳ Subiendo a Drive...";
                progress.value = 10;

                const driveFile = await uploadFileToDrive(file, nombre);
                progress.value = 70;

                await makeFilePublic(driveFile.id);
                progress.value = 90;

                const urlPreview  = `https://drive.google.com/file/d/${driveFile.id}/preview`;
                const urlDownload = `https://drive.google.com/uc?export=download&id=${driveFile.id}`;

                const ext = nombre.split(".").pop().toLowerCase();
                const enlaceFinal = ["java","rar"].includes(ext) ? urlDownload : urlPreview;

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
                status.textContent = "✅ Archivo subido correctamente.";
                link.href = enlaceFinal;
                link.style.display = "inline";

                if (["java","rar"].includes(ext)) {
                    link.setAttribute("download", nombre);
                    link.removeAttribute("target");
                }

                cargarListaPDFs();
            } catch (err) {
                status.textContent = "❌ Error: " + err.message;
            }
        });
    }

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
            const ext = pdf.nombre.split(".").pop().toLowerCase();
            const enlaceFinal = ["java","rar"].includes(ext) ? pdf.urlDownload : pdf.urlPreview;

            a.href = enlaceFinal;
            a.textContent = `${pdf.asignatura} - ${pdf.tipo} - ${pdf.tema} - ${pdf.nombre}`;
            a.target = "_blank";

            if (["java","rar"].includes(ext)) {
                a.setAttribute("download", pdf.nombre);
                a.removeAttribute("target");
            }

            // Botón Editar
            const editBtn = document.createElement("button");
            editBtn.textContent = "Editar";
            editBtn.addEventListener("click", async () => {
                const nuevoTema   = prompt("Nuevo tema:", pdf.tema);
                const nuevoNombre = prompt("Nuevo nombre:", pdf.nombre);

                if (nuevoTema && nuevoNombre) {
                    try {
                        const updatedMeta = {
                            ...pdf,
                            tema:      nuevoTema,
                            nombre:    nuevoNombre,
                            updatedAt: Date.now()
                        };
                        await set(ref(db, "pdfs/" + id), updatedMeta);
                        alert("✅ PDF actualizado correctamente.");
                        cargarListaPDFs();
                    } catch (err) {
                        alert("Error al actualizar: " + err.message);
                    }
                }
            });

            // Botón Eliminar
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Eliminar";
            deleteBtn.addEventListener("click", async () => {
                try {
                    await set(ref(db, "pdfs/" + id), null);
                    div.remove();
                    alert("✅ PDF eliminado correctamente.");
                } catch (err) {
                    alert("Error al eliminar: " + err.message);
                }
            });

            div.appendChild(a);
            div.appendChild(editBtn);
            div.appendChild(deleteBtn);
            pdfList.appendChild(div);
        });
    }
});
