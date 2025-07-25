// Game variables
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let score = 0;
let coins = 0;
let lives = 3;
let gameSpeed = 5;
let gravity = 0.8;
let groundY = 550;

// Player object
let player = {
    x: 100,
    y: groundY,
    width: 50,
    height: 50,
    velocityY: 0,
    isJumping: false,
    onGround: true
};

// Game objects arrays
let obstacles = [];
let coinObjects = [];
let powerUps = [];

// Input handling
let keys = {};
let touchControls = {
    left: false,
    right: false,
    jump: false
};

// Asset loading
let sprites = {};
let audio = {};

// Initialize game
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size for mobile
    if (window.innerWidth < 800) {
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight * 0.6;
        groundY = canvas.height - 50;
        player.y = groundY;
    }
    
    loadAssets();
    setupEventListeners();
    startGame();
}

// Load game assets
function loadAssets() {
    // Load sprites
    const spriteFiles = [
        'player_run.png',
        'coin.png',
        'obstacle.png',
        'obstacle2.png',
        'obstacle3.png',
        'jungle_bg.png',
        'magnet.png',
        'shield.png'
    ];
    
    let loadedSprites = 0;
    spriteFiles.forEach(filename => {
        const img = new Image();
        img.onload = () => {
            loadedSprites++;
            if (loadedSprites === spriteFiles.length) {
                console.log('All sprites loaded!');
            }
        };
        img.src = `sprites/${filename}`;
        sprites[filename.replace('.png', '')] = img;
    });
    
    // Load audio
    const audioFiles = [
        { name: 'coin', file: 'coin.ogg' },
        { name: 'jump', file: 'jump.ogg' }
    ];
    
    audioFiles.forEach(audioFile => {
        const sound = new Audio(`audio/${audioFile.file}`);
        audio[audioFile.name] = sound;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameRunning && !gamePaused) {
                jump();
            }
        }
        
        if (e.code === 'Escape') {
            togglePause();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Mobile controls
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    
    if (leftBtn) {
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls.left = true;
        });
        leftBtn.addEventListener('touchend', () => {
            touchControls.left = false;
        });
    }
    
    if (rightBtn) {
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls.right = true;
        });
        rightBtn.addEventListener('touchend', () => {
            touchControls.right = false;
        });
    }
    
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning && !gamePaused) {
                jump();
            }
        });
    }
    
    // Mouse/touch controls for jumping
    canvas.addEventListener('click', () => {
        if (gameRunning && !gamePaused) {
            jump();
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (gameRunning && !gamePaused) {
            jump();
        }
    });
}

// Start the game
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    coins = 0;
    lives = 3;
    gameSpeed = 5;
    
    // Reset player
    player.x = 100;
    player.y = groundY;
    player.velocityY = 0;
    player.isJumping = false;
    player.onGround = true;
    
    // Clear arrays
    obstacles = [];
    coinObjects = [];
    powerUps = [];
    
    // Hide UI screens
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    
    // Start game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    update();
    render();
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Handle player movement
    handlePlayerMovement();
    
    // Update player physics
    updatePlayerPhysics();
    
    // Spawn objects
    spawnObjects();
    
    // Update objects
    updateObjects();
    
    // Check collisions
    checkCollisions();
    
    // Update UI
    updateUI();
}

// Handle player movement
function handlePlayerMovement() {
    const moveSpeed = 5;
    
    if ((keys['ArrowLeft'] || keys['KeyA'] || touchControls.left) && player.x > 0) {
        player.x -= moveSpeed;
    }
    
    if ((keys['ArrowRight'] || keys['KeyD'] || touchControls.right) && player.x < canvas.width - player.width) {
        player.x += moveSpeed;
    }
}

// Update player physics
function updatePlayerPhysics() {
    // Apply gravity
    if (!player.onGround) {
        player.velocityY += gravity;
        player.y += player.velocityY;
    }
    
    // Check ground collision
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
    }
}

// Jump function
function jump() {
    if (player.onGround && !player.isJumping) {
        player.velocityY = -15;
        player.onGround = false;
        player.isJumping = true;
        
        // Play jump sound
        if (audio.jump) {
            audio.jump.currentTime = 0;
            audio.jump.play().catch(e => console.log('Audio play failed:', e));
        }
    }
}

// Spawn objects
function spawnObjects() {
    // Spawn coins
    if (Math.random() < 0.02) {
        coinObjects.push({
            x: canvas.width,
            y: Math.random() * (groundY - 100) + 50,
            width: 30,
            height: 30,
            collected: false
        });
    }
    
    // Spawn obstacles
    if (Math.random() < 0.01) {
        const obstacleTypes = ['obstacle', 'obstacle2', 'obstacle3'];
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        obstacles.push({
            x: canvas.width,
            y: groundY - 60,
            width: 40,
            height: 60,
            type: randomType
        });
    }
}

// Update objects
function updateObjects() {
    // Update coins
    coinObjects.forEach(coin => {
        coin.x -= gameSpeed;
    });
    
    // Remove off-screen coins
    coinObjects = coinObjects.filter(coin => coin.x > -coin.width);
    
    // Update obstacles
    obstacles.forEach(obstacle => {
        obstacle.x -= gameSpeed;
    });
    
    // Remove off-screen obstacles
    obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);
}

// Check collisions
function checkCollisions() {
    // Check coin collisions
    coinObjects.forEach(coin => {
        if (!coin.collected && 
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            coins++;
            score += 10;
            
            // Play coin sound
            if (audio.coin) {
                audio.coin.currentTime = 0;
                audio.coin.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    });
    
    // Check obstacle collisions
    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            
            lives--;
            if (lives <= 0) {
                gameOver();
            } else {
                // Remove the obstacle that was hit
                obstacles = obstacles.filter(o => o !== obstacle);
            }
        }
    });
}

// Update UI
function updateUI() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('coinsValue').textContent = coins;
    document.getElementById('livesValue').textContent = lives;
}

// Render game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Draw player
    drawPlayer();
    
    // Draw coins
    drawCoins();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw ground
    drawGround();
}

// Draw background
function drawBackground() {
    // Simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 3; i++) {
        const x = (Date.now() * 0.001 + i * 200) % (canvas.width + 100) - 50;
        const y = 50 + i * 30;
        drawCloud(x, y);
    }
}

// Draw cloud
function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 15, 15, 0, Math.PI * 2);
    ctx.fill();
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player details
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x + 10, player.y + 10, 8, 8); // Eye
    ctx.fillRect(player.x + 32, player.y + 10, 8, 8); // Eye
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(player.x + 15, player.y + 25, 20, 10); // Mouth
}

// Draw coins
function drawCoins() {
    coinObjects.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin shine
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2 - 3, coin.y + coin.height/2 - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Dollar sign
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('$', coin.x + coin.width/2, coin.y + coin.height/2 + 4);
        }
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw log details
        ctx.fillStyle = '#654321';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
        ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 15, obstacle.width - 10, 10);
    });
}

// Draw ground
function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // Draw grass on top
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, 10);
}

// Game over
function gameOver() {
    gameRunning = false;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Restart game
function restartGame() {
    startGame();
}

// Toggle pause
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        document.getElementById('pauseScreen').style.display = 'flex';
    } else {
        document.getElementById('pauseScreen').style.display = 'none';
        gameLoop();
    }
}

// Resume game
function resumeGame() {
    gamePaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    gameLoop();
}

// Initialize game when page loads
window.addEventListener('load', initGame);

// Handle window resize
window.addEventListener('resize', () => {
    if (canvas) {
        if (window.innerWidth < 800) {
            canvas.width = window.innerWidth - 20;
            canvas.height = window.innerHeight * 0.6;
            groundY = canvas.height - 50;
            if (player) {
                player.y = groundY;
            }
        } else {
            canvas.width = 800;
            canvas.height = 600;
            groundY = 550;
            if (player) {
                player.y = groundY;
            }
        }
    }
}); 