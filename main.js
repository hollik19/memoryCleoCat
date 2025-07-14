// Main.js Part 1 - Application Setup and Initialization

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
        this.lastAutoSave = 0;
    }

    init() {
        if (this.initialized) return;

        console.log('🐱 Cat Memory Game - Initializing...');
        
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
            if (Utils && Utils.showNotification) {
                Utils.showNotification('Game loaded! Welcome to Cat Memory Game!', 'success', 2000);
            }
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

        if (Utils && Utils.isMobile && Utils.isMobile()) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 100);
            });
        }
    }

    initializeComponents() {
        const components = [
            { name: 'Utils', instance: window.Utils },
            { name: 'audioManager', instance: window.audioManager },
            { name: 'graphics', instance: window.graphics },
            { name: 'inputManager', instance: window.inputManager },
            { name: 'minigame', instance: window.minigame },
            { name: 'game', instance: window.game }
        ];

        const missing = [];
        components.forEach(({ name, instance }) => {
            if (!instance) {
                missing.push(name);
            }
        });

        if (missing.length > 0) {
            throw new Error(`Missing components: ${missing.join(', ')}`);
        }

        if (Utils && Utils.isMobile && Utils.isMobile()) {
            this.setupMobileOptimizations();
        }

        console.log('✅ All components initialized');
    }

    setupMobileOptimizations() {
        if (Utils && Utils.preventZoom) {
            Utils.preventZoom();
        }
        
        if (Utils && Utils.requestWakeLock) {
            Utils.requestWakeLock();
        }
        
        if (graphics && Utils && Utils.getScreenSize) {
            const screenSize = Utils.getScreenSize();
            if (screenSize.isSmall) {
                graphics.setPerformanceMode('low');
            }
        }
        
        if (audioManager && navigator.hardwareConcurrency < 4) {
            audioManager.setMusicVolume(0.2);
            audioManager.setSfxVolume(0.4);
        }
        
        console.log('📱 Mobile optimizations applied');
    }

    optimizeForDevice() {
        const deviceInfo = {
            isMobile: Utils ? Utils.isMobile() : false,
            isTouch: Utils ? Utils.isTouchDevice() : false,
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4,
            screen: Utils ? Utils.getScreenSize() : { isSmall: false }
        };

        if (deviceInfo.memory < 4 || deviceInfo.cores < 4) {
            this.targetFPS = 30;
            this.frameInterval = 1000 / this.targetFPS;
            
            if (graphics && graphics.setPerformanceMode) {
                graphics.setPerformanceMode('low');
            }
        }

        if (deviceInfo.screen.isSmall) {
            document.body.classList.add('small-screen');
        }

        console.log('⚙️ Device optimization complete:', deviceInfo);
    }
	setupEventListeners() {
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }

        if (Utils && Utils.isTouchDevice && Utils.isTouchDevice()) {
            document.addEventListener('contextmenu', (e) => {
                if (e.target.closest('.game-container')) {
                    e.preventDefault();
                }
            });
        }

        console.log('📱 Event listeners setup complete');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleResize() {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

        if (Utils && Utils.getScreenSize) {
            const screenSize = Utils.getScreenSize();
            document.body.className = document.body.className.replace(/screen-\w+/g, '');
            
            if (screenSize.isSmall) {
                document.body.classList.add('screen-small');
            } else if (screenSize.isMedium) {
                document.body.classList.add('screen-medium');
            } else {
                document.body.classList.add('screen-large');
            }
        }

        if (graphics && graphics.cleanup) {
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

    handleOrientationChange() {
        console.log('📱 Orientation changed');
        
        setTimeout(() => {
            this.handleResize();
            
            if (inputManager && inputManager.clearAllInputs) {
                inputManager.clearAllInputs();
            }
            
            this.refreshUI();
        }, 300);
    }

    handleConnectionChange() {
        const connection = navigator.connection;
        if (connection) {
            console.log(`📶 Connection changed: ${connection.effectiveType}`);
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                if (Utils && Utils.showNotification) {
                    Utils.showNotification('Slow connection detected - optimizing performance', 'info', 3000);
                }
                if (graphics && graphics.setPerformanceMode) {
                    graphics.setPerformanceMode('low');
                }
            }
        }
    }

    refreshUI() {
        if (game && game.gameBoard) {
            if (game.updateCatPosition) game.updateCatPosition();
            if (game.updateScoreDisplay) game.updateScoreDisplay();
            if (game.updateCurrentPlayerDisplay) game.updateCurrentPlayerDisplay();
            if (game.updatePeekButton) game.updatePeekButton();
        }
        
        if (minigame && minigame.isActive) {
            if (minigame.updateScore) minigame.updateScore();
            if (minigame.updateTimer) minigame.updateTimer();
        }
    }
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
        this.autoSave();
    }

    render() {
        this.updateUI();
    }

    updatePerformanceMonitor(currentTime) {
        this.performanceMonitor.frameCount++;
        
        if (currentTime - this.performanceMonitor.lastCheck >= 1000) {
            this.performanceMonitor.currentFPS = this.performanceMonitor.frameCount;
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastCheck = currentTime;
            
            this.adjustPerformance();
            
            if (window.DEBUG_MODE) {
                this.updateFPSDisplay();
            }
        }
    }

    adjustPerformance() {
        const fps = this.performanceMonitor.currentFPS;
        
        if (fps < 20 && graphics && graphics.performanceMode !== 'low') {
            graphics.setPerformanceMode('low');
            console.warn('⚠️ Low FPS detected, switching to low performance mode');
        }
        
        if (fps > 50 && graphics && graphics.performanceMode === 'low') {
            graphics.setPerformanceMode('auto');
            console.log('📈 Good FPS detected, upgrading performance mode');
        }
    }

    updateFPSDisplay() {
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${this.performanceMonitor.currentFPS}`;
            
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
        if ('connection' in navigator) {
            this.updateConnectionStatus();
        }
        
        if (Utils && Utils.isMobile && Utils.isMobile() && 'getBattery' in navigator) {
            this.updateBatteryStatus();
        }
    }

    updateConnectionStatus() {
        const connection = navigator.connection;
        if (connection && connection.effectiveType) {
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                if (graphics && graphics.setPerformanceMode) {
                    graphics.setPerformanceMode('low');
                }
            }
        }
    }

    updateBatteryStatus() {
        navigator.getBattery().then((battery) => {
            if (battery.level < 0.2 && !battery.charging) {
                if (graphics && graphics.performanceMode !== 'low') {
                    graphics.setPerformanceMode('low');
                    if (Utils && Utils.showNotification) {
                        Utils.showNotification('Battery saver mode enabled', 'info', 2000);
                    }
                }
            }
        }).catch(() => {});
    }

    autoSave() {
        if (!this.lastAutoSave || Date.now() - this.lastAutoSave > 30000) {
            if (game && game.saveAchievements) {
                game.saveAchievements();
            }
            this.lastAutoSave = Date.now();
        }
    }
	pause() {
        if (audioManager && audioManager.stopMusic) {
            audioManager.stopMusic();
        }

        if (minigame && minigame.isActive && minigame.pause) {
            minigame.pause();
        }

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        this.showPauseIndicator();
        console.log('⏸️ Game paused');
    }

    resume() {
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

        if (minigame && game && game.currentScreen === 'minigame' && minigame.resume) {
            minigame.resume();
        }

        if (!this.gameLoop) {
            this.startGameLoop();
        }

        this.hidePauseIndicator();
        console.log('▶️ Game resumed');
    }

    showPauseIndicator() {
        let pauseIndicator = document.getElementById('pause-indicator');
        if (!pauseIndicator) {
            pauseIndicator = document.createElement('div');
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

    handleError(error) {
        console.error('Handling error:', error);
        
        if (audioManager && audioManager.stopMusic) {
            audioManager.stopMusic();
        }

        this.showErrorMessage('An error occurred. The game will try to recover.');

        if (game && game.showTitle) {
            setTimeout(() => {
                try {
                    game.showTitle();
                } catch (e) {
                    console.error('Failed to return to title screen:', e);
                    location.reload();
                }
            }, 2000);
        }

        this.reportError(error);
    }

    reportError(error) {
        const errorReport = {
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            gameState: game && game.getStatus ? game.getStatus() : null
        };
        
        try {
            const errors = Utils && Utils.loadFromLocalStorage ? 
                Utils.loadFromLocalStorage('errorReports', []) : [];
            errors.push(errorReport);
            
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            
            if (Utils && Utils.saveToLocalStorage) {
                Utils.saveToLocalStorage('errorReports', errors);
            }
        } catch (e) {
            console.warn('Could not save error report:', e);
        }
    }

    showErrorMessage(message) {
        const overlay = document.createElement('div');
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

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 10000);
    }
	enableDebugMode() {
        window.DEBUG_MODE = true;
        
        const fpsDisplay = document.createElement('div');
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

        this.createDebugPanel();

        window.debug = {
            unlockAllAchievements: () => {
                if (game && game.unlockAllAchievements) {
                    game.unlockAllAchievements();
                }
            },
            triggerMinigame: () => {
                if (game && game.triggerMinigame) {
                    game.triggerMinigame();
                }
            },
            setScore: (player, score) => {
                if (game && game.setScore) {
                    game.setScore(player, score);
                }
            },
            addTestCards: () => {
                if (game && game.addTestCards) {
                    game.addTestCards();
                }
            },
            getGameState: () => {
                return this.getGameState();
            },
            resetData: () => {
                if (game && game.resetAllData) {
                    game.resetAllData();
                }
            },
            testAudio: () => {
                if (audioManager && audioManager.testAudio) {
                    audioManager.testAudio();
                }
            },
            getPerformanceInfo: () => {
                return {
                    fps: this.performanceMonitor.currentFPS,
                    graphics: graphics && graphics.getStatus ? graphics.getStatus() : null,
                    audio: audioManager && audioManager.getStatus ? audioManager.getStatus() : null,
                    input: inputManager && inputManager.getStatus ? inputManager.getStatus() : null
                };
            }
        };

        console.log('🐛 Debug mode enabled. Use window.debug object for debug functions.');
        if (Utils && Utils.showNotification) {
            Utils.showNotification('Debug mode enabled! Check console for commands.', 'info', 3000);
        }
    }

    createDebugPanel() {
        const panel = document.createElement('div');
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
            const mode = graphics && graphics.performanceMode ? graphics.performanceMode : 'unknown';
            perfElement.textContent = `${this.performanceMonitor.currentFPS}fps (${mode})`;
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
            if (Utils && Utils.showNotification) {
                Utils.showNotification('Debug mode disabled', 'info', 2000);
            }
        } else {
            this.enableDebugMode();
        }
    }
	cleanup() {
        console.log('🧹 Cleaning up...');

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        if (graphics && graphics.cleanup) {
            graphics.cleanup();
        }

        if (audioManager && audioManager.cleanup) {
            audioManager.stopMusic();
            audioManager.cleanup();
        }

        if (inputManager && inputManager.cleanup) {
            inputManager.cleanup();
        }

        if (minigame && minigame.cleanup) {
            minigame.cleanup();
        }

        if (game && game.cleanup) {
            game.cleanup();
        }

        this.lastAutoSave = 0;
        this.initialized = false;
    }

    getGameState() {
        return {
            currentScreen: game ? game.currentScreen : 'unknown',
            currentPlayer: game ? game.currentPlayer : null,
            scores: game ? game.scores : null,
            matchedPairs: game ? game.matchedPairs : 0,
            totalPairs: game ? game.totalPairs : 0,
            achievements: game && game.achievements ? Object.keys(game.achievements).length : 0,
            isMinigameActive: minigame ? minigame.isActive : false,
            performance: {
                fps: this.performanceMonitor.currentFPS,
                mode: graphics ? graphics.performanceMode : 'unknown'
            }
        };
    }

    resetGame() {
        if (game && game.showTitle) {
            game.showTitle();
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
                isMobile: Utils ? Utils.isMobile() : false,
                isTouch: Utils ? Utils.isTouchDevice() : false,
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

    getPerformanceMetrics() {
        return {
            fps: this.performanceMonitor.currentFPS,
            frameTime: 1000 / this.performanceMonitor.currentFPS,
            graphics: graphics && graphics.getStatus ? graphics.getStatus() : null,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
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

// Expose main instance globally
window.main = main;

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        main.toggleDebugMode();
    }
    
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') {
        e.preventDefault();
        if (main.cleanup && main.init) {
            main.cleanup();
            setTimeout(() => main.init(), 1000);
        }
    }
});

// Set CSS viewport height
document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

// Handle focus/blur for mobile
window.addEventListener('focus', () => {
    if (main.initialized && main.resume) {
        main.resume();
    }
});

window.addEventListener('blur', () => {
    if (main.initialized && main.pause) {
        main.pause();
    }
});

console.log('🐱 Cat Memory Game - Ready to start!');
console.log('🎮 Use Ctrl+Shift+D for debug mode');
console.log('🔧 Use Ctrl+Shift+R for error recovery');
