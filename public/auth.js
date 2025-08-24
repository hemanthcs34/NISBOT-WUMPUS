document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Replace this with your actual Render backend URL
    const API_BASE_URL = 'https://your-render-backend-url.onrender.com';

    const loginButton = document.getElementById('login-button');
    const nameInput = document.getElementById('participant-name');
    const statusP = document.getElementById('auth-status');

    sessionStorage.removeItem('nisbotUser');
    sessionStorage.removeItem('nisbotGameState');

    const attemptLogin = async () => {
        const name = nameInput.value.trim();
        if (!name) {
            statusP.textContent = 'Please enter your name.';
            statusP.style.color = 'yellow';
            return;
        }

        statusP.textContent = 'Authenticating...';
        statusP.style.color = '#e0e0e0';

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            const result = await response.json();

            if (response.ok) {
                statusP.textContent = 'Success! Starting game...';
                statusP.style.color = 'green';
                sessionStorage.setItem('nisbotUser', name);
                window.location.href = 'index.html';
            } else {
                statusP.textContent = result.message || 'Authentication failed.';
                statusP.style.color = 'red';
            }
        } catch (error) {
            console.error('Login error:', error);
            statusP.textContent = 'Could not connect to the server.';
            statusP.style.color = 'red';
        }
    };

    loginButton.addEventListener('click', attemptLogin);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
});