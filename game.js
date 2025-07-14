// Game.js - Core game logic and state management

class Game {
    constructor() {
        this.isProcessingJoker = false;
        this.currentScreen = 'title';
        this.gridSize = 3;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.currentPlayer = 1;
        this.scores = { player1: 0, player2: 0 };
        this.catPosition = { x: 0, y: 0 };
        this.gameBoard = null;
        this.totalPairs = 0;
        this.jokers = [];
        this.achievements = {};
        this.gameStats = {
            moves: 0,
            perfectMoves: 0,
            startTime: null,
            mistakes: 0
        };
        this.init();
    }

    init() {
        this.loadAchievements();
        this.showTitle();
    }

    showTitle() {
        this.currentScreen = 'title';
        Utils.showScreen('title-screen');
        audioManager.startMusic('title');
        graphics.cleanup();
    }

    showGridSelection() {
        this.currentScreen = 'gridSelection';
        Utils.showScreen('grid-selection');
        audioManager.playSound('buttonClick');
    }

    showGame() {
        this.currentScreen = 'game';
        Utils.showScreen('game-screen');
    }

    showPeekChallenge() {
        this.currentScreen = 'peek';
        this.generateMathProblem();
        Utils.showScreen('peek-screen');
        audioManager.playSound('peek');
    }

    showAchievements() {
        this.currentScreen = 'achievements';
        this.displayAchievements();
        Utils.showScreen('achievements-screen');
        audioManager.playSound('buttonClick');
    }

    showGameOver() {
        this.currentScreen = 'gameOver';
        this.displayGameOverScreen();
        Utils.showScreen('gameover-screen');
        audioManager.stopMusic();
        
        // Check for minigame trigger (5% chance)
        if (Math.random() < 0.05) {
            setTimeout(() => {
                this.triggerMinigame();
            }, 2000);
        }
    }

    startGame(size) {
        this.gridSize = size;
        this.resetGame();
        this.createCards();
        this.renderGameBoard();
        this.showGame();
        this.gameStats.startTime = Date.now();
        audioManager.startMusic('game');
        audioManager.playSound('buttonClick');
    }

    resetGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.currentPlayer = 1;
        this.scores = { player1: 0, player2: 0 };
        this.catPosition = { x: 0, y: 0 };
        this.jokers = [];
        this.gameStats = {
            moves: 0,
            perfectMoves: 0,
            startTime: Date.now(),
            mistakes: 0
        };
        
        this.updateScoreDisplay();
        this.updateCurrentPlayerDisplay();
    }

    createCards() {
        const totalCards = this.gridSize * this.gridSize;
        const symbols = Utils.getCardSymbols();
        const jokerSymbol = Utils.getJokerSymbol();
        
        // Determine number of pairs and jokers based on grid size
        let pairs, numJokers;
        switch (this.gridSize) {
            case 3: // 9 cards: 4 pairs + 1 joker
                pairs = 4;
                numJokers = 1;
                break;
            case 4: // 16 cards: 8 pairs (no jokers)
                pairs = 8;
                numJokers = 0;
                break;
            case 5: // 25 cards: 12 pairs + 1 joker  
                pairs = 12;
                numJokers = 1;
                break;
            case 6: // 36 cards: 16 pairs + 4 jokers
                pairs = 16;
                numJokers = 4;
                break;
        }
        
        this.totalPairs = pairs;
        
        // Create pairs
        const cardSymbols = [];
        for (let i = 0; i < pairs; i++) {
            const symbol = symbols[i % symbols.length];
            cardSymbols.push(symbol, symbol);
        }
        
        // Add jokers
        for (let i = 0; i < numJokers; i++) {
            cardSymbols.push(jokerSymbol);
        }
        
        // Shuffle and create card objects
        const shuffledSymbols = Utils.shuffleArray(cardSymbols);
        this.cards = shuffledSymbols.map((symbol, index) => ({
            id: index,
            symbol: symbol,
            isFlipped: false,
            isMatched: false,
            isJoker: symbol === jokerSymbol
        }));
        
        // Track joker positions
        this.jokers = this.cards.filter(card => card.isJoker).map(card => card.id);
    }

    renderGameBoard() {
        this.gameBoard = document.getElementById('game-board');
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = `game-board grid-${this.gridSize}x${this.gridSize}`;
        
        this.cards.forEach((card, index) => {
            const cardElement = Utils.createElement('div', 'card');
            cardElement.dataset.index = index;
            cardElement.dataset.symbol = card.symbol;
            
            if (card.isJoker) {
                cardElement.classList.add('joker');
            }
            
            this.gameBoard.appendChild(cardElement);
        });
        
        // Highlight initial cat position
        this.updateCatPosition();
    }

    updateCatPosition() {
        // Remove current position highlight
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('current-position');
        });
        
        // Add highlight to current position
        const currentCard = this.getCurrentCard();
        if (currentCard) {
            graphics.highlightCurrentCard(currentCard);
        }
    }

    getCurrentCard() {
        const index = this.catPosition.y * this.gridSize + this.catPosition.x;
        return document.querySelector(`[data-index="${index}"]`);
    }

    moveCat(direction) {
        const oldPos = { ...this.catPosition };
        
        switch (direction) {
            case 'up':
                this.catPosition.y = Math.max(0, this.catPosition.y - 1);
                break;
            case 'down':
                this.catPosition.y = Math.min(this.gridSize - 1, this.catPosition.y + 1);
                break;
            case 'left':
                this.catPosition.x = Math.max(0, this.catPosition.x - 1);
                break;
            case 'right':
                this.catPosition.x = Math.min(this.gridSize - 1, this.catPosition.x + 1);
                break;
        }
        
        // Only update if position changed
        if (oldPos.x !== this.catPosition.x || oldPos.y !== this.catPosition.y) {
            this.updateCatPosition();
            audioManager.playSound('buttonClick');
            
            // Animate cat sprite
            const catSprite = document.getElementById('cat-sprite');
            if (catSprite) {
                graphics.animateCatMovement(catSprite, direction);
            }
        }
    }

    selectCard(cardIndex) {
        this.catPosition.x = cardIndex % this.gridSize;
        this.catPosition.y = Math.floor(cardIndex / this.gridSize);
        this.updateCatPosition();
        this.flipCard();
    }

    flipCard() {
        const cardIndex = this.catPosition.y * this.gridSize + this.catPosition.x;
        const card = this.cards[cardIndex];
        const cardElement = document.querySelector(`[data-index="${cardIndex}"]`);
        
        if (!card || card.isFlipped || card.isMatched || this.flippedCards.length >= 2 || this.isProcessingJoker) {
            return;
        }
        
        // Flip the card
        card.isFlipped = true;
        this.flippedCards.push(cardIndex);
        this.gameStats.moves++;
        
        // Animate card flip
        graphics.animateCardFlip(cardElement, true);
        audioManager.playSound('cardFlip');
        
        // Handle joker
        if (card.isJoker) {
            setTimeout(() => {
                this.handleJokerFlip(cardIndex);
            }, 300);
            return;
        }
        
        // Check for match after second card
        if (this.flippedCards.length === 2) {
            setTimeout(() => {
                this.checkForMatch();
            }, 500);
        }
    }

    handleJokerFlip(jokerIndex) {
        this.isProcessingJoker = true;  // ADD THIS LINE
        const jokerCard = this.cards[jokerIndex];
        
        // Find matching pair for the joker
        const otherCards = this.cards.filter((card, index) => 
            !card.isMatched && !card.isJoker && index !== jokerIndex
        );
        
        // Group by symbol
        const symbolGroups = {};
        otherCards.forEach(card => {
            if (!symbolGroups[card.symbol]) {
                symbolGroups[card.symbol] = [];
            }
            symbolGroups[card.symbol].push(card);
        });
        
        // Find a complete pair
        const completePair = Object.values(symbolGroups).find(group => group.length >= 2);
        
        if (completePair) {
            // Auto-reveal the matching pair
            const pair = completePair.slice(0, 2);
            const matchedCards = [jokerIndex, ...pair.map(card => card.id)];
            
            // Flip the pair cards
            pair.forEach(card => {
                card.isFlipped = true;
                const element = document.querySelector(`[data-index="${card.id}"]`);
                graphics.animateCardFlip(element, true);
            });
            
            setTimeout(() => {
                this.handleMatch(matchedCards, true);
            }, 500);
        } else {
            // No pairs available, treat as normal card
            this.checkForMatch();
        }
    }

    checkForMatch() {
        if (this.flippedCards.length !== 2) return;
        
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];
        
        if (card1.symbol === card2.symbol) {
            // Match found
            this.handleMatch([index1, index2]);
        } else {
            // No match
            this.handleMismatch([index1, index2]);
        }
    }

    handleMatch(cardIndices, isJokerMatch = false) {
        // Mark cards as matched
        cardIndices.forEach(index => {
            this.cards[index].isMatched = true;
        });
        
        // Update score
        this.scores[`player${this.currentPlayer}`]++;
        this.gameStats.perfectMoves++;
        
        // Animate matched cards
        const cardElements = cardIndices.map(index => 
            document.querySelector(`[data-index="${index}"]`)
        );
        
        if (isJokerMatch) {
            graphics.animateJokerReveal(cardElements);
        } else {
            graphics.animateCardMatch(cardElements);
        }
        
        // Play sound and create effects
        audioManager.playSound('cardMatch');
        audioManager.playSound('catPurr');
        
        // Create particle effects
        cardElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            graphics.createParticleBurst(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                8,
                { color: isJokerMatch ? '#ffd700' : '#00b894' }
            );
        });
        
        // Update display
        this.updateScoreDisplay();
        
        // Clear flipped cards
        this.flippedCards = [];
        this.matchedPairs++;
        
        // Check for game end
        if (this.isGameComplete()) {
            setTimeout(() => {
                this.endGame();
            }, 1000);
        }
        this.isProcessingJoker = false;
        // Player keeps their turn on a match
    }

    handleMismatch(cardIndices) {
        setTimeout(() => {
            // Flip cards back
            cardIndices.forEach(index => {
                const card = this.cards[index];
                const cardElement = document.querySelector(`[data-index="${index}"]`);
                
                card.isFlipped = false;
                cardElement.textContent = '';
                cardElement.classList.remove('flipped');
            });
            
            // Animate mismatch
            const cardElements = cardIndices.map(index => 
                document.querySelector(`[data-index="${index}"]`)
            );
            graphics.animateCardMiss(cardElements);
            
            // Play sounds
            audioManager.playSound('cardMiss');
            audioManager.playSound('catDisappoint');
            
            // Update stats
            this.gameStats.mistakes++;
            
            // Switch players
            this.switchPlayer();
            
            // Clear flipped cards
            this.flippedCards = [];
        }, 1000);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateCurrentPlayerDisplay();
    }

    updateScoreDisplay() {
        const score1Element = document.getElementById('player1-score');
        const score2Element = document.getElementById('player2-score');
        
        if (score1Element) {
            graphics.animateScoreIncrement(score1Element, this.scores.player1);
        }
        if (score2Element) {
            graphics.animateScoreIncrement(score2Element, this.scores.player2);
        }
    }

    updateCurrentPlayerDisplay() {
        const indicator = document.getElementById('current-player-indicator');
        if (indicator) {
            indicator.textContent = `Player ${this.currentPlayer}'s Turn`;
            indicator.style.color = this.currentPlayer === 1 ? '#ff6b6b' : '#74b9ff';
        }
    }

    isGameComplete() {
        return this.matchedPairs >= this.totalPairs;
    }

    endGame() {
        // Calculate final stats
        const gameTime = Date.now() - this.gameStats.startTime;
        
        // Check achievements
        this.checkGameAchievements();
        
        // Show game over screen
        this.showGameOver();
    }

    checkGameAchievements() {
        // Purr-fect Memory - Complete game with zero mistakes
        if (this.gameStats.mistakes === 0) {
            this.unlockAchievement("Purr-fect Memory", "Complete a game without any mistakes!");
        }
        
        // Cat Burglar - Win from behind by 3+ points
        const scoreDiff = Math.abs(this.scores.player1 - this.scores.player2);
        if (scoreDiff >= 3) {
            this.unlockAchievement("Cat Burglar", "Win a game by 3 or more points!");
        }
        
        // Nine Lives - Dramatic comeback (specific logic needed)
        // This would require tracking score during game
        
        // Speed achievements based on grid size and time
        const gameTimeSeconds = (Date.now() - this.gameStats.startTime) / 1000;
        if (this.gridSize === 6 && gameTimeSeconds < 120) {
            this.unlockAchievement("Lightning Cat", "Complete 6x6 grid in under 2 minutes!");
        }
    }

    unlockAchievement(name, description) {
        if (!this.achievements[name]) {
            this.achievements[name] = {
                name: name,
                description: description,
                unlocked: true,
                timestamp: Date.now()
            };
            
            this.saveAchievements();
            audioManager.playSound('achievementUnlock');
            
            // Show achievement notification
            graphics.createFloatingText(
                window.innerWidth / 2,
                100,
                `Achievement Unlocked: ${name}!`,
                '#ffd700'
            );
        }
    }

    displayGameOverScreen() {
        const winner = this.scores.player1 > this.scores.player2 ? 1 : 
                     this.scores.player2 > this.scores.player1 ? 2 : 0;
        
        const winnerText = document.getElementById('winner-text');
        const score1 = document.getElementById('final-score1');
        const score2 = document.getElementById('final-score2');
        
        if (winner === 0) {
            winnerText.textContent = "It's a Tie!";
            winnerText.style.color = '#ffd700';
        } else {
            winnerText.textContent = `Player ${winner} Wins!`;
            graphics.animateGameOver(winnerText, winner === 1);
        }
        
        if (score1) score1.textContent = this.scores.player1;
        if (score2) score2.textContent = this.scores.player2;
        
        // Play appropriate sound
        if (winner === 0) {
            audioManager.playSound('catPurr');
        } else {
            audioManager.playSound('gameWin');
        }
        
        // Show earned achievements
        this.displayNewAchievements();
    }

    displayNewAchievements() {
        const container = document.getElementById('achievements-earned');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show recently unlocked achievements (last 5 minutes)
        const recentTime = Date.now() - 5 * 60 * 1000;
        const recentAchievements = Object.values(this.achievements)
            .filter(achievement => achievement.timestamp > recentTime);
        
        if (recentAchievements.length > 0) {
            const title = Utils.createElement('h4');
            title.textContent = '🏆 New Achievements!';
            title.style.color = '#ffd700';
            container.appendChild(title);
            
            recentAchievements.forEach(achievement => {
                const achievementElement = Utils.createElement('div', 'achievement earned');
                achievementElement.innerHTML = `
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                `;
                container.appendChild(achievementElement);
                graphics.animateAchievementUnlock(achievementElement);
            });
        }
    }

    displayAchievements() {
        const container = document.getElementById('achievements-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const allAchievements = {
            "Purr-fect Memory": "Complete a game without any mistakes",
            "Cat Burglar": "Win a game by 3 or more points",
            "Nine Lives": "Make a dramatic comeback victory",
            "Speed Hunter": "Achieve high score in mouse hunt",
            "Golden Hunter": "Catch the rare golden mouse",
            "Mouse Master": "Catch all mice in minigame",
            "Lightning Cat": "Complete 6x6 grid in under 2 minutes"
        };
        
        Object.entries(allAchievements).forEach(([name, description]) => {
            const achievement = this.achievements[name];
            const achievementElement = Utils.createElement('div', 
                achievement ? 'achievement earned' : 'achievement');
            
            achievementElement.innerHTML = `
                <h4>${achievement ? '🏆' : '🔒'} ${name}</h4>
                <p>${description}</p>
                ${achievement ? `<small>Unlocked: ${new Date(achievement.timestamp).toLocaleDateString()}</small>` : ''}
            `;
            
            container.appendChild(achievementElement);
        });
    }

    triggerMinigame() {
        this.currentScreen = 'minigame';
        Utils.showScreen('minigame-screen');
        
        minigame.start().then(() => {
            minigame.startUpdateLoop();
        });
    }

    // Math challenge methods
    generateMathProblem() {
        const problem = Utils.generateMathProblem();
        const questionElement = document.getElementById('math-question');
        if (questionElement) {
            questionElement.textContent = problem.question + ' = ?';
        }
        this.currentMathAnswer = problem.answer;
    }

    inputNumber(number) {
        const input = document.getElementById('math-answer');
        if (input) {
            input.value = number;
        }
        audioManager.playSound('buttonClick');
    }

    clearNumber() {
        const input = document.getElementById('math-answer');
        if (input) {
            input.value = '';
        }
        audioManager.playSound('buttonClick');
    }

    submitMathAnswer() {
        const input = document.getElementById('math-answer');
        const userAnswer = parseInt(input.value);
        
        if (userAnswer === this.currentMathAnswer) {
            // Correct answer - show peek mode
            audioManager.playSound('cardMatch');
            this.activatePeekMode();
            this.showGame();
        } else {
            // Wrong answer
            audioManager.playSound('cardMiss');
            graphics.shakeElement(input);
            input.value = '';
            
            // Show correct answer briefly
            const questionElement = document.getElementById('math-question');
            const originalText = questionElement.textContent;
            questionElement.textContent = `Correct answer: ${this.currentMathAnswer}`;
            questionElement.style.color = '#ff6b6b';
            
            setTimeout(() => {
                questionElement.textContent = originalText;
                questionElement.style.color = '';
                this.showGame();
            }, 2000);
        }
    }

    activatePeekMode() {
        const cards = document.querySelectorAll('.card');
        graphics.animatePeekMode(cards, 4000);
        
        graphics.createFloatingText(
            window.innerWidth / 2,
            150,
            'PEEK MODE ACTIVATED!',
            '#74b9ff'
        );
    }

    saveAchievements() {
        Utils.saveToLocalStorage('achievements', this.achievements);
    }

    loadAchievements() {
        this.achievements = Utils.loadFromLocalStorage('achievements', {});
    }

    resetAchievements() {
        this.achievements = {};
        this.saveAchievements();
        console.log('🗑️ All achievements reset');
    }
}

// Global game instance
const game = new Game();
