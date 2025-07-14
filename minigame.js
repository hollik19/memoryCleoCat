// Minigame.js - Mouse-catching mini-game optimized for mobile

class MiniGame {
    constructor() {
        this.isActive = false;
        this.timeLeft = 30;
        this.score = 0;
        this.mice = [];
        this.catPosition = { x: 50, y: 50 };
        this.gameArea = null;
        this.timerInterval = null;
        this.spawnInterval = null;
        this.updateInterval = null;
        this.catElement = null;
        this.moveSpeed = 12;
        this.pounceRange = 25;
        this.lastUpdateTime = 0;
        this.frameRate = 60;
        this.frameInterval = 1000 / this.frameRate;
        
        // Mouse configuration
        this.mouseTypes = {
            brown: { 
                points: 1, 
                probability: 0.5, 
                symbol: '🐭',
                speed: 1.5,
                size: 1.0
            },
            gray: { 
                points: 2, 
                probability: 0.3, 
                symbol: '🐁',
                speed: 2.0,
                size: 0.9
            },
            white: { 
                points: 3, 
                probability: 0.15, 
                symbol: '🤍',
                speed: 2.5,
                size: 0.8
            },
            golden: { 
                points: 5, 
                probability: 0.05, 
                symbol: '✨',
                speed: 3.0,
                size: 1.2
            }
        };
        
        // Target counts for balanced gameplay
        this.targetCounts = {
            brown: 5,
            gray: 3,
            white: 1,
            golden: 1
        };
        
        this.spawnedCounts = {
            brown: 0,
            gray: 0,
            white: 0,
            golden: 0
        };
        
        this.gameStats = {
            totalMiceSpawned: 0,
            totalMiceCaught: 0,
            pouncesMade: 0,
            perfectPounces: 0,
            longestStreak: 0,
            currentStreak: 0
        };
        
        // Performance optimization
        this.maxMice = Utils.isMobile() ? 6 : 8;
        this.spawnRate = Utils.isMobile() ? 1500 : 1200;
    }

    start() {
        console.log('🐭 Starting mouse-catching minigame');
        this.reset();
        this.isActive = true;
        this.setupGameArea();
        this.startTimer();
        this.startSpawning();
        this.startUpdateLoop();
        
        // Play start sound and music
        if (audioManager) {
            audioManager.playSound('minigameStart');
            audioManager.startMusic('minigame');
        }
        
        // Show countdown and instructions
        return this.showCountdownAndInstructions();
    }

    reset() {
        this.timeLeft = 30;
        this.score = 0;
        this.mice = [];
        this.catPosition = { x: 50, y: 50 };
        this.spawnedCounts = { brown: 0, gray: 0, white: 0, golden: 0 };
        this.gameStats = {
            totalMiceSpawned: 0,
            totalMiceCaught: 0,
            pouncesMade: 0,
            perfectPounces: 0,
            longestStreak: 0,
            currentStreak: 0
        };
        
        // Clear any existing intervals
        this.clearIntervals();
    }

    clearIntervals() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    setupGameArea() {
        this.gameArea = document.getElementById('minigame-area');
        this.catElement = document.getElementById('cat-player');
        
        if (!this.gameArea || !this.catElement) {
            console.error('Minigame elements not found');
            return false;
        }
        
        // Clear any existing mice
        this.gameArea.querySelectorAll('.mouse').forEach(mouse => mouse.remove());
        
        // Set initial cat position
        this.updateCatPosition();
        
        // Update UI
        this.updateScore();
        this.updateTimer();
        
        return true;
    }

    showCountdownAndInstructions() {
        return graphics.animateMinigameCountdown(this.gameArea).then(() => {
            // Show brief instructions for mobile users
            if (Utils.isTouchDevice()) {
                graphics.createFloatingText(
                    window.innerWidth / 2,
                    100,
                    'Use buttons to move, POUNCE to catch!',
                    '#74b9ff',
                    { duration: 2000 }
                );
            }
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            // Warning at 10 seconds
            if (this.timeLeft === 10) {
                if (audioManager) {
                    audioManager.playSound('catMeow');
                }
                Utils.vibrate([100, 50, 100]);
            }
            
            // Final countdown
            if (this.timeLeft <= 3 && this.timeLeft > 0) {
                graphics.createFloatingText(
                    this.gameArea.offsetLeft + this.gameArea.offsetWidth / 2,
                    this.gameArea.offsetTop + this.gameArea.offsetHeight / 2,
                    this.timeLeft.toString(),
                    '#ff6b6b',
                    { fontSize: '48px', duration: 800 }
                );
            }
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    startSpawning() {
        this.spawnInterval = setInterval(() => {
            if (this.mice.length < this.maxMice && this.isActive) {
                this.spawnMouse();
            }
        }, this.spawnRate + Math.random() * 1000);
    }

    startUpdateLoop() {
        this.lastUpdateTime = Date.now();
        
        this.updateInterval = setInterval(() => {
            if (this.isActive) {
                this.updateMice();
            }
        }, this.frameInterval);
    }

    spawnMouse() {
        // Determine mouse type based on remaining targets and probability
        let availableTypes = [];
        
        Object.entries(this.targetCounts).forEach(([type, target]) => {
            if (this.spawnedCounts[type] < target) {
                const prob = this.mouseTypes[type].probability;
                // Add multiple entries based on probability
                for (let i = 0; i < Math.floor(prob * 100); i++) {
                    availableTypes.push(type);
                }
            }
        });

        if (availableTypes.length === 0) {
            // All targets met, spawn random mice
            availableTypes = Object.keys(this.mouseTypes);
        }

        const mouseType = Utils.getRandomElement(availableTypes);
        const mouse = this.createMouse(mouseType);
        
        if (mouse) {
            this.mice.push(mouse);
            this.spawnedCounts[mouseType]++;
            this.gameStats.totalMiceSpawned++;
        }
    }

    createMouse(type) {
        const mouseData = this.mouseTypes[type];
        const element = Utils.createElement('div', `mouse ${type}`);
        
        // Set mouse appearance
        element.textContent = mouseData.symbol;
        element.style.fontSize = `${1.5 * mouseData.size}em`;
        element.style.zIndex = '5';
        element.style.position = 'absolute';
        element.style.cursor = 'pointer';
        element.style.userSelect = 'none';
        element.style.transition = 'all 0.2s ease';
        
        // Random spawn position (avoiding cat area)
        let x, y;
        let attempts = 0;
        do {
            x = Utils.getRandomInt(10, 85);
            y = Utils.getRandomInt(10, 85);
            attempts++;
        } while (Utils.distance(x, y, this.catPosition.x, this.catPosition.y) < 25 && attempts < 10);
        
        const mouse = {
            element: element,
            type: type,
            points: mouseData.points,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * mouseData.speed,
            vy: (Math.random() - 0.5) * mouseData.speed,
            lifetime: 8000 + Math.random() * 4000, // 8-12 seconds
            created: Date.now(),
            lastDirectionChange: Date.now(),
            size: mouseData.size,
            isCaught: false
        };
        
        // Add mouse to game area
        this.gameArea.appendChild(element);
        this.updateMousePosition(mouse);
        
        // Add click handler for direct clicking
        element.addEventListener('click', (e) => {
            e.preventDefault();
            if (!mouse.isCaught && this.isActive) {
                this.catchMouse(mouse, this.mice.indexOf(mouse));
            }
        });
        
        // Add hover effect
        element.addEventListener('mouseenter', () => {
            if (!mouse.isCaught) {
                element.style.transform = `scale(${1.1 * mouse.size})`;
            }
        });
        
        element.addEventListener('mouseleave', () => {
            if (!mouse.isCaught) {
                element.style.transform = `scale(${mouse.size})`;
            }
        });
        
        return mouse;
    }

    updateMousePosition(mouse) {
        if (!mouse.element || mouse.isCaught) return;
        
        mouse.element.style.left = mouse.x + '%';
        mouse.element.style.top = mouse.y + '%';
        mouse.element.style.transform = `scale(${mouse.size})`;
    }

    updateCatPosition() {
        if (this.catElement) {
            this.catElement.style.left = this.catPosition.x + '%';
            this.catElement.style.top = this.catPosition.y + '%';
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('minigame-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }

    updateTimer() {
        const timerElement = document.getElementById('minigame-timer');
        if (timerElement) {
            timerElement.textContent = this.timeLeft;
            
            // Change color when time is running low
            if (this.timeLeft <= 10) {
                timerElement.style.color = '#ff6b6b';
                if (this.timeLeft <= 5) {
                    timerElement.style.animation = 'pulse 0.5s infinite';
                }
            } else {
                timerElement.style.color = '';
                timerElement.style.animation = '';
            }
        }
    }

    moveCat(direction) {
        if (!this.isActive) return;
        
        const oldPos = { ...this.catPosition };
        
        switch (direction) {
            case 'up':
                this.catPosition.y = Math.max(8, this.catPosition.y - this.moveSpeed);
                break;
            case 'down':
                this.catPosition.y = Math.min(85, this.catPosition.y + this.moveSpeed);
                break;
            case 'left':
                this.catPosition.x = Math.max(8, this.catPosition.x - this.moveSpeed);
                break;
            case 'right':
                this.catPosition.x = Math.min(85, this.catPosition.x + this.moveSpeed);
                break;
        }
        
        // Only update if position changed
        if (oldPos.x !== this.catPosition.x || oldPos.y !== this.catPosition.y) {
            this.updateCatPosition();
            
            // Create trail effect
            if (graphics && graphics.performanceMode !== 'low') {
                graphics.createTrailEffect(this.catElement, '#ff6b6b');
            }
            
            // Animate cat movement
            if (graphics) {
                graphics.animateCatMovement(this.catElement, direction);
            }
            
            // Check for automatic catches (cat touching mice)
            this.checkAutoCatch();
        }
    }

    checkAutoCatch() {
        this.mice.forEach((mouse, index) => {
            if (mouse.isCaught) return;
            
            const distance = Utils.distance(
                this.catPosition.x, this.catPosition.y,
                mouse.x, mouse.y
            );
            
            // Auto-catch if very close
            if (distance <= 12) {
                this.catchMouse(mouse, index);
            }
        });
    }

    pounce() {
        if (!this.isActive) return;
        
        this.gameStats.pouncesMade++;
        
        // Animate cat pounce
        if (graphics) {
            graphics.animateCatPounce(this.catElement);
        }
        
        if (audioManager) {
            audioManager.playSound('catMeow');
        }
        
        // Check for mice in pounce range
        const caughtMice = [];
        this.mice.forEach((mouse, index) => {
            if (mouse.isCaught) return;
            
            const distance = Utils.distance(
                this.catPosition.x, this.catPosition.y,
                mouse.x, mouse.y
            );
            
            if (distance <= this.pounceRange) {
                caughtMice.push({ mouse, index });
            }
        });
        
        // Process caught mice
        if (caughtMice.length > 0) {
            // Perfect pounce bonus for catching multiple mice
            if (caughtMice.length >= 3) {
                this.gameStats.perfectPounces++;
                graphics.createFloatingText(
                    this.gameArea.offsetLeft + this.gameArea.offsetWidth / 2,
                    this.gameArea.offsetTop + 50,
                    'PERFECT POUNCE!',
                    '#ffd700',
                    { fontSize: '28px', duration: 2000 }
                );
                
                if (audioManager) {
                    audioManager.playSound('achievementUnlock');
                }
            }
            
            // Catch mice in reverse order to maintain array indices
            caughtMice.reverse().forEach(({ mouse, index }) => {
                this.catchMouse(mouse, index);
            });
            
            // Haptic feedback
            Utils.vibrate([100, 50, 100]);
        } else {
            // Miss feedback
            Utils.vibrate([50]);
            this.gameStats.currentStreak = 0;
        }
    }

    catchMouse(mouse, index) {
        if (mouse.isCaught) return;
        
        mouse.isCaught = true;
        this.gameStats.totalMiceCaught++;
        this.gameStats.currentStreak++;
        
        if (this.gameStats.currentStreak > this.gameStats.longestStreak) {
            this.gameStats.longestStreak = this.gameStats.currentStreak;
        }
        
        // Add score with combo multiplier
        const basePoints = mouse.points;
        const comboMultiplier = Math.min(this.gameStats.currentStreak, 5);
        const totalPoints = basePoints + (comboMultiplier > 1 ? comboMultiplier - 1 : 0);
        
        this.score += totalPoints;
        this.updateScore();
        
        // Play catch sound
        if (audioManager) {
            audioManager.playSound('mouseCatch');
        }
        
        // Create visual effects
        const rect = mouse.element.getBoundingClientRect();
        const gameRect = this.gameArea.getBoundingClientRect();
        
        if (graphics) {
            graphics.createParticleBurst(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                6,
                { 
                    color: mouse.type === 'golden' ? '#ffd700' : '#00b894',
                    speed: 4,
                    life: 60
                }
            );
        }
        
        // Show score text
        let scoreText = `+${totalPoints}`;
        if (comboMultiplier > 1) {
            scoreText += ` (x${comboMultiplier})`;
        }
        
        if (graphics) {
            graphics.createFloatingText(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                scoreText,
                mouse.type === 'golden' ? '#ffd700' : '#00b894',
                { fontSize: '20px' }
            );
        }
        
        // Special effects for rare mice
        if (mouse.type === 'golden') {
            if (graphics) {
                graphics.createParticleBurst(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    12,
                    { color: '#ffd700', speed: 6, life: 100, shape: 'star' }
                );
            }
            
            if (audioManager) {
                audioManager.playSound('achievementUnlock');
            }
            
            Utils.vibrate([200, 100, 200]);
        }
        
        // Animate mouse removal
        mouse.element.style.transition = 'all 0.3s ease-out';
        mouse.element.style.transform = `scale(0) rotate(360deg)`;
        mouse.element.style.opacity = '0';
        
        setTimeout(() => {
            if (mouse.element && mouse.element.parentNode) {
                mouse.element.remove();
            }
        }, 300);
        
        // Remove from mice array
        this.mice.splice(index, 1);
    }

    updateMice() {
        const now = Date.now();
        
        this.mice = this.mice.filter((mouse, index) => {
            if (mouse.isCaught) return false;
            
            // Update mouse position
            mouse.x += mouse.vx;
            mouse.y += mouse.vy;
            
            // Bounce off walls
            if (mouse.x <= 8 || mouse.x >= 85) {
                mouse.vx = -mouse.vx;
                mouse.x = Utils.clamp(mouse.x, 8, 85);
            }
            if (mouse.y <= 8 || mouse.y >= 85) {
                mouse.vy = -mouse.vy;
                mouse.y = Utils.clamp(mouse.y, 8, 85);
            }
            
            // Occasional direction change for more natural movement
            if (now - mouse.lastDirectionChange > 2000 + Math.random() * 3000) {
                mouse.vx += (Math.random() - 0.5) * 0.5;
                mouse.vy += (Math.random() - 0.5) * 0.5;
                
                // Clamp velocity
                const maxSpeed = this.mouseTypes[mouse.type].speed;
                mouse.vx = Utils.clamp(mouse.vx, -maxSpeed, maxSpeed);
                mouse.vy = Utils.clamp(mouse.vy, -maxSpeed, maxSpeed);
                
                mouse.lastDirectionChange = now;
            }
            
            // Run away from cat if too close
            const distanceToCat = Utils.distance(mouse.x, mouse.y, this.catPosition.x, this.catPosition.y);
            if (distanceToCat < 30) {
                const fleeSpeed = this.mouseTypes[mouse.type].speed * 1.5;
                const angle = Math.atan2(mouse.y - this.catPosition.y, mouse.x - this.catPosition.x);
                mouse.vx = Math.cos(angle) * fleeSpeed;
                mouse.vy = Math.sin(angle) * fleeSpeed;
                
                // Visual fear effect
                if (mouse.element && graphics.performanceMode !== 'low') {
                    mouse.element.style.filter = 'brightness(1.2)';
                    setTimeout(() => {
                        if (mouse.element) {
                            mouse.element.style.filter = '';
                        }
                    }, 200);
                }
            }
            
            this.updateMousePosition(mouse);
            
            // Remove if lifetime exceeded
            if (now - mouse.created > mouse.lifetime) {
                if (mouse.element && mouse.element.parentNode) {
                    // Fade out animation
                    mouse.element.style.transition = 'opacity 0.5s ease-out';
                    mouse.element.style.opacity = '0';
                    setTimeout(() => {
                        if (mouse.element && mouse.element.parentNode) {
                            mouse.element.remove();
                        }
                    }, 500);
                }
                return false;
            }
            
            return true;
        });
    }

    endGame() {
        console.log('🐭 Minigame ended');
        this.isActive = false;
        
        // Clear intervals
        this.clearIntervals();
        
        // Clean up mice
        this.mice.forEach(mouse => {
            if (mouse.element && mouse.element.parentNode) {
                mouse.element.remove();
            }
        });
        this.mice = [];
        
        // Stop music
        if (audioManager) {
            audioManager.stopMusic();
        }
        
        // Play end sound
        if (audioManager) {
            if (this.score >= 15) {
                audioManager.playSound('gameWin');
            } else {
                audioManager.playSound('catDisappoint');
            }
        }
        
        // Show results
        this.showResults();
    }

    showResults() {
        const results = this.calculateResults();
        
        // Create results overlay
        const overlay = Utils.createElement('div', 'minigame-results');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 1.1em;
            text-align: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
        `;
        
        overlay.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 15px; max-width: 90%; backdrop-filter: blur(10px);">
                <h3 style="color: #ffd700; margin-bottom: 15px; font-size: 1.4em;">🏆 Mini-Game Results!</h3>
                <div style="margin-bottom: 10px;">Final Score: <strong style="color: #00b894;">${this.score}</strong></div>
                <div style="margin-bottom: 10px;">Mice Caught: <strong>${results.totalCaught}/${this.gameStats.totalMiceSpawned}</strong></div>
                <div style="margin-bottom: 10px;">Accuracy: <strong>${results.accuracy}%</strong></div>
                <div style="margin-bottom: 15px;">Longest Streak: <strong>${this.gameStats.longestStreak}</strong></div>
                <div style="margin-bottom: 15px; font-size: 0.9em;">
                    🐭 Brown: ${results.caught.brown} | 🐁 Gray: ${results.caught.gray}<br>
                    🤍 White: ${results.caught.white} | ✨ Golden: ${results.caught.golden}
                </div>
                <div style="margin-bottom: 20px; color: ${results.rating.color}; font-size: 1.2em;">
                    <strong>${results.rating.text}</strong>
                </div>
                <button class="button" onclick="minigame.returnToGame()" style="font-size: 1em;">
                    🎮 Continue
                </button>
            </div>
        `;
        
        this.gameArea.appendChild(overlay);
        
        // Check for achievements
        this.checkAchievements(results);
        
        // Animate results
        if (graphics) {
            graphics.fadeIn(overlay, 500);
        }
    }

    calculateResults() {
        const totalCaught = this.gameStats.totalMiceCaught;
        const accuracy = this.gameStats.totalMiceSpawned > 0 ? 
            Math.round((totalCaught / this.gameStats.totalMiceSpawned) * 100) : 0;
        
        const caught = {
            brown: Math.max(0, this.spawnedCounts.brown - this.mice.filter(m => m.type === 'brown').length),
            gray: Math.max(0, this.spawnedCounts.gray - this.mice.filter(m => m.type === 'gray').length),
            white: Math.max(0, this.spawnedCounts.white - this.mice.filter(m => m.type === 'white').length),
            golden: Math.max(0, this.spawnedCounts.golden - this.mice.filter(m => m.type === 'golden').length)
        };
        
        let rating;
        if (this.score >= 20) {
            rating = { text: "Legendary Hunter! 👑", color: "#ffd700" };
        } else if (this.score >= 15) {
            rating = { text: "Master Mouser! 🌟", color: "#ffd700" };
        } else if (this.score >= 10) {
            rating = { text: "Great Hunter! 🎯", color: "#00b894" };
        } else if (this.score >= 5) {
            rating = { text: "Good Effort! 👍", color: "#74b9ff" };
        } else {
            rating = { text: "Keep Practicing! 💪", color: "#ff7675" };
        }
        
        return {
            totalCaught,
            caught,
            rating,
            accuracy,
            perfectScore: totalCaught === this.gameStats.totalMiceSpawned
        };
    }

    checkAchievements(results) {
        const achievements = [];
        
        // Golden Hunter - Catch the rare golden mouse
        if (results.caught.golden > 0) {
            achievements.push({
                name: "Golden Hunter",
                description: "Caught the rare golden mouse!",
                icon: "✨"
            });
        }
        
        // Mouse Master - Catch all mice in the minigame
        if (results.perfectScore && this.gameStats.totalMiceSpawned >= 8) {
            achievements.push({
                name: "Mouse Master",
                description: "Caught all mice in the minigame!",
                icon: "🏆"
            });
        }
        
        // Speed Hunter - Achieve high score
        if (this.score >= 20) {
            achievements.push({
                name: "Speed Hunter",
                description: "Achieved legendary score in mouse hunt!",
                icon: "⚡"
            });
        }
        
        // Perfect Pouncer - Catch 3 mice with one pounce
        if (this.gameStats.perfectPounces > 0) {
            achievements.push({
                name: "Perfect Pouncer",
                description: "Caught 3 mice with one pounce!",
                icon: "🎯"
            });
        }
        
        // Streak Master - Achieve long catching streak
        if (this.gameStats.longestStreak >= 5) {
            achievements.push({
                name: "Streak Master",
                description: "Achieved a 5+ mouse catching streak!",
                icon: "🔥"
            });
        }
        
        // Save achievements to main game
        achievements.forEach(achievement => {
            if (game && game.unlockAchievement) {
                game.unlockAchievement(achievement.name, achievement.description);
            }
        });
        
        return achievements;
    }

    returnToGame() {
        // Remove results overlay
        const overlay = this.gameArea.querySelector('.minigame-results');
        if (overlay) {
            if (graphics) {
                graphics.fadeOut(overlay, 300).then(() => {
                    overlay.remove();
                });
            } else {
                overlay.remove();
            }
        }
        
        // Return to main game
        if (game) {
            game.showGame();
        }
        
        // Start background music again
        if (audioManager) {
            audioManager.startMusic('game');
        }
        
        console.log('🐭 Returned to main game');
    }

    // Public methods for external control
    pause() {
        if (this.isActive) {
            this.isActive = false;
            this.clearIntervals();
        }
    }

    resume() {
        if (!this.isActive && this.timeLeft > 0) {
            this.isActive = true;
            this.startTimer();
            this.startSpawning();
            this.startUpdateLoop();
        }
    }

    getStatus() {
        return {
            isActive: this.isActive,
            timeLeft: this.timeLeft,
            score: this.score,
            miceCount: this.mice.length,
            stats: { ...this.gameStats }
        };
    }

    cleanup() {
        this.isActive = false;
        this.clearIntervals();
        
        // Clean up mice
        this.mice.forEach(mouse => {
            if (mouse.element && mouse.element.parentNode) {
                mouse.element.remove();
            }
        });
        this.mice = [];
        
        console.log('🐭 Minigame cleaned up');
    }
}

// Global minigame instance
const minigame = new MiniGame();
