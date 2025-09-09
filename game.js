// Adelynn's Jungle Memory Safari - Clean Rebuild
// Product of Bradley Virtual Solutions, LLC

class JungleMemoryGame {
    constructor() {
        this.animals = [];
        this.contentData = null;
        this.difficultySettings = {
            easy: { pairs: 6, gridCols: 4 },
            medium: { pairs: 12, gridCols: 4 },
            hard: { pairs: 20, gridCols: 5 },
            expert: { pairs: 30, gridCols: 6 },
            legendary: { pairs: 50, gridCols: 10 }
        };

        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            score: 0,
            timeStarted: Date.now(),
            isPaused: false,
            gameWon: false,
            difficulty: 'easy',
            streak: 0,
            perfectMatches: 0
        };

        // Statistics and achievements
        this.stats = this.loadStats();
        this.achievements = this.loadAchievements();

        // Sound system
        this.sounds = {
            cardFlip: null,
            matchSuccess: null,
            gameWin: null,
            jungleAmbiance: null,
            cardHover: null,
            levelUp: null,
            achievement: null,
            buttonClick: null,
            timerTick: null,
            perfectMatch: null
        };
        this.soundEnabled = true;

        this.init();
    }

    async init() {
        await this.loadContentData();
        this.initializeSounds();
        this.bindEvents();
        this.newGame();
        this.startTimer();
        this.updateStatsDisplay();
    }

    async loadContentData() {
        try {
            const response = await fetch('content.json');
            this.contentData = await response.json();
            this.animals = this.contentData.animals;
            console.log(`Loaded ${this.animals.length} animals from content.json`);
        } catch (error) {
            console.error('Error loading content.json:', error);
            // Fallback to hardcoded animals
            this.animals = [
                { id: 'tiger', name: 'Bengal Tiger', emoji: '🐅', fact: 'Bengal tigers are the largest cats in the world!' },
                { id: 'elephant', name: 'African Elephant', emoji: '🐘', fact: 'African elephants are the largest land mammals!' },
                { id: 'monkey', name: 'Spider Monkey', emoji: '🐒', fact: 'Spider monkeys have the longest tails of any primate!' },
                { id: 'parrot', name: 'Scarlet Macaw', emoji: '🦜', fact: 'Scarlet macaws can live up to 50 years!' },
                { id: 'jaguar', name: 'Jaguar', emoji: '🐆', fact: 'Jaguars have the strongest bite of any big cat!' },
                { id: 'toucan', name: 'Toucan', emoji: '🦜', fact: 'Toucans use their large beaks to reach fruit!' },
                { id: 'crocodile', name: 'Crocodile', emoji: '🐊', fact: 'Crocodiles have been around for over 200 million years!' },
                { id: 'hippo', name: 'Hippopotamus', emoji: '🦛', fact: 'Hippos can hold their breath for up to 5 minutes!' },
                { id: 'snake', name: 'Anaconda', emoji: '🐍', fact: 'Anacondas are the heaviest snakes in the world!' },
                { id: 'frog', name: 'Poison Dart Frog', emoji: '🐸', fact: 'Poison dart frogs get their poison from insects!' },
                { id: 'butterfly', name: 'Morpho Butterfly', emoji: '🦋', fact: 'Morpho butterflies have iridescent blue wings!' },
                { id: 'sloth', name: 'Sloth', emoji: '🦥', fact: 'Sloths move so slowly that algae grows on their fur!' }
            ];
        }
    }

    initializeSounds() {
        // Create audio elements for sounds
        this.sounds.cardFlip = new Audio('sounds/card-flip.wav');
        this.sounds.matchSuccess = new Audio('sounds/match-success.wav');
        this.sounds.gameWin = new Audio('sounds/game-win.wav');
        this.sounds.jungleAmbiance = new Audio('sounds/jungle-ambiance.wav');
        this.sounds.cardHover = new Audio('sounds/card-hover.wav');
        this.sounds.levelUp = new Audio('sounds/level-up.wav');
        this.sounds.achievement = new Audio('sounds/achievement.wav');
        this.sounds.buttonClick = new Audio('sounds/button-click.wav');
        this.sounds.timerTick = new Audio('sounds/timer-tick.wav');
        this.sounds.perfectMatch = new Audio('sounds/perfect-match.wav');
        
        // Set audio properties
        Object.values(this.sounds).forEach(audio => {
            if (audio) {
                audio.preload = 'auto';
                audio.volume = 0.5;
            }
        });
        
        // Set jungle ambiance to loop
        if (this.sounds.jungleAmbiance) {
            this.sounds.jungleAmbiance.loop = true;
            this.sounds.jungleAmbiance.volume = 0.3;
        }
        
        // Set lower volume for some sounds
        if (this.sounds.timerTick) {
            this.sounds.timerTick.volume = 0.2;
        }
    }

    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0; // Reset to beginning
            sound.play().catch(error => {
                console.log('Could not play sound:', error);
            });
        }
    }

    startTimer() {
        setInterval(() => {
            if (!this.gameState.isPaused && !this.gameState.gameWon) {
                this.updateDisplay();
            }
        }, 1000);
    }

    bindEvents() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.gameState.difficulty = e.target.value;
            this.newGame();
        });
        
        // Statistics button
        document.getElementById('stats-btn').addEventListener('click', () => this.showStats());
        document.getElementById('stats-close').addEventListener('click', () => this.hideStats());
        
        // Sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                if (this.soundEnabled && this.sounds.jungleAmbiance) {
                    this.sounds.jungleAmbiance.play().catch(() => {});
                } else if (this.sounds.jungleAmbiance) {
                    this.sounds.jungleAmbiance.pause();
                }
            });
        }
        
        // Start jungle ambiance on first user interaction
        document.addEventListener('click', () => {
            if (this.soundEnabled && this.sounds.jungleAmbiance) {
                this.sounds.jungleAmbiance.play().catch(() => {});
            }
        }, { once: true });
    }

    newGame() {
        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            score: 0,
            timeStarted: Date.now(),
            isPaused: false,
            gameWon: false,
            difficulty: this.gameState.difficulty,
            streak: 0,
            perfectMatches: 0
        };

        this.createCards();
        this.renderBoard();
        this.updateDisplay();
    }

    createCards() {
        const difficulty = this.difficultySettings[this.gameState.difficulty];
        const selectedAnimals = this.animals.slice(0, difficulty.pairs);
        
        this.gameState.cards = [];
        
        // Create pairs
        selectedAnimals.forEach(animal => {
            this.gameState.cards.push(
                { 
                    id: `${animal.id}-1`, 
                    animalId: animal.id, 
                    animal: animal, 
                    isFlipped: false, 
                    isMatched: false 
                },
                { 
                    id: `${animal.id}-2`, 
                    animalId: animal.id, 
                    animal: animal, 
                    isFlipped: false, 
                    isMatched: false 
                }
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
        const gameBoard = document.getElementById('game-board');
        const difficulty = this.difficultySettings[this.gameState.difficulty];
        
        gameBoard.innerHTML = '';
        gameBoard.className = `game-board ${this.gameState.difficulty}`;
        gameBoard.style.gridTemplateColumns = `repeat(${difficulty.gridCols}, 1fr)`;

        this.gameState.cards.forEach((card) => {
            const cardElement = this.createCardElement(card);
            gameBoard.appendChild(cardElement);
        });
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        
        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <img src="images/animals/${card.animal.id}.png" 
                         alt="${card.animal.name}" 
                         class="animal-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="animal-emoji" style="display:none; font-size: 3rem;">${card.animal.emoji}</div>
                    <div class="animal-name">${card.animal.name}</div>
                </div>
                <div class="card-back">
                    <div class="card-pattern">🌿</div>
                </div>
            </div>
        `;

        cardDiv.addEventListener('click', () => {
            this.flipCard(card.id);
        });
        
        return cardDiv;
    }

    flipCard(cardId) {
        if (this.gameState.isPaused || this.gameState.gameWon) {
            return;
        }

        const card = this.gameState.cards.find(c => c.id === cardId);
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);

        if (!card || !cardElement) {
            return;
        }

        if (card.isFlipped || card.isMatched || this.gameState.flippedCards.length >= 2) {
            return;
        }

        // Flip the card
        card.isFlipped = true;
        cardElement.classList.add('flipped');
        this.gameState.flippedCards.push(card);
        this.gameState.moves++;

        // Play card flip sound
        this.playSound('cardFlip');

        this.updateDisplay();

        // Check for matches
        if (this.gameState.flippedCards.length === 2) {
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
            this.gameState.matchedPairs++;
            this.gameState.score += 100;
            
            // Play match success sound
            this.playSound('matchSuccess');
            
            // Add matched class to both cards
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
            
            if (card1Element) card1Element.classList.add('matched');
            if (card2Element) card2Element.classList.add('matched');
            
            // Show educational fact
            this.showAnimalFact(card1.animal);
            
            // Track animals learned
            this.stats.animalsLearned.add(card1.animal.id);
            
            // Update streak
            this.gameState.streak++;
            
            this.gameState.flippedCards = [];
            
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
                
                if (card1Element) card1Element.classList.remove('flipped');
                if (card2Element) card2Element.classList.remove('flipped');
                
                this.gameState.flippedCards = [];
            }, 1000);
        }
        
        this.updateDisplay();
    }

    showAnimalFact(animal) {
        // Create or update the fact display
        let factDisplay = document.getElementById('animal-fact-display');
        if (!factDisplay) {
            factDisplay = document.createElement('div');
            factDisplay.id = 'animal-fact-display';
            factDisplay.className = 'animal-fact-display';
            document.body.appendChild(factDisplay);
        }

        factDisplay.innerHTML = `
            <div class="fact-content">
                <div class="fact-header">
                    <span class="fact-emoji">${animal.emoji}</span>
                    <h3 class="fact-title">${animal.name}</h3>
                    <button class="fact-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <p class="fact-text">${animal.fact}</p>
                ${animal.category ? `<div class="fact-category">Category: ${animal.category}</div>` : ''}
            </div>
        `;

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (factDisplay && factDisplay.parentElement) {
                factDisplay.remove();
            }
        }, 5000);
    }

    gameWon() {
        this.gameState.gameWon = true;
        
        // Play game win sound
        this.playSound('gameWin');
        
        // Update statistics
        this.stats.gamesWon++;
        this.stats.currentStreak++;
        if (this.stats.currentStreak > this.stats.longestStreak) {
            this.stats.longestStreak = this.stats.currentStreak;
        }
        
        // Update difficulty stats
        this.stats.difficultyStats[this.gameState.difficulty].won++;
        
        this.updateStats();
        
        const timeElapsed = Date.now() - this.gameState.timeStarted;
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor((timeElapsed % 60000) / 1000);
        
        // Check for perfect game
        const wrongMatches = this.gameState.moves - this.gameState.matchedPairs;
        const perfectText = wrongMatches === 0 ? ' (Perfect Game!)' : '';
        
        setTimeout(() => {
            this.showMessage(
                '🎉 Congratulations!',
                `You won in ${this.gameState.moves} moves and ${minutes}:${seconds.toString().padStart(2, '0')}!${perfectText} You've learned about ${this.gameState.matchedPairs} amazing animals!`
            );
        }, 500);
    }

    showMessage(title, text) {
        const messageEl = document.getElementById('game-message');
        const titleEl = document.getElementById('message-title');
        const textEl = document.getElementById('message-text');
        
        titleEl.textContent = title;
        textEl.textContent = text;
        messageEl.classList.remove('hidden');
        
        document.getElementById('message-btn').addEventListener('click', () => {
            messageEl.classList.add('hidden');
        }, { once: true });
    }

    updateDisplay() {
        const movesEl = document.getElementById('moves');
        const scoreEl = document.getElementById('score');
        const timerEl = document.getElementById('timer');
        
        if (movesEl) {
            movesEl.textContent = this.gameState.moves;
        }
        
        if (scoreEl) {
            scoreEl.textContent = this.gameState.score;
        }
        
        if (timerEl) {
            const elapsed = Math.floor((Date.now() - this.gameState.timeStarted) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Statistics and Achievement System
    loadStats() {
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0,
            totalTime: 0,
            bestScore: 0,
            bestTime: Infinity,
            animalsLearned: new Set(),
            perfectGames: 0,
            currentStreak: 0,
            longestStreak: 0,
            difficultyStats: {
                easy: { played: 0, won: 0, bestTime: Infinity },
                medium: { played: 0, won: 0, bestTime: Infinity },
                hard: { played: 0, won: 0, bestTime: Infinity },
                expert: { played: 0, won: 0, bestTime: Infinity },
                legendary: { played: 0, won: 0, bestTime: Infinity }
            }
        };

        try {
            const saved = localStorage.getItem('jungleMemoryStats');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert animalsLearned back to Set
                if (parsed.animalsLearned) {
                    parsed.animalsLearned = new Set(parsed.animalsLearned);
                }
                return { ...defaultStats, ...parsed };
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
        return defaultStats;
    }

    saveStats() {
        try {
            const statsToSave = {
                ...this.stats,
                animalsLearned: Array.from(this.stats.animalsLearned)
            };
            localStorage.setItem('jungleMemoryStats', JSON.stringify(statsToSave));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    loadAchievements() {
        const defaultAchievements = {
            firstGame: false,
            firstWin: false,
            perfectGame: false,
            speedDemon: false,
            animalExpert: false,
            streakMaster: false,
            difficultyMaster: false,
            memoryChampion: false
        };

        try {
            const saved = localStorage.getItem('jungleMemoryAchievements');
            if (saved) {
                return { ...defaultAchievements, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
        return defaultAchievements;
    }

    saveAchievements() {
        try {
            localStorage.setItem('jungleMemoryAchievements', JSON.stringify(this.achievements));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    updateStats() {
        this.stats.gamesPlayed++;
        this.stats.totalMoves += this.gameState.moves;
        
        const gameTime = Math.floor((Date.now() - this.gameState.timeStarted) / 1000);
        this.stats.totalTime += gameTime;
        
        if (this.gameState.score > this.stats.bestScore) {
            this.stats.bestScore = this.gameState.score;
        }
        
        if (gameTime < this.stats.bestTime) {
            this.stats.bestTime = gameTime;
        }
        
        // Update difficulty stats
        const diffStats = this.stats.difficultyStats[this.gameState.difficulty];
        diffStats.played++;
        if (gameTime < diffStats.bestTime) {
            diffStats.bestTime = gameTime;
        }
        
        // Check for perfect game (no wrong matches)
        const wrongMatches = this.gameState.moves - this.gameState.matchedPairs;
        if (wrongMatches === 0 && this.gameState.gameWon) {
            this.stats.perfectGames++;
            this.gameState.perfectMatches++;
        }
        
        this.saveStats();
        this.checkAchievements();
    }

    checkAchievements() {
        const newAchievements = [];
        
        // First Game
        if (!this.achievements.firstGame && this.stats.gamesPlayed >= 1) {
            this.achievements.firstGame = true;
            newAchievements.push({ id: 'firstGame', title: 'First Steps', description: 'Played your first game!' });
        }
        
        // First Win
        if (!this.achievements.firstWin && this.stats.gamesWon >= 1) {
            this.achievements.firstWin = true;
            newAchievements.push({ id: 'firstWin', title: 'Jungle Explorer', description: 'Won your first game!' });
        }
        
        // Perfect Game
        if (!this.achievements.perfectGame && this.stats.perfectGames >= 1) {
            this.achievements.perfectGame = true;
            newAchievements.push({ id: 'perfectGame', title: 'Memory Master', description: 'Completed a perfect game!' });
        }
        
        // Speed Demon (win in under 2 minutes)
        if (!this.achievements.speedDemon && this.stats.bestTime < 120) {
            this.achievements.speedDemon = true;
            newAchievements.push({ id: 'speedDemon', title: 'Speed Demon', description: 'Won a game in under 2 minutes!' });
        }
        
        // Animal Expert (learn about 25+ animals)
        if (!this.achievements.animalExpert && this.stats.animalsLearned.size >= 25) {
            this.achievements.animalExpert = true;
            newAchievements.push({ id: 'animalExpert', title: 'Animal Expert', description: 'Learned about 25+ animals!' });
        }
        
        // Streak Master (5+ game winning streak)
        if (!this.achievements.streakMaster && this.stats.longestStreak >= 5) {
            this.achievements.streakMaster = true;
            newAchievements.push({ id: 'streakMaster', title: 'Streak Master', description: 'Won 5 games in a row!' });
        }
        
        // Difficulty Master (win on all difficulties)
        const difficultiesWon = Object.values(this.stats.difficultyStats).filter(d => d.won > 0).length;
        if (!this.achievements.difficultyMaster && difficultiesWon >= 5) {
            this.achievements.difficultyMaster = true;
            newAchievements.push({ id: 'difficultyMaster', title: 'Difficulty Master', description: 'Won on all difficulty levels!' });
        }
        
        // Memory Champion (100+ games played)
        if (!this.achievements.memoryChampion && this.stats.gamesPlayed >= 100) {
            this.achievements.memoryChampion = true;
            newAchievements.push({ id: 'memoryChampion', title: 'Memory Champion', description: 'Played 100+ games!' });
        }
        
        if (newAchievements.length > 0) {
            this.saveAchievements();
            this.showAchievements(newAchievements);
        }
    }

    showAchievements(achievements) {
        achievements.forEach(achievement => {
            setTimeout(() => {
                this.showAchievement(achievement);
            }, achievements.indexOf(achievement) * 1000);
        });
    }

    showAchievement(achievement) {
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement-popup';
        achievementEl.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-text">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(achievementEl);
        
        // Play achievement sound
        this.playSound('achievement');
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (achievementEl.parentElement) {
                achievementEl.remove();
            }
        }, 4000);
    }

    updateStatsDisplay() {
        // This will be called to update any stats display in the UI
        // For now, we'll add this functionality to the existing display
    }

    showStats() {
        this.playSound('buttonClick');
        const modal = document.getElementById('stats-modal');
        modal.classList.remove('hidden');
        this.populateStats();
    }

    hideStats() {
        const modal = document.getElementById('stats-modal');
        modal.classList.add('hidden');
    }

    populateStats() {
        // Update game stats
        document.getElementById('stat-games-played').textContent = this.stats.gamesPlayed;
        document.getElementById('stat-games-won').textContent = this.stats.gamesWon;
        
        const winRate = this.stats.gamesPlayed > 0 ? 
            Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) : 0;
        document.getElementById('stat-win-rate').textContent = `${winRate}%`;
        
        document.getElementById('stat-best-score').textContent = this.stats.bestScore;
        
        const bestTime = this.stats.bestTime === Infinity ? '--:--' : 
            `${Math.floor(this.stats.bestTime / 60)}:${(this.stats.bestTime % 60).toString().padStart(2, '0')}`;
        document.getElementById('stat-best-time').textContent = bestTime;
        
        document.getElementById('stat-perfect-games').textContent = this.stats.perfectGames;
        
        // Update learning progress
        document.getElementById('stat-animals-learned').textContent = this.stats.animalsLearned.size;
        document.getElementById('stat-current-streak').textContent = this.stats.currentStreak;
        document.getElementById('stat-longest-streak').textContent = this.stats.longestStreak;
        
        // Update achievements
        this.populateAchievements();
    }

    populateAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        
        const achievementData = [
            { id: 'firstGame', title: 'First Steps', description: 'Played your first game!', icon: '👶' },
            { id: 'firstWin', title: 'Jungle Explorer', description: 'Won your first game!', icon: '🏆' },
            { id: 'perfectGame', title: 'Memory Master', description: 'Completed a perfect game!', icon: '⭐' },
            { id: 'speedDemon', title: 'Speed Demon', description: 'Won a game in under 2 minutes!', icon: '⚡' },
            { id: 'animalExpert', title: 'Animal Expert', description: 'Learned about 25+ animals!', icon: '🐾' },
            { id: 'streakMaster', title: 'Streak Master', description: 'Won 5 games in a row!', icon: '🔥' },
            { id: 'difficultyMaster', title: 'Difficulty Master', description: 'Won on all difficulty levels!', icon: '🎯' },
            { id: 'memoryChampion', title: 'Memory Champion', description: 'Played 100+ games!', icon: '👑' }
        ];
        
        achievementData.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement-item ${this.achievements[achievement.id] ? 'unlocked' : ''}`;
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
            `;
            achievementsList.appendChild(achievementEl);
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JungleMemoryGame();
});