// --- Game State & DOM Elements ---
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;

// --- Audio System ---
// Using placeholder URLs for immediate testing. Replace with your own MP3s later.
const sfx = {
    start: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'), // Cyber UI click
    footstep: new Audio('https://assets.mixkit.co/active_storage/sfx/2679/2679-preview.mp3'), // Fast steps
    bgm: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3') // Dark drone ambiance
};
sfx.bgm.loop = true;
sfx.bgm.volume = 0.4;
sfx.footstep.volume = 0.2;
sfx.footstep.playbackRate = 1.5; // Speed up the footsteps

// --- Asset Loader ---
const images = {
    player: new Image(),
    enemy: new Image(),
    floor: new Image()
};
// Loading from your Stock folder
images.player.src = './Stock/Player.png';
images.enemy.src = './Stock/Enemy.png';
images.floor.src = './Stock/Floor.png';

// --- Game Entities ---
const player = {
    x: 0, 
    y: 0,
    targetX: 0,
    targetY: 0,
    speed: 5,
    angle: 0,
    isMoving: false
};

const enemy = {
    x: 0,
    y: 0,
    angle: 0,
    sweepDirection: 1
};

// --- Setup & Resize ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Center entities on initial load
    if (!gameRunning) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2 + 150;
        player.targetX = player.x;
        player.targetY = player.y;
        
        enemy.x = canvas.width / 2;
        enemy.y = canvas.height / 2 - 150;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Input Mechanics (Tap to Move) ---
// Works for both mouse clicks and mobile touch
canvas.addEventListener('pointerdown', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

// --- Start Game ---
startBtn.addEventListener('click', () => {
    // Play sounds
    sfx.start.play();
    sfx.bgm.play();

    // UI Transitions
    startScreen.classList.remove('active');
    canvas.classList.add('active');
    
    // Boot Engine
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

// --- Main Game Loop ---
function gameLoop() {
    if (!gameRunning) return;

    updateLogic();
    drawGraphics();

    requestAnimationFrame(gameLoop);
}

// --- Logic Update ---
function updateLogic() {
    // 1. Player Movement Math
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > player.speed) {
        // Move towards target
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
        
        // Rotate to face movement direction (Math.atan2 returns the angle in radians)
        // Adding Math.PI / 2 (90 degrees) because your asset faces "up" by default
        player.angle = Math.atan2(dy, dx) + (Math.PI / 2);
        
        if (!player.isMoving) {
            sfx.footstep.play();
            player.isMoving = true;
        }
    } else {
        player.isMoving = false;
        sfx.footstep.pause();
    }

    // 2. Enemy Flashlight Sweep Logic
    enemy.angle += 0.02 * enemy.sweepDirection;
    // Sweep back and forth within a 90-degree arc
    if (enemy.angle > 0.8 || enemy.angle < -0.8) {
        enemy.sweepDirection *= -1;
    }
}

// --- Rendering ---
function drawGraphics() {
    // 1. Draw Floor (Repeating Pattern)
    if (images.floor.complete) {
        const pattern = ctx.createPattern(images.floor, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Enemy Flashlight Cone
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    
    // Flashlight Gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)'); // Cellflow cyan glow
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Draw a cone shape facing "down"
    ctx.arc(0, 0, 300, Math.PI/4, (Math.PI*3)/4, false);
    ctx.fill();
    ctx.restore();

    // 3. Draw Enemy
    if (images.enemy.complete) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        // Assuming enemy faces "down" naturally, no rotation needed right now
        ctx.drawImage(images.enemy, -64, -64, 128, 128); // Offset by half size to center
        ctx.restore();
    }

    // 4. Draw Player
    if (images.player.complete) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.drawImage(images.player, -64, -64, 128, 128);
        ctx.restore();
    }
}
