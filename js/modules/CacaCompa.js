// js/modules/CacaCompa.js - CACA COMPA ULTRA
// Sistema de notificaciones y mensajes - VERSIÓN CON THROTTLE

import CONFIG from '../config.js';

class CacaCompa {
  constructor(userId, groqApiKey = null, pLang = null, seedMessages = []) {
    this.userId = userId;
    this.groqApiKey = groqApiKey;
    this.pLang = pLang;
    this.seedMessages = seedMessages || [];
    this.isActive = true;
    this.toastInterval = null;
    this.messageHistory = [];
    this.toastCallbacks = [];
    this.vibrationEnabled = true;
    this.soundEnabled = true;
    this.audioContext = null;
    
    // CONTROL DE NOTIFICACIONES - REDUCIDO
    this.notificationFrequency = 90; // segundos entre notificaciones
    this.maxNotificationsPerMinute = 0.5; // Máximo 1 cada 2 minutos
    this.lastNotificationTime = 0;
    this.notificationCount = 0;
    this.notificationResetTime = Date.now();
    this.isNotificationCooldown = false;
    
    // Mensajes por defecto (reducidos)
    this.defaultMessages = [
      '¡Hola, campeón!',
      'El absurdo te hace más fuerte',
      'Eres un pro de la caca mental',
      '¡Dale caña a ese cerebro!',
      'La vida es un juego, juega bien',
      'Eres la leyenda de la estupidez',
      '¡Logro desbloqueado!',
      'El meta cambia, tú también',
      '¡GG WP! Bien jugado',
      'Tu CACA COMPA te quiere',
      'Sigue así, campeón de la caca',
      'El absurdo es el nuevo tryhard',
      'Eres el protagonista de esta partida',
      'Tu cerebro te agradece la caca mental',
      'La estupidez es la nueva inteligencia',
      'Cada caca mental te hace más fuerte',
      'El absurdo es el camino a la sabiduría'
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
    this.notificationFrequency = Math.max(60, seconds || 90);
  }

  setMaxNotificationsPerMinute(max) {
    this.maxNotificationsPerMinute = Math.max(0.3, max || 0.5);
  }

  canShowNotification() {
    const now = Date.now();
    
    // Resetear contador cada minuto
    if (now - this.notificationResetTime > 60000) {
      this.notificationCount = 0;
      this.notificationResetTime = now;
    }
    
    // Verificar frecuencia mínima
    if (now - this.lastNotificationTime < this.notificationFrequency * 1000) {
      return false;
    }
    
    // Verificar máximo por minuto
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
    
    // Añadir variación (menos agresiva)
    const prefixes = ['¡', '', '⚡ ', '💪 ', '✨ '];
    const suffixes = ['!', '!', ' 💩', ' 🎮'];
    
    let finalMessage = message;
    if (Math.random() > 0.5) {
      finalMessage = prefixes[Math.floor(Math.random() * prefixes.length)] + finalMessage;
    }
    if (Math.random() > 0.6) {
      finalMessage += suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    
    // Traducir a P-Lang
    if (this.pLang) {
      return this.pLang.translateMessage(finalMessage);
    }
    
    return finalMessage + ' 💩';
  }

  getMessageHistory() {
    return this.messageHistory.slice(-CONFIG.CACA_COMPA.MAX_MESSAGES_HISTORY);
  }

  // ============================================
  // MOSTRAR TOAST CON THROTTLE
  // ============================================
  showToast(message, callback, type = 'info') {
    if (!callback) return;
    
    // Verificar si podemos mostrar notificación
    if (!this.canShowNotification()) {
      console.log('⏳ Notificación en cooldown, omitiendo:', message);
      return null;
    }
    
    const msg = message || this.getRandomMessage();
    
    // Actualizar contadores
    this.lastNotificationTime = Date.now();
    this.notificationCount++;
    
    // Guardar en historial
    this.messageHistory.push({
      message: msg,
      timestamp: Date.now(),
      type: type
    });
    
    // Llamar callback
    callback(msg, type);
    
    // Efectos (reducidos)
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
    } catch (e) {
      // Silenciar errores
    }
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
  // NOTIFICACIONES PERIÓDICAS (REDUCIDAS)
  // ============================================
  startPeriodicNotifications(callback, frequency = 90) {
    if (this.toastInterval) clearInterval(this.toastInterval);
    
    this.setNotificationFrequency(frequency);
    this.toastCallbacks = [];
    if (callback) {
      this.toastCallbacks.push(callback);
    }
    
    // Usar frecuencia reducida (mínimo 60 segundos)
    const actualFrequency = Math.max(60, frequency);
    
    this.toastInterval = setInterval(() => {
      if (this.isActive && this.canShowNotification()) {
        // Solo 30% de probabilidad de notificación cuando toca
        if (Math.random() < 0.3) {
          if (this.toastCallbacks.length > 0) {
            const cb = this.toastCallbacks[Math.floor(Math.random() * this.toastCallbacks.length)];
            this.showToast(null, cb);
          }
        }
      }
    }, actualFrequency * 1000);
    
    console.log(`🔔 CACA COMPA: Notificaciones cada ${actualFrequency}s (${this.maxNotificationsPerMinute}/min)`);
    
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
  // GROQ INTEGRATION
  // ============================================
  async getGroqMessage(prompt) {
    if (!this.groqApiKey) return null;
    
    try {
      const response = await fetch('/api/groq-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: this.groqApiKey,
          prompt: prompt || 'Dame un mensaje motivador y absurdo para un gamer'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.message) {
        if (this.pLang) {
          return this.pLang.translateMessage(data.message);
        }
        return data.message;
      }
      
      return null;
    } catch (error) {
      console.error('Groq error:', error);
      return null;
    }
  }

  async getPersonalizedMessage(prompt = null) {
    // Reducir llamadas a Groq (solo 10% de probabilidad)
    if (this.groqApiKey && Math.random() > 0.9) {
      const groqMsg = await this.getGroqMessage(prompt);
      if (groqMsg) return groqMsg;
    }
    
    return this.getRandomMessage();
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