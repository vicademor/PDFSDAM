// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDPDlaizuJ8MdLhbEV9ny4utP098pqnmcg",
    authDomain: "pdfsdam.firebaseapp.com",
    projectId: "pdfsdam",
    storageBucket: "pdfsdam.appspot.com",
    messagingSenderId: "836229684120",
    appId: "1:836229684120:web:fd1dfcf58113c95fb129ed",
    measurementId: "G-PXS4C0EZN9"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        document.getElementById("loginStatus").textContent = "Acceso correcto.";
        document.getElementById("uploadSection").style.display = "block";
        document.getElementById("manageSection").style.display = "block";
        cargarListaPDFs();
    } catch (err) {
        document.getElementById("loginStatus").textContent = "Error: " + err.message;
    }
});

// Subida de PDFs
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

    const path = `${asignatura}/${tipo}/${tema}/${nombre}.pdf`;
    const storageRef = storage.ref(path);

    const uploadTask = storageRef.put(file, { contentType: "application/pdf" });

    uploadTask.on("state_changed",
        (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            progress.value = pct;
            status.textContent = `Subiendo... ${pct}%`;
        },
        (err) => { status.textContent = "Error: " + err.message; },
        async () => {
            const url = await storageRef.getDownloadURL();
            status.textContent = "PDF subido correctamente.";
            link.href = url;
            link.style.display = "inline";

            await db.collection("pdfs").add({ asignatura, tipo, tema, nombre, url, path });
            cargarListaPDFs();
        }
    );
});

// Listar PDFs
async function cargarListaPDFs() {
    const pdfList = document.getElementById("pdfList");
    pdfList.innerHTML = "";
    const snapshot = await db.collection("pdfs").get();
    snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "pdf-item";

        const a = document.createElement("a");
        a.href = data.url;
        a.textContent = `${data.asignatura} - ${data.tipo} - ${data.tema} - ${data.nombre}`;
        a.target = "_blank";

        const btn = document.createElement("button");
        btn.textContent = "Eliminar";
        btn.addEventListener("click", async () => {
            try {
                // Borrar de Storage
                await storage.ref(data.path).delete();
                // Borrar de Firestore
                await db.collection("pdfs").doc(doc.id).delete();
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