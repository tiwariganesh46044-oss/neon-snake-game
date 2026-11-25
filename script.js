// ==========================================
// NEON SNAKE - GAME ENGINE
// PART 1: MOVEMENT, FOOD AND COLLISION
// ==========================================

// GET HTML ELEMENTS

const levelElement = document.getElementById("currentLevel");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const snakeLengthElement = document.getElementById("snakeLength");

const gameOverlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayIcon = document.getElementById("overlayIcon");

const resultPanel = document.getElementById("resultPanel");
const finalScoreElement = document.getElementById("finalScore");
const finalLengthElement = document.getElementById("finalLength");
const finalBestScoreElement = document.getElementById("finalBestScore");
const newRecordElement = document.getElementById("newRecord");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

const difficultySelect = document.getElementById("difficulty");

// GAME SETTINGS

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

// GAME VARIABLES

let snake = [];
let food = {};

let direction = "right";
let nextDirection = "right";

let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;

let gameStartHighScore = highScore;

let gameSpeed = 150;

let currentLevel = 1;

let gameInterval = null;

let countdownInterval = null;
let countdownActive = false;

let gameRunning = false;
let gamePaused = false;
let gameOver = false;

// INITIAL HIGH SCORE

highScoreElement.textContent = highScore;


// ==========================================
// DRAW GAME BACKGROUND
// ==========================================

function drawBackground() {

    ctx.fillStyle = "#080f1b";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GRID LINES

    ctx.strokeStyle = "rgba(57, 255, 136, 0.055)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= TILE_COUNT; i++) {

        ctx.beginPath();

        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);

        ctx.stroke();

    }

}


// ==========================================
// DRAW SNAKE
// ==========================================

function drawSnake() {

    snake.forEach((segment, index) => {

        const padding = index === 0 ? 2 : 3;

        const x = segment.x * GRID_SIZE + padding;
        const y = segment.y * GRID_SIZE + padding;

        const size = GRID_SIZE - padding * 2;

        // SNAKE BODY

        if (index === 0) {

            ctx.fillStyle = "#b6ffcf";

            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 15;

        } else {

            const gradient = ctx.createLinearGradient(
                x,
                y,
                x + size,
                y + size
            );

            gradient.addColorStop(0, "#39ff88");
            gradient.addColorStop(1, "#12c96b");

            ctx.fillStyle = gradient;

            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 8;

        }

        ctx.beginPath();

        ctx.roundRect(
            x,
            y,
            size,
            size,
            6
        );

        ctx.fill();

        ctx.shadowBlur = 0;

    });

    // DRAW SNAKE EYES

    drawSnakeEyes();

}


// ==========================================
// DRAW SNAKE EYES
// ==========================================

function drawSnakeEyes() {

    if (snake.length === 0) return;

    const head = snake[0];

    const centerX = head.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = head.y * GRID_SIZE + GRID_SIZE / 2;

    let eye1 = {};
    let eye2 = {};

    if (direction === "right") {

        eye1 = { x: centerX + 4, y: centerY - 4 };
        eye2 = { x: centerX + 4, y: centerY + 4 };

    } else if (direction === "left") {

        eye1 = { x: centerX - 4, y: centerY - 4 };
        eye2 = { x: centerX - 4, y: centerY + 4 };

    } else if (direction === "up") {

        eye1 = { x: centerX - 4, y: centerY - 4 };
        eye2 = { x: centerX + 4, y: centerY - 4 };

    } else {

        eye1 = { x: centerX - 4, y: centerY + 4 };
        eye2 = { x: centerX + 4, y: centerY + 4 };

    }

    ctx.fillStyle = "#07140d";

    ctx.beginPath();

    ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
    ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);

    ctx.fill();

}


// ==========================================
// DRAW FOOD
// ==========================================

function drawFood() {

    const x = food.x * GRID_SIZE + GRID_SIZE / 2;
    const y = food.y * GRID_SIZE + GRID_SIZE / 2;

    // FOOD GLOW

    ctx.save();

    ctx.shadowColor = "#ff4567";
    ctx.shadowBlur = 18;

    const gradient = ctx.createRadialGradient(
        x - 3,
        y - 3,
        1,
        x,
        y,
        10
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.35, "#ff8299");
    gradient.addColorStop(1, "#ff174f");

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}


// ==========================================
// GENERATE FOOD
// ==========================================

function generateFood() {

    let newFood;

    do {

        newFood = {

            x: Math.floor(Math.random() * TILE_COUNT),

            y: Math.floor(Math.random() * TILE_COUNT)

        };

    } while (

        snake.some(segment =>

            segment.x === newFood.x &&
            segment.y === newFood.y

        )

    );

    food = newFood;

}


// ==========================================
// UPDATE SCORE
// ==========================================

function updateScore() {


    currentLevel = Math.floor(score / 50) + 1;

    levelElement.textContent = currentLevel;
    scoreElement.textContent = score;

    snakeLengthElement.textContent = snake.length;

    if (score > highScore) {

        highScore = score;

        highScoreElement.textContent = highScore;

        localStorage.setItem("snakeHighScore", highScore);

    }

}


// ==========================================
// DYNAMIC GAME SPEED
// ==========================================

function updateGameSpeed() {

    const difficulty = difficultySelect.value;

    let baseSpeed = 150;

    if (difficulty === "medium") {
        baseSpeed = 110;
    }

    if (difficulty === "hard") {
        baseSpeed = 75;
    }

    gameSpeed = Math.max(
        45,
        baseSpeed - (currentLevel - 1) * 10
    );

    if (gameRunning && !gamePaused) {

        clearInterval(gameInterval);

        gameInterval = setInterval(gameLoop, gameSpeed);

    }

}


// ==========================================
// CHANGE DIRECTION
// ==========================================

function changeDirection(newDirection) {

    if (!gameRunning || gamePaused || gameOver) return;

    const oppositeDirections = {

        up: "down",
        down: "up",
        left: "right",
        right: "left"

    };

    if (newDirection === oppositeDirections[direction]) {

        return;

    }

    nextDirection = newDirection;

}


// ==========================================
// KEYBOARD CONTROLS
// ==========================================

document.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    const keyDirections = {

        arrowup: "up",
        w: "up",

        arrowdown: "down",
        s: "down",

        arrowleft: "left",
        a: "left",

        arrowright: "right",
        d: "right"

    };

    if (keyDirections[key]) {

        event.preventDefault();

        changeDirection(keyDirections[key]);

    }

});


// ==========================================
// MOVE SNAKE
// ==========================================

function moveSnake() {

    direction = nextDirection;

    const head = {

        x: snake[0].x,
        y: snake[0].y

    };

    // MOVE IN SELECTED DIRECTION

    if (direction === "right") head.x++;

    if (direction === "left") head.x--;

    if (direction === "up") head.y--;

    if (direction === "down") head.y++;


    // CHECK WALL COLLISION

    if (

        head.x < 0 ||
        head.x >= TILE_COUNT ||
        head.y < 0 ||
        head.y >= TILE_COUNT

    ) {

        endGame();

        return;

    }


    // CHECK FOOD COLLISION

    const ateFood = (

        head.x === food.x &&
        head.y === food.y

    );


    // CHECK SELF COLLISION

    const bodyToCheck = ateFood
        ? snake
        : snake.slice(0, -1);

    const hitBody = bodyToCheck.some(segment =>

        segment.x === head.x &&
        segment.y === head.y

    );

    if (hitBody) {

        endGame();

        return;

    }


    // ADD NEW HEAD

    snake.unshift(head);


    // EAT FOOD

    if (ateFood) {

        score += 10;

        playEatSound();

        updateScore();

        generateFood();

        updateGameSpeed();

    } else {

        snake.pop();

    }

}


// ==========================================
// RENDER GAME
// ==========================================

function drawGame() {

    drawBackground();

    drawFood();

    drawSnake();

}


// ==========================================
// GAME LOOP
// ==========================================

function gameLoop() {

    if (!gameRunning || gamePaused || gameOver) return;

    moveSnake();

    if (gameOver) return;

    drawGame();

}


// ==========================================
// INITIALIZE GAME
// ==========================================

function initializeGame() {

    clearInterval(gameInterval);
    clearInterval(countdownInterval);

    countdownActive = false;

    startBtn.style.display = "";

    snake = [

        { x: 10, y: 10 },

        { x: 9, y: 10 },

        { x: 8, y: 10 }

    ];

    direction = "right";

    nextDirection = "right";

    score = 0;

    currentLevel = 1;

    levelElement.textContent = currentLevel;

    gameRunning = false;

    gamePaused = false;

    gameOver = false;

    const difficulty = difficultySelect.value;

    if (difficulty === "easy") {

        gameSpeed = 150;

    } else if (difficulty === "medium") {

        gameSpeed = 110;

    } else {

        gameSpeed = 75;

    }

    generateFood();

    updateScore();

    drawGame();

    pauseBtn.disabled = true;

    pauseBtn.textContent = "⏸ PAUSE";

}


// ==========================================
// START GAME WITH COUNTDOWN
// ==========================================

function startGame() {

    if (gameRunning || countdownActive) return;

    if (gameOver) {
        initializeGame();
    }

    gameStartHighScore = highScore;

    gameRunning = false;
    gamePaused = false;

    clearInterval(gameInterval);
    clearInterval(countdownInterval);

    resultPanel.style.display = "none";
    newRecordElement.style.display = "none";

    overlayIcon.textContent = "3";
    overlayTitle.textContent = "GET READY!";
    overlayMessage.textContent = "Game starts in...";
    overlayMessage.style.display = "block";

    startBtn.style.display = "none";

    pauseBtn.disabled = true;
    pauseBtn.textContent = "⏸ PAUSE";

    gameOverlay.style.display = "flex";

    countdownActive = true;

    let countdownValue = 3;

    function showCountdown(value) {

        overlayIcon.classList.remove("countdown-pop");

        void overlayIcon.offsetWidth;

        overlayIcon.textContent = value;

        overlayIcon.classList.add("countdown-pop");

        if (soundEnabled) {

            if (value === "GO!") {
                playSound(700, 0.2);
            } else {
                playSound(450, 0.1);
            }

        }

    }

    showCountdown("3");

    countdownInterval = setInterval(() => {

        countdownValue--;

        if (countdownValue > 0) {

            showCountdown(String(countdownValue));

        } else if (countdownValue === 0) {

            showCountdown("GO!");

            overlayTitle.textContent = "LET'S GO!";

        } else {

            clearInterval(countdownInterval);

            countdownInterval = null;

            countdownActive = false;

            startBtn.style.display = "";

            gameOverlay.style.display = "none";

            gameRunning = true;

            pauseBtn.disabled = false;

            gameInterval = setInterval(gameLoop, gameSpeed);

        }

    }, 800);

}


// ==========================================
// GAME OVER
// ==========================================

function endGame() {

    gameRunning = false;

    gameOver = true;

    playGameOverSound();

    clearInterval(gameInterval);

    pauseBtn.disabled = true;

    overlayIcon.textContent = "💀";

    overlayTitle.textContent = "GAME OVER!";

    overlayMessage.style.display = "none";

    // Show final game statistics
    finalScoreElement.textContent = score;

    finalLengthElement.textContent = snake.length;

    finalBestScoreElement.textContent = highScore;

    // Check if player created a new record
    if (score > gameStartHighScore) {

        newRecordElement.style.display = "block";

    } else {

        newRecordElement.style.display = "none";

    }

    // Show result panel
    resultPanel.style.display = "grid";

    startBtn.textContent = "↻ PLAY AGAIN";

    gameOverlay.style.display = "flex";

}


// ==========================================
// PAUSE GAME
// ==========================================

function pauseGame() {

    if (!gameRunning || gameOver) return;

    gamePaused = !gamePaused;

    if (gamePaused) {

        clearInterval(gameInterval);

        pauseBtn.textContent = "▶ RESUME";

        overlayIcon.textContent = "⏸️";

        overlayTitle.textContent = "GAME PAUSED";

        overlayMessage.textContent =
            "Take a break! Resume when you're ready.";

        startBtn.textContent = "▶ RESUME GAME";

        gameOverlay.style.display = "flex";

    } else {

        gameOverlay.style.display = "none";

        pauseBtn.textContent = "⏸ PAUSE";

        clearInterval(gameInterval);

        gameInterval = setInterval(gameLoop, gameSpeed);

    }

}


// ==========================================
// RESTART GAME
// ==========================================

function restartGame() {

    initializeGame();

    overlayIcon.textContent = "🐍";

    overlayTitle.textContent = "READY PLAYER?";

    overlayMessage.textContent =
        "Your adventure starts here!";

    startBtn.textContent = "▶ START GAME";

    gameOverlay.style.display = "flex";

}


// ==========================================
// BUTTON EVENTS
// ==========================================

startBtn.addEventListener("click", () => {

    if (gamePaused) {

        pauseGame();

    } else {

        startGame();

    }

});

pauseBtn.addEventListener("click", pauseGame);

restartBtn.addEventListener("click", restartGame);


// ==========================================
// DIFFICULTY CHANGE
// ==========================================

difficultySelect.addEventListener("change", () => {

    initializeGame();

    gameOverlay.style.display = "flex";

    overlayIcon.textContent = "🐍";

    overlayTitle.textContent = "READY PLAYER?";

    overlayMessage.textContent =
        "Difficulty updated! Start your game.";

    startBtn.textContent = "▶ START GAME";

});


// ==========================================
// INITIAL GAME SETUP
// ==========================================

initializeGame();

console.log("NEON SNAKE GAME ENGINE INITIALIZED!");


// ==========================================
// MOBILE DIRECTION CONTROLS
// ==========================================

const directionButtons = document.querySelectorAll(".direction-btn");

directionButtons.forEach(button => {

    button.addEventListener("click", () => {

        const newDirection = button.dataset.direction;

        changeDirection(newDirection);

    });

});

// ==========================================
// MOBILE SWIPE CONTROLS
// ==========================================

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", event => {

    const touch = event.changedTouches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

}, { passive: true });


canvas.addEventListener("touchend", event => {

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    const minSwipeDistance = 25;

    if (
        Math.abs(deltaX) < minSwipeDistance &&
        Math.abs(deltaY) < minSwipeDistance
    ) {
        return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {

        if (deltaX > 0) {

            changeDirection("right");

        } else {

            changeDirection("left");

        }

    } else {

        if (deltaY > 0) {

            changeDirection("down");

        } else {

            changeDirection("up");

        }

    }

}, { passive: true });



// ==========================================
// SOUND EFFECT SYSTEM
// ==========================================

let soundEnabled = true;

let audioContext = null;

const soundBtn = document.getElementById("soundBtn");


function playSound(frequency, duration, type = "sine") {

    if (!soundEnabled) return;

    try {

        if (!audioContext) {

            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) return;

            audioContext = new AudioContextClass();

        }

        if (audioContext.state === "suspended") {

            audioContext.resume();

        }

        const oscillator = audioContext.createOscillator();

        const gainNode = audioContext.createGain();

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            frequency,
            audioContext.currentTime
        );

        gainNode.gain.setValueAtTime(
            0.12,
            audioContext.currentTime
        );

        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gainNode);

        gainNode.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(audioContext.currentTime + duration);

    } catch (error) {

        console.warn("Sound could not be played:", error);

    }

}


// FOOD SOUND

function playEatSound() {

    playSound(650, 0.12, "sine");

}


// GAME OVER SOUND

function playGameOverSound() {

    playSound(180, 0.35, "triangle");

}


// SOUND BUTTON

soundBtn.addEventListener("click", () => {

    soundEnabled = !soundEnabled;

    if (soundEnabled) {

        soundBtn.textContent = "🔊 SOUND ON";

        playSound(500, 0.1);

    } else {

        soundBtn.textContent = "🔇 SOUND OFF";

    }

});



// =========================================
// LIGHT / DARK MODE TOGGLE
// =========================================

const themeBtn = document.getElementById("themeBtn");

// Load previously saved theme
const savedTheme = localStorage.getItem("snakeGameTheme");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
}

// Update button text
function updateThemeButton() {
    if (document.body.classList.contains("light-mode")) {
        themeBtn.textContent = "🌙 DARK MODE";
    } else {
        themeBtn.textContent = "☀️ LIGHT MODE";
    }
}

// Set initial button text
updateThemeButton();

// Change theme on button click
themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const isLightMode = document.body.classList.contains("light-mode");

    localStorage.setItem(
        "snakeGameTheme",
        isLightMode ? "light" : "dark"
    );

    updateThemeButton();

    // Play theme change sound if sound is enabled
    if (soundEnabled) {
        playSound(650, 0.12);
    }

});