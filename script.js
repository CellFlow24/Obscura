// Game State & DOM Elements
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Canvas setup
let gameRunning = false;

function resizeCanvas() {
    // Make canvas fill the window perfectly
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

// Start Game Event
startBtn.addEventListener('click', () => {
    // 1. Trigger UI fade out
    startScreen.classList.remove('active');
    
    // 2. Trigger Canvas fade in
    canvas.classList.add('active');
    
    // 3. Initialize game
    initGame();
});

function initGame() {
    console.log("Operation Started: Booting Obscura Engine...");
    gameRunning = true;
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;

    // Clear the screen for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // TODO: Draw Floor Map
    // TODO: Draw Walls/Crates
    // TODO: Draw Target
    // TODO: Draw Player
    // TODO: Draw Enemies & Vision Cones

    // Call the next frame
    requestAnimationFrame(gameLoop);
}
