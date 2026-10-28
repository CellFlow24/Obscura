// ==========================================
// 1. GRABBING THE SCREEN ELEMENTS
// ==========================================
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;

// ==========================================
// 2. AUDIO SYSTEM (The new background music)
// ==========================================
const sfx = {
    start: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    footstep: new Audio('https://assets.mixkit.co/active_storage/sfx/2679/2679-preview.mp3'),
    bgm: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
    hover: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3') 
};

sfx.bgm.loop = true;
sfx.bgm.volume = 0.4;
sfx.footstep.volume = 0.2;
sfx.footstep.playbackRate = 1.5;
sfx.hover.volume = 0.2;

// Browsers require a user to click anywhere before music is allowed to play
document.body.addEventListener('pointerdown', () => {
    if (sfx.bgm.paused && !gameRunning) {
        sfx.bgm.play().catch(e => console.log("Waiting for user to click..."));
    }
}, { once: true });

// Play a beep when the mouse touches the Start Button
startBtn.addEventListener('mouseenter', () => {
    sfx.hover.currentTime = 0; 
    sfx.hover.play().catch(() => {});
});

// ==========================================
// 3. LOADING YOUR IMAGES
// ==========================================
const images = {
    player: new Image(),
    enemy: new Image(),
    floor: new Image()
};
images.player.src = './Stock/Player.png';
images.enemy.src = './Stock/Enemy.png';
images.floor.src = './Stock/Floor.png';

// ==========================================
// 4. GAME CHARACTERS (Where they start)
// ==========================================
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

// ==========================================
// 5. SCREEN SETUP & CONTROLS
// ==========================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
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

// Tap or Click to Move
canvas.addEventListener('pointerdown', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

// ==========================================
// 6. THE START BUTTON ACTION
// ==========================================
startBtn.addEventListener('click', () => {
    sfx.bgm.volume = 0.1; // Lower background music slightly
    sfx.start.play(); // Play click sound

    startScreen.classList.remove('active');
    canvas.classList.add('active');
    
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

// ==========================================
// 7. THE GAME ENGINE (Runs continuously)
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
        
        if (!player.isMoving) {
            sfx.footstep.play();
            player.isMoving = true;
        }
    } else {
        player.isMoving = false;
        sfx.footstep.pause();
    }

    enemy.angle += 0.02 * enemy.sweepDirection;
    if (enemy.angle > 0.8 || enemy.angle < -0.8) {
        enemy.sweepDirection *= -1;
    }
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
