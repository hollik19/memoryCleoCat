// Main.js - Application initialization and main loop

class Main {
    constructor() {
        this.initialized = false;
        this.gameLoop = null;
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastAutoSave = 0;
    }

    init() {
        if (this.initialized) return;

        console.log('🐱 Cat Memory Game - Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }

        try {
            this.setupGlobalErrorHandling();
            this.setupEventListeners();
            this.startGameLoop();
            this.addResetButton();
            this.initialized = true;
            
            console.log('🎮 Game initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showErrorMessage('Failed to load the game. Please refresh the page.');
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }

    setupEventListeners() {
        // Handle window resize for responsive design
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle orientation change for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Prevent zoom on double-tap for mobile
        if (Utils.isTouchDevice()) {
            document.addEventListener('touchstart', (event) => {
                if (event.touches.length > 1) {
                    event.preventDefault();
                }
            }, { passive: false });

            let lastTouchEnd = 0;
            document.addEventListener('touchend', (event) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
        }

        console.log('📱 Event listeners setup complete');
    }

    handleOrientationChange() {
        console.log('📱 Orientation changed');
        
        // Wait for orientation to settle
        setTimeout(() => {
            this.handleResize();
            
            // Clear any stuck inputs
            if (inputManager && inputManager.clearAllInputs) {
                inputManager.clearAllInputs();
            }
            
            // Refresh UI elements
            this.refreshUI();
        }, 300);
    }

    refreshUI() {
        // Update game UI after orientation change
        if (game && game.gameBoard) {
            if (game.updateCatPosition) game.updateCatPosition();
            if (game.updateScoreDisplay) game.updateScoreDisplay();
            if (game.updateCurrentPlayerDisplay) game.updateCurrentPlayerDisplay();
        }
        
        if (minigame && minigame.isActive) {
            if (minigame.updateScore) minigame.updateScore();
            if (minigame.updateTimer) minigame.updateTimer();
        }
    }

    addResetButton() {
        // Add reset achievements button to achievements screen
        const achievementsScreen = document.getElementById('achievements-screen');
        if (achievementsScreen) {
            const existingButton = achievementsScreen.querySelector('.reset-achievements-btn');
            if (!existingButton) {
                const resetButton = Utils.createElement('button', 'button reset-achievements-btn');
                resetButton.textContent = '🗑️ Reset All Achievements';
                resetButton.style.backgroundColor = '#e17055';
                resetButton.style.marginTop = '20px';
                
                resetButton.onclick = () => {
                    this.showResetConfirmation();
                };
                
                achievementsScreen.appendChild(resetButton);
            }
        }
    }

    showResetConfirmation() {
        const overlay = Utils.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-size: 1.2em;
            text-align: center;
        `;

        overlay.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); max-width: 90%;">
                <h3 style="color: #e17055; margin-bottom: 15px;">⚠️ Reset Achievements</h3>
                <p style="margin-bottom: 20px;">Are you sure you want to delete ALL achievements?<br>This action cannot be undone!</p>
                <button class="button" onclick="main.resetAchievements(); this.parentElement.parentElement.remove();" style="margin-right: 10px; background: #e17055;">
                    🗑️ Yes, Reset All
                </button>
                <button class="button secondary" onclick="this.parentElement.parentElement.remove()">
                    ❌ Cancel
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    resetAchievements() {
        if (game && game.resetAchievements) {
            game.resetAchievements();
            
            // Show success message
            graphics.createFloatingText(
                window.innerWidth / 2,
                100,
                'All achievements reset!',
                '#e17055'
            );
            
            audioManager.playSound('buttonClick');
            
            // Refresh achievements display
            if (game.displayAchievements) {
                game.displayAchievements();
            }
        }
    }

    startGameLoop() {
        if (this.gameLoop) return;

        this.lastFrameTime = performance.now();
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            
            if (deltaTime >= this.frameInterval) {
                this.update(deltaTime);
                this.render();
                this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
            }
            
            this.gameLoop = requestAnimationFrame(loop);
        };

        this.gameLoop = requestAnimationFrame(loop);
        console.log('🔄 Game loop started');
    }

    update(deltaTime) {
        // Auto-save functionality
        this.autoSave();
        
        // Update other time-based systems if needed
        this.updatePerformanceStats(deltaTime);
    }

    autoSave() {
        // Auto-save every 30 seconds
        if (!this.lastAutoSave || Date.now() - this.lastAutoSave > 30000) {
            if (game && game.saveAchievements) {
                game.saveAchievements();
                console.log('💾 Auto-saved achievements');
            }
            this.lastAutoSave = Date.now();
        }
    }

    render() {
        // Most rendering is handled by CSS animations and graphics manager
    }

    updatePerformanceStats(deltaTime) {
        // Simple FPS monitoring for development
        if (window.DEBUG_MODE) {
            const fps = Math.round(1000 / deltaTime);
            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.textContent = `FPS: ${fps}`;
            }
        }
    }

    handleResize() {
        // Adjust game layout for new window size
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            // Ensure game container fits properly
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

        // Restart graphics if needed
        if (graphics) {
            graphics.cleanup();
        }

        console.log('📐 Window resized, layout adjusted');
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }

    pause() {
        // Pause audio
        if (audioManager) {
            audioManager.stopMusic();
        }

        // Pause minigame if active
        if (minigame && minigame.isActive) {
            minigame.isActive = false;
        }

        console.log('⏸️ Game paused');
    }

    resume() {
        // Resume audio based on current screen
        if (audioManager && game) {
            switch (game.currentScreen) {
                case 'title':
                    audioManager.startMusic('title');
                    break;
                case 'game':
                    audioManager.startMusic('game');
                    break;
                case 'minigame':
                    audioManager.startMusic('minigame');
                    break;
            }
        }

        // Resume minigame if it was active
        if (minigame && game && game.currentScreen === 'minigame') {
            minigame.isActive = true;
        }

        console.log('▶️ Game resumed');
    }

    handleError(error) {
        console.error('Handling error:', error);
        
        // Try to gracefully handle the error
        if (audioManager) {
            audioManager.stopMusic();
        }

        // Show user-friendly error message
        this.showErrorMessage('An error occurred. The game will try to recover.');

        // Try to return to title screen
        if (game) {
            setTimeout(() => {
                try {
                    game.showTitle();
                } catch (e) {
                    console.error('Failed to return to title screen:', e);
                }
            }, 2000);
        }
    }

    showErrorMessage(message) {
        // Create error overlay
        const overlay = Utils.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-size: 1.2em;
            text-align: center;
        `;

        overlay.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px);">
                <h3 style="color: #ff6b6b; margin-bottom: 15px;">⚠️ Oops!</h3>
                <p>${message}</p>
                <button class="button" onclick="location.reload()" style="margin-top: 20px;">
                    Refresh Page
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 5000);
    }

    cleanup() {
        console.log('🧹 Cleaning up...');

        // Stop game loop
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        // Final auto-save
        if (game && game.saveAchievements) {
            game.saveAchievements();
        }

        // Cleanup components
        if (graphics) {
            graphics.cleanup();
        }

        if (audioManager) {
            audioManager.stopMusic();
        }

        if (inputManager) {
            inputManager.cleanup();
        }

        this.lastAutoSave = 0;
    }

    // Public methods for external access
    getGameState() {
        return {
            currentScreen: game ? game.currentScreen : 'unknown',
            scores: game ? game.scores : null,
            achievements: game ? Object.keys(game.achievements).length : 0,
            isMinigameActive: minigame ? minigame.isActive : false
        };
    }

    resetGame() {
        if (game) {
            game.showTitle();
        }
    }
}

// Initialize the application
const main = new Main();

// Start the game when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => main.init());
} else {
    main.init();

        const updateVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        updateVH();
        window.addEventListener('resize', updateVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateVH, 300);
        });

}

// Expose main instance globally for debugging
window.main = main;

// Add some CSS custom properties for responsive design
document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

console.log('🐱 Cat Memory Game - Ready to start!');
