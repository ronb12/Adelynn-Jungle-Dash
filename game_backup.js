// Adelynn's Jungle Memory Safari - Game Logic
// Product of Bradley Virtual Solutions, LLC
// Version 2.2.7 - Fix Duplicate Variable Declaration

class JungleMemoryGame {
    constructor() {
        this.animals = [
            {
                id: 'tiger',
                name: 'Bengal Tiger',
                emoji: '🐅',
                fact: 'Tigers are excellent swimmers and love to cool off in water!',
                sound: 'sounds/tiger-roar.mp3'
            },
            {
                id: 'monkey',
                name: 'Spider Monkey',
                emoji: '🐒',
                fact: 'Spider monkeys can swing through trees at speeds up to 35 mph!',
                sound: 'sounds/monkey-chatter.mp3'
            },
            {
                id: 'parrot',
                name: 'Scarlet Macaw',
                emoji: '🦜',
                fact: 'Macaws can live up to 100 years and mate for life!',
                sound: 'sounds/parrot-squawk.mp3'
            },
            {
                id: 'elephant',
                name: 'Asian Elephant',
                emoji: '🐘',
                fact: 'Elephants can recognize themselves in mirrors and mourn their dead!',
                sound: 'sounds/elephant-trumpet.mp3'
            },
            {
                id: 'jaguar',
                name: 'Jaguar',
                emoji: '🐆',
                fact: 'Jaguars have the strongest bite force of any big cat!',
                sound: 'sounds/jaguar-growl.mp3'
            },
            {
                id: 'toucan',
                name: 'Toucan',
                emoji: '🦜',
                fact: 'A toucan\'s colorful beak helps regulate their body temperature!',
                sound: 'sounds/toucan-call.mp3'
            },
            {
                id: 'sloth',
                name: 'Three-toed Sloth',
                emoji: '🦥',
                fact: 'Sloths only come down from trees once a week to go to the bathroom!',
                sound: 'sounds/sloth-chirp.mp3'
            },
            {
                id: 'snake',
                name: 'Emerald Tree Boa',
                emoji: '🐍',
                fact: 'These snakes change color from red to green as they mature!',
                sound: 'sounds/snake-hiss.mp3'
            },
            {
                id: 'frog',
                name: 'Poison Dart Frog',
                emoji: '🐸',
                fact: 'These tiny frogs are among the most toxic animals on Earth!',
                sound: 'sounds/frog-croak.mp3'
            },
            {
                id: 'butterfly',
                name: 'Blue Morpho',
                emoji: '🦋',
                fact: 'Blue Morpho wings aren\'t actually blue - they reflect light to appear blue!',
                sound: 'sounds/butterfly-flutter.mp3'
            },
            {
                id: 'crocodile',
                name: 'American Crocodile',
                emoji: '🐊',
                fact: 'Crocodiles haven\'t changed much in 200 million years!',
                sound: 'sounds/crocodile-snap.mp3'
            },
            {
                id: 'hippo',
                name: 'Hippopotamus',
                emoji: '🦛',
                fact: 'Hippos spend up to 16 hours a day in water to keep cool!',
                sound: 'sounds/hippo-grunt.mp3'
            }
        ];

        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            score: 0,
            timeStarted: null,
            timeElapsed: 0,
            isPaused: false,
            gameWon: false,
            difficulty: 'easy'
        };

        // High scores and achievements
        this.highScores = this.loadHighScores();
        this.achievements = this.loadAchievements();
        this.learningProgress = this.loadLearningProgress();
        
        // Initialize settings
        const settings = this.loadGameSettings();
        this.hapticEnabled = settings.hapticEnabled;

        this.difficultySettings = {
            easy: { pairs: 6, gridCols: 4, timeBonus: 1000 },
            medium: { pairs: 8, gridCols: 4, timeBonus: 1500 },
            hard: { pairs: 12, gridCols: 4, timeBonus: 2000 }
        };

        // Initialize audio elements
        this.sounds = {
            background: new Audio('sounds/jungle-ambiance.wav'),
            flip: new Audio('sounds/card-flip.wav'),
            match: new Audio('sounds/match-success.wav'),
            win: new Audio('sounds/game-win.wav')
        };

        // Set audio properties
        Object.values(this.sounds).forEach(audio => {
            if (audio) {
                audio.preload = 'auto';
                audio.volume = 0.7;
            }
        });

        // Check if audio files are available
        this.audioFilesAvailable = {
            background: true,
            flip: true,
            match: true,
            win: true
        };

        this.init();
    }


    init() {
        console.log('🚀 Initializing Jungle Memory Game...');
        this.bindEvents();
        this.setupIOSOptimizations();
        this.setupAccessibility();
        this.newGame();
        this.startBackgroundMusic();
        this.updateAchievementsDisplay();
        console.log('✅ Game initialization complete!');
        console.log('🎮 Game state:', this.gameState);
    }

    // Storage and Achievement Methods
    loadHighScores() {
        try {
            const scores = localStorage.getItem('jungleMemoryHighScores');
            return scores ? JSON.parse(scores) : {
                easy: { time: null, moves: null, score: 0 },
                medium: { time: null, moves: null, score: 0 },
                hard: { time: null, moves: null, score: 0 }
            };
        } catch (e) {
            console.log('Error loading high scores:', e);
            return { easy: { time: null, moves: null, score: 0 }, medium: { time: null, moves: null, score: 0 }, hard: { time: null, moves: null, score: 0 } };
        }
    }

    saveHighScores() {
        try {
            localStorage.setItem('jungleMemoryHighScores', JSON.stringify(this.highScores));
        } catch (e) {
            console.log('Error saving high scores:', e);
        }
    }

    loadAchievements() {
        try {
            const achievements = localStorage.getItem('jungleMemoryAchievements');
            return achievements ? JSON.parse(achievements) : {
                firstWin: false,
                perfectGame: false,
                speedRun: false,
                animalExpert: false,
                memoryMaster: false,
                streak10: false
            };
        } catch (e) {
            console.log('Error loading achievements:', e);
            return { firstWin: false, perfectGame: false, speedRun: false, animalExpert: false, memoryMaster: false, streak10: false };
        }
    }

    saveAchievements() {
        try {
            localStorage.setItem('jungleMemoryAchievements', JSON.stringify(this.achievements));
        } catch (e) {
            console.log('Error saving achievements:', e);
        }
    }

    loadLearningProgress() {
        try {
            const progress = localStorage.getItem('jungleMemoryProgress');
            return progress ? JSON.parse(progress) : {
                animalsLearned: [],
                totalGamesPlayed: 0,
                totalTimePlayed: 0,
                currentStreak: 0,
                bestStreak: 0
            };
        } catch (e) {
            console.log('Error loading learning progress:', e);
            return { animalsLearned: [], totalGamesPlayed: 0, totalTimePlayed: 0, currentStreak: 0, bestStreak: 0 };
        }
    }

    saveLearningProgress() {
        try {
            localStorage.setItem('jungleMemoryProgress', JSON.stringify(this.learningProgress));
        } catch (e) {
            console.log('Error saving learning progress:', e);
        }
    }

    setupIOSOptimizations() {
        // Prevent iOS Safari from bouncing on scroll
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.game-board')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Fix iOS viewport height issues
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });

        // Prevent double-tap zoom on cards
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    setupAccessibility() {
        // Add ARIA labels and keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.classList.contains('card')) {
                    e.preventDefault();
                    const cardId = focusedElement.dataset.cardId;
                    if (cardId) this.flipCard(cardId);
                }
            }
        });

        // Add screen reader announcements
        this.announceToScreenReader = (message) => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 1000);
        };
    }

    // Haptic feedback for mobile devices
    triggerHapticFeedback(type = 'light') {
        if (this.hapticEnabled && 'vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [50],
                success: [10, 10, 10],
                error: [100]
            };
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }

    bindEvents() {
        // Helper function to safely add event listeners
        const safeAddEventListener = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.log(`Element with id '${elementId}' not found`);
            }
        };

        const safeQuerySelector = (selector, event, handler) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.log(`Element with selector '${selector}' not found`);
            }
        };

        // Main game controls
        safeAddEventListener('new-game-btn', 'click', () => this.newGame());
        safeAddEventListener('pause-btn', 'click', () => this.togglePause());
        safeAddEventListener('resume-btn', 'click', () => this.togglePause());
        safeAddEventListener('quiz-mode-btn', 'click', () => this.toggleQuizMode());
        safeAddEventListener('high-scores-btn', 'click', () => this.toggleHighScores());
        safeAddEventListener('settings-btn', 'click', () => this.toggleSettings());
        safeAddEventListener('close-settings-btn', 'click', () => this.toggleSettings());
        safeAddEventListener('difficulty', 'change', (e) => {
            this.gameState.difficulty = e.target.value;
            this.newGame();
        });

        // Settings event listeners
        safeAddEventListener('sound-enabled', 'change', (e) => this.toggleSound(e.target.checked));
        safeAddEventListener('haptic-enabled', 'change', (e) => this.toggleHaptic(e.target.checked));
        safeAddEventListener('colorblind-mode', 'change', (e) => this.toggleColorblind(e.target.checked));
        safeAddEventListener('high-contrast-mode', 'change', (e) => this.toggleHighContrast(e.target.checked));
        safeAddEventListener('screen-reader-mode', 'change', (e) => this.toggleScreenReader(e.target.checked));
        safeAddEventListener('message-btn', 'click', () => this.hideMessage());
        safeQuerySelector('.close-modal', 'click', () => this.hideAnimalModal());
        safeAddEventListener('play-sound-btn', 'click', () => this.playAnimalSound());
        safeAddEventListener('next-question-btn', 'click', () => this.nextQuizQuestion());

        // Close modal when clicking outside
        safeAddEventListener('animal-modal', 'click', (e) => {
            if (e.target.id === 'animal-modal') {
                this.hideAnimalModal();
            }
        });
    }

    newGame() {
        const difficultyElement = document.getElementById('difficulty');
        const difficulty = difficultyElement ? difficultyElement.value : 'easy';
        
        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            score: 0,
            timeStarted: Date.now(),
            timeElapsed: 0,
            isPaused: false,
            gameWon: false,
            difficulty: difficulty
        };

        // Update learning progress
        this.learningProgress.totalGamesPlayed++;
        this.saveLearningProgress();

        this.createCards();
        this.renderBoard();
        this.updateUI();
        this.startTimer();
        this.announceToScreenReader('New game started');
    }

    createCards() {
        const difficulty = this.difficultySettings[this.gameState.difficulty];
        const selectedAnimals = this.animals.slice(0, difficulty.pairs);
        
        // Create pairs of cards
        this.gameState.cards = [];
        selectedAnimals.forEach((animal, index) => {
            // Add two cards for each animal
            this.gameState.cards.push(
                { id: `${animal.id}-1`, animalId: animal.id, animal: animal, isFlipped: false, isMatched: false },
                { id: `${animal.id}-2`, animalId: animal.id, animal: animal, isFlipped: false, isMatched: false }
            );
        });

        // Shuffle cards
        this.gameState.cards = this.shuffleArray(this.gameState.cards);
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    renderBoard() {
        console.log('🎨 Rendering game board...');
        const gameBoard = document.getElementById('game-board');
        const difficulty = this.difficultySettings[this.gameState.difficulty];
        
        console.log('🎯 Game board element:', gameBoard);
        console.log('⚙️ Difficulty settings:', difficulty);
        console.log('🃏 Cards to render:', this.gameState.cards.length);
        
        gameBoard.innerHTML = '';
        gameBoard.className = `game-board ${this.gameState.difficulty}`;
        gameBoard.style.gridTemplateColumns = `repeat(${difficulty.gridCols}, 1fr)`;

        this.gameState.cards.forEach((card, index) => {
            console.log(`🃏 Creating card ${index + 1}:`, card);
            const cardElement = this.createCardElement(card);
            gameBoard.appendChild(cardElement);
            console.log(`✅ Card ${index + 1} added to board`);
        });
        
        console.log('✅ Game board rendered with', this.gameState.cards.length, 'cards');
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        cardDiv.setAttribute('tabindex', '0');
        cardDiv.setAttribute('role', 'button');
        cardDiv.setAttribute('aria-label', `Card with ${card.animal.name}`);
        cardDiv.setAttribute('aria-pressed', 'false');
        
        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-content">
                        <img src="images/animals/${card.animal.id}.png" alt="${card.animal.name}" class="animal-image">
                        <div class="animal-name">${card.animal.name}</div>
                    </div>
                </div>
                <div class="card-back">
                    <div class="card-pattern">🌿</div>
                </div>
            </div>
        `;

        // Simple click handler
        cardDiv.addEventListener('click', (e) => {
            e.preventDefault();
            this.flipCard(card.id);
        });
        
        return cardDiv;
    }

    flipCard(cardId) {
        console.log('🔄 flipCard called with cardId:', cardId);
        console.log('🎮 Game state:', {
            isPaused: this.gameState.isPaused,
            gameWon: this.gameState.gameWon,
            flippedCardsCount: this.gameState.flippedCards.length
        });

        if (this.gameState.isPaused || this.gameState.gameWon) {
            console.log('❌ Card flip blocked - game paused or won');
            return;
        }

        const card = this.gameState.cards.find(c => c.id === cardId);
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);

        console.log('🃏 Card found:', card);
        console.log('🎯 Card element found:', cardElement);

        if (!card || card.isFlipped || card.isMatched || this.gameState.flippedCards.length >= 2) {
            console.log('❌ Card flip blocked - conditions:', {
                noCard: !card,
                isFlipped: card?.isFlipped,
                isMatched: card?.isMatched,
                tooManyFlipped: this.gameState.flippedCards.length >= 2
            });
            return;
        }

        console.log('✅ Proceeding with card flip...');
        // Flip the card
        card.isFlipped = true;
        cardElement.classList.add('flipped');
        cardElement.setAttribute('aria-pressed', 'true');
        this.gameState.flippedCards.push(card);
        
        // Force the transform with JavaScript as fallback
        const cardInner = cardElement.querySelector('.card-inner');
        if (cardInner) {
            cardInner.style.transform = 'rotateY(180deg)';
            console.log('🔧 Applied JavaScript transform fallback');
        }
        
        console.log('🎨 CSS classes after flip:', cardElement.className);
        console.log('🎯 Card element style after flip:', {
            transform: cardElement.style.transform,
            classList: Array.from(cardElement.classList)
        });
        
        // Check if the card inner element exists and has the right classes
        if (cardInner) {
            console.log('🔄 Card inner element found:', cardInner);
            console.log('🎨 Card inner classes:', cardInner.className);
            console.log('🎯 Card inner computed style:', {
                transform: getComputedStyle(cardInner).transform,
                backfaceVisibility: getComputedStyle(cardInner).backfaceVisibility
            });
        } else {
            console.log('❌ Card inner element not found!');
        }
        
        this.playSound('flip');
        this.triggerHapticFeedback('light');
        this.announceToScreenReader(`Flipped ${card.animal.name} card`);

        if (this.gameState.flippedCards.length === 2) {
            this.gameState.moves++;
            this.updateUI();
            
            setTimeout(() => {
                this.checkForMatch();
            }, 1000);
        }
    }

    checkForMatch() {
        const [card1, card2] = this.gameState.flippedCards;

        if (card1.animalId === card2.animalId) {
            // Match found!
            card1.isMatched = true;
            card2.isMatched = true;
            
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
            
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            card1Element.setAttribute('aria-pressed', 'false');
            card2Element.setAttribute('aria-pressed', 'false');
            
            this.gameState.matchedPairs++;
            this.updateScore();
            this.playSound('match');
            this.triggerHapticFeedback('success');
            this.announceToScreenReader(`Match found! ${card1.animal.name}`);
            
            // Update learning progress
            if (!this.learningProgress.animalsLearned.includes(card1.animalId)) {
                this.learningProgress.animalsLearned.push(card1.animalId);
                this.saveLearningProgress();
            }
            
            // Show animal info
            this.showAnimalInfo(card1.animal);
            
            // Check if game is won
            const totalPairs = this.difficultySettings[this.gameState.difficulty].pairs;
            if (this.gameState.matchedPairs === totalPairs) {
                this.gameWon();
            }
        } else {
            // No match - flip cards back
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
                const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
                
                card1Element.classList.remove('flipped');
                card2Element.classList.remove('flipped');
                card1Element.setAttribute('aria-pressed', 'false');
                card2Element.setAttribute('aria-pressed', 'false');
            }, 500);
            this.triggerHapticFeedback('error');
            this.announceToScreenReader('No match, try again');
        }

        this.gameState.flippedCards = [];
    }

    updateScore() {
        const baseScore = 100;
        const moveBonus = Math.max(0, 50 - this.gameState.moves);
        const timeBonus = Math.max(0, this.difficultySettings[this.gameState.difficulty].timeBonus - this.gameState.timeElapsed);
        
        this.gameState.score += baseScore + moveBonus + Math.floor(timeBonus / 1000);
    }

    gameWon() {
        this.gameState.gameWon = true;
        this.playSound('win');
        this.triggerHapticFeedback('heavy');
        this.announceToScreenReader('Congratulations! Game completed!');
        
        const finalScore = this.gameState.score;
        const moves = this.gameState.moves;
        const time = this.formatTime(this.gameState.timeElapsed);
        const difficulty = this.gameState.difficulty;
        
        // Update learning progress
        this.learningProgress.totalTimePlayed += this.gameState.timeElapsed;
        this.learningProgress.currentStreak++;
        if (this.learningProgress.currentStreak > this.learningProgress.bestStreak) {
            this.learningProgress.bestStreak = this.learningProgress.currentStreak;
        }
        this.saveLearningProgress();
        
        // Check for high scores
        const currentHigh = this.highScores[difficulty];
        let isNewHighScore = false;
        let isNewBestTime = false;
        let isNewBestMoves = false;
        
        if (finalScore > currentHigh.score) {
            currentHigh.score = finalScore;
            isNewHighScore = true;
        }
        
        if (!currentHigh.time || this.gameState.timeElapsed < currentHigh.time) {
            currentHigh.time = this.gameState.timeElapsed;
            isNewBestTime = true;
        }
        
        if (!currentHigh.moves || moves < currentHigh.moves) {
            currentHigh.moves = moves;
            isNewBestMoves = true;
        }
        
        if (isNewHighScore || isNewBestTime || isNewBestMoves) {
            this.saveHighScores();
        }
        
        // Check achievements
        this.checkAchievements(moves, this.gameState.timeElapsed);
        
        // Build congratulations message
        let message = `You've completed Adelynn's Jungle Memory Safari!<br><br>
            <strong>Final Score:</strong> ${finalScore}<br>
            <strong>Moves:</strong> ${moves}<br>
            <strong>Time:</strong> ${time}<br><br>`;
            
        if (isNewHighScore) message += '🏆 <strong>New High Score!</strong><br>';
        if (isNewBestTime) message += '⏱️ <strong>New Best Time!</strong><br>';
        if (isNewBestMoves) message += '🎯 <strong>New Best Moves!</strong><br>';
        
        message += '<br>Great job exploring the jungle with Adelynn!<br><br>';
        message += '<button onclick="game.shareResult()" class="btn btn-secondary" style="margin: 5px;">📱 Share Result</button>';
        
        this.showMessage('Congratulations! 🎉', message);
    }

    checkAchievements(moves, timeElapsed) {
        const newAchievements = [];
        
        // First Win
        if (!this.achievements.firstWin) {
            this.achievements.firstWin = true;
            newAchievements.push('🎉 First Win!');
        }
        
        // Perfect Game (minimum moves)
        const minMoves = this.difficultySettings[this.gameState.difficulty].pairs;
        if (!this.achievements.perfectGame && moves === minMoves) {
            this.achievements.perfectGame = true;
            newAchievements.push('⭐ Perfect Game!');
        }
        
        // Speed Run (under 60 seconds)
        if (!this.achievements.speedRun && timeElapsed < 60000) {
            this.achievements.speedRun = true;
            newAchievements.push('⚡ Speed Run!');
        }
        
        // Animal Expert (learned all animals)
        if (!this.achievements.animalExpert && this.learningProgress.animalsLearned.length >= 12) {
            this.achievements.animalExpert = true;
            newAchievements.push('🐾 Animal Expert!');
        }
        
        // Memory Master (10 game streak)
        if (!this.achievements.memoryMaster && this.learningProgress.currentStreak >= 10) {
            this.achievements.memoryMaster = true;
            newAchievements.push('🧠 Memory Master!');
        }
        
        if (newAchievements.length > 0) {
            this.saveAchievements();
            this.showAchievementNotification(newAchievements);
        }
    }

    showAchievementNotification(achievements) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <h3>🏆 Achievement Unlocked!</h3>
                ${achievements.map(achievement => `<p>${achievement}</p>`).join('')}
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    updateAchievementsDisplay() {
        // This would update a UI element showing achievements
        // For now, we'll just log them
        console.log('Current achievements:', this.achievements);
    }

    // Quiz Mode Implementation
    toggleQuizMode() {
        const quizDisplay = document.getElementById('quiz-mode-display');
        if (quizDisplay.classList.contains('hidden')) {
            this.startQuiz();
            quizDisplay.classList.remove('hidden');
        } else {
            quizDisplay.classList.add('hidden');
        }
    }

    startQuiz() {
        this.quizState = {
            currentQuestion: 0,
            score: 0,
            questions: this.generateQuizQuestions()
        };
        this.showQuizQuestion();
    }

    generateQuizQuestions() {
        const questions = [];
        const shuffledAnimals = [...this.animals].sort(() => Math.random() - 0.5);
        
        shuffledAnimals.slice(0, 5).forEach(animal => {
            const wrongAnswers = this.animals
                .filter(a => a.id !== animal.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            
            const options = [animal, ...wrongAnswers].sort(() => Math.random() - 0.5);
            
            questions.push({
                question: `What is this animal? ${animal.emoji}`,
                correct: animal,
                options: options
            });
        });
        
        return questions;
    }

    showQuizQuestion() {
        const question = this.quizState.questions[this.quizState.currentQuestion];
        const questionEl = document.getElementById('quiz-question');
        const optionsEl = document.getElementById('quiz-options');
        
        questionEl.textContent = question.question;
        optionsEl.innerHTML = '';
        
        question.options.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.className = 'quiz-option';
            optionEl.textContent = option.name;
            optionEl.addEventListener('click', () => this.selectQuizAnswer(option, question.correct));
            optionsEl.appendChild(optionEl);
        });
        
        document.getElementById('next-question-btn').classList.add('hidden');
    }

    selectQuizAnswer(selected, correct) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.style.pointerEvents = 'none';
            if (option.textContent === correct.name) {
                option.classList.add('correct');
            } else if (option.textContent === selected.name && selected.id !== correct.id) {
                option.classList.add('incorrect');
            }
        });
        
        if (selected.id === correct.id) {
            this.quizState.score++;
            this.triggerHapticFeedback('success');
            this.announceToScreenReader('Correct answer!');
        } else {
            this.triggerHapticFeedback('error');
            this.announceToScreenReader('Incorrect answer');
        }
        
        document.getElementById('next-question-btn').classList.remove('hidden');
    }

    nextQuizQuestion() {
        this.quizState.currentQuestion++;
        if (this.quizState.currentQuestion < this.quizState.questions.length) {
            this.showQuizQuestion();
        } else {
            this.endQuiz();
        }
    }

    endQuiz() {
        const score = this.quizState.score;
        const total = this.quizState.questions.length;
        const percentage = Math.round((score / total) * 100);
        
        this.showMessage(
            'Quiz Complete! 🎓',
            `You scored ${score} out of ${total} (${percentage}%)!<br><br>
            ${percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}`
        );
        
        document.getElementById('quiz-mode-display').classList.add('hidden');
    }

    // High Scores Display
    toggleHighScores() {
        const highScoresDisplay = document.getElementById('high-scores-display');
        if (highScoresDisplay.classList.contains('hidden')) {
            this.displayHighScores();
            highScoresDisplay.classList.remove('hidden');
        } else {
            highScoresDisplay.classList.add('hidden');
        }
    }

    displayHighScores() {
        const content = document.getElementById('high-scores-content');
        content.innerHTML = '';
        
        Object.keys(this.highScores).forEach(difficulty => {
            const score = this.highScores[difficulty];
            const difficultyDiv = document.createElement('div');
            difficultyDiv.innerHTML = `
                <h4 style="color: var(--sunshine-yellow); margin: 10px 0 5px 0;">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h4>
                <div class="high-score-item">
                    <span class="high-score-label">Best Score:</span>
                    <span class="high-score-value">${score.score || 'N/A'}</span>
                </div>
                <div class="high-score-item">
                    <span class="high-score-label">Best Time:</span>
                    <span class="high-score-value">${score.time ? this.formatTime(score.time) : 'N/A'}</span>
                </div>
                <div class="high-score-item">
                    <span class="high-score-label">Best Moves:</span>
                    <span class="high-score-value">${score.moves || 'N/A'}</span>
                </div>
            `;
            content.appendChild(difficultyDiv);
        });
    }

    // Social Sharing
    shareResult() {
        const finalScore = this.gameState.score;
        const moves = this.gameState.moves;
        const time = this.formatTime(this.gameState.timeElapsed);
        const difficulty = this.gameState.difficulty;
        
        const shareText = `I just completed Adelynn's Jungle Memory Safari! 🐾\n\nScore: ${finalScore}\nMoves: ${moves}\nTime: ${time}\nDifficulty: ${difficulty}\n\nPlay the game: https://ronb12.github.io/Adelynn-Jungle-Dash/`;
        
        if (navigator.share) {
            // Use native sharing on mobile
            navigator.share({
                title: 'Jungle Memory Safari - Game Result',
                text: shareText,
                url: 'https://ronb12.github.io/Adelynn-Jungle-Dash/'
            }).catch(err => {
                console.log('Error sharing:', err);
                this.fallbackShare(shareText);
            });
        } else {
            // Fallback for desktop
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(text) {
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Copied! 📋', 'Game result copied to clipboard! You can paste it anywhere to share.');
            }).catch(() => {
                this.showMessage('Share Result', text);
            });
        } else {
            this.showMessage('Share Result', text);
        }
    }

    // Settings Management
    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel.classList.contains('hidden')) {
            settingsPanel.classList.remove('hidden');
            this.loadSettings();
        } else {
            settingsPanel.classList.add('hidden');
        }
    }

    loadSettings() {
        const settings = this.loadGameSettings();
        document.getElementById('sound-enabled').checked = settings.soundEnabled;
        document.getElementById('haptic-enabled').checked = settings.hapticEnabled;
        document.getElementById('colorblind-mode').checked = settings.colorblindMode;
        document.getElementById('high-contrast-mode').checked = settings.highContrastMode;
        document.getElementById('screen-reader-mode').checked = settings.screenReaderMode;
    }

    loadGameSettings() {
        try {
            const settings = localStorage.getItem('jungleMemorySettings');
            return settings ? JSON.parse(settings) : {
                soundEnabled: true,
                hapticEnabled: true,
                colorblindMode: false,
                highContrastMode: false,
                screenReaderMode: false
            };
        } catch (e) {
            console.log('Error loading settings:', e);
            return {
                soundEnabled: true,
                hapticEnabled: true,
                colorblindMode: false,
                highContrastMode: false,
                screenReaderMode: false
            };
        }
    }

    saveGameSettings(settings) {
        try {
            localStorage.setItem('jungleMemorySettings', JSON.stringify(settings));
        } catch (e) {
            console.log('Error saving settings:', e);
        }
    }

    toggleSound(enabled) {
        const settings = this.loadGameSettings();
        settings.soundEnabled = enabled;
        this.saveGameSettings(settings);
        
        // Update audio volume
        Object.values(this.sounds).forEach(audio => {
            if (audio) {
                audio.volume = enabled ? 0.7 : 0;
            }
        });
    }

    toggleHaptic(enabled) {
        const settings = this.loadGameSettings();
        settings.hapticEnabled = enabled;
        this.saveGameSettings(settings);
        this.hapticEnabled = enabled;
    }

    toggleColorblind(enabled) {
        const settings = this.loadGameSettings();
        settings.colorblindMode = enabled;
        this.saveGameSettings(settings);
        
        document.body.classList.toggle('colorblind-friendly', enabled);
    }

    toggleHighContrast(enabled) {
        const settings = this.loadGameSettings();
        settings.highContrastMode = enabled;
        this.saveGameSettings(settings);
        
        document.body.classList.toggle('high-contrast', enabled);
    }

    toggleScreenReader(enabled) {
        const settings = this.loadGameSettings();
        settings.screenReaderMode = enabled;
        this.saveGameSettings(settings);
        
        document.body.classList.toggle('screen-reader-mode', enabled);
    }

    showAnimalInfo(animal) {
        const animalImage = document.getElementById('animal-image');
        const animalName = document.getElementById('animal-name');
        const animalFact = document.getElementById('animal-fact');
        
        // Try to use the animal image, fallback to emoji
        animalImage.src = `images/animals/${animal.id}.png`;
        animalImage.alt = animal.name;
        animalImage.style.display = 'block';
        
        // Create or update emoji display as fallback
        let emojiDisplay = document.getElementById('animal-emoji-display');
        if (!emojiDisplay) {
            emojiDisplay = document.createElement('div');
            emojiDisplay.id = 'animal-emoji-display';
            emojiDisplay.style.cssText = 'font-size: 4rem; text-align: center; margin: 20px 0; display: none;';
            animalImage.parentNode.insertBefore(emojiDisplay, animalImage);
        }
        emojiDisplay.textContent = animal.emoji;
        
        // Handle image load error
        animalImage.onerror = () => {
            animalImage.style.display = 'none';
            emojiDisplay.style.display = 'block';
        };
        
        animalName.textContent = animal.name;
        animalFact.textContent = animal.fact;
        document.getElementById('animal-modal').dataset.animalSound = animal.sound;
        document.getElementById('animal-modal').classList.remove('hidden');
    }

    hideAnimalModal() {
        document.getElementById('animal-modal').classList.add('hidden');
    }

    playAnimalSound() {
        const soundFile = document.getElementById('animal-modal').dataset.animalSound;
        if (soundFile) {
            const audio = new Audio(soundFile);
            audio.volume = 0.7;
            audio.play().catch(e => console.log('Could not play animal sound:', e));
        }
    }

    showMessage(title, text) {
        document.getElementById('message-title').textContent = title;
        document.getElementById('message-text').innerHTML = text;
        document.getElementById('game-message').classList.remove('hidden');
    }

    hideMessage() {
        document.getElementById('game-message').classList.add('hidden');
    }

    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            document.getElementById('pause-overlay').classList.remove('hidden');
            document.getElementById('pause-btn').textContent = 'Resume';
        } else {
            document.getElementById('pause-overlay').classList.add('hidden');
            document.getElementById('pause-btn').textContent = 'Pause';
            this.gameState.timeStarted = Date.now() - this.gameState.timeElapsed;
        }
    }

    startTimer() {
        const updateTimer = () => {
            if (!this.gameState.isPaused && !this.gameState.gameWon) {
                this.gameState.timeElapsed = Date.now() - this.gameState.timeStarted;
                this.updateUI();
            }
            if (!this.gameState.gameWon) {
                requestAnimationFrame(updateTimer);
            }
        };
        updateTimer();
    }

    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('moves').textContent = this.gameState.moves;
        document.getElementById('timer').textContent = this.formatTime(this.gameState.timeElapsed);
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    playSound(type) {
        // Check if audio file is available and valid
        if (this.sounds[type] && this.audioFilesAvailable[type]) {
            this.sounds[type].currentTime = 0;
            this.sounds[type].volume = 0.5;
            this.sounds[type].play().catch(e => {
                console.log(`Could not play ${type} sound:`, e);
                // Fallback: create a simple beep sound using Web Audio API
                this.playFallbackSound(type);
            });
        } else {
            // Use fallback sound for missing or invalid audio files
            this.playFallbackSound(type);
        }
    }

    playFallbackSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different sound types
            const frequencies = {
                flip: 800,
                match: 1200,
                win: 1500,
                background: 400
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Web Audio API not supported:', e);
        }
    }

    startBackgroundMusic() {
        // Don't try to play background music automatically to avoid autoplay restrictions
        // Background music will only play after user interaction
        console.log('Background music ready - will play after user interaction');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new JungleMemoryGame();
        console.log('Jungle Memory Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        // Show error message to user
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff0000;">
                    <h2>Game Loading Error</h2>
                    <p>There was an error loading the game. Please refresh the page and try again.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
