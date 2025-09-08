// Adelynn's Jungle Memory Safari - Game Logic
// Product of Bradley Virtual Solutions, LLC
// Version 3.0.1 - Fix HTML Element References

class JungleMemoryGame {
    constructor() {
        this.animals = [
            { id: 'tiger', name: 'Bengal Tiger', emoji: '🐅' },
            { id: 'elephant', name: 'African Elephant', emoji: '🐘' },
            { id: 'monkey', name: 'Spider Monkey', emoji: '🐒' },
            { id: 'parrot', name: 'Scarlet Macaw', emoji: '🦜' },
            { id: 'jaguar', name: 'Jaguar', emoji: '🐆' },
            { id: 'toucan', name: 'Toucan', emoji: '🦜' }
        ];

        this.difficultySettings = {
            easy: { pairs: 6, gridCols: 4, timeBonus: 1000 },
            medium: { pairs: 6, gridCols: 4, timeBonus: 1000 },
            hard: { pairs: 6, gridCols: 4, timeBonus: 1000 }
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
        this.bindEvents();
        this.newGame();
        this.startTimer();
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
                        <img src="images/animals/${card.animal.id}.png" alt="${card.animal.name}" class="animal-image">
                        <div class="animal-name">${card.animal.name}</div>
                    </div>
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
        this.gameState.moves++;

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
            
            // Add matched class to both cards
            document.querySelector(`[data-card-id="${card1.id}"]`).classList.add('matched');
            document.querySelector(`[data-card-id="${card2.id}"]`).classList.add('matched');
            
            this.gameState.flippedCards = [];
            
            // Check if game is won
            if (this.gameState.matchedPairs === this.difficultySettings[this.gameState.difficulty].pairs) {
                this.gameWon();
            }
        } else {
            // No match - flip cards back
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                document.querySelector(`[data-card-id="${card1.id}"]`).classList.remove('flipped');
                document.querySelector(`[data-card-id="${card2.id}"]`).classList.remove('flipped');
                this.gameState.flippedCards = [];
            }, 1000);
        }
        
        this.updateDisplay();
    }

    gameWon() {
        this.gameState.gameWon = true;
        this.gameState.timeElapsed = Date.now() - this.gameState.timeStarted;
        
        setTimeout(() => {
            alert(`Congratulations! You won in ${this.gameState.moves} moves!`);
        }, 500);
    }

    updateDisplay() {
        const movesEl = document.getElementById('moves');
        const scoreEl = document.getElementById('score');
        const timerEl = document.getElementById('timer');
        
        if (movesEl) movesEl.textContent = this.gameState.moves;
        if (scoreEl) scoreEl.textContent = this.gameState.score;
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