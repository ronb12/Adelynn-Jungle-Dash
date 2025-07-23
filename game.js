const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('startBtn');

const laneCount = 3;
const laneWidth = canvas.width / laneCount;
const playerWidth = 40;
const playerHeight = 40;
const coinRadius = 15;
const obstacleWidth = 40;
const obstacleHeight = 40;

let playerLane = 1; // 0 = left, 1 = center, 2 = right
let playerY = canvas.height - playerHeight - 10;
let coins = [];
let obstacles = [];
let score = 0;
let gameRunning = false;
let gameInterval;

function resetGame() {
    playerLane = 1;
    coins = [];
    obstacles = [];
    score = 0;
    gameRunning = true;
    scoreDisplay.textContent = 'Score: 0';
    startBtn.textContent = 'Restart Game';
}

function drawPlayer() {
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(playerLane * laneWidth + (laneWidth - playerWidth) / 2, playerY, playerWidth, playerHeight);
}

function drawCoins() {
    ctx.fillStyle = 'gold';
    coins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coinRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawObstacles() {
    ctx.fillStyle = '#f44336';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obstacleWidth, obstacleHeight);
    });
}

function spawnCoin() {
    const lane = Math.floor(Math.random() * laneCount);
    coins.push({
        x: lane * laneWidth + laneWidth / 2,
        y: -coinRadius
    });
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneCount);
    obstacles.push({
        x: lane * laneWidth + (laneWidth - obstacleWidth) / 2,
        y: -obstacleHeight
    });
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Move coins
    coins.forEach(coin => coin.y += 5);
    // Move obstacles
    obstacles.forEach(obs => obs.y += 7);
    // Remove off-screen coins/obstacles
    coins = coins.filter(coin => coin.y < canvas.height + coinRadius);
    obstacles = obstacles.filter(obs => obs.y < canvas.height + obstacleHeight);
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
}

function gameLoop() {
    if (gameRunning) {
        updateGame();
    }
}

startBtn.addEventListener('click', () => {
    resetGame();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
});

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' && playerLane > 0) {
        playerLane--;
    } else if (e.key === 'ArrowRight' && playerLane < laneCount - 1) {
        playerLane++;
    }
});

// Initial draw
ctx.fillStyle = '#fff';
ctx.font = '1.2em Arial';
ctx.textAlign = 'center';
ctx.fillText('Press Start to Play!', canvas.width / 2, canvas.height / 2); 