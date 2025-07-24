// Jungle Dash - Vertical Super Mario Bros Style
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game constants ---
const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 800;
const GROUND_HEIGHT = 40;
const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 24;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 64;
const GRAVITY = 0.7;
const JUMP_POWER = -16;
const PLAYER_SPEED = 5;
const CAMERA_OFFSET = 300; // How far from bottom before camera follows

// --- Images ---
const imgBg = new Image(); imgBg.src = 'sprites/jungle_bg.png';
const imgGirl = new Image(); imgGirl.src = 'sprites/jungle_girl.png';
const imgMonkey = new Image(); imgMonkey.src = 'sprites/monkey_sidekick.png';
const imgCoin = new Image(); imgCoin.src = 'sprites/coin.png';
const imgLog = new Image(); imgLog.src = 'sprites/obstacle_log.png';

// --- Game state ---
let player = {
  x: CANVAS_WIDTH/2 - PLAYER_WIDTH/2,
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
let platforms = [];
let coins = [];
let obstacles = [];
let score = 0;
let highScore = Number(localStorage.getItem('jungleDashHighScore') || 0);
let gameOver = false;
let cameraY = 0;
let animTick = 0;
let keys = {};
let showHighScoreMsg = false;
let highScoreMsgTimer = 0;
let feedbackMsg = '';
let feedbackTimer = 0;

// --- Controls ---
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// --- Platform/coin/obstacle generation ---
function spawnPlatform(y) {
  const x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
  platforms.push({ x, y, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT });
  // 50% chance to spawn a coin on the platform
  if (Math.random() < 0.5) {
    coins.push({ x: x + PLATFORM_WIDTH/2, y: y - 30, radius: 18, collected: false });
  }
  // 30% chance to spawn an obstacle
  if (Math.random() < 0.3) {
    obstacles.push({ x: x + Math.random() * (PLATFORM_WIDTH-48), y: y - 32, width: 48, height: 32 });
  }
}

function resetGame() {
  player.x = CANVAS_WIDTH/2 - PLAYER_WIDTH/2;
  player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
  player.vy = 0;
  score = 0;
  cameraY = 0;
  platforms = [];
  coins = [];
  obstacles = [];
  gameOver = false;
  feedbackMsg = '';
  feedbackTimer = 0;
  showHighScoreMsg = false;
  highScoreMsgTimer = 0;
  // Initial platforms
  for (let i = 0; i < 10; i++) {
    spawnPlatform(CANVAS_HEIGHT - GROUND_HEIGHT - i*120);
  }
  document.getElementById('restartBtn').style.display = 'none';
}

function update() {
  if (gameOver) return;
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
  // Keep player in bounds
  player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - PLAYER_WIDTH));
  // Camera follows upward
  if (player.y < cameraY + CAMERA_OFFSET) {
    cameraY = player.y - CAMERA_OFFSET;
  }
  // Remove offscreen platforms/coins/obstacles
  platforms = platforms.filter(p => p.y > cameraY - 100);
  coins = coins.filter(c => !c.collected && c.y > cameraY - 100);
  obstacles = obstacles.filter(o => o.y > cameraY - 100);
  // Spawn new platforms above
  while (platforms.length < 12) {
    let maxY = Math.min(...platforms.map(p => p.y));
    spawnPlatform(maxY - 120);
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
  // Obstacle collision
  obstacles.forEach(o => {
    if (player.x + PLAYER_WIDTH > o.x && player.x < o.x + o.width && player.y + PLAYER_HEIGHT > o.y && player.y < o.y + o.height) {
      gameOver = true;
      document.getElementById('restartBtn').style.display = 'block';
      sndGameOver.currentTime = 0; sndGameOver.play();
      music.pause();
    }
  });
  // Sidekick follows
  sidekick.x += (player.x - 40 - sidekick.x) * 0.2;
  sidekick.y += (player.y + PLAYER_HEIGHT - 10 - sidekick.y) * 0.2;
  // Game over if player falls below screen
  if (player.y > cameraY + CANVAS_HEIGHT) {
    gameOver = true;
    document.getElementById('restartBtn').style.display = 'block';
    sndGameOver.currentTime = 0; sndGameOver.play();
    music.pause();
  }
  // Feedback timers
  if (feedbackTimer > 0) feedbackTimer--;
  if (highScoreMsgTimer > 0) highScoreMsgTimer--;
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Background
  if (imgBg.complete) ctx.drawImage(imgBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  else {
    ctx.fillStyle = '#a8e063';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  // Platforms
  ctx.fillStyle = '#fffbe7';
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y - cameraY, p.width, p.height);
  });
  // Coins
  coins.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y - cameraY);
    ctx.rotate((animTick/15) % (2*Math.PI));
    if (imgCoin.complete) ctx.drawImage(imgCoin, -c.radius, -c.radius, c.radius*2, c.radius*2);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    ctx.restore();
  });
  // Obstacles (logs)
  obstacles.forEach(o => {
    if (imgLog.complete) ctx.drawImage(imgLog, o.x, o.y - cameraY, o.width, o.height);
    else {
      ctx.fillStyle = '#8d5524';
      ctx.fillRect(o.x, o.y - cameraY, o.width, o.height);
    }
  });
  // Player (jungle girl) idle bounce
  let girlY = player.y + Math.sin(animTick/10)*4 - cameraY;
  if (imgGirl.complete) ctx.drawImage(imgGirl, player.x, girlY, PLAYER_WIDTH, PLAYER_HEIGHT);
  else {
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(player.x, girlY, PLAYER_WIDTH, PLAYER_HEIGHT);
  }
  // Sidekick (monkey) idle bounce
  let monkeyY = sidekick.y + Math.sin(animTick/10 + 1)*3 - cameraY;
  if (imgMonkey.complete) ctx.drawImage(imgMonkey, sidekick.x, monkeyY, sidekick.width, sidekick.height);
  else {
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.arc(sidekick.x + sidekick.width/2, monkeyY + sidekick.height/2, sidekick.width/2, 0, Math.PI * 2);
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
    ctx.strokeText(feedbackMsg, player.x + PLAYER_WIDTH/2, girlY - 10);
    ctx.fillText(feedbackMsg, player.x + PLAYER_WIDTH/2, girlY - 10);
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
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.getElementById('restartBtn').onclick = resetGame;
resetGame();
gameLoop(); 