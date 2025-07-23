const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('startBtn');

// Temple Run-style: lanes are vertical, character always faces forward
const laneCount = 3;
const laneWidth = canvas.width / laneCount;
const playerWidth = 60;
const playerHeight = 100;
const coinRadius = 15;
const obstacleWidth = 40;
const obstacleHeight = 40;

let playerLane = 1; // 0 = left, 1 = center, 2 = right
let playerY = canvas.height - playerHeight - 20;
let coins = [];
let obstacles = [];
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
    // Standing frame if not started, running animation if started
    if (!gameStarted) {
        // Draw standing frame (first frame of sprite sheet)
        ctx.drawImage(
            girlRunSprite,
            0, 0, runFrameWidth, runFrameHeight,
            playerLane * laneWidth + (laneWidth - playerWidth) / 2,
            playerY,
            playerWidth, playerHeight
        );
        return;
    }
    // Animate running
    if (gameRunning) {
        runFrameTick++;
        if (runFrameTick % 6 === 0) {
            runFrameIndex = (runFrameIndex + 1) % runFrameCount;
        }
    } else {
        runFrameIndex = 0;
    }
    ctx.drawImage(
        girlRunSprite,
        runFrameIndex * runFrameWidth, 0, runFrameWidth, runFrameHeight,
        playerLane * laneWidth + (laneWidth - playerWidth) / 2,
        playerY - jumpY,
        playerWidth, playerHeight
    );
}

function drawCoins() {
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    coins.forEach(coin => {
        ctx.fillText('🪙', coin.x, coin.y);
    });
}

function drawObstacles() {
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    obstacles.forEach(obs => {
        ctx.fillText('🪨', obs.x + 20, obs.y + 20);
    });
}

function spawnCoin() {
    const lane = Math.floor(Math.random() * laneCount);
    coins.push({
        x: lane * laneWidth + laneWidth / 2,
        y: -20
    });
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneCount);
    obstacles.push({
        x: lane * laneWidth + laneWidth / 2 - 20,
        y: -40
    });
}

function updateGame() {
    drawBackground();
    if (!gameStarted) {
        drawInitialScreen();
        return;
    }
    // Animate player
    if (isJumping) {
        jumpTick++;
        jumpY = Math.sin((jumpTick / 20) * Math.PI) * 80;
        if (jumpTick > 20) {
            isJumping = false;
            jumpTick = 0;
            jumpY = 0;
        }
    } else if (isDashing) {
        dashTick++;
        if (dashTick > 10) {
            isDashing = false;
            dashTick = 0;
        }
    }
    // Move coins and obstacles down the screen
    coins.forEach(coin => coin.y += 7);
    obstacles.forEach(obs => obs.y += 9);
    // Remove off-screen coins/obstacles
    coins = coins.filter(coin => coin.y < canvas.height + 30);
    obstacles = obstacles.filter(obs => obs.y < canvas.height + 40);
    // Draw everything
    drawPlayer();
    drawCoins();
    drawObstacles();
    // Check collisions
    checkCoinCollision();
    if (checkObstacleCollision()) {
        endGame();
        return;
    }
    // Randomly spawn coins/obstacles
    if (Math.random() < 0.04) spawnCoin();
    if (Math.random() < 0.03) spawnObstacle();
}

function checkCoinCollision() {
    coins = coins.filter(coin => {
        const playerX = playerLane * laneWidth + (laneWidth - playerWidth) / 2;
        const distX = Math.abs(coin.x - (playerX + playerWidth / 2));
        const distY = Math.abs(coin.y - (playerY + playerHeight / 2));
        if (distX < playerWidth / 2 + coinRadius && distY < playerHeight / 2 + coinRadius) {
            score++;
            scoreDisplay.textContent = 'Score: ' + score;
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
    scoreDisplay.textContent = 'Score: 0';
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