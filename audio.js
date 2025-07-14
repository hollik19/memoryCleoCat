// Audio.js - Sound effects and music system optimized for mobile

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.music = {};
        this.isMuted = false;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        this.isInitialized = false;
        this.userInteracted = false;
        this.musicTracks = {};
        this.init();
    }

    init() {
        // Load settings from localStorage
        const savedSettings = Utils.loadFromLocalStorage('audioSettings', {});
        this.isMuted = savedSettings.isMuted || false;
        this.musicVolume = savedSettings.musicVolume !== undefined ? savedSettings.musicVolume : 0.3;
        this.sfxVolume = savedSettings.sfxVolume !== undefined ? savedSettings.sfxVolume : 0.5;

        // Initialize audio on first user interaction
        this.setupUserInteractionListener();
    }

    setupUserInteractionListener() {
        const initAudio = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                this.initializeAudio();
                
                // Remove listeners after first interaction
                document.removeEventListener('touchstart', initAudio);
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            }
        };

        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    }

    initializeAudio() {
        try {
            // Try to initialize Web Audio API
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.createSounds();
                this.isInitialized = true;
                console.log('🔊 Audio system initialized');
            }
        } catch (e) {
            console.warn('Web Audio API not supported, using fallback sounds');
            this.createFallbackSounds();
        }
    }

    createSounds() {
        if (!this.audioContext) return;

        this.sounds = {
            cardFlip: () => this.playTone(440, 'square', 0.1),
            cardMatch: () => this.playChord([523, 659, 784], 0.3),
            cardMiss: () => this.playDownwardTone(200, 100, 0.3),
            catMeow: () => this.playCatMeow(),
            catPurr: () => this.playCatPurr(),
            catDisappoint: () => this.playDownwardTone(400, 200, 0.5),
            buttonClick: () => this.playTone(800, 'square', 0.1),
            achievementUnlock: () => this.playAchievementFanfare(),
            minigameStart: () => this.playRisingTone(1000, 1500, 0.2),
            mouseCatch: () => this.playTone(1200, 'square', 0.15),
            gameWin: () => this.playVictoryFanfare(),
            peek: () => this.playMagicSound(),
            numberInput: () => this.playTone(600, 'sine', 0.1),
            mathCorrect: () => this.playChord([440, 554, 659], 0.4),
            mathWrong: () => this.playErrorSound()
        };
    }

    createFallbackSounds() {
        // Create simple beep sounds using Audio elements
        const createBeep = (frequency, duration) => {
            return () => {
                if (this.isMuted) return;
                
                // Create a simple oscillator tone using data URI
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            };
        };

        this.sounds = {
            cardFlip: createBeep(440, 0.1),
            cardMatch: createBeep(523, 0.3),
            cardMiss: createBeep(200, 0.3),
            catMeow: createBeep(800, 0.4),
            catPurr: createBeep(100, 1.0),
            catDisappoint: createBeep(300, 0.5),
            buttonClick: createBeep(800, 0.1),
            achievementUnlock: createBeep(1000, 0.5),
            minigameStart: createBeep(1000, 0.2),
            mouseCatch: createBeep(1200, 0.15),
            gameWin: createBeep(1319, 0.5),
            peek: createBeep(600, 0.3),
            numberInput: createBeep(500, 0.1),
            mathCorrect: createBeep(659, 0.4),
            mathWrong: createBeep(150, 0.4)
        };
    }

    playTone(frequency, type = 'sine', duration = 0.2, volume = null) {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;

            const vol = volume !== null ? volume : this.sfxVolume;
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(vol * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Failed to play tone:', e);
        }
    }

    playChord(frequencies, duration = 0.3) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', duration);
            }, index * 50);
        });
    }

    playDownwardTone(startFreq, endFreq, duration) {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            oscillator.type = 'sawtooth';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Failed to play downward tone:', e);
        }
    }

    playRisingTone(startFreq, endFreq, duration) {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Failed to play rising tone:', e);
        }
    }

    playCatMeow() {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
            oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.4);
            oscillator.type = 'sawtooth';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.4);
        } catch (e) {
            console.warn('Failed to play cat meow:', e);
        }
    }

    playCatPurr() {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            const gainNode = this.audioContext.createGain();

            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.type = 'sawtooth';

            lfo.frequency.setValueAtTime(20, this.audioContext.currentTime);
            lfoGain.gain.setValueAtTime(20, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.0);

            lfo.start();
            oscillator.start();
            lfo.stop(this.audioContext.currentTime + 1.0);
            oscillator.stop(this.audioContext.currentTime + 1.0);
        } catch (e) {
            console.warn('Failed to play cat purr:', e);
        }
    }

    playAchievementFanfare() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.4);
            }, index * 150);
        });
    }

    playVictoryFanfare() {
        const melody = [523, 659, 784, 1047, 1319]; // C, E, G, C, E
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.3);
            }, index * 200);
        });
    }

    playMagicSound() {
        if (!this.audioContext || this.isMuted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
            oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
            oscillator.type = 'triangle';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (e) {
            console.warn('Failed to play magic sound:', e);
        }
    }

    playErrorSound() {
        // Play three descending tones for error
        const frequencies = [400, 300, 200];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.2);
            }, index * 100);
        });
    }

    // Background music using simple melodies
    createBackgroundMusic(tempo = 120, melody = null) {
        if (!this.audioContext || this.isMuted) return null;

        const beatDuration = 60 / tempo;
        const defaultMelody = [523, 659, 523, 392, 440, 523, 440, 392]; // Simple melody
        const notes = melody || defaultMelody;
        let currentNote = 0;
        let musicInterval;

        const playNote = () => {
            if (this.isMuted || !this.audioContext) return;
            
            const freq = notes[currentNote];
            this.playTone(freq, 'sine', beatDuration * 0.8, this.musicVolume * 0.2);
            
            currentNote = (currentNote + 1) % notes.length;
        };

        musicInterval = setInterval(playNote, beatDuration * 1000);
        return musicInterval;
    }

    playSound(soundName) {
        if (!this.userInteracted) {
            // Queue the sound to play after user interaction
            setTimeout(() => this.playSound(soundName), 100);
            return;
        }

        if (this.sounds[soundName] && !this.isMuted) {
            try {
                this.sounds[soundName]();
                
                // Add haptic feedback on mobile for important sounds
                if (Utils.isTouchDevice()) {
                    const hapticSounds = ['cardMatch', 'achievementUnlock', 'gameWin', 'mouseCatch'];
                    if (hapticSounds.includes(soundName)) {
                        Utils.vibrate([50]);
                    } else {
                        Utils.vibrate([30]);
                    }
                }
            } catch (e) {
                console.warn(`Failed to play sound ${soundName}:`, e);
            }
        }
    }

    startMusic(type = 'game') {
        this.stopMusic();
        
        if (!this.userInteracted || this.isMuted) return;

        try {
            switch (type) {
                case 'title':
                    this.currentMusic = this.createBackgroundMusic(80, [392, 523, 659, 523, 440, 392, 330, 392]);
                    break;
                case 'game':
                    this.currentMusic = this.createBackgroundMusic(100, [523, 659, 523, 392, 440, 523, 440, 392]);
                    break;
                case 'minigame':
                    this.currentMusic = this.createBackgroundMusic(140, [659, 784, 880, 784, 659, 523, 440, 523]);
                    break;
                default:
                    this.currentMusic = this.createBackgroundMusic(100);
            }
        } catch (e) {
            console.warn('Failed to start music:', e);
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            clearInterval(this.currentMusic);
            this.currentMusic = null;
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.stopMusic();
        }
        this.saveSettings();
        
        // Show feedback
        Utils.showNotification(
            muted ? '🔇 Audio muted' : '🔊 Audio enabled',
            'info',
            1500
        );
    }

    toggleMute() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }

    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
        this.saveSettings();
    }

    setSfxVolume(volume) {
        this.sfxVolume = Utils.clamp(volume, 0, 1);
        this.saveSettings();
    }

    getMuted() {
        return this.isMuted;
    }

    getMusicVolume() {
        return this.musicVolume;
    }

    getSfxVolume() {
        return this.sfxVolume;
    }

    saveSettings() {
        Utils.saveToLocalStorage('audioSettings', {
            isMuted: this.isMuted,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume
        });
    }

    // Resume audio context (required for mobile browsers)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => {
                console.warn('Failed to resume audio context:', e);
            });
        }
    }

    // Cleanup method
    cleanup() {
        this.stopMusic();
        
        if (this.audioContext) {
            this.audioContext.close().catch(e => {
                console.warn('Failed to close audio context:', e);
            });
        }
    }

    // Get audio system status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            userInteracted: this.userInteracted,
            isMuted: this.isMuted,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable',
            musicPlaying: !!this.currentMusic
        };
    }

    // Test audio system
    testAudio() {
        console.log('🔊 Testing audio system...');
        console.log('Status:', this.getStatus());
        
        if (this.userInteracted) {
            this.playSound('buttonClick');
            Utils.showNotification('Audio test played', 'success');
        } else {
            Utils.showNotification('Please interact with the page first', 'info');
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
