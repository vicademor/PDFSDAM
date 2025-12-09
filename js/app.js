// --- Importar Firebase modular ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDPDlaizuJ8MdLhbEV9ny4utP098pqnmcg",
    authDomain: "pdfsdam.firebaseapp.com",
    databaseURL: "https://pdfsdam-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pdfsdam",
    appId: "1:836229684120:web:fd1dfcf58113c95fb129ed",
    measurementId: "G-PXS4C0EZN9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Ejecutar todo cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    // Toggle sidebar
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Modal
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalClose = document.getElementById('modalClose');

    // Función para abrir modal
    function abrirModal(asignaturas, card) {
        const asignatura = card.dataset.asignatura;
        const section = card.dataset.section;
        const topic = card.dataset.topic;

        modalTitle.textContent = card.textContent;
        modalContent.innerHTML = '';

        const data = asignaturas[asignatura]?.[section]?.[topic] || [];
        if (data.length === 0) {
            modalContent.textContent = "No hay PDFs disponibles para este tema.";
        } else {
            data.forEach(item => {
                const a = document.createElement('a');
                a.href = item.link;
                a.textContent = item.name;
                a.target = '_blank';
                a.className = 'card';
                modalContent.appendChild(a);
            });
        }
        modalOverlay.style.display = 'flex';
    }

    // 🔥 Escuchar cambios en tiempo real y reconstruir asignaturas
    onValue(ref(db, "pdfs"), snapshot => {
        const asignaturas = {};
        if (!snapshot.exists()) return;

        const data = snapshot.val();
        Object.values(data).forEach(pdf => {
            const { asignatura, tipo, tema, nombre, urlPreview } = pdf;
            if (!asignaturas[asignatura]) asignaturas[asignatura] = { resumenes: {}, ejercicios: {} };
            if (!asignaturas[asignatura][tipo][tema]) asignaturas[asignatura][tipo][tema] = [];
            asignaturas[asignatura][tipo][tema].push({ name: nombre, link: urlPreview });
        });

        // Detectar asignatura actual desde el body
        const asignaturaActual = document.body.dataset.asignatura;

        // Limpiar y reconstruir cards SOLO de la asignatura actual
        ["resumenes", "ejercicios"].forEach(tipo => {
            const section = document.querySelector(`#${tipo} .section-cards`);
            if (!section) return;
            section.innerHTML = "";

            if (asignaturas[asignaturaActual] && asignaturas[asignaturaActual][tipo]) {
                Object.keys(asignaturas[asignaturaActual][tipo]).forEach(tema => {
                    const card = document.createElement("div");
                    card.className = "topic-card";
                    card.dataset.asignatura = asignaturaActual;
                    card.dataset.section = tipo;
                    card.dataset.topic = tema;
                    card.textContent = tema;
                    section.appendChild(card);

                    card.onclick = () => abrirModal(asignaturas, card);
                });
            }
        });
    });

    // Cerrar modal
    if (modalClose) {
        modalClose.addEventListener('click', () => (modalOverlay.style.display = 'none'));
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => {
            if (e.target === modalOverlay) modalOverlay.style.display = 'none';
        });
    }
});