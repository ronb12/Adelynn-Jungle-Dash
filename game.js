// Simple Vertical Endless Runner Coin Collector Game

// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let score = 0;
let coins = 0;
let gameSpeed = 3;
let player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 30,
    height: 30,
    speed: 5
};

let coinObjects = [];
let obstacles = [];
let particles = [];

// Game screens
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

// Initialize game
function initGame() {
    gameRunning = false;
    score = 0;
    coins = 0;
    gameSpeed = 3;
    coinObjects = [];
    obstacles = [];
    particles = [];
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    updateUI();
    showStartScreen();
}

// Start game
function startGame() {
    gameRunning = true;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameLoop();
}

// Game over
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    gameOverScreen.style.display = 'block';
}

// Restart game
function restartGame() {
    initGame();
}

// Show start screen
function showStartScreen() {
    startScreen.style.display = 'block';
    gameOverScreen.style.display = 'none';
}

// Update UI
function updateUI() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('coinsValue').textContent = coins;
}

// Handle input
let keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    if (x < canvas.width / 2) {
        keys['ArrowLeft'] = true;
    } else {
        keys['ArrowRight'] = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
});

// Update player
function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// Spawn coins
function spawnCoins() {
    if (Math.random() < 0.02) {
        coinObjects.push({
            x: Math.random() * (canvas.width - 20),
            y: -20,
            width: 20,
            height: 20,
            collected: false
        });
    }
}

// Spawn obstacles
function spawnObstacles() {
    if (Math.random() < 0.01) {
        obstacles.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30
        });
    }
}

// Update objects
function updateObjects() {
    // Update coins
    coinObjects.forEach((coin, index) => {
        coin.y += gameSpeed;
        if (coin.y > canvas.height) {
            coinObjects.splice(index, 1);
        }
    });
    
    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.y += gameSpeed;
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1);
        }
    });
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.y += particle.vy;
        particle.x += particle.vx;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Check collisions
function checkCollisions() {
    // Coin collisions
    coinObjects.forEach((coin, index) => {
        if (!coin.collected && 
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            coins++;
            score += 10;
            createCoinParticles(coin.x, coin.y);
            coinObjects.splice(index, 1);
            updateUI();
        }
    });
    
    // Obstacle collisions
    obstacles.forEach((obstacle) => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            
            gameOver();
        }
    });
}

// Create coin particles
function createCoinParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x + 10,
            y: y + 10,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3,
            life: 30,
            color: '#FFD700'
        });
    }
}

// Draw functions
function drawPlayer() {
    ctx.fillStyle = '#FF6B9D';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player outline
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Simple face
    ctx.fillStyle = '#FFE4E1';
    ctx.fillRect(player.x + 5, player.y + 5, 20, 20);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 8, player.y + 8, 4, 4);
    ctx.fillRect(player.x + 18, player.y + 8, 4, 4);
}

function drawCoins() {
    coinObjects.forEach(coin => {
        if (!coin.collected) {
            // Coin glow
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            
            // Coin body
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin border
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Dollar sign
            ctx.fillStyle = '#8B4513';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', coin.x + coin.width/2, coin.y + coin.height/2);
            
            // Reset shadow
            ctx.shadowBlur = 0;
        }
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Obstacle outline
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.fillRect(particle.x, particle.y, 4, 4);
    });
    ctx.globalAlpha = 1;
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Simple clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
        const x = (i * 150 + score * 0.1) % (canvas.width + 100);
        const y = 50 + Math.sin(i) * 20;
        
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 15, y, 15, 0, Math.PI * 2);
        ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update
    updatePlayer();
    spawnCoins();
    spawnObstacles();
    updateObjects();
    checkCollisions();
    
    // Increase score and speed
    score++;
    if (score % 100 === 0) {
        gameSpeed += 0.5;
    }
    
    // Draw
    drawBackground();
    drawCoins();
    drawObstacles();
    drawPlayer();
    drawParticles();
    
    // Update UI
    updateUI();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Initialize game when page loads
window.addEventListener('load', initGame); 