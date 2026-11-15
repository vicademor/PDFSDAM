// --- Configuración Firebase ---
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
const db  = getDatabase(app);

// OAuth Google Drive
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

let allPdfs = {};

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // LOGIN & AUTH DRIVE
    // ==========================================
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
        document.getElementById("loginStatus").textContent = "✅ Login correcto con Google Drive.";
        document.getElementById("uploadSection").style.display      = "block";
        document.getElementById("manageSection").style.display      = "block";
        document.getElementById("asignaturasSection").style.display = "block";
        cargarAsignaturasEnSelect();
        cargarListaPDFs();
        inicializarFiltros();
    }

    // ==========================================
    // ASIGNATURAS DINÁMICAS → SELECT
    // ==========================================
    function cargarAsignaturasEnSelect() {
        const selectEl = document.getElementById("asignatura");
        if (!selectEl) return;

        onValue(ref(db, "asignaturas"), snapshot => {
            selectEl.querySelectorAll('option.dynamic-opt').forEach(o => o.remove());
            if (!snapshot.exists()) return;

            const estaticas = ["programacion", "sistemas", "bases", "entornos", "lenguajes"];
            Object.entries(snapshot.val()).forEach(([id, data]) => {
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
    // CREAR ASIGNATURA
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

            crearAsignaturaBtn.disabled = true;
            asignaturaStatus.textContent = "⏳ Guardando...";
            try {
                await set(ref(db, "asignaturas/" + id), { id, nombre, curso, descripcion, createdAt: Date.now() });
                asignaturaStatus.textContent = `✅ Asignatura "${nombre}" creada.`;
                document.getElementById("asignaturaId").value = "";
                document.getElementById("asignaturaNombre").value = "";
                document.getElementById("asignaturaDesc").value = "";
            } catch (err) {
                asignaturaStatus.textContent = "❌ Error: " + err.message;
            } finally {
                crearAsignaturaBtn.disabled = false;
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
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ role: "reader", type: "anyone" })
        });
    }

    async function saveMetadata(meta) {
        const newRef = push(ref(db, "pdfs"));
        await set(newRef, meta);
        return newRef.key;
    }

    if (input) {
        input.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            const tipo = document.getElementById("tipo").value;
            if (!file) { status.textContent = "Selecciona un archivo válido."; return; }

            if (tipo === "resumenes" && file.type !== "application/pdf") {
                status.textContent = "Solo se permiten PDFs para resúmenes."; return;
            }
            if (tipo === "ejercicios") {
                const ext = file.name.split(".").pop().toLowerCase();
                if (!["pdf","java","rar"].includes(ext)) {
                    status.textContent = "Solo se permiten PDF, Java o RAR para ejercicios."; return;
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

                await saveMetadata({ asignatura, tipo, tema, nombre, driveFileId: driveFile.id, urlPreview, urlDownload, size: file.size, createdAt: Date.now() });

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

    // ==========================================
    // TABLA DE ARCHIVOS CON FILTROS
    // ==========================================
    function inicializarFiltros() {
        const searchInput  = document.getElementById("filterSearch");
        const asigFilter   = document.getElementById("filterAsig");
        const tipoFilter   = document.getElementById("filterTipo");

        [searchInput, asigFilter, tipoFilter].forEach(el => {
            if (el) el.addEventListener("input", renderTabla);
        });
    }

    async function cargarListaPDFs() {
        const snapshot = await get(ref(db, "pdfs"));
        allPdfs = {};
        if (snapshot.exists()) allPdfs = snapshot.val();
        populateAsigFilter();
        renderTabla();
    }

    function populateAsigFilter() {
        const asigFilter = document.getElementById("filterAsig");
        if (!asigFilter) return;
        const prev = asigFilter.value;
        asigFilter.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

        const asigs = [...new Set(Object.values(allPdfs).map(p => p.asignatura))].sort();
        asigs.forEach(a => {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a.charAt(0).toUpperCase() + a.slice(1);
            asigFilter.appendChild(opt);
        });
        if (prev) asigFilter.value = prev;
    }

    function renderTabla() {
        const tbody      = document.getElementById("pdfTbody");
        const countEl    = document.getElementById("tableCount");
        const searchVal  = (document.getElementById("filterSearch")?.value || "").toLowerCase();
        const asigVal    = document.getElementById("filterAsig")?.value || "";
        const tipoVal    = document.getElementById("filterTipo")?.value || "";

        if (!tbody) return;
        tbody.innerHTML = "";

        const entries = Object.entries(allPdfs).filter(([, pdf]) => {
            const matchSearch = !searchVal ||
                pdf.nombre?.toLowerCase().includes(searchVal) ||
                pdf.tema?.toLowerCase().includes(searchVal) ||
                pdf.asignatura?.toLowerCase().includes(searchVal);
            const matchAsig = !asigVal || pdf.asignatura === asigVal;
            const matchTipo = !tipoVal || pdf.tipo === tipoVal;
            return matchSearch && matchAsig && matchTipo;
        });

        if (countEl) countEl.textContent = `${entries.length} archivo${entries.length !== 1 ? "s" : ""}`;

        if (entries.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No se encontraron archivos.</td></tr>`;
            return;
        }

        entries.forEach(([id, pdf]) => {
            const ext = pdf.nombre?.split(".").pop().toLowerCase() || "";
            const enlaceFinal = ["java","rar"].includes(ext) ? pdf.urlDownload : pdf.urlPreview;
            const tipoBadge   = pdf.tipo === "resumenes"
                ? `<span class="badge badge-res">Resumen</span>`
                : `<span class="badge badge-ej">Ejercicio</span>`;
            const asigBadge = `<span class="badge badge-asig">${pdf.asignatura || "—"}</span>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <a href="${enlaceFinal}" target="${["java","rar"].includes(ext) ? "_self" : "_blank"}"
                       ${["java","rar"].includes(ext) ? `download="${pdf.nombre}"` : ""}>
                        📄 ${pdf.nombre || "—"}
                    </a>
                </td>
                <td>${asigBadge}</td>
                <td>${tipoBadge}</td>
                <td>${pdf.tema || "—"}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="tbl-btn tbl-btn-edit"   data-id="${id}">✏️ Editar</button>
                        <button class="tbl-btn tbl-btn-delete" data-id="${id}">🗑️ Eliminar</button>
                    </div>
                </td>
            `;

            tr.querySelector('.tbl-btn-edit').addEventListener("click", async () => {
                const nuevoTema   = prompt("Nuevo tema:", pdf.tema);
                const nuevoNombre = prompt("Nuevo nombre:", pdf.nombre);
                if (nuevoTema && nuevoNombre) {
                    try {
                        await set(ref(db, "pdfs/" + id), { ...pdf, tema: nuevoTema, nombre: nuevoNombre, updatedAt: Date.now() });
                        allPdfs[id] = { ...pdf, tema: nuevoTema, nombre: nuevoNombre };
                        renderTabla();
                    } catch (err) { alert("Error al actualizar: " + err.message); }
                }
            });

            tr.querySelector('.tbl-btn-delete').addEventListener("click", async () => {
                if (!confirm(`¿Eliminar "${pdf.nombre}"?`)) return;
                try {
                    await set(ref(db, "pdfs/" + id), null);
                    delete allPdfs[id];
                    populateAsigFilter();
                    renderTabla();
                } catch (err) { alert("Error al eliminar: " + err.message); }
            });

            tbody.appendChild(tr);
        });
    }
});
