// Jungle Dash - Mario-Style Horizontal Platformer
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const GROUND_HEIGHT = 40;
const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 24;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 64;
const GRAVITY = 0.7;
const JUMP_POWER = -16;
const PLAYER_SPEED = 5;
const CAMERA_OFFSET = 300; // How far from left before camera follows

// --- Images ---
const imgBg = new Image(); imgBg.src = 'sprites/jungle_bg.png';
const imgGirl = new Image(); imgGirl.src = 'sprites/jungle_girl.png';
const imgMonkey = new Image(); imgMonkey.src = 'sprites/monkey_sidekick.png';
const imgCoin = new Image(); imgCoin.src = 'sprites/coin.png';
const imgBananaCoin = new Image(); imgBananaCoin.src = 'sprites/banana_coin.png';
const imgPlatformLog = new Image(); imgPlatformLog.src = 'sprites/platform_log.png';
const imgPlatformLeaf = new Image(); imgPlatformLeaf.src = 'sprites/platform_leaf.png';
const imgLog = new Image(); imgLog.src = 'sprites/obstacle_log.png';
const imgFrog = new Image(); imgFrog.src = 'sprites/frog_obstacle.png';
const imgParrot = new Image(); imgParrot.src = 'sprites/parrot_sidekick.png';
const imgFlag = new Image(); imgFlag.src = 'sprites/goal_flag.png';
const imgPowerup = new Image(); imgPowerup.src = 'sprites/powerup_fruit.png';
const imgCrab = new Image(); imgCrab.src = 'sprites/crab_enemy.png';
const imgCoconut = new Image(); imgCoconut.src = 'sprites/coconut_enemy.png';
const imgTrunk = new Image(); imgTrunk.src = 'sprites/tree_trunk.png';
const imgStar = new Image(); imgStar.src = 'sprites/star_powerup.png';
const sndEnemy = new Audio('audio/gameover.wav'); // Use gameover sound for now
const sndJump = new Audio('audio/jump.wav');
const sndCoin = new Audio('audio/coin.wav');
const sndPowerup = new Audio('audio/powerup.wav');
const sndGameOver = new Audio('audio/gameover.wav');
const sndStar = new Audio('audio/coin.wav'); // Use coin sound for now

// --- Game state ---
let player = {
  x: 100,
  y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
  vy: 0,
  onGround: false,
};
let sidekick = {
  x: player.x - 40,
  y: player.y + 40,
  width: 36,
  height: 36,
};
let parrot = { x: player.x + 80, y: player.y - 40, width: 48, height: 32 };
let platforms = [];
let coins = [];
let obstacles = [];
let score = 0;
let highScore = Number(localStorage.getItem('jungleDashHighScore') || 0);
let gameOver = false;
let cameraX = 0;
let animTick = 0;
let keys = {};
let showHighScoreMsg = false;
let highScoreMsgTimer = 0;
let feedbackMsg = '';
let feedbackTimer = 0;
let musicStarted = false;
let flag = { x: 4000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 96, width: 32, height: 96, topY: CANVAS_HEIGHT - GROUND_HEIGHT - 96, animY: CANVAS_HEIGHT - GROUND_HEIGHT - 96 };
let levelComplete = false;
let flagAnimTick = 0;
let playerCelebrateTick = 0;
let powerups = [];
let shielded = false;
let shieldTimer = 0;
let crabs = [];
let coconuts = [];
let trunks = [];
let stars = [];
let starActive = false;
let starTimer = 0;

// --- Controls ---
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

function startMusic() {
  if (!musicStarted) { music.play(); musicStarted = true; }
  sndJungle.play();
}
document.addEventListener('keydown', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

// --- Platform/coin/obstacle generation ---
function spawnPlatform(x) {
  const y = CANVAS_HEIGHT - GROUND_HEIGHT - Math.random() * 200 - 60;
  const type = Math.random() < 0.5 ? 'log' : 'leaf';
  platforms.push({ x, y, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, type });
  // 50% chance to spawn a coin on the platform
  if (Math.random() < 0.5) {
    coins.push({ x: x + PLATFORM_WIDTH/2, y: y - 30, radius: 18, collected: false });
  }
  // 20% chance to spawn a power-up
  if (Math.random() < 0.2) {
    powerups.push({ x: x + PLATFORM_WIDTH/2, y: y - 60, radius: 16, collected: false });
  }
  // 20% chance to spawn a crab enemy
  if (Math.random() < 0.2) {
    crabs.push({
      x: x + 20 + Math.random() * (PLATFORM_WIDTH-60),
      y: y - 32,
      width: 48,
      height: 32,
      vx: Math.random() < 0.5 ? 1 : -1,
      platformX: x,
      platformW: PLATFORM_WIDTH,
      defeated: false
    });
  }
  // 30% chance to spawn an obstacle (frog or log)
  if (Math.random() < 0.3) {
    const frog = Math.random() < 0.5;
    obstacles.push({ x: x + Math.random() * (PLATFORM_WIDTH-48), y: y - 32, width: 48, height: 32, frog });
  }
  // 10% chance to spawn a rolling coconut on the ground
  if (Math.random() < 0.1 && x > 300) {
    coconuts.push({
      x: x,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - 32,
      width: 32,
      height: 32,
      vx: Math.random() < 0.5 ? 3 : -3,
      defeated: false
    });
  }
  // 10% chance to spawn a tree trunk on the ground
  if (Math.random() < 0.1 && x > 300) {
    trunks.push({
      x: x + Math.random() * 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - 64,
      width: 48,
      height: 64
    });
  }
  // 10% chance to spawn a star power-up
  if (Math.random() < 0.1) {
    stars.push({ x: x + PLATFORM_WIDTH/2, y: y - 80, radius: 16, collected: false });
  }
}

function resetGame() {
  player.x = 100;
  player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
  player.vy = 0;
  score = 0;
  cameraX = 0;
  platforms = [];
  coins = [];
  obstacles = [];
  gameOver = false;
  feedbackMsg = '';
  feedbackTimer = 0;
  showHighScoreMsg = false;
  highScoreMsgTimer = 0;
  parrot.x = player.x + 80;
  parrot.y = player.y - 40;
  flag.x = 4000;
  flag.y = CANVAS_HEIGHT - GROUND_HEIGHT - 96;
  flag.topY = CANVAS_HEIGHT - GROUND_HEIGHT - 96;
  flag.animY = flag.topY + 60;
  levelComplete = false;
  flagAnimTick = 0;
  playerCelebrateTick = 0;
  powerups = [];
  shielded = false;
  shieldTimer = 0;
  crabs = [];
  coconuts = [];
  trunks = [];
  stars = [];
  starActive = false;
  starTimer = 0;
  // Initial ground and platforms
  for (let i = 0; i < 20; i++) {
    spawnPlatform(i*180 + 200);
  }
  document.getElementById('restartBtn').style.display = 'none';
}

function update() {
  if (gameOver || levelComplete) return;
  if (levelComplete) {
    // Animate flag raising
    if (flag.animY > flag.topY) {
      flag.animY -= 2;
      if (flag.animY < flag.topY) flag.animY = flag.topY;
    }
    // Player celebration jump
    playerCelebrateTick++;
    if (playerCelebrateTick < 60) {
      player.y = flag.y + PLAYER_HEIGHT - 32 - Math.abs(Math.sin(playerCelebrateTick/8))*32;
    }
    return;
  }
  animTick++;
  // Controls
  if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
    player.vy = JUMP_POWER;
    sndJump.currentTime = 0; sndJump.play();
  }
  if (keys['ArrowLeft']) player.x -= PLAYER_SPEED;
  if (keys['ArrowRight']) player.x += PLAYER_SPEED;
  // Gravity
  player.vy += GRAVITY;
  player.y += player.vy;
  // Platform collision
  player.onGround = false;
  for (let plat of platforms) {
    if (
      player.x + PLAYER_WIDTH > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + PLAYER_HEIGHT > plat.y &&
      player.y + PLAYER_HEIGHT - player.vy <= plat.y &&
      player.vy > 0
    ) {
      player.y = plat.y - PLAYER_HEIGHT;
      player.vy = 0;
      player.onGround = true;
    }
  }
  // Ground collision
  if (player.y + PLAYER_HEIGHT > CANVAS_HEIGHT - GROUND_HEIGHT) {
    player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
    player.vy = 0;
    player.onGround = true;
  }
  // Keep player in bounds
  player.x = Math.max(cameraX, player.x);
  // Camera follows horizontally
  if (player.x > cameraX + CAMERA_OFFSET) {
    cameraX = player.x - CAMERA_OFFSET;
  }
  // Remove offscreen platforms/coins/obstacles
  platforms = platforms.filter(p => p.x > cameraX - 200);
  coins = coins.filter(c => !c.collected && c.x > cameraX - 200);
  obstacles = obstacles.filter(o => o.x > cameraX - 200);
  // Spawn new platforms ahead
  while (platforms.length < 20) {
    let maxX = Math.max(...platforms.map(p => p.x));
    spawnPlatform(maxX + 180);
  }
  // Coin collection
  coins.forEach(c => {
    if (!c.collected && Math.hypot(player.x + PLAYER_WIDTH/2 - c.x, player.y + PLAYER_HEIGHT/2 - c.y) < c.radius + PLAYER_WIDTH/2) {
      c.collected = true;
      score++;
      sndCoin.currentTime = 0; sndCoin.play();
      feedbackMsg = ['Great!', 'Nice!', 'Awesome!', 'Yay!'][Math.floor(Math.random()*4)];
      feedbackTimer = 30;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('jungleDashHighScore', highScore);
        showHighScoreMsg = true;
        highScoreMsgTimer = 60;
      }
    }
  });
  // Power-up collection
  powerups.forEach(p => {
    if (!p.collected && Math.hypot(player.x + PLAYER_WIDTH/2 - p.x, player.y + PLAYER_HEIGHT/2 - p.y) < p.radius + PLAYER_WIDTH/2) {
      p.collected = true;
      shielded = true;
      shieldTimer = 360; // 6 seconds at 60fps
      sndPowerup.currentTime = 0; sndPowerup.play();
      feedbackMsg = 'Shielded!';
      feedbackTimer = 30;
    }
  });
  // Star power-up collection
  stars.forEach(s => {
    if (!s.collected && Math.hypot(player.x + PLAYER_WIDTH/2 - s.x, player.y + PLAYER_HEIGHT/2 - s.y) < s.radius + PLAYER_WIDTH/2) {
      s.collected = true;
      starActive = true;
      starTimer = 360; // 6 seconds at 60fps
      sndStar.currentTime = 0; sndStar.play();
      feedbackMsg = 'Super Star!';
      feedbackTimer = 30;
    }
  });
  // Star timer
  if (starActive) {
    starTimer--;
    if (starTimer <= 0) starActive = false;
  }
  // If starActive, player is shielded and has super speed
  if (starActive) {
    shielded = true;
    PLAYER_SPEED = 10;
  } else {
    shielded = false;
    PLAYER_SPEED = 5;
  }
  // Obstacle collision (ignore if shielded)
  obstacles.forEach(o => {
    if (!shielded && player.x + PLAYER_WIDTH > o.x && player.x < o.x + o.width && player.y + PLAYER_HEIGHT > o.y && player.y < o.y + o.height) {
      gameOver = true;
      document.getElementById('restartBtn').style.display = 'block';
      sndGameOver.currentTime = 0; sndGameOver.play();
      music.pause();
    }
  });
  // Crab movement
  crabs.forEach(c => {
    if (c.defeated) return;
    c.x += c.vx;
    if (c.x < c.platformX + 10 || c.x > c.platformX + c.platformW - c.width - 10) c.vx *= -1;
  });
  // Crab collision
  crabs.forEach(c => {
    if (c.defeated) return;
    // Player jumps on crab
    if (
      player.x + PLAYER_WIDTH > c.x &&
      player.x < c.x + c.width &&
      player.y + PLAYER_HEIGHT > c.y &&
      player.y + PLAYER_HEIGHT - player.vy <= c.y &&
      player.vy > 0
    ) {
      c.defeated = true;
      player.vy = JUMP_POWER/2;
      sndEnemy.currentTime = 0; sndEnemy.play();
      feedbackMsg = 'Crab defeated!';
      feedbackTimer = 30;
    }
    // Player touches crab from side
    else if (!shielded && player.x + PLAYER_WIDTH > c.x && player.x < c.x + c.width && player.y + PLAYER_HEIGHT > c.y && player.y < c.y + c.height) {
      gameOver = true;
      document.getElementById('restartBtn').style.display = 'block';
      sndGameOver.currentTime = 0; sndGameOver.play();
      music.pause();
    }
  });
  // Coconut movement
  coconuts.forEach(c => {
    if (c.defeated) return;
    c.x += c.vx;
    if (c.x < cameraX - 100 || c.x > cameraX + CANVAS_WIDTH + 100) c.defeated = true;
  });
  // Coconut collision
  coconuts.forEach(c => {
    if (c.defeated) return;
    // Player jumps on coconut
    if (
      player.x + PLAYER_WIDTH > c.x &&
      player.x < c.x + c.width &&
      player.y + PLAYER_HEIGHT > c.y &&
      player.y + PLAYER_HEIGHT - player.vy <= c.y &&
      player.vy > 0
    ) {
      c.defeated = true;
      player.vy = JUMP_POWER/2;
      sndEnemy.currentTime = 0; sndEnemy.play();
      feedbackMsg = 'Coconut cracked!';
      feedbackTimer = 30;
    }
    // Player touches coconut from side
    else if (!shielded && player.x + PLAYER_WIDTH > c.x && player.x < c.x + c.width && player.y + PLAYER_HEIGHT > c.y && player.y < c.y + c.height) {
      gameOver = true;
      document.getElementById('restartBtn').style.display = 'block';
      sndGameOver.currentTime = 0; sndGameOver.play();
      music.pause();
    }
  });
  // Tree trunk collision
  trunks.forEach(t => {
    if (!shielded && player.x + PLAYER_WIDTH > t.x && player.x < t.x + t.width && player.y + PLAYER_HEIGHT > t.y && player.y < t.y + t.height) {
      gameOver = true;
      document.getElementById('restartBtn').style.display = 'block';
      sndGameOver.currentTime = 0; sndGameOver.play();
      music.pause();
    }
  });
  // Sidekick follows
  sidekick.x += (player.x - 40 - sidekick.x) * 0.2;
  sidekick.y += (player.y + PLAYER_HEIGHT - 10 - sidekick.y) * 0.2;
  // Parrot follows player, flaps up and down
  parrot.x += (player.x + 80 - parrot.x) * 0.1;
  parrot.y += (player.y - 40 + Math.sin(animTick/10)*12 - parrot.y) * 0.1;
  // Game over if player falls below screen
  if (player.y > CANVAS_HEIGHT) {
    gameOver = true;
    document.getElementById('restartBtn').style.display = 'block';
    sndGameOver.currentTime = 0; sndGameOver.play();
    music.pause();
  }
  // Check for flag collision
  if (
    player.x + PLAYER_WIDTH > flag.x &&
    player.x < flag.x + flag.width &&
    player.y + PLAYER_HEIGHT > flag.y &&
    player.y < flag.y + flag.height
  ) {
    levelComplete = true;
    document.getElementById('restartBtn').style.display = 'block';
    music.pause();
  }
  // Feedback timers
  if (feedbackTimer > 0) feedbackTimer--;
  if (highScoreMsgTimer > 0) highScoreMsgTimer--;
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Parallax background (simple: two layers)
  if (imgBg.complete) {
    ctx.drawImage(imgBg, -cameraX*0.5 % CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(imgBg, (-cameraX*0.5 % CANVAS_WIDTH) + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    ctx.fillStyle = '#a8e063';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  // Ground
  ctx.fillStyle = '#8d5524';
  ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
  // Platforms
  platforms.forEach(p => {
    let img = p.type === 'log' ? imgPlatformLog : imgPlatformLeaf;
    if (img.complete) ctx.drawImage(img, p.x - cameraX, p.y, p.width, p.height);
    else {
      ctx.fillStyle = p.type === 'log' ? '#8d5524' : '#228B22';
      ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }
  });
  // Coins (bananas)
  coins.forEach(c => {
    ctx.save();
    ctx.translate(c.x - cameraX, c.y);
    ctx.rotate((animTick/15) % (2*Math.PI));
    if (imgBananaCoin.complete) ctx.drawImage(imgBananaCoin, -c.radius, -c.radius, c.radius*2, c.radius*2);
    else {
      ctx.beginPath();
      ctx.ellipse(0, 0, c.radius, c.radius*0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    ctx.restore();
  });
  // Obstacles (frogs or logs)
  obstacles.forEach(o => {
    if (o.frog && imgFrog.complete) ctx.drawImage(imgFrog, o.x - cameraX, o.y, o.width, o.height);
    else if (imgLog.complete) ctx.drawImage(imgLog, o.x - cameraX, o.y, o.width, o.height);
    else {
      ctx.fillStyle = o.frog ? 'green' : '#8d5524';
      ctx.fillRect(o.x - cameraX, o.y, o.width, o.height);
    }
  });
  // Power-ups
  powerups.forEach(p => {
    if (p.collected) return;
    ctx.save();
    ctx.translate(p.x - cameraX, p.y);
    ctx.rotate((animTick/20) % (2*Math.PI));
    if (imgPowerup.complete) ctx.drawImage(imgPowerup, -p.radius, -p.radius, p.radius*2, p.radius*2);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'orange';
      ctx.fill();
      ctx.strokeStyle = 'yellow';
      ctx.stroke();
    }
    ctx.restore();
  });
  // Crabs
  crabs.forEach(c => {
    if (c.defeated) return;
    if (imgCrab.complete) ctx.drawImage(imgCrab, c.x - cameraX, c.y, c.width, c.height);
    else {
      ctx.fillStyle = 'red';
      ctx.fillRect(c.x - cameraX, c.y, c.width, c.height);
    }
  });
  // Coconuts
  coconuts.forEach(c => {
    if (c.defeated) return;
    if (imgCoconut.complete) ctx.drawImage(imgCoconut, c.x - cameraX, c.y, c.width, c.height);
    else {
      ctx.fillStyle = '#8b5c2a';
      ctx.beginPath();
      ctx.arc(c.x - cameraX + c.width/2, c.y + c.height/2, c.width/2, 0, Math.PI*2);
      ctx.fill();
    }
  });
  // Tree trunks
  trunks.forEach(t => {
    if (imgTrunk.complete) ctx.drawImage(imgTrunk, t.x - cameraX, t.y, t.width, t.height);
    else {
      ctx.fillStyle = '#8d5524';
      ctx.fillRect(t.x - cameraX, t.y, t.width, t.height);
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.ellipse(t.x - cameraX + t.width/2, t.y + 8, 20, 8, 0, 0, Math.PI*2);
      ctx.fill();
    }
  });
  // Stars
  stars.forEach(s => {
    if (s.collected) return;
    ctx.save();
    ctx.translate(s.x - cameraX, s.y);
    ctx.rotate((animTick/10) % (2*Math.PI));
    if (imgStar.complete) ctx.drawImage(imgStar, -s.radius, -s.radius, s.radius*2, s.radius*2);
    else {
      ctx.beginPath();
      ctx.moveTo(0, -s.radius);
      for (let i = 1; i < 10; i++) {
        let angle = i * Math.PI / 5;
        let r = i % 2 === 0 ? s.radius : s.radius/2;
        ctx.lineTo(r * Math.sin(angle), -r * Math.cos(angle));
      }
      ctx.closePath();
      ctx.fillStyle = 'yellow';
      ctx.fill();
      ctx.strokeStyle = 'gold';
      ctx.stroke();
    }
    ctx.restore();
  });
  // Star sparkling effect
  if (starActive) {
    for (let i = 0; i < 8; i++) {
      let angle = (animTick/8) + i * Math.PI/4;
      let r = PLAYER_WIDTH + 10 + 8*Math.sin(animTick/8 + i);
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(player.x - cameraX + PLAYER_WIDTH/2 + r*Math.cos(angle), player.y + PLAYER_HEIGHT/2 + r*Math.sin(angle), 6, 0, Math.PI*2);
      ctx.fillStyle = 'yellow';
      ctx.fill();
      ctx.restore();
    }
  }
  // Player (jungle girl) idle bounce
  let girlY = player.y + Math.sin(animTick/10)*4;
  if (imgGirl.complete) ctx.drawImage(imgGirl, player.x - cameraX, girlY, PLAYER_WIDTH, PLAYER_HEIGHT);
  else {
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(player.x - cameraX, girlY, PLAYER_WIDTH, PLAYER_HEIGHT);
  }
  // Sidekick (monkey) idle bounce
  let monkeyY = sidekick.y + Math.sin(animTick/10 + 1)*3;
  if (imgMonkey.complete) ctx.drawImage(imgMonkey, sidekick.x - cameraX, monkeyY, sidekick.width, sidekick.height);
  else {
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.arc(sidekick.x - cameraX + sidekick.width/2, monkeyY + sidekick.height/2, sidekick.width/2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Parrot sidekick
  if (imgParrot.complete) ctx.drawImage(imgParrot, parrot.x - cameraX, parrot.y, parrot.width, parrot.height);
  else {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(parrot.x - cameraX, parrot.y, parrot.width, parrot.height);
  }
  // Draw flag (animate flag top)
  if (imgFlag.complete) ctx.drawImage(imgFlag, flag.x - cameraX, flag.animY, flag.width, flag.height);
  else {
    ctx.fillStyle = '#388e3c';
    ctx.fillRect(flag.x - cameraX + 14, flag.animY + 10, 4, 80);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(flag.x - cameraX + 18, flag.animY + 10);
    ctx.lineTo(flag.x - cameraX + 32, flag.animY + 18);
    ctx.lineTo(flag.x - cameraX + 18, flag.animY + 26);
    ctx.closePath();
    ctx.fill();
  }
  // Score
  let sb = document.getElementById('scoreboard');
  if (sb) sb.innerHTML = `Score: <span id="score">${score}</span> &nbsp; | &nbsp; High Score: <span id="highscore">${highScore}</span>`;
  // Feedback message
  if (feedbackTimer > 0) {
    ctx.save();
    ctx.font = 'bold 1.5em Comic Sans MS, Comic Sans, cursive';
    ctx.fillStyle = '#fffde4';
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText(feedbackMsg, player.x - cameraX + PLAYER_WIDTH/2, girlY - 10);
    ctx.fillText(feedbackMsg, player.x - cameraX + PLAYER_WIDTH/2, girlY - 10);
    ctx.restore();
  }
  // High score message
  if (showHighScoreMsg && highScoreMsgTimer > 0) {
    ctx.save();
    ctx.font = 'bold 2em Comic Sans MS, Comic Sans, cursive';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('New High Score!', CANVAS_WIDTH/2, 80);
    ctx.restore();
  }
  // Game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '2em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    ctx.fillText('Score: ' + score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    ctx.fillText('High Score: ' + highScore, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
  }
  // Level complete message
  if (levelComplete) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '2em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    ctx.fillText('Score: ' + score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    ctx.fillText('High Score: ' + highScore, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
  }
  // Player shield glow
  if (shielded) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(player.x - cameraX + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, PLAYER_WIDTH, 0, Math.PI*2);
    ctx.fillStyle = '#00e6e6';
    ctx.fill();
    ctx.restore();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.getElementById('restartBtn').onclick = function() {
  resetGame();
  this.style.display = 'none';
};
resetGame();
gameLoop(); 