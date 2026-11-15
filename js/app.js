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

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// Asignaturas estáticas de 1º DAM
const DAM1_ESTATICAS = {
    programacion: { href: "programacion.html", nombre: "Programación" },
    sistemas:     { href: "sistemas.html",     nombre: "Sistemas Informáticos" },
    bases:        { href: "bases.html",        nombre: "Bases de Datos" },
    entornos:     { href: "entornos.html",     nombre: "Entornos de Desarrollo" },
    lenguajes:    { href: "lenguajes.html",    nombre: "Lenguajes de Marcas" }
};

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // SIDEBAR TOGGLE (escritorio/móvil)
    // ==========================================
    const toggleBtn = document.getElementById('toggleSidebar');
    const mq = window.matchMedia('(max-width: 1024px)');

    function applyInitialState() {
        const open = !mq.matches;
        document.body.classList.toggle('sidebar-open', open);
        toggleBtn?.setAttribute('aria-expanded', String(open));
    }

    applyInitialState();
    mq.addEventListener('change', applyInitialState);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isOpen = document.body.classList.contains('sidebar-open');
            document.body.classList.toggle('sidebar-open', !isOpen);
            toggleBtn.setAttribute('aria-expanded', String(!isOpen));
        });
    }

    // ==========================================
    // DESPLEGABLES DE LA SIDEBAR
    // ==========================================
    const asignaturaActual = document.body.dataset.asignatura || "";
    const dam1Ids = Object.keys(DAM1_ESTATICAS);

    let currentDam = null;
    if (dam1Ids.includes(asignaturaActual)) currentDam = "1";

    // Función toggle de un desplegable
    function setupToggle(btnEl, listEl) {
        if (!btnEl || !listEl) return;
        btnEl.addEventListener('click', () => {
            const isOpen = listEl.classList.contains('open');
            // Cerrar todos
            document.querySelectorAll('.dropdown-list.open').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.dropdown-toggle.open').forEach(el => el.classList.remove('open'));
            // Abrir el clickado si estaba cerrado
            if (!isOpen) {
                listEl.classList.add('open');
                btnEl.classList.add('open');
            }
        });
    }

    function openDropdown(btnEl, listEl) {
        if (!btnEl || !listEl) return;
        listEl.classList.add('open');
        btnEl.classList.add('open');
    }

    const dam1Btn  = document.querySelector('[data-target="dam1-list"]');
    const dam1List = document.getElementById('dam1-list');
    const dam2Btn  = document.querySelector('[data-target="dam2-list"]');
    const dam2List = document.getElementById('dam2-list');

    setupToggle(dam1Btn, dam1List);
    setupToggle(dam2Btn, dam2List);

    // Marcar enlace activo en 1º DAM estáticas
    if (dam1List) {
        dam1List.querySelectorAll('a[data-asignatura-id]').forEach(a => {
            if (a.dataset.asignaturaId === asignaturaActual) {
                a.classList.add('active');
            }
        });
        if (currentDam === "1") openDropdown(dam1Btn, dam1List);
    }

    // ==========================================
    // CARGAR ASIGNATURAS DINÁMICAS DESDE FIREBASE
    // ==========================================
    onValue(ref(db, "asignaturas"), snapshot => {
        if (!snapshot.exists()) return;
        const asignaturas = snapshot.val();

        // Limpiar dinámicas previas
        [dam1List, dam2List].forEach(list => {
            if (!list) return;
            list.querySelectorAll('.dynamic-asignatura').forEach(el => el.remove());
        });

        Object.entries(asignaturas).forEach(([id, data]) => {
            const curso = String(data.curso);
            const targetList = curso === "2" ? dam2List : dam1List;
            if (!targetList) return;

            // No duplicar estáticas
            if (DAM1_ESTATICAS[id]) return;

            // Quitar placeholder vacío
            const emptyMsg = targetList.querySelector('.empty-msg');
            if (emptyMsg) emptyMsg.remove();

            const li = document.createElement('li');
            li.className = 'dynamic-asignatura';
            const a = document.createElement('a');
            a.href = `asignatura.html?id=${encodeURIComponent(id)}`;
            a.textContent = data.nombre || id;

            if (asignaturaActual === id) {
                a.classList.add('active');
                if (curso === "2") openDropdown(dam2Btn, dam2List);
                else               openDropdown(dam1Btn, dam1List);
            }

            li.appendChild(a);
            targetList.appendChild(li);
        });
    });

    // ==========================================
    // MODAL
    // ==========================================
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle   = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalClose   = document.getElementById('modalClose');

    function abrirModal(asignaturas, card) {
        const asignatura = card.dataset.asignatura;
        const section    = card.dataset.section;
        const topic      = card.dataset.topic;

        modalTitle.textContent = card.textContent;
        modalContent.innerHTML = '';

        const data = asignaturas[asignatura]?.[section]?.[topic] || [];
        if (data.length === 0) {
            modalContent.textContent = "No hay archivos disponibles para este tema.";
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

    // Escuchar PDFs en tiempo real
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

        const asigActual = document.body.dataset.asignatura;

        ["resumenes", "ejercicios"].forEach(tipo => {
            const section = document.querySelector(`#${tipo} .section-cards`);
            if (!section) return;
            section.innerHTML = "";

            if (asignaturas[asigActual]?.[tipo]) {
                Object.keys(asignaturas[asigActual][tipo]).forEach(tema => {
                    const card = document.createElement("div");
                    card.className = "topic-card";
                    card.dataset.asignatura = asigActual;
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
