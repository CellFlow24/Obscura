// ==========================================
// 1. DOM ELEMENTS & STATE
// ==========================================
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const titleContainer = document.querySelector('.title-container');

let gameRunning = false;

// ==========================================
// 2. PARALLAX UI EFFECT (Mouse Tracking)
// ==========================================
document.addEventListener('mousemove', (e) => {
    if (!gameRunning && titleContainer && startBtn) {
        // Calculate mouse position relative to center of screen
        const x = (window.innerWidth / 2 - e.pageX) / 45;
        const y = (window.innerHeight / 2 - e.pageY) / 45;
        
        // Move elements slightly in opposite direction of mouse
        titleContainer.style.transform = `translate(${x}px, ${y}px)`;
        startBtn.style.transform = `translate(${x * 1.5}px, ${y * 1.5}px)`;
    }
});

// ==========================================
// 3. AUDIO SYSTEM
// ==========================================
const sfx = {
    start: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    footstep: new Audio('https://assets.mixkit.co/active_storage/sfx/2679/2679-preview.mp3'),
    bgm: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
    hover: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3') 
};

sfx.bgm.loop = true; sfx.bgm.volume = 0.4;
sfx.footstep.volume = 0.2; sfx.footstep.playbackRate = 1.5;
sfx.hover.volume = 0.2;

document.body.addEventListener('pointerdown', () => {
    if (sfx.bgm.paused && !gameRunning) sfx.bgm.play().catch(() => {});
}, { once: true });

startBtn.addEventListener('mouseenter', () => {
    sfx.hover.currentTime = 0; sfx.hover.play().catch(() => {});
});

// ==========================================
// 4. GAME ASSETS & ENTITIES
// ==========================================
const images = { player: new Image(), enemy: new Image(), floor: new Image() };
images.player.src = './Stock/Player.png';
images.enemy.src = './Stock/Enemy.png';
images.floor.src = './Stock/Floor.png';

const player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 5, angle: 0, isMoving: false };
const enemy = { x: 0, y: 0, angle: 0, sweepDirection: 1 };

// ==========================================
// 5. ENGINE & CONTROLS
// ==========================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (!gameRunning) {
        player.x = canvas.width / 2; player.y = canvas.height / 2 + 150;
        player.targetX = player.x; player.targetY = player.y;
        enemy.x = canvas.width / 2; enemy.y = canvas.height / 2 - 150;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('pointerdown', (e) => {
    player.targetX = e.clientX; player.targetY = e.clientY;
});

startBtn.addEventListener('click', () => {
    sfx.bgm.volume = 0.1;
    sfx.start.play();
    
    // Reset parallax transform before hiding
    titleContainer.style.transform = 'translate(0px, 0px)';
    startBtn.style.transform = 'translate(0px, 0px)';

    startScreen.classList.remove('active');
    canvas.classList.add('active');
    
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

// ==========================================
// 6. GAME LOOP & RENDERING
// ==========================================
function gameLoop() {
    if (!gameRunning) return;
    updateLogic();
    drawGraphics();
    requestAnimationFrame(gameLoop);
}

function updateLogic() {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
        player.angle = Math.atan2(dy, dx) + (Math.PI / 2);
        
        if (!player.isMoving) { sfx.footstep.play(); player.isMoving = true; }
    } else {
        player.isMoving = false; sfx.footstep.pause();
    }

    enemy.angle += 0.02 * enemy.sweepDirection;
    if (enemy.angle > 0.8 || enemy.angle < -0.8) enemy.sweepDirection *= -1;
}

function drawGraphics() {
    if (images.floor.complete) {
        const pattern = ctx.createPattern(images.floor, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 300, Math.PI/4, (Math.PI*3)/4, false);
    ctx.fill();
    ctx.restore();

    if (images.enemy.complete) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.drawImage(images.enemy, -64, -64, 128, 128);
        ctx.restore();
    }

    if (images.player.complete) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.drawImage(images.player, -64, -64, 128, 128);
        ctx.restore();
    }
}
