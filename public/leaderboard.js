document.addEventListener('DOMContentLoaded', async () => {
    // The live URL for your Render backend
    const API_BASE_URL = 'https://nisbot-wumpus.onrender.com';

    const list = document.getElementById('leaderboard-list');
    const loading = document.getElementById('leaderboard-loading');
    
    try {
        // Fetch scores from our backend API
        const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const scores = await response.json();
        
        if (scores.length === 0) {
            loading.textContent = 'No scores yet. Be the first!';
        } else {
            loading.style.display = 'none'; // Hide "Loading..." text
            scores.forEach(player => {
                const li = document.createElement('li');
                // Use the correct field names: name and totalscore
                li.textContent = `${player.name} - ${player.totalscore}`;
                list.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        loading.textContent = 'Could not load leaderboard. Check the server connection.';
    }
});
