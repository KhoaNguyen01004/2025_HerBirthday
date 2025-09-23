// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let bird = { x: 50, y: 300, width: 60, height: 60, velocity: 0 };
let pipes = [];
let score = 0;
let gameRunning = false;
let gameOver = false;
let countdownActive = false;
let countdownInterval;
let pipesPassed = 0;
let maxPipes = 22;
let fireworks = [];
let happyBirthday = false;

// Images
let birdImages = [];
let pipeImage = new Image();
let currentBirdIndex = 0;
let imagesLoaded = false;

// Automatically detect and load bird images
let birdIndex = 1;
function loadBirdImages() {
    let img = new Image();
    img.onload = () => {
        birdImages.push(img);
        imagesLoaded = true;
        birdIndex++;
        loadBirdImages(); // Load next image
    };
    img.onerror = () => {
        // Stop loading when image fails
        if (birdImages.length > 0) {
            imagesLoaded = true;
        }
    };
    img.src = `images/bird${birdIndex}.png`;
}

loadBirdImages();

pipeImage.onload = () => {
    imagesLoaded = true;
};
pipeImage.onerror = () => {
    imagesLoaded = false;
};
pipeImage.src = 'images/pipe.png';

// Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 200;
const PIPE_SPEED = 2;

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning && !countdownActive) {
            startCountdown();
        } else if (!gameOver) {
            jump();
        } else {
            restartGame();
        }
    }
});

canvas.addEventListener('click', () => {
    if (!gameRunning && !countdownActive && !gameOver) {
        startCountdown();
    } else if (gameRunning && !gameOver) {
        jump();
    }
});

// Restart button event listener
document.getElementById('restartBtn').addEventListener('click', restartGame);

// Functions
function startCountdown() {
    if (countdownActive || gameRunning || gameOver) return;

    countdownActive = true;
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    countdownElement.classList.remove('hidden');
    countdownElement.textContent = countdown;

    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownElement.textContent = countdown;
        } else if (countdown === 0) {
            countdownElement.textContent = "Go!";
            setTimeout(() => {
                countdownElement.classList.add('hidden');
                clearInterval(countdownInterval);
                countdownActive = false;
                startGame();
            }, 500);
        }
    }, 1000);
}

function startGame() {
    gameRunning = true;
    gameOver = false;
    bird.y = 300;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    pipesPassed = 0;
    fireworks = [];
    happyBirthday = false;
    const countdownElement = document.getElementById('countdown');
    countdownElement.classList.add('hidden');
    countdownElement.textContent = "";
    document.getElementById('gameOver').classList.add('hidden');
    // Play background music
    const music = document.getElementById('backgroundMusic');
    music.currentTime = 0; // Restart music from beginning
    music.play();
    gameLoop();
}

function jump() {
    bird.velocity = JUMP_FORCE;
}

function restartGame() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    countdownActive = false;
    gameRunning = false;
    gameOver = false;
    pipesPassed = 0;
    fireworks = [];
    happyBirthday = false;
    currentBirdIndex = 0; // Reset bird skin to bird1.png
    document.getElementById('countdown').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    startCountdown();
}

function gameLoop() {
    if (!gameRunning || gameOver) return;

    if (!happyBirthday) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Check if max pipes reached
    if (pipesPassed >= maxPipes) {
        happyBirthday = true;
        bird.velocity = 0;
        gameRunning = false;
        return;
    }

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Check ground and ceiling collision
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        endGame();
        return;
    }

    // Update pipes
    pipes.forEach((pipe, index) => {
        pipe.x -= PIPE_SPEED;

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
            pipes.splice(index, 1);
        }

        // Check collision with bird
        if (
            bird.x < pipe.x + PIPE_WIDTH &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
        ) {
            endGame();
            return;
        }

        // Update score
        if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
            pipe.passed = true;
            score++;
            pipesPassed++;
            // Change bird skin
            currentBirdIndex = (currentBirdIndex + 1) % birdImages.length;
            // Check if max pipes reached
            if (pipesPassed >= maxPipes) {
                happyBirthday = true;
                return;
            }
        }
    });

    // Generate pipes after updating pipes
    if (pipesPassed < maxPipes && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200)) {
        const pipeHeight = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        pipes.push({
            x: canvas.width,
            topHeight: pipeHeight,
            bottomY: pipeHeight + PIPE_GAP,
            bottomHeight: canvas.height - pipeHeight - PIPE_GAP,
            passed: false
        });
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bird
    if (imagesLoaded && birdImages[currentBirdIndex] && birdImages[currentBirdIndex].complete) {
        ctx.drawImage(birdImages[currentBirdIndex], bird.x, bird.y, bird.width, bird.height);
    } else {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    }

    // Draw pipes
    pipes.forEach(pipe => {
        if (imagesLoaded && pipeImage.complete) {
            // Top pipe (flipped upside down)
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(pipeImage, pipe.x, -pipe.topHeight, PIPE_WIDTH, pipe.topHeight);
            ctx.restore();
            // Bottom pipe
            ctx.drawImage(pipeImage, pipe.x, pipe.bottomY, PIPE_WIDTH, pipe.bottomHeight);
        } else {
            ctx.fillStyle = '#228B22';
            // Top pipe
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            // Bottom pipe
            ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, pipe.bottomHeight);
        }
    });

    // Draw score
    document.getElementById('score').textContent = `Score: ${score}`;

    // Draw fireworks
    fireworks.forEach(fw => {
        const alpha = fw.life / fw.maxLife;
        ctx.fillStyle = fw.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(fw.x, fw.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Draw Happy Birthday
    if (happyBirthday) {
        const text = 'Happy Birthday Ẻm';
        const letters = text.split('');
        const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
        let x = canvas.width / 2 - (letters.length * 30) / 2; // approximate
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        letters.forEach((letter, index) => {
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillText(letter, x, canvas.height / 2);
            x += 30; // approximate width per letter
        });
        // Make bird hover
        bird.velocity = 0;
    }
}

function endGame() {
    gameOver = true;
    gameRunning = false;
    // Pause background music
    const music = document.getElementById('backgroundMusic');
    music.pause();
    if (pipesPassed >= maxPipes) {
        // Happy Birthday ending
        document.getElementById('finalScore').textContent = "Happy Birthday Ẻm";
        startFireworks();
    } else {
        document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    }
    document.getElementById('gameOver').classList.remove('hidden');
}

function startFireworks() {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            fireworks.push({
                x: Math.random() * canvas.width,
                y: canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 8 - 2,
                life: 100,
                maxLife: 100,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }, i * 200);
    }
    animateFireworks();
}

function animateFireworks() {
    if (fireworks.length === 0) return;
    fireworks.forEach((fw, index) => {
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.vy += 0.1;
        fw.life--;
        if (fw.life <= 0) {
            fireworks.splice(index, 1);
        }
    });
    draw();
    requestAnimationFrame(animateFireworks);
}

// Initial draw
draw();
