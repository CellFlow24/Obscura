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
        titleContainers.forEach(container => container.style.transform = `translate(${x}px, ${y}px)`);
        if(startScreen.classList.contains('active')) startBtn.style.transform = `translate(${x * 1.5}px, ${y * 1.5}px)`;
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
sfx.footstep.volume = 0.2; sfx.footstep.playbackRate = 1.5; sfx.hover.volume = 0.2;

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
        
        initLevel1();
        gameRunning = true;
        requestAnimationFrame(gameLoop);
    });
});

// ==========================================
// 5. GAME ASSETS & MAP SYSTEM
// ==========================================
const images = { player: new Image(), enemy: new Image(), floor: new Image(), wall: new Image(), target: new Image() };
images.player.src = './Stock/Player.png';
images.enemy.src = './Stock/Enemy.png';
images.floor.src = './Stock/Floor.png';
images.wall.src = './Stock/Wall.png';
images.target.src = './Stock/Target.png';

const tileSize = 80;

// Expanded Map (15x11 Grid) - Much larger to allow camera exploration!
const level1Map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Camera offsets
let cameraX = 0;
let cameraY = 0;

const player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 5, angle: 0, isMoving: false, radius: 25 };
const enemy = { 
    x: 0, y: 0, angle: 0, speed: 2, 
    patrolIndex: 0,
    waypoints: [
        {x: 7.5 * tileSize, y: 5.5 * tileSize},  // Center
        {x: 11.5 * tileSize, y: 5.5 * tileSize}  // Move Right
    ]
};

function initLevel1() {
    // Top left start
    player.x = 1.5 * tileSize;
    player.y = 1.5 * tileSize;
    player.targetX = player.x;
    player.targetY = player.y;

    // Middle enemy
    enemy.x = 7.5 * tileSize;
    enemy.y = 5.5 * tileSize;
}

// ==========================================
// 6. ENGINE & CONTROLS
// ==========================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Adjusted for Camera: Click coordinates + Camera coordinates = World coordinates
canvas.addEventListener('pointerdown', (e) => {
    player.targetX = e.clientX + cameraX; 
    player.targetY = e.clientY + cameraY;
});

// Collision Helper: Checks if a specific point is inside a Wall block (1)
function isWall(x, y) {
    let col = Math.floor(x / tileSize);
    let row = Math.floor(y / tileSize);
    if (row >= 0 && row < level1Map.length && col >= 0 && col < level1Map[0].length) {
        return level1Map[row][col] === 1;
    }
    return true; // Map boundaries act as walls
}

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
    // 1. Player Movement & Collision
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > player.speed) {
        const vx = (dx / distance) * player.speed;
        const vy = (dy / distance) * player.speed;
        
        // Sliding Collision: Allow X movement if X is clear, allow Y movement if Y is clear
        if (!isWall(player.x + vx + (Math.sign(vx) * player.radius), player.y)) {
            player.x += vx;
        }
        if (!isWall(player.x, player.y + vy + (Math.sign(vy) * player.radius))) {
            player.y += vy;
        }
        
        player.angle = Math.atan2(dy, dx) - (Math.PI / 2);
        if (!player.isMoving) { sfx.footstep.play(); player.isMoving = true; }
    } else {
        player.isMoving = false; sfx.footstep.pause();
    }

    // 2. Camera Follow Logic (Keep player in center of screen)
    cameraX = player.x - canvas.width / 2;
    cameraY = player.y - canvas.height / 2;

    // 3. Enemy Patrol AI
    const targetWp = enemy.waypoints[enemy.patrolIndex];
    const edx = targetWp.x - enemy.x;
    const edy = targetWp.y - enemy.y;
    const eDist = Math.hypot(edx, edy);

    if (eDist > enemy.speed) {
        // Walk towards waypoint
        enemy.x += (edx / eDist) * enemy.speed;
        enemy.y += (edy / eDist) * enemy.speed;
        // Face the direction he is walking
        enemy.angle = Math.atan2(edy, edx) + (Math.PI / 2);
    } else {
        // Reached waypoint, switch to the next one
        enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.waypoints.length;
    }
}

function drawGraphics() {
    // Clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Camera Translation to EVERYTHING drawn below
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // 1. Draw Floor Background (Only drawing what's visible on screen)
    if (images.floor.complete) {
        const pattern = ctx.createPattern(images.floor, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);
    }

    // 2. Draw Maze Layout
    for (let row = 0; row < level1Map.length; row++) {
        for (let col = 0; col < level1Map[row].length; col++) {
            const tile = level1Map[row][col];
            const tileX = col * tileSize;
            const tileY = row * tileSize;

            if (tile === 1 && images.wall.complete) {
                // Overlaps the tiles by 8 pixels to connect the metal edges
                ctx.drawImage(images.wall, tileX - 4, tileY - 4, tileSize + 8, tileSize + 8);
            } else if (tile === 2 && images.target.complete) {
                ctx.drawImage(images.target, tileX + 16, tileY + 16, tileSize - 32, tileSize - 32);
            }
        }
    }

    // 3. Draw Enemy Realistic Vision Cone (Raycasting)
    drawVisionCone(enemy.x, enemy.y, enemy.angle + (Math.PI/2));

    // 4. Draw Enemy Character
    if (images.enemy.complete) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.drawImage(images.enemy, -40, -40, 80, 80);
        ctx.restore();
    }

    // 5. Draw Player Character
    if (images.player.complete) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.drawImage(images.player, -40, -40, 80, 80);
        ctx.restore();
    }

    // Restore standard screen coordinates for next frame
    ctx.restore();
}

// Engine Magic: Raycasting checks lines extending from the enemy. If it hits a wall, it stops drawing the light.
function drawVisionCone(startX, startY, baseAngle) {
    const range = 350; 
    const fov = Math.PI / 2; // 90 degree field of view
    const numRays = 60; // How many light beams to cast (Higher = smoother shadow, lower = better performance)
    
    ctx.save();
    
    // Create the glowing gradient
    const gradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, range);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Cast rays in an arc
    for (let i = 0; i <= numRays; i++) {
        let rayAngle = (baseAngle - fov / 2) + (i * (fov / numRays));
        let rayX = startX;
        let rayY = startY;
        let distance = 0;
        let stepSize = 10;
        
        // Travel outward until we hit a wall or max range
        while (distance < range) {
            rayX += Math.cos(rayAngle) * stepSize;
            rayY += Math.sin(rayAngle) * stepSize;
            distance += stepSize;
            
            // If the light hits a crate (1), stop traveling
            if (isWall(rayX, rayY)) {
                // Push the ray 25 pixels deeper into the wall to close the visual gap
                rayX += Math.cos(rayAngle) * 25;
                rayY += Math.sin(rayAngle) * 25;
                break; 
            }
        }
        ctx.lineTo(rayX, rayY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
