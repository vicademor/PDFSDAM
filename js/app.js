// Toggle sidebar
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('show');
});

// Modal
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const topicCards = document.querySelectorAll('.topic-card');

// Firebase inicialización (igual que en admin.js)
const firebaseConfig = {
    apiKey: "AIzaSyDPDlaizuJ8MdLhbEV9ny4utP098pqnmcg",
    authDomain: "pdfsdam.firebaseapp.com",
    databaseURL: "https://pdfsdam-default-rtdb.firebaseio.com",
    projectId: "pdfsdam",
    appId: "1:836229684120:web:fd1dfcf58113c95fb129ed",
    measurementId: "G-PXS4C0EZN9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Cargar asignaturas dinámicamente desde Realtime Database
async function cargarAsignaturas() {
    const snapshot = await db.ref("pdfs").once("value");
    const asignaturas = {};

    if (!snapshot.exists()) return asignaturas;

    snapshot.forEach(child => {
        const data = child.val();
        const { asignatura, tipo, tema, nombre, urlPreview } = data;

        if (!asignaturas[asignatura]) asignaturas[asignatura] = { resumenes:{}, ejercicios:{} };
        if (!asignaturas[asignatura][tipo][tema]) asignaturas[asignatura][tipo][tema] = [];

        asignaturas[asignatura][tipo][tema].push({ name: nombre, link: urlPreview });
    });

    return asignaturas;
}

// Abrir modal al clicar un tema
cargarAsignaturas().then(asignaturas => {
    topicCards.forEach(card => {
        card.addEventListener('click', () => {
            const asignatura = card.getAttribute('data-asignatura');
            const section = card.getAttribute('data-section');
            const topic = card.getAttribute('data-topic');

            modalTitle.textContent = card.textContent;
            modalContent.innerHTML = '';

            const data = asignaturas[asignatura]?.[section]?.[topic] || [];

            data.forEach(item => {
                const a = document.createElement('a');
                a.href = item.link;
                a.textContent = item.name;
                a.target = '_blank';
                a.className = 'card';
                modalContent.appendChild(a);
            });

            // Mostrar el modal
            modalOverlay.style.display = 'flex';
        });
    });
});

// Cerrar modal
modalClose.addEventListener('click', () => (modalOverlay.style.display = 'none'));
modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});