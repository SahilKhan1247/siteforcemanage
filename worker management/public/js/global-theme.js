// ============================================================
// GLOBAL THEME MANAGEMENT - WORKS ON ALL PAGES
// ============================================================

// Get current theme from localStorage
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

// Apply theme to all pages
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        // Update toggle icon if exists
        const toggleIcon = document.querySelector('.theme-toggle i');
        if (toggleIcon) {
            toggleIcon.className = 'fa-solid fa-sun';
        }
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        const toggleIcon = document.querySelector('.theme-toggle i');
        if (toggleIcon) {
            toggleIcon.className = 'fa-solid fa-moon';
        }
    } else if (theme === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            const toggleIcon = document.querySelector('.theme-toggle i');
            if (toggleIcon) {
                toggleIcon.className = 'fa-solid fa-sun';
            }
        } else {
            document.body.classList.remove('dark-theme');
            const toggleIcon = document.querySelector('.theme-toggle i');
            if (toggleIcon) {
                toggleIcon.className = 'fa-solid fa-moon';
            }
        }
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
}

// Toggle theme (Light/Dark)
function toggleTheme() {
    const current = getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    
    // Update theme buttons if exists
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === newTheme);
    });
}

// Set specific theme
function setTheme(theme) {
    applyTheme(theme);
    
    // Update theme buttons if exists
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Load theme on page load
function loadTheme() {
    const theme = getCurrentTheme();
    applyTheme(theme);
    
    // Update theme buttons if exists
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Listen to system theme changes
if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', function(e) {
        if (getCurrentTheme() === 'system') {
            if (e.matches) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
    });
}

// Auto-load theme when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    
    // Setup theme toggle button if exists
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
        });
    }
});

// Make functions globally accessible
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.getCurrentTheme = getCurrentTheme;
window.applyTheme = applyTheme;
window.loadTheme = loadTheme;