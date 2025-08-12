const gameState = {
    coins: 150,
    usd: 0,
    level: 1,
    diamondsFound: 0,
    diamondsToFind: 4,
    minesCount: 4,
    grid: [],
    gameActive: false,
    timer: 0,
    timerInterval: null,
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'easy',
    userFullName: localStorage.getItem('userFullName') || 'Player',
    channelJoined: localStorage.getItem('channelJoined') === 'true' || false,
    verificationAttempts: 0,
    isFirstTimeUser: localStorage.getItem('isFirstTimeUser') === null || localStorage.getItem('isFirstTimeUser') === 'true'
};

// Initialize the game
function init() {
    loadGameState();
    setupEventListeners();
    
    // Initialize username display
    updateUserDisplay();
    
    // Show restriction page only for first-time users who haven't joined the channel
    if (gameState.isFirstTimeUser && !gameState.channelJoined) {
        showPage('restriction');
    } else {
        showPage('home');
    }
    
    startBackgroundMusic();
    showInAppAd();
    setInterval(showPeriodicAd, 600000);
}

// Update user display with full name
function updateUserDisplay() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = `Welcome, ${gameState.userFullName}!`;
    }
}

// Verify channel membership
function verifyChannelJoin() {
    const checkBtn = document.querySelector('.check-button');
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    
    // Simulate API call delay
    setTimeout(() => {
        // In a real app, replace this with actual Telegram API call
        const hasJoined = checkActualChannelMembership();
        
        if (hasJoined) {
            // Successful verification
            gameState.channelJoined = true;
            gameState.isFirstTimeUser = false;
            gameState.verificationAttempts = 0;
            
            // Get user data from Telegram (simulated here)
            const telegramUser = getTelegramUserData();
            if (telegramUser && telegramUser.fullName) {
                gameState.userFullName = telegramUser.fullName;
                localStorage.setItem('userFullName', gameState.userFullName);
                updateUserDisplay();
            }
            
            localStorage.setItem('channelJoined', 'true');
            localStorage.setItem('isFirstTimeUser', 'false');
            saveGameState();
            
            showPage('home');
            alert('Verification successful! Welcome to Minezwall.');
        } else {
            // Failed verification - no access granted
            gameState.verificationAttempts++;
            alert('We could not verify your channel membership. Please join our Telegram channel first and then click verification.');
        }
        
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<i class="fas fa-check-circle"></i> I\'ve Joined';
    }, 2000);
}

// Simulate getting Telegram user data with full name
function getTelegramUserData() {
    // In a real app, this would use Telegram WebApp.initData
    // For demo purposes, we'll simulate getting the full name
    return {
        fullName: 'Telegram User ' + Math.floor(Math.random() * 1000),
        username: 'telegramuser' + Math.floor(Math.random() * 1000)
    };
}

// Simulate actual channel membership check
function checkActualChannelMembership() {
    // In a real app, this would use Telegram's API to verify membership
    // For demo purposes, we'll simulate a 100% failure rate unless the user has actually joined
    // This enforces that the user must join the channel
    return false; // Always returns false to simulate strict verification
}

function loadGameState() {
    const savedState = localStorage.getItem('minezwallGameState');
    if (savedState) {
        Object.assign(gameState, JSON.parse(savedState));
    }
    updateUI();
}

function saveGameState() {
    localStorage.setItem('minezwallGameState', JSON.stringify(gameState));
}

function setupEventListeners() {
    document.querySelector('.menu-button').addEventListener('click', function() {
        document.getElementById('dropdownMenu').classList.toggle('show');
    });

    window.addEventListener('click', function(e) {
        if (!e.target.matches('.menu-button')) {
            const dropdowns = document.getElementsByClassName('dropdown-content');
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    });

    document.getElementById('soundToggle').addEventListener('change', toggleSound);
    document.getElementById('musicToggle').addEventListener('change', toggleMusic);
    document.getElementById('difficultySelect').value = gameState.difficulty;
    document.getElementById('themeSelect').value = localStorage.getItem('theme') || 'dark';
    applyTheme();
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show requested page
    document.getElementById(pageId + 'Page').classList.add('active');
    
    // Close dropdown
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
    
    // If showing game page, initialize game
    if (pageId === 'game') {
        initGame();
    }
}

function startGame() {
    showPage('game');
}

function initGame() {
    gameState.diamondsFound = 0;
    gameState.gameActive = true;
    gameState.diamondsToFind = 4;
    gameState.minesCount = 5;
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    gameState.grid = [];
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => revealCell(i));
        grid.appendChild(cell);
        gameState.grid.push({ isMine: false, isRevealed: false, isDiamond: false });
    }
    placeMines();
    placeDiamonds();
    updateUI();
    startTimer();
}

function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < gameState.minesCount) {
        const randomIndex = Math.floor(Math.random() * 25);
        if (!gameState.grid[randomIndex].isMine && !gameState.grid[randomIndex].isDiamond) {
            gameState.grid[randomIndex].isMine = true;
            minesPlaced++;
        }
    }
}

function placeDiamonds() {
    for (let i = 0; i < 25; i++) {
        if (!gameState.grid[i].isMine) {
            gameState.grid[i].isDiamond = true;
        }
    }
}

function revealCell(index) {
    if (!gameState.gameActive) return;
    const cell = gameState.grid[index];
    const cellElement = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell.isRevealed) return;
    cell.isRevealed = true;
    cellElement.classList.add('revealed');
    playSound('click');
    if (cell.isMine) {
        cellElement.classList.add('mine');
        cellElement.innerHTML = '💣';
        gameOver();
        return;
    }
    if (cell.isDiamond) {
        cellElement.classList.add('diamond');
        cellElement.innerHTML = '💎';
        gameState.diamondsFound++;
        playSound('win');
        cellElement.classList.add('diamond-glow');
        if (gameState.diamondsFound === gameState.diamondsToFind) {
            levelComplete();
        }
    } else {
        cellElement.innerHTML = '';
    }
    updateUI();
}

function gameOver() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    playSound('lose');
    gameState.grid.forEach((cell, index) => {
        if (cell.isMine) {
            const cellElement = document.querySelector(`.cell[data-index="${index}"]`);
            cellElement.classList.add('mine', 'revealed');
            cellElement.innerHTML = '💣';
        }
    });
    document.getElementById('loseModal').style.display = 'flex';
}

function levelComplete() {
    if (gameState.coins <= 0) {
        alert("You don't have enough coins to proceed to the next level!");
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        return;
    }
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    gameState.coins -= 10;
    gameState.usd += 0.005;
    gameState.level++;
    saveGameState();
    playSound('win');
    document.getElementById('winModal').style.display = 'flex';
    showRewardedAd();
}

function nextLevel() {
    closeModal('winModal');
    initGame();
}

function startTimer() {
    gameState.timer = 0;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimer();
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
    const seconds = (gameState.timer % 60).toString().padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${minutes}:${seconds}`;
}

function updateUI() {
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('coinDisplay').textContent = gameState.coins;
    document.getElementById('usdDisplay').textContent = `$${gameState.usd.toFixed(3)}`;
    document.getElementById('withdrawUsdDisplay').textContent = `$${gameState.usd.toFixed(3)}`;
    document.getElementById('diamondsFound').textContent = `${gameState.diamondsFound}/${gameState.diamondsToFind}`;
}

function skipWithAd() {
    closeModal('loseModal');
    showRewardedAd(() => {
        skipLevelActions();
    });
}

function skipWithCoins() {
    if (gameState.coins >= 25) {
        gameState.coins -= 25;
        skipLevelActions();
        closeModal('loseModal');
        saveGameState();
        updateUI();
    } else {
        alert('Not enough coins!');
    }
}

function skipLevelActions() {
    gameState.usd += 0.005;
    gameState.level++;
    saveGameState();
    updateUI();
    initGame();
}

function restartLevel() {
    if (gameState.coins >= 5) {
        gameState.coins -= 5;
        saveGameState();
        updateUI();
        closeModal('loseModal');
        initGame();
    } else {
        alert('Not enough coins to restart!');
    }
}

function claimDailyBonus() {
    const lastClaimed = localStorage.getItem('dailyBonusLastClaimed');
    const today = new Date().toDateString();
    if (lastClaimed !== today) {
        gameState.coins += 15;
        saveGameState();
        updateUI();
        localStorage.setItem('dailyBonusLastClaimed', today);
        document.getElementById('dailyBonusModal').style.display = 'flex';
    } else {
        alert('You already claimed your daily bonus today!');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    localStorage.setItem('theme', theme);
    applyTheme();
}

function applyTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.body.style.background = 'linear-gradient(135deg, #64b3f4, #c2e59c)';
        document.body.style.color = '#333';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c)';
        document.body.style.color = 'white';
    }
}

function changeDifficulty() {
    gameState.difficulty = document.getElementById('difficultySelect').value;
    saveGameState();
}

function toggleSound() {
    gameState.soundEnabled = document.getElementById('soundToggle').checked;
    saveGameState();
}

function toggleMusic() {
    gameState.musicEnabled = document.getElementById('musicToggle').checked;
    if (gameState.musicEnabled) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    saveGameState();
}

function startBackgroundMusic() {
    if (gameState.musicEnabled) {
        const bgMusic = document.getElementById('backgroundMusic');
        bgMusic.volume = 0.8;
        bgMusic.play().catch(e => console.log('Autoplay prevented:', e));
    }
}

function stopBackgroundMusic() {
    document.getElementById('backgroundMusic').pause();
}

function playSound(sound) {
    if (!gameState.soundEnabled) return;
    const soundElement = document.getElementById(sound + 'Sound');
    soundElement.currentTime = 0;
    soundElement.play().catch(e => console.log('Sound play prevented:', e));
}

function showInAppAd() {
    try {
        show_9662480({
            type: 'inApp',
            inAppSettings: {
                frequency: 3,
                capping: 0.3,
                interval: 15,
                timeout: 15,
                everyPage: true
            }
        });
    } catch (e) {
        console.log('Ad error:', e);
    }
}

function showRewardedAd(callback) {
    try {
        show_9662480('pop').then(() => {
            if (callback) callback();
        }).catch(e => {
            console.log('Ad error:', e);
        });
    } catch (e) {
        console.log('Ad error:', e);
    }
}

function showPeriodicAd() {
    try {
        show_9662480();
    } catch (e) {
        console.log('Ad error:', e);
    }
}

function processWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const walletAddress = document.getElementById('walletAddress').value;
    if (isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }
    if (amount < 5.000) {
        alert('Minimum withdrawal amount is $5.000');
        return;
    }
    if (amount > gameState.usd) {
        alert('Insufficient balance');
        return;
    }
    if (!walletAddress) {
        alert('Please enter your wallet address');
        return;
    }
    gameState.usd -= amount;
    saveGameState();
    updateUI();
    document.getElementById('withdrawalSuccessModal').style.display = 'flex';
}

function redirectToGoogleForm() {
    window.open('https://forms.gle/dcV7SNonaC1BVvNdA', '_blank');
    closeModal('withdrawalSuccessModal');
}

window.onload = init;
