// Game.js Part 1 - Constructor and Basic Setup

class Game {
    constructor() {
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
            mistakes: 0,
            peekUsed: 0,
            mathProblemsCorrect: 0,
            mathProblemsTotal: 0,
            gameWins: { player1: 0, player2: 0 }
        };
        this.gameHistory = [];
        this.currentMathProblem = null;
        this.selectedAnswer = null;
        this.peekCooldown = false;
        this.peekCooldownTime = 5000;
        this.peekCooldownTimer = null;
        this.init();
    }

    init() {
        console.log('🎮 Initializing Cat Memory Game');
        this.loadAchievements();
        this.loadGameHistory();
        this.showTitle();
    }

    // Screen Management
    showTitle() {
        this.currentScreen = 'title';
        Utils.showScreen('title-screen');
        
        if (audioManager) {
            audioManager.startMusic('title');
        }
        
        if (graphics) {
            graphics.cleanup();
        }
        
        console.log('🏠 Showing title screen');
    }

    showGridSelection() {
        this.currentScreen = 'gridSelection';
        Utils.showScreen('grid-selection');
        
        if (audioManager) {
            audioManager.playSound('buttonClick');
        }
        
        console.log('📐 Showing grid selection');
    }

    showGame() {
        this.currentScreen = 'game';
        Utils.showScreen('game-screen');
        this.updatePeekButton();
        console.log('🎮 Showing game screen');
    }

    showPeekChallenge() {
        if (this.peekCooldown) {
            Utils.showNotification('Peek is on cooldown!', 'info', 2000);
            return;
        }
        
        this.currentScreen = 'peek';
        this.generateMathProblem();
        this.clearSelectedAnswer();
        Utils.showScreen('peek-screen');
        
        if (audioManager) {
            audioManager.playSound('peek');
        }
        
        console.log('🧮 Showing peek challenge');
    }

    showAchievements() {
        this.currentScreen = 'achievements';
        this.displayAchievements();
        Utils.showScreen('achievements-screen');
        
        if (audioManager) {
            audioManager.playSound('buttonClick');
        }
        
        console.log('🏆 Showing achievements');
    }

    showGameOver() {
        this.currentScreen = 'gameOver';
        this.displayGameOverScreen();
        Utils.showScreen('gameover-screen');
        
        if (audioManager) {
            audioManager.stopMusic();
        }
        
        this.saveGameToHistory();
        
        if (Math.random() < Utils.getGameConfig().minigameProbability) {
            setTimeout(() => {
                this.triggerMinigame();
            }, 3000);
        }
        
        console.log('🎉 Game over');
    }
// Game.js Part 2 - Game Setup and Card Creation

    startGame(size) {
        this.gridSize = size;
        this.resetGame();
        this.createCards();
        this.renderGameBoard();
        this.showGame();
        this.gameStats.startTime = Date.now();
        
        if (audioManager) {
            audioManager.startMusic('game');
            audioManager.playSound('buttonClick');
        }
        
        console.log(`🎮 Starting ${size}x${size} game`);
    }

    resetGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.currentPlayer = 1;
        this.scores = { player1: 0, player2: 0 };
        this.catPosition = { x: 0, y: 0 };
        this.jokers = [];
        this.selectedAnswer = null;
        this.peekCooldown = false;
        
        if (this.peekCooldownTimer) {
            clearTimeout(this.peekCooldownTimer);
            this.peekCooldownTimer = null;
        }
        
        this.gameStats = {
            moves: 0,
            perfectMoves: 0,
            startTime: Date.now(),
            mistakes: 0,
            peekUsed: 0,
            mathProblemsCorrect: 0,
            mathProblemsTotal: 0,
            gameWins: this.gameStats.gameWins
        };
        
        this.updateScoreDisplay();
        this.updateCurrentPlayerDisplay();
        this.updatePeekButton();
        
        console.log('🔄 Game reset');
    }

    createCards() {
        const config = Utils.getGameConfig().jokerConfig[this.gridSize];
        const symbols = Utils.getCardSymbols();
        const jokerSymbol = Utils.getJokerSymbol();
        
        this.totalPairs = config.pairs;
        const numJokers = config.jokers;
        
        const cardSymbols = [];
        for (let i = 0; i < this.totalPairs; i++) {
            const symbol = symbols[i % symbols.length];
            cardSymbols.push(symbol, symbol);
        }
        
        for (let i = 0; i < numJokers; i++) {
            cardSymbols.push(jokerSymbol);
        }
        
        const shuffledSymbols = Utils.shuffleArray(cardSymbols);
        this.cards = shuffledSymbols.map((symbol, index) => ({
            id: index,
            symbol: symbol,
            isFlipped: false,
            isMatched: false,
            isJoker: symbol === jokerSymbol
        }));
        
        this.jokers = this.cards.filter(card => card.isJoker).map(card => card.id);
        
        console.log(`🃏 Created ${cardSymbols.length} cards (${this.totalPairs} pairs, ${numJokers} jokers)`);
    }

    renderGameBoard() {
        this.gameBoard = document.getElementById('game-board');
        if (!this.gameBoard) {
            console.error('Game board element not found');
            return;
        }
        
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = `game-board grid-${this.gridSize}x${this.gridSize}`;
        
        this.cards.forEach((card, index) => {
            const cardElement = Utils.createElement('div', 'card');
            cardElement.dataset.index = index;
            cardElement.dataset.symbol = card.symbol;
            cardElement.setAttribute('tabindex', '0');
            cardElement.setAttribute('role', 'button');
            cardElement.setAttribute('aria-label', `Card ${index + 1}`);
            
            if (card.isJoker) {
                cardElement.classList.add('joker');
            }
            
            cardElement.addEventListener('keydown', (e) => {
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    this.selectCard(index);
                }
            });
            
            this.gameBoard.appendChild(cardElement);
        });
        
        this.updateCatPosition();
        console.log('🎯 Game board rendered');
    }
// Game.js Part 3 - Cat Movement and Card Logic

    updateCatPosition() {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('current-position');
        });
        
        const currentCard = this.getCurrentCard();
        if (currentCard && graphics) {
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
        
        if (oldPos.x !== this.catPosition.x || oldPos.y !== this.catPosition.y) {
            this.updateCatPosition();
            
            if (audioManager) {
                audioManager.playSound('buttonClick');
            }
            
            const catSprite = document.getElementById('cat-sprite');
            if (catSprite && graphics) {
                graphics.animateCatMovement(catSprite, direction);
            }
            
            Utils.vibrate([30]);
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
        
        if (!card || !cardElement || card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
            if (audioManager) {
                audioManager.playSound('catDisappoint');
            }
            return;
        }
        
        card.isFlipped = true;
        this.flippedCards.push(cardIndex);
        this.gameStats.moves++;
        
        if (graphics) {
            graphics.animateCardFlip(cardElement, true);
        }
        
        if (audioManager) {
            audioManager.playSound('cardFlip');
        }
        
        Utils.vibrate([50]);
        
        if (card.isJoker) {
            setTimeout(() => {
                this.handleJokerFlip(cardIndex);
            }, 300);
            return;
        }
        
        if (this.flippedCards.length === 2) {
            setTimeout(() => {
                this.checkForMatch();
            }, 500);
        }
        
        console.log(`🃏 Card ${cardIndex} flipped`);
    }

    handleJokerFlip(jokerIndex) {
        const otherCards = this.cards.filter((card, index) => 
            !card.isMatched && !card.isJoker && index !== jokerIndex
        );
        
        const symbolGroups = {};
        otherCards.forEach(card => {
            if (!symbolGroups[card.symbol]) {
                symbolGroups[card.symbol] = [];
            }
            symbolGroups[card.symbol].push(card);
        });
        
        const completePair = Object.values(symbolGroups).find(group => group.length >= 2);
        
        if (completePair) {
            const pair = completePair.slice(0, 2);
            const matchedCards = [jokerIndex, ...pair.map(card => card.id)];
            
            pair.forEach(card => {
                card.isFlipped = true;
                const element = document.querySelector(`[data-index="${card.id}"]`);
                if (element && graphics) {
                    graphics.animateCardFlip(element, true);
                }
            });
            
            setTimeout(() => {
                this.handleMatch(matchedCards, true);
            }, 500);
        } else {
            this.checkForMatch();
        }
        
        console.log('⭐ Joker revealed');
    }

    checkForMatch() {
        if (this.flippedCards.length !== 2) return;
        
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];
        
        if (card1.symbol === card2.symbol) {
            this.handleMatch([index1, index2]);
        } else {
            this.handleMismatch([index1, index2]);
        }
    }
// Game.js Part 4 - Match Handling and Math System

    handleMatch(cardIndices, isJokerMatch = false) {
        cardIndices.forEach(index => {
            this.cards[index].isMatched = true;
        });
        
        this.scores[`player${this.currentPlayer}`]++;
        this.gameStats.perfectMoves++;
        
        const cardElements = cardIndices.map(index => 
            document.querySelector(`[data-index="${index}"]`)
        ).filter(el => el);
        
        if (graphics) {
            if (isJokerMatch) {
                graphics.animateJokerReveal(cardElements);
            } else {
                graphics.animateCardMatch(cardElements);
            }
        }
        
        if (audioManager) {
            audioManager.playSound('cardMatch');
            audioManager.playSound('catPurr');
        }
        
        cardElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (graphics) {
                graphics.createParticleBurst(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    8,
                    { 
                        color: isJokerMatch ? '#ffd700' : '#00b894',
                        shape: isJokerMatch ? 'star' : 'circle'
                    }
                );
            }
        });
        
        this.updateScoreDisplay();
        this.flippedCards = [];
        this.matchedPairs++;
        
        Utils.vibrate([100, 50, 100]);
        
        if (this.isGameComplete()) {
            setTimeout(() => {
                this.endGame();
            }, 1000);
        }
        
        console.log(`✅ Match found! Player ${this.currentPlayer} scores`);
    }

    handleMismatch(cardIndices) {
        setTimeout(() => {
            cardIndices.forEach(index => {
                const card = this.cards[index];
                const cardElement = document.querySelector(`[data-index="${index}"]`);
                
                if (card && cardElement) {
                    card.isFlipped = false;
                    cardElement.textContent = '';
                    cardElement.classList.remove('flipped');
                }
            });
            
            const cardElements = cardIndices.map(index => 
                document.querySelector(`[data-index="${index}"]`)
            ).filter(el => el);
            
            if (graphics) {
                graphics.animateCardMiss(cardElements);
            }
            
            if (audioManager) {
                audioManager.playSound('cardMiss');
                audioManager.playSound('catDisappoint');
            }
            
            this.gameStats.mistakes++;
            this.switchPlayer();
            this.flippedCards = [];
            
            Utils.vibrate([200]);
        }, 1000);
        
        console.log('❌ No match - switching players');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateCurrentPlayerDisplay();
    }

    updateScoreDisplay() {
        const score1Element = document.getElementById('player1-score');
        const score2Element = document.getElementById('player2-score');
        
        if (score1Element && graphics) {
            graphics.animateScoreIncrement(score1Element, this.scores.player1);
        }
        if (score2Element && graphics) {
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

    updatePeekButton() {
        const peekButton = document.getElementById('peek-button');
        if (peekButton) {
            if (this.peekCooldown) {
                peekButton.disabled = true;
                peekButton.style.opacity = '0.5';
                peekButton.textContent = '🧮 PEEK (Cooldown)';
            } else {
                peekButton.disabled = false;
                peekButton.style.opacity = '1';
                peekButton.textContent = '🧮 PEEK (Math)';
            }
        }
    }

    generateMathProblem() {
        this.currentMathProblem = Utils.generateMathProblem();
        this.gameStats.mathProblemsTotal++;
        
        const questionElement = document.getElementById('math-question');
        if (questionElement) {
            questionElement.textContent = `${this.currentMathProblem.question} = ?`;
        }
        
        console.log(`🧮 Math problem: ${this.currentMathProblem.question} = ${this.currentMathProblem.answer}`);
    }

    inputNumber(number) {
        this.selectedAnswer = number;
        
        const displayElement = document.getElementById('answer-display');
        if (displayElement) {
            displayElement.textContent = number;
            displayElement.style.color = '#74b9ff';
        }
        
        if (audioManager) {
            audioManager.playSound('numberInput');
        }
        
        Utils.vibrate([30]);
        console.log(`🔢 Number selected: ${number}`);
    }

    clearNumber() {
        this.selectedAnswer = null;
        
        const displayElement = document.getElementById('answer-display');
        if (displayElement) {
            displayElement.textContent = '_';
            displayElement.style.color = '';
        }
        
        if (audioManager) {
            audioManager.playSound('buttonClick');
        }
        
        console.log('🔢 Number cleared');
    }

    clearSelectedAnswer() {
        this.clearNumber();
    }
// Game.js Part 5 - Peek System and Game End

    submitMathAnswer() {
        if (this.selectedAnswer === null || !this.currentMathProblem) {
            Utils.showNotification('Please select an answer first!', 'info', 2000);
            return;
        }
        
        const isCorrect = this.selectedAnswer === this.currentMathProblem.answer;
        
        if (isCorrect) {
            this.gameStats.mathProblemsCorrect++;
            
            if (audioManager) {
                audioManager.playSound('mathCorrect');
            }
            
            Utils.showNotification('Correct! Peek activated!', 'success', 2000);
            this.activatePeekMode();
            this.showGame();
            this.startPeekCooldown();
            
            console.log('✅ Math answer correct - peek activated');
        } else {
            if (audioManager) {
                audioManager.playSound('mathWrong');
            }
            
            const questionElement = document.getElementById('math-question');
            if (questionElement && graphics) {
                graphics.shakeElement(questionElement);
                
                const originalText = questionElement.textContent;
                questionElement.textContent = `Correct answer: ${this.currentMathProblem.answer}`;
                questionElement.style.color = '#ff6b6b';
                
                setTimeout(() => {
                    questionElement.textContent = originalText;
                    questionElement.style.color = '';
                    this.showGame();
                }, 2000);
            }
            
            Utils.showNotification('Wrong answer! Try again next time.', 'error', 2000);
            Utils.vibrate([200, 100, 200]);
            
            console.log('❌ Math answer incorrect');
        }
    }

    activatePeekMode() {
        const cards = document.querySelectorAll('.card');
        const duration = Utils.getGameConfig().peekDuration;
        
        this.gameStats.peekUsed++;
        
        if (graphics) {
            graphics.animatePeekMode(cards, duration);
            graphics.createFloatingText(
                window.innerWidth / 2,
                150,
                'PEEK MODE ACTIVATED!',
                '#74b9ff',
                { duration: 2000, fontSize: '28px' }
            );
        }
        
        console.log('👁️ Peek mode activated');
    }

    startPeekCooldown() {
        this.peekCooldown = true;
        this.updatePeekButton();
        
        this.peekCooldownTimer = setTimeout(() => {
            this.peekCooldown = false;
            this.updatePeekButton();
            
            if (this.currentScreen === 'game') {
                Utils.showNotification('Peek is ready again!', 'info', 1500);
            }
        }, this.peekCooldownTime);
    }

    isGameComplete() {
        return this.matchedPairs >= this.totalPairs;
    }

    endGame() {
        const gameTime = Date.now() - this.gameStats.startTime;
        const winner = this.getWinner();
        
        if (winner > 0) {
            this.gameStats.gameWins[`player${winner}`]++;
        }
        
        this.checkGameAchievements(gameTime, winner);
        this.showGameOver();
        
        console.log(`🎉 Game ended - Winner: Player ${winner || 'Tie'}`);
    }

    getWinner() {
        if (this.scores.player1 > this.scores.player2) return 1;
        if (this.scores.player2 > this.scores.player1) return 2;
        return 0;
    }

    checkGameAchievements(gameTime, winner) {
        const gameTimeSeconds = gameTime / 1000;
        
        if (this.gameStats.mistakes === 0) {
            this.unlockAchievement("Purr-fect Memory", "Complete a game without any mistakes!");
        }
        
        const scoreDiff = Math.abs(this.scores.player1 - this.scores.player2);
        if (scoreDiff >= 3) {
            this.unlockAchievement("Cat Burglar", "Win a game by 3 or more points!");
        }
        
        if (this.gridSize === 6 && gameTimeSeconds < 120) {
            this.unlockAchievement("Lightning Cat", "Complete 6x6 grid in under 2 minutes!");
        }
        
        if (this.gameStats.mathProblemsCorrect >= 3) {
            this.unlockAchievement("Math Wizard", "Solve 3+ math problems correctly in one game!");
        }
        
        if (winner > 0 && scoreDiff >= 2 && this.gameStats.mistakes >= 3) {
            this.unlockAchievement("Nine Lives", "Make a dramatic comeback victory!");
        }
        
        console.log('🏆 Achievements checked');
    }

    displayGameOverScreen() {
        const winner = this.getWinner();
        
        const winnerText = document.getElementById('winner-text');
        const score1 = document.getElementById('final-score1');
        const score2 = document.getElementById('final-score2');
        
        if (winnerText) {
            if (winner === 0) {
                winnerText.textContent = "It's a Tie! 🤝";
                winnerText.style.color = '#ffd700';
            } else {
                winnerText.textContent = `Player ${winner} Wins! 🎉`;
                if (graphics) {
                    graphics.animateGameOver(winnerText, winner === 1);
                }
            }
        }
        
        if (score1) score1.textContent = this.scores.player1;
        if (score2) score2.textContent = this.scores.player2;
        
        if (audioManager) {
            if (winner === 0) {
                audioManager.playSound('catPurr');
            } else {
                audioManager.playSound('gameWin');
            }
        }
        
        this.displayNewAchievements();
    }
// Game.js Part 6 - Achievements and Data Management (Complete)

    displayNewAchievements() {
        const container = document.getElementById('achievements-earned');
        if (!container) return;
        
        container.innerHTML = '';
        
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
                
                if (graphics) {
                    graphics.animateAchievementUnlock(achievementElement);
                }
            });
        }
    }

    displayAchievements() {
        const container = document.getElementById('achievements-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const allAchievements = Utils.getGameConfig().achievements;
        
        Object.entries(allAchievements).forEach(([name, description]) => {
            const achievement = this.achievements[name];
            const achievementElement = Utils.createElement('div', 
                achievement ? 'achievement earned' : 'achievement');
            
            achievementElement.innerHTML = `
                <h4>${achievement ? '🏆' : '🔒'} ${name}</h4>
                <p>${description}</p>
                ${achievement ? `<small>Unlocked: ${Utils.formatTimestamp(achievement.timestamp)}</small>` : ''}
            `;
            
            container.appendChild(achievementElement);
        });
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
            
            if (audioManager) {
                audioManager.playSound('achievementUnlock');
            }
            
            if (graphics) {
                graphics.createFloatingText(
                    window.innerWidth / 2,
                    100,
                    `Achievement Unlocked: ${name}!`,
                    '#ffd700',
                    { duration: 3000, fontSize: '20px' }
                );
            }
            
            Utils.showNotification(`🏆 ${name}`, 'success', 3000);
            Utils.vibrate([100, 50, 100, 50, 100]);
            
            console.log(`🏆 Achievement unlocked: ${name}`);
        }
    }

    triggerMinigame() {
        console.log('🐭 Triggering minigame');
        this.currentScreen = 'minigame';
        Utils.showScreen('minigame-screen');
        
        Utils.showNotification('Bonus Round: Catch the Mice!', 'success', 2000);
        
        minigame.start().then(() => {
            minigame.startUpdateLoop();
        });
    }

    saveGameToHistory() {
        const gameRecord = {
            timestamp: Date.now(),
            gridSize: this.gridSize,
            scores: { ...this.scores },
            winner: this.getWinner(),
            stats: { ...this.gameStats },
            duration: Date.now() - this.gameStats.startTime
        };
        
        this.gameHistory.unshift(gameRecord);
        
        if (this.gameHistory.length > 50) {
            this.gameHistory = this.gameHistory.slice(0, 50);
        }
        
        Utils.saveToLocalStorage('gameHistory', this.gameHistory);
    }

    loadGameHistory() {
        this.gameHistory = Utils.loadFromLocalStorage('gameHistory', []);
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
    getGameStats() {
        const totalGames = this.gameStats.gameWins.player1 + this.gameStats.gameWins.player2;
        const mathAccuracy = this.gameStats.mathProblemsTotal > 0 ? 
            (this.gameStats.mathProblemsCorrect / this.gameStats.mathProblemsTotal * 100).toFixed(1) : 0;
        
        return {
            totalGames: totalGames,
            player1Wins: this.gameStats.gameWins.player1,
            player2Wins: this.gameStats.gameWins.player2,
            mathAccuracy: mathAccuracy,
            achievementsUnlocked: Object.keys(this.achievements).length,
            totalAchievements: Object.keys(Utils.getGameConfig().achievements).length,
            averageGameTime: this.calculateAverageGameTime(),
            favoriteGridSize: this.getFavoriteGridSize()
        };
    }

    calculateAverageGameTime() {
        if (this.gameHistory.length === 0) return 0;
        
        const totalTime = this.gameHistory.reduce((sum, game) => sum + game.duration, 0);
        return Math.round(totalTime / this.gameHistory.length / 1000);
    }

    getFavoriteGridSize() {
        if (this.gameHistory.length === 0) return null;
        
        const gridCounts = {};
        this.gameHistory.forEach(game => {
            gridCounts[game.gridSize] = (gridCounts[game.gridSize] || 0) + 1;
        });
        
        return Object.entries(gridCounts).reduce((a, b) => 
            gridCounts[a[0]] > gridCounts[b[0]] ? a : b
        )[0];
    }

    resetAllData() {
        this.achievements = {};
        this.saveAchievements();
        
        this.gameHistory = [];
        Utils.saveToLocalStorage('gameHistory', this.gameHistory);
        
        this.resetGame();
        this.gameStats.gameWins = { player1: 0, player2: 0 };
        
        Utils.showNotification('All data reset!', 'info', 2000);
        console.log('🔄 All game data reset');
    }

    getStatus() {
        return {
            currentScreen: this.currentScreen,
            gridSize: this.gridSize,
            currentPlayer: this.currentPlayer,
            scores: { ...this.scores },
            matchedPairs: this.matchedPairs,
            totalPairs: this.totalPairs,
            flippedCards: this.flippedCards.length,
            catPosition: { ...this.catPosition },
            peekCooldown: this.peekCooldown,
            gameStats: { ...this.gameStats }
        };
    }

    cleanup() {
        if (this.peekCooldownTimer) {
            clearTimeout(this.peekCooldownTimer);
        }
        
        this.currentScreen = 'title';
        this.resetGame();
        
        console.log('🎮 Game cleaned up');
    }
}

// Global game instance
const game = new Game();
