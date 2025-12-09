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

    // Firebase inicialización (igual que en admin.js)
    const firebaseConfig = {
        apiKey: "AIzaSyDPDlaizuJ8MdLhbEV9ny4utP098pqnmcg",
        authDomain: "pdfsdam.firebaseapp.com",
        databaseURL: "https://pdfsdam-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "pdfsdam",
        appId: "1:836229684120:web:fd1dfcf58113c95fb129ed",
        measurementId: "G-PXS4C0EZN9"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // Función para abrir modal
    function abrirModal(asignaturas, card) {
        const asignatura = card.getAttribute('data-asignatura');
        const section = card.getAttribute('data-section');
        const topic = card.getAttribute('data-topic');

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

        // Mostrar el modal
        modalOverlay.style.display = 'flex';
    }

    // 🔥 Escuchar cambios en tiempo real y reconstruir asignaturas
    db.ref("pdfs").on("value", snapshot => {
        const asignaturas = {};
        if (!snapshot.exists()) return;

        snapshot.forEach(child => {
            const data = child.val();
            const { asignatura, tipo, tema, nombre, urlPreview } = data;

            if (!asignaturas[asignatura]) asignaturas[asignatura] = { resumenes: {}, ejercicios: {} };
            if (!asignaturas[asignatura][tipo][tema]) asignaturas[asignatura][tipo][tema] = [];

            asignaturas[asignatura][tipo][tema].push({ name: nombre, link: urlPreview });
        });

        // Crear dinámicamente las cards en el HTML
        Object.keys(asignaturas).forEach(asig => {
            ["resumenes", "ejercicios"].forEach(tipo => {
                const section = document.querySelector(`#${tipo} .section-cards`);
                if (!section) return;

                Object.keys(asignaturas[asig][tipo]).forEach(tema => {
                    let card = section.querySelector(`[data-topic="${tema}"]`);
                    if (!card) {
                        card = document.createElement("div");
                        card.className = "topic-card";
                        card.dataset.asignatura = asig;
                        card.dataset.section = tipo;
                        card.dataset.topic = tema;
                        card.textContent = tema;
                        section.appendChild(card);
                    }

                    // Listener para abrir modal
                    card.onclick = () => abrirModal(asignaturas, card);
                });
            });
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