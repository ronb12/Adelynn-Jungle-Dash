const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const scoreboard = document.getElementById('scoreboard');

// Side-scrolling runner: character runs left-to-right, coins move right-to-left
const playerWidth = 60;
const playerHeight = 100;
const groundY = canvas.height - playerHeight - 20;
let playerX = 40; // Start near the left
let playerY = groundY;
let coins = [];
let score = 0;
let gameRunning = false;
let gameInterval;
let gameStarted = false;

// Sprite sheet for girl character (running)
const girlRunSprite = new Image();
girlRunSprite.src = 'sprites/girl_run.png';
const runFrameWidth = 180; // Based on asset pixel dimensions
const runFrameHeight = 480;
const runFrameCount = 8; // This asset has 8 frames per row
let runFrameIndex = 0;
let runFrameTick = 0;

// Add jump and dash logic
let isJumping = false;
let jumpY = 0;
let jumpTick = 0;
let isDashing = false;
let dashTick = 0;

// Touch/swipe variables
let touchStartX = null;
let touchStartY = null;

canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
});

// Jungle background gradient
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#4caf50'); // jungle green
    grad.addColorStop(0.5, '#aee571'); // lighter green
    grad.addColorStop(1, '#fffde4'); // light yellow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawInitialScreen() {
    drawBackground();
    drawPlayer();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 1.5em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#222';
    ctx.shadowBlur = 8;
    ctx.fillText('Swipe up or press ↑ to start!', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
}

function drawPlayer() {
    // Always draw the character on the ground, facing right
    ctx.drawImage(
        girlRunSprite,
        0, 0, runFrameWidth, runFrameHeight,
        playerX,
        playerY - jumpY,
        playerWidth, playerHeight
    );
}

const marioCoin = new Image();
marioCoin.src = 'sprites/mario_coin.gif';

function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(marioCoin, coin.x - 8, coin.y - 7, 16, 14); // Center the 16x14 coin
    });
}

function spawnCoin() {
    coins.push({
        x: canvas.width + 20, // spawn off right edge
        y: groundY + playerHeight / 2 // on the ground
    });
}

function updateGame() {
    drawBackground();
    if (!gameStarted) {
        drawInitialScreen();
        return;
    }
    // Move coins left
    coins.forEach(coin => coin.x -= 12); // Temple Run-like speed
    // Remove off-screen coins
    coins = coins.filter(coin => coin.x > -30);
    // Animate jump
    if (isJumping) {
        jumpTick++;
        jumpY = Math.sin((jumpTick / 20) * Math.PI) * 80;
        if (jumpTick > 20) {
            isJumping = false;
            jumpTick = 0;
            jumpY = 0;
        }
    }
    // Check for coin collisions
    checkCoinCollision();
    // Draw everything
    drawPlayer();
    drawCoins();
    // Randomly spawn coins
    if (Math.random() < 0.06) spawnCoin();
}

function checkCoinCollision() {
    coins = coins.filter(coin => {
        const playerCenterX = playerX + playerWidth / 2;
        const playerCenterY = playerY + playerHeight / 2 - jumpY;
        const distX = Math.abs(coin.x - playerCenterX);
        const distY = Math.abs(coin.y - playerCenterY);
        if (distX < playerWidth / 2 && distY < playerHeight / 2) {
            score++;
            scoreboard.textContent = 'Score: ' + score;
            return false;
        }
        return true;
    });
}

function checkObstacleCollision() {
    return obstacles.some(obs => {
        const playerX = playerLane * laneWidth + (laneWidth - playerWidth) / 2;
        return (
            obs.x < playerX + playerWidth &&
            obs.x + obstacleWidth > playerX &&
            obs.y < playerY + playerHeight &&
            obs.y + obstacleHeight > playerY
        );
    });
}

function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '2em Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '1.5em Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    startBtn.disabled = false; // Enable start button after game over
}

function gameLoop() {
    if (gameRunning) {
        updateGame();
    }
}

function startGameLoop() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
    console.log('Game loop started');
}

startBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    resetGame();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
});

canvas.addEventListener('touchend', function(e) {
    if (touchStartX === null || touchStartY === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (!gameStarted && dy < -30) {
        console.log('Game started by swipe up');
        gameStarted = true;
        gameRunning = true;
        startGameLoop();
        return;
    }
    if (!gameRunning) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 30 && playerLane < laneCount - 1) playerLane++;
        else if (dx < -30 && playerLane > 0) playerLane--;
    } else {
        // Vertical swipe
        if (dy < -30 && !isJumping) { isJumping = true; jumpTick = 0; }
        else if (dy > 30 && !isDashing) { isDashing = true; dashTick = 0; }
    }
    touchStartX = null;
    touchStartY = null;
});

document.addEventListener('keydown', (e) => {
    if (!gameStarted && (e.key === 'ArrowUp' || e.key === 'w')) {
        console.log('Game started by key up');
        gameStarted = true;
        gameRunning = true;
        startGameLoop();
        return;
    }
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' && playerLane > 0) {
        playerLane--;
    } else if (e.key === 'ArrowRight' && playerLane < laneCount - 1) {
        playerLane++;
    } else if ((e.key === 'ArrowUp' || e.key === 'w') && !isJumping) {
        isJumping = true;
        jumpTick = 0;
    } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === ' ') && !isDashing) {
        isDashing = true;
        dashTick = 0;
    }
});

// On reset, stop the game loop
function resetGame() {
    playerLane = 1;
    coins = [];
    obstacles = [];
    score = 0;
    gameRunning = false;
    gameStarted = false;
    scoreboard.textContent = 'Score: 0';
    startBtn.textContent = 'Restart Game';
    startBtn.disabled = true;
    runFrameIndex = 0;
    runFrameTick = 0;
    isJumping = false;
    jumpY = 0;
    jumpTick = 0;
    isDashing = false;
    dashTick = 0;
    if (gameInterval) clearInterval(gameInterval);
    drawInitialScreen();
}

// Initial draw
ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before drawing
ctx.fillStyle = '#fff';
ctx.font = '1.2em Arial';
ctx.textAlign = 'center';
ctx.fillText('Press Start to Play!', canvas.width / 2, canvas.height / 2); 