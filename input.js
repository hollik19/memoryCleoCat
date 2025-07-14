// Input.js - Enhanced input handling for mobile and desktop

class InputManager {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.mousePos = { x: 0, y: 0 };
        this.isTouch = Utils.isTouchDevice();
        this.swipeThreshold = 50;
        this.swipeTimeout = 300;
        this.inputEnabled = true;
        this.gestureState = {
            isGesturing: false,
            startTime: 0,
            startPos: null,
            currentPos: null
        };
        this.longPressTimer = null;
        this.longPressDelay = 500;
        this.doubleTapTimer = null;
        this.doubleTapDelay = 300;
        this.lastTapTime = 0;
        this.preventNextClick = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSwipeDetection();
        this.setupAccessibility();
        this.preventZoomAndScroll();
        console.log(`📱 Input system initialized for ${this.isTouch ? 'touch' : 'mouse/keyboard'} device`);
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), { passive: false });
        document.addEventListener('keyup', (e) => this.handleKeyUp(e), { passive: false });

        // Mouse events (for desktop)
        if (!this.isTouch) {
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
            document.addEventListener('mousedown', (e) => this.handleMouseDown(e), { passive: false });
            document.addEventListener('mouseup', (e) => this.handleMouseUp(e), { passive: false });
            document.addEventListener('click', (e) => this.handleClick(e), { passive: false });
        }

        // Touch events (for mobile)
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });

        // Prevent context menu on mobile
        document.addEventListener('contextmenu', (e) => {
            if (this.isTouch) {
                e.preventDefault();
            }
        }, { passive: false });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Resume audio context on first interaction
        const resumeAudio = () => {
            if (audioManager) {
                audioManager.resumeContext();
            }
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.clearAllInputs();
            }
        });
    }

    setupSwipeDetection() {
        this.swipeStart = null;
        this.swipeEnd = null;
        this.swipeDirection = null;
    }

    setupAccessibility() {
        // Add focus management for keyboard navigation
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('.button, .control-btn, .num-btn, .card')) {
                e.target.classList.add('keyboard-focused');
            }
        });

        document.addEventListener('focusout', (e) => {
            e.target.classList.remove('keyboard-focused');
        });
    }

    preventZoomAndScroll() {
        if (this.isTouch) {
            // Prevent pinch zoom
            document.addEventListener('touchstart', (event) => {
                if (event.touches.length > 1) {
                    event.preventDefault();
                }
            }, { passive: false });

            // Prevent double-tap zoom on buttons and game elements
            document.addEventListener('touchend', (event) => {
                const target = event.target;
                if (target.matches('.button, .control-btn, .num-btn, .card, .game-container *')) {
                    const now = Date.now();
                    if (now - this.lastTapTime < this.doubleTapDelay) {
                        event.preventDefault();
                        this.preventNextClick = true;
                        setTimeout(() => {
                            this.preventNextClick = false;
                        }, 100);
                    }
                    this.lastTapTime = now;
                }
            }, { passive: false });

            // Prevent scroll on game container
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                }, { passive: false });
            }
        }
    }

    handleKeyDown(e) {
        if (!this.inputEnabled) return;
        
        this.keys[e.code] = true;
        
        // Handle global shortcuts
        if (e.code === 'Escape') {
            e.preventDefault();
            this.handleEscape();
            return;
        }

        // Handle game controls
        if (game && game.currentScreen === 'game') {
            this.handleGameKeyboard(e);
        }

        // Handle minigame controls
        if (minigame && minigame.isActive) {
            this.handleMinigameKeyboard(e);
        }

        // Handle peek screen controls
        if (game && game.currentScreen === 'peek') {
            this.handlePeekKeyboard(e);
        }
    }

    handleGameKeyboard(e) {
        const controlKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter', 'KeyP'];
        
        if (controlKeys.includes(e.code)) {
            e.preventDefault();
            
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    game.moveCat('up');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    game.moveCat('down');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    game.moveCat('left');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    game.moveCat('right');
                    break;
                case 'Space':
                case 'Enter':
                    game.flipCard();
                    break;
                case 'KeyP':
                    game.showPeekChallenge();
                    break;
            }
        }
    }

    handleMinigameKeyboard(e) {
        const controlKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter'];
        
        if (controlKeys.includes(e.code)) {
            e.preventDefault();
            
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    minigame.moveCat('up');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    minigame.moveCat('down');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    minigame.moveCat('left');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    minigame.moveCat('right');
                    break;
                case 'Space':
                case 'Enter':
                    minigame.pounce();
                    break;
            }
        }
    }

    handlePeekKeyboard(e) {
        if (e.code >= 'Digit0' && e.code <= 'Digit9') {
            e.preventDefault();
            const number = parseInt(e.code.replace('Digit', ''));
            game.inputNumber(number);
        } else if (e.code >= 'Numpad0' && e.code <= 'Numpad9') {
            e.preventDefault();
            const number = parseInt(e.code.replace('Numpad', ''));
            game.inputNumber(number);
        } else if (e.code === 'Enter') {
            e.preventDefault();
            game.submitMathAnswer();
        } else if (e.code === 'Backspace' || e.code === 'Delete') {
            e.preventDefault();
            game.clearNumber();
        }
    }

    handleEscape() {
        if (game) {
            if (game.currentScreen === 'peek') {
                game.showGame();
            } else if (game.currentScreen === 'minigame') {
                // Don't allow escape from minigame
                return;
            } else if (game.currentScreen === 'game') {
                game.showTitle();
            }
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleMouseMove(e) {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
    }

    handleMouseDown(e) {
        if (!this.inputEnabled) return;
        
        this.createClickEffect(e.clientX, e.clientY);
        this.playButtonSound(e.target);
    }

    handleMouseUp(e) {
        if (!this.inputEnabled) return;
        // Handle card clicks in game
        this.handleElementClick(e.target, e.clientX, e.clientY);
    }

    handleClick(e) {
        if (!this.inputEnabled || this.preventNextClick) {
            e.preventDefault();
            return;
        }
        
        // Additional click handling if needed
    }

    handleTouchStart(e) {
        if (!this.inputEnabled) {
            e.preventDefault();
            return;
        }

        const touch = e.touches[0];
        const now = Date.now();
        
        // Store gesture state
        this.gestureState = {
            isGesturing: true,
            startTime: now,
            startPos: { x: touch.clientX, y: touch.clientY },
            currentPos: { x: touch.clientX, y: touch.clientY }
        };

        // Store swipe start
        this.swipeStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: now
        };

        // Store touch for tracking
        this.touches[touch.identifier] = {
            x: touch.clientX,
            y: touch.clientY,
            startTime: now,
            element: document.elementFromPoint(touch.clientX, touch.clientY)
        };

        // Create visual feedback
        this.createTouchEffect(touch.clientX, touch.clientY);
        
        // Handle element interaction
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target) {
            this.playButtonSound(target);
            
            // Start long press timer for certain elements
            if (target.matches('.card, .button')) {
                this.longPressTimer = setTimeout(() => {
                    this.handleLongPress(target, touch.clientX, touch.clientY);
                }, this.longPressDelay);
            }
        }

        // Prevent default for game elements
        if (this.shouldPreventDefault(e.target)) {
            e.preventDefault();
        }
    }

    handleTouchMove(e) {
        if (!this.inputEnabled) {
            e.preventDefault();
            return;
        }

        const touch = e.touches[0];
        
        // Update gesture state
        if (this.gestureState.isGesturing) {
            this.gestureState.currentPos = { x: touch.clientX, y: touch.clientY };
        }

        // Update touch tracking
        if (this.touches[touch.identifier]) {
            this.touches[touch.identifier].x = touch.clientX;
            this.touches[touch.identifier].y = touch.clientY;
        }

        // Cancel long press if moved too far
        if (this.longPressTimer && this.gestureState.startPos) {
            const distance = this.getDistance(
                this.gestureState.startPos.x, this.gestureState.startPos.y,
                touch.clientX, touch.clientY
            );
            
            if (distance > 20) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }

        // Prevent default to stop scrolling
        if (this.shouldPreventDefault(e.target)) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        if (!this.inputEnabled) {
            e.preventDefault();
            return;
        }

        const touch = e.changedTouches[0];
        const now = Date.now();
        
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Store swipe end
        this.swipeEnd = {
            x: touch.clientX,
            y: touch.clientY,
            time: now
        };

        // Handle gesture completion
        if (this.gestureState.isGesturing) {
            const duration = now - this.gestureState.startTime;
            
            if (duration < 300) { // Quick tap
                this.handleTap(touch.clientX, touch.clientY);
            } else {
                this.handleSwipe();
            }
        }

        // Clean up touch tracking
        if (this.touches[touch.identifier]) {
            delete this.touches[touch.identifier];
        }

        // Reset gesture state
        this.gestureState.isGesturing = false;

        // Prevent default for game elements
        if (this.shouldPreventDefault(e.target)) {
            e.preventDefault();
        }
    }

    handleTouchCancel(e) {
        // Clean up on touch cancel
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        this.gestureState.isGesturing = false;
        
        // Clear all touch tracking
        e.changedTouches.forEach(touch => {
            delete this.touches[touch.identifier];
        });
    }

    handleTap(x, y) {
        const target = document.elementFromPoint(x, y);
        if (target) {
            this.handleElementClick(target, x, y);
            
            // Create ripple effect
            if (target.matches('.button, .control-btn, .num-btn')) {
                graphics.createRippleEffect(target, x, y);
            }
        }
    }

    handleLongPress(element, x, y) {
        // Handle long press actions
        if (element.matches('.card')) {
            // Could show card info or hint
            Utils.vibrate([100, 50, 100]);
        }
        
        // Visual feedback
        graphics.pulseElement(element, '#ffd700', 300);
    }

    handleSwipe() {
        if (!this.swipeStart || !this.swipeEnd) return;

        const deltaX = this.swipeEnd.x - this.swipeStart.x;
        const deltaY = this.swipeEnd.y - this.swipeStart.y;
        const deltaTime = this.swipeEnd.time - this.swipeStart.time;

        if (deltaTime > this.swipeTimeout) return;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX < this.swipeThreshold && absY < this.swipeThreshold) return;

        let direction = '';
        if (absX > absY) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }

        this.swipeDirection = direction;

        // Handle swipe in appropriate context
        if (game && game.currentScreen === 'game') {
            game.moveCat(direction);
        } else if (minigame && minigame.isActive) {
            minigame.moveCat(direction);
        }

        // Visual feedback
        Utils.vibrate([30]);
    }

    handleElementClick(element, x, y) {
        if (!element) return;

        // Handle different element types
        if (element.matches('.card')) {
            const cardIndex = parseInt(element.dataset.index);
            if (!isNaN(cardIndex) && game && game.currentScreen === 'game') {
                game.selectCard(cardIndex);
            }
        } else if (element.matches('.num-btn')) {
            // Handle number button clicks
            const number = element.textContent.trim();
            if (game && game.currentScreen === 'peek') {
                if (number === 'Clear') {
                    game.clearNumber();
                } else if (!isNaN(number)) {
                    game.inputNumber(parseInt(number));
                }
            }
        }
        // Other element clicks are handled by their onclick attributes
    }

    handleOrientationChange() {
        // Handle orientation change
        console.log('📱 Orientation changed');
        
        // Clear any ongoing gestures
        this.clearAllInputs();
        
        // Trigger resize handling
        if (main && main.handleResize) {
            main.handleResize();
        }
    }

    createClickEffect(x, y) {
        const effect = Utils.createElement('div', 'click-effect');
        effect.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(255, 107, 107, 0.6);
            pointer-events: none;
            z-index: 9999;
            transform: scale(0);
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        `;
        
        document.body.appendChild(effect);
        
        requestAnimationFrame(() => {
            effect.style.transform = 'scale(2)';
            effect.style.opacity = '0';
        });
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.remove();
            }
        }, 300);
    }

    createTouchEffect(x, y) {
        if (graphics.performanceMode === 'low') return;
        
        const effect = Utils.createElement('div', 'touch-effect');
        effect.style.cssText = `
            position: fixed;
            left: ${x - 20}px;
            top: ${y - 20}px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 107, 107, 0.8) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9998;
            transform: scale(0);
            transition: transform 0.2s ease-out, opacity 0.5s ease-out;
        `;
        
        document.body.appendChild(effect);
        
        requestAnimationFrame(() => {
            effect.style.transform = 'scale(1)';
            effect.style.opacity = '0';
        });
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.remove();
            }
        }, 500);
    }

    playButtonSound(element) {
        if (!element) return;
        
        if (element.matches('.button, .control-btn, .num-btn')) {
            if (audioManager) {
                if (element.matches('.num-btn')) {
                    audioManager.playSound('numberInput');
                } else {
                    audioManager.playSound('buttonClick');
                }
            }
        }
    }

    shouldPreventDefault(element) {
        // Prevent default for game elements to stop unwanted behaviors
        return element && (
            element.matches('.game-container, .game-container *') ||
            element.closest('.game-container') ||
            element.matches('.button, .control-btn, .num-btn, .card')
        );
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    clearAllInputs() {
        // Clear all input states
        this.keys = {};
        this.touches = {};
        this.gestureState.isGesturing = false;
        
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.doubleTapTimer) {
            clearTimeout(this.doubleTapTimer);
            this.doubleTapTimer = null;
        }
    }

    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    addHapticFeedback(pattern = [50]) {
        if (this.isTouch) {
            Utils.vibrate(pattern);
        }
    }

    setInputEnabled(enabled) {
        this.inputEnabled = enabled;
        
        if (!enabled) {
            this.clearAllInputs();
        }
        
        console.log(`📱 Input ${enabled ? 'enabled' : 'disabled'}`);
    }

    getInputMethod() {
        return this.isTouch ? 'touch' : 'mouse';
    }

    // Get relative position within an element
    getRelativePosition(element, clientX, clientY) {
        const rect = element.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
            relativeX: (clientX - rect.left) / rect.width,
            relativeY: (clientY - rect.top) / rect.height
        };
    }

    getStatus() {
        return {
            inputMethod: this.getInputMethod(),
            inputEnabled: this.inputEnabled,
            isGesturing: this.gestureState.isGesturing,
            activeTouches: Object.keys(this.touches).length,
            pressedKeys: Object.keys(this.keys).filter(key => this.keys[key])
        };
    }

    cleanup() {
        // Clean up timers
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        
        if (this.doubleTapTimer) {
            clearTimeout(this.doubleTapTimer);
        }
        
        // Clear all states
        this.clearAllInputs();
        
        console.log('📱 Input system cleaned up');
    }
}

// Global input manager instance
const inputManager = new InputManager();
