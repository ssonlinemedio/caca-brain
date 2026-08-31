// js/modules/CacaCompa.js - CACA COMPA ULTRA
// Sistema de notificaciones y mensajes - VERSIÓN CORREGIDA

import CONFIG from '../config.js';

class CacaCompa {
    constructor(userId, groqApiKey = null, pLang = null, seedMessages = []) {
        this.userId = userId;
        this.groqApiKey = groqApiKey;
        this.pLang = pLang;  // ← Traductor Idioma P
        this.seedMessages = seedMessages || [];
        this.isActive = true;
        this.toastInterval = null;
        this.messageHistory = [];
        this.toastCallbacks = [];
        this.vibrationEnabled = true;
        this.soundEnabled = true;
        this.audioContext = null;
        
        // Control de notificaciones
        this.notificationFrequency = 35; // segundos entre notificaciones
        this.maxNotificationsPerMinute = 0.3;
        this.lastNotificationTime = 0;
        this.notificationCount = 0;
        this.notificationResetTime = Date.now();
        this.isNotificationCooldown = false;
        
        // Mensajes por defecto (en español, se traducen al mostrar)
        this.defaultMessages = [
            '¡Hola, campeón!',
            '¡Qué bien te ves hoy!',
            'El absurdo te hace más fuerte',
            'Eres un pro de la caca mental',
            '¡Dale caña a ese cerebro!',
            'La vida es un juego, juega bien',
            'No pares de crear caca mental',
            'Eres la leyenda de la estupidez',
            '¡Logro desbloqueado!',
            'Sube el nivel de tu absurdez',
            'El meta cambia, tú también',
            '¡GG WP! Bien jugado',
            'Tu CACA COMPA te quiere',
            'Sigue así, campeón de la caca',
            'El absurdo es el nuevo tryhard',
            'Eres el protagonista de esta partida',
            '¡La caca mental es el nuevo meta!',
            'No te rindas, el absurdo te necesita',
            'Tu cerebro te agradece la caca mental',
            'La estupidez es la nueva inteligencia',
            'Eres el meme que el mundo necesita',
            'Tu CACA COMPA cree en ti',
            'Cada caca mental te hace más fuerte',
            'El absurdo es el camino a la sabiduría',
            'Sé tú mismo, aunque seas absurdo',
            'La creatividad nace del caos mental',
            'Tú puedes con cualquier caca que te propongas',
            'El absurdo es la clave de la felicidad',
            'Eres más fuerte de lo que crees',
            'La caca mental te hará invencible'
        ];
        
        // Combinar mensajes
        this.allMessages = [...this.defaultMessages, ...this.seedMessages];
        
        this.setupAudio();
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio no disponible');
        }
    }

    // ============================================
    // CONFIGURACIÓN DE NOTIFICACIONES
    // ============================================
    setNotificationFrequency(seconds) {
        this.notificationFrequency = Math.max(30, seconds || 35);
    }

    setMaxNotificationsPerMinute(max) {
        this.maxNotificationsPerMinute = Math.max(0.2, max || 0.3);
    }

    canShowNotification() {
        const now = Date.now();
        
        if (now - this.notificationResetTime > 60000) {
            this.notificationCount = 0;
            this.notificationResetTime = now;
        }
        
        if (now - this.lastNotificationTime < this.notificationFrequency * 1000) {
            return false;
        }
        
        if (this.notificationCount >= this.maxNotificationsPerMinute) {
            return false;
        }
        
        return true;
    }

    // ============================================
    // OBTENER MENSAJE ALEATORIO
    // ============================================
    getRandomMessage() {
        const message = this.allMessages[Math.floor(Math.random() * this.allMessages.length)];
        
        // Añadir variación
        const prefixes = ['¡', '', '⚡ ', '💪 ', '✨ ', '🎮 ', '🔥 '];
        const suffixes = ['!', '!', ' 💩', ' 🎮', ' 🚀'];
        
        let finalMessage = message;
        if (Math.random() > 0.4) {
            finalMessage = prefixes[Math.floor(Math.random() * prefixes.length)] + finalMessage;
        }
        if (Math.random() > 0.5) {
            finalMessage += suffixes[Math.floor(Math.random() * suffixes.length)];
        }
        
        return finalMessage;
    }

    // ============================================
    // OBTENER MENSAJE EN IDIOMA P
    // ============================================
    getMessageInPLang() {
        const message = this.getRandomMessage();
        
        // Traducir a P-Lang si el traductor está disponible
        if (this.pLang) {
            return this.pLang.translateMessage(message);
        }
        
        return message + ' 💩';
    }

    getMessageHistory() {
        return this.messageHistory.slice(-CONFIG.CACA_COMPA.MAX_MESSAGES_HISTORY);
    }

    // ============================================
    // MOSTRAR TOAST CON THROTTLE
    // ============================================
    showToast(message, callback, type = 'caca-compa') {
        if (!callback) return;
        
        if (!this.canShowNotification()) {
            console.log('⏳ Notificación en cooldown, omitiendo:', message);
            return null;
        }
        
        // Obtener mensaje en Idioma P
        let msg = message || this.getMessageInPLang();
        
        // Si el mensaje no está ya en Idioma P, traducirlo
        if (this.pLang && !msg.includes('p')) {
            // Verificar si ya tiene el formato de Idioma P
            const hasPFormat = /[aeiou]p[aeiou]/i.test(msg);
            if (!hasPFormat) {
                msg = this.pLang.translateMessage(msg);
            }
        }
        
        // Actualizar contadores
        this.lastNotificationTime = Date.now();
        this.notificationCount++;
        
        // Guardar en historial
        this.messageHistory.push({
            message: msg,
            original: message || this.getRandomMessage(),
            timestamp: Date.now(),
            type: type
        });
        
        // Llamar callback
        callback(msg, type);
        
        // Efectos
        if (Math.random() > 0.5) {
            this.playNotificationSound();
        }
        if (Math.random() > 0.5) {
            this.vibrate();
        }
        
        return msg;
    }

    // ============================================
    // SONIDOS
    // ============================================
    playNotificationSound() {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioContext) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (e) {}
    }

    playCacaSound() {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioContext) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (e) {}
    }

    playAchievementSound() {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioContext) return;
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.15);
                osc.start(this.audioContext.currentTime + i * 0.1);
                osc.stop(this.audioContext.currentTime + i * 0.1 + 0.15);
            });
        } catch (e) {}
    }

    // ============================================
    // VIBRACIÓN
    // ============================================
    vibrate() {
        if (this.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate([30, 20, 30]);
        }
    }

    // ============================================
    // NOTIFICACIONES PERIÓDICAS
    // ============================================
    startPeriodicNotifications(callback, frequency = 35) {
        if (this.toastInterval) clearInterval(this.toastInterval);
        
        this.setNotificationFrequency(frequency);
        this.toastCallbacks = [];
        if (callback) {
            this.toastCallbacks.push(callback);
        }
        
        const actualFrequency = Math.max(30, frequency);
        
        this.toastInterval = setInterval(() => {
            if (this.isActive && this.canShowNotification()) {
                if (this.toastCallbacks.length > 0) {
                    const cb = this.toastCallbacks[Math.floor(Math.random() * this.toastCallbacks.length)];
                    this.showToast(null, cb);
                }
            }
        }, actualFrequency * 1000);
        
        console.log(`🔔 CACA COMPA: Notificaciones cada ${actualFrequency}s en Idioma P`);
        
        return this.toastInterval;
    }

    addCallback(callback) {
        if (callback && typeof callback === 'function') {
            this.toastCallbacks.push(callback);
        }
    }

    stopNotifications() {
        if (this.toastInterval) {
            clearInterval(this.toastInterval);
            this.toastInterval = null;
        }
    }

    // ============================================
    // CONFIGURACIÓN
    // ============================================
    setVibrationEnabled(enabled) {
        this.vibrationEnabled = enabled;
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    // ============================================
    // DESTRUCCIÓN
    // ============================================
    destroy() {
        this.stopNotifications();
        this.toastCallbacks = [];
        this.messageHistory = [];
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {}
        }
    }
}

export default CacaCompa;