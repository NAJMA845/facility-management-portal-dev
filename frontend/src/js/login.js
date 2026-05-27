document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const eyeIcon = document.getElementById("eyeIcon");

    if (window.authGuard && window.authGuard.getUser() && window.authGuard.getToken()) {
        window.location.href = window.authGuard.roleHome(window.authGuard.getUser().role);
        return;
    }

    // Seamless Dynamic Password Visibility Toggle
    togglePasswordBtn.addEventListener("click", () => {
        const isPasswordType = passwordInput.getAttribute("type") === "password";
        
        if (isPasswordType) {
            passwordInput.setAttribute("type", "text");
            eyeIcon.classList.remove("fa-regular", "fa-eye");
            eyeIcon.classList.add("fa-solid", "fa-eye-slash");
        } else {
            passwordInput.setAttribute("type", "password");
            eyeIcon.classList.remove("fa-solid", "fa-eye-slash");
            eyeIcon.classList.add("fa-regular", "fa-eye");
        }
    });

    // Real Form Submission Handler using API
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = passwordInput.value;

        try {
            const res = await window.api.login(email, password);
            if (!res || res.error) {
                alert(res && res.error ? res.error : 'Login failed');
                return;
            }
            // save user info for client-side routing
            if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
            // token already saved by api.login
            const role = (res.user && res.user.role) || 'user';
            // route by role (do not change UI markup)
            window.location.href = window.authGuard ? window.authGuard.roleHome(role) : '/src/pages/manager-dashboard.html';
        } catch (err) {
            console.error('Login error', err);
            alert('Login error');
        }
    });
});