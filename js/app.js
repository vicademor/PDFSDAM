// Toggle sidebar
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('show'); // usar la clase .show que definiste en CSS
});

// Modal
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const topicCards = document.querySelectorAll('.topic-card');

// URL base de tu GitHub Pages (pon tu usuario y repo)
const baseURL = "https://vicademor.github.io/PDFSDAM";

// Datos de todas las asignaturas
const asignaturas = {
    programacion: {
        resumenes: {
            tema1: [{ name: 'Teoría T1', link: 'pdfs/Progra/ud01.pdf' }],
            tema2: [{ name: 'Teoría T2', link: 'pdfs/Progra/ud02.pdf' }],
            tema3: [
                { name: 'Teoría T3', link: 'pdfs/Progra/ud03.pdf' },
                { name: 'Teoría Algoritmos', link: 'pdfs/Progra/ud03-2.pdf' }
            ],
            tema4: [{ name: 'Teoría T4', link: 'pdfs/Progra/ud04.pdf' }],
            tema5: [{ name: 'Teoría T5', link: 'pdfs/Progra/ud05.pdf' }]
        },
        ejercicios: {
            tema1: [
                { name: 'Ejercicio 1', link: 'ejer/progra/T1/A1.java' },
                { name: 'Ejercicio 2', link: 'ejer/progra/T1/A2.java' },
                { name: 'Ejercicio 3', link: 'ejer/progra/T1/A3.java' },
                { name: 'Ejercicio 4', link: 'ejer/progra/T1/A4.java' }
            ],
            tema2: [{ name: 'Ejercicio 2', link: 'ejer/progra/T2/Ejercicios.rar' }],
            tema3: [{ name: 'Ejercicio 3', link: 'ejer/progra/T3/Ejercicios.rar' }],
            tema4: [{ name: 'Ejercicio 4', link: 'ejer/progra/T4/Ejercicios.rar' }],
            tema5: [{ name: 'Ejercicio 5', link: 'ejer/progra/T5/Ejercicios.rar' }]
        }
    },
    sistemas: {
        resumenes: {
            tema1: [
                { name: 'Repaso T1', link: 'pdfs/Sistemas/ud01.pdf' },
                { name: 'Teoría T1', link: 'pdfs/Sistemas/ud01-2.pdf' }
            ],
            tema2: [{ name: 'Teoría T2', link: 'pdfs/Sistemas/ud02.pdf' }],
            tema3: [{ name: 'Teoría T3', link: 'pdfs/Sistemas/ud03.pdf' }],
            tema4: [{ name: 'Teoría T4', link: 'pdfs/Sistemas/ud04.pdf' }],
            tema5: [{ name: 'Teoría T5', link: 'pdfs/Sistemas/ud05.pdf' }]
        },
        ejercicios: {
            tema1: [{ name: 'Ejercicio 1', link: 'ejer/sistemas/Ejercicios.rar' }],
            tema2: [{ name: 'Ejercicio 2', link: 'ejer/sistemas/Ejercicios.rar' }],
            tema3: [{ name: 'Ejercicio 3', link: 'ejer/sistemas/Ejercicios.rar' }],
            tema4: [{ name: 'Ejercicio 4', link: 'ejer/sistemas/Ejercicios.rar' }],
            tema5: [{ name: 'Ejercicio 5', link: 'ejer/sistemas/Ejercicios.rar' }]
        }
    },
    bases: {
        resumenes: {
            tema1: [{ name: 'Primer Trimestre', link: 'pdfs/Bases/ResumenTrimestre.rar' }]
        },
        ejercicios: {
            tema1: [{ name: 'Ejercicio 1', link: 'ejer/bases/Ejercicios.rar' }],
            tema2: [{ name: 'Ejercicio 2', link: 'ejer/bases/Ejercicios.rar' }],
            tema3: [{ name: 'Ejercicio 3', link: 'ejer/bases/Ejercicios.rar' }],
            tema4: [{ name: 'Ejercicio 4', link: 'ejer/bases/Ejercicios.rar' }],
            tema5: [{ name: 'Ejercicio 5', link: 'ejer/bases/Ejercicios.rar' }]
        }
    },
    entornos: {
        resumenes: {
            tema1: [
                { name: 'Teoría T1', link: 'pdfs/Entornos/ud01.pdf' },
                { name: 'Teoría T1.2', link: 'pdfs/Entornos/ud01-2.pdf' }
            ],
            tema2: [
                { name: 'Teoría T2', link: 'pdfs/Entornos/ud02.pdf' },
                { name: 'Teoría T2.2', link: 'pdfs/Entornos/ud02-2.pdf' }
            ],
            tema3: [{ name: 'Teoría T3', link: 'pdfs/Entornos/ud03.pdf' }],
            tema4: [{ name: 'Teoría T4', link: 'pdfs/Entornos/ud04.pdf' }],
            tema5: [{ name: 'Teoría T5', link: 'pdfs/Entornos/ud05.pdf' }]
        },
        ejercicios: {
            tema1: [{ name: 'Ejercicio 1', link: 'ejer/entornos/Ejercicios.rar' }],
            tema2: [{ name: 'Ejercicio 2', link: 'ejer/entornos/Ejercicios.rar' }],
            tema3: [{ name: 'Ejercicio 3', link: 'ejer/entornos/Ejercicios.rar' }],
            tema4: [{ name: 'Ejercicio 4', link: 'ejer/entornos/Ejercicios.rar' }],
            tema5: [{ name: 'Ejercicio 5', link: 'ejer/entornos/Ejercicios.rar' }]
        }
    },
    lenguajes: {
        resumenes: {
            tema1: [{ name: 'Primer Trimestre', link: 'pdfs/Lenguajes/PrimerTrimestre.rar' }]
        },
        ejercicios: {
            tema1: [{ name: 'Ejercicio 1', link: 'ejer/lenguajes/Ejercicios.rar' }],
            tema2: [{ name: 'Ejercicio 2', link: 'ejer/lenguajes/Ejercicios.rar' }],
            tema3: [{ name: 'Ejercicio 3', link: 'ejer/lenguajes/Ejercicios.rar' }],
            tema4: [{ name: 'Ejercicio 4', link: 'ejer/lenguajes/Ejercicios.rar' }],
            tema5: [{ name: 'Ejercicio 5', link: 'ejer/lenguajes/Ejercicios.rar' }]
        }
    }
};


// Abrir modal al clicar un tema
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
            // Ajustar URL para GitHub Pages
            a.href = item.link; // "pdfs/Progra/ud01.pdf"
            a.textContent = item.name;
            a.target = '_blank';
            a.className = 'card';
            console.log("Generando enlace:", a.href);
            // Forzar descarga si es .zip o .java
            if (item.link.endsWith('.zip') || item.link.endsWith('.java')) {
                a.setAttribute('download', '');
            }

            modalContent.appendChild(a);
        });

        modalOverlay.style.display = 'flex';
    });
});

// Cerrar modal
modalClose.addEventListener('click', () => (modalOverlay.style.display = 'none'));
modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log("Service Worker registrado"))
    .catch(err => console.error("Error al registrar SW:", err));
}
function ajustarContenido() {
    const header = document.querySelector("header");
    const content = document.querySelector(".content");

    if (window.matchMedia("(max-width: 1024px)").matches) {
        const headerHeight = header.offsetHeight;
        content.style.marginTop = headerHeight + "px";
    } else {
        content.style.marginTop = "";
    }
}

window.addEventListener("load", ajustarContenido);
window.addEventListener("resize", ajustarContenido);