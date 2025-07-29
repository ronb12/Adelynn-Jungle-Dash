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

// Platforms system
let platforms = [
  {x: 200, y: groundY - 120, width: 150, height: 20, type: 'normal'},
  {x: 400, y: groundY - 180, width: 120, height: 20, type: 'moving', moveSpeed: 1, moveRange: 100, startX: 400},
  {x: 600, y: groundY - 140, width: 100, height: 20, type: 'breakable'},
  {x: 300, y: groundY - 220, width: 80, height: 20, type: 'question', hasPowerUp: true}
];

// Power-ups
let powerUps = [
  {x: 300, y: groundY - 240, width: 30, height: 30, type: 'mushroom', emoji: '🍄', collected: false, vy: 0},
  {x: 500, y: groundY - 200, width: 30, height: 30, type: 'star', emoji: '⭐', collected: false, vy: 0},
  {x: 700, y: groundY - 160, width: 30, height: 30, type: 'fireflower', emoji: '🔥', collected: false, vy: 0}
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

// Goal flag at the right end
const goal = {
  x: canvas.width - 60,
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
  const powerUpText = player.powerUpState !== 'normal' ? ` | Power: ${player.powerUpState}` : '';
  scoreBoard.textContent = `Level: ${level} | Score: ${score} | Character: ${characters[characterIndex].name} | Lives: ${player.lives}${powerUpText}`;
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

// Enhanced update function with Mario-style features
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

  // Keep player in bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

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
  projectiles = projectiles.filter(p => p.x > 0 && p.x < canvas.width);

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
      if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
        enemy.vx *= -1;
      }
    }
  });
  
  enemies = enemies.filter(enemy => enemy.x + enemy.width > 0);

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

function drawGround() {
  // Main ground
  ctx.fillStyle = '#8bc34a';
  ctx.fillRect(0, groundY, canvas.width, groundHeight);
  
  // Ground texture
  ctx.fillStyle = '#689f38';
  for (let i = 0; i < canvas.width; i += 30) {
    ctx.fillRect(i, groundY, 15, groundHeight);
  }
  
  // Grass detail
  ctx.fillStyle = '#4caf50';
  for (let i = 0; i < canvas.width; i += 10) {
    ctx.fillRect(i, groundY, 2, 10);
  }
}

function drawPlatforms() {
  platforms.forEach(platform => {
    let color = '#8d6e63';
    let borderColor = '#5d4037';
    
    switch (platform.type) {
      case 'moving':
        color = '#ff9800';
        borderColor = '#f57c00';
        break;
      case 'breakable':
        color = '#d32f2f';
        borderColor = '#b71c1c';
        break;
      case 'question':
        color = '#ffd54f';
        borderColor = '#f57f17';
        break;
    }
    
    // Platform shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
    
    // Platform body
    ctx.fillStyle = color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Platform border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Question mark for question blocks
    if (platform.type === 'question') {
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('?', platform.x + platform.width/2, platform.y + platform.height/2 + 5);
    }
  });
}

function drawPowerUps() {
  powerUps.forEach(powerUp => {
    if (!powerUp.collected) {
      // Power-up shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(powerUp.x + 2, powerUp.y + 2, powerUp.width, powerUp.height);
      
      // Power-up emoji
      ctx.font = `${powerUp.width}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerUp.emoji, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
      
      // Sparkle effect
      const time = Date.now() * 0.005;
      const sparkle = Math.sin(time + powerUp.x) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
      ctx.beginPath();
      ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawProjectiles() {
  projectiles.forEach(projectile => {
    // Projectile shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(projectile.x + 2, projectile.y + 2, projectile.width, projectile.height);
    
    // Projectile body
    ctx.fillStyle = projectile.color;
    ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    
    // Projectile emoji
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(projectile.emoji, projectile.x + projectile.width/2, projectile.y + projectile.height/2);
  });
}

function drawGoal() {
  // Pole
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  
  // Pole shadow
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(goal.x + 2, goal.y, goal.width - 4, goal.height);
  
  // Flag
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(goal.x + goal.width, goal.y, 40, 25);
  
  // Flag pattern
  ctx.fillStyle = '#f57f17';
  ctx.fillRect(goal.x + goal.width, goal.y, 40, 8);
  ctx.fillRect(goal.x + goal.width, goal.y + 17, 40, 8);
  
  // Flag pole top
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(goal.x + goal.width/2, goal.y, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  // Invincibility flash effect
  if (player.isInvincible && Math.floor(player.invincibleTimer / 10) % 2 === 0) {
    return; // Skip drawing player every other frame when invincible
  }
  
  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(player.x + 2, player.y + player.height - 5, player.width, 10);
  
  // Player body
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  
  // Player details
  ctx.fillStyle = player.secondaryColor;
  ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, 15);
  
  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(player.x + 8, player.y + 8, 4, 4);
  ctx.fillRect(player.x + 18, player.y + 8, 4, 4);
  
  // Smile
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x + player.width/2, player.y + 20, 8, 0, Math.PI);
  ctx.stroke();
  
  // Power-up indicators
  if (player.powerUpState === 'fire') {
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(player.x + player.width/2 - 5, player.y - 10, 10, 5);
  }
}

function drawCollectibles() {
  collectibles.forEach(coin => {
    if (!coin.collected) {
      // Coin shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(coin.x + 2, coin.y + coin.height - 3, coin.width, 6);
      
      // Coin emoji
      ctx.font = `${coin.width}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(coin.emoji, coin.x + coin.width/2, coin.y + coin.height/2);
      
      // Sparkle effect
      const time = Date.now() * 0.005;
      const sparkle = Math.sin(time + coin.x) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
      ctx.beginPath();
      ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    // Enemy shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(enemy.x + 2, enemy.y + enemy.height - 5, enemy.width, 10);
    
    // Enemy body
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Enemy details
    ctx.fillStyle = enemy.secondaryColor;
    ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, 15);
    
    // Animal emoji
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.emoji, enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    
    // Eyes for some animals
    if (enemy.emoji === '🐯' || enemy.emoji === '🦁') {
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 8, enemy.y + 8, 3, 3);
      ctx.fillRect(enemy.x + 18, enemy.y + 8, 3, 3);
    }
  });
}

function drawBackground() {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(0.5, '#98FB98');
  gradient.addColorStop(1, '#8FBC8F');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 5; i++) {
    const x = (i * 200 + Date.now() * 0.01) % (canvas.width + 100) - 50;
    const y = 50 + Math.sin(i) * 20;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
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