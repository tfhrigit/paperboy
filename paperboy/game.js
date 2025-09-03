// Game state and configuration
const gameState = {
    currentScreen: 'mainMenu',
    playerName: localStorage.getItem('playerName') || 'Player1',
    difficulty: localStorage.getItem('difficulty') || 'easy',
    highScores: JSON.parse(localStorage.getItem('highScores')) || [],
    soundEnabled: true
};

// Game settings by difficulty
const difficultySettings = {
    easy: { speed: 2, customerCount: 5, timer: 60, papers: 15, lives: 5 },
    normal: { speed: 3, customerCount: 7, timer: 45, papers: 10, lives: 3 },
    hard: { speed: 4, customerCount: 10, timer: 30, papers: 8, lives: 2 }
};

// DOM Elements
const screens = {
    mainMenu: document.getElementById('mainMenu'),
    profileScreen: document.getElementById('profileScreen'),
    settingsScreen: document.getElementById('settingsScreen'),
    scoreScreen: document.getElementById('scoreScreen'),
    gameScreen: document.getElementById('gameScreen')
};

// Buttons
document.getElementById('playBtn').addEventListener('click', () => showScreen('gameScreen'));
document.getElementById('profileBtn').addEventListener('click', () => {
    document.getElementById('playerName').value = gameState.playerName;
    showScreen('profileScreen');
});
document.getElementById('settingsBtn').addEventListener('click', () => {
    document.querySelector(`input[name="difficulty"][value="${gameState.difficulty}"]`).checked = true;
    showScreen('settingsScreen');
});
document.getElementById('scoreBtn').addEventListener('click', () => {
    displayHighScores();
    showScreen('scoreScreen');
});
document.getElementById('exitBtn').addEventListener('click', () => {
    alert('Terima kasih telah bermain!');
});

// Back buttons
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen('mainMenu'));
});

// Profile saving
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const newName = document.getElementById('playerName').value.trim();
    if (newName) {
        gameState.playerName = newName;
        localStorage.setItem('playerName', newName);
        alert('Profile saved successfully!');
        showScreen('mainMenu');
    }
});

// Settings saving
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    gameState.difficulty = selectedDifficulty;
    localStorage.setItem('difficulty', selectedDifficulty);
    alert('Settings saved successfully!');
    showScreen('mainMenu');
});

// Sound toggle
document.getElementById('soundToggle').addEventListener('click', () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    const icon = document.querySelector('#soundToggle i');
    if (gameState.soundEnabled) {
        icon.className = 'fas fa-volume-up';
        if (backgroundMusic) {
            backgroundMusic.play();
        }
    } else {
        icon.className = 'fas fa-volume-mute';
        if (backgroundMusic) {
            backgroundMusic.pause();
        }
    }
});

// Screen management
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show requested screen
    screens[screenName].classList.remove('hidden');
    gameState.currentScreen = screenName;
    
    // If showing game screen, start the game
    if (screenName === 'gameScreen') {
        startGame();
    }
}

// High scores display
function displayHighScores() {
    const scoresList = document.getElementById('highScoresList');
    scoresList.innerHTML = '';
    
    if (gameState.highScores.length === 0) {
        scoresList.innerHTML = '<div class="text-center pixel-font">No scores yet!</div>';
        return;
    }
    
    // Sort scores from highest to lowest
    const sortedScores = [...gameState.highScores].sort((a, b) => b.score - a.score);
    
    sortedScores.forEach((score, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-item pixel-font';
        scoreElement.innerHTML = `<strong>${index + 1}.</strong> ${score.name}: ${score.score} (${score.difficulty})`;
        scoresList.appendChild(scoreElement);
    });
}

// Game variables
let canvas, ctx;
let bikeX, bikeY;
let papers = [];
let customers = [];
let gameScore = 0;
let gameTimer;
let paperCount;
let livesCount;
let gameActive = false;
let backgroundMusic;
let timerInterval;

// Initialize game
function startGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas to fullscreen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get settings for current difficulty
    const settings = difficultySettings[gameState.difficulty];
    
    // Initialize game state
    bikeX = 50;
    bikeY = canvas.height / 2;
    gameScore = 0;
    paperCount = settings.papers;
    livesCount = settings.lives;
    papers = [];
    customers = [];
    
    // Create customers
    for (let i = 0; i < settings.customerCount; i++) {
        customers.push({
            x: Math.random() * (canvas.width - 100) + 100,
            y: Math.random() * (canvas.height - 100) + 50,
            width: 20,
            height: 40,
            hit: false
        });
    }
    
    // Initialize UI
    updateUI();
    
    // Start game timer
    gameTimer = settings.timer;
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (gameActive) {
            gameTimer--;
            document.getElementById('timer').textContent = `Time: ${gameTimer}`;
            
            if (gameTimer <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }
    }, 1000);
    
    // Start background music (commented out for now as we don't have a file)
    // backgroundMusic = new Audio('backsound.mp3');
    // backgroundMusic.loop = true;
    // if (gameState.soundEnabled) {
    //     backgroundMusic.play();
    // }
    
    gameActive = true;
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameActive) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height / 2 - 25, canvas.width, 50);
    
    // Draw road lines
    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, canvas.height / 2 - 2, 15, 4);
    }
    
    // Move bike
    const settings = difficultySettings[gameState.difficulty];
    bikeX += settings.speed;
    if (bikeX > canvas.width) {
        bikeX = 0;
    }
    
    // Draw bike and rider
    ctx.fillStyle = '#c00';
    ctx.fillRect(bikeX, bikeY, 40, 20); // Bike body
    ctx.fillStyle = '#333';
    ctx.fillRect(bikeX + 30, bikeY - 10, 5, 10); // Seat post
    ctx.fillRect(bikeX + 10, bikeY - 15, 20, 15); // Handlebar
    
    // Draw rider
    ctx.fillStyle = '#00f';
    ctx.fillRect(bikeX + 15, bikeY - 30, 10, 15); // Body
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(bikeX + 20, bikeY - 35, 5, 0, Math.PI * 2); // Head
    ctx.fill();
    
    // Update and draw papers
    for (let i = papers.length - 1; i >= 0; i--) {
        const paper = papers[i];
        paper.x += 10;
        
        // Draw paper
        ctx.fillStyle = '#fff';
        ctx.fillRect(paper.x, paper.y, 8, 10);
        
        // Check for collisions with customers
        for (let j = 0; j < customers.length; j++) {
            const customer = customers[j];
            if (!customer.hit &&
                paper.x < customer.x + customer.width &&
                paper.x + 8 > customer.x &&
                paper.y < customer.y + customer.height &&
                paper.y + 10 > customer.y) {
                
                customer.hit = true;
                gameScore += 10;
                updateUI();
                
                // Remove paper
                papers.splice(i, 1);
                break;
            }
        }
        
        // Remove papers that go off screen
        if (paper.x > canvas.width) {
            papers.splice(i, 1);
        }
    }
    
    // Draw customers
    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        
        if (customer.hit) {
            // Draw happy customer
            ctx.fillStyle = '#0f0';
            ctx.fillRect(customer.x, customer.y, customer.width, customer.height);
            
            // Draw smile
            ctx.fillStyle = '#000';
            ctx.fillRect(customer.x + 5, customer.y + 25, 10, 2);
        } else {
            // Draw waiting customer
            ctx.fillStyle = '#f0f';
            ctx.fillRect(customer.x, customer.y, customer.width, customer.height);
            
            // Draw raised hand
            ctx.fillRect(customer.x + 15, customer.y - 10, 5, 10);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Throw paper
function throwPaper() {
    if (paperCount > 0 && gameActive) {
        papers.push({
            x: bikeX + 40,
            y: bikeY
        });
        paperCount--;
        updateUI();
    }
}

// Update UI elements
function updateUI() {
    document.getElementById('timer').textContent = `Time: ${gameTimer}`;
    document.getElementById('score').textContent = `Score: ${gameScore}`;
    document.getElementById('papers').textContent = `Papers: ${paperCount}`;
    document.getElementById('lives').textContent = `Lives: ${livesCount}`;
}

// End game
function endGame() {
    gameActive = false;
    
    // Add to high scores
    gameState.highScores.push({
        name: gameState.playerName,
        score: gameScore,
        difficulty: gameState.difficulty
    });
    
    // Save to localStorage
    localStorage.setItem('highScores', JSON.stringify(gameState.highScores));
    
    // Show game over message
    alert(`Game Over!\nYour Score: ${gameScore}`);
    
    // Return to main menu
    showScreen('mainMenu');
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (gameState.currentScreen === 'gameScreen' && e.code === 'Space') {
        throwPaper();
        e.preventDefault();
    }
    
    // Move bike up and down
    if (gameState.currentScreen === 'gameScreen') {
        if (e.code === 'ArrowUp') {
            bikeY = Math.max(50, bikeY - 20);
        } else if (e.code === 'ArrowDown') {
            bikeY = Math.min(canvas.height - 50, bikeY + 20);
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (canvas && gameActive) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});