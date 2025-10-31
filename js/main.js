// GranoCraft/js/main.js (Versión Final con Toasts)

/**
 * ========================================
 * FUNCIÓN PARA MOSTRAR NOTIFICACIONES TOAST
 * ========================================
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message); // Fallback si el HTML no existe

    // 1. Crear el elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.textContent = message;

    // 2. Añadir al contenedor
    container.appendChild(toast);

    // 3. Eliminar el elemento del DOM después de que la animación termine (3.5s)
    setTimeout(() => {
        container.removeChild(toast);
    }, 3500); // La animación dura 3s + 0.5s de salida
}


/**
 * ========================================
 * 1. LÓGICA DE ESTADO ACTIVO DEL MENÚ
 * ========================================
 */
function setActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPath) {
        try {
            const activeLink = document.querySelector(`nav a[href="${currentPath}"]`);
            if (activeLink) activeLink.classList.add('active');
        } catch (e) { console.warn("Error al seleccionar enlace activo:", e.message); }
    }
}

/**
 * ========================================
 * 2. LÓGICA DE NAVEGACIÓN DINÁMICA (Login/Logout)
 * ========================================
 */
function updateNavBasedOnAuth() {
    let token = localStorage.getItem('authToken');
    const sessionLinks = document.getElementById('session-links'); 
    const adminLinks = document.getElementById('admin-links'); 
    const logoutButtonNav = document.getElementById('logout-button-nav'); 

    // Validación estricta del token
    if (token && token.length > 50) { 
        if (sessionLinks) sessionLinks.style.display = 'none';
        if (adminLinks) adminLinks.style.display = 'inline'; 
    } else {
        if (token) localStorage.removeItem('authToken');
        if (sessionLinks) sessionLinks.style.display = 'inline'; 
        if (adminLinks) adminLinks.style.display = 'none';
    }

    if (logoutButtonNav) {
        if (!logoutButtonNav.dataset.listenerAttached) {
            logoutButtonNav.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                showToast('Sesión cerrada.', 'success');
                setTimeout(() => { window.location.href = '/login.html'; }, 500); 
            });
            logoutButtonNav.dataset.listenerAttached = 'true';
        }
    }
}

// Ejecutar al cargar
setActiveNav();
updateNavBasedOnAuth();

/**
 * ========================================
 * 3. LÓGICA ESPECÍFICA DE LOGIN
 * ========================================
 */
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');

    // A. Mostrar/ocultar contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function (e) {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }

    // B. Envío del formulario de login
    if (loginForm && emailInput && passwordInput) {
        localStorage.removeItem('authToken'); // Limpiar al cargar login

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showToast('Por favor, ingrese correo y contraseña.', 'error');
                return;
            }

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('authToken', data.token);
                    showToast('¡Inicio de sesión exitoso!', 'success');
                    setTimeout(() => { window.location.href = '/admin.html'; }, 500); 
                } else {
                    const errorMessage = await response.text();
                    localStorage.removeItem('authToken'); 
                    showToast(`Error: ${errorMessage}`, 'error');
                }
            } catch (error) {
                console.error('Error de red durante el login:', error);
                localStorage.removeItem('authToken'); 
                showToast('Error de red. Intente de nuevo.', 'error');
            }
        });
    }
} 

/**
 * ========================================
 * 4. LÓGICA ESPECÍFICA DE REGISTRO
 * ========================================
 */
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (registerForm && emailInput && passwordInput) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showToast('Por favor, ingrese correo y contraseña.', 'error');
                return;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const message = await response.text();
                    showToast(message + ' Ahora puede iniciar sesión.', 'success');
                    setTimeout(() => { window.location.href = '/login.html'; }, 500);
                } else {
                    const errorMessage = await response.text();
                    showToast(`Error al registrarse: ${errorMessage}`, 'error');
                }
            } catch (error) {
                console.error('Error de red durante el registro:', error);
                showToast('Error de red. Intente de nuevo.', 'error');
            }
        });
    }
}