// js/modules/UIManager.js - CACA BRAIN ULTRA v2.0
// ¡Con nuevas funcionalidades absurdas!

import CONFIG from '../config.js';

class UIManager {
  constructor() {
    this.elements = {};
    this.currentScreen = 'register';
    this.bindings = {};
    this.pLang = null;
    this.toasterContainer = null;
    this.isInitialized = false;
    this.particleSystem = null;
    this.soundEnabled = true;
    this.vibrationEnabled = true;
    this.isAnimating = false;
    
    // Sistema de efectos visuales
    this.effects = {
      confetti: [],
      particles: [],
      rainbows: [],
      explosions: []
    };
    
    // Control de notificaciones - COLA DE MENSAJES
    this.notificationQueue = [];
    this.isProcessingNotification = false;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 3000; // 3 segundos entre notificaciones
    this.maxQueueSize = 3;
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.createToasterContainer();
    this.createParticleSystem();
    this.hideAllScreens();
    this.showScreen('register');
    this.isInitialized = true;
    
    // Inicializar fondo animado
    this.initBackgroundAnimation();
    
    return this;
  }

  // ============================================
  // FONDO ANIMADO
  // ============================================
  initBackgroundAnimation() {
    // Añadir estilos de animación si no existen
    if (!document.getElementById('cacaBrainStyles')) {
      const style = document.createElement('style');
      style.id = 'cacaBrainStyles';
      style.textContent = `
        @keyframes floatBg {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -10px) scale(1.02); }
          50% { transform: translate(-5px, 15px) scale(0.98); }
          75% { transform: translate(-15px, -5px) scale(1.01); }
        }
        
        @keyframes cacaExplosion {
          0% { transform: translate(0, 0) rotate(0deg) scale(0.5); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1.5); opacity: 0; }
        }
        
        @keyframes absurdParticle {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
          100% { transform: translate(${Math.random() > 0.5 ? '+' : '-'}${100 + Math.random() * 200}px, ${Math.random() > 0.5 ? '+' : '-'}${100 + Math.random() * 200}px) scale(2) rotate(720deg); opacity: 0; }
        }
        
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        @keyframes numberPop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes achievementPulse {
          0%, 100% { transform: scale(1); border-color: #FFD700; }
          50% { transform: scale(1.02); border-color: #FF6B6B; box-shadow: 0 0 40px rgba(255, 215, 0, 0.5); }
        }
        
        @keyframes rainbowBg {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        
        .rainbow-mode {
          animation: rainbowBg 5s linear infinite;
        }
        
        .thought-absurd-max {
          border-color: #9C27B0 !important;
          box-shadow: 0 0 40px rgba(156, 39, 176, 0.4) !important;
        }
        
        .thought-absurd-high {
          border-color: #FF6B6B !important;
          box-shadow: 0 0 30px rgba(255, 107, 107, 0.3) !important;
        }
        
        .thought-absurd-low {
          border-color: #4CAF50 !important;
          box-shadow: 0 0 20px rgba(76, 175, 80, 0.2) !important;
        }
        
        .achievement-toast {
          border-color: #FFD700 !important;
          background: linear-gradient(135deg, #1a1a2e, #2d1b69) !important;
          box-shadow: 0 0 60px rgba(255, 215, 0, 0.3) !important;
          min-width: 300px !important;
        }
        
        .achievement-badge {
          display: inline-block;
          background: #FFD700;
          color: #1a1a2e;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          margin-top: 5px;
          animation: bounce 1s infinite;
        }
        
        .vigia-absurdity {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .vigia-absurdity span {
          font-size: 12px;
          color: #aaa;
        }
        
        .vigia-bar {
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }
        
        .vigia-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s;
        }
        
        .mini-bar {
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin-top: 3px;
          overflow: hidden;
        }
        
        .mini-bar div {
          height: 100%;
          background: linear-gradient(90deg, #ffd93d, #ff6b6b);
          border-radius: 2px;
          transition: width 0.5s;
        }
        
        /* Feedback visual classes */
        .thought-bubble.feedback-success {
          border-color: #4CAF50 !important;
          background: rgba(76, 175, 80, 0.25) !important;
          transform: scale(1.05);
          transition: all 0.3s ease;
        }
        
        .thought-bubble.feedback-error {
          border-color: #ff1744 !important;
          background: rgba(255, 23, 68, 0.2) !important;
          transform: scale(0.95);
          transition: all 0.3s ease;
        }
        
        .thought-bubble.feedback-caca {
          border-color: #ff6b6b !important;
          background: rgba(255, 107, 107, 0.2) !important;
          transform: scale(1.05) rotate(-1deg);
          transition: all 0.3s ease;
        }
        
        .thought-bubble.feedback-brain {
          border-color: #4d96ff !important;
          background: rgba(77, 150, 255, 0.2) !important;
          transform: scale(1.05) rotate(1deg);
          transition: all 0.3s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }

  cacheElements() {
    this.elements = {
      screens: {
        register: document.getElementById('registerScreen'),
        game: document.getElementById('gameScreen'),
        stats: document.getElementById('statsScreen'),
        settings: document.getElementById('settingsScreen'),
        achievements: document.getElementById('achievementsScreen'),
        ranking: document.getElementById('rankingScreen')
      },
      buttons: {
        startGame: document.getElementById('startGameBtn'),
        voteCaca: document.getElementById('voteCaca'),
        voteCerebro: document.getElementById('voteCerebro'),
        showStats: document.getElementById('showStats'),
        showSettings: document.getElementById('showSettings'),
        showAchievements: document.getElementById('showAchievements'),
        showRanking: document.getElementById('showRanking'),
        shareResult: document.getElementById('shareResult'),
        resetGame: document.getElementById('resetGame'),
        cacaExplosion: document.getElementById('cacaExplosion'),
        rainbowMode: document.getElementById('rainbowMode'),
        absurdParticle: document.getElementById('absurdParticle')
      },
      displays: {
        thought: document.getElementById('thoughtDisplay'),
        score: document.getElementById('scoreDisplay'),
        level: document.getElementById('levelDisplay'),
        xp: document.getElementById('xpDisplay'),
        streak: document.getElementById('streakDisplay'),
        cacaCount: document.getElementById('cacaCount'),
        cerebroCount: document.getElementById('cerebroCount'),
        username: document.getElementById('usernameDisplay'),
        vigiaStatus: document.getElementById('vigiaStatus'),
        xpFill: document.getElementById('xpFill'),
        absurdDisplay: document.getElementById('absurdDisplay'),
        totalCaca: document.getElementById('totalCaca'),
        cacaPerMinute: document.getElementById('cacaPerMinute'),
        absurdLevelDisplay: document.getElementById('absurdLevelDisplay'),
        neuroScore: document.getElementById('neuroScore'),
        playTime: document.getElementById('playTime'),
        nextAchievement: document.getElementById('nextAchievement'),
        rcnStatus: document.getElementById('rcnStatus'),
        rcnProgress: document.getElementById('rcnProgress'),
        rcnLabel: document.getElementById('rcnLabel')
      },
      inputs: {
        username: document.getElementById('usernameInput'),
        absurdLevel: document.getElementById('absurdLevelInput'),
        groqKey: document.getElementById('groqKeyInput'),
        notifications: document.getElementById('notificationsToggle'),
        vibration: document.getElementById('vibrationToggle'),
        sound: document.getElementById('soundToggle'),
        pLang: document.getElementById('pLangToggle'),
        particleEffects: document.getElementById('particleEffects'),
        rainbowBackground: document.getElementById('rainbowBackground'),
        cacaSounds: document.getElementById('cacaSounds')
      },
      effectsContainers: {
        particles: document.getElementById('particleContainer'),
        rainbows: document.getElementById('rainbowContainer'),
        explosions: document.getElementById('explosionContainer')
      }
    };
  }

  setupEventListeners() {
    // Botones de navegación
    this.bind('startGameBtn', 'click', () => this.trigger('startGame'));
    this.bind('voteCaca', 'click', () => this.trigger('vote', 'caca'));
    this.bind('voteCerebro', 'click', () => this.trigger('vote', 'cerebro'));
    this.bind('showStats', 'click', () => this.showScreen('stats'));
    this.bind('showSettings', 'click', () => this.showScreen('settings'));
    this.bind('showAchievements', 'click', () => this.showScreen('achievements'));
    this.bind('showRanking', 'click', () => this.showScreen('ranking'));
    this.bind('shareResult', 'click', () => this.trigger('share'));
    this.bind('resetGame', 'click', () => this.trigger('reset'));
    
    this.bind('cacaExplosion', 'click', () => this.cacaExplosionEffect());
    this.bind('rainbowMode', 'click', () => this.toggleRainbowMode());
    this.bind('absurdParticle', 'click', () => this.absurdParticleEffect());

    // Slider de absurdez
    const slider = this.elements.inputs.absurdLevel;
    if (slider) {
      slider.addEventListener('input', (e) => {
        const display = this.elements.displays.absurdDisplay;
        if (display) {
          display.textContent = e.target.value + '%';
        }
        this.updateAbsurdColor(e.target.value);
      });
    }

    // Botones de retroceso
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showScreen('game');
      });
    });
  }

  bind(id, event, handler) {
    const el = this.elements.buttons[id] || 
               this.elements.displays[id] || 
               document.getElementById(id);
    
    if (el) {
      el.addEventListener(event, handler);
      if (!this.bindings[id]) this.bindings[id] = {};
      this.bindings[id][event] = handler;
    }
  }

  // ============================================
  // TOASTER CON COLA DE MENSAJES
  // ============================================
  createToasterContainer() {
    this.toasterContainer = document.getElementById('toasterContainer');
    if (!this.toasterContainer) {
      this.toasterContainer = document.createElement('div');
      this.toasterContainer.id = 'toasterContainer';
      document.body.appendChild(this.toasterContainer);
    }
  }

  // Método principal para mostrar toast con COLA
  showToast(message, type = 'info', duration = 4000) {
    // Si es un logro, mostrarlo siempre (prioridad alta)
    if (type === 'achievement') {
      this.showToastImmediate(message, type, duration);
      return;
    }
    
    // Encolar mensaje
    this.enqueueNotification(message, type, duration);
  }

  // Encolar notificación
  enqueueNotification(message, type, duration) {
    // Verificar si ya hay demasiados mensajes en cola
    if (this.notificationQueue.length >= this.maxQueueSize) {
      // Reemplazar el más antiguo
      this.notificationQueue.shift();
    }
    
    this.notificationQueue.push({ message, type, duration });
    this.processNotificationQueue();
  }

  // Procesar cola de notificaciones
  processNotificationQueue() {
    if (this.isProcessingNotification) return;
    if (this.notificationQueue.length === 0) return;
    
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      // Esperar al cooldown
      setTimeout(() => {
        this.processNotificationQueue();
      }, this.notificationCooldown - (now - this.lastNotificationTime) + 100);
      return;
    }
    
    this.isProcessingNotification = true;
    const next = this.notificationQueue.shift();
    
    if (next) {
      this.showToastImmediate(next.message, next.type, next.duration);
      this.lastNotificationTime = Date.now();
      
      setTimeout(() => {
        this.isProcessingNotification = false;
        // Procesar siguiente después de cooldown
        setTimeout(() => {
          this.processNotificationQueue();
        }, this.notificationCooldown);
      }, 500);
    } else {
      this.isProcessingNotification = false;
    }
  }

  // Mostrar toast inmediatamente (sin cola)
  showToastImmediate(message, type = 'info', duration = 4000) {
    if (!this.toasterContainer) {
      this.createToasterContainer();
    }
    
    const isAchievement = type === 'achievement';
    const isCaca = message.includes('CACA') || message.includes('💩');
    
    const toast = document.createElement('div');
    toast.className = `toaster-notification ${type} ${isAchievement ? 'achievement-toast' : ''}`;
    
    const iconMap = {
      info: '💩',
      success: '🎮',
      error: '⚠️',
      warning: '⚡',
      achievement: '🏆',
      caca: '💩',
      brain: '🧠',
      absurd: '🤪'
    };
    
    let icon = iconMap[type] || '💩';
    if (isCaca && type !== 'achievement') {
      const cacaEmojis = ['💩', '💨', '🔥', '⚡', '🌟', '💫', '🎯'];
      icon = cacaEmojis[Math.floor(Math.random() * cacaEmojis.length)];
    }
    
    let title = 'CACA COMPA';
    if (isAchievement) title = '🏆 ¡LOGRO!';
    if (isCaca && !isAchievement) title = '💩 CACA COMPA';
    
    toast.innerHTML = `
      <div class="toaster-content">
        <span class="toaster-icon" style="animation: bounce ${1 + Math.random() * 0.5}s infinite">${icon}</span>
        <div class="toaster-text">
          <strong>${title}</strong>
          <p>${message}</p>
          ${isAchievement ? '<span class="achievement-badge">✨ NUEVO</span>' : ''}
        </div>
        <button class="toaster-close">✕</button>
      </div>
    `;
    
    if (isAchievement) {
      this.playAchievementSound();
      this.showConfetti(50);
      toast.style.animation = 'slideInRight 0.5s, achievementPulse 1s 3';
    }
    
    if (isCaca && !isAchievement && Math.random() > 0.7) {
      this.playCacaSound();
    }
    
    this.toasterContainer.appendChild(toast);
    
    toast.querySelector('.toaster-close').addEventListener('click', () => {
      this.closeToast(toast);
    });
    
    const toastDuration = isAchievement ? duration * 2 : duration;
    if (toastDuration > 0) {
      setTimeout(() => {
        this.closeToast(toast);
      }, toastDuration);
    }
    
    return toast;
  }

  closeToast(toast) {
    if (toast && toast.parentElement) {
      toast.style.animation = 'slideOutRight 0.5s';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 500);
    }
  }

  clearToasts() {
    if (this.toasterContainer) {
      this.toasterContainer.innerHTML = '';
    }
    this.notificationQueue = [];
    this.isProcessingNotification = false;
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  showScreen(screenName) {
    this.hideAllScreens();
    const screen = this.elements.screens[screenName];
    if (screen) {
      screen.style.display = 'block';
      screen.style.animation = 'fadeIn 0.5s';
      this.currentScreen = screenName;
    }
  }

  hideAllScreens() {
    Object.values(this.elements.screens).forEach(screen => {
      if (screen) {
        screen.style.display = 'none';
        screen.style.animation = '';
      }
    });
  }

  // ============================================
  // UPDATE UI
  // ============================================
  updateGameUI(gameState, vigiaStatus) {
    if (!gameState) return;
    
    // Actualizar displays principales
    this.updateElement('scoreDisplay', gameState.score || 0);
    this.updateElement('levelDisplay', gameState.level || 1);
    this.updateElement('xpDisplay', gameState.xp || 0);
    this.updateElement('streakDisplay', gameState.streak || 0);
    this.updateElement('cacaCount', gameState.cacaPoints || 0);
    this.updateElement('cerebroCount', gameState.brainPoints || 0);
    
    // Contadores extra
    this.updateElement('totalCaca', (gameState.cacaPoints || 0) + (gameState.brainPoints || 0));
    this.updateElement('absurdLevelDisplay', Math.round(gameState.absurdLevel || 50) + '%');
    
    // NeuroScore
    const neuroScore = Math.round(
      ((gameState.cacaPoints || 0) * 0.3 + 
       (gameState.brainPoints || 0) * 0.2 + 
       (gameState.streak || 0) * 0.5) * 10
    );
    this.updateElement('neuroScore', Math.min(100, neuroScore));
    
    // Tiempo de juego
    if (gameState.startTime) {
      const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.updateElement('playTime', `${minutes}m ${seconds}s`);
    }
    
    // Actualizar barra de XP
    this.updateXPBar(gameState.xp || 0);
    
    // Actualizar Vigía
    if (vigiaStatus) {
      this.updateVigiaStatus(vigiaStatus);
    }
    
    // Actualizar próximo logro
    this.updateNextAchievement(gameState);
    
    // Actualizar RCN
    this.updateRCNStatus(gameState);
  }

  updateElement(id, value) {
    let el = document.getElementById(id);
    
    if (!el) {
      el = this.elements?.displays?.[id] || null;
    }
    
    if (el) {
      const oldValue = el.textContent;
      if (oldValue !== String(value) && !isNaN(value) && el.classList.contains('number-animate')) {
        el.style.animation = 'numberPop 0.3s';
        setTimeout(() => { el.style.animation = ''; }, 300);
      }
      el.textContent = value;
      return true;
    }
    
    return false;
  }

  updateElements(elements) {
    for (const [id, value] of Object.entries(elements)) {
      this.updateElement(id, value);
    }
  }

  updateXPBar(xp) {
    const fill = this.elements.displays.xpFill;
    if (fill) {
      const level = Math.floor(xp / CONFIG.GAME.XP_PER_LEVEL) + 1;
      const xpInLevel = xp % CONFIG.GAME.XP_PER_LEVEL;
      const percentage = (xpInLevel / CONFIG.GAME.XP_PER_LEVEL) * 100;
      fill.style.width = Math.min(percentage, 100) + '%';
    }
  }

  updateVigiaStatus(status) {
    const el = this.elements.displays.vigiaStatus;
    if (!el) return;
    
    const emojiMap = {
      'optimal': '🌟',
      'challenge': '⚡',
      'boredom': '😴',
      'anxiety': '😰',
      'caca_flow': '💩',
      'absurd_max': '🤪'
    };
    
    const colorMap = {
      'optimal': '#FFD700',
      'challenge': '#FF6B6B',
      'boredom': '#90A4AE',
      'anxiety': '#FF1744',
      'caca_flow': '#8B4513',
      'absurd_max': '#9C27B0'
    };
    
    const flow = status.gameFlow || 'optimal';
    const emoji = emojiMap[flow] || '🧠';
    const color = colorMap[flow] || '#4CAF50';
    const absurdity = status.metrics?.absurdityLevel || 50;
    
    el.innerHTML = `
      <div class="vigia-content">
        <span class="vigia-emoji">${status.emoji || emoji}</span>
        <span class="vigia-message">${status.message || 'Todo bajo control'}</span>
        <span class="vigia-flow" style="color:${color}">${flow.toUpperCase()}</span>
      </div>
      <div class="vigia-absurdity">
        <span>Absurdez: ${Math.round(absurdity)}%</span>
        <div class="vigia-bar">
          <div class="vigia-fill" style="width:${absurdity}%;background:${color}"></div>
        </div>
      </div>
    `;
    el.style.borderColor = color;
  }

  updateThought(thought) {
    const el = this.elements.displays.thought;
    if (el && thought) {
      const absurdity = thought.absurdity || 50;
      let className = 'thought-bubble';
      if (absurdity > 80) className += ' thought-absurd-max';
      else if (absurdity > 60) className += ' thought-absurd-high';
      else if (absurdity < 30) className += ' thought-absurd-low';
      
      el.className = className;
      el.textContent = '💭 ' + thought.text;
      el.style.animation = 'none';
      setTimeout(() => {
        el.style.animation = 'shake 0.5s';
      }, 10);
      
      const hue = 200 + (absurdity / 100) * 160;
      el.style.background = `hsla(${hue}, 70%, 20%, 0.3)`;
    }
  }

  updateAbsurdColor(value) {
    const hue = 200 + (parseInt(value) / 100) * 160;
    document.documentElement.style.setProperty('--absurd-color', `hsl(${hue}, 70%, 50%)`);
  }

  // ============================================
  // RCN - REPETICIÓN COGNITIVA NEUROADAPTATIVA
  // ============================================
  updateRCNStatus(gameState) {
    const rcnStatus = document.getElementById('rcnStatus');
    const rcnProgress = document.getElementById('rcnProgress');
    const rcnLabel = document.getElementById('rcnLabel');
    
    if (!rcnStatus && !rcnProgress) return;
    
    const app = window.CACA_BRAIN;
    if (!app || !app.rcn) {
      if (rcnStatus) rcnStatus.textContent = '🧠 RCN: Cargando...';
      return;
    }
    
    const rcn = app.rcn;
    const cacaStats = app.cacaStats || {};
    
    const totalReps = (cacaStats.repeticionesExitosas || 0) + (cacaStats.repeticionesFallidas || 0);
    const aprendizaje = totalReps > 0 ? Math.round((cacaStats.repeticionesExitosas / totalReps) * 100) : 0;
    const repeticionesPendientes = rcn.repeticiones?.length || 0;
    const intervaloActual = rcn.intervaloActual || 4;
    const contador = rcn.contador || 0;
    const progreso = Math.min(100, (contador / intervaloActual) * 100);
    
    let estado = '🟢';
    let estadoTexto = 'Óptimo';
    let color = '#4CAF50';
    
    if (repeticionesPendientes > 3) {
      estado = '🔴';
      estadoTexto = 'Alta carga';
      color = '#FF1744';
    } else if (repeticionesPendientes > 1) {
      estado = '🟡';
      estadoTexto = 'Aprendiendo';
      color = '#FFD93D';
    } else if (aprendizaje > 70) {
      estado = '🟢';
      estadoTexto = 'Excelente';
      color = '#4CAF50';
    } else if (aprendizaje > 40) {
      estado = '🟡';
      estadoTexto = 'Progresando';
      color = '#FFD93D';
    } else {
      estado = '🔵';
      estadoTexto = 'Entrenando';
      color = '#2196F3';
    }
    
    if (rcnLabel) {
      const descripciones = [
        '🧠 RCN: Entrenamiento cognitivo adaptativo',
        '🧠 RCN: Repetición inteligente de patrones',
        '🧠 RCN: Memoria neuroadaptativa activa',
        '🧠 RCN: Plasticidad neuronal en acción',
        '🧠 RCN: Aprendizaje profundo continuo'
      ];
      const descripcion = descripciones[Math.floor(Math.random() * descripciones.length)];
      rcnLabel.textContent = descripcion;
    }
    
    if (rcnStatus) {
      rcnStatus.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span>${estado}</span>
          <span style="font-weight:bold;color:${color};">${estadoTexto}</span>
          <span style="color:#888;font-size:12px;">|</span>
          <span style="color:#aaa;font-size:12px;">Reps: ${repeticionesPendientes}</span>
          <span style="color:#aaa;font-size:12px;">|</span>
          <span style="color:#ffd93d;font-size:12px;">🎯 ${aprendizaje}%</span>
          <span style="color:#666;font-size:11px;margin-left:4px;">(${contador}/${intervaloActual})</span>
        </div>
        <div style="font-size:10px;color:#666;margin-top:2px;">
          💡 ${repeticionesPendientes > 0 ? '🔁 Repitiendo patrones para reforzar' : '✅ Sin repeticiones pendientes'}
        </div>
      `;
    }
    
    if (rcnProgress) {
      rcnProgress.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;width:100%;">
          <span style="font-size:11px;color:#888;white-space:nowrap;">RCN</span>
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;position:relative;">
            <div style="height:100%;width:${progreso}%;background:linear-gradient(90deg, ${color}, #9C27B0);border-radius:4px;transition:width 0.5s ease;"></div>
          </div>
          <span style="font-size:10px;color:#888;white-space:nowrap;min-width:30px;">${Math.round(progreso)}%</span>
        </div>
        <div style="font-size:9px;color:#555;margin-top:2px;text-align:center;">
          🔄 ${repeticionesPendientes > 0 ? `🔁 ${repeticionesPendientes} patrones en repetición` : '✅ Patrones asimilados'}
        </div>
      `;
    }
  }

  // ============================================
  // PRÓXIMO LOGRO
  // ============================================
  updateNextAchievement(gameState) {
    const el = this.elements.displays.nextAchievement;
    if (!el) return;
    
    const achievements = CONFIG.ACHIEVEMENTS;
    let closest = null;
    let closestDiff = Infinity;
    
    for (const [key, def] of Object.entries(achievements)) {
      let current = 0;
      switch (def.id) {
        case 'caca_novice':
        case 'caca_pro':
        case 'caca_legend':
          current = gameState.cacaPoints || 0;
          break;
        case 'brain_novice':
        case 'brain_pro':
        case 'brain_legend':
          current = gameState.brainPoints || 0;
          break;
        case 'streak_5':
        case 'streak_10':
        case 'streak_25':
          current = gameState.streak || 0;
          break;
        default:
          continue;
      }
      
      if (current < def.threshold) {
        const diff = def.threshold - current;
        if (diff < closestDiff) {
          closestDiff = diff;
          closest = { ...def, current, remaining: diff };
        }
      }
    }
    
    if (closest) {
      el.innerHTML = `
        🔜 Próximo logro: ${closest.name}
        <span class="progress">${closest.current}/${closest.threshold}</span>
        <div class="mini-bar"><div style="width:${(closest.current/closest.threshold)*100}%"></div></div>
      `;
    } else {
      el.innerHTML = '🏆 ¡Todos los logros completados! Eres una leyenda';
    }
  }

  // ============================================
  // EFECTOS VISUALES
  // ============================================
  
  createParticleSystem() {
    const container = this.elements.effectsContainers?.particles;
    if (!container) return;
    
    this.particleSystem = {
      container,
      particles: [],
      active: false
    };
  }

  cacaExplosionEffect() {
    const emojis = ['💩', '💨', '🔥', '⚡', '🌟', '🎯', '🚀', '💀', '🤪', '✨'];
    const count = 30 + Math.floor(Math.random() * 30);
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'caca-particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.position = 'fixed';
      particle.style.fontSize = (20 + Math.random() * 40) + 'px';
      particle.style.left = (20 + Math.random() * 60) + '%';
      particle.style.top = (20 + Math.random() * 60) + '%';
      particle.style.zIndex = '99999';
      particle.style.pointerEvents = 'none';
      particle.style.animation = `cacaExplosion ${1 + Math.random() * 2}s ease-out forwards`;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 300;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      particle.style.setProperty('--tx', x + 'px');
      particle.style.setProperty('--ty', y + 'px');
      particle.style.setProperty('--rot', (Math.random() * 720) + 'deg');
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentElement) particle.remove();
      }, 3000);
    }
    
    this.playCacaSound();
    this.showToast('💥 ¡EXPLOSIÓN DE CACA!', 'caca', 2000);
  }

  toggleRainbowMode() {
    const body = document.body;
    if (body.classList.contains('rainbow-mode')) {
      body.classList.remove('rainbow-mode');
      this.showToast('🌈 Modo arcoíris desactivado', 'info', 1500);
    } else {
      body.classList.add('rainbow-mode');
      this.showToast('🌈 ¡MODO ARCOÍRIS ACTIVADO!', 'success', 2000);
      this.showConfetti(20);
    }
  }

  absurdParticleEffect() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff1744', '#9C27B0', '#FF9100'];
    const count = 50;
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'absurd-particle';
      particle.style.position = 'fixed';
      particle.style.width = (5 + Math.random() * 15) + 'px';
      particle.style.height = particle.style.width;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.zIndex = '99998';
      particle.style.pointerEvents = 'none';
      particle.style.animation = `absurdParticle ${2 + Math.random() * 3}s ease-out forwards`;
      particle.style.boxShadow = `0 0 20px ${colors[Math.floor(Math.random() * colors.length)]}`;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentElement) particle.remove();
      }, 5000);
    }
    
    this.showToast('✨ ¡PARTÍCULAS DE ABSURDO!', 'absurd', 1500);
  }

  showConfetti(count = 50) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff1744', '#ff9100', '#9C27B0', '#00BCD4'];
    
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.position = 'fixed';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-10px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 8 + 4) + 'px';
      piece.style.height = (Math.random() * 8 + 4) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.zIndex = '99999';
      piece.style.pointerEvents = 'none';
      piece.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      document.body.appendChild(piece);
      
      setTimeout(() => {
        if (piece.parentElement) piece.remove();
      }, 5000);
    }
  }

  // ============================================
  // FEEDBACK INMEDIATO
  // ============================================
  showImmediateFeedback(acierto, decision) {
    const thoughtDisplay = document.getElementById('thoughtDisplay');
    if (!thoughtDisplay) return;
    
    // Limpiar clases previas
    thoughtDisplay.className = 'thought-bubble';
    thoughtDisplay.style.transform = '';
    thoughtDisplay.style.borderColor = '';
    thoughtDisplay.style.background = '';
    thoughtDisplay.style.transition = '';
    
    if (acierto) {
      // ✅ FEEDBACK DE ACIERTO
      if (decision === 'caca') {
        thoughtDisplay.textContent = '💩 ¡CACA CORRECTA! 🎉';
        thoughtDisplay.classList.add('feedback-caca');
        thoughtDisplay.style.borderColor = '#ff6b6b';
        thoughtDisplay.style.background = 'rgba(255, 107, 107, 0.25)';
        thoughtDisplay.style.transform = 'scale(1.05) rotate(-1deg)';
        this.showConfetti(10);
      } else {
        thoughtDisplay.textContent = '🧠 ¡CEREBRO CORRECTO! 🧠';
        thoughtDisplay.classList.add('feedback-brain');
        thoughtDisplay.style.borderColor = '#4d96ff';
        thoughtDisplay.style.background = 'rgba(77, 150, 255, 0.25)';
        thoughtDisplay.style.transform = 'scale(1.05) rotate(1deg)';
        this.showConfetti(8);
      }
      this.playSuccessSound();
      
    } else {
      // ❌ FEEDBACK DE FALLO
      if (decision === 'caca') {
        thoughtDisplay.textContent = '😅 ¡No era CACA! ❌';
      } else {
        thoughtDisplay.textContent = '😅 ¡No era CEREBRO! ❌';
      }
      thoughtDisplay.classList.add('feedback-error');
      thoughtDisplay.style.borderColor = '#ff1744';
      thoughtDisplay.style.background = 'rgba(255, 23, 68, 0.2)';
      thoughtDisplay.style.transform = 'scale(0.92)';
      
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      this.playErrorSound();
    }
    
    thoughtDisplay.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    setTimeout(() => {
      thoughtDisplay.className = 'thought-bubble';
      thoughtDisplay.style.transform = '';
      thoughtDisplay.style.borderColor = '';
      thoughtDisplay.style.background = '';
      thoughtDisplay.style.transition = '';
      
      const currentText = thoughtDisplay.textContent;
      if (currentText.includes('¡') || currentText.includes('❌') || currentText.includes('🎉')) {
        thoughtDisplay.textContent = '💭 Pensando...';
      }
    }, 1500);
  }

  // ============================================
  // SONIDOS
  // ============================================
  playSuccessSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.12);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.12);
      });
    } catch (e) {}
  }

  playErrorSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playCacaSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playAchievementSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.15);
      });
    } catch (e) {}
  }

  // ============================================
  // EVENTOS
  // ============================================
  trigger(event, data) {
    const customEvent = new CustomEvent('cacaBrainEvent', {
      detail: { event, data }
    });
    document.dispatchEvent(customEvent);
  }

  // ============================================
  // CONFIGURACIÓN
  // ============================================
  setPLangTranslator(pLang) {
    this.pLang = pLang;
  }

  getRegisterData() {
    const usernameInput = document.getElementById('usernameInput');
    const absurdLevelInput = document.getElementById('absurdLevelInput');
    const groqKeyInput = document.getElementById('groqKeyInput');
  
    const username = usernameInput?.value || CONFIG.GAME.DEFAULT_USERNAME;
    const absurdLevel = parseInt(absurdLevelInput?.value) || CONFIG.GAME.DEFAULT_ABSURD_LEVEL;
    const groqKey = groqKeyInput?.value || null;
  
    console.log('📝 getRegisterData:', { username, absurdLevel, groqKey });
  
    return { username, absurdLevel, groqKey };
  }

  getSettings() {
    return {
      notifications: this.elements.inputs.notifications?.checked ?? true,
      vibration: this.elements.inputs.vibration?.checked ?? true,
      sound: this.elements.inputs.sound?.checked ?? true,
      pLang: this.elements.inputs.pLang?.checked ?? true,
      particleEffects: this.elements.inputs.particleEffects?.checked ?? true,
      rainbowBackground: this.elements.inputs.rainbowBackground?.checked ?? false,
      cacaSounds: this.elements.inputs.cacaSounds?.checked ?? true
    };
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  updateStatsScreen(stats) {
    const container = document.getElementById('statsContent');
    if (!container) return;
    
    if (!stats) {
      container.innerHTML = '<p>Cargando estadísticas...</p>';
      return;
    }
    
    const html = `
      <div class="stats-grid-full">
        <div class="stat-card">
          <h3>👤 Usuario</h3>
          <p><strong>${stats.user?.username || 'Desconocido'}</strong></p>
          <p>Nivel de absurdo: ${stats.user?.absurdLevel || 0}%</p>
          <p>Tiempo jugando: ${stats.playTime || '0m'}</p>
        </div>
        
        <div class="stat-card">
          <h3>🎮 Progreso</h3>
          <p>🏆 Nivel: ${stats.gameState?.level || 1}</p>
          <p>⭐ XP: ${stats.gameState?.xp || 0}</p>
          <p>💩 CACA: ${stats.gameState?.cacaPoints || 0}</p>
          <p>🧠 CEREBRO: ${stats.gameState?.brainPoints || 0}</p>
          <p>🔥 Racha: ${stats.gameState?.streak || 0}</p>
          <p>🎯 Total decisiones: ${stats.gameState?.totalDecisions || 0}</p>
        </div>
        
        <div class="stat-card">
          <h3>🧠 Vigía Neuro</h3>
          <p>Flujo: ${stats.metrics?.gameFlow || 'optimal'}</p>
          <p>Absurdez: ${Math.round(stats.metrics?.absurdityLevel || 0)}%</p>
          <p>Neuroplasticidad: ${Math.round(stats.metrics?.neuroplasticity || 0)}%</p>
          <p>Estado: ${stats.metrics?.emotionalState || 'neutral'}</p>
          <p>Tiempo reacción: ${Math.round(stats.metrics?.reactionTime || 0)}ms</p>
        </div>
        
        <div class="stat-card">
          <h3>🏆 Logros</h3>
          <p>Desbloqueados: ${stats.totalAchievements || 0}</p>
          <p>Sesiones: ${stats.totalSessions || 0}</p>
          <p>Ratio CACA/CEREBRO: ${stats.gameState?.cacaPoints / (stats.gameState?.brainPoints || 1) > 0 ? (stats.gameState?.cacaPoints / (stats.gameState?.brainPoints || 1)).toFixed(2) : '0'}</p>
        </div>
        
        <div class="stat-card">
          <h3>🧠 RCN</h3>
          <p>Repeticiones exitosas: ${stats.cacaStats?.repeticionesExitosas || 0}</p>
          <p>Repeticiones fallidas: ${stats.cacaStats?.repeticionesFallidas || 0}</p>
          <p>Aprendizaje: ${stats.cacaStats?.aprendizaje || 0}%</p>
          <p>Patrones en repetición: ${stats.rcn?.repeticiones?.length || 0}</p>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }

  // ============================================
  // FORZAR ACTUALIZACIÓN DE UI
  // ============================================
  forceUpdateUI() {
    const gameState = window.CACA_BRAIN?.game?.gameState;
    const vigiaStatus = window.CACA_BRAIN?.vigia?.getVigiaStatus();
    
    if (gameState) {
      this.updateGameUI(gameState, vigiaStatus);
    }
    
    if (window.CACA_BRAIN?.actualizarPoderCaca) {
      window.CACA_BRAIN.actualizarPoderCaca();
    }
    
    console.log('🔄 UI forzada actualizada');
  }

  // ============================================
  // LIMPIAR NOTIFICACIONES PENDIENTES
  // ============================================
  clearPendingNotifications() {
    if (this.toasterContainer) {
      const toasts = this.toasterContainer.querySelectorAll('.toaster-notification');
      toasts.forEach(toast => {
        if (!toast.classList.contains('achievement-toast')) {
          this.closeToast(toast);
        }
      });
    }
    this.notificationQueue = [];
    this.isProcessingNotification = false;
  }

  // ============================================
  // DESTRUCCIÓN
  // ============================================
  destroy() {
    this.clearToasts();
    this.elements = {};
    this.bindings = {};
    this.isInitialized = false;
  }

  // ============================================
// SONIDOS DE FEEDBACK - AÑADIR ESTOS MÉTODOS
// ============================================

playSuccessSound() {
  if (!this.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.12);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.12);
    });
  } catch (e) {}
}

playErrorSound() {
  if (!this.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}
}

export default UIManager;