const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const highScoreElement = document.getElementById('highScore');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Check if all required elements are present
if (!canvas || !ctx || !startBtn || !restartBtn || !scoreElement || !multiplierElement || !speedSlider || !speedValue || !highScoreElement) {
    alert('Error: Some game elements are missing. Please refresh the page.');
    throw new Error('Missing game elements');
}

// Load high score from localStorage
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
highScoreElement.textContent = highScore;

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let poisonFood = null;
let bonusFood = null;
let speedFood = null;
let poisonTimer = null;
let bonusTimer = null;
let speedTimer = null;
let speedBoostTimer = null;
let direction = 'right';
let score = 0;
let multiplier = 1;
let lastFoodTime = 0;
let gameLoop = null;
let gameSpeed = 100;
let baseSpeed = 100;
let gameStarted = false;
let obstacles = [];

// Create obstacles
function createObstacles() {
    obstacles = [];
    // Create some random obstacles
    for (let i = 0; i < 5; i++) {
        obstacles.push({
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        });
    }
}

// Update speed display and game speed
speedSlider.addEventListener('input', () => {
    baseSpeed = 250 - speedSlider.value;
    if (!speedBoostTimer) {
        gameSpeed = baseSpeed;
    }
    speedValue.textContent = speedSlider.value;
    if (gameStarted) {
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, gameSpeed);
    }
});

// Update high score
function updateHighScore() {
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('snakeHighScore', highScore.toString());
        highScoreElement.textContent = highScore;
        
        // Add celebration effect when high score is beaten
        highScoreElement.style.color = '#FFD700';
        setTimeout(() => {
            highScoreElement.style.color = '#FF5252';
        }, 1000);
    }
}

// Initialize the game
function initGame() {
    try {
        // Clear any existing timers
        if (gameLoop) clearInterval(gameLoop);
        if (poisonTimer) clearTimeout(poisonTimer);
        if (bonusTimer) clearTimeout(bonusTimer);
        if (speedTimer) clearTimeout(speedTimer);
        if (speedBoostTimer) clearTimeout(speedBoostTimer);

        // Reset game state
        snake = [
            { x: 5, y: 5 }
        ];
        direction = 'right';
        score = 0;
        multiplier = 1;
        lastFoodTime = 0;
        gameStarted = false;
        
        // Update UI
        scoreElement.textContent = score;
        multiplierElement.textContent = multiplier + 'x';
        startBtn.textContent = 'Start Game';
        highScoreElement.style.color = '#FF5252';
        
        // Set initial speed
        baseSpeed = 250 - speedSlider.value;
        gameSpeed = baseSpeed;
        
        // Generate game elements
        createObstacles();
        generateFood();
        
        // Generate special foods with delays to prevent them from appearing all at once
        setTimeout(generatePoisonFood, 1000);
        setTimeout(generateBonusFood, 2000);
        setTimeout(generateSpeedFood, 3000);
        
        // Draw initial state
        draw();
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error starting the game. Please refresh the page.');
    }
}

// Generate food at random position
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (isPositionOccupied(newFood.x, newFood.y));
    
    food = newFood;
}

// Generate poison food
function generatePoisonFood() {
    if (poisonTimer) {
        clearTimeout(poisonTimer);
    }
    
    let newPoisonFood;
    do {
        newPoisonFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (isPositionOccupied(newPoisonFood.x, newPoisonFood.y));
    
    poisonFood = newPoisonFood;
    
    // Remove poison food after 5 seconds
    poisonTimer = setTimeout(() => {
        poisonFood = null;
        // Generate new poison food after current one disappears
        setTimeout(generatePoisonFood, 2000);
    }, 5000);
}

// Generate bonus food
function generateBonusFood() {
    if (bonusTimer) {
        clearTimeout(bonusTimer);
    }
    
    let newBonusFood;
    do {
        newBonusFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (isPositionOccupied(newBonusFood.x, newBonusFood.y));
    
    bonusFood = newBonusFood;
    
    // Remove bonus food after 3 seconds
    bonusTimer = setTimeout(() => {
        bonusFood = null;
        // Generate new bonus food after current one disappears
        setTimeout(generateBonusFood, 2000);
    }, 3000);
}

// Generate speed food
function generateSpeedFood() {
    if (speedTimer) {
        clearTimeout(speedTimer);
    }
    
    let newSpeedFood;
    do {
        newSpeedFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (isPositionOccupied(newSpeedFood.x, newSpeedFood.y));
    
    speedFood = newSpeedFood;
    
    // Remove speed food after 4 seconds
    speedTimer = setTimeout(() => {
        speedFood = null;
        // Generate new speed food after current one disappears
        setTimeout(generateSpeedFood, 2000);
    }, 4000);
}

// Check if position is occupied
function isPositionOccupied(x, y) {
    // Check snake
    for (let segment of snake) {
        if (segment.x === x && segment.y === y) return true;
    }
    // Check other food
    if (food.x === x && food.y === y) return true;
    if (poisonFood && poisonFood.x === x && poisonFood.y === y) return true;
    if (bonusFood && bonusFood.x === x && bonusFood.y === y) return true;
    if (speedFood && speedFood.x === x && speedFood.y === y) return true;
    // Check obstacles
    for (let obstacle of obstacles) {
        if (obstacle.x === x && obstacle.y === y) return true;
    }
    return false;
}

// Draw the game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw obstacles
    ctx.fillStyle = '#444';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 2, gridSize - 2);
        ctx.strokeRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Draw head
            ctx.fillStyle = '#00C853'; // Brighter green for head
            ctx.strokeStyle = '#00E676'; // Even brighter green for border
            ctx.lineWidth = 2;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
            // Draw eyes
            ctx.fillStyle = 'white';
            const eyeSize = 4;
            const eyeOffset = 4;
            ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
        } else {
            // Draw body
            ctx.fillStyle = '#00E676'; // Brighter green for body
            ctx.strokeStyle = '#00C853'; // Slightly darker green for border
            ctx.lineWidth = 2;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        }
    });

    // Draw regular food
    ctx.fillStyle = '#FF5252';
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Draw poison food
    if (poisonFood) {
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            poisonFood.x * gridSize + gridSize/2,
            poisonFood.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }

    // Draw bonus food
    if (bonusFood) {
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFC400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            bonusFood.x * gridSize + gridSize/2,
            bonusFood.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }

    // Draw speed food
    if (speedFood) {
        ctx.fillStyle = '#2196F3';
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            speedFood.x * gridSize + gridSize/2,
            speedFood.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }
}

// Update game state
function update() {
    const head = { ...snake[0] };

    // Move head based on direction
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check for collisions with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        updateHighScore();
        gameOver();
        return;
    }

    // Check for collisions with obstacles
    for (let obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            updateHighScore();
            gameOver();
            return;
        }
    }

    // Check for collisions with self
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            updateHighScore();
            gameOver();
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Update multiplier based on time between food collection
    const currentTime = Date.now();
    if (lastFoodTime > 0) {
        const timeDiff = currentTime - lastFoodTime;
        if (timeDiff < 2000) { // 2 seconds
            multiplier = Math.min(multiplier + 0.5, 5);
        } else {
            multiplier = Math.max(multiplier - 0.5, 1);
        }
        multiplierElement.textContent = multiplier.toFixed(1) + 'x';
    }

    // Check if snake ate regular food
    if (head.x === food.x && head.y === food.y) {
        score += 10 * multiplier;
        scoreElement.textContent = Math.floor(score);
        updateHighScore();
        lastFoodTime = currentTime;
        generateFood();
        generatePoisonFood();
        generateBonusFood();
        generateSpeedFood();
    } 
    // Check if snake ate poison food
    else if (poisonFood && head.x === poisonFood.x && head.y === poisonFood.y) {
        updateHighScore();
        gameOver();
        return;
    }
    // Check if snake ate bonus food
    else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
        score += 30 * multiplier;
        scoreElement.textContent = Math.floor(score);
        updateHighScore();
        lastFoodTime = currentTime;
        bonusFood = null;
        clearTimeout(bonusTimer);
    }
    // Check if snake ate speed food
    else if (speedFood && head.x === speedFood.x && head.y === speedFood.y) {
        if (speedBoostTimer) {
            clearTimeout(speedBoostTimer);
        }
        gameSpeed = baseSpeed / 2; // Double speed
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, gameSpeed);
        speedBoostTimer = setTimeout(() => {
            gameSpeed = baseSpeed;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }, 5000);
        speedFood = null;
        clearTimeout(speedTimer);
    }
    else {
        // Remove tail if no food was eaten
        snake.pop();
    }
}

// Game step
function gameStep() {
    update();
    draw();
}

// Game over
function gameOver() {
    clearInterval(gameLoop);
    if (poisonTimer) clearTimeout(poisonTimer);
    if (bonusTimer) clearTimeout(bonusTimer);
    if (speedTimer) clearTimeout(speedTimer);
    if (speedBoostTimer) clearTimeout(speedBoostTimer);
    gameStarted = false;
    startBtn.textContent = 'Start Game';
    
    // Show game over message with current and high score
    alert(`Game Over!\nYour score: ${Math.floor(score)}\nHigh score: ${highScore}`);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (!gameStarted) return;
    
    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
});

// Start game button
startBtn.addEventListener('click', () => {
    try {
        if (!gameStarted) {
            if (snake.length === 0) {
                initGame();
            }
            gameStarted = true;
            startBtn.textContent = 'Pause';
            gameLoop = setInterval(gameStep, gameSpeed);
        } else {
            clearInterval(gameLoop);
            gameStarted = false;
            startBtn.textContent = 'Resume';
        }
    } catch (error) {
        console.error('Error in start button:', error);
        alert('Error starting the game. Please refresh the page.');
    }
});

// Restart button
restartBtn.addEventListener('click', () => {
    try {
        initGame();
        gameStarted = true;
        startBtn.textContent = 'Pause';
        gameLoop = setInterval(gameStep, gameSpeed);
    } catch (error) {
        console.error('Error in restart button:', error);
        alert('Error restarting the game. Please refresh the page.');
    }
});

// Initialize the game when the page loads
window.addEventListener('load', () => {
    try {
        initGame();
    } catch (error) {
        console.error('Error on page load:', error);
        alert('Error loading the game. Please refresh the page.');
    }
}); 