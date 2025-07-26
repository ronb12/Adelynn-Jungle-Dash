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
let cameraX = 0; // Camera position for side-scrolling

// Distance tracking
let distance = 0;
let bestDistance = 0;

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
    animationSpeed: 6, // kept for potential future use
    angle: 0 // Angle in radians, 0 = facing right
};

// Sprite animation variables
let playerSprites = {
    idle: [],
    run: []
};
let currentAnimation = 'idle';
let animationFrame = 0;
let animationSpeed = 0.2; // How fast to cycle through frames
let frameCounter = 0;

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
let audio = {
    coin: null,
    jump: null,
    background: null,
    powerup: null,
    collision: null,
    gameOver: null
};
let audioContext = null;

// Particle system
let particles = [];

// Game state management
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
let gameSettings = {
    musicVolume: 30,
    sfxVolume: 50,
    difficulty: 'normal',
    particlesEnabled: true
};

// Power-up system
const POWERUP_TYPES = ['speed', 'shield', 'magnet'];

let playerPowerup = {
    speed: false,
    shield: false,
    magnet: false,
    speedTimer: 0,
    shieldTimer: 0,
    magnetTimer: 0
};

// Enhanced obstacle and enemy types
const OBSTACLE_TYPES = {
    'frog_obstacle': { category: 'ground', speed: 1.0, damage: 1 },
    'crab_enemy': { category: 'ground', speed: 1.2, damage: 1 },
    'coconut_enemy': { category: 'ground', speed: 0.8, damage: 1 },
    'flying_enemy': { category: 'flying', speed: 1.5, damage: 1 },
    'spike_pit': { category: 'hazard', speed: 1.0, damage: 1 },
    'rolling_log': { category: 'moving', speed: 1.3, damage: 1 }
};

class Particle {
    constructor(x, y, type = 'coin') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8; // Random horizontal velocity
        this.vy = -Math.random() * 6 - 2; // Upward velocity
        this.life = 1.0; // Life from 1.0 to 0.0
        this.decay = 0.02; // How fast particle fades
        this.size = Math.random() * 4 + 2; // Random size
        this.type = type; // 'coin', 'jump', 'sparkle'
        this.color = this.getColor();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    getColor() {
        switch(this.type) {
            case 'coin':
                return Math.random() < 0.3 ? '#FFD700' : '#FFA500'; // Gold or orange
            case 'jump':
                return '#8B4513'; // Brown dust
            case 'sparkle':
                return ['#FFD700', '#FFA500', '#FF6347', '#87CEEB'][Math.floor(Math.random() * 4)];
            default:
                return '#FFFFFF';
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // Gravity
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        this.vx *= 0.98; // Air resistance
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        switch(this.type) {
            case 'coin':
                // Draw coin particle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                // Add shine
                ctx.fillStyle = '#FFF8DC';
                ctx.beginPath();
                ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'jump':
                // Draw dust particle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'sparkle':
                // Draw sparkle
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    const x1 = Math.cos(angle) * this.size;
                    const y1 = Math.sin(angle) * this.size;
                    const x2 = Math.cos(angle) * (this.size * 0.5);
                    const y2 = Math.sin(angle) * (this.size * 0.5);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                ctx.stroke();
                break;
        }

        ctx.restore();
    }
}

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
    if (audio.coin) {
        try {
            audio.coin.currentTime = 0;
            audio.coin.volume = gameSettings.sfxVolume / 100;
            audio.coin.play().catch(e => console.log('Coin audio play failed:', e));
        } catch (e) {
            console.log('Coin audio play failed:', e);
        }
    } else {
        // Generate coin sound using Web Audio API
        if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(gameSettings.sfxVolume / 200, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
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

// Enhanced sound effect functions
function playPowerupSound() {
    if (audio.powerup) {
        try {
            audio.powerup.currentTime = 0;
            audio.powerup.volume = 0.4;
            audio.powerup.play().catch(e => console.log('Powerup audio play failed:', e));
        } catch (e) {
            console.log('Powerup audio play failed:', e);
        }
    } else {
        // Generate powerup sound using Web Audio API
        if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    }
}

function playCollisionSound() {
    if (audio.collision) {
        try {
            audio.collision.currentTime = 0;
            audio.collision.volume = 0.5;
            audio.collision.play().catch(e => console.log('Collision audio play failed:', e));
        } catch (e) {
            console.log('Collision audio play failed:', e);
        }
    } else {
        // Generate collision sound using Web Audio API
        if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }
}

function playGameOverSound() {
    if (audio.gameOver) {
        try {
            audio.gameOver.currentTime = 0;
            audio.gameOver.volume = 0.6;
            audio.gameOver.play().catch(e => console.log('Game over audio play failed:', e));
        } catch (e) {
            console.log('Game over audio play failed:', e);
        }
    } else {
        // Generate game over sound using Web Audio API
        if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }
}

// Particle effect functions
function createCoinParticles(x, y) {
    if (!gameSettings.particlesEnabled) return;
    
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, 'coin'));
    }
    // Add some sparkles too
    for (let i = 0; i < 3; i++) {
        particles.push(new Particle(x, y, 'sparkle'));
    }
}

function createJumpParticles(x, y) {
    if (!gameSettings.particlesEnabled) return;
    
    for (let i = 0; i < 6; i++) {
        particles.push(new Particle(x, y, 'jump'));
    }
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.update();
        return particle.life > 0;
    });
}

function drawParticles() {
    particles.forEach(particle => {
        particle.draw(ctx);
    });
}

// Special events system
let specialEvents = {
    coinRain: false,
    coinRainTimer: 0,
    bonusRound: false,
    bonusRoundTimer: 0
};

// Trigger special events
function triggerSpecialEvents() {
    // Coin rain event (rare)
    if (Math.random() < 0.001 && !specialEvents.coinRain) {
        specialEvents.coinRain = true;
        specialEvents.coinRainTimer = 180; // 3 seconds
        console.log('Coin rain started!');
    }
    
    // Bonus round event (very rare)
    if (Math.random() < 0.0005 && !specialEvents.bonusRound) {
        specialEvents.bonusRound = true;
        specialEvents.bonusRoundTimer = 300; // 5 seconds
        console.log('Bonus round started!');
    }
}

// Achievements system
let achievements = {
    coins: { current: 0, milestones: [10, 50, 100, 250, 500, 1000], unlocked: [] },
    distance: { current: 0, milestones: [100, 500, 1000, 2500, 5000, 10000], unlocked: [] },
    powerups: { current: 0, milestones: [5, 15, 30, 50, 100], unlocked: [] },
    survival: { current: 0, milestones: [30, 60, 120, 300, 600], unlocked: [] } // seconds
};

let totalCoinsCollected = 0;
let totalPowerupsCollected = 0;
let gameStartTime = 0;

// Leaderboard system
let leaderboard = [];
const MAX_LEADERBOARD_ENTRIES = 10;

// Load leaderboard from localStorage
function loadLeaderboard() {
    const saved = localStorage.getItem('jungleDashLeaderboard');
    if (saved) {
        leaderboard = JSON.parse(saved);
    }
}

// Save leaderboard to localStorage
function saveLeaderboard() {
    localStorage.setItem('jungleDashLeaderboard', JSON.stringify(leaderboard));
}

// Add score to leaderboard
function addToLeaderboard(score, distance, coins) {
    const entry = {
        score: score,
        distance: Math.floor(distance),
        coins: coins,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score); // Sort by score descending
    
    // Keep only top scores
    if (leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
        leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    }
    
    saveLeaderboard();
    return leaderboard.indexOf(entry) + 1; // Return position (1-based)
}

// Initialize game
function initGame() {
    // Initialize audio context
    initAudioContext();
    
    // Set up canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size and ground position
    canvas.width = 800;
    canvas.height = 600;
    groundY = canvas.height - 100;
    
    // Set player starting position
    player.y = groundY - player.height;
    
    // Load assets and initialize game
    loadAssets().then(() => {
        // Initialize UI settings
        document.getElementById('musicVolume').value = gameSettings.musicVolume;
        document.getElementById('musicVolumeValue').textContent = gameSettings.musicVolume + '%';
        document.getElementById('sfxVolume').value = gameSettings.sfxVolume;
        document.getElementById('sfxVolumeValue').textContent = gameSettings.sfxVolume + '%';
        document.getElementById('difficulty').value = gameSettings.difficulty;
        document.getElementById('particlesEnabled').checked = gameSettings.particlesEnabled;
        
        // Load leaderboard
        loadLeaderboard();
        
        // Show main menu
        showMainMenu();
        
        // Start game loop
        gameLoop();
    });
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Game initialized!');
}

// Load game assets
function loadAssets() {
    // Load sprites
    const spriteFiles = {
        'jungle_girl': 'sprites/jungle_girl.png',
        'jungle_girl_run': 'sprites/jungle_girl_run.png',
        'banana_coin': 'sprites/banana_coin.png',
        'frog_obstacle': 'sprites/frog_obstacle.png',
        'crab_enemy': 'sprites/crab_enemy.png',
        'coconut_enemy': 'sprites/coconut_enemy.png'
    };

    const spritePromises = Object.entries(spriteFiles).map(([key, path]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                sprites[key] = img;
                resolve();
            };
            img.onerror = () => {
                console.log(`Failed to load sprite: ${path}`);
                resolve(); // Continue loading other assets
            };
            img.src = path;
        });
    });

    // Load animation frames
    const loadAnimationFrames = () => {
        // Load idle animation frames (frames 1-10 for variety)
        for (let i = 1; i <= 10; i++) {
            const frameNum = i.toString().padStart(3, '0');
            const img = new Image();
            img.onload = () => {
                playerSprites.idle.push(img);
            };
            img.onerror = () => {
                console.log(`Failed to load idle frame ${frameNum}`);
            };
            img.src = `renders/Idle/frame_${frameNum}.png`;
        }

        // Load run animation frames (frames 1-10 for variety)
        for (let i = 1; i <= 10; i++) {
            const frameNum = i.toString().padStart(3, '0');
            const img = new Image();
            img.onload = () => {
                playerSprites.run.push(img);
            };
            img.onerror = () => {
                console.log(`Failed to load run frame ${frameNum}`);
            };
            img.src = `renders/RunForward/frame_${frameNum}.png`;
        }
    };

    // Load audio files
    const audioFiles = {
        'coin': 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Coin collect sound
        'jump': 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Jump sound
        'background': 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3', // Background music
        'powerup': 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Power-up sound
        'collision': 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Collision sound
        'gameOver': 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3' // Game over sound
    };

    const audioPromises = Object.entries(audioFiles).map(([key, url]) => {
        return new Promise((resolve) => {
            const audioElement = new Audio();
            audioElement.oncanplaythrough = () => {
                audio[key] = audioElement;
                resolve();
            };
            audioElement.onerror = () => {
                console.log(`Failed to load audio: ${key} - will use generated sounds`);
                resolve(); // Continue loading other assets
            };
            audioElement.src = url;
        });
    });

    // Load animation frames
    loadAnimationFrames();

    // Wait for all assets to load
    return Promise.all([...spritePromises, ...audioPromises]);
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
    gameState = 'playing';
    gameRunning = true;
    gamePaused = false;
    score = 0;
    coins = 0;
    lives = 999; // Infinite lives for testing
    gameSpeed = 5;
    cameraX = 0;
    
    // Reset player position
    player.x = 100;
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.onGround = true;
    player.isMoving = false;
    player.angle = 0;
    
    // Clear game objects
    coinObjects = [];
    obstacles = [];
    particles = [];
    
    // Hide menu and show game
    hideMainMenu();
    
    // Start background music
    if (audio.background && audio.background.paused) {
        audio.background.volume = gameSettings.musicVolume / 100;
        audio.background.play().catch(e => console.log('Background music failed to play:', e));
    }
    
    // Start game loop
    gameLoop();
    distance = 0; // Reset distance on game start
    gameStartTime = Date.now(); // Set game start time
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
    if (!gameRunning || gamePaused) return;
    
    handlePlayerMovement();
    updatePlayerPhysics();
    updateObjects();
    checkCollisions();
    updateParticles(); // Add particle updates
    spawnObjects();
    
    // Increase game speed over time
    gameSpeed += 0.001;

    // Update power-up timers
    if (playerPowerup.speed) {
        playerPowerup.speedTimer--;
        if (playerPowerup.speedTimer <= 0) playerPowerup.speed = false;
    }
    if (playerPowerup.shield) {
        playerPowerup.shieldTimer--;
        if (playerPowerup.shieldTimer <= 0) playerPowerup.shield = false;
    }
    if (playerPowerup.magnet) {
        playerPowerup.magnetTimer--;
        if (playerPowerup.magnetTimer <= 0) playerPowerup.magnet = false;
    }

    // Update special events
    if (specialEvents.coinRain) {
        specialEvents.coinRainTimer--;
        if (specialEvents.coinRainTimer <= 0) {
            specialEvents.coinRain = false;
            console.log('Coin rain ended!');
        }
    }
    
    if (specialEvents.bonusRound) {
        specialEvents.bonusRoundTimer--;
        if (specialEvents.bonusRoundTimer <= 0) {
            specialEvents.bonusRound = false;
            console.log('Bonus round ended!');
        }
    }
    
    // Trigger new special events
    triggerSpecialEvents();

    // Update distance (endless mode)
    if (gameRunning && !gamePaused) {
        distance += gameSpeed * 0.1; // Adjust multiplier for tuning
        if (distance > bestDistance) bestDistance = distance;
    }

    // Check and unlock achievements
    checkAchievements();
}

// Handle player movement
function handlePlayerMovement() {
    const baseMoveSpeed = 3;
    const sprintMultiplier = 1.5;
    let moveSpeed = baseMoveSpeed;
    player.isMoving = false;

    // Manual rotation with Q/E
    const rotateSpeed = 0.08; // radians per frame
    if (keys['KeyQ']) {
        player.angle -= rotateSpeed;
    }
    if (keys['KeyE']) {
        player.angle += rotateSpeed;
    }

    // Movement input
    let moveX = 0;
    let moveY = 0;
    if (keys['ArrowLeft'] || keys['KeyA'] || touchControls.left) moveX -= 1;
    if (keys['ArrowRight'] || keys['KeyD'] || touchControls.right) moveX += 1;
    if (keys['ArrowUp']) moveY -= 1;
    if (keys['ArrowDown']) moveY += 1;

    // Sprint
    const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'] || playerPowerup.speed;
    if (isSprinting && player.onGround) {
        moveSpeed *= sprintMultiplier;
        player.animationSpeed = 4;
    } else {
        player.animationSpeed = 6;
    }

    // Power-up: Magnet effect (attract coins)
    if (playerPowerup.magnet) {
        coinObjects.forEach(coin => {
            if (!coin.collected) {
                const dx = (player.x + player.width/2) - (coin.x - cameraX + coin.width/2);
                const dy = (player.y + player.height/2) - (coin.y + coin.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 200) {
                    coin.x += dx * 0.08;
                    coin.y += dy * 0.08;
                }
            }
        });
    }

    // Normalize diagonal movement
    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;
        player.x += moveX * moveSpeed;
        player.y += moveY * moveSpeed;
        player.isMoving = true;
        // Automatic facing: set angle to movement direction
        player.angle = Math.atan2(moveY, moveX);
    }

    // Only keep a left boundary (player can't go off the left edge)
    if (player.x < 50) {
        player.x = 50;
        cameraX += moveSpeed;
    }
    // Remove right boundary for infinite forward movement
    // if (player.x > canvas.width - player.width - 50) {
    //     player.x = canvas.width - player.width - 50;
    //     cameraX -= moveSpeed;
    // }
    if (player.y < 0) player.y = 0;
    if (player.y > groundY - player.height) player.y = groundY - player.height;

    // If not moving, keep angle as is (manual rotation only)
    updatePlayerAnimation();
}

// Update player animation
function updatePlayerAnimation() {
    frameCounter += animationSpeed;
    
    // Determine current animation state
    if (player.isMoving && player.onGround) {
        currentAnimation = 'run';
        animationSpeed = 0.3; // Faster animation for running
    } else {
        currentAnimation = 'idle';
        animationSpeed = 0.2; // Slower animation for idle
    }
    
    // Update animation frame
    const frames = playerSprites[currentAnimation];
    if (frames && frames.length > 0) {
        animationFrame = Math.floor(frameCounter) % frames.length;
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
        player.isJumping = true;
        player.onGround = false;
        
        // Create jump particles
        createJumpParticles(player.x + player.width / 2, player.y + player.height);
        
        // Play jump sound
        playJumpSound();
    }
}

// Spawn objects
function spawnObjects() {
    // Spawn coins with more variety
    if (Math.random() < 0.03) { // Increased spawn rate
        const coinY = Math.random() * (groundY - 150) + 50;
        coinObjects.push({
            x: cameraX + canvas.width + Math.random() * 200, // Spawn ahead of camera
            y: coinY,
            width: 40,
            height: 40,
            collected: false,
            type: Math.random() < 0.2 ? 'gold' : 'silver' // Different coin types
        });
    }
    
    // Spawn obstacles with more variety
    if (Math.random() < 0.015) {
        const obstacleTypes = Object.keys(OBSTACLE_TYPES);
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const obstacleData = OBSTACLE_TYPES[randomType];

        // Vary obstacle positions and sizes based on type
        let obstacleHeight, obstacleWidth, obstacleY;
        
        switch(obstacleData.category) {
            case 'ground':
                obstacleHeight = 30 + Math.random() * 20;
                obstacleWidth = 25 + Math.random() * 15;
                obstacleY = groundY - obstacleHeight;
                break;
            case 'flying':
                obstacleHeight = 25 + Math.random() * 15;
                obstacleWidth = 30 + Math.random() * 10;
                obstacleY = Math.random() * (groundY - 200) + 50;
                break;
            case 'hazard':
                obstacleHeight = 20;
                obstacleWidth = 40 + Math.random() * 20;
                obstacleY = groundY - obstacleHeight;
                break;
            case 'moving':
                obstacleHeight = 35 + Math.random() * 15;
                obstacleWidth = 30 + Math.random() * 20;
                obstacleY = groundY - obstacleHeight;
                break;
            default:
                obstacleHeight = 30;
                obstacleWidth = 25;
                obstacleY = groundY - obstacleHeight;
        }

        obstacles.push({
            x: cameraX + canvas.width + Math.random() * 300,
            y: obstacleY,
            width: obstacleWidth,
            height: obstacleHeight,
            type: randomType,
            category: obstacleData.category,
            speed: gameSpeed * obstacleData.speed,
            damage: obstacleData.damage,
            originalY: obstacleY, // For moving obstacles
            moveDirection: Math.random() < 0.5 ? 1 : -1, // For moving obstacles
            moveSpeed: 1 + Math.random() * 2 // For moving obstacles
        });
    }
    
    // Spawn floating obstacles (like birds or flying enemies)
    if (Math.random() < 0.008) {
        obstacles.push({
            x: cameraX + canvas.width + Math.random() * 400, // Spawn ahead of camera
            y: Math.random() * (groundY - 200) + 50,
            width: 35,
            height: 25,
            type: 'flying_enemy',
            speed: gameSpeed + 1
        });
    }

    // Spawn power-ups
    if (Math.random() < 0.008) {
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        powerUps.push({
            x: cameraX + canvas.width + Math.random() * 400,
            y: Math.random() * (groundY - 120) + 60,
            width: 40,
            height: 40,
            type: type,
            collected: false
        });
    }

    // Special events: Coin rain
    if (specialEvents.coinRain) {
        // Spawn many coins during coin rain
        for (let i = 0; i < 3; i++) {
            const coinY = Math.random() * (groundY - 150) + 50;
            coinObjects.push({
                x: cameraX + canvas.width + Math.random() * 200,
                y: coinY,
                width: 40,
                height: 40,
                collected: false,
                type: Math.random() < 0.4 ? 'gold' : 'silver', // More gold coins during rain
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    // Special events: Bonus round (more power-ups)
    if (specialEvents.bonusRound) {
        // Spawn more power-ups during bonus round
        if (Math.random() < 0.05) {
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            powerUps.push({
                x: cameraX + canvas.width + Math.random() * 300,
                y: Math.random() * (groundY - 120) + 60,
                width: 40,
                height: 40,
                type: type,
                collected: false
            });
        }
    }
}

// Update objects
function updateObjects() {
    // Update obstacles with movement patterns
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacle.speed;
        
        // Add movement patterns based on category
        switch(obstacle.category) {
            case 'flying':
                // Flying enemies move in a sine wave pattern
                obstacle.y = obstacle.originalY + Math.sin(Date.now() * 0.003 + obstacle.x * 0.01) * 30;
                break;
            case 'moving':
                // Moving obstacles (like rolling logs) move up and down
                obstacle.y = obstacle.originalY + Math.sin(Date.now() * 0.005 + obstacle.x * 0.02) * 20;
                break;
            case 'hazard':
                // Spike pits stay in place but are more dangerous
                break;
            default:
                // Ground obstacles stay in place
                break;
        }
    });
    
    // Remove off-screen obstacles (behind camera)
    obstacles = obstacles.filter(obstacle => obstacle.x > cameraX - 100);

    // Update power-ups
    powerUps.forEach(powerup => {
        powerup.x -= gameSpeed;
    });
    // Remove off-screen power-ups
    powerUps = powerUps.filter(powerup => powerup.x > cameraX - powerup.width && !powerup.collected);
}

// Check collisions
function checkCollisions() {
    // Check coin collisions
    coinObjects.forEach(coin => {
        if (!coin.collected &&
            player.x < coin.x - cameraX + coin.width &&
            player.x + player.width > coin.x - cameraX &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            coins++;
            totalCoinsCollected++; // Track total coins for achievements
            score += 10;
            
            // Create coin particles
            createCoinParticles(coin.x - cameraX + coin.width / 2, coin.y + coin.height / 2);
            
            // Play coin sound
            playCoinSound();
        }
    });
    
    // Check obstacle collisions
    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x - cameraX + obstacle.width &&
            player.x + player.width > obstacle.x - cameraX &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            
            // Play collision sound
            playCollisionSound();
            
            if (playerPowerup.shield) {
                // Shield absorbs the hit
                playerPowerup.shield = false;
                // Remove the obstacle
                obstacles = obstacles.filter(o => o !== obstacle);
                return;
            }
            
            lives--;
            if (lives <= 0) {
                // Play game over sound
                playGameOverSound();
                gameOver();
            } else {
                // Remove the obstacle that was hit
                obstacles = obstacles.filter(o => o !== obstacle);
            }
        }
    });

    // Check power-up collisions
    powerUps.forEach(powerup => {
        if (!powerup.collected &&
            player.x < powerup.x - cameraX + powerup.width &&
            player.x + player.width > powerup.x - cameraX &&
            player.y < powerup.y + powerup.height &&
            player.y + player.height > powerup.y) {
            powerup.collected = true;
            totalPowerupsCollected++; // Track total power-ups for achievements
            switch(powerup.type) {
                case 'speed':
                    playerPowerup.speed = true;
                    playerPowerup.speedTimer = 300; // 5 seconds at 60fps
                    playPowerupSound();
                    break;
                case 'shield':
                    playerPowerup.shield = true;
                    playerPowerup.shieldTimer = 360; // 6 seconds
                    playPowerupSound();
                    break;
                case 'magnet':
                    playerPowerup.magnet = true;
                    playerPowerup.magnetTimer = 360; // 6 seconds
                    playPowerupSound();
                    break;
            }
        }
    });
}

// Update UI
function updateUI() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('coinsValue').textContent = coins;
    document.getElementById('livesValue').textContent = lives;
    updateAudioStatus();
    
    // Show active power-ups
    let powerupText = '';
    if (playerPowerup.speed) powerupText += 'Speed (' + Math.ceil(playerPowerup.speedTimer/60) + 's) ';
    if (playerPowerup.shield) powerupText += 'Shield (' + Math.ceil(playerPowerup.shieldTimer/60) + 's) ';
    if (playerPowerup.magnet) powerupText += 'Magnet (' + Math.ceil(playerPowerup.magnetTimer/60) + 's) ';
    let powerupDiv = document.getElementById('powerupStatus');
    if (!powerupDiv) {
        powerupDiv = document.createElement('div');
        powerupDiv.id = 'powerupStatus';
        powerupDiv.style.fontSize = '12px';
        powerupDiv.style.color = '#1976D2';
        powerupDiv.style.marginTop = '2px';
        document.getElementById('gameUI').appendChild(powerupDiv);
    }
    powerupDiv.textContent = powerupText.trim();

    // Show active special events
    let eventText = '';
    if (specialEvents.coinRain) eventText += 'COIN RAIN! ';
    if (specialEvents.bonusRound) eventText += 'BONUS ROUND! ';
    
    let eventDiv = document.getElementById('eventStatus');
    if (!eventDiv) {
        eventDiv = document.createElement('div');
        eventDiv.id = 'eventStatus';
        eventDiv.style.fontSize = '14px';
        eventDiv.style.color = '#FF6B35';
        eventDiv.style.fontWeight = 'bold';
        eventDiv.style.marginTop = '5px';
        eventDiv.style.textAlign = 'center';
        document.getElementById('gameUI').appendChild(eventDiv);
    }
    eventDiv.textContent = eventText;

    // Show distance meter
    let distanceDiv = document.getElementById('distanceStatus');
    if (!distanceDiv) {
        distanceDiv = document.createElement('div');
        distanceDiv.id = 'distanceStatus';
        distanceDiv.style.fontSize = '14px';
        distanceDiv.style.color = '#388e3c';
        distanceDiv.style.fontWeight = 'bold';
        distanceDiv.style.marginTop = '5px';
        distanceDiv.style.textAlign = 'center';
        document.getElementById('gameUI').appendChild(distanceDiv);
    }
    distanceDiv.textContent = `Distance: ${Math.floor(distance)} m | Best: ${Math.floor(bestDistance)} m`;
}

// Update audio status display
function updateAudioStatus() {
    const audioStatus = document.getElementById('audioStatus');
    if (audioStatus) {
        const coinAudio = audio.coin;
        const jumpAudio = audio.jump;
        const backgroundAudio = audio.background;
        
        if (coinAudio && jumpAudio && backgroundAudio) {
            audioStatus.textContent = 'Sound effects: Available | Music: Playing';
            audioStatus.style.color = '#4CAF50';
        } else if (audioContext) {
            audioStatus.textContent = 'Sound effects: Generated | Music: Generated';
            audioStatus.style.color = '#2196F3';
        } else {
            audioStatus.textContent = 'Sound effects: Not available | Music: Not available';
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
    
    // Draw ground
    drawGround();
    
    // Draw objects
    drawCoins();
    drawObstacles();
    drawPowerUps(); // Add this line to draw power-ups
    
    // Draw player
    drawPlayer();
    
    // Draw particles (on top of everything)
    drawParticles();
    
    // Update UI
    updateUI();
}

// Draw background
function drawBackground() {
    // Parallax background layers
    // Layer 1: Sky
    ctx.fillStyle = 'linear-gradient(to bottom, #87ceeb 0%, #b0e0e6 100%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layer 2: Distant mountains (slowest)
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = -1; i < 4; i++) {
        let offset = ((cameraX * 0.2) % canvas.width) + i * canvas.width;
        ctx.fillStyle = '#b0c4de';
        ctx.beginPath();
        ctx.moveTo(offset, canvas.height * 0.6);
        ctx.lineTo(offset + 200, canvas.height * 0.4);
        ctx.lineTo(offset + 400, canvas.height * 0.6);
        ctx.lineTo(offset + 600, canvas.height * 0.5);
        ctx.lineTo(offset + 800, canvas.height * 0.6);
        ctx.lineTo(offset + canvas.width, canvas.height);
        ctx.lineTo(offset, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Layer 3: Midground trees
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let i = -1; i < 4; i++) {
        let offset = ((cameraX * 0.4) % canvas.width) + i * canvas.width;
        ctx.fillStyle = '#228B22';
        ctx.fillRect(offset + 100, canvas.height * 0.55, 30, 100);
        ctx.fillRect(offset + 300, canvas.height * 0.5, 40, 120);
        ctx.fillRect(offset + 600, canvas.height * 0.6, 25, 80);
    }
    ctx.restore();

    // Layer 4: Foreground foliage (fastest)
    ctx.save();
    ctx.globalAlpha = 0.9;
    for (let i = -1; i < 4; i++) {
        let offset = ((cameraX * 0.7) % canvas.width) + i * canvas.width;
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(offset + 50, canvas.height * 0.7, 40, 0, Math.PI * 2);
        ctx.arc(offset + 200, canvas.height * 0.75, 30, 0, Math.PI * 2);
        ctx.arc(offset + 500, canvas.height * 0.72, 50, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
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
    ctx.save();
    ctx.filter = 'brightness(1.5) contrast(1.3) saturate(1.2)';
    
    // 360° rotation
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.angle);
    ctx.translate(-player.width/2, -player.height/2);
    
    // Sprint effect
    const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
    if (isSprinting && player.isMoving && player.onGround) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }
    
    // Draw animated sprite
    const frames = playerSprites[currentAnimation];
    if (frames && frames.length > 0 && frames[animationFrame]) {
        const currentFrame = frames[animationFrame];
        ctx.drawImage(
            currentFrame,
            0, 0,
            currentFrame.width, currentFrame.height,
            0, 0,
            player.width, player.height
        );
    } else {
        // Fallback to static sprites
        let sprite = sprites.jungle_girl;
        if (player.isMoving && player.onGround) {
            sprite = sprites.jungle_girl_run;
        }
        
        if (sprite && sprite.complete) {
            ctx.drawImage(
                sprite,
                0, 0,
                sprite.width, sprite.height,
                0, 0,
                player.width, player.height
            );
        } else {
            // Fallback rectangle
            if (isSprinting && player.isMoving && player.onGround) {
                ctx.fillStyle = '#FF4500';
            } else {
                ctx.fillStyle = '#FF6B6B';
            }
            ctx.fillRect(0, 0, player.width, player.height);
            ctx.fillStyle = '#333';
            ctx.fillRect(10, 10, 8, 8);
            ctx.fillRect(32, 10, 8, 8);
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(15, 25, 20, 10);
        }
    }
    
    ctx.restore();
}

// Draw coins
function drawCoins() {
    const coinSprite = sprites.banana_coin;
    coinObjects.forEach(coin => {
        if (!coin.collected) {
            // Apply camera offset for side-scrolling
            const drawX = coin.x - cameraX;
            
            // Only draw if coin is visible on screen
            if (drawX + coin.width > 0 && drawX < canvas.width) {
                if (coinSprite && coinSprite.complete) {
                    // Draw coin sprite with rotation effect
                    ctx.save();
                    ctx.translate(drawX + coin.width/2, coin.y + coin.height/2);
                    ctx.rotate(Date.now() * 0.003); // Rotate coins
                    ctx.drawImage(coinSprite, -coin.width/2, -coin.height/2, coin.width, coin.height);
                    ctx.restore();
                } else {
                    // Enhanced fallback coin graphics
                    const isGold = coin.type === 'gold';
                    ctx.fillStyle = isGold ? '#FFD700' : '#C0C0C0';
                    ctx.beginPath();
                    ctx.arc(drawX + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Coin shine effect
                    ctx.fillStyle = isGold ? '#FFF8DC' : '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(drawX + coin.width/2 - 3, coin.y + coin.height/2 - 3, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Coin symbol
                    ctx.fillStyle = isGold ? '#B8860B' : '#696969';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(isGold ? '$' : '¢', drawX + coin.width/2, coin.y + coin.height/2 + 5);
                    
                    // Pulsing effect
                    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
                    ctx.globalAlpha = 0.7 + pulse * 0.3;
                }
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
            ctx.drawImage(obstacleSprite, obstacle.x - cameraX, obstacle.y, obstacle.width, obstacle.height);
        } else {
            // Fallback to custom shapes based on category
            switch(obstacle.category) {
                case 'ground':
                    // Ground enemies (frogs, crabs, coconuts)
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(obstacle.x - cameraX, obstacle.y, obstacle.width, obstacle.height);
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(obstacle.x - cameraX + 5, obstacle.y + 5, obstacle.width - 10, 10);
                    ctx.fillRect(obstacle.x - cameraX + 5, obstacle.y + obstacle.height - 15, obstacle.width - 10, 10);
                    break;
                    
                case 'flying':
                    // Flying enemies (birds, bats)
                    ctx.fillStyle = '#2F4F4F';
                    ctx.beginPath();
                    ctx.ellipse(obstacle.x - cameraX + obstacle.width/2, obstacle.y + obstacle.height/2, 
                               obstacle.width/2, obstacle.height/2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Wings
                    ctx.fillStyle = '#696969';
                    ctx.beginPath();
                    ctx.ellipse(obstacle.x - cameraX + obstacle.width/4, obstacle.y + obstacle.height/2, 
                               obstacle.width/4, obstacle.height/3, 0, 0, Math.PI * 2);
                    ctx.ellipse(obstacle.x - cameraX + obstacle.width*3/4, obstacle.y + obstacle.height/2, 
                               obstacle.width/4, obstacle.height/3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'hazard':
                    // Spike pits
                    ctx.fillStyle = '#DC143C';
                    for (let i = 0; i < obstacle.width; i += 8) {
                        ctx.beginPath();
                        ctx.moveTo(obstacle.x - cameraX + i, obstacle.y + obstacle.height);
                        ctx.lineTo(obstacle.x - cameraX + i + 4, obstacle.y);
                        ctx.lineTo(obstacle.x - cameraX + i + 8, obstacle.y + obstacle.height);
                        ctx.closePath();
                        ctx.fill();
                    }
                    break;
                    
                case 'moving':
                    // Moving obstacles (rolling logs)
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(obstacle.x - cameraX, obstacle.y, obstacle.width, obstacle.height);
                    // Log texture
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < obstacle.height; i += 8) {
                        ctx.beginPath();
                        ctx.moveTo(obstacle.x - cameraX, obstacle.y + i);
                        ctx.lineTo(obstacle.x - cameraX + obstacle.width, obstacle.y + i);
                        ctx.stroke();
                    }
                    break;
                    
                default:
                    // Default fallback
                    ctx.fillStyle = '#A9A9A9';
                    ctx.fillRect(obstacle.x - cameraX, obstacle.y, obstacle.width, obstacle.height);
                    break;
            }
        }
    });
}

// Draw power-ups
function drawPowerUps() {
    powerUps.forEach(powerup => {
        if (!powerup.collected) {
            ctx.save();
            ctx.translate(powerup.x - cameraX + powerup.width/2, powerup.y + powerup.height/2);
            ctx.rotate(Date.now() * 0.002);
            ctx.translate(-powerup.width/2, -powerup.height/2);
            // Draw different shapes/colors for each type
            switch(powerup.type) {
                case 'speed':
                    ctx.fillStyle = '#00BFFF';
                    ctx.beginPath();
                    ctx.arc(powerup.width/2, powerup.height/2, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('S', powerup.width/2, powerup.height/2 + 7);
                    break;
                case 'shield':
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(powerup.width/2, powerup.height/2, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(powerup.width/2, powerup.height/2, 14, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('H', powerup.width/2, powerup.height/2 + 7);
                    break;
                case 'magnet':
                    ctx.fillStyle = '#FF6347';
                    ctx.beginPath();
                    ctx.arc(powerup.width/2, powerup.height/2, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('M', powerup.width/2, powerup.height/2 + 7);
                    break;
            }
            ctx.restore();
        }
    });
}

// Draw ground
function drawGround() {
    // Apply camera offset for side-scrolling
    const groundStartX = -cameraX;
    const groundEndX = canvas.width - cameraX;
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(groundStartX, groundY, groundEndX - groundStartX, canvas.height - groundY);
    
    // Draw grass on top
    ctx.fillStyle = '#228B22';
    ctx.fillRect(groundStartX, groundY, groundEndX - groundStartX, 10);
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    gameRunning = false;
    
    // Stop background music
    if (audio.background && !audio.background.paused) {
        audio.background.pause();
    }
    
    // Show game over screen briefly, then return to menu
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    // Show final distance
    let finalDistance = document.getElementById('finalDistance');
    if (!finalDistance) {
        finalDistance = document.createElement('p');
        finalDistance.id = 'finalDistance';
        document.getElementById('gameOverScreen').querySelector('.screen-content').appendChild(finalDistance);
    }
    finalDistance.textContent = `Distance: ${Math.floor(distance)} m | Best: ${Math.floor(bestDistance)} m`;

    // Add to leaderboard
    const position = addToLeaderboard(score, distance, coins);
    const leaderboardDiv = document.getElementById('leaderboard');
    if (leaderboardDiv) {
        leaderboardDiv.innerHTML = ''; // Clear previous entries
        leaderboard.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.innerHTML = `
                <span>${index + 1}.</span>
                <span>${entry.score}</span>
                <span>${entry.distance}m</span>
                <span>${entry.coins} coins</span>
                <span>${entry.date} ${entry.time}</span>
            `;
            leaderboardDiv.appendChild(entryDiv);
        });
    }

    // Return to main menu after 3 seconds
    setTimeout(() => {
        document.getElementById('gameOverScreen').style.display = 'none';
        showMainMenu();
    }, 3000);
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
    if (gameState !== 'playing') return;
    
    if (gamePaused) {
        // Resume game
        gamePaused = false;
        gameState = 'playing';
        document.getElementById('pauseScreen').style.display = 'none';
        
        // Resume background music
        if (audio.background && audio.background.paused) {
            audio.background.play().catch(e => console.log('Background music resume failed:', e));
        }
        
        gameLoop();
    } else {
        // Pause game
        gamePaused = true;
        gameState = 'paused';
        
        // Pause background music
        if (audio.background && !audio.background.paused) {
            audio.background.pause();
        }
        
        document.getElementById('pauseScreen').style.display = 'flex';
    }
}

// Resume game
function resumeGame() {
    gamePaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    gameLoop();
}

// Menu navigation functions
function showMainMenu() {
    gameState = 'menu';
    document.getElementById('mainMenuScreen').style.display = 'flex';
    document.getElementById('gameUI').classList.remove('show');
    document.getElementById('gameCanvas').style.display = 'none';
    // Stop background music
    if (audio.background && !audio.background.paused) {
        audio.background.pause();
    }
}

function hideMainMenu() {
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('gameUI').classList.add('show');
    document.getElementById('gameCanvas').style.display = 'block';
}

function showSettings() {
    document.getElementById('settingsScreen').style.display = 'flex';
    document.getElementById('mainMenuScreen').style.display = 'none';
}

function hideSettings() {
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('mainMenuScreen').style.display = 'flex';
}

function showTutorial() {
    document.getElementById('tutorialScreen').style.display = 'flex';
    document.getElementById('mainMenuScreen').style.display = 'none';
}

function hideTutorial() {
    document.getElementById('tutorialScreen').style.display = 'none';
    document.getElementById('mainMenuScreen').style.display = 'flex';
}

function showCredits() {
    document.getElementById('creditsScreen').style.display = 'flex';
    document.getElementById('mainMenuScreen').style.display = 'none';
}

function hideCredits() {
    document.getElementById('creditsScreen').style.display = 'none';
    document.getElementById('mainMenuScreen').style.display = 'flex';
}

// Settings functions
function updateMusicVolume() {
    const volume = document.getElementById('musicVolume').value;
    gameSettings.musicVolume = parseInt(volume);
    document.getElementById('musicVolumeValue').textContent = volume + '%';
    
    if (audio.background) {
        audio.background.volume = volume / 100;
    }
}

function updateSfxVolume() {
    const volume = document.getElementById('sfxVolume').value;
    gameSettings.sfxVolume = parseInt(volume);
    document.getElementById('sfxVolumeValue').textContent = volume + '%';
}

function updateDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    gameSettings.difficulty = difficulty;
    
    // Adjust game parameters based on difficulty
    switch(difficulty) {
        case 'easy':
            gameSpeed = 3;
            break;
        case 'normal':
            gameSpeed = 5;
            break;
        case 'hard':
            gameSpeed = 7;
            break;
    }
}

function toggleParticles() {
    const enabled = document.getElementById('particlesEnabled').checked;
    gameSettings.particlesEnabled = enabled;
}

// Check and unlock achievements
function checkAchievements() {
    // Update current values
    achievements.coins.current = totalCoinsCollected;
    achievements.distance.current = Math.floor(distance);
    achievements.powerups.current = totalPowerupsCollected;
    achievements.survival.current = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Check each achievement type
    Object.keys(achievements).forEach(type => {
        const achievement = achievements[type];
        achievement.milestones.forEach(milestone => {
            if (achievement.current >= milestone && !achievement.unlocked.includes(milestone)) {
                achievement.unlocked.push(milestone);
                showAchievementNotification(type, milestone);
            }
        });
    });
}

// Show achievement notification
function showAchievementNotification(type, milestone) {
    const messages = {
        coins: `🏆 Coin Collector: ${milestone} coins!`,
        distance: `🏃 Distance Runner: ${milestone}m!`,
        powerups: `⚡ Power Player: ${milestone} power-ups!`,
        survival: `⏱️ Survivor: ${milestone} seconds!`
    };
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #4CAF50, #45a049);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: bold;
        font-size: 16px;
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    notification.textContent = messages[type];
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Achievement screen functions
function showAchievements() {
    document.getElementById('achievementsScreen').style.display = 'flex';
    document.getElementById('mainMenuScreen').style.display = 'none';
    populateAchievements();
}

function hideAchievements() {
    document.getElementById('achievementsScreen').style.display = 'none';
    document.getElementById('mainMenuScreen').style.display = 'flex';
}

function populateAchievements() {
    // Populate each achievement category
    populateAchievementCategory('coinAchievements', 'coins');
    populateAchievementCategory('distanceAchievements', 'distance');
    populateAchievementCategory('powerupAchievements', 'powerups');
    populateAchievementCategory('survivalAchievements', 'survival');
}

function populateAchievementCategory(elementId, type) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    const achievement = achievements[type];
    achievement.milestones.forEach(milestone => {
        const isUnlocked = achievement.unlocked.includes(milestone);
        const div = document.createElement('div');
        div.className = 'achievement-item';
        div.style.cssText = `
            padding: 10px;
            margin: 5px 0;
            border-radius: 8px;
            background: ${isUnlocked ? '#4CAF50' : '#f0f0f0'};
            color: ${isUnlocked ? 'white' : '#666'};
            font-weight: ${isUnlocked ? 'bold' : 'normal'};
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        div.innerHTML = `
            <span>${milestone} ${getAchievementUnit(type)}</span>
            <span>${isUnlocked ? '✅' : '🔒'}</span>
        `;
        container.appendChild(div);
    });
}

function getAchievementUnit(type) {
    switch(type) {
        case 'coins': return 'coins';
        case 'distance': return 'm';
        case 'powerups': return 'power-ups';
        case 'survival': return 'seconds';
        default: return '';
    }
}

// Leaderboard screen functions
function showLeaderboard() {
    document.getElementById('leaderboardScreen').style.display = 'flex';
    document.getElementById('mainMenuScreen').style.display = 'none';
    populateFullLeaderboard();
}

function hideLeaderboard() {
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('mainMenuScreen').style.display = 'flex';
}

function populateFullLeaderboard() {
    const container = document.getElementById('fullLeaderboard');
    container.innerHTML = '';
    
    if (leaderboard.length === 0) {
        const noScores = document.createElement('div');
        noScores.className = 'no-scores';
        noScores.textContent = 'No scores yet! Play a game to set a record!';
        container.appendChild(noScores);
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'leaderboard-entry-full';
        entryDiv.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="score">${entry.score}</span>
            <span class="distance">${entry.distance}m</span>
            <span class="coins">${entry.coins}</span>
            <span class="date">${entry.date} ${entry.time}</span>
        `;
        container.appendChild(entryDiv);
    });
}

function clearLeaderboard() {
    if (confirm('Are you sure you want to clear all scores? This cannot be undone.')) {
        leaderboard = [];
        saveLeaderboard();
        populateFullLeaderboard();
    }
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