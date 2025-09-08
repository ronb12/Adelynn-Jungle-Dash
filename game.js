// Adelynn's Jungle Memory Safari - Clean Rebuild
// Product of Bradley Virtual Solutions, LLC

class JungleMemoryGame {
    constructor() {
        this.animals = [
            { id: 'tiger', name: 'Bengal Tiger', emoji: '🐅' },
            { id: 'elephant', name: 'African Elephant', emoji: '🐘' },
            { id: 'monkey', name: 'Spider Monkey', emoji: '🐒' },
            { id: 'parrot', name: 'Scarlet Macaw', emoji: '🦜' },
            { id: 'jaguar', name: 'Jaguar', emoji: '🐆' },
            { id: 'toucan', name: 'Toucan', emoji: '🦜' },
            { id: 'crocodile', name: 'Crocodile', emoji: '🐊' },
            { id: 'hippo', name: 'Hippopotamus', emoji: '🦛' },
            { id: 'snake', name: 'Anaconda', emoji: '🐍' },
            { id: 'frog', name: 'Poison Dart Frog', emoji: '🐸' },
            { id: 'butterfly', name: 'Morpho Butterfly', emoji: '🦋' },
            { id: 'sloth', name: 'Sloth', emoji: '🦥' }
        ];

        this.difficultySettings = {
            easy: { pairs: 6, gridCols: 4 },
            medium: { pairs: 8, gridCols: 4 },
            hard: { pairs: 12, gridCols: 6 }
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
            difficulty: 'easy'
        };

        // Sound system
        this.sounds = {
            cardFlip: null,
            matchSuccess: null,
            gameWin: null,
            jungleAmbiance: null
        };
        this.soundEnabled = true;

        this.init();
    }

    init() {
        this.initializeSounds();
        this.bindEvents();
        this.newGame();
        this.startTimer();
    }

    initializeSounds() {
        // Create audio elements for sounds
        this.sounds.cardFlip = new Audio('sounds/card-flip.wav');
        this.sounds.matchSuccess = new Audio('sounds/match-success.wav');
        this.sounds.gameWin = new Audio('sounds/game-win.wav');
        this.sounds.jungleAmbiance = new Audio('sounds/jungle-ambiance.wav');
        
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
            difficulty: this.gameState.difficulty
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
                    <div class="animal-emoji" style="display:none; font-size: 4rem; margin-bottom: 10px;">${card.animal.emoji}</div>
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

    gameWon() {
        this.gameState.gameWon = true;
        
        // Play game win sound
        this.playSound('gameWin');
        
        const timeElapsed = Date.now() - this.gameState.timeStarted;
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor((timeElapsed % 60000) / 1000);
        
        setTimeout(() => {
            this.showMessage(
                '🎉 Congratulations!',
                `You won in ${this.gameState.moves} moves and ${minutes}:${seconds.toString().padStart(2, '0')}!`
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
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JungleMemoryGame();
});
