document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 10;
    const NUM_CHIPS = 8;
    const NUM_PITS = 10;

    // DOM Elements
    const board = document.getElementById('game-board');
    const scoreDisplay = document.getElementById('score-display');
    const chipsDisplay = document.getElementById('chips-display');
    const messageDisplay = document.getElementById('message-display');
    const sensoryDisplay = document.getElementById('sensory-display');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartButton = document.getElementById('restart-button');
    const startScreen = document.getElementById('start-screen');
    const startGameButton = document.getElementById('start-game-button');
    const winScreen = document.getElementById('win-screen');
    const winMessage = document.getElementById('win-message');
    const playAgainButton = document.getElementById('play-again-button');

    // Game State
    let grid = [];
    let playerPos = { x: 0, y: 0 };
    let nisbotPos = {};
    let pits = [];
    let chips = [];
    let score = 100;
    let chipsCollected = 0;
    let gameOver = false;

    function initializeGame() {
        // Reset state
        grid = [];
        playerPos = { x: 0, y: 0 };
        nisbotPos = {};
        pits = [];
        chips = [];
        score = 100;
        chipsCollected = 0;
        gameOver = false;
        moveCooldown = false;

        // Hide game over screen
        gameOverScreen.classList.add('hidden');

        // Impossible placement check
        const totalItems = 1 + 1 + NUM_PITS + NUM_CHIPS; // player, nisbot, pits, chips
        if (totalItems > GRID_SIZE * GRID_SIZE) {
            alert('Grid too small for all items! Please reduce pits/chips or increase grid size.');
            return;
        }

        // Create grid
        for (let y = 0; y < GRID_SIZE; y++) {
            grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                grid[y][x] = {
                    visited: false,
                    hasPit: false,
                    hasNisbot: false,
                    hasChip: false,
                    cues: new Set()
                };
            }
        }

        // Place player
        grid[playerPos.y][playerPos.x].visited = true;

        // Generate unique positions for items
        const occupiedPositions = new Set(['0,0']);

        function getUniquePosition() {
            let x, y, posKey;
            let attempts = 0;
            do {
                x = Math.floor(Math.random() * GRID_SIZE);
                y = Math.floor(Math.random() * GRID_SIZE);
                posKey = `${x},${y}`;
                attempts++;
                if (attempts > 1000) {
                    alert('Failed to place all items. Try again!');
                    throw new Error('Placement failed');
                }
            } while (occupiedPositions.has(posKey));
            occupiedPositions.add(posKey);
            return { x, y };
        }

        // Place Nisbot
        nisbotPos = getUniquePosition();
        grid[nisbotPos.y][nisbotPos.x].hasNisbot = true;

        // Place Pits
        for (let i = 0; i < NUM_PITS; i++) {
            const pos = getUniquePosition();
            pits.push(pos);
            grid[pos.y][pos.x].hasPit = true;
        }

        // Place Chips
        for (let i = 0; i < NUM_CHIPS; i++) {
            const pos = getUniquePosition();
            chips.push({ ...pos, collected: false });
            grid[pos.y][pos.x].hasChip = true;
        }

        // Add sensory cues
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Nisbot cues (Whirring)
                if (isAdjacent({x, y}, nisbotPos)) {
                    grid[y][x].cues.add('whirring');
                }
                // Pit cues (Draft)
                pits.forEach(pit => {
                    if (isAdjacent({x, y}, pit)) {
                        grid[y][x].cues.add('draft');
                    }
                });
            }
        }

        render();
        updateMessages("Welcome! Find all 8 chips to repair Nisbot.", true);
    }
    let moveCooldown = false;

    function isAdjacent(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y) === 1;
    }

    function render() {
        board.innerHTML = '';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                const cellData = grid[y][x];

                if (cellData.visited) {
                    cell.classList.add('visited');
                    if (cellData.hasPit) cell.innerHTML = '⚫';
                    if (cellData.hasChip) cell.innerHTML = '⚙️';                    

                    // Show Nisbot if the game is over, or if the player is on its tile
                    const isPlayerOnThisTile = playerPos.x === x && playerPos.y === y;
                    if (cellData.hasNisbot && (gameOver || isPlayerOnThisTile)) {
                        cell.innerHTML = '🤖';
                    }

                    const cueContainer = document.createElement('div');
                    cueContainer.classList.add('sensory-cue');
                    if(cellData.cues.has('whirring')) cueContainer.innerHTML += '🔊';
                    if(cellData.cues.has('draft')) cueContainer.innerHTML += '🌬️';
                    cell.appendChild(cueContainer);
                }

                if (playerPos.x === x && playerPos.y === y) {
                    cell.classList.add('player-location');
                    cell.innerHTML += '🧑‍🔧';
                }

                board.appendChild(cell);
            }
        }
        scoreDisplay.textContent = `Score: ${score}`;
        chipsDisplay.textContent = `Chips: ${chipsCollected} / ${NUM_CHIPS}`;
    }

    function updateMessages(message, clearSensory = false) {
        messageDisplay.textContent = message;
        if (clearSensory) {
            sensoryDisplay.textContent = '';
        } else {
            const cues = grid[playerPos.y][playerPos.x].cues;
            let sensoryText = [];
            if (cues.has('whirring')) sensoryText.push("You hear a faint electronic whirring.");
            if (cues.has('draft')) sensoryText.push("You feel a cool draft.");
            if (grid[playerPos.y][playerPos.x].hasChip) sensoryText.push("You see something gleaming here!");
            sensoryDisplay.textContent = sensoryText.join(' ');
        }
    }

    function movePlayer(dx, dy) {
        if (gameOver || moveCooldown) return;

        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;

        // Move cooldown: prevent rapid moves
        moveCooldown = true;
        setTimeout(() => { moveCooldown = false; }, 150); // 150ms cooldown

        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
            updateMessages("You can't move off the edge!", false);
            return;
        }

        playerPos.x = newX;
        playerPos.y = newY;
        score -= 1;
        grid[newY][newX].visited = true;
        checkCurrentTile();
        render();

        // Stuck state detection: check if all adjacent tiles are pits or out of bounds
        if (!gameOver) {
            let stuck = true;
            const directions = [
                {dx: 0, dy: -1},
                {dx: 0, dy: 1},
                {dx: -1, dy: 0},
                {dx: 1, dy: 0}
            ];
            for (const dir of directions) {
                const tx = playerPos.x + dir.dx;
                const ty = playerPos.y + dir.dy;
                if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                    if (!grid[ty][tx].hasPit) {
                        stuck = false;
                        break;
                    }
                }
            }
            if (stuck) {
                endGame(false, "You are surrounded by pits and cannot move! Game Over.");
            }
        }
    }

    function checkCurrentTile() {
        const currentTile = grid[playerPos.y][playerPos.x];
        updateMessages("You moved.", false);

        if (currentTile.hasPit) {
            endGame(false, "You fell into a pit! Game Over.");
            return;
        }

        if (currentTile.hasNisbot) {
            if (chipsCollected < NUM_CHIPS) {
                endGame(false, "You approached Nisbot without all the parts... It was hostile!");
            } else {
                updateMessages("You've found Nisbot and have all the parts! Press 'E' to repair it.", true);
            }
        }
    }

    function performAction() {
        if (gameOver) return;

        const currentTile = grid[playerPos.y][playerPos.x];

        // Repair Nisbot
        if (currentTile.hasNisbot) {
            if (chipsCollected === NUM_CHIPS) {
                score += 100;
                endGame(true, "You successfully repaired Nisbot! You win!");
            } else {
                // This case is handled by moving onto the tile, but as a fallback:
                score -= 50;
                updateMessages("You need all 8 chips to repair Nisbot!");
            }
            render();
            return;
        }

        // Collect Chip
        if (currentTile.hasChip) {
            const chipIndex = chips.findIndex(c => c.x === playerPos.x && c.y === playerPos.y);
            if (chipIndex > -1 && !chips[chipIndex].collected) {
                chips[chipIndex].collected = true;
                currentTile.hasChip = false; // Remove from grid representation
                chipsCollected++;
                score += 50;
                updateMessages(`Chip collected! You now have ${chipsCollected}.`);
                render();
                // Notify when all chips collected
                if (chipsCollected === NUM_CHIPS) {
                    updateMessages("All chips collected! Find Nisbot to repair.");
                }
            }
            return;
        }

        // Invalid Action
        score -= 50;
        updateMessages("There is nothing to do here.");
        render();
    }

    function endGame(isWin, message) {
        gameOver = true;
        
        // Reveal the whole board
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                grid[y][x].visited = true;
            }
        }

        render(); // Final render to show everything

        if (isWin) {
            let finalMessage = `<h2>Repair Complete!</h2>`;
            finalMessage += `<p>${message}</p>`;
            finalMessage += `<p>Final Score: ${score}</p>`;
            winMessage.innerHTML = finalMessage;
            winScreen.classList.remove('hidden');
        } else {
            let finalMessage = `<h2>Mission Failed!</h2>`;
            finalMessage += `<p>${message}</p>`;
            finalMessage += `<p>Final Score: ${score}</p>`;
            gameOverMessage.innerHTML = finalMessage;
            gameOverScreen.classList.remove('hidden');
        }

        // Remove event listener to prevent further moves
        document.removeEventListener('keydown', handleKeyDown);
    }


    function handleKeyDown(e) {
        if (gameOver) return;

        switch (e.key) {
            case 'ArrowUp':
                movePlayer(0, -1);
                break;
            case 'ArrowDown':
                movePlayer(0, 1);
                break;
            case 'ArrowLeft':
                movePlayer(-1, 0);
                break;
            case 'ArrowRight':
                movePlayer(1, 0);
                break;
            case 'e':
            case 'E':
                performAction();
                break;
        }
    }

    function startGame() {
        // Hide any open screens
        startScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        initializeGame();
        // Remove any existing listener before adding a new one
        document.removeEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleKeyDown);
    }

    // Event Listeners for screen buttons
    startGameButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame); // For the lose screen
    playAgainButton.addEventListener('click', startGame); // For the win screen

    // Initial game start
    // The game now starts when the user clicks the button on the start screen.
});