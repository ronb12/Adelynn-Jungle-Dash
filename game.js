// Simple Vertical Coin Collector Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 400;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

let player = { x: WIDTH/2 - 30, y: HEIGHT - 40, width: 60, height: 20, speed: 7 };
let coins = [];
let score = 0;
let gameOver = false;
let keys = {};

function spawnCoin() {
  coins.push({ x: Math.random() * (WIDTH-20), y: -20, radius: 12, speed: 4 + Math.random()*2 });
}

function resetGame() {
  player.x = WIDTH/2 - 30;
  score = 0;
  coins = [];
  gameOver = false;
  for (let i = 0; i < 5; i++) spawnCoin();
  document.getElementById('restartBtn').style.display = 'none';
}

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

function update() {
  if (gameOver) return;
  // Player movement
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;
  player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));
  // Move coins
  coins.forEach(c => c.y += c.speed);
  // Coin collection
  coins.forEach(c => {
    if (c.y + c.radius > player.y && c.y - c.radius < player.y + player.height && c.x + c.radius > player.x && c.x - c.radius < player.x + player.width) {
      c.collected = true;
      score++;
    }
  });
  // Remove collected/offscreen coins
  coins = coins.filter(c => !c.collected && c.y < HEIGHT + 20);
  // Spawn new coins
  if (coins.length < 5) spawnCoin();
  // Game over if a coin reaches the bottom
  if (coins.some(c => c.y > HEIGHT - 10)) {
    gameOver = true;
    document.getElementById('restartBtn').style.display = 'block';
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Background
  ctx.fillStyle = '#a8e063';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Player
  ctx.fillStyle = '#388e3c';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  // Coins
  coins.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  });
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '1.5em Comic Sans MS, Comic Sans, cursive';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 16, 36);
  // Game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '2em Comic Sans MS, Comic Sans, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', WIDTH/2, HEIGHT/2 - 20);
    ctx.fillText('Score: ' + score, WIDTH/2, HEIGHT/2 + 30);
  }
}

document.getElementById('restartBtn').onclick = resetGame;
resetGame();
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop(); 