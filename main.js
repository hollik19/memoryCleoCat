// Main.js Part 1 - Application Initialization and Setup

class Main {
    constructor() {
        this.initialized = false;
        this.gameLoop = null;
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.performanceMonitor = {
            frameCount: 0,
            lastCheck: 0,
            currentFPS: 60
        };
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
            this.initializeComponents();
            this.setupEventListeners();
            this.optimizeForDevice();
            this.startGameLoop();
            this.initialized = true;
            
            console.log('🎮 Game initialized successfully!');
            Utils.showNotification('Game loaded! Welcome to Cat Memory Game!', 'success', 2000);
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

        // Mobile-specific error handling
        if (Utils.isMobile()) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 100);
            });
        }
    }

    initializeComponents() {
        // Verify all global instances exist
        const components = [
            { name: 'audioManager', instance: audioManager },
            { name: 'graphics', instance: graphics },
            { name: 'inputManager', instance: inputManager },
            { name: 'minigame', instance: minigame },
            { name: 'game', instance: game }
        ];

        components.forEach(({ name, instance }) => {
            if (!instance) {
                throw new Error(`${name} not initialized`);
            }
        });

        // Additional mobile optimizations
        if (Utils.isMobile()) {
            this.setupMobileOptimizations();
        }

        console.log('✅ All components initialized');
    }

    setupMobileOptimizations() {
        // Prevent zoom and improve touch responsiveness
        Utils.preventZoom();
        
        // Request wake lock for better gaming experience
        Utils.requestWakeLock();
        
        // Optimize graphics for mobile
        if (graphics) {
            const screenSize = Utils.getScreenSize();
            if (screenSize.isSmall) {
                graphics.setPerformanceMode('low');
            }
        }
        
        // Reduce audio complexity on low-end devices
        if (audioManager && navigator.hardwareConcurrency < 4) {
            audioManager.setMusicVolume(0.2);
            audioManager.setSfxVolume(0.4);
        }
        
        console.log('📱 Mobile optimizations applied');
    }

    setupEventListeners() {
        // Handle window resize for responsive design
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Handle connection changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }

        // Prevent context menu on long press for mobile
        if (Utils.isTouchDevice()) {
            document.addEventListener('contextmenu', (e) => {
                if (e.target.closest('.game-container')) {
                    e.preventDefault();
                }
            });
        }

        console.log('📱 Event listeners setup complete');
    }

    optimizeForDevice() {
        // Detect device capabilities and optimize accordingly
        const deviceInfo = {
            isMobile: Utils.isMobile(),
            isTouch: Utils.isTouchDevice(),
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4,
            screen: Utils.getScreenSize()
        };

        // Adjust performance based on device
        if (deviceInfo.memory < 4 || deviceInfo.cores < 4) {
            this.targetFPS = 30;
            this.frameInterval = 1000 / this.targetFPS;
            
            if (graphics) {
                graphics.setPerformanceMode('low');
            }
        }

        // Optimize for small screens
        if (deviceInfo.screen.isSmall) {
            document.body.classList.add('small-screen');
        }

        console.log('⚙️ Device optimization complete:', deviceInfo);
    }
}
// Main.js Part 2 - Game Loop and Performance Management

    startGameLoop() {
        if (this.gameLoop) return;

        this.lastFrameTime = performance.now();
        this.performanceMonitor.lastCheck = this.lastFrameTime;
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            
            if (deltaTime >= this.frameInterval) {
                this.update(deltaTime);
                this.render();
                this.updatePerformanceMonitor(currentTime);
                this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
            }
            
            this.gameLoop = requestAnimationFrame(loop);
        };

        this.gameLoop = requestAnimationFrame(loop);
        console.log(`🔄 Game loop started at ${this.targetFPS}fps`);
    }

    update(deltaTime) {
        // Update game systems
        if (game && game.currentScreen === 'game') {
            // Game is running, all updates handled by individual systems
        }

        if (minigame && minigame.isActive) {
            // Minigame updates are handled in its own loop
        }

        // Update audio system
        if (audioManager && audioManager.isInitialized) {
            // Audio system maintenance if needed
        }

        // Auto-save periodically
        this.autoSave();
    }

    render() {
        // Most rendering is handled by CSS animations and graphics manager
        // This is mainly for any custom rendering if needed in the future
        
        // Update UI elements that need frame-by-frame updates
        this.updateUI();
    }

    updatePerformanceMonitor(currentTime) {
        this.performanceMonitor.frameCount++;
        
        if (currentTime - this.performanceMonitor.lastCheck >= 1000) {
            this.performanceMonitor.currentFPS = this.performanceMonitor.frameCount;
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastCheck = currentTime;
            
            // Adjust performance if needed
            this.adjustPerformance();
            
            // Debug FPS display
            if (window.DEBUG_MODE) {
                this.updateFPSDisplay();
            }
        }
    }

    adjustPerformance() {
        const fps = this.performanceMonitor.currentFPS;
        
        // If FPS drops below 20, switch to low performance mode
        if (fps < 20 && graphics && graphics.performanceMode !== 'low') {
            graphics.setPerformanceMode('low');
            console.warn('⚠️ Low FPS detected, switching to low performance mode');
        }
        
        // If FPS is consistently good and we're in low mode, try upgrading
        if (fps > 50 && graphics && graphics.performanceMode === 'low') {
            graphics.setPerformanceMode('auto');
            console.log('📈 Good FPS detected, upgrading performance mode');
        }
    }

    updateFPSDisplay() {
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${this.performanceMonitor.currentFPS}`;
            
            // Color code FPS
            if (this.performanceMonitor.currentFPS >= 50) {
                fpsDisplay.style.color = '#00b894';
            } else if (this.performanceMonitor.currentFPS >= 30) {
                fpsDisplay.style.color = '#fdcb6e';
            } else {
                fpsDisplay.style.color = '#e17055';
            }
        }
    }

    updateUI() {
        // Update any UI elements that need real-time updates
        
        // Update connection status if available
        if ('connection' in navigator) {
            this.updateConnectionStatus();
        }
        
        // Update battery status on mobile
        if (Utils.isMobile() && 'getBattery' in navigator) {
            this.updateBatteryStatus();
        }
    }

    updateConnectionStatus() {
        const connection = navigator.connection;
        if (connection && connection.effectiveType) {
            // Adjust features based on connection speed
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Disable some visual effects on slow connections
                if (graphics) {
                    graphics.setPerformanceMode('low');
                }
            }
        }
    }

    updateBatteryStatus() {
        navigator.getBattery().then((battery) => {
            // Reduce performance when battery is low
            if (battery.level < 0.2 && !battery.charging) {
                if (graphics && graphics.performanceMode !== 'low') {
                    graphics.setPerformanceMode('low');
                    Utils.showNotification('Battery saver mode enabled', 'info', 2000);
                }
            }
        }).catch(() => {
            // Battery API not supported
        });
    }

    autoSave() {
        // Auto-save game data every 30 seconds
        if (!this.lastAutoSave || Date.now() - this.lastAutoSave > 30000) {
            if (game) {
                game.saveAchievements();
                game.saveGameToHistory();
            }
            this.lastAutoSave = Date.now();
        }
    }
}
// Main.js Part 3 - Event Handling and Responsive Design

    handleResize() {
        // Adjust game layout for new window size
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            // Update CSS custom property for mobile viewport
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

        // Update screen size classification
        const screenSize = Utils.getScreenSize();
        document.body.className = document.body.className.replace(/screen-\w+/g, '');
        
        if (screenSize.isSmall) {
            document.body.classList.add('screen-small');
        } else if (screenSize.isMedium) {
            document.body.classList.add('screen-medium');
        } else {
            document.body.classList.add('screen-large');
        }

        // Restart graphics if needed
        if (graphics) {
            graphics.cleanup();
        }

        // Reposition any active UI elements
        this.repositionUI();

        console.log('📐 Window resized, layout adjusted');
    }

    repositionUI() {
        // Reposition floating elements like notifications
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            // Update notification positioning for new screen size
            const screenSize = Utils.getScreenSize();
            if (screenSize.isSmall) {
                notification.style.top = '10px';
                notification.style.right = '10px';
                notification.style.left = '10px';
                notification.style.maxWidth = 'calc(100% - 20px)';
            } else {
                notification.style.top = '20px';
                notification.style.right = '20px';
                notification.style.left = 'auto';
                notification.style.maxWidth = '300px';
            }
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }

    handleOrientationChange() {
        console.log('📱 Orientation changed');
        
        // Delay handling to let the browser finish the orientation change
        setTimeout(() => {
            this.handleResize();
            
            // Clear any ongoing gestures
            if (inputManager) {
                inputManager.clearAllInputs();
            }
            
            // Trigger a full UI refresh
            this.refreshUI();
        }, 300);
    }

    handleConnectionChange() {
        const connection = navigator.connection;
        if (connection) {
            console.log(`📶 Connection changed: ${connection.effectiveType}`);
            
            // Adjust performance based on connection
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                Utils.showNotification('Slow connection detected - optimizing performance', 'info', 3000);
                if (graphics) {
                    graphics.setPerformanceMode('low');
                }
            }
        }
    }

    refreshUI() {
        // Force a complete UI refresh
        if (game && game.gameBoard) {
            game.updateCatPosition();
            game.updateScoreDisplay();
            game.updateCurrentPlayerDisplay();
            game.updatePeekButton();
        }
        
        // Refresh minigame UI if active
        if (minigame && minigame.isActive) {
            minigame.updateScore();
            minigame.updateTimer();
        }
    }

    pause() {
        // Pause audio
        if (audioManager) {
            audioManager.stopMusic();
        }

        // Pause minigame if active
        if (minigame && minigame.isActive) {
            minigame.pause();
        }

        // Pause game loop
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        // Show pause indicator
        this.showPauseIndicator();

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
            minigame.resume();
        }

        // Resume game loop
        if (!this.gameLoop) {
            this.startGameLoop();
        }

        // Hide pause indicator
        this.hidePauseIndicator();

        console.log('▶️ Game resumed');
    }

    showPauseIndicator() {
        let pauseIndicator = document.getElementById('pause-indicator');
        if (!pauseIndicator) {
            pauseIndicator = Utils.createElement('div');
            pauseIndicator.id = 'pause-indicator';
            pauseIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10000;
                font-size: 1.2em;
                text-align: center;
            `;
            pauseIndicator.innerHTML = '⏸️<br>Game Paused<br><small>Click to resume</small>';
            
            pauseIndicator.addEventListener('click', () => {
                this.resume();
            });
            
            document.body.appendChild(pauseIndicator);
        }
        
        pauseIndicator.style.display = 'block';
    }

    hidePauseIndicator() {
        const pauseIndicator = document.getElementById('pause-indicator');
        if (pauseIndicator) {
            pauseIndicator.style.display = 'none';
        }
    }
}
// Main.js Part 4 - Error Handling and Debug Tools

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
                    // Last resort: reload the page
                    location.reload();
                }
            }, 2000);
        }

        // Send error to analytics if available
        this.reportError(error);
    }

    reportError(error) {
        // Simple error reporting (could be extended with analytics service)
        const errorReport = {
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            gameState: game ? game.getStatus() : null
        };
        
        // Store error locally for debugging
        try {
            const errors = Utils.loadFromLocalStorage('errorReports', []);
            errors.push(errorReport);
            
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            
            Utils.saveToLocalStorage('errorReports', errors);
        } catch (e) {
            console.warn('Could not save error report:', e);
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
            <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); max-width: 90%;">
                <h3 style="color: #ff6b6b; margin-bottom: 15px;">⚠️ Oops!</h3>
                <p style="margin-bottom: 20px;">${message}</p>
                <button class="button" onclick="location.reload()" style="margin-right: 10px;">
                    🔄 Refresh Page
                </button>
                <button class="button secondary" onclick="this.parentElement.parentElement.remove()">
                    ❌ Dismiss
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 10000);
    }

    // Debug and Development Tools
    enableDebugMode() {
        window.DEBUG_MODE = true;
        
        // Add FPS display
        const fpsDisplay = Utils.createElement('div');
        fpsDisplay.id = 'fps-display';
        fpsDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 9999;
            font-size: 12px;
        `;
        document.body.appendChild(fpsDisplay);

        // Add debug panel
        this.createDebugPanel();

        // Add debug controls to window object
        window.debug = {
            unlockAllAchievements: () => {
                if (game) {
                    game.unlockAllAchievements();
                }
            },
            triggerMinigame: () => {
                if (game) {
                    game.triggerMinigame();
                }
            },
            setScore: (player, score) => {
                if (game) {
                    game.setScore(player, score);
                }
            },
            addTestCards: () => {
                if (game) {
                    game.addTestCards();
                }
            },
            getGameState: () => {
                return this.getGameState();
            },
            resetData: () => {
                if (game) {
                    game.resetAllData();
                }
            },
            testAudio: () => {
                if (audioManager) {
                    audioManager.testAudio();
                }
            },
            getPerformanceInfo: () => {
                return {
                    fps: this.performanceMonitor.currentFPS,
                    graphics: graphics ? graphics.getStatus() : null,
                    audio: audioManager ? audioManager.getStatus() : null,
                    input: inputManager ? inputManager.getStatus() : null
                };
            }
        };

        console.log('🐛 Debug mode enabled. Use window.debug object for debug functions.');
        Utils.showNotification('Debug mode enabled! Check console for commands.', 'info', 3000);
    }

    createDebugPanel() {
        const panel = Utils.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 11px;
            z-index: 9998;
            max-width: 250px;
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>🐛 Debug Panel</strong></div>
            <div>Screen: <span id="debug-screen">-</span></div>
            <div>Player: <span id="debug-player">-</span></div>
            <div>Cards: <span id="debug-cards">-</span></div>
            <div>Performance: <span id="debug-performance">-</span></div>
        `;
        
        document.body.appendChild(panel);
        
        // Update debug info periodically
        setInterval(() => {
            this.updateDebugPanel();
        }, 1000);
    }

    updateDebugPanel() {
        if (!window.DEBUG_MODE) return;
        
        const gameState = this.getGameState();
        
        const screenElement = document.getElementById('debug-screen');
        if (screenElement) screenElement.textContent = gameState.currentScreen;
        
        const playerElement = document.getElementById('debug-player');
        if (playerElement) playerElement.textContent = `P${gameState.currentPlayer || '-'}`;
        
        const cardsElement = document.getElementById('debug-cards');
        if (cardsElement) cardsElement.textContent = `${gameState.matchedPairs || 0}/${gameState.totalPairs || 0}`;
        
        const perfElement = document.getElementById('debug-performance');
        if (perfElement) {
            const mode = graphics ? graphics.performanceMode : 'unknown';
            perfElement.textContent = `${this.performanceMonitor.currentFPS}fps (${mode})`;
        }
    }
}
// Main.js Part 5 - Cleanup and Application Management (Complete)

    cleanup() {
        console.log('🧹 Cleaning up...');

        // Stop game loop
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        // Cleanup components
        if (graphics) {
            graphics.cleanup();
        }

        if (audioManager) {
            audioManager.stopMusic();
            audioManager.cleanup();
        }

        if (inputManager) {
            inputManager.cleanup();
        }

        if (minigame) {
            minigame.cleanup();
        }

        if (game) {
            game.cleanup();
        }

        // Clear timers
        if (this.lastAutoSave) {
            this.lastAutoSave = null;
        }

        this.initialized = false;
    }

    // Public API methods
    getGameState() {
        return {
            currentScreen: game ? game.currentScreen : 'unknown',
            currentPlayer: game ? game.currentPlayer : null,
            scores: game ? game.scores : null,
            matchedPairs: game ? game.matchedPairs : 0,
            totalPairs: game ? game.totalPairs : 0,
            achievements: game ? Object.keys(game.achievements).length : 0,
            isMinigameActive: minigame ? minigame.isActive : false,
            performance: {
                fps: this.performanceMonitor.currentFPS,
                mode: graphics ? graphics.performanceMode : 'unknown'
            }
        };
    }

    resetGame() {
        if (game) {
            game.showTitle();
        }
    }

    toggleDebugMode() {
        if (window.DEBUG_MODE) {
            window.DEBUG_MODE = false;
            const fpsDisplay = document.getElementById('fps-display');
            const debugPanel = document.getElementById('debug-panel');
            if (fpsDisplay) fpsDisplay.remove();
            if (debugPanel) debugPanel.remove();
            delete window.debug;
            Utils.showNotification('Debug mode disabled', 'info', 2000);
        } else {
            this.enableDebugMode();
        }
    }

    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                devicePixelRatio: window.devicePixelRatio
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            device: {
                isMobile: Utils.isMobile(),
                isTouch: Utils.isTouchDevice(),
                memory: navigator.deviceMemory || 'unknown',
                cores: navigator.hardwareConcurrency || 'unknown'
            },
            features: {
                webAudio: !!(window.AudioContext || window.webkitAudioContext),
                localStorage: !!window.localStorage,
                vibrate: !!navigator.vibrate,
                gamepad: !!navigator.getGamepads
            }
        };
    }

    exportGameData() {
        if (game) {
            game.exportGameData();
        }
    }

    importGameData(dataStr) {
        if (game) {
            game.importGameData(dataStr);
        }
    }

                                  // Main.js Part 6 - Final Methods and Initialization (Complete)

    getPerformanceMetrics() {
        return {
            fps: this.performanceMonitor.currentFPS,
            frameTime: 1000 / this.performanceMonitor.currentFPS,
            graphics: graphics ? graphics.getStatus() : null,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    }

    showNotification(message, type = 'info', duration = 3000) {
        Utils.showNotification(message, type, duration);
    }

    vibrate(pattern = [100]) {
        Utils.vibrate(pattern);
    }

    playSound(soundName) {
        if (audioManager) {
            audioManager.playSound(soundName);
        }
    }

    recoverFromError() {
        try {
            console.log('🔧 Attempting error recovery...');
            
            // Stop everything
            this.cleanup();
            
            // Wait a moment
            setTimeout(() => {
                // Reinitialize
                this.init();
                Utils.showNotification('Game recovered successfully!', 'success', 3000);
            }, 1000);
        } catch (error) {
            console.error('Recovery failed:', error);
            Utils.showErrorDialog('Recovery failed. Please refresh the page.', () => {
                location.reload();
            });
        }
    }

    // Game state management
    saveState() {
        const state = {
            gameState: this.getGameState(),
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        Utils.saveToLocalStorage('appState', state);
        console.log('💾 Application state saved');
    }

    loadState() {
        const state = Utils.loadFromLocalStorage('appState', null);
        if (state && state.gameState) {
            console.log('📁 Application state loaded');
            return state;
        }
        return null;
    }
}

// Initialize the application
const main = new Main();

// Start the game when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => main.init());
} else {
    main.init();
}

// Expose main instance globally for debugging and external access
window.main = main;

// Add keyboard shortcuts for debug mode
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D for debug mode
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        main.toggleDebugMode();
    }
    
    // Ctrl+Shift+R for recovery
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') {
        e.preventDefault();
        main.recoverFromError();
    }
});

// Add some CSS custom properties for responsive design
document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

// Handle page focus/blur for better mobile experience
window.addEventListener('focus', () => {
    if (main.initialized) {
        main.resume();
    }
});

window.addEventListener('blur', () => {
    if (main.initialized) {
        main.pause();
    }
});

// Final setup message
console.log('🐱 Cat Memory Game - Ready to start!');
console.log('🎮 Use Ctrl+Shift+D for debug mode');
console.log('🔧 Use Ctrl+Shift+R for error recovery');

// Service worker registration for offline play (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('📱 Service Worker registered for offline play');
            })
            .catch(error => {
                console.log('Service Worker registration failed (not critical)');
            });
    });
}
