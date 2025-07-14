// Graphics.js - Visual effects and animations optimized for mobile

class GraphicsManager {
    constructor() {
        this.particles = [];
        this.animations = [];
        this.effects = [];
        this.isAnimating = false;
        this.performanceMode = 'auto'; // auto, low, high
        this.maxParticles = 50;
        this.animationId = null;
        this.init();
    }

    init() {
        this.createDynamicStyles();
        this.detectPerformanceMode();
        this.setupIntersectionObserver();
    }

    detectPerformanceMode() {
        // Detect device performance capabilities
        const screenSize = Utils.getScreenSize();
        const isMobile = Utils.isMobile();
        const isLowEnd = navigator.hardwareConcurrency < 4 || navigator.deviceMemory < 4;
        
        if (isMobile || isLowEnd || screenSize.isSmall) {
            this.performanceMode = 'low';
            this.maxParticles = 20;
        } else {
            this.performanceMode = 'high';
            this.maxParticles = 50;
        }
        
        console.log(`🎨 Graphics performance mode: ${this.performanceMode}`);
    }

    createDynamicStyles() {
        // Add CSS animations with vendor prefixes
        const style = document.createElement('style');
        style.id = 'graphics-styles';
        style.textContent = `
            @keyframes ripple {
                0% { transform: scale(0); opacity: 0.8; }
                100% { transform: scale(4); opacity: 0; }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }
            
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 10px rgba(255, 107, 107, 0.5); }
                50% { box-shadow: 0 0 30px rgba(255, 107, 107, 0.8); }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                20%, 40%, 60%, 80% { transform: translateX(3px); }
            }
            
            @keyframes cardFlip {
                0% { transform: rotateY(0deg); }
                50% { transform: rotateY(90deg); }
                100% { transform: rotateY(0deg); }
            }
            
            @keyframes scoreIncrement {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); color: #ff6b6b; }
                100% { transform: scale(1); }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes bounceIn {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes flyToScore {
                0% { transform: scale(1) translate(0, 0); opacity: 1; }
                50% { transform: scale(0.7) translate(var(--fly-x), var(--fly-y)); opacity: 0.8; }
                100% { transform: scale(0) translate(var(--fly-x), var(--fly-y)); opacity: 0; }
            }
            
            @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
            }
            
            .graphics-reduced-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('graphics-reduced-motion');
        }
        
        document.head.appendChild(style);
    }

    setupIntersectionObserver() {
        // Pause animations for elements not in viewport on mobile
        if (Utils.isMobile() && 'IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        // Pause animations for off-screen elements
                        entry.target.style.animationPlayState = 'paused';
                    } else {
                        entry.target.style.animationPlayState = 'running';
                    }
                });
            });
        }
    }

    startAnimationLoop() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const animate = (timestamp) => {
            this.updateParticles();
            this.updateAnimations();
            
            if (this.particles.length > 0 || this.animations.length > 0) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.animationId = null;
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.life -= 1;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity || 0.1; // gravity
            particle.opacity = Math.max(0, particle.life / particle.maxLife);
            
            if (particle.element && particle.element.parentNode) {
                particle.element.style.left = particle.x + 'px';
                particle.element.style.top = particle.y + 'px';
                particle.element.style.opacity = particle.opacity;
                
                if (particle.rotation !== undefined) {
                    particle.rotation += particle.rotationSpeed || 2;
                    particle.element.style.transform = `rotate(${particle.rotation}deg)`;
                }
            }
            
            if (particle.life <= 0) {
                if (particle.element && particle.element.parentNode) {
                    particle.element.remove();
                }
                return false;
            }
            return true;
        });
    }

    updateAnimations() {
        this.animations = this.animations.filter(anim => {
            const elapsed = Date.now() - anim.startTime;
            anim.progress = Math.min(elapsed / anim.duration, 1);
            
            if (anim.update) {
                try {
                    anim.update(anim.progress);
                } catch (e) {
                    console.warn('Animation update failed:', e);
                    return false;
                }
            }
            
            if (anim.progress >= 1) {
                if (anim.onComplete) {
                    try {
                        anim.onComplete();
                    } catch (e) {
                        console.warn('Animation completion failed:', e);
                    }
                }
                return false;
            }
            return true;
        });
    }

    createParticle(x, y, options = {}) {
        // Limit particles for performance
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Remove oldest particle
        }

        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (options.speed || 4),
            vy: (Math.random() - 0.5) * (options.speed || 4) - 2,
            life: options.life || 60,
            maxLife: options.life || 60,
            opacity: 1,
            color: options.color || '#ff6b6b',
            size: options.size || 6,
            gravity: options.gravity || 0.1,
            rotation: options.rotation || 0,
            rotationSpeed: options.rotationSpeed || 0,
            element: null
        };
        
        // Create element only if performance allows
        if (this.performanceMode !== 'low') {
            particle.element = Utils.createElement('div', 'particle');
            particle.element.style.cssText = `
                position: fixed;
                width: ${particle.size}px;
                height: ${particle.size}px;
                background: ${particle.color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${particle.x}px;
                top: ${particle.y}px;
                will-change: transform, opacity;
            `;
            
            if (options.shape === 'square') {
                particle.element.style.borderRadius = '0';
            } else if (options.shape === 'star') {
                particle.element.textContent = '✨';
                particle.element.style.background = 'transparent';
                particle.element.style.fontSize = particle.size + 'px';
            }
            
            document.body.appendChild(particle.element);
        }
        
        this.particles.push(particle);
        
        if (!this.isAnimating) {
            this.startAnimationLoop();
        }
    }

    createParticleBurst(x, y, count = 8, options = {}) {
        const actualCount = this.performanceMode === 'low' ? Math.min(count, 4) : count;
        
        for (let i = 0; i < actualCount; i++) {
            setTimeout(() => {
                this.createParticle(x, y, {
                    ...options,
                    speed: (options.speed || 4) + Math.random() * 2,
                    life: (options.life || 60) + Math.random() * 30,
                    rotationSpeed: Math.random() * 5
                });
            }, this.performanceMode === 'low' ? i * 100 : i * 50);
        }
    }

    animateCardFlip(card, showContent = false) {
        if (!card) return;
        
        card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = 'rotateY(90deg)';
        
        setTimeout(() => {
            if (showContent && card.dataset.symbol) {
                card.textContent = card.dataset.symbol;
                card.classList.add('flipped');
            }
            card.style.transform = 'rotateY(0deg)';
        }, 150);
        
        setTimeout(() => {
            card.style.transition = '';
        }, 300);
    }

    animateCardMatch(cards) {
        if (!cards || cards.length === 0) return;
        
        cards.forEach((card, index) => {
            if (!card) return;
            
            setTimeout(() => {
                card.classList.add('matched');
                
                if (this.performanceMode !== 'low') {
                    card.style.animation = 'scoreIncrement 0.5s ease-out';
                    
                    // Create particle burst at card position
                    const rect = card.getBoundingClientRect();
                    this.createParticleBurst(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2,
                        6,
                        { 
                            color: '#00b894', 
                            speed: 3,
                            shape: 'star'
                        }
                    );
                }
                
                setTimeout(() => {
                    if (card.style) {
                        card.style.animation = '';
                    }
                }, 500);
            }, index * 100);
        });
    }

    animateCardMiss(cards) {
        if (!cards || cards.length === 0) return;
        
        cards.forEach(card => {
            if (!card) return;
            
            if (this.performanceMode !== 'low') {
                card.style.animation = 'shake 0.5s ease-in-out';
            } else {
                // Simple flash for low performance
                card.style.background = '#ff7675';
                setTimeout(() => {
                    card.style.background = '';
                }, 200);
            }
            
            setTimeout(() => {
                if (card.style) {
                    card.style.animation = '';
                }
            }, 500);
        });
    }

    animateScoreIncrement(scoreElement, newScore) {
        if (!scoreElement) return;
        
        if (this.performanceMode !== 'low') {
            scoreElement.style.animation = 'scoreIncrement 0.5s ease-out';
            
            setTimeout(() => {
                if (scoreElement.style) {
                    scoreElement.style.animation = '';
                }
            }, 500);
        }
        
        // Animate number change
        const currentScore = parseInt(scoreElement.textContent) || 0;
        Utils.animateValue(scoreElement, currentScore, newScore, 300);
    }

    animateCatMovement(catElement, direction) {
        if (!catElement) return;
        
        const moveDistance = 5;
        let transform = '';
        
        switch (direction) {
            case 'up':
                transform = `translateY(-${moveDistance}px)`;
                break;
            case 'down':
                transform = `translateY(${moveDistance}px)`;
                break;
            case 'left':
                transform = `translateX(-${moveDistance}px) scaleX(-1)`;
                break;
            case 'right':
                transform = `translateX(${moveDistance}px)`;
                break;
        }
        
        catElement.style.transform = transform;
        catElement.style.transition = 'transform 0.2s ease-out';
        
        setTimeout(() => {
            if (catElement.style) {
                catElement.style.transform = '';
            }
        }, 200);
    }

    animateCatPounce(catElement) {
        if (!catElement) return;
        
        if (this.performanceMode !== 'low') {
            catElement.style.animation = 'pulse 0.5s ease-in-out';
            
            setTimeout(() => {
                if (catElement.style) {
                    catElement.style.animation = '';
                }
            }, 500);
        } else {
            // Simple scale animation for low performance
            catElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                if (catElement.style) {
                    catElement.style.transform = '';
                }
            }, 200);
        }
    }

    createFloatingText(x, y, text, color = '#ff6b6b', options = {}) {
        const textElement = Utils.createElement('div', 'floating-text');
        textElement.textContent = text;
        textElement.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: ${options.fontSize || '24px'};
            font-weight: bold;
            pointer-events: none;
            z-index: 1001;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            will-change: transform, opacity;
        `;
        
        document.body.appendChild(textElement);
        
        this.animations.push({
            startTime: Date.now(),
            duration: options.duration || 1500,
            update: (progress) => {
                if (!textElement.parentNode) return;
                
                const yOffset = -80 * progress;
                const opacity = 1 - progress;
                const scale = 1 + (progress * 0.2);
                
                textElement.style.transform = `translateY(${yOffset}px) scale(${scale})`;
                textElement.style.opacity = opacity;
            },
            onComplete: () => {
                if (textElement.parentNode) {
                    textElement.remove();
                }
            }
        });
        
        if (!this.isAnimating) {
            this.startAnimationLoop();
        }
    }

    createRippleEffect(element, x, y) {
        if (!element || this.performanceMode === 'low') return;
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        
        const ripple = Utils.createElement('div', 'ripple-effect');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            left: ${x - rect.left - size/2}px;
            top: ${y - rect.top - size/2}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
            z-index: 10;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }

    highlightCurrentCard(card) {
        // Remove highlight from all cards
        document.querySelectorAll('.card').forEach(c => {
            c.classList.remove('current-position');
        });
        
        // Add highlight to current card
        if (card) {
            card.classList.add('current-position');
            
            if (this.performanceMode === 'high') {
                this.pulseElement(card, '#ff6b6b', 500);
            }
        }
    }

    animateJokerReveal(cards) {
        if (!cards || cards.length === 0) return;
        
        cards.forEach((card, index) => {
            if (!card) return;
            
            setTimeout(() => {
                card.classList.add('flying');
                
                if (this.performanceMode !== 'low') {
                    // Create special joker particle effect
                    const rect = card.getBoundingClientRect();
                    this.createParticleBurst(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2,
                        this.performanceMode === 'high' ? 15 : 8,
                        { 
                            color: '#ffd700', 
                            speed: 5, 
                            life: 80,
                            shape: 'star'
                        }
                    );
                }
            }, index * 200);
        });
    }

    animatePeekMode(cards, duration = 4000) {
        if (!cards) return;
        
        const cardArray = Array.from(cards);
        
        cardArray.forEach((card, index) => {
            if (!card || card.classList.contains('flipped') || card.classList.contains('matched')) {
                return;
            }
            
            setTimeout(() => {
                card.style.opacity = '0.8';
                card.style.transform = 'scale(0.95)';
                card.textContent = card.dataset.symbol;
                card.style.background = 'linear-gradient(45deg, #74b9ff, #0984e3)';
                card.style.transition = 'all 0.3s ease';
            }, index * 50);
        });

        setTimeout(() => {
            cardArray.forEach(card => {
                if (!card || card.classList.contains('flipped') || card.classList.contains('matched')) {
                    return;
                }
                
                card.style.opacity = '';
                card.style.transform = '';
                card.textContent = '';
                card.style.background = '';
                card.style.transition = '';
            });
        }, duration);
    }

    animateAchievementUnlock(achievementElement) {
        if (!achievementElement) return;
        
        if (this.performanceMode !== 'low') {
            achievementElement.style.animation = 'bounceIn 0.6s ease-out';
            
            // Add glow effect
            achievementElement.style.boxShadow = '0 0 20px #ffd700';
            
            // Create celebration effect
            const rect = achievementElement.getBoundingClientRect();
            this.createParticleBurst(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                12,
                { color: '#ffd700', speed: 6, life: 100, shape: 'star' }
            );
            
            setTimeout(() => {
                if (achievementElement.style) {
                    achievementElement.style.boxShadow = '';
                    achievementElement.style.animation = '';
                }
            }, 2000);
        } else {
            // Simple highlight for low performance
            achievementElement.style.background = '#ffd700';
            setTimeout(() => {
                if (achievementElement.style) {
                    achievementElement.style.background = '';
                }
            }, 1000);
        }
    }

    animateGameOver(winnerText, isPlayer1Winner) {
        if (!winnerText) return;
        
        if (this.performanceMode !== 'low') {
            const colors = ['#ff6b6b', '#74b9ff', '#00b894', '#ffd700'];
            let colorIndex = 0;
            
            const colorCycle = setInterval(() => {
                if (winnerText.style) {
                    winnerText.style.color = colors[colorIndex];
                    colorIndex = (colorIndex + 1) % colors.length;
                }
            }, 300);
            
            setTimeout(() => {
                clearInterval(colorCycle);
                if (winnerText.style) {
                    winnerText.style.color = isPlayer1Winner ? '#ff6b6b' : '#74b9ff';
                }
            }, 2400);
            
            // Create celebration particles
            for (let i = 0; i < (this.performanceMode === 'high' ? 20 : 10); i++) {
                setTimeout(() => {
                    this.createParticle(
                        Math.random() * window.innerWidth,
                        -10,
                        {
                            color: Utils.getRandomElement(colors),
                            speed: Math.random() * 3 + 1,
                            life: 120,
                            size: Math.random() * 8 + 4,
                            shape: Math.random() > 0.5 ? 'star' : 'circle'
                        }
                    );
                }, i * 150);
            }
        }
    }

    animateMinigameCountdown(containerElement) {
        if (!containerElement) return Promise.resolve();
        
        return new Promise(resolve => {
            const countdown = ['3', '2', '1', 'GO!'];
            let index = 0;
            
            const countdownElement = Utils.createElement('div', 'countdown-display');
            countdownElement.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 4em;
                font-weight: bold;
                color: #ff6b6b;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                z-index: 1000;
                will-change: transform, opacity;
            `;
            
            containerElement.appendChild(countdownElement);
            
            const showNext = () => {
                if (index < countdown.length && countdownElement.parentNode) {
                    countdownElement.textContent = countdown[index];
                    
                    if (this.performanceMode !== 'low') {
                        countdownElement.style.animation = 'bounceIn 1s ease-out';
                    } else {
                        countdownElement.style.opacity = '0';
                        countdownElement.style.transform = 'translate(-50%, -50%) scale(0.5)';
                        setTimeout(() => {
                            if (countdownElement.style) {
                                countdownElement.style.opacity = '1';
                                countdownElement.style.transform = 'translate(-50%, -50%) scale(1)';
                                countdownElement.style.transition = 'all 0.3s ease';
                            }
                        }, 50);
                    }
                    
                    index++;
                    
                    if (index < countdown.length) {
                        setTimeout(showNext, 1000);
                    } else {
                        setTimeout(() => {
                            if (countdownElement.parentNode) {
                                countdownElement.remove();
                            }
                            resolve();
                        }, 1000);
                    }
                } else {
                    resolve();
                }
            };
            
            showNext();
        });
    }

    createTrailEffect(element, color = '#ff6b6b') {
        if (!element || this.performanceMode === 'low') return;
        
        const rect = element.getBoundingClientRect();
        const trail = Utils.createElement('div', 'trail-effect');
        
        trail.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: ${color};
            border-radius: 50%;
            opacity: 0.3;
            pointer-events: none;
            z-index: 999;
            transform: scale(1.2);
            transition: all 0.3s ease-out;
            will-change: transform, opacity;
        `;
        
        document.body.appendChild(trail);
        
        setTimeout(() => {
            if (trail.style) {
                trail.style.opacity = '0';
                trail.style.transform = 'scale(2)';
            }
        }, 50);
        
        setTimeout(() => {
            if (trail.parentNode) {
                trail.remove();
            }
        }, 350);
    }

    pulseElement(element, color = '#ff6b6b', duration = 1000) {
        if (!element || this.performanceMode === 'low') return;
        
        const originalBoxShadow = element.style.boxShadow;
        
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        element.style.setProperty('--pulse-color', color);
        
        setTimeout(() => {
            if (element.style) {
                element.style.animation = '';
                element.style.boxShadow = originalBoxShadow;
            }
        }, duration);
    }

    shakeElement(element, intensity = 5, duration = 500) {
        if (!element) return;
        
        if (this.performanceMode !== 'low') {
            element.style.animation = `shake ${duration}ms ease-in-out`;
            
            setTimeout(() => {
                if (element.style) {
                    element.style.animation = '';
                }
            }, duration);
        } else {
            // Simple flash for low performance
            element.style.background = '#ff7675';
            setTimeout(() => {
                if (element.style) {
                    element.style.background = '';
                }
            }, 200);
        }
    }

    fadeIn(element, duration = 500) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in`;
        
        setTimeout(() => {
            if (element.style) {
                element.style.opacity = '1';
            }
        }, 10);
        
        setTimeout(() => {
            if (element.style) {
                element.style.transition = '';
            }
        }, duration);
    }

    fadeOut(element, duration = 500) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                if (element.style) {
                    element.style.transition = '';
                }
                resolve();
            }, duration);
        });
    }

    setPerformanceMode(mode) {
        this.performanceMode = mode;
        
        switch (mode) {
            case 'low':
                this.maxParticles = 10;
                break;
            case 'high':
                this.maxParticles = 100;
                break;
            default:
                this.detectPerformanceMode();
        }
        
        console.log(`🎨 Graphics performance mode set to: ${this.performanceMode}`);
    }

    cleanup() {
        // Cancel animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove all particles
        this.particles.forEach(particle => {
            if (particle.element && particle.element.parentNode) {
                particle.element.remove();
            }
        });
        this.particles = [];
        
        // Clear all animations
        this.animations = [];
        this.effects = [];
        this.isAnimating = false;
        
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        console.log('🎨 Graphics system cleaned up');
    }

    getStatus() {
        return {
            performanceMode: this.performanceMode,
            particleCount: this.particles.length,
            animationCount: this.animations.length,
            isAnimating: this.isAnimating,
            maxParticles: this.maxParticles
        };
    }
}

// Global graphics manager instance
const graphics = new GraphicsManager();
