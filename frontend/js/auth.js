// Auth page logic (login/signup)

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorAlert = document.getElementById('errorAlert');
            errorAlert.classList.add('d-none');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await login(email, password);
                const { token } = result.data;

                localStorage.setItem('token', token);

                window.location.href = 'dashboard.html';
            } catch (error) {
                errorAlert.textContent = error.message;
                errorAlert.classList.remove('d-none');
            }
        });
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorAlert = document.getElementById('errorAlert');
            errorAlert.classList.add('d-none');

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await signup(name, email, password);
                const { token } = result.data;

                localStorage.setItem('token', token);

                window.location.href = 'dashboard.html';
            } catch (error) {
                errorAlert.textContent = error.message;
                errorAlert.classList.remove('d-none');
            }
        });
    }
});
