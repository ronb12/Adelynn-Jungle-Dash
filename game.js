// Adelynn Jungle Dash - Main Game Logic
// Assumes assets in /sprites and /audio

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width;
  let H = canvas.height;

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
  const GROUND_Y = H - 120;
  const PLAYER_WIDTH = 100; // new player_run.png frame width
  const PLAYER_HEIGHT = 100; // new player_run.png frame height
  const PLAYER_FRAMES = 8; // new player_run.png has 8 frames horizontally
  const COIN_SIZE = 40;
  const OBSTACLE_SIZE = 60;
  const LANES = [W/4, W/2, 3*W/4];
  const GRAVITY = 1.2;
  const JUMP_VEL = -18;
  const BG_SCROLL_SPEED = 6;
  const POWERUP_SIZE = 48;
  
  // Temple Run style enhancements
  const SWIPE_THRESHOLD = 50;
  const SLIDE_DURATION = 30;
  const WALL_RUN_DURATION = 45;
  const GAP_WIDTH = 120;
  const WALL_HEIGHT = 80;
  
  // Dora-style character enhancements
  const CHARACTER_PERSONALITY = {
    name: "Adelynn",
    catchphrase: "Let's go!",
    voiceLines: {
      jump: ["Jump!", "Up we go!", "Wheeee!"],
      slide: ["Slide!", "Down we go!", "Whoosh!"],
      coin: ["Coins!", "Great job!", "Awesome!"],
      powerup: ["Power!", "Super!", "Amazing!"],
      danger: ["Watch out!", "Be careful!", "Look out!"],
      encouragement: ["You can do it!", "Keep going!", "You're doing great!"],
      spanish: ["¡Hola!", "¡Gracias!", "¡Perfecto!"]
    },
    educationalElements: {
      counting: true,
      colors: true,
      shapes: true,
      spanish: true,
      englishFirst: true // Show English first, then Spanish
    }
  };

  // --- GAME STATE ---
  let player = {
    x: LANES[1] - PLAYER_WIDTH/2,
    y: GROUND_Y - PLAYER_HEIGHT, // Fix: Position player on ground properly
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
    maxRunSpeed: 8,
    acceleration: 0.5,
    deceleration: 0.3,
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
  let gameOver = false;
  let gameStarted = false;
  let gamePaused = false;
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
  
  // Dora-style character enhancements
  let characterPersonality = CHARACTER_PERSONALITY;
  let voiceLineQueue = [];
  let lastVoiceTime = 0;
  let characterMood = 'happy'; // happy, excited, worried, proud
  let educationalCounters = {
    coinsCollected: 0,
    obstaclesAvoided: 0,
    combos: 0,
    distance: 0
  };
  let characterInteractions = {
    lastInteraction: 0,
    interactionCooldown: 300, // 5 seconds
    encouragementFrequency: 600 // 10 seconds
  };

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
      color: type === 'coin' ? '#FFD700' : type === 'hit' ? '#FF4444' : '#FFFFFF',
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

  // Dora-style character interaction functions
  function addVoiceLine(type) {
    const lines = characterPersonality.voiceLines[type];
    if (lines && lines.length > 0) {
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      voiceLineQueue.push({
        text: randomLine,
        type: type,
        time: Date.now()
      });
    }
  }

  function showCharacterSpeech(text, type = 'normal') {
    // Create speech bubble
    const speechBubble = document.createElement('div');
    speechBubble.className = 'speech-bubble';
    speechBubble.textContent = text;
    speechBubble.style.cssText = `
      position: absolute;
      top: ${player.y - 60}px;
      left: ${player.x + PLAYER_WIDTH/2}px;
      background: white;
      border: 2px solid #333;
      border-radius: 15px;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      z-index: 1000;
      transform: translateX(-50%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: speechFade 2s ease-in-out;
    `;
    
    document.body.appendChild(speechBubble);
    
    // Remove after animation
    setTimeout(() => {
      if (speechBubble.parentNode) {
        speechBubble.parentNode.removeChild(speechBubble);
      }
    }, 2000);
  }

  function updateCharacterMood() {
    const currentTime = Date.now();
    
    // Update mood based on game state
    if (combo > 5) {
      characterMood = 'excited';
    } else if (player.invincible) {
      characterMood = 'worried';
    } else if (score > highScore) {
      characterMood = 'proud';
    } else {
      characterMood = 'happy';
    }
    
    // Periodic encouragement (mostly English, occasional Spanish)
    if (currentTime - characterInteractions.lastInteraction > characterInteractions.encouragementFrequency) {
      // 80% English, 20% Spanish for gentle exposure
      if (Math.random() < 0.2) {
        addVoiceLine('spanish');
      } else {
        addVoiceLine('encouragement');
      }
      characterInteractions.lastInteraction = currentTime;
    }
  }

  function processVoiceLineQueue() {
    const currentTime = Date.now();
    
    // Process voice lines with cooldown
    if (voiceLineQueue.length > 0 && currentTime - lastVoiceTime > 1000) {
      const voiceLine = voiceLineQueue.shift();
      showCharacterSpeech(voiceLine.text, voiceLine.type);
      lastVoiceTime = currentTime;
    }
  }

  function addEducationalElement(type, value) {
    if (characterPersonality.educationalElements.counting) {
      // Count in English first, then Spanish
      const englishNumbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
      const spanishNumbers = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
      
      if (value <= 10) {
        const englishText = englishNumbers[value-1];
        const spanishText = spanishNumbers[value-1];
        showCharacterSpeech(`${englishText} (${spanishText})`, 'educational');
      }
    }
  }

  const pauseBtn = document.getElementById('pauseBtn');
  const soundBtn = document.getElementById('soundBtn');
  pauseBtn.onclick = () => {
    if (!gameStarted || gameOver) return;
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '▶️' : '⏸️';
    if (!gamePaused) loop();
  };
  soundBtn.onclick = () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    [assets.coinSound, assets.jumpSound].forEach(a => a.muted = !soundOn);
  };

  const helpBtn = document.getElementById('helpBtn');
  const instructionsModal = document.getElementById('instructionsModal');
  const closeInstructions = document.getElementById('closeInstructions');
  helpBtn.onclick = () => {
    instructionsModal.style.display = 'block';
  };
  closeInstructions.onclick = () => {
    instructionsModal.style.display = 'none';
  };
  window.onclick = function(event) {
    if (event.target === instructionsModal) {
      instructionsModal.style.display = 'none';
    }
  };

  // --- UI NAVIGATION ---
  function showLandingPage() {
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('gameMenu').style.display = 'none';
    document.getElementById('startBtn').style.display = 'none';
  }

  function showGameMenu() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('gameMenu').style.display = 'flex';
    document.getElementById('startBtn').style.display = 'none';
  }

  function showGame() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('gameMenu').style.display = 'none';
    document.getElementById('startBtn').style.display = 'none';
    resetGame();
    gameStarted = true;
    loop();
  }

  // --- BUTTON EVENT HANDLERS ---
  document.getElementById('playBtn').onclick = showGameMenu;
  document.getElementById('menuStartBtn').onclick = showGame;
  document.getElementById('menuHowToBtn').onclick = () => {
    instructionsModal.style.display = 'block';
  };
  document.getElementById('menuBackBtn').onclick = showLandingPage;
  document.getElementById('startBtn').onclick = () => {
    if (gameOver) {
      resetGame();
      gameStarted = true;
      loop();
    } else {
      gameStarted = true;
      hideStartButton();
      loop();
    }
  };

  function showStartButton() {
    document.getElementById('startBtn').style.display = 'block';
  }

  function hideStartButton() {
    document.getElementById('startBtn').style.display = 'none';
  }

  // --- GAME SCREENS ---
  function showStartScreen() {
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, W, H);
    
    // Draw background
    ctx.drawImage(assets.bg, 0, bgY, W, H);
    ctx.drawImage(assets.bg, 0, bgY - H, W, H);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Adelynn's Jungle Dash", W/2, H/2 - 50);
    
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('Click Start to Play!', W/2, H/2 + 20);
    
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(`High Score: ${highScore}`, W/2, H/2 + 60);
    
    showStartButton();
  }

  function showGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', W/2, H/2 - 80);
    
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText(`Score: ${score}`, W/2, H/2 - 40);
    ctx.fillText(`Distance: ${Math.floor(distance)}m`, W/2, H/2 - 10);
    ctx.fillText(`Coins: ${coinsCollected}`, W/2, H/2 + 20);
    ctx.fillText(`Max Combo: ${maxCombo}`, W/2, H/2 + 50);
    
    if (score > highScore) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText('NEW HIGH SCORE!', W/2, H/2 + 80);
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Click Start to Play Again', W/2, H/2 + 120);
    
    showStartButton();
  }

  // --- PLAYER CONTROLS ---
  function moveLeft() {
    if (player.lane > 0) {
      player.lane--;
      player.targetX = LANES[player.lane] - PLAYER_WIDTH/2;
      player.moving = true;
      player.direction = -1;
    }
  }

  function moveRight() {
    if (player.lane < LANES.length - 1) {
      player.lane++;
      player.targetX = LANES[player.lane] - PLAYER_WIDTH/2;
      player.moving = true;
      player.direction = 1;
    }
  }

  function jump() {
    if (!player.jumping && !player.sliding) {
      player.vy = JUMP_VEL;
      player.jumping = true;
      if (soundOn) assets.jumpSound.play();
      createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT, 'jump');
      addVoiceLine('jump');
    }
  }

  // Temple Run style abilities
  function slide() {
    if (!player.sliding && !player.jumping && player.canSlide) {
      player.sliding = true;
      player.slideTimer = SLIDE_DURATION;
      player.canSlide = false;
      createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT, 'slide');
      addVoiceLine('slide');
    }
  }

  function wallRun(side) {
    if (!player.wallRunning && !player.jumping && player.canWallRun) {
      player.wallRunning = true;
      player.wallRunTimer = WALL_RUN_DURATION;
      player.wallRunSide = side;
      player.canWallRun = false;
      player.x += side * 20; // Move slightly to the wall
      createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT, 'wallrun');
    }
  }

  function endSlide() {
    player.sliding = false;
    player.slideTimer = 0;
    setTimeout(() => { player.canSlide = true; }, 500);
  }

  function endWallRun() {
    player.wallRunning = false;
    player.wallRunTimer = 0;
    player.wallRunSide = 0;
    setTimeout(() => { player.canWallRun = true; }, 800);
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
      y: GROUND_Y - PLAYER_HEIGHT, // Fix: Position player on ground properly
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
      maxRunSpeed: 8,
      acceleration: 0.5,
      deceleration: 0.3,
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
    
    // Reset Dora-style character features
    voiceLineQueue = [];
    lastVoiceTime = 0;
    characterMood = 'happy';
    educationalCounters = {
      coinsCollected: 0,
      obstaclesAvoided: 0,
      combos: 0,
      distance: 0
    };
    characterInteractions = {
      lastInteraction: 0,
      interactionCooldown: 300,
      encouragementFrequency: 600
    };
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
    const powerupTypes = ['magnet', 'shield'];
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    const powerup = {
      x: LANES[lane] - POWERUP_SIZE/2,
      y: -POWERUP_SIZE,
      lane: lane,
      type: type,
      rotation: 0
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

    // Update game speed and distance
    gameSpeed += 0.001;
    distance += gameSpeed;
    
    // Update player
    player.vy += GRAVITY;
    player.y += player.vy;
    
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
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
    player.frameTick++;
    if (player.moving && player.runSpeed > 2) {
      // Only animate when moving fast enough
      if (player.frameTick >= 6) { // Faster animation when running
        player.frame = (player.frame + 1) % PLAYER_FRAMES;
        player.frameTick = 0;
      }
    } else {
      // Idle animation - stay on first frame
      player.frame = 0;
      player.frameTick = 0;
    }
    
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
    
    // Update Dora-style character features
    updateCharacterMood();
    processVoiceLineQueue();
    
    // Create dust particles
    if (Math.random() > 0.7 && player.moving && player.runSpeed > 3 && !player.jumping) {
      createDustParticle();
    }
    
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
    if (Math.random() > 0.995) spawnObstacle();
    spawnPowerup();
    
    // Spawn Temple Run style obstacles
    spawnGap();
    spawnWall();
    spawnFireTrap();
    
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
        coinsCollected++;
        if (soundOn) assets.coinSound.play();
        spawnParticles(coin.x + COIN_SIZE/2, coin.y + COIN_SIZE/2, '#FFD700');
        coins.splice(index, 1);
        
        // Dora-style coin collection
        addVoiceLine('coin');
        addEducationalElement('counting', coinsCollected);
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
        
        if (shieldActive) {
          // Shield blocks the hit
          createParticle(obstacle.x + OBSTACLE_SIZE/2, obstacle.y + OBSTACLE_SIZE/2, 'shield');
        } else {
          // Player gets hit
          gameOver = true;
          screenShake = 20;
          createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
          updateHighScore();
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
        }
        
        powerups.splice(index, 1);
        
        // Dora-style powerup collection
        addVoiceLine('powerup');
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
        gameOver = true;
        screenShake = 15;
        createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
        updateHighScore();
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
          gameOver = true;
          screenShake = 20;
          createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
          updateHighScore();
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
          gameOver = true;
          screenShake = 15;
          createParticle(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, 'hit');
          updateHighScore();
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

  function drawPlayer() {
    // Screen shake effect
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    
    // Invincibility flicker
    if (player.invincible && Math.floor(player.invincibleTimer / 5) % 2) {
      ctx.globalAlpha = 0.5;
    }
    
    // Save context for transformations
    ctx.save();
    ctx.translate(player.x + PLAYER_WIDTH/2 + shakeX, player.y + PLAYER_HEIGHT/2 + shakeY + cameraY);
    
    // Apply transformations based on player state
    if (player.sliding) {
      // Scale down for sliding effect
      ctx.scale(1.2, 0.6);
      ctx.globalAlpha = 0.8;
    } else if (player.wallRunning) {
      // Rotate for wall running effect
      ctx.rotate(player.wallRunSide * 0.3);
      ctx.scale(0.9, 1.1);
      ctx.globalAlpha = 0.9;
    }
    
    // Movement blur effect
    if (player.moving && player.runSpeed > 4 && !player.sliding && !player.wallRunning) {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(
        assets.playerRun,
        player.frame * PLAYER_WIDTH, 0,
        PLAYER_WIDTH, PLAYER_HEIGHT,
        -PLAYER_WIDTH/2 - player.direction * 5, -PLAYER_HEIGHT/2,
        PLAYER_WIDTH, PLAYER_HEIGHT
      );
      ctx.globalAlpha = 1;
    }
    
    // Draw the actual player sprite
    ctx.drawImage(
      assets.playerRun,
      player.frame * PLAYER_WIDTH, 0, // source x, y (frame)
      PLAYER_WIDTH, PLAYER_HEIGHT,    // source width, height
      -PLAYER_WIDTH/2, -PLAYER_HEIGHT/2, // destination x, y (centered)
      PLAYER_WIDTH, PLAYER_HEIGHT     // destination width, height
    );
    
    ctx.restore();
    
    // Shield effect
    if (shieldActive) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(assets.shield, 
        player.x - 8 + shakeX, player.y - 8 + shakeY + cameraY, 
        PLAYER_WIDTH + 16, PLAYER_HEIGHT + 16);
      ctx.globalAlpha = 1;
    }
    
    // Magnet effect
    if (magnetActive) {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(assets.magnet, 
        player.x - 20 + shakeX, player.y - 20 + shakeY + cameraY, 
        PLAYER_WIDTH + 40, PLAYER_HEIGHT + 40);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
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
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
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
    
    // Draw game over screen
    if (gameOver) {
      showGameOverScreen();
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
    LANES[0] = W/4;
    LANES[1] = W/2;
    LANES[2] = 3*W/4;
    player.x = LANES[player.lane] - PLAYER_WIDTH/2;
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
    
    // Update high score displays
    const landingHighScore = document.getElementById('landingHighScore');
    const menuHighScore = document.getElementById('menuHighScore');
    if (landingHighScore) landingHighScore.textContent = highScore;
    if (menuHighScore) menuHighScore.textContent = highScore;
  }
}); 