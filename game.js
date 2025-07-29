const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');

// Characters: cycle with 'C'
const characters = [
  {name: 'Adelynn', color: '#ff6f61', secondaryColor: '#ff8a80'},
  {name: 'Zuri',    color: '#a266ac', secondaryColor: '#ba68c8'},
  {name: 'Kai',     color: '#4fc3f7', secondaryColor: '#81d4fa'}
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
  lives: 3, // Now finite lives like Mario
  isInvincible: false,
  invincibleTimer: 0,
  powerUpState: 'normal', // normal, big, fire
  direction: 1, // 1 for right, -1 for left
  isRunning: false,
  isCrouching: false
};

// Platforms system - expanded world
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
  {x: 1800, y: groundY - 160, width: 100, height: 20, type: 'normal'}
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
  const powerUpText = player.powerUpState !== 'normal' ? ` | Power: ${player.powerUpState}` : '';
  scoreBoard.textContent = `Level: ${level} | Score: ${score} | Progress: ${progress}% | Character: ${characters[characterIndex].name} | Lives: ${player.lives}${powerUpText}`;
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

// Platform collision detection
function checkPlatformCollision() {
  player.isOnPlatform = false;
  
  for (let platform of platforms) {
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
  if (keys['ArrowLeft']) {
    player.vx = -moveSpeed;
    player.direction = -1;
  }
  if (keys['ArrowRight']) {
    player.vx = moveSpeed;
    player.direction = 1;
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
      updateScoreBoard();
      item.collected = true;
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
    gameWon = true;
    gameOver = true;
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

// Draw player with camera offset
function drawPlayer() {
  const screenX = player.x - cameraX;
  
  // Only draw if on screen
  if (screenX + player.width > 0 && screenX < canvas.width) {
    // Draw player body
    ctx.fillStyle = player.color;
    ctx.fillRect(screenX, player.y, player.width, player.height);
    
    // Draw player details
    ctx.fillStyle = player.secondaryColor;
    ctx.fillRect(screenX + 5, player.y + 5, player.width - 10, 10);
    
    // Draw eyes
    ctx.fillStyle = '#000';
    const eyeX = player.direction === 1 ? screenX + 25 : screenX + 5;
    ctx.fillRect(eyeX, player.y + 15, 5, 5);
    
    // Draw mouth
    ctx.fillRect(screenX + 15, player.y + 30, 5, 3);
    
    // Draw power-up indicator
    if (player.powerUpState !== 'normal') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(screenX - 5, player.y - 10, player.width + 10, 5);
    }
    
    // Draw invincibility effect
    if (player.isInvincible && Math.floor(Date.now() / 100) % 2) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(screenX, player.y, player.width, player.height);
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

updateScoreBoard();
gameLoop(); 