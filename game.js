const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const scoreboard = document.getElementById('scoreboard');

// Super Mario-style control: player moves freely, world follows
const playerWidth = 60;
const playerHeight = 100;
const groundY = canvas.height - 20;
let playerX = 100; // Start player at fixed position on screen
let playerY = groundY - playerHeight;
let worldOffset = 0; // How much the world has moved
let coins = [];
let score = 0;
let gameRunning = false;
let gameInterval;
let gameStarted = false;

// Player movement variables
let playerVelocityX = 0;
let playerVelocityY = 0;
const playerSpeed = 5;
const gravity = 0.8;
const jumpPower = -15;

// Sprite sheet for girl character (running)
const girlRunSprite = new Image();
girlRunSprite.src = 'sprites/girl_run.png';
const runFrameWidth = 180;
const runFrameHeight = 480;
const runFrameCount = 8;
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

// Input state
let keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
});

// Jungle background gradient
function drawBackground() {
    // Blue sky
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Green ground (fixed height at bottom)
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    // Optional: clouds
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(80, 80, 30, Math.PI * 2, false);
    ctx.arc(110, 80, 40, Math.PI * 2, false);
    ctx.arc(150, 80, 30, Math.PI * 2, false);
    ctx.fill();
}

function drawInitialScreen() {
    drawBackground();
    drawPlayer();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 1.5em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#222';
    ctx.shadowBlur = 8;
    ctx.fillText('Use arrow keys or WASD to move!', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
}

function drawPlayer() {
    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(playerX + playerWidth / 2, groundY - 5, playerWidth / 2.5, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.restore();
    
    // Animate running
    if (gameRunning && Math.abs(playerVelocityX) > 0 && !isJumping) {
        runFrameTick++;
        if (runFrameTick % 6 === 0) {
            runFrameIndex = (runFrameIndex + 1) % runFrameCount;
        }
    } else if (!gameRunning) {
        runFrameIndex = 0;
    }
    
    ctx.drawImage(
        girlRunSprite,
        runFrameIndex * runFrameWidth, 0, runFrameWidth, runFrameHeight,
        playerX,
        playerY + playerVelocityY,
        playerWidth, playerHeight
    );
}

const marioCoin = new Image();
marioCoin.src = 'sprites/mario_coin.gif';

function drawCoins() {
    coins.forEach(coin => {
        if (marioCoin.complete && marioCoin.naturalWidth > 0) {
            ctx.drawImage(marioCoin, coin.x - worldOffset - 8, coin.y - 7, 16, 14);
        }
    });
}

function spawnCoin() {
    const coinX = Math.random() * 2000 + worldOffset + canvas.width; // Spawn ahead of player
    coins.push({
        x: coinX,
        y: canvas.height - 30
    });
}

function updatePlayer() {
    // Handle horizontal movement
    if (keys.left) {
        playerVelocityX = -playerSpeed;
    } else if (keys.right) {
        playerVelocityX = playerSpeed;
    } else {
        playerVelocityX *= 0.8; // Friction
    }
    
    // Apply velocity
    playerX += playerVelocityX;
    
    // Keep player on screen
    if (playerX < 50) {
        playerX = 50;
        playerVelocityX = 0;
    } else if (playerX > canvas.width - playerWidth - 50) {
        // Move world instead of player
        worldOffset += playerVelocityX;
        playerX = canvas.width - playerWidth - 50;
    }
    
    // Handle jumping
    if (keys.up && !isJumping && playerVelocityY === 0) {
        playerVelocityY = jumpPower;
        isJumping = true;
    }
    
    // Apply gravity
    playerVelocityY += gravity;
    playerY += playerVelocityY;
    
    // Ground collision
    if (playerY >= groundY - playerHeight) {
        playerY = groundY - playerHeight;
        playerVelocityY = 0;
        isJumping = false;
    }
}

function updateGame() {
    drawBackground();
    if (!gameStarted) {
        drawInitialScreen();
        return;
    }
    
    updatePlayer();
    
    // Check for coin collisions
    checkCoinCollision();
    
    // Draw everything
    drawPlayer();
    drawCoins();
    
    // Spawn coins occasionally
    if (Math.random() < 0.02) spawnCoin();
}

function checkCoinCollision() {
    coins = coins.filter(coin => {
        const coinScreenX = coin.x - worldOffset;
        const playerCenterX = playerX + playerWidth / 2;
        const playerCenterY = playerY + playerHeight / 2 + playerVelocityY;
        const distX = Math.abs(coinScreenX - playerCenterX);
        const distY = Math.abs(coin.y - playerCenterY);
        if (distX < playerWidth / 2 && distY < playerHeight / 2) {
            score++;
            scoreboard.textContent = 'Score: ' + score;
            return false;
        }
        return true;
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
    startBtn.disabled = false;
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
        if (dx > 30) keys.right = true;
        else if (dx < -30) keys.left = true;
    } else {
        // Vertical swipe
        if (dy < -30) keys.up = true;
        else if (dy > 30) keys.down = true;
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
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = false;
            break;
    }
});

function resetGame() {
    playerX = 100;
    playerY = groundY - playerHeight;
    worldOffset = 0;
    playerVelocityX = 0;
    playerVelocityY = 0;
    coins = [];
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
    keys = { left: false, right: false, up: false, down: false };
    if (gameInterval) clearInterval(gameInterval);
    drawInitialScreen();
}

// Initial draw
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#fff';
ctx.font = '1.2em Arial';
ctx.textAlign = 'center';
ctx.fillText('Press Start to Play!', canvas.width / 2, canvas.height / 2); 