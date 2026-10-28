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
    hover: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
    caught: new Audio('https://assets.mixkit.co/active_storage/sfx/2832/2832-preview.mp3'), // Alert sound
    win: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3') // Success sound
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

// ZOOM IN: Increased tile size from 80 to 120 for tighter camera perspective
const tileSize = 120; 

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

let cameraX = 0, cameraY = 0;
let targetPos = { x: 0, y: 0 }; // Store the final file location

const player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 7, angle: 0, isMoving: false, radius: 30 };
const enemy = { 
    x: 0, y: 0, angle: 0, speed: 3, 
    visionRange: 350,
    fov: Math.PI / 3.5, // Tighter, triangular vision cone
    patrolIndex: 0,
    waypoints: []
};

function initLevel1() {
    player.x = 1.5 * tileSize;
    player.y = 1.5 * tileSize;
    player.targetX = player.x;
    player.targetY = player.y;

    enemy.x = 7.5 * tileSize;
    enemy.y = 5.5 * tileSize;
    enemy.waypoints = [
        {x: 7.5 * tileSize, y: 5.5 * tileSize},
        {x: 7.5 * tileSize, y: 1.5 * tileSize}, // Patrol Up
        {x: 11.5 * tileSize, y: 1.5 * tileSize}, // Patrol Right
        {x: 7.5 * tileSize, y: 5.5 * tileSize}  // Return
    ];

    // Find the Target File Location automatically
    for (let r = 0; r < level1Map.length; r++) {
        for (let c = 0; c < level1Map[r].length; c++) {
            if (level1Map[r][c] === 2) {
                targetPos.x = (c * tileSize) + (tileSize/2);
                targetPos.y = (r * tileSize) + (tileSize/2);
            }
        }
    }
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

canvas.addEventListener('pointerdown', (e) => {
    player.targetX = e.clientX + cameraX; 
    player.targetY = e.clientY + cameraY;
});

function isWall(x, y) {
    let col = Math.floor(x / tileSize);
    let row = Math.floor(y / tileSize);
    if (row >= 0 && row < level1Map.length && col >= 0 && col < level1Map[0].length) {
        return level1Map[row][col] === 1;
    }
    return true; 
}

// Line of Sight Logic: Checks if a straight line hits a wall
function checkLineOfSight(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = dist / 10;
    for (let i = 0; i < steps; i++) {
        const curX = x1 + (x2 - x1) * (i / steps);
        const curY = y1 + (y2 - y1) * (i / steps);
        if (isWall(curX, curY)) return false; // Wall blocking view
    }
    return true; // Clear view
}

// ==========================================
// 7. GAME LOOP & LOGIC
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
        
        if (!isWall(player.x + vx + (Math.sign(vx) * player.radius), player.y)) player.x += vx;
        if (!isWall(player.x, player.y + vy + (Math.sign(vy) * player.radius))) player.y += vy;
        
        player.angle = Math.atan2(dy, dx) - (Math.PI / 2); // Corrected facing angle
        if (!player.isMoving) { sfx.footstep.play(); player.isMoving = true; }
    } else {
        player.isMoving = false; sfx.footstep.pause();
    }

    // 2. Camera Follow
    cameraX = player.x - canvas.width / 2;
    cameraY = player.y - canvas.height / 2;

    // 3. Enemy AI Patrol
    const targetWp = enemy.waypoints[enemy.patrolIndex];
    const edx = targetWp.x - enemy.x;
    const edy = targetWp.y - enemy.y;
    const eDist = Math.hypot(edx, edy);

    if (eDist > enemy.speed) {
        enemy.x += (edx / eDist) * enemy.speed;
        enemy.y += (edy / eDist) * enemy.speed;
        // Smooth angle turning
        const targetAngle = Math.atan2(edy, edx);
        enemy.angle = targetAngle; 
    } else {
        enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.waypoints.length;
    }

    // 4. DETECTION SYSTEM: Is player in light?
    const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (distToPlayer < enemy.visionRange) {
        let angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        
        // Normalize angles to compare correctly
        let angleDiff = Math.abs(angleToPlayer - enemy.angle);
        if (angleDiff > Math.PI) angleDiff = (2 * Math.PI) - angleDiff;

        if (angleDiff < enemy.fov / 2) {
            // Player is in the cone angle. Is a wall blocking?
            if (checkLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
                triggerGameOver();
            }
        }
    }

    // 5. WIN SYSTEM: Did player touch the target?
    const distToTarget = Math.hypot(targetPos.x - player.x, targetPos.y - player.y);
    if (distToTarget < tileSize / 1.5) {
        triggerWin();
    }
}

function triggerGameOver() {
    sfx.footstep.pause();
    sfx.caught.play();
    alert("DETECTED! Operation Failed. Retreat and try again.");
    initLevel1(); // Reset positions
}

function triggerWin() {
    sfx.footstep.pause();
    sfx.win.play();
    alert("DOCUMENT SECURED. Proceeding to extraction.");
    // Temporarily reset to start until Level 2 map is built
    initLevel1();
}

// ==========================================
// 8. RENDERING
// ==========================================
function drawGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    if (images.floor.complete) {
        const pattern = ctx.createPattern(images.floor, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);
    }

    // Draw the UI Path Indicator (Orange dotted line)
    if (player.isMoving) {
        ctx.beginPath();
        ctx.setLineDash([10, 15]);
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.targetX, player.targetY);
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)'; // Orange path
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    }

    for (let row = 0; row < level1Map.length; row++) {
        for (let col = 0; col < level1Map[row].length; col++) {
            const tile = level1Map[row][col];
            const tileX = col * tileSize;
            const tileY = row * tileSize;

            if (tile === 1 && images.wall.complete) {
                // Seamless overlap: Drawing slightly larger to fuse edges
                ctx.drawImage(images.wall, tileX - 4, tileY - 4, tileSize + 8, tileSize + 8);
            } else if (tile === 2 && images.target.complete) {
                ctx.drawImage(images.target, tileX + 30, tileY + 30, tileSize - 60, tileSize - 60);
            }
        }
    }

    drawVisionCone(enemy.x, enemy.y, enemy.angle);

    if (images.enemy.complete) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle + (Math.PI/2));
        ctx.drawImage(images.enemy, -50, -50, 100, 100);
        ctx.restore();
    }

    if (images.player.complete) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle + (Math.PI/2));
        ctx.drawImage(images.player, -50, -50, 100, 100);
        ctx.restore();
    }

    ctx.restore();
}

function drawVisionCone(startX, startY, baseAngle) {
    const range = enemy.visionRange; 
    const fov = enemy.fov; 
    const numRays = 40; // Reduced for performance, sharp enough for triangle
    
    ctx.save();
    const gradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, range);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    for (let i = 0; i <= numRays; i++) {
        let rayAngle = (baseAngle - fov / 2) + (i * (fov / numRays));
        let rayX = startX;
        let rayY = startY;
        let distance = 0;
        let stepSize = 15;
        
        while (distance < range) {
            rayX += Math.cos(rayAngle) * stepSize;
            rayY += Math.sin(rayAngle) * stepSize;
            distance += stepSize;
            
            if (isWall(rayX, rayY)) {
                rayX += Math.cos(rayAngle) * 15; // Push into wall to close gaps
                rayY += Math.sin(rayAngle) * 15;
                break; 
            }
        }
        ctx.lineTo(rayX, rayY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
