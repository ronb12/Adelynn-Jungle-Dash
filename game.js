const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const scoreboard = document.getElementById('scoreboard');

// Super Mario-style control: player moves freely, world follows
const playerWidth = 60;
const playerHeight = 100; // Original character height
const groundY = canvas.height - 20; // Mario-style ground (thinner)
let playerX = 100; // Start player at fixed position, not centered
let playerY = groundY - playerHeight; // Character's feet should touch ground EXACTLY
let worldOffset = 0; // How much the world has moved
let coins = [];
let platforms = [];
let obstacles = [];
let enemies = [];
let score = 0;
let gameRunning = false;
let gameInterval;
let gameStarted = false;

// Player movement variables
let playerVelocityX = 0;
let playerVelocityY = 0;
const playerSpeed = 5;
const gravity = 0.6; // Reduced gravity for better control
const jumpPower = -20; // Increased jump power for higher jumps

// Debug flag to show collision boxes
let showDebug = true;

// Sprite sheet for Princess Yasuko (Super Miyamoto Land)
const girlRunSprite = new Image();
girlRunSprite.src = 'sprites/princess_yasuko.png'; // Use Princess Yasuko sprite for testing
const runFrameWidth = 24; // Frame width from the sprite sheet
const runFrameHeight = 32; // Frame height from the sprite sheet
const runFrameCount = 8;
let runFrameIndex = 0;
let runFrameTick = 0;

// Jungle menu background
const jungleMenuBg = new Image();
jungleMenuBg.src = 'sprites/jungle_menu_bg.jpg';

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

// Object types
const OBJECT_TYPES = {
    PLATFORM: 'platform',
    PIPE: 'pipe',
    BLOCK: 'block',
    ENEMY: 'enemy',
    COIN: 'coin'
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
    // Green ground (Mario-style thin ground)
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
    
    // Simple start screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 2em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#222';
    ctx.shadowBlur = 8;
    ctx.fillText('Press Start to Play!', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
}

function drawPlayer() {
    // Debug: Draw collision box and ground line
    if (showDebug) {
        // Character collision box
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(playerX, playerY, playerWidth, playerHeight);
        
        // Ground line
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();
        
        // Character feet position indicator
        ctx.fillStyle = 'yellow';
        ctx.fillRect(playerX + playerWidth/2 - 2, playerY + playerHeight - 4, 4, 4);
    }
    
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
        playerY, // Original drawing position - no offset
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

function drawPlatforms() {
    platforms.forEach(platform => {
        const screenX = platform.x - worldOffset;
        if (screenX > -100 && screenX < canvas.width + 100) {
            // Draw platform with Mario-style design
            ctx.fillStyle = '#8B4513'; // Brown
            ctx.fillRect(screenX, platform.y, platform.width, platform.height);
            
            // Add some texture
            ctx.fillStyle = '#654321';
            ctx.fillRect(screenX, platform.y, platform.width, 5);
            ctx.fillRect(screenX, platform.y + platform.height - 5, platform.width, 5);
        }
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        const screenX = obstacle.x - worldOffset;
        if (screenX > -100 && screenX < canvas.width + 100) {
            if (obstacle.type === OBJECT_TYPES.PIPE) {
                // Draw Mario-style pipe
                ctx.fillStyle = '#228B22'; // Green
                ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
                ctx.fillStyle = '#006400';
                ctx.fillRect(screenX, obstacle.y, obstacle.width, 10);
                ctx.fillRect(screenX, obstacle.y + obstacle.height - 10, obstacle.width, 10);
            } else if (obstacle.type === OBJECT_TYPES.BLOCK) {
                // Draw Mario-style block
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(screenX, obstacle.y, obstacle.width, 5);
                ctx.fillRect(screenX, obstacle.y + obstacle.height - 5, obstacle.width, 5);
            }
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        const screenX = enemy.x - worldOffset;
        if (screenX > -50 && screenX < canvas.width + 50) {
            // Draw simple enemy (red circle)
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(screenX + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(screenX + enemy.width/2 - 5, enemy.y + enemy.height/2 - 5, 2, 0, Math.PI * 2);
            ctx.arc(screenX + enemy.width/2 + 5, enemy.y + enemy.height/2 - 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function spawnCoin() {
    const coinX = Math.random() * 2000 + worldOffset + canvas.width;
    coins.push({
        x: coinX,
        y: canvas.height - 50 // Higher up so coins are visible
    });
}

function spawnPlatform() {
    const platformX = Math.random() * 2000 + worldOffset + canvas.width;
    const platformY = canvas.height - 120 - Math.random() * 150; // More varied heights
    const platformWidth = 80 + Math.random() * 120;
    
    platforms.push({
        x: platformX,
        y: platformY,
        width: platformWidth,
        height: 20,
        type: OBJECT_TYPES.PLATFORM
    });
}

function spawnObstacle() {
    const obstacleX = Math.random() * 2000 + worldOffset + canvas.width;
    const obstacleType = Math.random() > 0.5 ? OBJECT_TYPES.PIPE : OBJECT_TYPES.BLOCK;
    
    if (obstacleType === OBJECT_TYPES.PIPE) {
        obstacles.push({
            x: obstacleX,
            y: canvas.height - 100, // Higher up for better jumping
            width: 40,
            height: 100,
            type: obstacleType
        });
    } else {
        obstacles.push({
            x: obstacleX,
            y: canvas.height - 60, // Higher up for better jumping
            width: 40,
            height: 60,
            type: obstacleType
        });
    }
}

function spawnEnemy() {
    const enemyX = Math.random() * 2000 + worldOffset + canvas.width;
    enemies.push({
        x: enemyX,
        y: canvas.height - 40, // Higher up for better visibility
        width: 30,
        height: 30,
        velocityX: -1,
        type: OBJECT_TYPES.ENEMY
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
    
    // Apply velocity to player position
    playerX += playerVelocityX;
    
    // Simple Mario-style camera: move world when player reaches edges
    const edgeThreshold = 150; // Distance from edge before camera moves
    
    if (playerX < edgeThreshold) {
        // Player near left edge, don't move camera
        if (playerX < 50) {
            playerX = 50; // Keep player on screen
        }
    } else if (playerX > canvas.width - edgeThreshold) {
        // Player near right edge, move camera to follow
        worldOffset += playerVelocityX;
        playerX = canvas.width - edgeThreshold; // Keep player at edge
    }
    
    // Handle jumping
    if (keys.up && !isJumping && playerVelocityY >= 0) {
        playerVelocityY = jumpPower;
        isJumping = true;
    }
    
    // Apply gravity
    playerVelocityY += gravity;
    let prevPlayerY = playerY;
    playerY += playerVelocityY;
    
    // Super Mario-style platform collision: detect crossing from above
    let onPlatform = false;
    platforms.forEach(platform => {
        const platformScreenX = platform.x - worldOffset;
        // Check horizontal overlap
        if (playerX + playerWidth > platformScreenX && playerX < platformScreenX + platform.width) {
            let prevFeet = prevPlayerY + playerHeight;
            let currFeet = playerY + playerHeight;
            // If player crossed the platform from above and is falling
            if (prevFeet <= platform.y && currFeet >= platform.y && playerVelocityY >= 0) {
                playerY = platform.y - playerHeight;
                playerVelocityY = 0;
                isJumping = false;
                onPlatform = true;
            }
        }
    });
    // Check obstacle top collisions (allow standing on obstacles, same logic)
    let onObstacle = false;
    obstacles.forEach(obstacle => {
        const obstacleScreenX = obstacle.x - worldOffset;
        if (playerX + playerWidth > obstacleScreenX && playerX < obstacleScreenX + obstacle.width) {
            let prevFeet = prevPlayerY + playerHeight;
            let currFeet = playerY + playerHeight;
            if (prevFeet <= obstacle.y && currFeet >= obstacle.y && playerVelocityY >= 0) {
                playerY = obstacle.y - playerHeight;
                playerVelocityY = 0;
                isJumping = false;
                onObstacle = true;
            }
        }
    });
    // Ground collision (only if not on platform or obstacle) - Precise feet detection
    if (!onPlatform && !onObstacle) {
        const feetY = playerY + playerHeight;
        if (feetY >= groundY) {
            playerY = groundY - playerHeight;
            playerVelocityY = 0;
            isJumping = false;
        }
    }
    // CONSTANT GROUND CHECK - Force character to ground if not jumping
    if (!isJumping && playerVelocityY === 0) {
        const feetY = playerY + playerHeight;
        if (feetY > groundY) {
            playerY = groundY - playerHeight;
        }
    }
    // Check obstacle collisions (side collisions)
    obstacles.forEach(obstacle => {
        const obstacleScreenX = obstacle.x - worldOffset;
        if (playerX + playerWidth > obstacleScreenX && 
            playerX < obstacleScreenX + obstacle.width &&
            playerY + playerHeight > obstacle.y &&
            playerY < obstacle.y + obstacle.height) {
            // Check if player is jumping over the obstacle
            if (playerVelocityY < 0 && playerY > obstacle.y + obstacle.height - 20) {
                // Player is jumping upward and above the obstacle, allow passing
                return;
            }
            // If already standing on top, don't push back
            if (
                playerY + playerHeight <= obstacle.y + 5 &&
                playerVelocityY === 0
            ) {
                return;
            }
            // Collision detected - push player back
            if (playerVelocityX > 0) {
                playerX = obstacleScreenX - playerWidth;
            } else if (playerVelocityX < 0) {
                playerX = obstacleScreenX + obstacle.width;
            }
            playerVelocityX = 0;
        }
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.x += enemy.velocityX;
        
        // Simple AI: turn around at edges
        const enemyScreenX = enemy.x - worldOffset;
        if (enemyScreenX < 0 || enemyScreenX > canvas.width) {
            enemy.velocityX *= -1;
        }
    });
}

function updateGame() {
    drawBackground();
    if (!gameStarted) {
        drawInitialScreen();
        return;
    }
    
    updatePlayer();
    updateEnemies();
    
    // Check for coin collisions
    checkCoinCollision();
    
    // Check for enemy collisions
    checkEnemyCollision();
    
    // Draw everything
    drawPlatforms();
    drawObstacles();
    drawEnemies();
    drawPlayer();
    drawCoins();
    
    // Spawn objects occasionally (start spawning immediately)
    if (gameRunning) {
        if (Math.random() < 0.01) spawnCoin();
        if (Math.random() < 0.005) spawnPlatform();
        if (Math.random() < 0.003) spawnObstacle();
        if (Math.random() < 0.002) spawnEnemy();
    }
}

function checkCoinCollision() {
    coins = coins.filter(coin => {
        const coinScreenX = coin.x - worldOffset;
        const playerCenterX = playerX + playerWidth / 2;
        const playerCenterY = playerY + playerHeight / 2; // Remove velocity offset
        const distX = Math.abs(coinScreenX - playerCenterX);
        const distY = Math.abs(coin.y - playerCenterY);
        if (distX < playerWidth / 2 && distY < playerHeight / 2) {
            score++;
            scoreboard.textContent = 'Score: ' + score + ' ♾️'; // Infinite lives indicator
            return false;
        }
        return true;
    });
}

function checkEnemyCollision() {
    enemies.forEach(enemy => {
        const enemyScreenX = enemy.x - worldOffset;
        if (playerX + playerWidth > enemyScreenX && 
            playerX < enemyScreenX + enemy.width &&
            playerY + playerHeight > enemy.y &&
            playerY < enemy.y + enemy.height) {
            
            // Check if player is jumping on enemy (from above)
            if (playerVelocityY > 0 && playerY < enemy.y - 10) {
                // Defeat enemy
                enemies = enemies.filter(e => e !== enemy);
                score += 5;
                scoreboard.textContent = 'Score: ' + score + ' ♾️'; // Infinite lives indicator
                playerVelocityY = -10; // Bounce
            } else if (playerVelocityY < 0) {
                // Player is moving upward, don't trigger game over
                return;
            } else {
                // Player gets hit from the side - INFINITE LIVES MODE
                // Bounce the player back by moving the world
                if (playerVelocityX > 0) {
                    worldOffset += 10; // Move world back
                } else {
                    worldOffset -= 10; // Move world forward
                }
                playerVelocityX = 0;
                // Add a small bounce effect
                playerVelocityY = -5;
            }
        }
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
    gameStarted = true;
    gameRunning = true;
    startGameLoop();
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
    playerX = 100; // Mario-style starting position, not centered
    playerY = groundY - playerHeight;
    worldOffset = 0;
    playerVelocityX = 0;
    playerVelocityY = 0;
    coins = [];
    platforms = [];
    obstacles = [];
    enemies = [];
    score = 0;
    gameRunning = false;
    gameStarted = false;
    scoreboard.textContent = 'Score: 0 ♾️'; // Infinite lives indicator
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