const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');

// Characters: cycle with 'C' - Human-like designs with body parts
const characters = [
  {
    name: 'Adelynn', 
    color: '#FFB6C1', // Skin tone
    secondaryColor: '#FF69B4', // Pink outfit
    hairColor: '#8B4513', // Brown hair
    eyeColor: '#4A90E2', // Blue eyes
    outfitColor: '#FF69B4', // Pink dress
    shoeColor: '#FF1493', // Pink shoes
    gloveColor: '#FFFFFF', // White gloves
    emoji: '👧',
    description: 'Brave jungle explorer'
  },
  {
    name: 'Zuri',    
    color: '#F4A460', // Skin tone
    secondaryColor: '#9370DB', // Purple outfit
    hairColor: '#000000', // Black hair
    eyeColor: '#8B0000', // Red eyes
    outfitColor: '#9370DB', // Purple robes
    shoeColor: '#4B0082', // Purple shoes
    gloveColor: '#FFFFFF', // White gloves
    emoji: '🧙‍♀️',
    description: 'Mystical forest guardian'
  },
  {
    name: 'Kai',     
    color: '#DEB887', // Skin tone
    secondaryColor: '#00CED1', // Teal outfit
    hairColor: '#FFD700', // Golden hair
    eyeColor: '#32CD32', // Green eyes
    outfitColor: '#00CED1', // Teal armor
    shoeColor: '#008B8B', // Teal shoes
    gloveColor: '#FFFFFF', // White gloves
    emoji: '🧙‍♂️',
    description: 'Ancient jungle warrior'
  }
];
let characterIndex = 0;

// Ground line
const groundHeight = 60;
const groundY = canvas.height - groundHeight;

// Player setup with enhanced Mario-style features
const player = {
  x: 80,
  y: groundY - 50,
  width: 35,
  height: 50,
  vx: 0,
  vy: 0,
  isOnGround: false,
  isOnPlatform: false,
  canJump: true,
  color: characters[characterIndex].color,
  secondaryColor: characters[characterIndex].secondaryColor,
  lives: Infinity, // Infinite lives for testing
  isInvincible: false,
  invincibleTimer: 0,
  powerUpState: 'normal', // normal, big, fire
  direction: 1, // 1 for right, -1 for left
  isRunning: false,
  isCrouching: false,
  // Animation states
  animationFrame: 0,
  walkCycle: 0,
  jumpFrame: 0,
  isMoving: false
};

// Platforms system - expanded world with interactive blocks
let platforms = [
  {x: 200, y: groundY - 120, width: 150, height: 20, type: 'normal'},
  {x: 400, y: groundY - 180, width: 120, height: 20, type: 'moving', moveSpeed: 1, moveRange: 100, startX: 400},
  {x: 600, y: groundY - 140, width: 100, height: 20, type: 'breakable'},
  {x: 300, y: groundY - 220, width: 80, height: 20, type: 'question', hasPowerUp: true},
  {x: 800, y: groundY - 160, width: 120, height: 20, type: 'normal'},
  {x: 1000, y: groundY - 200, width: 100, height: 20, type: 'moving', moveSpeed: -1, moveRange: 80, startX: 1000},
  {x: 1200, y: groundY - 140, width: 150, height: 20, type: 'normal'},
  {x: 1400, y: groundY - 180, width: 100, height: 20, type: 'question', hasPowerUp: true},
  {x: 1600, y: groundY - 120, width: 120, height: 20, type: 'breakable'},
  {x: 1800, y: groundY - 160, width: 100, height: 20, type: 'normal'},
  {x: 500, y: groundY - 280, width: 80, height: 20, type: 'coin', hasCoins: true, coinCount: 3},
  {x: 1100, y: groundY - 240, width: 80, height: 20, type: 'coin', hasCoins: true, coinCount: 5},
  {x: 1500, y: groundY - 200, width: 80, height: 20, type: 'coin', hasCoins: true, coinCount: 4}
];

// Power-ups - expanded world
let powerUps = [
  {x: 300, y: groundY - 240, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
  {x: 500, y: groundY - 200, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
  {x: 700, y: groundY - 160, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0},
  {x: 1000, y: groundY - 220, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
  {x: 1400, y: groundY - 200, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0}
];

// Enhanced enemy system with AI
const jungleAnimals = [
  {name: '🐯', color: '#ff9800', secondaryColor: '#ffb74d', speed: -2, behavior: 'patrol', jumpPower: 0},
  {name: '🐻', color: '#8d6e63', secondaryColor: '#a1887f', speed: -1.5, behavior: 'chase', jumpPower: 3},
  {name: '🐸', color: '#4caf50', secondaryColor: '#81c784', speed: -3, behavior: 'jump', jumpPower: 8},
  {name: '🐍', color: '#2e7d32', secondaryColor: '#66bb6a', speed: -2.5, behavior: 'patrol', jumpPower: 0},
  {name: '🦁', color: '#ff8f00', secondaryColor: '#ffb74d', speed: -2.2, behavior: 'chase', jumpPower: 5}
];

// Game state
let collectibles = [];
let enemies = [];
let projectiles = [];
let score = 0;
let coins = 0; // Coin counter
let level = 1;
let collectSpawnTimer = 0;
let enemySpawnTimer = 0;
let gameOver = false;
let gameWon = false;
let isPaused = false;

// Goal flag at the far right end of the expanded world
const goal = {
  x: 2000, // Much further to the right
  y: groundY - 100,
  width: 15,
  height: 100
};

// Input handling with enhanced controls
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  
  if (gameOver || isPaused) return;
  
  // Jump on Space or ArrowUp if can jump
  if ((e.code === 'Space' || e.code === 'ArrowUp') && player.canJump) {
    player.vy = -15;
    player.canJump = false;
    player.isOnGround = false;
    player.isOnPlatform = false;
    playJumpSound();
  }
  
  // Run with Shift
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    player.isRunning = true;
  }
  
  // Crouch with Down arrow
  if (e.code === 'ArrowDown') {
    player.isCrouching = true;
  }
  
  // Cycle characters on 'C' key
  if (e.code === 'KeyC') {
    characterIndex = (characterIndex + 1) % characters.length;
    player.color = characters[characterIndex].color;
    player.secondaryColor = characters[characterIndex].secondaryColor;
    updateScoreBoard();
  }
  
  // Fire projectile with 'X' (if fire power-up)
  if (e.code === 'KeyX' && player.powerUpState === 'fire') {
    shootProjectile();
  }
  
  // Pause with 'P'
  if (e.code === 'KeyP') {
    isPaused = !isPaused;
  }
  
  // Restart on 'R'
  if (e.code === 'KeyR' && (gameOver || gameWon)) {
    window.location.reload();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    player.isRunning = false;
  }
  
  if (e.code === 'ArrowDown') {
    player.isCrouching = false;
  }
});

function updateScoreBoard() {
  const progress = Math.min(100, Math.floor((player.x / goal.x) * 100));
  const char = characters[characterIndex];
  const powerUpText = player.powerUpState !== 'normal' ? ` | Power: ${player.powerUpState}` : '';
  const livesText = player.lives === Infinity ? '∞' : player.lives;
  const musicIcon = musicEnabled ? '🎵' : '🔇';
  scoreBoard.textContent = `Level: ${currentLevel}/${totalLevels} | Score: ${score} | Coins: ${coins} | Progress: ${progress}% | ${char.name}: ${char.description} | Lives: ${livesText} | Music: ${musicIcon}${powerUpText}`;
}

// Spawn a coin emoji with gravity
function spawnCollectible() {
  const size = 30;
  const collectible = {
    x: Math.random() * (canvas.width - size - 100) + 50,
    y: Math.random() * (groundY - 200) + 50,
    width: size,
    height: size,
    vy: 0,
    value: 1,
    emoji: '🪙',
    collected: false
  };
  collectibles.push(collectible);
}

// Enhanced enemy spawning with AI
function spawnEnemy() {
  const animal = jungleAnimals[Math.floor(Math.random() * jungleAnimals.length)];
  const size = 35;
  const enemy = {
    x: canvas.width,
    y: groundY - size,
    width: size,
    height: size,
    vx: animal.speed,
    vy: 0,
    color: animal.color,
    secondaryColor: animal.secondaryColor,
    emoji: animal.name,
    name: animal.name,
    behavior: animal.behavior,
    jumpPower: animal.jumpPower,
    isOnGround: true,
    patrolDirection: 1,
    lastJumpTime: 0
  };
  enemies.push(enemy);
}

// Shoot projectile (fire power-up)
function shootProjectile() {
  const projectile = {
    x: player.x + (player.direction === 1 ? player.width : 0),
    y: player.y + player.height / 2,
    width: 15,
    height: 10,
    vx: player.direction * 8,
    color: '#ff5722',
    emoji: '🔥'
  };
  projectiles.push(projectile);
}

// Platform collision detection with interactive blocks
function checkPlatformCollision() {
  player.isOnPlatform = false;
  
  for (let platform of platforms) {
    // Check if player is on top of platform
    if (player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + platform.height + 5 &&
        player.vy >= 0) {
      
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isOnPlatform = true;
      player.canJump = true;
      
      // Handle special platforms
      if (platform.type === 'breakable' && player.isRunning) {
        // Break the platform
        const index = platforms.indexOf(platform);
        platforms.splice(index, 1);
      }
      
      if (platform.type === 'question' && platform.hasPowerUp) {
        // Spawn power-up
        platform.hasPowerUp = false;
        const powerUp = {
          x: platform.x,
          y: platform.y - 30,
          width: 30,
          height: 30,
          type: 'mushroom',
          emoji: '🍄',
          collected: false,
          vy: 0
        };
        powerUps.push(powerUp);
      }
    }
    
    // Check if player hits block from below (interactive blocks)
    if (player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y <= platform.y + platform.height &&
        player.y + player.height >= platform.y &&
        player.vy < 0) {
      
      // Stop upward movement
      player.vy = 0;
      player.y = platform.y + platform.height;
      
      // Handle interactive blocks
      if (platform.type === 'coin' && platform.hasCoins) {
        // Spawn coins
        for (let i = 0; i < platform.coinCount; i++) {
          const coin = {
            x: platform.x + (i * 20),
            y: platform.y - 30 - (i * 10),
            width: 20,
            height: 20,
            vy: -8 - (i * 2),
            vx: (i - 1) * 2,
            value: 1,
            emoji: '🪙',
            collected: false
          };
          collectibles.push(coin);
        }
        platform.hasCoins = false;
        platform.coinCount = 0;
      }
      
      if (platform.type === 'question' && platform.hasPowerUp) {
        // Spawn power-up
        platform.hasPowerUp = false;
        const powerUp = {
          x: platform.x,
          y: platform.y - 30,
          width: 30,
          height: 30,
          type: 'mushroom',
          emoji: '🍄',
          collected: false,
          vy: -5
        };
        powerUps.push(powerUp);
      }
    }
  }
}

// Camera system for scrolling like Mario Bros
let cameraX = 0;
const cameraSpeed = 0.1; // Smooth camera following

// Enhanced update function with Mario-style features and camera
function update() {
  if (isPaused) return;
  
  // Handle invincibility
  if (player.isInvincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.isInvincible = false;
    }
  }
  
  // Horizontal movement with running
  const baseSpeed = 4;
  const runSpeed = 6;
  const moveSpeed = player.isRunning ? runSpeed : baseSpeed;
  
  player.vx = 0;
  player.isMoving = false;
  
  if (keys['ArrowLeft']) {
    player.vx = -moveSpeed;
    player.direction = -1;
    player.isMoving = true;
  }
  if (keys['ArrowRight']) {
    player.vx = moveSpeed;
    player.direction = 1;
    player.isMoving = true;
  }

  // Update animation cycles
  if (player.isMoving && player.isOnGround) {
    player.walkCycle += 0.2;
  } else {
    player.walkCycle = 0;
  }
  
  if (player.vy < 0) {
    player.jumpFrame += 0.1;
  } else {
    player.jumpFrame = 0;
  }

  // Crouching reduces speed
  if (player.isCrouching) {
    player.vx *= 0.5;
  }

  player.x += player.vx;

  // Camera follows player with smooth scrolling
  const targetCameraX = player.x - canvas.width / 2;
  cameraX += (targetCameraX - cameraX) * cameraSpeed;
  
  // Keep camera within world bounds
  cameraX = Math.max(0, Math.min(cameraX, 2000 - canvas.width));

  // Apply gravity and vertical movement
  player.vy += 0.8; // Slightly stronger gravity
  player.y += player.vy;

  // Ground collision
  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.isOnGround = true;
    player.canJump = true;
  } else {
    player.isOnGround = false;
  }

  // Platform collision
  checkPlatformCollision();

  // Keep player in world bounds (not just screen bounds)
  player.x = Math.max(0, Math.min(2000 - player.width, player.x));

  // Update platforms (moving platforms)
  platforms.forEach(platform => {
    if (platform.type === 'moving') {
      platform.x += platform.moveSpeed;
      if (platform.x > platform.startX + platform.moveRange || platform.x < platform.startX - platform.moveRange) {
        platform.moveSpeed *= -1;
      }
    }
  });

  // Update power-ups with gravity
  powerUps.forEach(powerUp => {
    if (!powerUp.collected) {
      powerUp.vy += 0.5;
      powerUp.y += powerUp.vy;
      
      // Stop when hitting ground or platforms
      if (powerUp.y + powerUp.height >= groundY) {
        powerUp.y = groundY - powerUp.height;
        powerUp.vy = 0;
      }
      
      // Platform collision for power-ups
      for (let platform of platforms) {
        if (powerUp.x < platform.x + platform.width &&
            powerUp.x + powerUp.width > platform.x &&
            powerUp.y + powerUp.height >= platform.y &&
            powerUp.y + powerUp.height <= platform.y + platform.height + 5 &&
            powerUp.vy >= 0) {
          powerUp.y = platform.y - powerUp.height;
          powerUp.vy = 0;
        }
      }
    }
  });

  // Update projectiles
  projectiles.forEach(projectile => {
    projectile.x += projectile.vx;
  });
  projectiles = projectiles.filter(p => p.x > cameraX - 100 && p.x < cameraX + canvas.width + 100);

  // Spawn collectibles and enemies
  collectSpawnTimer++;
  enemySpawnTimer++;
  if (collectSpawnTimer > 120) {
    spawnCollectible();
    collectSpawnTimer = 0;
  }
  if (enemySpawnTimer > 250) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }

  // Update coins with gravity
  collectibles.forEach(coin => {
    if (!coin.collected) {
      coin.vy += 0.3;
      coin.y += coin.vy;
      
      if (coin.y + coin.height >= groundY) {
        coin.y = groundY - coin.height;
        coin.vy = 0;
      }
    }
  });

  // Enhanced enemy AI
  enemies.forEach(enemy => {
    // Basic movement
    enemy.x += enemy.vx;
    
    // AI behaviors
    if (enemy.behavior === 'chase' && Math.abs(enemy.x - player.x) < 200) {
      // Chase player
      enemy.vx = enemy.x > player.x ? -Math.abs(enemy.vx) : Math.abs(enemy.vx);
    }
    
    if (enemy.behavior === 'jump' && enemy.isOnGround && Date.now() - enemy.lastJumpTime > 2000) {
      // Jump periodically
      enemy.vy = -enemy.jumpPower;
      enemy.lastJumpTime = Date.now();
    }
    
    // Apply gravity to enemies
    enemy.vy += 0.6;
    enemy.y += enemy.vy;
    
    // Ground collision for enemies
    if (enemy.y + enemy.height >= groundY) {
      enemy.y = groundY - enemy.height;
      enemy.vy = 0;
      enemy.isOnGround = true;
    } else {
      enemy.isOnGround = false;
    }
    
    // Platform collision for enemies
    for (let platform of platforms) {
      if (enemy.x < platform.x + platform.width &&
          enemy.x + enemy.width > platform.x &&
          enemy.y + enemy.height >= platform.y &&
          enemy.y + enemy.height <= platform.y + platform.height + 5 &&
          enemy.vy >= 0) {
        enemy.y = platform.y - enemy.height;
        enemy.vy = 0;
        enemy.isOnGround = true;
      }
    }
    
    // Patrol behavior - change direction at edges
    if (enemy.behavior === 'patrol') {
      if (enemy.x <= cameraX || enemy.x + enemy.width >= cameraX + canvas.width) {
        enemy.vx *= -1;
      }
    }
  });
  
  enemies = enemies.filter(enemy => enemy.x + enemy.width > cameraX - 100);

  // Check collectible collisions
  collectibles = collectibles.filter(item => {
    if (item.collected) return false;
    
    const isColliding =
      player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y;
    if (isColliding) {
      score += item.value;
      coins += item.value; // Track coins separately
      updateScoreBoard();
      item.collected = true;
      playCoinSound();
      return false;
    }
    return true;
  });

  // Check power-up collisions
  powerUps = powerUps.filter(powerUp => {
    if (powerUp.collected) return false;
    
    const isColliding =
      player.x < powerUp.x + powerUp.width &&
      player.x + player.width > powerUp.x &&
      player.y < powerUp.y + powerUp.height &&
      player.y + player.height > powerUp.y;
    if (isColliding) {
      powerUp.collected = true;
      
      // Apply power-up effects
      switch (powerUp.type) {
        case 'mushroom':
          if (player.powerUpState === 'normal') {
            player.powerUpState = 'big';
            player.height = 70;
          }
          break;
        case 'fireflower':
          player.powerUpState = 'fire';
          break;
        case 'star':
          player.isInvincible = true;
          player.invincibleTimer = 300; // 5 seconds at 60fps
          break;
      }
      
      updateScoreBoard();
      playPowerUpSound();
      return false;
    }
    return true;
  });

  // Check enemy collisions with Mario-style mechanics
  enemies.forEach(enemy => {
    const isColliding =
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y;
      
    if (isColliding && !player.isInvincible) {
      // Mario-style: jump on enemy to defeat it
      if (player.vy > 0 && player.y < enemy.y) {
        // Jumped on enemy
        const index = enemies.indexOf(enemy);
        enemies.splice(index, 1);
        player.vy = -10; // Bounce
        score += 100;
        updateScoreBoard();
        playEnemyDefeatSound();
      } else {
        // Hit enemy from side
        if (player.powerUpState === 'big') {
          player.powerUpState = 'normal';
          player.height = 50;
        } else if (player.powerUpState === 'fire') {
          player.powerUpState = 'big';
          player.height = 70;
        } else {
          player.lives--;
          player.isInvincible = true;
          player.invincibleTimer = 120; // 2 seconds
          
          if (player.lives <= 0) {
            gameOver = true;
          }
        }
        updateScoreBoard();
      }
    }
  });

  // Check projectile collisions with enemies
  projectiles.forEach(projectile => {
    enemies.forEach(enemy => {
      const isColliding =
        projectile.x < enemy.x + enemy.width &&
        projectile.x + projectile.width > enemy.x &&
        projectile.y < enemy.y + enemy.height &&
        projectile.y + projectile.height > enemy.y;
        
      if (isColliding) {
        const enemyIndex = enemies.indexOf(enemy);
        enemies.splice(enemyIndex, 1);
        const projectileIndex = projectiles.indexOf(projectile);
        projectiles.splice(projectileIndex, 1);
        score += 200;
        updateScoreBoard();
      }
    });
  });

  // Check if player reaches the goal
  if (!gameOver && player.x + player.width >= goal.x) {
    if (!gameWon) {
      gameWon = true;
      playVictoryMusic();
      
      // Check if there are more levels
      if (currentLevel < totalLevels) {
        // Show level completion message
        setTimeout(() => {
          loadLevel(currentLevel + 1);
        }, 3000);
      } else {
        // Game completed!
        setTimeout(() => {
          // Show final victory message
          alert('🎉 Congratulations! You completed all levels! 🎉');
        }, 3000);
      }
    }
  }
}

// Draw ground with camera offset
function drawGround() {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0 - cameraX, groundY, canvas.width + 200, groundHeight);
  
  // Draw grass on top
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0 - cameraX, groundY, canvas.width + 200, 10);
}

// Draw platforms with camera offset
function drawPlatforms() {
  platforms.forEach(platform => {
    const screenX = platform.x - cameraX;
    
    // Only draw if on screen
    if (screenX + platform.width > 0 && screenX < canvas.width) {
      switch (platform.type) {
        case 'normal':
          ctx.fillStyle = '#8B4513';
          break;
        case 'moving':
          ctx.fillStyle = '#FF6B35';
          break;
        case 'breakable':
          ctx.fillStyle = '#8B7355';
          break;
        case 'question':
          ctx.fillStyle = '#FFD700';
          // Draw question mark
          ctx.fillStyle = '#000';
          ctx.font = '20px Arial';
          ctx.fillText('?', screenX + platform.width/2 - 5, platform.y - 5);
          ctx.fillStyle = '#FFD700';
          break;
        case 'coin':
          ctx.fillStyle = '#FFD700';
          // Draw coin symbol
          ctx.fillStyle = '#000';
          ctx.font = '16px Arial';
          ctx.fillText('🪙', screenX + platform.width/2 - 8, platform.y - 5);
          ctx.fillStyle = '#FFD700';
          break;
      }
      
      ctx.fillRect(screenX, platform.y, platform.width, platform.height);
      
      // Draw platform border
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, platform.y, platform.width, platform.height);
    }
  });
}

// Draw power-ups with camera offset
function drawPowerUps() {
  powerUps.forEach(powerUp => {
    if (!powerUp.collected) {
      const screenX = powerUp.x - cameraX;
      
      // Only draw if on screen
      if (screenX + powerUp.width > 0 && screenX < canvas.width) {
        ctx.fillStyle = powerUp.color || '#FF0000';
        ctx.fillRect(screenX, powerUp.y, powerUp.width, powerUp.height);
        
        // Draw emoji
        ctx.font = '20px Arial';
        ctx.fillText(powerUp.emoji, screenX + 5, powerUp.y + 20);
      }
    }
  });
}

// Draw projectiles with camera offset
function drawProjectiles() {
  projectiles.forEach(projectile => {
    const screenX = projectile.x - cameraX;
    
    // Only draw if on screen
    if (screenX + projectile.width > 0 && screenX < canvas.width) {
      ctx.fillStyle = projectile.color;
      ctx.fillRect(screenX, projectile.y, projectile.width, projectile.height);
      
      // Draw fire emoji
      ctx.font = '12px Arial';
      ctx.fillText(projectile.emoji, screenX + 2, projectile.y + 8);
    }
  });
}

// Draw goal with camera offset
function drawGoal() {
  const screenX = goal.x - cameraX;
  
  // Only draw if on screen
  if (screenX + goal.width > 0 && screenX < canvas.width) {
    // Draw flag pole
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX, goal.y, goal.width, goal.height);
    
    // Draw flag
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(screenX + goal.width, goal.y, 40, 30);
    
    // Draw flag pattern
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(screenX + goal.width + 5, goal.y + 5, 30, 5);
    ctx.fillRect(screenX + goal.width + 5, goal.y + 15, 30, 5);
    
    // Draw flag pole top
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(screenX - 2, goal.y - 5, goal.width + 4, 10);
  }
}

// Draw player with camera offset - Human-like character design with rounded shapes
function drawPlayer() {
  const screenX = player.x - cameraX;
  const char = characters[characterIndex];
  
  // Only draw if on screen
  if (screenX + player.width > 0 && screenX < canvas.width) {
    // Draw character shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(screenX + 2, player.y + player.height + 2, player.width, 5);
    
    // Calculate body part positions with animation
    const headX = screenX + 8;
    const headY = player.y - 8;
    const headRadius = 10;
    
    const bodyX = screenX + 5;
    const bodyY = player.y + 12;
    const bodyWidth = player.width - 10;
    const bodyHeight = 25;
    
    const armX = screenX + 2;
    const armY = player.y + 15;
    const armWidth = 6;
    const armHeight = 20;
    
    const legX = screenX + 8;
    const legY = player.y + 35;
    const legWidth = 8;
    const legHeight = 15;
    
    const shoeX = screenX + 6;
    const shoeY = player.y + 48;
    const shoeWidth = 12;
    const shoeHeight = 4;
    
    // Walking animation for legs
    const walkOffset = player.isMoving ? Math.sin(player.walkCycle * 0.3) * 2 : 0;
    const leftLegY = legY + walkOffset;
    const rightLegY = legY - walkOffset;
    
    // Jumping animation for arms
    const jumpOffset = player.vy < 0 ? -3 : 0;
    const leftArmY = armY + jumpOffset;
    const rightArmY = armY + jumpOffset;
    
    // Draw legs (pants) with walking animation - ROUNDED
    ctx.fillStyle = '#4169E1'; // Blue pants like Mario
    // Left leg - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(legX, leftLegY, legWidth, legHeight, 3);
    ctx.fill();
    // Right leg - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(legX + 10, rightLegY, legWidth, legHeight, 3);
    ctx.fill();
    
    // Draw shoes with walking animation - ROUNDED
    ctx.fillStyle = char.shoeColor;
    // Left shoe - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(shoeX, leftLegY + legHeight, shoeWidth, shoeHeight, 2);
    ctx.fill();
    // Right shoe - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(shoeX + 10, rightLegY + legHeight, shoeWidth, shoeHeight, 2);
    ctx.fill();
    
    // Draw body (shirt/dress) - ROUNDED
    ctx.fillStyle = char.outfitColor;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 5);
    ctx.fill();
    
    // Draw arms (shirt sleeves) with jumping animation - ROUNDED
    ctx.fillStyle = char.outfitColor;
    // Left arm - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(armX, leftArmY, armWidth, armHeight, 3);
    ctx.fill();
    // Right arm - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(armX + player.width - 8, rightArmY, armWidth, armHeight, 3);
    ctx.fill();
    
    // Draw gloves with jumping animation - ROUNDED
    ctx.fillStyle = char.gloveColor;
    // Left glove - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(armX - 1, leftArmY + 15, armWidth + 2, 5, 2);
    ctx.fill();
    // Right glove - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(armX + player.width - 9, rightArmY + 15, armWidth + 2, 5, 2);
    ctx.fill();
    
    // Draw head with slight bobbing when walking - CIRCULAR
    const headBob = player.isMoving ? Math.sin(player.walkCycle * 0.3) * 1 : 0;
    ctx.fillStyle = char.color; // Skin tone
    ctx.beginPath();
    ctx.arc(headX + headRadius, headY + headRadius + headBob, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw hair with head bob - ROUNDED
    ctx.fillStyle = char.hairColor;
    // Hair base - rounded rectangle
    ctx.beginPath();
    ctx.roundRect(headX - 2, headY - 3 + headBob, headRadius * 2 + 4, 8, 4);
    ctx.fill();
    
    // Draw hair details (bangs) with head bob - ROUNDED
    ctx.beginPath();
    ctx.roundRect(headX + 2, headY - 1 + headBob, 6, 4, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(headX + 12, headY - 1 + headBob, 6, 4, 2);
    ctx.fill();
    
    // Character-specific headgear with head bob - ROUNDED
    if (char.name === 'Adelynn') {
      // Explorer hat - rounded
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(headX - 3, headY - 8 + headBob, headRadius * 2 + 6, 6, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(headX + 2, headY - 12 + headBob, 12, 8, 4);
      ctx.fill();
    } else if (char.name === 'Zuri') {
      // Magical hood - rounded
      ctx.fillStyle = '#4B0082';
      ctx.beginPath();
      ctx.roundRect(headX - 2, headY - 10 + headBob, headRadius * 2 + 4, 10, 5);
      ctx.fill();
      // Hood point - rounded
      ctx.beginPath();
      ctx.roundRect(headX + 8, headY - 15 + headBob, 4, 8, 2);
      ctx.fill();
    } else if (char.name === 'Kai') {
      // Warrior helmet - rounded
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.roundRect(headX - 2, headY - 6 + headBob, headRadius * 2 + 4, 6, 3);
      ctx.fill();
      // Helmet visor - rounded
      ctx.fillStyle = '#2F4F4F';
      ctx.beginPath();
      ctx.roundRect(headX + 4, headY - 2 + headBob, 12, 2, 1);
      ctx.fill();
    }
    
    // Draw eyes with head bob - ROUNDED
    ctx.fillStyle = char.eyeColor;
    const eyeX = player.direction === 1 ? headX + 4 : headX + 2;
    // Left eye - circle
    ctx.beginPath();
    ctx.arc(eyeX + 2, headY + 6 + headBob + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    // Right eye - circle
    ctx.beginPath();
    ctx.arc(eyeX + 10, headY + 6 + headBob + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eye pupils with head bob - CIRCULAR
    ctx.fillStyle = '#000';
    const pupilX = player.direction === 1 ? eyeX + 1 : eyeX + 2;
    // Left pupil - circle
    ctx.beginPath();
    ctx.arc(pupilX + 2, headY + 7 + headBob + 2, 1, 0, Math.PI * 2);
    ctx.fill();
    // Right pupil - circle
    ctx.beginPath();
    ctx.arc(pupilX + 10, headY + 7 + headBob + 2, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw nose with head bob - ROUNDED
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.roundRect(headX + 8, headY + 10 + headBob, 2, 2, 1);
    ctx.fill();
    
    // Draw mouth with head bob - ROUNDED
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.roundRect(headX + 6, headY + 14 + headBob, 6, 2, 1);
    ctx.fill();
    
    // Character-specific outfit details - ROUNDED
    if (char.name === 'Adelynn') {
      // Explorer vest - rounded
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(bodyX + 2, bodyY + 2, bodyWidth - 4, 8, 3);
      ctx.fill();
      // Vest buttons - circles
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(bodyX + 8 + 1.5, bodyY + 4 + 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bodyX + 8 + 1.5, bodyY + 8 + 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (char.name === 'Zuri') {
      // Magical robe details - rounded
      ctx.fillStyle = '#4B0082';
      ctx.beginPath();
      ctx.roundRect(bodyX + 2, bodyY + 2, bodyWidth - 4, 6, 3);
      ctx.fill();
      // Magical symbols - rounded
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.roundRect(bodyX + 8, bodyY + 4, 4, 4, 2);
      ctx.fill();
    } else if (char.name === 'Kai') {
      // Warrior armor details - rounded
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.roundRect(bodyX + 2, bodyY + 2, bodyWidth - 4, 8, 3);
      ctx.fill();
      // Armor plates - rounded
      ctx.fillStyle = '#2F4F4F';
      ctx.beginPath();
      ctx.roundRect(bodyX + 6, bodyY + 4, 8, 4, 2);
      ctx.fill();
    }
    
    // Draw belt - ROUNDED
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY + 22, bodyWidth, 3, 1);
    ctx.fill();
    
    // Character-specific accessories - ROUNDED
    if (char.name === 'Zuri') {
      // Magical staff - rounded
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(screenX + player.width - 2, player.y + 10, 3, 30, 1);
      ctx.fill();
      // Staff orb - circle
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(screenX + player.width - 4 + 3.5, player.y + 8 + 3.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (char.name === 'Kai') {
      // Warrior sword - rounded
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.roundRect(screenX - 8, player.y + 15, 3, 25, 1);
      ctx.fill();
      // Sword handle - rounded
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(screenX - 10, player.y + 35, 7, 5, 2);
      ctx.fill();
    }
    
    // Draw power-up indicator - ROUNDED
    if (player.powerUpState !== 'normal') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.roundRect(screenX - 5, headY - 10, player.width + 10, 5, 2);
      ctx.fill();
      
      // Draw power-up emoji
      let powerEmoji = '⭐';
      if (player.powerUpState === 'big') powerEmoji = '🍄';
      if (player.powerUpState === 'fire') powerEmoji = '🔥';
      
      ctx.font = '14px Arial';
      ctx.fillText(powerEmoji, screenX + 10, headY - 20);
    }
    
    // Draw invincibility effect - ROUNDED
    if (player.isInvincible && Math.floor(Date.now() / 100) % 2) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(screenX, player.y, player.width, player.height, 5);
      ctx.stroke();
      
      // Draw sparkle effect - circles
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(screenX - 1.5, headY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + player.width + 1.5, headY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX - 1.5, player.y + player.height + 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + player.width + 1.5, player.y + player.height + 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw running dust effect - ROUNDED
    if (player.isRunning && player.isOnGround) {
      ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(screenX - 5 - (i * 3) + 1, player.y + player.height + 2 + 1, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Draw collectibles with camera offset
function drawCollectibles() {
  collectibles.forEach(coin => {
    if (!coin.collected) {
      const screenX = coin.x - cameraX;
      
      // Only draw if on screen
      if (screenX + coin.width > 0 && screenX < canvas.width) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX, coin.y, coin.width, coin.height);
        
        // Draw coin emoji
        ctx.font = '20px Arial';
        ctx.fillText(coin.emoji, screenX + 5, coin.y + 20);
      }
    }
  });
}

// Draw enemies with camera offset
function drawEnemies() {
  enemies.forEach(enemy => {
    const screenX = enemy.x - cameraX;
    
    // Only draw if on screen
    if (screenX + enemy.width > 0 && screenX < canvas.width) {
      // Draw enemy body
      ctx.fillStyle = enemy.color;
      ctx.fillRect(screenX, enemy.y, enemy.width, enemy.height);
      
      // Draw enemy details
      ctx.fillStyle = enemy.secondaryColor;
      ctx.fillRect(screenX + 5, enemy.y + 5, enemy.width - 10, 10);
      
      // Draw enemy emoji
      ctx.font = '20px Arial';
      ctx.fillText(enemy.emoji, screenX + 8, enemy.y + 20);
    }
  });
}

// Draw background with parallax scrolling
function drawBackground() {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#98FB98');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw clouds with parallax (move slower than camera)
  ctx.fillStyle = '#FFFFFF';
  const cloudOffset = cameraX * 0.3;
  
  // Cloud 1
  ctx.beginPath();
  ctx.arc(100 - cloudOffset, 80, 30, 0, Math.PI * 2);
  ctx.arc(130 - cloudOffset, 80, 25, 0, Math.PI * 2);
  ctx.arc(160 - cloudOffset, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  
  // Cloud 2
  ctx.beginPath();
  ctx.arc(400 - cloudOffset, 120, 25, 0, Math.PI * 2);
  ctx.arc(430 - cloudOffset, 120, 20, 0, Math.PI * 2);
  ctx.arc(460 - cloudOffset, 120, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // Cloud 3
  ctx.beginPath();
  ctx.arc(700 - cloudOffset, 60, 20, 0, Math.PI * 2);
  ctx.arc(730 - cloudOffset, 60, 15, 0, Math.PI * 2);
  ctx.arc(760 - cloudOffset, 60, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw distant mountains with parallax (move even slower)
  const mountainOffset = cameraX * 0.1;
  ctx.fillStyle = '#8B7355';
  
  // Mountain 1
  ctx.beginPath();
  ctx.moveTo(0 - mountainOffset, groundY);
  ctx.lineTo(200 - mountainOffset, groundY - 100);
  ctx.lineTo(400 - mountainOffset, groundY);
  ctx.closePath();
  ctx.fill();
  
  // Mountain 2
  ctx.beginPath();
  ctx.moveTo(300 - mountainOffset, groundY);
  ctx.lineTo(500 - mountainOffset, groundY - 80);
  ctx.lineTo(700 - mountainOffset, groundY);
  ctx.closePath();
  ctx.fill();
  
  // Mountain 3
  ctx.beginPath();
  ctx.moveTo(600 - mountainOffset, groundY);
  ctx.lineTo(800 - mountainOffset, groundY - 120);
  ctx.lineTo(1000 - mountainOffset, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawPauseScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '24px Arial';
  ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  drawBackground();
  
  // Draw ground, platforms, and goal
  drawGround();
  drawPlatforms();
  drawGoal();

  // Draw game objects
  drawCollectibles();
  drawPowerUps();
  drawProjectiles();
  drawEnemies();
  drawPlayer();

  // Overlay messages if win, game over, or paused
  if (isPaused) {
    drawPauseScreen();
  } else if (gameWon) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 You reached the flag! 🎉', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press R to play again', canvas.width / 2, canvas.height / 2 + 50);
  } else if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
  }
}

function gameLoop() {
  if (!gameOver && !isPaused) {
    update();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// Audio system with background music
let audioContext;
let backgroundMusic = null;
let musicEnabled = true;

// Initialize audio context
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.log('Audio not supported');
  }
}

// Background music system
function createBackgroundMusic() {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Create a simple melody
  const melody = [
    { freq: 523, duration: 0.5 }, // C
    { freq: 587, duration: 0.5 }, // D
    { freq: 659, duration: 0.5 }, // E
    { freq: 698, duration: 0.5 }, // F
    { freq: 784, duration: 0.5 }, // G
    { freq: 880, duration: 0.5 }, // A
    { freq: 988, duration: 0.5 }, // B
    { freq: 1047, duration: 0.5 } // C
  ];
  
  let time = audioContext.currentTime;
  melody.forEach((note, index) => {
    oscillator.frequency.setValueAtTime(note.freq, time);
    gainNode.gain.setValueAtTime(0.1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
    time += note.duration;
  });
  
  oscillator.start();
  oscillator.stop(time);
  
  return oscillator;
}

// Victory music when reaching the flag
function playVictoryMusic() {
  if (!audioContext || !musicEnabled) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Victory fanfare
  const victoryNotes = [
    { freq: 659, duration: 0.3 }, // E
    { freq: 784, duration: 0.3 }, // G
    { freq: 988, duration: 0.3 }, // B
    { freq: 1319, duration: 0.6 }, // E (high)
    { freq: 988, duration: 0.3 }, // B
    { freq: 1319, duration: 0.6 } // E (high)
  ];
  
  let time = audioContext.currentTime;
  victoryNotes.forEach((note, index) => {
    oscillator.frequency.setValueAtTime(note.freq, time);
    gainNode.gain.setValueAtTime(0.2, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
    time += note.duration;
  });
  
  oscillator.start();
  oscillator.stop(time);
}

// Level system
let currentLevel = 1;
const totalLevels = 3;

// Level configurations
const levelConfigs = {
  1: {
    goalX: 2000,
    platforms: [
      {x: 200, y: groundY - 120, width: 150, height: 20, type: 'normal'},
      {x: 400, y: groundY - 180, width: 120, height: 20, type: 'moving', moveSpeed: 1, moveRange: 100, startX: 400},
      {x: 600, y: groundY - 140, width: 100, height: 20, type: 'breakable'},
      {x: 300, y: groundY - 220, width: 80, height: 20, type: 'question', hasPowerUp: true},
      {x: 800, y: groundY - 160, width: 120, height: 20, type: 'normal'},
      {x: 1000, y: groundY - 200, width: 100, height: 20, type: 'moving', moveSpeed: -1, moveRange: 80, startX: 1000},
      {x: 1200, y: groundY - 140, width: 150, height: 20, type: 'normal'},
      {x: 1400, y: groundY - 180, width: 100, height: 20, type: 'question', hasPowerUp: true},
      {x: 1600, y: groundY - 120, width: 120, height: 20, type: 'breakable'},
      {x: 1800, y: groundY - 160, width: 100, height: 20, type: 'normal'},
      {x: 500, y: groundY - 280, width: 80, height: 20, type: 'coin', hasCoins: true, coinCount: 3},
      {x: 1100, y: groundY - 240, width: 80, height: 20, type: 'coin', hasCoins: true, coinCount: 5},
      {x: 1500, y: groundY - 200, width: 80, height: 20, type: 'coin', hasCoins: true, coinCount: 4}
    ],
    powerUps: [
      {x: 300, y: groundY - 240, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 500, y: groundY - 200, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
      {x: 700, y: groundY - 160, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0},
      {x: 1000, y: groundY - 220, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 1400, y: groundY - 200, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0}
    ],
    enemies: [
      {x: 300, y: groundY - 60, width: 30, height: 30, vx: -1, type: 'goomba', emoji: '🍄'},
      {x: 700, y: groundY - 60, width: 30, height: 30, vx: 1, type: 'koopa', emoji: '🐢'},
      {x: 1200, y: groundY - 60, width: 30, height: 30, vx: -1, type: 'goomba', emoji: '🍄'},
      {x: 1600, y: groundY - 60, width: 30, height: 30, vx: 1, type: 'koopa', emoji: '🐢'}
    ]
  },
  2: {
    goalX: 3000,
    platforms: [
      {x: 250, y: groundY - 150, width: 120, height: 20, type: 'normal'},
      {x: 450, y: groundY - 200, width: 100, height: 20, type: 'moving', moveSpeed: 1.5, moveRange: 120, startX: 450},
      {x: 650, y: groundY - 180, width: 80, height: 20, type: 'breakable'},
      {x: 350, y: groundY - 250, width: 60, height: 20, type: 'question', hasPowerUp: true},
      {x: 850, y: groundY - 200, width: 100, height: 20, type: 'normal'},
      {x: 1050, y: groundY - 240, width: 80, height: 20, type: 'moving', moveSpeed: -1.5, moveRange: 100, startX: 1050},
      {x: 1250, y: groundY - 180, width: 120, height: 20, type: 'normal'},
      {x: 1450, y: groundY - 220, width: 80, height: 20, type: 'question', hasPowerUp: true},
      {x: 1650, y: groundY - 160, width: 100, height: 20, type: 'breakable'},
      {x: 1850, y: groundY - 200, width: 80, height: 20, type: 'normal'},
      {x: 2050, y: groundY - 240, width: 100, height: 20, type: 'moving', moveSpeed: 1, moveRange: 80, startX: 2050},
      {x: 2250, y: groundY - 180, width: 120, height: 20, type: 'normal'},
      {x: 2450, y: groundY - 220, width: 100, height: 20, type: 'question', hasPowerUp: true},
      {x: 2650, y: groundY - 160, width: 80, height: 20, type: 'breakable'},
      {x: 2850, y: groundY - 200, width: 100, height: 20, type: 'normal'},
      {x: 550, y: groundY - 300, width: 60, height: 20, type: 'coin', hasCoins: true, coinCount: 4},
      {x: 1150, y: groundY - 280, width: 60, height: 20, type: 'coin', hasCoins: true, coinCount: 6},
      {x: 1750, y: groundY - 240, width: 60, height: 20, type: 'coin', hasCoins: true, coinCount: 5},
      {x: 2350, y: groundY - 260, width: 60, height: 20, type: 'coin', hasCoins: true, coinCount: 7}
    ],
    powerUps: [
      {x: 350, y: groundY - 270, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 650, y: groundY - 200, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
      {x: 850, y: groundY - 220, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0},
      {x: 1450, y: groundY - 240, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 1650, y: groundY - 180, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
      {x: 2450, y: groundY - 240, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0},
      {x: 2650, y: groundY - 180, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0}
    ],
    enemies: [
      {x: 350, y: groundY - 60, width: 30, height: 30, vx: -1.5, type: 'goomba', emoji: '🍄'},
      {x: 750, y: groundY - 60, width: 30, height: 30, vx: 1.5, type: 'koopa', emoji: '🐢'},
      {x: 1150, y: groundY - 60, width: 30, height: 30, vx: -1.5, type: 'goomba', emoji: '🍄'},
      {x: 1550, y: groundY - 60, width: 30, height: 30, vx: 1.5, type: 'koopa', emoji: '🐢'},
      {x: 1950, y: groundY - 60, width: 30, height: 30, vx: -1.5, type: 'goomba', emoji: '🍄'},
      {x: 2350, y: groundY - 60, width: 30, height: 30, vx: 1.5, type: 'koopa', emoji: '🐢'},
      {x: 2750, y: groundY - 60, width: 30, height: 30, vx: -1.5, type: 'goomba', emoji: '🍄'}
    ]
  },
  3: {
    goalX: 4000,
    platforms: [
      {x: 300, y: groundY - 180, width: 100, height: 20, type: 'normal'},
      {x: 500, y: groundY - 220, width: 80, height: 20, type: 'moving', moveSpeed: 2, moveRange: 140, startX: 500},
      {x: 700, y: groundY - 200, width: 60, height: 20, type: 'breakable'},
      {x: 400, y: groundY - 280, width: 40, height: 20, type: 'question', hasPowerUp: true},
      {x: 900, y: groundY - 240, width: 80, height: 20, type: 'normal'},
      {x: 1100, y: groundY - 280, width: 60, height: 20, type: 'moving', moveSpeed: -2, moveRange: 120, startX: 1100},
      {x: 1300, y: groundY - 220, width: 100, height: 20, type: 'normal'},
      {x: 1500, y: groundY - 260, width: 60, height: 20, type: 'question', hasPowerUp: true},
      {x: 1700, y: groundY - 200, width: 80, height: 20, type: 'breakable'},
      {x: 1900, y: groundY - 240, width: 60, height: 20, type: 'normal'},
      {x: 2100, y: groundY - 280, width: 80, height: 20, type: 'moving', moveSpeed: 1.5, moveRange: 100, startX: 2100},
      {x: 2300, y: groundY - 240, width: 100, height: 20, type: 'normal'},
      {x: 2500, y: groundY - 280, width: 60, height: 20, type: 'question', hasPowerUp: true},
      {x: 2700, y: groundY - 220, width: 80, height: 20, type: 'breakable'},
      {x: 2900, y: groundY - 260, width: 60, height: 20, type: 'normal'},
      {x: 3100, y: groundY - 240, width: 100, height: 20, type: 'moving', moveSpeed: -1.5, moveRange: 120, startX: 3100},
      {x: 3300, y: groundY - 280, width: 80, height: 20, type: 'normal'},
      {x: 3500, y: groundY - 240, width: 60, height: 20, type: 'question', hasPowerUp: true},
      {x: 3700, y: groundY - 200, width: 80, height: 20, type: 'breakable'},
      {x: 3900, y: groundY - 240, width: 60, height: 20, type: 'normal'},
      {x: 600, y: groundY - 320, width: 40, height: 20, type: 'coin', hasCoins: true, coinCount: 5},
      {x: 1200, y: groundY - 300, width: 40, height: 20, type: 'coin', hasCoins: true, coinCount: 8},
      {x: 1800, y: groundY - 260, width: 40, height: 20, type: 'coin', hasCoins: true, coinCount: 6},
      {x: 2400, y: groundY - 300, width: 40, height: 20, type: 'coin', hasCoins: true, coinCount: 9},
      {x: 3000, y: groundY - 280, width: 40, height: 20, type: 'coin', hasCoins: true, coinCount: 7},
      {x: 3600, y: groundY - 240, width: 40, height: 20, type: 'coin', hasCoins: true, coinCount: 10}
    ],
    powerUps: [
      {x: 400, y: groundY - 300, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 700, y: groundY - 220, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
      {x: 900, y: groundY - 260, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0},
      {x: 1500, y: groundY - 280, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 1700, y: groundY - 220, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
      {x: 2500, y: groundY - 300, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0},
      {x: 2700, y: groundY - 240, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
      {x: 3500, y: groundY - 260, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
      {x: 3700, y: groundY - 220, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0}
    ],
    enemies: [
      {x: 400, y: groundY - 60, width: 30, height: 30, vx: -2, type: 'goomba', emoji: '🍄'},
      {x: 800, y: groundY - 60, width: 30, height: 30, vx: 2, type: 'koopa', emoji: '🐢'},
      {x: 1200, y: groundY - 60, width: 30, height: 30, vx: -2, type: 'goomba', emoji: '🍄'},
      {x: 1600, y: groundY - 60, width: 30, height: 30, vx: 2, type: 'koopa', emoji: '🐢'},
      {x: 2000, y: groundY - 60, width: 30, height: 30, vx: -2, type: 'goomba', emoji: '🍄'},
      {x: 2400, y: groundY - 60, width: 30, height: 30, vx: 2, type: 'koopa', emoji: '🐢'},
      {x: 2800, y: groundY - 60, width: 30, height: 30, vx: -2, type: 'goomba', emoji: '🍄'},
      {x: 3200, y: groundY - 60, width: 30, height: 30, vx: 2, type: 'koopa', emoji: '🐢'},
      {x: 3600, y: groundY - 60, width: 30, height: 30, vx: -2, type: 'goomba', emoji: '🍄'},
      {x: 3800, y: groundY - 60, width: 30, height: 30, vx: 2, type: 'koopa', emoji: '🐢'}
    ]
  }
};

// Load level function
function loadLevel(levelNumber) {
  if (levelNumber > totalLevels) {
    // Game completed!
    gameWon = true;
    return;
  }
  
  currentLevel = levelNumber;
  const config = levelConfigs[levelNumber];
  
  // Reset player position
  player.x = 80;
  player.y = groundY - 50;
  player.vx = 0;
  player.vy = 0;
  
  // Load level data
  platforms = [...config.platforms];
  powerUps = [...config.powerUps];
  enemies = [...config.enemies];
  
  // Update goal position
  goal.x = config.goalX;
  goal.y = groundY - 100;
  
  // Reset camera
  cameraX = 0;
  
  // Reset game state
  gameOver = false;
  gameWon = false;
  isPaused = false;
  
  // Start background music for new level
  if (musicEnabled) {
    startBackgroundMusic();
  }
}

function playSound(frequency, duration, type = 'sine') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playCoinSound() {
  playSound(800, 0.1, 'square');
}

function playJumpSound() {
  playSound(400, 0.2, 'sine');
}

function playPowerUpSound() {
  playSound(600, 0.3, 'triangle');
}

function playEnemyDefeatSound() {
  playSound(300, 0.15, 'sawtooth');
}

updateScoreBoard();
gameLoop(); 

// Background music system
function startBackgroundMusic() {
  if (!audioContext || !musicEnabled) return;
  
  // Stop existing music
  if (backgroundMusic) {
    backgroundMusic.stop();
  }
  
  // Create new background music
  backgroundMusic = createBackgroundMusic();
  
  // Loop the music
  if (backgroundMusic) {
    backgroundMusic.onended = () => {
      if (musicEnabled && !gameOver && !gameWon) {
        startBackgroundMusic();
      }
    };
  }
}

// Toggle music
function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    startBackgroundMusic();
  } else if (backgroundMusic) {
    backgroundMusic.stop();
    backgroundMusic = null;
  }
}

// Initialize audio when game starts
initAudio();

// Music controls
if (keys['M'] || keys['m']) {
  if (!keysPressed['M'] && !keysPressed['m']) {
    toggleMusic();
    keysPressed['M'] = true;
    keysPressed['m'] = true;
  }
} else {
  keysPressed['M'] = false;
  keysPressed['m'] = false;
}

// Level controls (for testing)
if (keys['L'] || keys['l']) {
  if (!keysPressed['L'] && !keysPressed['l']) {
    if (currentLevel < totalLevels) {
      loadLevel(currentLevel + 1);
    }
    keysPressed['L'] = true;
    keysPressed['l'] = true;
  }
} else {
  keysPressed['L'] = false;
  keysPressed['l'] = false;
}