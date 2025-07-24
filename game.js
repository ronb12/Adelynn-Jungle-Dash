// Jungle Dash - New Game Foundation with Cartoon Assets
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const imgBg = new Image(); imgBg.src = 'sprites/jungle_bg.png';
const imgGirl = new Image(); imgGirl.src = 'sprites/jungle_girl.png';
const imgMonkey = new Image(); imgMonkey.src = 'sprites/monkey_sidekick.png';
const imgCoin = new Image(); imgCoin.src = 'sprites/coin.png';
const imgLog = new Image(); imgLog.src = 'sprites/obstacle_log.png';

// Game state
let player = {
  x: 100,
  y: 300,
  width: 48,
  height: 64,
  vy: 0,
  onGround: false,
};
let sidekick = {
  x: 60,
  y: 340,
  width: 36,
  height: 36,
};
let coins = [];
let obstacles = [];
let score = 0;
let gameOver = false;

// --- Animation state ---
let animTick = 0;

// --- High score ---
let highScore = Number(localStorage.getItem('jungleDashHighScore') || 0);
let showHighScoreMsg = false;
let highScoreMsgTimer = 0;
let feedbackMsg = '';
let feedbackTimer = 0;

// Controls
let keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// --- Audio setup ---
const sndJump = new Audio('audio/jump.wav');
const sndCoin = new Audio('audio/coin.wav');
const sndGameOver = new Audio('audio/gameover.wav');
const music = new Audio('audio/bg_music.mp3');
music.loop = true;

// Start music on first user interaction
let musicStarted = false;
function startMusic() {
  if (!musicStarted) { music.play(); musicStarted = true; }
}
document.addEventListener('keydown', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

function spawnCoin() {
  coins.push({
    x: 800 + Math.random() * 200,
    y: 250 + Math.random() * 120,
    radius: 18,
    collected: false,
  });
}
function spawnObstacle() {
  obstacles.push({
    x: 800 + Math.random() * 200,
    y: 370,
    width: 48,
    height: 32,
  });
}

function resetGame() {
  player.x = 100;
  player.y = 300;
  player.vy = 0;
  score = 0;
  coins = [];
  obstacles = [];
  gameOver = false;
  feedbackMsg = '';
  feedbackTimer = 0;
  showHighScoreMsg = false;
  highScoreMsgTimer = 0;
  for (let i = 0; i < 5; i++) spawnCoin();
  for (let i = 0; i < 3; i++) spawnObstacle();
  document.getElementById('restartBtn').style.display = 'none';
}

function update() {
  if (gameOver) return;
  animTick++;
  // Gravity
  player.vy += 0.7;
  player.y += player.vy;
  // Ground collision
  if (player.y + player.height > 400) {
    player.y = 400 - player.height;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
  // Controls
  if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
    player.vy = -13;
    sndJump.currentTime = 0; sndJump.play();
  }
  if (keys['ArrowLeft']) player.x -= 5;
  if (keys['ArrowRight']) player.x += 5;
  // Sidekick follows
  sidekick.x += (player.x - 40 - sidekick.x) * 0.2;
  sidekick.y += (player.y + player.height - 10 - sidekick.y) * 0.2;
  // Move coins/obstacles
  coins.forEach(c => c.x -= 5);
  obstacles.forEach(o => o.x -= 5);
  // Coin collection
  coins.forEach(c => {
    if (!c.collected && Math.hypot(player.x + player.width/2 - c.x, player.y + player.height/2 - c.y) < c.radius + player.width/2) {
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
  // Remove collected/offscreen coins
  coins = coins.filter(c => !c.collected && c.x > -20);
  if (coins.length < 5) spawnCoin();
  // Obstacle collision
  obstacles.forEach(o => {
    if (player.x + player.width > o.x && player.x < o.x + o.width && player.y + player.height > o.y && player.y < o.y + o.height) {
      gameOver = true;
      document.getElementById('restartBtn').style.display = 'block';
      sndGameOver.currentTime = 0; sndGameOver.play();
      music.pause();
    }
  });
  // Remove offscreen obstacles
  obstacles = obstacles.filter(o => o.x > -50);
  if (obstacles.length < 3) spawnObstacle();
  // Keep player in bounds
  player.x = Math.max(0, Math.min(player.x, 800 - player.width));
  // Feedback timers
  if (feedbackTimer > 0) feedbackTimer--;
  if (highScoreMsgTimer > 0) highScoreMsgTimer--;
}

function draw() {
  // Background
  if (imgBg.complete) ctx.drawImage(imgBg, 0, 0, canvas.width, canvas.height);
  else {
    ctx.fillStyle = '#a8e063';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // Ground
  ctx.fillStyle = '#388e3c';
  ctx.fillRect(0, 400, canvas.width, 50);
  // Player (jungle girl) idle bounce
  let girlY = player.y + Math.sin(animTick/10)*4;
  if (imgGirl.complete) ctx.drawImage(imgGirl, player.x, girlY, player.width, player.height);
  else {
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(player.x, girlY, player.width, player.height);
  }
  // Sidekick (monkey) idle bounce
  let monkeyY = sidekick.y + Math.sin(animTick/10 + 1)*3;
  if (imgMonkey.complete) ctx.drawImage(imgMonkey, sidekick.x, monkeyY, sidekick.width, sidekick.height);
  else {
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.arc(sidekick.x + sidekick.width/2, monkeyY + sidekick.height/2, sidekick.width/2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Coins spin
  coins.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
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
    if (imgLog.complete) ctx.drawImage(imgLog, o.x, o.y, o.width, o.height);
    else {
      ctx.fillStyle = '#8d5524';
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
  });
  // Score
  document.getElementById('score').textContent = score;
  // High score
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
    ctx.strokeText(feedbackMsg, player.x + player.width/2, player.y - 10);
    ctx.fillText(feedbackMsg, player.x + player.width/2, player.y - 10);
    ctx.restore();
  }
  // High score message
  if (showHighScoreMsg && highScoreMsgTimer > 0) {
    ctx.save();
    ctx.font = 'bold 2em Comic Sans MS, Comic Sans, cursive';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('New High Score!', canvas.width/2, 80);
    ctx.restore();
  }
  // Game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '2em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 30);
    ctx.fillText('High Score: ' + highScore, canvas.width/2, canvas.height/2 + 70);
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