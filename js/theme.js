// =============================================
// PDFSDAM — Theme Manager (Claro / Oscuro)
// 100% autónomo, funciona en local (file:///) y servidores web
// =============================================

(function() {
    function getStoredTheme() {
        try {
            return localStorage.getItem('pdfsdam_theme') || 'light';
        } catch (e) {
            return 'light';
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) {
            document.body.setAttribute('data-theme', theme);
        }

        const isDark = theme === 'dark';

        // Actualizar todos los botones e interruptores de tema en la página
        const toggles = document.querySelectorAll('.theme-toggle-btn, #themeToggle, .admin-theme-btn');
        toggles.forEach(btn => {
            btn.innerHTML = isDark 
                ? '<span class="theme-icon">☀️</span><span class="theme-text">Claro</span>'
                : '<span class="theme-icon">🌙</span><span class="theme-text">Oscuro</span>';
            btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.setAttribute('title', isDark ? 'Modo claro (Naranja)' : 'Modo oscuro (Azul)');
        });

        const sidebarBtns = document.querySelectorAll('#sidebarThemeToggle, .sidebar-theme-btn');
        sidebarBtns.forEach(btn => {
            btn.innerHTML = isDark
                ? '<span class="theme-icon">☀️</span> Modo Claro'
                : '<span class="theme-icon">🌙</span> Modo Oscuro';
        });

        // Meta theme-color para navegadores móviles
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', isDark ? '#0a0e17' : '#ff8c00');
        }
    }

    window.toggleTheme = function() {
        const current = getStoredTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem('pdfsdam_theme', next);
        } catch (e) {
            console.warn(e);
        }
        applyTheme(next);
    };

    // Aplicar inmediatamente para evitar cualquier parpadeo de color
    applyTheme(getStoredTheme());

    // Inicializar listeners cuando el DOM esté listo
    function init() {
        applyTheme(getStoredTheme());

        document.addEventListener('click', function(e) {
            const btn = e.target.closest('#themeToggle, .theme-toggle-btn, .admin-theme-btn, #sidebarThemeToggle, .sidebar-theme-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                window.toggleTheme();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
