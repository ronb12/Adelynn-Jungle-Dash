// Adelynn Jungle Dash - Main Game Logic
// Assumes assets in /sprites and /audio

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width;
  let H = canvas.height;

  // Add this function after DOMContentLoaded and before any asset loading or game logic
  function showLandingPage() {
    const landingPage = document.getElementById('landingPage');
    const gameMenu = document.getElementById('gameMenu');
    if (landingPage) landingPage.style.display = 'flex';
    if (gameMenu) gameMenu.style.display = 'none';
  }

  // Add after DOMContentLoaded and after showLandingPage
  function showGameMenu() {
    const landingPage = document.getElementById('landingPage');
    const gameMenu = document.getElementById('gameMenu');
    if (landingPage) landingPage.style.display = 'none';
    if (gameMenu) gameMenu.style.display = 'flex';
  }

  function showGame() {
    const landingPage = document.getElementById('landingPage');
    const gameMenu = document.getElementById('gameMenu');
    if (landingPage) landingPage.style.display = 'none';
    if (gameMenu) gameMenu.style.display = 'none';
    resetGame();
    gameOver = false;
    gameStarted = true;
    gameStartTime = Date.now();
    loop();
  }

  // --- ASSET LOADING ---
  const assets = {
    player: new Image(),
    playerRun: new Image(),
    coin: new Image(),
    obstacle: new Image(),
    obstacle2: new Image(),
    obstacle3: new Image(),
    bg: new Image(),
    coinSound: new Audio(),
    jumpSound: new Audio(),
    magnet: new Image(),
    shield: new Image(),
  };

  // --- GAME CONSTANTS ---
  const GROUND_OFFSET = 40; // Change this value to adjust how high the player stands above the bottom
  let GROUND_Y = H - GROUND_OFFSET;
  const PLAYER_WIDTH = 120;
  const PLAYER_HEIGHT = 120;
  const PLAYER_FRAMES = 6; // Number of frames in the sprite sheet
  const PLAYER_ANIM_SPEED = 0.25; // Animation speed (normal speed)
  const COIN_SIZE = 40;
  const OBSTACLE_SIZE = 60;
  const LANES = [W/4, W/2, 3*W/4];
  const GRAVITY = 1.5;
  const JUMP_VEL = -18;
  const BG_SCROLL_SPEED = 8;
  const POWERUP_SIZE = 48;
  
  // Temple Run style enhancements
  const SWIPE_THRESHOLD = 50;
  const SLIDE_DURATION = 30;
  const WALL_RUN_DURATION = 45;
  const GAP_WIDTH = 120;
  const WALL_HEIGHT = 80;
  
  // Only use playerRun sprite for the player
  assets.player.src = 'sprites/player_run.png';
  assets.playerRun.src = 'sprites/player_run.png';

  // --- GAME STATE ---
  let player = {
    x: LANES[1] - PLAYER_WIDTH/2,
    y: GROUND_Y - PLAYER_HEIGHT, // Position player on ground properly
    vy: 0,
    lane: 1,
    jumping: false,
    frame: 0,
    frameTick: 0,
    invincible: false,
    invincibleTimer: 0,
    // Enhanced movement properties
    targetX: LANES[1] - PLAYER_WIDTH/2,
    moving: false,
    direction: 1, // 1 for right, -1 for left
    runSpeed: 0,
    maxRunSpeed: 12,
    acceleration: 1.0,
    deceleration: 0.5,
    // Temple Run style abilities
    sliding: false,
    slideTimer: 0,
    wallRunning: false,
    wallRunTimer: 0,
    wallRunSide: 0, // -1 for left wall, 1 for right wall
    canSlide: true,
    canWallRun: true,
  };
  let coins = [];
  let obstacles = [];
  let bgY = 0;
  let score = 0;
  let highScore = Number(localStorage.getItem('ajs_highscore') || 0);
  let soundOn = true;
  let powerups = [];
  let magnetActive = false, magnetTimer = 0;
  let shieldActive = false, shieldTimer = 0;
  let particles = [];
  let shakeTimer = 0;
  let gameSpeed = 1;
  let distance = 0;
  let combo = 0;
  let maxCombo = 0;
  let coinsCollected = 0;
  let obstaclesAvoided = 0;
  let screenShake = 0;
  let cameraY = 0;
  let parallaxLayers = [];
  let dustParticles = [];
  
  // Temple Run style enhancements
  let gaps = [];
  let walls = [];
  let fireTraps = [];
  let gestureStartX = 0;
  let gestureStartY = 0;
  let lastGestureTime = 0;
  let missionObjectives = [];
  let achievements = [];
  let currentMission = null;
  let missionProgress = 0;
  
  // Ensure player movement and animation speeds are normal
  player = {
    x: LANES[1] - PLAYER_WIDTH/2,
    y: GROUND_Y - PLAYER_HEIGHT,
    vy: 0,
    lane: 1,
    jumping: false,
    frame: 0,
    frameTick: 0,
    invincible: false,
    invincibleTimer: 0,
    targetX: LANES[1] - PLAYER_WIDTH/2,
    moving: false,
    direction: 1,
    runSpeed: 0,
    maxRunSpeed: 12,
    acceleration: 1.0,
    deceleration: 0.5,
    sliding: false,
    slideTimer: 0,
    wallRunning: false,
    wallRunTimer: 0,
    wallRunSide: 0,
    canSlide: true,
    canWallRun: true,
  };

  // Game state
  let gameStarted = false;
  let gamePaused = false;
  let gameOver = false;
  let lives = 25; // Add 25 lives
  let gameTime = 60; // 60 seconds for timed mode
  let gameMode = 'timed'; // 'timed' or 'endless'
  let timeRemaining = gameTime;
  let gameStartTime = 0;
  let coinMultiplier = 1;
  let coinMultiplierTimer = 0; // Frames remaining for multiplier

  // Initialize parallax layers for depth effect
  function initParallaxLayers() {
    parallaxLayers = [
      { y: 0, speed: 0.2, alpha: 0.3 }, // Far background
      { y: 0, speed: 0.5, alpha: 0.6 }, // Mid background
      { y: 0, speed: 0.8, alpha: 0.8 }, // Near background
    ];
  }

  // Enhanced particle system
  function createParticle(x, y, type) {
    const particle = {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -10 - 5,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.03,
      size: Math.random() * 4 + 2,
      color: type === 'coin' ? '#FFD700' : type === 'hit' ? '#FF4444' : type === 'multiplier' ? '#FFD700' : '#FFFFFF',
      emoji: type === 'multiplier' ? '⚡️' : undefined,
      type: type
    };
    particles.push(particle);
  }

  // Dust trail effect
  function createDustParticle() {
    if (player.jumping) return;
    const dust = {
      x: player.x + PLAYER_WIDTH/2 + (Math.random() - 0.5) * 20,
      y: GROUND_Y + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * -2,
      life: 0.8,
      decay: 0.01,
      size: Math.random() * 3 + 1,
      color: '#8B4513'
    };
    dustParticles.push(dust);
  }

  // --- INPUT HANDLING ---
  document.addEventListener('keydown', (e) => {
    if (!gameStarted || gamePaused) return;
    
    switch(e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft();
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight();
        break;
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        jump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        slide();
        break;
      case 'KeyQ':
        e.preventDefault();
        wallRun(-1); // Left wall run
        break;
      case 'KeyE':
        e.preventDefault();
        wallRun(1); // Right wall run
        break;
    }
  });

  // Temple Run style swipe gesture controls
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted || gamePaused) return;
    gestureStartX = e.touches[0].clientX;
    gestureStartY = e.touches[0].clientY;
    lastGestureTime = Date.now();
  });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!gameStarted || gamePaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - gestureStartX;
    const deltaY = touchEndY - gestureStartY;
    const gestureTime = Date.now() - lastGestureTime;
    
    // Only process if gesture was quick enough
    if (gestureTime < 300) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            moveRight();
          } else {
            moveLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY < 0) {
            jump();
          } else {
            slide();
          }
        }
      }
    }
  });

  // --- GAME LOGIC ---
  function resetGame() {
    player = {
      x: LANES[1] - PLAYER_WIDTH/2,
      y: GROUND_Y - PLAYER_HEIGHT, // Position player on ground properly
      vy: 0,
      lane: 1,
      jumping: false,
      frame: 0,
      frameTick: 0,
      invincible: false,
      invincibleTimer: 0,
      // Enhanced movement properties
      targetX: LANES[1] - PLAYER_WIDTH/2,
      moving: false,
      direction: 1, // 1 for right, -1 for left
      runSpeed: 0,
      maxRunSpeed: 12,
      acceleration: 1.0,
      deceleration: 0.5,
      // Temple Run style abilities
      sliding: false,
      slideTimer: 0,
      wallRunning: false,
      wallRunTimer: 0,
      wallRunSide: 0, // -1 for left wall, 1 for right wall
      canSlide: true,
      canWallRun: true,
    };
    coins = [];
    obstacles = [];
    powerups = [];
    particles = [];
    dustParticles = [];
    gaps = [];
    walls = [];
    fireTraps = [];
    bgY = 0;
    score = 0;
    distance = 0;
    combo = 0;
    maxCombo = 0;
    coinsCollected = 0;
    obstaclesAvoided = 0;
    gameOver = false;
    lives = 25; // Reset lives
    gameTime = 60; // Reset timer
    timeRemaining = gameTime;
    gameStartTime = 0;
    gameSpeed = 1;
    screenShake = 0;
    cameraY = 0;
    magnetActive = false;
    magnetTimer = 0;
    shieldActive = false;
    shieldTimer = 0;
    shakeTimer = 0;
    gestureStartX = 0;
    gestureStartY = 0;
    lastGestureTime = 0;
    initParallaxLayers();
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * LANES.length);
    const coin = {
      x: LANES[lane] - COIN_SIZE/2,
      y: -COIN_SIZE,
      lane: lane,
      collected: false,
      rotation: 0,
      bounce: 0
    };
    coins.push(coin);
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      createParticle(x, y, 'coin');
    }
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANES.length);
    const obstacleTypes = [assets.obstacle, assets.obstacle2, assets.obstacle3];
    const obstacle = {
      x: LANES[lane] - OBSTACLE_SIZE/2,
      y: -OBSTACLE_SIZE,
      lane: lane,
      type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)],
      rotation: 0
    };
    obstacles.push(obstacle);
  }

  function spawnPowerup() {
    if (Math.random() > 0.02) return; // 2% chance per frame
    
    const lane = Math.floor(Math.random() * LANES.length);
    const powerupTypes = ['magnet', 'shield', 'multiplier']; // Added 'multiplier'
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    const powerup = {
      x: LANES[lane] - POWERUP_SIZE/2,
      y: -POWERUP_SIZE,
      lane: lane,
      type: type,
      rotation: 0,
      value: type === 'multiplier' ? 2 : undefined // Added value for multiplier
    };
    powerups.push(powerup);
  }

  // Temple Run style obstacle spawning
  function spawnGap() {
    if (Math.random() > 0.995) return; // Rare spawn
    
    const gap = {
      x: W/2 - GAP_WIDTH/2,
      y: -50,
      width: GAP_WIDTH,
      height: 30,
      passed: false
    };
    gaps.push(gap);
  }

  function spawnWall() {
    if (Math.random() > 0.997) return; // Very rare spawn
    
    const side = Math.random() > 0.5 ? 1 : -1; // Left or right wall
    const wall = {
      x: side === 1 ? W - 20 : 0,
      y: -WALL_HEIGHT,
      width: 20,
      height: WALL_HEIGHT,
      side: side,
      passed: false
    };
    walls.push(wall);
  }

  function spawnFireTrap() {
    if (Math.random() > 0.996) return; // Rare spawn
    
    const lane = Math.floor(Math.random() * LANES.length);
    const fireTrap = {
      x: LANES[lane] - 30,
      y: -40,
      width: 60,
      height: 20,
      lane: lane,
      animation: 0,
      passed: false
    };
    fireTraps.push(fireTrap);
  }

  function update() {
    if (gamePaused || !gameStarted) return;

    // Debug: Check if gameOver is true at the start of update
    if (gameOver) {
      console.log('Game over detected in update function');
      return;
    }

    // Update game speed and distance
    gameSpeed += 0.001;
    distance += gameSpeed;
    
    // Update timer for timed mode
    if (gameMode === 'timed' && gameStarted && !gameOver) {
      timeRemaining = Math.max(0, gameTime - (Date.now() - gameStartTime) / 1000);
      if (timeRemaining <= 0) {
        // Time's up!
        gameOver = true;
        console.log('Time\'s up! Game over.');
        updateHighScore();
        showGameOverScreen();
        return;
      }
    }
    
    // Update player
    player.vy += GRAVITY;
    player.y += player.vy;
    
    if (player.y >= GROUND_Y - PLAYER_HEIGHT) {
      player.y = GROUND_Y - PLAYER_HEIGHT;
      player.vy = 0;
      player.jumping = false;
    }
    
    // Update player smooth movement
    if (player.moving) {
      const distanceToTarget = Math.abs(player.targetX - player.x);
      if (distanceToTarget > 1) {
        // Accelerate towards target
        player.runSpeed = Math.min(player.runSpeed + player.acceleration, player.maxRunSpeed);
        const moveDirection = player.targetX > player.x ? 1 : -1;
        player.x += moveDirection * player.runSpeed;
      } else {
        // Reached target, stop moving
        player.x = player.targetX;
        player.moving = false;
        player.runSpeed = 0;
      }
    } else {
      // Decelerate when not moving
      if (player.runSpeed > 0) {
        player.runSpeed = Math.max(0, player.runSpeed - player.deceleration);
      }
    }
    
    // Update player animation
    updatePlayerAnimation();
    
    // Update Temple Run style abilities
    if (player.sliding) {
      player.slideTimer--;
      if (player.slideTimer <= 0) {
        endSlide();
      }
    }
    
    if (player.wallRunning) {
      player.wallRunTimer--;
      if (player.wallRunTimer <= 0) {
        endWallRun();
      }
    }
    
    // Update invincibility
    if (player.invincible) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    // Update powerups
    if (magnetActive) {
      magnetTimer--;
      if (magnetTimer <= 0) magnetActive = false;
    }
    if (shieldActive) {
      shieldTimer--;
      if (shieldTimer <= 0) shieldActive = false;
    }
    // Update coin multiplier timer
    if (coinMultiplierTimer > 0) {
      coinMultiplierTimer--;
      if (coinMultiplierTimer === 0) {
        coinMultiplier = 1;
      }
    }
    
    // Update screen shake
    if (screenShake > 0) {
      screenShake *= 0.9;
    }
    
    // Update camera
    cameraY = Math.sin(Date.now() * 0.01) * 2;
    
    // Update parallax layers
    parallaxLayers.forEach(layer => {
      layer.y += layer.speed * gameSpeed;
      if (layer.y > H) layer.y = 0;
    });
    
    // Update dust particles
    dustParticles.forEach((dust, index) => {
      dust.x += dust.vx;
      dust.y += dust.vy;
      dust.life -= dust.decay;
      if (dust.life <= 0) {
        dustParticles.splice(index, 1);
      }
    });
    
    // Update particles
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3; // gravity
      particle.life -= particle.decay;
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    });
    
    // Update background
    bgY += BG_SCROLL_SPEED * gameSpeed;
    if (bgY >= H) bgY = 0;
    
    // Spawn objects
    if (Math.random() > 0.98) spawnCoin();
    if (Math.random() > 0.998 && distance > 100) { // Only spawn obstacles after 100 distance units
      console.log('Spawning obstacle at distance:', distance);
      spawnObstacle();
    }
    spawnPowerup();
    
    // Spawn Temple Run style obstacles
    if (distance > 150) spawnGap();
    if (distance > 200) spawnWall();
    if (distance > 120) spawnFireTrap();
    
    // Update coins
    coins.forEach((coin, index) => {
      coin.y += 8 * gameSpeed;
      coin.rotation += 0.1;
      coin.bounce = Math.sin(Date.now() * 0.01 + index) * 3;
      
      // Magnet effect
      if (magnetActive && !coin.collected) {
        const dx = player.x + PLAYER_WIDTH/2 - coin.x - COIN_SIZE/2;
        const dy = player.y + PLAYER_HEIGHT/2 - coin.y - COIN_SIZE/2;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < 150) {
          coin.x += dx * 0.1;
          coin.y += dy * 0.1;
        }
      }
      
      // Check collision
      if (!coin.collected && 
          player.x < coin.x + COIN_SIZE &&
          player.x + PLAYER_WIDTH > coin.x &&
          player.y < coin.y + COIN_SIZE &&
          player.y + PLAYER_HEIGHT > coin.y) {
        coin.collected = true;
        score += 10 * (1 + combo * 0.1);
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        coinsCollected += coinMultiplier;
        if (soundOn) assets.coinSound.play();
        spawnParticles(coin.x + COIN_SIZE/2, coin.y + COIN_SIZE/2, '#FFD700');
        coins.splice(index, 1);
        
        // Remove Dora-style coin collection
      }
      
      // Remove off-screen coins
      if (coin.y > H + 50) {
        coins.splice(index, 1);
        combo = 0; // Reset combo if coin missed
      }
    });
    
    // Update obstacles
    obstacles.forEach((obstacle, index) => {
      obstacle.y += 8 * gameSpeed;
      obstacle.rotation += 0.05;
      
      // Check collision
      if (!player.invincible && !shieldActive &&
          player.x < obstacle.x + OBSTACLE_SIZE &&
          player.x + PLAYER_WIDTH > obstacle.x &&
          player.y < obstacle.y + OBSTACLE_SIZE &&
          player.y + PLAYER_HEIGHT > obstacle.y) {
        
        console.log('Collision detected!');
        console.log('Player position:', { x: player.x, y: player.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT });
        console.log('Obstacle position:', { x: obstacle.x, y: obstacle.y, size: OBSTACLE_SIZE });
        
        if (shieldActive) {
          // Shield blocks the hit
          createParticle(obstacle.x + OBSTACLE_SIZE/2, obstacle.y + OBSTACLE_SIZE/2, 'shield');
        } else {
          // Player gets hit - lose a life
          lives--;
          console.log(`Player hit obstacle - Lives remaining: ${lives}`);
          screenShake = 20;
          createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
          
          // Make player invincible briefly
          player.invincible = true;
          player.invincibleTimer = 120; // 2 seconds at 60fps
          
          if (lives <= 0) {
            // Game over when no lives left
            gameOver = true;
            updateHighScore();
            showGameOverScreen();
          }
        }
      }
      
      // Remove off-screen obstacles
      if (obstacle.y > H + 50) {
        obstacles.splice(index, 1);
        obstaclesAvoided++;
      }
    });
    
    // Update powerups
    powerups.forEach((powerup, index) => {
      powerup.y += 8 * gameSpeed;
      powerup.rotation += 0.1;
      
      // Check collision
      if (player.x < powerup.x + POWERUP_SIZE &&
          player.x + PLAYER_WIDTH > powerup.x &&
          player.y < powerup.y + POWERUP_SIZE &&
          player.y + PLAYER_HEIGHT > powerup.y) {
        
        if (powerup.type === 'magnet') {
          magnetActive = true;
          magnetTimer = 300; // 5 seconds at 60fps
          createParticle(powerup.x + POWERUP_SIZE/2, powerup.y + POWERUP_SIZE/2, 'magnet');
        } else if (powerup.type === 'shield') {
          shieldActive = true;
          shieldTimer = 300; // 5 seconds at 60fps
          createParticle(powerup.x + POWERUP_SIZE/2, powerup.y + POWERUP_SIZE/2, 'shield');
        } else if (powerup.type === 'multiplier') {
          coinMultiplier = powerup.value || 2;
          coinMultiplierTimer = 600; // 10 seconds at 60fps
          createParticle(powerup.x + POWERUP_SIZE/2, powerup.y + POWERUP_SIZE/2, 'multiplier');
        }
        
        powerups.splice(index, 1);
        
        // Remove Dora-style powerup collection
      }
      
      // Remove off-screen powerups
      if (powerup.y > H + 50) {
        powerups.splice(index, 1);
      }
    });
    
    // Update Temple Run style obstacles
    // Update gaps
    gaps.forEach((gap, index) => {
      gap.y += 8 * gameSpeed;
      
      // Check if player falls into gap
      if (!player.jumping && !gap.passed &&
          player.x + PLAYER_WIDTH/2 > gap.x &&
          player.x + PLAYER_WIDTH/2 < gap.x + gap.width &&
          player.y + PLAYER_HEIGHT > gap.y &&
          player.y + PLAYER_HEIGHT < gap.y + gap.height) {
        lives--;
        console.log(`Player fell into gap - Lives remaining: ${lives}`);
        screenShake = 15;
        createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
        
        // Make player invincible briefly
        player.invincible = true;
        player.invincibleTimer = 120;
        
        if (lives <= 0) {
          gameOver = true;
          updateHighScore();
          showGameOverScreen();
        }
      }
      
      // Mark gap as passed
      if (gap.y > player.y + PLAYER_HEIGHT && !gap.passed) {
        gap.passed = true;
        obstaclesAvoided++;
      }
      
      // Remove off-screen gaps
      if (gap.y > H + 50) {
        gaps.splice(index, 1);
      }
    });
    
    // Update walls
    walls.forEach((wall, index) => {
      wall.y += 8 * gameSpeed;
      
      // Check collision with wall
      if (!player.wallRunning && !wall.passed &&
          player.x < wall.x + wall.width &&
          player.x + PLAYER_WIDTH > wall.x &&
          player.y < wall.y + wall.height &&
          player.y + PLAYER_HEIGHT > wall.y) {
        
        // Check if player can wall run
        if (wall.side === -1 && player.lane === 0) {
          wallRun(-1);
        } else if (wall.side === 1 && player.lane === 2) {
          wallRun(1);
        } else {
          lives--;
          console.log(`Player hit wall - Lives remaining: ${lives}`);
          screenShake = 20;
          createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
          
          // Make player invincible briefly
          player.invincible = true;
          player.invincibleTimer = 120;
          
          if (lives <= 0) {
            gameOver = true;
            updateHighScore();
            showGameOverScreen(); // Show the HTML game over screen
          }
        }
      }
      
      // Mark wall as passed
      if (wall.y > player.y + PLAYER_HEIGHT && !wall.passed) {
        wall.passed = true;
        obstaclesAvoided++;
      }
      
      // Remove off-screen walls
      if (wall.y > H + 50) {
        walls.splice(index, 1);
      }
    });
    
    // Update fire traps
    fireTraps.forEach((fireTrap, index) => {
      fireTrap.y += 8 * gameSpeed;
      fireTrap.animation += 0.2;
      
      // Check collision with fire trap
      if (!player.sliding && !fireTrap.passed &&
          player.x < fireTrap.x + fireTrap.width &&
          player.x + PLAYER_WIDTH > fireTrap.x &&
          player.y < fireTrap.y + fireTrap.height &&
          player.y + PLAYER_HEIGHT > fireTrap.y) {
        
        if (shieldActive) {
          // Shield blocks the fire
          createParticle(fireTrap.x + fireTrap.width/2, fireTrap.y + fireTrap.height/2, 'shield');
        } else {
          lives--;
          console.log(`Player hit fire trap - Lives remaining: ${lives}`);
          screenShake = 15;
          createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
          
          // Make player invincible briefly
          player.invincible = true;
          player.invincibleTimer = 120;
          
          if (lives <= 0) {
            gameOver = true;
            updateHighScore();
            showGameOverScreen();
          }
        }
      }
      
      // Mark fire trap as passed
      if (fireTrap.y > player.y + PLAYER_HEIGHT && !fireTrap.passed) {
        fireTrap.passed = true;
        obstaclesAvoided++;
      }
      
      // Remove off-screen fire traps
      if (fireTrap.y > H + 50) {
        fireTraps.splice(index, 1);
      }
    });
    
    // Update score
    score += gameSpeed;
  }

  // --- LOAD PLAYER SPRITE ---
  // const playerSprite = new Image(); // This line is no longer needed
  // playerSprite.src = 'sprites/player_run.png'; // This line is no longer needed

  // --- UPDATE PLAYER ANIMATION ---
  function updatePlayerAnimation() {
    if (!player.jumping) {
      player.frameTick++;
      if (player.frameTick >= 6) { // Faster animation when running
        player.frame = (player.frame + 1) % PLAYER_FRAMES;
        player.frameTick = 0;
      }
    } else {
      player.frame = 0; // Optionally use a different frame for jumping
    }
  }

  // --- DRAW PLAYER ---
  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.drawImage(
      assets.playerRun,
      player.frame * PLAYER_WIDTH, 0, // Source x, y
      PLAYER_WIDTH, PLAYER_HEIGHT,    // Source w, h
      0, 0,                          // Dest x, y
      PLAYER_WIDTH, PLAYER_HEIGHT    // Dest w, h
    );
    ctx.restore();
  }

  function draw() {
    // Only draw game content if the game is actually running
    if (!gameStarted || gameOver) {
      // Clear canvas with a simple background when not playing
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // Clear canvas
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, W, H);
    
    // Draw parallax background layers
    parallaxLayers.forEach((layer, index) => {
      ctx.globalAlpha = layer.alpha;
      ctx.drawImage(assets.bg, 0, layer.y, W, H);
      ctx.drawImage(assets.bg, 0, layer.y - H, W, H);
    });
    ctx.globalAlpha = 1;
    
    // Draw main background
    ctx.drawImage(assets.bg, 0, bgY, W, H);
    ctx.drawImage(assets.bg, 0, bgY - H, W, H);
    
    // Draw dust particles
    dustParticles.forEach(dust => {
      ctx.globalAlpha = dust.life;
      ctx.fillStyle = dust.color;
      ctx.fillRect(dust.x, dust.y, dust.size, dust.size);
    });
    ctx.globalAlpha = 1;
    
    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      if (particle.emoji) {
        ctx.font = `${particle.size * 3}px Arial`;
        ctx.fillText(particle.emoji, particle.x, particle.y);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
        ctx.fillStyle = particle.color;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    
    // Draw coins
    coins.forEach(coin => {
      ctx.save();
      ctx.translate(coin.x + COIN_SIZE/2, coin.y + COIN_SIZE/2 + coin.bounce);
      ctx.rotate(coin.rotation);
      ctx.drawImage(assets.coin, -COIN_SIZE/2, -COIN_SIZE/2, COIN_SIZE, COIN_SIZE);
      ctx.restore();
    });
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.save();
      ctx.translate(obstacle.x + OBSTACLE_SIZE/2, obstacle.y + OBSTACLE_SIZE/2);
      ctx.rotate(obstacle.rotation);
      ctx.drawImage(obstacle.type, -OBSTACLE_SIZE/2, -OBSTACLE_SIZE/2, OBSTACLE_SIZE, OBSTACLE_SIZE);
      ctx.restore();
    });
    
    // Draw powerups
    powerups.forEach(powerup => {
      ctx.save();
      ctx.translate(powerup.x + POWERUP_SIZE/2, powerup.y + POWERUP_SIZE/2);
      ctx.rotate(powerup.rotation);
      
      if (powerup.type === 'magnet') {
        ctx.drawImage(assets.magnet, -POWERUP_SIZE/2, -POWERUP_SIZE/2, POWERUP_SIZE, POWERUP_SIZE);
      } else if (powerup.type === 'shield') {
        ctx.drawImage(assets.shield, -POWERUP_SIZE/2, -POWERUP_SIZE/2, POWERUP_SIZE, POWERUP_SIZE);
      } else if (powerup.type === 'multiplier') {
        ctx.font = `${POWERUP_SIZE * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡️', 0, 0);
      }
      
      ctx.restore();
    });
    
    // Draw Temple Run style obstacles
    // Draw gaps
    gaps.forEach(gap => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(gap.x, gap.y, gap.width, gap.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(gap.x, gap.y, gap.width, gap.height);
    });
    
    // Draw walls
    walls.forEach(wall => {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 3;
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
      
      // Add wall texture
      ctx.strokeStyle = '#A0522D';
      ctx.lineWidth = 1;
      for (let i = 0; i < wall.height; i += 10) {
        ctx.beginPath();
        ctx.moveTo(wall.x, wall.y + i);
        ctx.lineTo(wall.x + wall.width, wall.y + i);
        ctx.stroke();
      }
    });
    
    // Draw fire traps
    fireTraps.forEach(fireTrap => {
      // Animated fire effect
      const fireIntensity = Math.sin(fireTrap.animation) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, ${Math.floor(100 * fireIntensity)}, 0, ${fireIntensity})`;
      ctx.fillRect(fireTrap.x, fireTrap.y, fireTrap.width, fireTrap.height);
      
      // Fire particles
      for (let i = 0; i < 5; i++) {
        const particleX = fireTrap.x + Math.random() * fireTrap.width;
        const particleY = fireTrap.y + Math.random() * fireTrap.height;
        ctx.fillStyle = `rgba(255, ${Math.floor(200 + Math.random() * 55)}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw player
    drawPlayer();
    
    // Update HUD
    updateHUD();
    
    // Draw powerup indicators
    if (magnetActive) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.fillRect(W - 60, 10, 50, 50);
      ctx.drawImage(assets.magnet, W - 55, 15, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(magnetTimer/60)}s`, W - 35, 70);
    }
    
    if (shieldActive) {
      ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.fillRect(W - 60, 70, 50, 50);
      ctx.drawImage(assets.shield, W - 55, 75, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(shieldTimer/60)}s`, W - 35, 130);
    }
  }

  function loop() {
    if (!gamePaused && gameStarted && !gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // --- UTILITY FUNCTIONS ---
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    GROUND_Y = H - GROUND_OFFSET;
    LANES[0] = W/4;
    LANES[1] = W/2;
    LANES[2] = 3*W/4;
    player.x = LANES[player.lane] - PLAYER_WIDTH/2;
    // Ensure player stays on the ground after resize
    if (!player.jumping) player.y = GROUND_Y - PLAYER_HEIGHT;
  }

  window.addEventListener('resize', resize);
  resize();

  // --- ASSET LOADING ---
  let loaded = 0;
  const totalAssets = 11; // Updated to match actual number of assets with handlers
  let assetLoadTimeout;
  let failedAssets = [];
  
  function checkLoaded() {
    loaded++;
    console.log(`Asset loaded: ${loaded}/${totalAssets}`);
    if (loaded >= totalAssets) {
      clearTimeout(assetLoadTimeout);
      if (failedAssets.length > 0) {
        console.warn('Some assets failed to load:', failedAssets);
      }
      console.log('All assets loaded successfully!');
      showLandingPage(); // Changed from resetGame() to showLandingPage()
    }
  }
  
  function handleAssetError(assetName) {
    console.warn(`Failed to load asset: ${assetName}`);
    failedAssets.push(assetName);
    checkLoaded(); // Still count it as loaded to prevent hanging
  }
  
  // Set up a timeout to start the game even if some assets fail to load
  assetLoadTimeout = setTimeout(() => {
    console.warn('Asset loading timeout - starting game anyway');
    showLandingPage();
  }, 15000); // 15 second timeout
  
  // Set up load and error handlers for all assets BEFORE setting src
  assets.player.onload = checkLoaded;
  assets.player.onerror = () => handleAssetError('player');
  assets.playerRun.onload = checkLoaded;
  assets.playerRun.onerror = () => handleAssetError('playerRun');
  assets.coin.onload = checkLoaded;
  assets.coin.onerror = () => handleAssetError('coin');
  assets.obstacle.onload = checkLoaded;
  assets.obstacle.onerror = () => handleAssetError('obstacle');
  assets.obstacle2.onload = checkLoaded;
  assets.obstacle2.onerror = () => handleAssetError('obstacle2');
  assets.obstacle3.onload = checkLoaded;
  assets.obstacle3.onerror = () => handleAssetError('obstacle3');
  assets.bg.onload = checkLoaded;
  assets.bg.onerror = () => handleAssetError('bg');
  assets.magnet.onload = checkLoaded;
  assets.magnet.onerror = () => handleAssetError('magnet');
  assets.shield.onload = checkLoaded;
  assets.shield.onerror = () => handleAssetError('shield');
  assets.coinSound.oncanplaythrough = checkLoaded;
  assets.coinSound.onerror = () => handleAssetError('coinSound');
  assets.jumpSound.oncanplaythrough = checkLoaded;
  assets.jumpSound.onerror = () => handleAssetError('jumpSound');
  
  // NOW set the src properties after handlers are set up
  assets.player.src = 'sprites/player_run.png'; // Use player_run.png instead of missing player.png
  assets.playerRun.src = 'sprites/player_run.png';
  assets.coin.src = 'sprites/coin.png';
  assets.obstacle.src = 'sprites/obstacle.png';
  assets.obstacle2.src = 'sprites/obstacle2.png';
  assets.obstacle3.src = 'sprites/obstacle3.png';
  assets.bg.src = 'sprites/jungle_bg.png';
  assets.coinSound.src = 'audio/coin.wav';
  assets.jumpSound.src = 'audio/jump.wav';
  assets.magnet.src = 'sprites/magnet.png';
  assets.shield.src = 'sprites/shield.png';

  function updateHighScore() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('ajs_highscore', highScore.toString());
    }
  }

  // --- HUD UPDATE FUNCTIONS ---
  function updateHUD() {
    // Update score display
    const scoreElement = document.getElementById('score');
    if (scoreElement) scoreElement.textContent = `Score: ${Math.floor(score)}`;
    
    // Update distance display
    const distanceElement = document.getElementById('distance');
    if (distanceElement) distanceElement.textContent = `Distance: ${Math.floor(distance)}m`;
    
    // Update coins display
    const coinsElement = document.getElementById('coins');
    if (coinsElement) coinsElement.textContent = `Coins: ${coinsCollected}`;
    
    // Update combo display
    const comboElement = document.getElementById('combo');
    if (comboElement) comboElement.textContent = `Combo: ${combo}`;
    
    // Update lives display
    const livesElement = document.getElementById('lives');
    if (livesElement) livesElement.textContent = `Lives: ${lives}`;
    
    // Update timer display for timed mode
    const timerElement = document.getElementById('timer');
    if (timerElement && gameMode === 'timed') {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = Math.floor(timeRemaining % 60);
      timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update high score displays
    const landingHighScore = document.getElementById('landingHighScore');
    const menuHighScore = document.getElementById('menuHighScore');
    if (landingHighScore) landingHighScore.textContent = highScore;
    if (menuHighScore) menuHighScore.textContent = highScore;

    // Update multiplier display
    const multiplierElement = document.getElementById('multiplier');
    if (multiplierElement) multiplierElement.textContent = `Multiplier: x${coinMultiplier}`;
  }
}); 