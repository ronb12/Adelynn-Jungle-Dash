// Adelynn's Jungle Memory Safari - Game Logic
// Product of Bradley Virtual Solutions, LLC

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

        this.difficultySettings = {
            easy: { pairs: 6, gridCols: 4, timeBonus: 1000 },
            medium: { pairs: 8, gridCols: 4, timeBonus: 1500 },
            hard: { pairs: 12, gridCols: 4, timeBonus: 2000 }
        };

        // Audio elements are not present in HTML, so we'll use fallback sounds
        this.sounds = {
            background: null,
            flip: null,
            match: null,
            win: null
        };

        // No audio files available - use fallback sounds only
        this.audioFilesAvailable = {
            background: false,
            flip: false,
            match: false,
            win: false
        };

        this.init();
    }


    init() {
        this.bindEvents();
        this.setupIOSOptimizations();
        this.newGame();
        this.startBackgroundMusic();
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

    bindEvents() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.gameState.difficulty = e.target.value;
            this.newGame();
        });
        document.getElementById('message-btn').addEventListener('click', () => this.hideMessage());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideAnimalModal());
        document.getElementById('play-sound-btn').addEventListener('click', () => this.playAnimalSound());

        // Close modal when clicking outside
        document.getElementById('animal-modal').addEventListener('click', (e) => {
            if (e.target.id === 'animal-modal') {
                this.hideAnimalModal();
            }
        });
    }

    newGame() {
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
            difficulty: document.getElementById('difficulty').value
        };

        this.createCards();
        this.renderBoard();
        this.updateUI();
        this.startTimer();
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
                    <div class="card-content">
                        <div class="animal-emoji">${card.animal.emoji}</div>
                        <div class="animal-name">${card.animal.name}</div>
                    </div>
                </div>
                <div class="card-back">
                    <div class="card-pattern">🌿</div>
                </div>
            </div>
        `;

        // Add both click and touch events for better iOS support
        cardDiv.addEventListener('click', (e) => {
            e.preventDefault();
            this.flipCard(card.id);
        });
        
        cardDiv.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Add visual feedback for touch
            cardDiv.classList.add('touching');
        });
        
        cardDiv.addEventListener('touchend', (e) => {
            e.preventDefault();
            cardDiv.classList.remove('touching');
            this.flipCard(card.id);
        });
        
        cardDiv.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            cardDiv.classList.remove('touching');
        });
        
        return cardDiv;
    }

    flipCard(cardId) {
        if (this.gameState.isPaused || this.gameState.gameWon) return;

        const card = this.gameState.cards.find(c => c.id === cardId);
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);

        if (!card || card.isFlipped || card.isMatched || this.gameState.flippedCards.length >= 2) {
            return;
        }

        // Flip the card
        card.isFlipped = true;
        cardElement.classList.add('flipped');
        this.gameState.flippedCards.push(card);
        
        this.playSound('flip');

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
            
            this.gameState.matchedPairs++;
            this.updateScore();
            this.playSound('match');
            
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
            }, 500);
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
        
        const finalScore = this.gameState.score;
        const moves = this.gameState.moves;
        const time = this.formatTime(this.gameState.timeElapsed);
        
        this.showMessage(
            'Congratulations! 🎉',
            `You've completed Adelynn's Jungle Memory Safari!<br><br>
            <strong>Final Score:</strong> ${finalScore}<br>
            <strong>Moves:</strong> ${moves}<br>
            <strong>Time:</strong> ${time}<br><br>
            Great job exploring the jungle with Adelynn!`
        );
    }

    showAnimalInfo(animal) {
        // Use emoji instead of image since we don't have animal images yet
        const animalImage = document.getElementById('animal-image');
        animalImage.style.display = 'none'; // Hide the img element
        
        // Create or update emoji display
        let emojiDisplay = document.getElementById('animal-emoji-display');
        if (!emojiDisplay) {
            emojiDisplay = document.createElement('div');
            emojiDisplay.id = 'animal-emoji-display';
            emojiDisplay.style.cssText = 'font-size: 4rem; text-align: center; margin: 20px 0;';
            animalImage.parentNode.insertBefore(emojiDisplay, animalImage);
        }
        emojiDisplay.textContent = animal.emoji;
        
        document.getElementById('animal-name').textContent = animal.name;
        document.getElementById('animal-fact').textContent = animal.fact;
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
    new JungleMemoryGame();
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
