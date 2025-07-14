// Utils.js - Utility functions and helpers

class Utils {
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static debounce(func, wait) {
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

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static getElementBounds(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    }

    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    static getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            isSmall: window.innerWidth < 480,
            isMedium: window.innerWidth >= 480 && window.innerWidth < 768,
            isLarge: window.innerWidth >= 768
        };
    }

    static generateMathProblem() {
        const num1 = this.getRandomInt(1, 8);
        const num2 = this.getRandomInt(1, 10 - num1);
        return {
            question: `${num1} + ${num2}`,
            answer: num1 + num2,
            operands: [num1, num2]
        };
    }

    static validateMathAnswer(userAnswer, correctAnswer) {
        const answer = parseInt(userAnswer);
        return !isNaN(answer) && answer === correctAnswer;
    }

    static createParticle(x, y, color = '#ff6b6b') {
        const particle = this.createElement('div', 'particle');
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = color;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = this.getRandomInt(2, 8);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        document.body.appendChild(particle);
        
        let posX = x;
        let posY = y;
        let opacity = 1;
        
        const animate = () => {
            posX += vx;
            posY += vy;
            opacity -= 0.02;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        animate();
    }

    static createParticleBurst(x, y, count = 8, color = '#ff6b6b') {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createParticle(x, y, color);
            }, i * 50);
        }
    }

    static vibrate(pattern = [100]) {
        if ('vibrate' in navigator && this.isTouchDevice()) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                console.warn('Vibration not supported:', e);
            }
        }
    }

    static saveToLocalStorage(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    static removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
            return false;
        }
    }

    static showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('active');
            // Smooth scroll into view for mobile
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }
    }

    static hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('active');
        }
    }

    static hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    static showScreen(screenId) {
        Utils.hideAllScreens();
        Utils.showElement(screenId);
        
        // Prevent body scroll on mobile when showing screens
        if (Utils.isTouchDevice()) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                document.body.style.overflow = '';
            }, 100);
        }
    }

    static addGlow(element, color = '#ff6b6b', duration = 1000) {
        element.style.boxShadow = `0 0 20px ${color}`;
        
        setTimeout(() => {
            element.style.boxShadow = '';
        }, duration);
    }

    static formatScore(score) {
        return score.toString().padStart(2, '0');
    }

    static getCardSymbols() {
        return ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
                '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🐛',
                '🦋', '🐝', '🐞', '🦗', '🕷️', '🦂', '🐢', '🐍'];
    }

    static getJokerSymbol() {
        return '⭐';
    }

    static getMiceSymbols() {
        return {
            brown: '🐭',
            gray: '🐁', 
            white: '🤍',
            golden: '✨'
        };
    }

    static createRippleEffect(element, x, y) {
        const ripple = this.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = (x - 50) + 'px';
        ripple.style.top = (y - 50) + 'px';
        ripple.style.width = '100px';
        ripple.style.height = '100px';
        ripple.style.pointerEvents = 'none';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    static easeOutBounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }

    static animateValue(element, start, end, duration, callback) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(this.lerp(start, end, progress));
            element.textContent = current;
            
            if (callback) callback(current, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    static getGameConfig() {
        return {
            gridSizes: [3, 4, 5, 6],
            jokerConfig: {
                3: { pairs: 4, jokers: 1 },
                4: { pairs: 8, jokers: 0 },
                5: { pairs: 12, jokers: 1 },
                6: { pairs: 16, jokers: 4 }
            },
            minigameProbability: 0.05,
            peekDuration: 4000,
            mathMaxSum: 10,
            minigameTimer: 30,
            achievements: {
                'Purr-fect Memory': 'Complete a game without any mistakes',
                'Cat Burglar': 'Win a game by 3 or more points',
                'Nine Lives': 'Make a dramatic comeback victory',
                'Speed Hunter': 'Achieve high score in mouse hunt',
                'Golden Hunter': 'Catch the rare golden mouse',
                'Mouse Master': 'Catch all mice in minigame',
                'Lightning Cat': 'Complete 6x6 grid in under 2 minutes',
                'Math Wizard': 'Solve 5 math problems correctly in one game',
                'Perfect Pouncer': 'Catch 3 mice with one pounce'
            }
        };
    }

    static preloadAssets() {
        // Create invisible elements to preload emoji rendering
        const symbols = [...this.getCardSymbols(), this.getJokerSymbol(), ...Object.values(this.getMiceSymbols())];
        const preloader = this.createElement('div');
        preloader.style.position = 'absolute';
        preloader.style.left = '-9999px';
        preloader.style.visibility = 'hidden';
        
        symbols.forEach(symbol => {
            const span = this.createElement('span');
            span.textContent = symbol;
            preloader.appendChild(span);
        });
        
        document.body.appendChild(preloader);
        
        // Remove after a short delay
        setTimeout(() => {
            preloader.remove();
        }, 100);
        
        return Promise.resolve();
    }

    static isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    static smoothScrollTo(element, duration = 500) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    static showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createElement('div', `notification notification-${type}`);
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#00b894' : '#74b9ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        return notification;
    }

    static showLoadingIndicator(show = true) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            if (show) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }
    }

    static showErrorDialog(message, callback) {
        const dialog = document.getElementById('error-dialog');
        const messageElement = document.getElementById('error-message');
        
        if (dialog && messageElement) {
            messageElement.textContent = message;
            dialog.classList.remove('hidden');
            
            // Add click handler for button
            const button = dialog.querySelector('.button');
            if (button) {
                button.onclick = () => {
                    dialog.classList.add('hidden');
                    if (callback) callback();
                };
            }
        }
    }

    static copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = this.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            return new Promise((resolve, reject) => {
                try {
                    document.execCommand('copy') ? resolve() : reject();
                } catch (error) {
                    reject(error);
                } finally {
                    textArea.remove();
                }
            });
        }
    }

    static preventZoom() {
        // Prevent pinch zoom on touch devices
        if (this.isTouchDevice()) {
            document.addEventListener('touchstart', (event) => {
                if (event.touches.length > 1) {
                    event.preventDefault();
                }
            }, { passive: false });

            document.addEventListener('gesturestart', (event) => {
                event.preventDefault();
            });
        }
    }

    static requestWakeLock() {
        // Keep screen awake during gameplay
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').catch(err => {
                console.warn('Wake lock failed:', err);
            });
        }
    }

    static getRandomLoadingMessage() {
        const messages = [
            'Teaching cats to play cards...',
            'Shuffling with tiny paws...',
            'Preparing the mice...',
            'Warming up the purr engine...',
            'Calculating optimal cuteness...'
        ];
        return this.getRandomElement(messages);
    }

    static formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    static sanitizeString(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static getCurrentTimestamp() {
        return Date.now();
    }

    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }
}
