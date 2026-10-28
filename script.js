// ==========================================
// 1. DOM ELEMENTS & STATE
// ==========================================
const startScreen = document.getElementById('start-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const startBtn = document.getElementById('start-btn');
const diffBtns = document.querySelectorAll('.diff-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const titleContainers = document.querySelectorAll('.title-container');

let gameRunning = false;
let currentDifficulty = 'easy';
let currentLevel = 1;

// ==========================================
// 2. PARALLAX UI EFFECT
// ==========================================
document.addEventListener('mousemove', (e) => {
    if (!gameRunning) {
        const x = (window.innerWidth / 2 - e.pageX) / 45;
        const y = (window.innerHeight / 2 - e.pageY) / 45;
        
        titleContainers.forEach(container => {
            container.style.transform = `translate(${x}px, ${y}px)`;
        });
        if(startScreen.classList.contains('active')) {
            startBtn.style.transform = `translate(${x * 1.5}px, ${y * 1.5}px)`;
        }
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

document.querySelectorAll('.cyber-button').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        sfx.hover.currentTime = 0; sfx.hover.play().catch(() => {});
    });
});

// ==========================================
// 4. MENU FLOW LOGIC
// ==========================================
startBtn.addEventListener('click', () => {
    sfx.start.currentTime = 0; sfx.start.play();
    startScreen.classList.remove('active');
    difficultyScreen.classList.add('active');
});

diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        sfx.bgm.volume = 0.1;
        sfx.start.currentTime = 0; sfx.start.play();
        
        currentDifficulty = e.currentTarget.dataset.diff;
        titleContainers.forEach(container => container.style.transform = 'translate(0,0)');
        
        difficultyScreen.classList.remove('active');
        canvas.classList.add('active');
        
        gameRunning = true;
        initLevel1(); // Set up the player and enemy positions for the level
        requestAnimationFrame(gameLoop);
    });
});

// ==========================================
// 5. GAME ASSETS & MAP SYSTEM
// ==========================================
const images = { 
    player: new Image(), 
    enemy: new Image(), 
    floor: new Image(),
    wall: new Image(),
    target: new Image()
};
images.player.src = './Stock/Player.png';
images.enemy.src = './Stock/Enemy.png';
images.floor.src = './Stock/Floor.png';
images.wall.src = './Stock/Wall.png';
images.target.src = './Stock/Target.png';

// Grid Configuration
const tileSize = 80; // Size of each block on the screen
let mapOffsetX = 0;
let mapOffsetY = 0;

// Level 1 Map Array (1 = Wall, 0 = Floor, 2 = Target)
const level1Map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 2, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 5, angle: 0, isMoving: false };
const enemy = { x: 0, y: 0, angle: 0, sweepDirection: 1 };

// ==========================================
// 6. ENGINE & CONTROLS
// ==========================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Center the map dynamically based on screen size
    const mapWidth = level1Map[0].length * tileSize;
    const mapHeight = level1Map.length * tileSize;
    mapOffsetX = (canvas.width - mapWidth) / 2;
    mapOffsetY = (canvas.height - mapHeight) / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initLevel1() {
    // Spawn player in the bottom left area of the grid
    player.x = mapOffsetX + (1.5 * tileSize);
    player.y = mapOffsetY + (5.5 * tileSize);
    player.targetX = player.x;
    player.targetY = player.y;

    // Spawn enemy in the middle of the map
    enemy.x = mapOffsetX + (5.5 * tileSize);
    enemy.y = mapOffsetY + (3.5 * tileSize);
}

canvas.addEventListener('pointerdown', (e) => {
    player.targetX = e.clientX; player.targetY = e.clientY;
});

// ==========================================
// 7. GAME LOOP & RENDERING
// ==========================================
function gameLoop() {
    if (!gameRunning) return;
    updateLogic();
    drawGraphics();
    requestAnimationFrame(gameLoop);
}

function updateLogic() {
    // Basic Movement Logic
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

    // Enemy Flashlight Sweep
    enemy.angle += 0.02 * enemy.sweepDirection;
    if (enemy.angle > 0.8 || enemy.angle < -0.8) enemy.sweepDirection *= -1;
}

function drawGraphics() {
    // Draw Floor Background
    if (images.floor.complete) {
        const pattern = ctx.createPattern(images.floor, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw the Maze (Walls and Target)
    for (let row = 0; row < level1Map.length; row++) {
        for (let col = 0; col < level1Map[row].length; col++) {
            const tile = level1Map[row][col];
            const tileX = mapOffsetX + (col * tileSize);
            const tileY = mapOffsetY + (row * tileSize);

            if (tile === 1 && images.wall.complete) {
                ctx.drawImage(images.wall, tileX, tileY, tileSize, tileSize);
            } else if (tile === 2 && images.target.complete) {
                // Draw target slightly smaller than a full tile so it looks like an item
                ctx.drawImage(images.target, tileX + 16, tileY + 16, tileSize - 32, tileSize - 32);
            }
        }
    }

    // Draw Enemy & Vision Cone
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 250, Math.PI/4, (Math.PI*3)/4, false);
    ctx.fill();
    ctx.restore();

    if (images.enemy.complete) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.drawImage(images.enemy, -40, -40, 80, 80); // Scaled down to fit the grid
        ctx.restore();
    }

    // Draw Player
    if (images.player.complete) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.drawImage(images.player, -40, -40, 80, 80); // Scaled down to fit the grid
        ctx.restore();
    }
}
