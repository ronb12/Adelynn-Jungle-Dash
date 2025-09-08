// Adelynn's Jungle Memory Safari - Game Logic
// Product of Bradley Virtual Solutions, LLC
// Version 4.0.3 - Improve Card Flip Logic Debugging

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
            easy: { pairs: 6, gridCols: 4, timeBonus: 1000 },
            medium: { pairs: 8, gridCols: 4, timeBonus: 1500 },
            hard: { pairs: 12, gridCols: 6, timeBonus: 2000 }
        };

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
            difficulty: 'easy'
        };

        this.init();
    }

    init() {
        console.log('🎮 Initializing Jungle Memory Game...');
        this.bindEvents();
        this.newGame();
        this.startTimer();
        console.log('✅ Game initialized successfully!');
    }

    startTimer() {
        setInterval(() => {
            if (!this.gameState.isPaused && !this.gameState.gameWon) {
                this.updateDisplay();
            }
        }, 1000);
    }

    bindEvents() {
        // Game controls
        const newGameBtn = document.getElementById('new-game-btn');
        const difficultySelect = document.getElementById('difficulty');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }
        
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.gameState.difficulty = e.target.value;
                this.newGame();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Settings panel
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.toggleSettings());
        }
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.toggleSettings());
        }
    }

    newGame() {
        console.log('🔄 Starting new game...');
        
        // Reset game state
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
            difficulty: this.gameState.difficulty
        };

        this.createCards();
        this.renderBoard();
        this.updateDisplay();
        
        console.log('✅ New game started!');
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
        console.log(`🃏 Created ${this.gameState.cards.length} cards for ${difficulty.pairs} pairs`);
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
        if (!gameBoard) {
            console.error('❌ Game board element not found!');
            return;
        }

        const difficulty = this.difficultySettings[this.gameState.difficulty];
        
        // Clear existing content
        gameBoard.innerHTML = '';
        
        // Set up grid
        gameBoard.className = `game-board ${this.gameState.difficulty}`;
        gameBoard.style.gridTemplateColumns = `repeat(${difficulty.gridCols}, 1fr)`;

        console.log('🎯 Game board setup:', {
            element: gameBoard,
            className: gameBoard.className,
            gridTemplate: gameBoard.style.gridTemplateColumns,
            cardsToRender: this.gameState.cards.length
        });

        // Create and add cards
        this.gameState.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card);
            gameBoard.appendChild(cardElement);
            console.log(`🃏 Card ${index + 1}: ${card.animal.name} (${card.id})`, cardElement);
        });

        console.log(`✅ Game board rendered with ${this.gameState.cards.length} cards`);
        console.log('🎯 Final game board HTML:', gameBoard.innerHTML.substring(0, 200) + '...');
    }

    createCardElement(card) {
        console.log('🃏 Creating card element for:', card.animal.name);
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        cardDiv.setAttribute('tabindex', '0');
        cardDiv.setAttribute('role', 'button');
        cardDiv.setAttribute('aria-label', `Card with ${card.animal.name}`);
        cardDiv.setAttribute('aria-pressed', 'false');
        
        // Create card structure
        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-content">
                        <img src="images/animals/${card.animal.id}.png" 
                             alt="${card.animal.name}" 
                             class="animal-image"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="animal-emoji" style="display:none; font-size: 3rem;">${card.animal.emoji}</div>
                        <div class="animal-name">${card.animal.name}</div>
                    </div>
                </div>
                <div class="card-back">
                    <div class="card-pattern">🌿</div>
                </div>
            </div>
        `;

        console.log('🎯 Card element created:', {
            element: cardDiv,
            className: cardDiv.className,
            dataset: cardDiv.dataset,
            innerHTML: cardDiv.innerHTML.substring(0, 100) + '...'
        });

        // Add event listeners
        cardDiv.addEventListener('click', (e) => {
            console.log('🖱️ Card clicked:', card.animal.name);
            e.preventDefault();
            this.flipCard(card.id);
        });

        cardDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                console.log('⌨️ Card key pressed:', card.animal.name);
                e.preventDefault();
                this.flipCard(card.id);
            }
        });

        // Touch events for mobile
        cardDiv.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        cardDiv.addEventListener('touchend', (e) => {
            console.log('👆 Card touched:', card.animal.name);
            e.preventDefault();
            this.flipCard(card.id);
        }, { passive: false });
        
        return cardDiv;
    }

    flipCard(cardId) {
        if (this.gameState.isPaused || this.gameState.gameWon) {
            console.log('⏸️ Game is paused or won, ignoring card flip');
            return;
        }

        const card = this.gameState.cards.find(c => c.id === cardId);
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);

        if (!card || !cardElement) {
            console.log('❌ Card not found:', cardId);
            return;
        }

        if (card.isMatched) {
            console.log('🚫 Card flip blocked - card is already matched:', card.animal.name);
            return;
        }

        if (card.isFlipped) {
            console.log('🚫 Card flip blocked - card is already flipped:', card.animal.name);
            return;
        }

        if (this.gameState.flippedCards.length >= 2) {
            console.log('🚫 Card flip blocked - too many cards flipped:', this.gameState.flippedCards.length);
            return;
        }

        console.log('🔄 Flipping card:', card.animal.name);

        // Flip the card
        card.isFlipped = true;
        cardElement.classList.add('flipped');
        cardElement.setAttribute('aria-pressed', 'true');
        this.gameState.flippedCards.push(card);
        this.gameState.moves++;

        this.updateDisplay();

        // Check for matches after a short delay
        if (this.gameState.flippedCards.length === 2) {
            setTimeout(() => {
                this.checkForMatch();
            }, 1000);
        }
    }

    checkForMatch() {
        const [card1, card2] = this.gameState.flippedCards;

        console.log('🔍 Checking for match:', card1.animal.name, 'vs', card2.animal.name);
        console.log('🎯 Flipped cards state:', {
            card1: { id: card1.id, isFlipped: card1.isFlipped, isMatched: card1.isMatched },
            card2: { id: card2.id, isFlipped: card2.isFlipped, isMatched: card2.isMatched },
            flippedCardsCount: this.gameState.flippedCards.length
        });

        if (card1.animalId === card2.animalId) {
            // Match found!
            console.log('✅ Match found!');
            
            card1.isMatched = true;
            card2.isMatched = true;
            this.gameState.matchedPairs++;
            this.gameState.score += 100;
            
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
            console.log('❌ No match, flipping cards back');
            
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
                const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
                
                if (card1Element) {
                    card1Element.classList.remove('flipped');
                    card1Element.setAttribute('aria-pressed', 'false');
                }
                if (card2Element) {
                    card2Element.classList.remove('flipped');
                    card2Element.setAttribute('aria-pressed', 'false');
                }
                
                this.gameState.flippedCards = [];
            }, 1000);
        }
        
        this.updateDisplay();
    }

    gameWon() {
        console.log('🎉 Game won!');
        
        this.gameState.gameWon = true;
        this.gameState.timeElapsed = Date.now() - this.gameState.timeStarted;
        
        setTimeout(() => {
            const minutes = Math.floor(this.gameState.timeElapsed / 60000);
            const seconds = Math.floor((this.gameState.timeElapsed % 60000) / 1000);
            
            alert(`🎉 Congratulations! You won in ${this.gameState.moves} moves and ${minutes}:${seconds.toString().padStart(2, '0')}!`);
        }, 500);
    }

    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        const pauseOverlay = document.getElementById('pause-overlay');
        
        if (pauseBtn) {
            pauseBtn.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
        }
        
        if (pauseOverlay) {
            pauseOverlay.classList.toggle('hidden', !this.gameState.isPaused);
        }
        
        console.log('⏸️ Game paused:', this.gameState.isPaused);
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('hidden');
        }
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
    console.log('🚀 DOM loaded, initializing game...');
    new JungleMemoryGame();
});