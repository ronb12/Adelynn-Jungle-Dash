// Game variables
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let score = 0;
let coins = 0;
let lives = 999; // Infinite lives for testing
let gameSpeed = 5;
let gravity = 0.8;
let groundY = 550;

// Player object
let player = {
    x: 100,
    y: groundY,
    width: 120,
    height: 120,
    velocityY: 0,
    isJumping: false,
    onGround: true,
    // Movement variables
    isMoving: false,
    direction: 1, // 1 for right (default facing right), -1 for left
    animationSpeed: 6 // kept for potential future use
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
let audioContext = null;

// Initialize audio context for sound effects
function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context initialized for sound effects');
    } catch (e) {
        console.log('Web Audio API not supported:', e);
    }
}

// Generate coin sound effect
function playCoinSound() {
    if (!audioContext) return;
    
    try {
        // Create oscillator for coin sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set up coin sound characteristics
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High pitch
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1); // Drop in pitch
        oscillator.type = 'sine';
        
        // Set up volume envelope
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        // Play the sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
    } catch (e) {
        console.log('Failed to play coin sound:', e);
    }
}

// Generate jump sound effect
function playJumpSound() {
    if (!audioContext) return;
    
    try {
        // Create oscillator for jump sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set up jump sound characteristics
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Low pitch
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1); // Rise in pitch
        oscillator.type = 'sine';
        
        // Set up volume envelope
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        // Play the sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        
    } catch (e) {
        console.log('Failed to play jump sound:', e);
    }
}

// Initialize game
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size for mobile
    if (window.innerWidth < 800) {
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight * 0.6;
        groundY = canvas.height - 50;
    }
    
    // Ensure player is properly positioned on the ground
    player.y = groundY - player.height;
    
    // Initialize audio context for sound effects
    initAudioContext();
    
    loadAssets();
    setupEventListeners();
    startGame();
}

// Load game assets
function loadAssets() {
    // Load sprites - only include files that actually exist
    const spriteFiles = [
        'jungle_girl.png', // Use the available character sprite
        'jungle_girl_run.png', // Use running character sprite
        'banana_coin.png', // Use banana coin instead of regular coin
        'frog_obstacle.png', // Use frog obstacle
        'crab_enemy.png', // Use crab enemy
        'coconut_enemy.png' // Use coconut enemy
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
        img.onerror = () => {
            console.log(`Failed to load sprite: ${filename} - will use fallback`);
            loadedSprites++;
        };
        img.src = `sprites/${filename}`;
        sprites[filename.replace('.png', '')] = img;
    });
    
    // Load audio with fallback support
    const audioFiles = [
        { name: 'coin', files: ['coin.wav'] }, // Use available .wav file
        { name: 'jump', files: ['jump.wav'] }  // Use available .wav file
    ];
    
    audioFiles.forEach(audioFile => {
        // Try to load audio with fallback
        const sound = new Audio();
        let audioLoaded = false;
        
        audioFile.files.forEach((file, index) => {
            if (!audioLoaded) {
                sound.src = `audio/${file}`;
                sound.load();
                
                sound.addEventListener('canplaythrough', () => {
                    if (!audioLoaded) {
                        audioLoaded = true;
                        audio[audioFile.name] = sound;
                        console.log(`Audio loaded: ${audioFile.name}`);
                    }
                }, { once: true });
                
                sound.addEventListener('error', () => {
                    if (index === audioFile.files.length - 1 && !audioLoaded) {
                        console.log(`Audio file not available: ${audioFile.name} - game will play silently`);
                        // Create a silent audio as fallback
                        audio[audioFile.name] = null;
                    }
                });
            }
        });
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
    lives = 999; // Infinite lives for testing
    gameSpeed = 5;
    
    // Reset player
    player.x = 100;
    player.y = groundY;
    player.velocityY = 0;
    player.isJumping = false;
    player.onGround = true;
    // Reset movement variables
    player.isMoving = false;
    player.direction = 1;
    
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
    const baseMoveSpeed = 3; // Reduced for smoother movement
    const sprintMultiplier = 1.5; // Sprint speed multiplier
    let moveSpeed = baseMoveSpeed;
    let wasMoving = player.isMoving;
    player.isMoving = false;
    
    // Check for sprint (Shift key or double tap)
    const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
    if (isSprinting && player.onGround) {
        moveSpeed *= sprintMultiplier;
        player.animationSpeed = 4; // Faster animation when sprinting
    } else {
        player.animationSpeed = 6; // Normal animation speed
    }
    
    // Allow full left/right movement across the screen
    if ((keys['ArrowLeft'] || keys['KeyA'] || touchControls.left) && player.x > 0) {
        player.x -= moveSpeed;
        player.isMoving = true;
        player.direction = -1; // Moving left
    }
    
    if ((keys['ArrowRight'] || keys['KeyD'] || touchControls.right) && player.x < canvas.width - player.width) {
        player.x += moveSpeed;
        player.isMoving = true;
        player.direction = 1; // Moving right
    }
    
    // Allow arrow keys to control facing direction independently
    // Up arrow: face up (direction = 2)
    if (keys['ArrowUp']) {
        player.direction = 2; // Face up
    }
    // Down arrow: face down (direction = -2)
    else if (keys['ArrowDown']) {
        player.direction = -2; // Face down
    }
    // Left arrow (when not moving): face left
    else if (keys['ArrowLeft'] && !player.isMoving) {
        player.direction = -1; // Face left
    }
    // Right arrow (when not moving): face right
    else if (keys['ArrowRight'] && !player.isMoving) {
        player.direction = 1; // Face right
    }
    // If no direction keys pressed and not moving, face right by default
    else if (!player.isMoving) {
        player.direction = 1; // Face right when idle
    }
    
    // Update animation
    updatePlayerAnimation();
}

// Update player animation
function updatePlayerAnimation() {
    // Since we're using a single-frame character sprite, 
    // we don't need frame-based animation, but we can still
    // track movement state for visual effects
    if (player.isMoving && player.onGround) {
        // Character is running - visual effects handled in drawPlayer
        player.isMoving = true;
    } else if (player.isJumping) {
        // Character is jumping - visual effects handled in drawPlayer
        player.isJumping = true;
    } else {
        // Character is idle
        player.isMoving = false;
    }
}

// Update player physics
function updatePlayerPhysics() {
    // Apply gravity
    if (!player.onGround) {
        player.velocityY += gravity;
        player.y += player.velocityY;
    }
    
    // Check ground collision - account for player height
    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
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
            try {
                audio.jump.currentTime = 0;
                audio.jump.play().catch(e => console.log('Audio play failed:', e));
            } catch (e) {
                console.log('Audio play failed:', e);
            }
        } else {
            // Use generated jump sound if audio file not available
            playJumpSound();
        }
    }
}

// Spawn objects
function spawnObjects() {
    // Spawn coins with more variety
    if (Math.random() < 0.03) { // Increased spawn rate
        const coinY = Math.random() * (groundY - 150) + 50;
        coinObjects.push({
            x: canvas.width,
            y: coinY,
            width: 40,
            height: 40,
            collected: false,
            type: Math.random() < 0.2 ? 'gold' : 'silver' // Different coin types
        });
    }
    
    // Spawn obstacles with more variety
    if (Math.random() < 0.015) { // Slightly increased spawn rate
        const obstacleTypes = ['frog_obstacle', 'crab_enemy', 'coconut_enemy'];
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        // Vary obstacle positions and sizes
        const obstacleHeight = 30 + Math.random() * 20; // 30-50 pixels
        const obstacleWidth = 25 + Math.random() * 15; // 25-40 pixels
        const obstacleY = groundY - obstacleHeight;
        
        obstacles.push({
            x: canvas.width,
            y: obstacleY,
            width: obstacleWidth,
            height: obstacleHeight,
            type: randomType,
            speed: gameSpeed + Math.random() * 2 // Vary speed slightly
        });
    }
    
    // Spawn floating obstacles (like birds or flying enemies)
    if (Math.random() < 0.008) {
        obstacles.push({
            x: canvas.width,
            y: Math.random() * (groundY - 200) + 50,
            width: 35,
            height: 25,
            type: 'flying_enemy',
            speed: gameSpeed + 1
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
        obstacle.x -= obstacle.speed; // Use obstacle.speed for movement
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
                try {
                    audio.coin.currentTime = 0;
                    audio.coin.play().catch(e => console.log('Audio play failed:', e));
                } catch (e) {
                    console.log('Audio play failed:', e);
                }
            } else {
                // Use generated coin sound if audio file not available
                playCoinSound();
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
    
    // Update audio status
    updateAudioStatus();
}

// Update audio status display
function updateAudioStatus() {
    const audioStatus = document.getElementById('audioStatus');
    if (audioStatus) {
        const coinAudio = audio.coin;
        const jumpAudio = audio.jump;
        
        if (coinAudio && jumpAudio) {
            audioStatus.textContent = 'Sound effects: Available';
            audioStatus.style.color = '#4CAF50';
        } else if (audioContext) {
            audioStatus.textContent = 'Sound effects: Generated';
            audioStatus.style.color = '#2196F3';
        } else {
            audioStatus.textContent = 'Sound effects: Not available';
            audioStatus.style.color = '#FF9800';
        }
    }
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
    // Choose sprite based on movement state
    let sprite = sprites.jungle_girl; // Default to idle sprite
    
    if (player.isMoving && player.onGround) {
        sprite = sprites.jungle_girl_run; // Use running sprite when moving
    }
    
    if (sprite && sprite.complete) {
        // Save context for transformations
        ctx.save();
        
        // Add brightness and contrast adjustments to make character more visible
        ctx.filter = 'brightness(1.5) contrast(1.3) saturate(1.2)';
        
        // Handle different directions
        if (player.direction === -1) {
            // Face left - flip horizontally
            ctx.scale(-1, 1);
            ctx.translate(-player.x - player.width, 0);
        } else if (player.direction === 2) {
            // Face up - rotate 90 degrees counterclockwise
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.rotate(-Math.PI/2);
            ctx.translate(-(player.x + player.width/2), -(player.y + player.height/2));
        } else if (player.direction === -2) {
            // Face down - rotate 90 degrees clockwise
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.rotate(Math.PI/2);
            ctx.translate(-(player.x + player.width/2), -(player.y + player.height/2));
        }
        
        // Add sprint effect (slight glow when sprinting)
        const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
        if (isSprinting && player.isMoving && player.onGround) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        // Draw the character sprite (single frame)
        ctx.drawImage(
            sprite,
            0, 0, // Source x, y
            sprite.width, sprite.height, // Source width, height
            player.x, player.y, // Destination x, y
            player.width, player.height // Destination width, height
        );
        
        ctx.restore();
    } else {
        // Fallback to rectangle if sprite not loaded
        const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
        if (isSprinting && player.isMoving && player.onGround) {
            ctx.fillStyle = '#FF4500'; // Orange-red when sprinting
        } else {
            ctx.fillStyle = '#FF6B6B';
        }
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Draw player details
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x + 10, player.y + 10, 8, 8); // Eye
        ctx.fillRect(player.x + 32, player.y + 10, 8, 8); // Eye
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(player.x + 15, player.y + 25, 20, 10); // Mouth
    }
}

// Draw coins
function drawCoins() {
    const coinSprite = sprites.banana_coin;
    coinObjects.forEach(coin => {
        if (!coin.collected) {
            if (coinSprite && coinSprite.complete) {
                // Draw coin sprite with rotation effect
                ctx.save();
                ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
                ctx.rotate(Date.now() * 0.003); // Rotate coins
                ctx.drawImage(coinSprite, -coin.width/2, -coin.height/2, coin.width, coin.height);
                ctx.restore();
            } else {
                // Enhanced fallback coin graphics
                const isGold = coin.type === 'gold';
                ctx.fillStyle = isGold ? '#FFD700' : '#C0C0C0';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Coin shine effect
                ctx.fillStyle = isGold ? '#FFF8DC' : '#FFFFFF';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width/2 - 3, coin.y + coin.height/2 - 3, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Coin symbol
                ctx.fillStyle = isGold ? '#B8860B' : '#696969';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(isGold ? '$' : '¢', coin.x + coin.width/2, coin.y + coin.height/2 + 5);
                
                // Pulsing effect
                const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
                ctx.globalAlpha = 0.7 + pulse * 0.3;
            }
        }
    });
    ctx.globalAlpha = 1; // Reset transparency
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        const obstacleSprite = sprites[obstacle.type];
        if (obstacleSprite && obstacleSprite.complete) {
            // Draw obstacle sprite
            ctx.drawImage(obstacleSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            // Enhanced fallback graphics based on obstacle type
            if (obstacle.type === 'flying_enemy') {
                // Draw flying enemy (bird-like)
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Wings
                ctx.fillStyle = '#DC143C';
                ctx.fillRect(obstacle.x - 5, obstacle.y + 5, 8, 8);
                ctx.fillRect(obstacle.x + obstacle.width - 3, obstacle.y + 5, 8, 8);
                
                // Eye
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 4, 4);
            } else {
                // Ground obstacles
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Obstacle details based on type
                if (obstacle.type === 'frog_obstacle') {
                    // Frog details
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
                    // Eyes
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(obstacle.x + 8, obstacle.y + 8, 3, 3);
                    ctx.fillRect(obstacle.x + obstacle.width - 11, obstacle.y + 8, 3, 3);
                } else if (obstacle.type === 'crab_enemy') {
                    // Crab details
                    ctx.fillStyle = '#DC143C';
                    ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width - 6, obstacle.height - 6);
                    // Claws
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(obstacle.x - 3, obstacle.y + 5, 6, 8);
                    ctx.fillRect(obstacle.x + obstacle.width - 3, obstacle.y + 5, 6, 8);
                } else {
                    // Coconut details
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
                    ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 15, obstacle.width - 10, 10);
                }
            }
        }
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
    // Reset game state
    score = 0;
    coins = 0;
    lives = 999; // Infinite lives for testing
    gameSpeed = 5;
    obstacles = [];
    coinObjects = [];
    powerUps = [];
    
    // Reset player position and state
    player.x = 100;
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.onGround = true;
    player.isMoving = false;
    player.direction = 1; // Face right by default
    
    // Hide game over screen
    document.getElementById('gameOverScreen').style.display = 'none';
    
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
                player.y = groundY - player.height;
            }
        } else {
            canvas.width = 800;
            canvas.height = 600;
            groundY = 550;
            if (player) {
                player.y = groundY - player.height;
            }
        }
    }
}); 