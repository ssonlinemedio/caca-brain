// js/app.js - CACA BRAIN ULTRA v2.0 CON RCN
// VERSIÓN DEFINITIVA - CON DIFICULTAD, HISTORIAL Y ESTADÍSTICAS

import CONFIG from './config.js';
import DatabaseManager from './modules/DatabaseManager.js';
import PLangTranslator from './modules/PLangTranslator.js';
import CacaCompa from './modules/CacaCompa.js';
import VigiaNeuro from './modules/VigiaNeuro.js';
import GameEngine from './modules/GameEngine.js';
import AchievementSystem from './modules/AchievementSystem.js';
import UIManager from './modules/UIManager.js';
import SeedLoader from './modules/SeedLoader.js';

class CacaBrainApp {
  constructor() {
    // Inicializar módulos
    this.db = new DatabaseManager();
    this.pLang = new PLangTranslator();
    this.ui = new UIManager();
    
    // Referencias a otros módulos
    this.game = null;
    this.vigia = null;
    this.cacaCompa = null;
    this.achievements = null;
    this.seedLoader = null;
    
    // Estado de la app
    this.isReady = false;
    this.isInitialized = false;
    this.gameLoopInterval = null;
    this.user = null;
    this.startTime = null;
    
    // Control de flujo de pensamientos
    this.isWaitingForResponse = false;
    this.pendingThought = null;
    this.currentThoughtTimeout = null;
    this.thoughtGenerationEnabled = true;
    this.timeUpdateInterval = null;
    
    // Control de notificaciones
    this.lastNotificationTime = 0;
    this.notificationCooldown = 60000;
    this.notificationQueue = [];
    this.isProcessingNotification = false;
    
    // RCN - Repetición Cognitiva Neuroadaptativa
    this.rcn = {
      enabled: true,
      history: [],
      repeticiones: [],
      intervaloBase: 4,
      intervaloActual: 4,
      contador: 0,
      maxRepeticiones: 2,
      pensamientosRepetidos: {},
      umbralDificultad: 70,
      ultimoPensamiento: null,
      pensamientosMostrados: 0,
      aciertosConsecutivos: 0,
      fallosConsecutivos: 0
    };
    
    // Estadísticas CACA
    this.cacaStats = {
      cacaCritica: 0,
      rachaCaca: 0,
      rachaMaxCaca: 0,
      cacaPerfecta: 0,
      cacaMortal: 0,
      poderCaca: 0,
      comboActual: 0,
      comboMaximo: 0,
      repeticionesExitosas: 0,
      repeticionesFallidas: 0,
      aprendizaje: 0
    };
    
    // Estadísticas de sesión
    this.sessionStats = {
      cacaPerMinute: 0,
      totalCaca: 0,
      startTime: null,
      decisions: []
    };
    
    console.log('🎮 CACA BRAIN ULTRA v2.0 - Constructor listo');
  }

  // ============================================
  // INICIALIZACIÓN PRINCIPAL
  // ============================================
  async init() {
    try {
      console.log('🎮 Iniciando CACA BRAIN ULTRA v2.0...');
      
      this.ui.init();
      this.ui.setPLangTranslator(this.pLang);
      
      this.ui.onStartGame = (username, absurdLevel, groqKey) => {
        this.handleStartGame();
      };
      this.ui.onVote = (decision) => {
        this.handleVote(decision);
      };
      this.ui.onReset = () => {
        this.handleReset();
      };
      this.ui.onDifficultyChange = (level) => {
        this.handleDifficultyChange(level);
      };
      this.ui.onExportAI = () => {
        this.exportAIData();
      };
      this.ui.onShowStats = () => {
        this.showStats();
      };
      this.ui.onShowAchievements = () => {
        this.showAchievements();
      };
      
      console.log('📁 Inicializando IndexedDB...');
      await this.db.initDB();
      console.log('✅ Base de datos IndexedDB lista');
      
      this.seedLoader = new SeedLoader(this.db);
      const seedResult = await this.seedLoader.loadSeed();
      if (seedResult.success) {
        console.log('🌱 Semilla cargada:', seedResult.alreadyLoaded ? 'ya existía' : 'primera vez');
      }
      
      this.setupUIEvents();
      await this.checkSavedSession();
      this.setupGlobalListeners();
      this.setupNotificationCleanup();
      
      this.startTime = Date.now();
      this.isReady = true;
      console.log('✅ CACA BRAIN ULTRA listo!');
      
      this.ui.showToast(
        this.pLang.translateMessage('¡Bienvenido a CACA BRAIN ULTRA! Prepárate para el absurdo máximo'),
        'info',
        5000
      );
      
    } catch (error) {
      console.error('❌ Error inicializando app:', error);
      this.ui.showToast('Error crítico: ' + error.message, 'error', 6000);
    }
  }

  setupUIEvents() {
    document.addEventListener('cacaBrainEvent', (e) => {
      const { event, data } = e.detail;
      console.log('🎮 Evento recibido:', event, data);
      
      switch (event) {
        case 'startGame':
          this.handleStartGame();
          break;
        case 'vote':
          this.handleVote(data);
          break;
        case 'share':
          this.handleShare();
          break;
        case 'reset':
          this.handleReset();
          break;
        case 'difficultyChange':
          this.handleDifficultyChange(data);
          break;
        case 'showHistory':
          this.showScoreHistory();
          break;
        case 'showStats':
          this.showStats();
          break;
        case 'showAchievements':
          this.showAchievements();
          break;
        case 'exportAI':
          this.exportAIData();
          break;
      }
    });
  }

  async checkSavedSession() {
    try {
      const savedUserId = this.db.getConfig('currentUser');
      
      if (savedUserId) {
        const user = await this.db.read('users', savedUserId);
        
        if (user) {
          this.user = user;
          console.log('👤 Sesión cargada:', user.username);
          
          this.ui.updateElement('usernameDisplay', user.username);
          
          await this.initializeGame(user);
          
          this.ui.showScreen('game');
          this.ui.showToast(
            this.pLang.translateMessage('¡Bienvenido de vuelta, ' + user.username + '!'),
            'success',
            4000
          );
          
          return true;
        }
      }
      
      this.ui.showScreen('register');
      return false;
      
    } catch (error) {
      console.error('Error cargando sesión:', error);
      this.ui.showScreen('register');
      return false;
    }
  }

  async initializeGame(user) {
    try {
      console.log('🎮 Inicializando juego para:', user.username);
      
      if (!this.game) {
        this.game = new GameEngine(this.db, this.pLang);
      }
      
      this.game.user = user;
      this.game.startTime = Date.now();
      
      if (this.seedLoader) {
        const thoughts = await this.seedLoader.getThoughts();
        if (thoughts && thoughts.length > 0) {
          this.game.thoughts = thoughts;
          console.log(`🧠 ${thoughts.length} pensamientos cargados desde seed`);
        }
      }
      
      this.vigia = new VigiaNeuro(user.id, this.db);
      await this.vigia.load();
      
      await this.game.init(user, this.vigia);
      
      const messages = this.seedLoader?.getCacaCompaMessages() || [];
      this.cacaCompa = new CacaCompa(
        user.id,
        user.groqApiKey || null,
        this.pLang,
        messages
      );
      
      this.cacaCompa.setNotificationFrequency(90);
      this.cacaCompa.setMaxNotificationsPerMinute(0.5);
      
      this.achievements = new AchievementSystem(user.id, this.db);
      await this.achievements.loadAchievements();
      
      this.cacaCompa.addCallback((msg, type) => {
        this.showThrottledNotification(msg, type);
      });
      
      const frequency = this.vigia?.adaptations?.messageFrequency || 90;
      this.cacaCompa.startPeriodicNotifications(
        (msg, type) => this.showThrottledNotification(msg, type),
        frequency
      );
      
      await this.game.loadState();
      
      this.isWaitingForResponse = false;
      this.pendingThought = null;
      this.thoughtGenerationEnabled = true;
      if (this.currentThoughtTimeout) {
        clearTimeout(this.currentThoughtTimeout);
        this.currentThoughtTimeout = null;
      }
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
        this.timeUpdateInterval = null;
      }
      
      this.rcn = {
        enabled: true,
        history: [],
        repeticiones: [],
        intervaloBase: 4,
        intervaloActual: 4,
        contador: 0,
        maxRepeticiones: 2,
        pensamientosRepetidos: {},
        umbralDificultad: 70,
        ultimoPensamiento: null,
        pensamientosMostrados: 0,
        aciertosConsecutivos: 0,
        fallosConsecutivos: 0
      };
      
      this.cacaStats = {
        cacaCritica: 0,
        rachaCaca: 0,
        rachaMaxCaca: 0,
        cacaPerfecta: 0,
        cacaMortal: 0,
        poderCaca: 0,
        comboActual: 0,
        comboMaximo: 0,
        repeticionesExitosas: 0,
        repeticionesFallidas: 0,
        aprendizaje: 0
      };
      
      // Mostrar dificultad actual
      const diff = this.game.getDifficulty();
      this.ui.updateElement('difficultyDisplay', diff.level.toUpperCase());
      
      this.ui.updateGameUI(this.game.gameState, this.vigia.getVigiaStatus());
      
      this.sessionStats.startTime = Date.now();
      this.sessionStats.decisions = [];
      
      setTimeout(() => {
        if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
          this.generateThought();
        }
      }, 1500);
      
      this.startGameLoop();
      this.startStatsUpdate();
      this.actualizarPoderCaca();
      
      this.isInitialized = true;
      console.log('✅ Juego inicializado para:', user.username);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando juego:', error);
      this.ui.showToast('Error al iniciar el juego: ' + error.message, 'error');
      return false;
    }
  }

  startGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    
    const interval = CONFIG.GAME.THOUGHT_INTERVAL || 7000;
    
    this.gameLoopInterval = setInterval(() => {
      if (this.isInitialized && 
          this.game?.isInitialized && 
          !this.isWaitingForResponse && 
          this.thoughtGenerationEnabled) {
        this.generateThought();
      }
    }, interval);
  }

  setupNotificationCleanup() {
    setInterval(() => {
      if (this.notificationQueue.length > 0) {
        this.processNextNotification();
      }
    }, 10000);
  }

  showThrottledNotification(message, type = 'info') {
    const now = Date.now();
    
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      if (this.notificationQueue.length < 3) {
        this.notificationQueue.push({ message, type, timestamp: now });
        console.log('📥 Notificación en cola:', message);
      }
      return;
    }
    
    this.lastNotificationTime = now;
    this.ui.showToast(message, type, 3000);
    
    setTimeout(() => {
      this.processNextNotification();
    }, 5000);
  }

  processNextNotification() {
    if (this.isProcessingNotification) return;
    if (this.notificationQueue.length === 0) return;
    
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return;
    }
    
    this.isProcessingNotification = true;
    const next = this.notificationQueue.shift();
    
    if (next) {
      this.lastNotificationTime = now;
      this.ui.showToast(next.message, next.type, 3000);
      
      setTimeout(() => {
        this.isProcessingNotification = false;
        setTimeout(() => this.processNextNotification(), 3000);
      }, 4000);
    } else {
      this.isProcessingNotification = false;
    }
  }

  // ============================================
  // 🆕 CAMBIAR DIFICULTAD
  // ============================================
  handleDifficultyChange(level) {
    if (!this.game) {
      this.ui.showToast('El juego no está listo', 'error');
      return;
    }
    
    const result = this.game.setDifficulty(level);
    if (result) {
      const diff = this.game.getDifficulty();
      this.ui.updateElement('difficultyDisplay', diff.level.toUpperCase());
      this.ui.showToast(
        this.pLang.translateMessage(`🎯 Dificultad cambiada a: ${diff.level.toUpperCase()}`),
        'success',
        3000
      );
      console.log('🎯 Dificultad cambiada a:', level);
    } else {
      this.ui.showToast('❌ Dificultad no válida', 'error');
    }
  }

  // ============================================
  // 🆕 EXPORTAR DATOS PARA IA
  // ============================================
  exportAIData() {
    if (!this.game) {
      this.ui.showToast('El juego no está listo', 'error');
      return;
    }
    
    const data = {
      version: CONFIG.VERSION,
      timestamp: Date.now(),
      user: {
        username: this.user?.username || 'Desconocido',
        absurdLevel: this.user?.absurdLevel || 50
      },
      gameState: this.game.gameState,
      difficulty: this.game.getDifficulty(),
      cacaStats: this.cacaStats,
      rcn: this.rcn,
      scoreHistory: this.game.getScoreHistory(50),
      sessionStats: this.sessionStats,
      achievements: this.achievements?.getUnlockedAchievements() || []
    };
    
    const json = JSON.stringify(data, null, 2);
    
    // Mostrar en un modal o descargar
    this.showAIDataModal(json);
  }

  showAIDataModal(json) {
    // Crear modal si no existe
    let modal = document.getElementById('aiDataModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'aiDataModal';
      modal.className = 'modal-overlay caca-modal';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="modal-content caca-modal-content">
        <div class="modal-header">
          <span class="modal-icon">🤖</span>
          <h2>🧠 DATOS PARA IA</h2>
          <button class="modal-close" onclick="document.getElementById('aiDataModal').style.display='none'">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">📊 Datos listos para entrenar tu IA personalizada</p>
          <div class="json-container">
            <pre id="aiDataJson">${json}</pre>
          </div>
          <div class="modal-actions">
            <button class="btn-copy" onclick="navigator.clipboard.writeText(document.getElementById('aiDataJson').textContent)">📋 Copiar JSON</button>
            <button class="btn-download" onclick="downloadAIData()">📥 Descargar</button>
            <button class="btn-close" onclick="document.getElementById('aiDataModal').style.display='none'">✕ Cerrar</button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    
    // Función de descarga
    window.downloadAIData = () => {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caca_brain_ai_data_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.ui.showToast('📥 ¡Datos descargados!', 'success');
    };
  }

  // ============================================
  // 🆕 MOSTRAR ESTADÍSTICAS - CORREGIDO
  // ============================================
  async showStats() {
    if (!this.game) {
      this.ui.showToast('El juego no está listo', 'error');
      return;
    }
    
    try {
      const stats = await this.game.getStats();
      const diff = this.game.getDifficulty();
      const history = this.game.getScoreHistory(10);
      const scoreStats = this.game.getScoreStats();
      
      const container = document.getElementById('statsContent');
      if (!container) {
        this.ui.showToast('Error: No se encontró el contenedor de estadísticas', 'error');
        return;
      }
      
      container.innerHTML = `
        <div class="stats-absurd-grid">
          <div class="stat-absurd-card">
            <span class="stat-emoji">👤</span>
            <h3>${this.user?.username || 'ProCagador'}</h3>
            <p>🎯 Nivel de absurdo: ${this.user?.absurdLevel || 50}%</p>
            <p>⏱️ Tiempo jugando: ${stats.playTime || '0m'}</p>
            <p>🎯 Dificultad: ${diff.level.toUpperCase()}</p>
          </div>
          
          <div class="stat-absurd-card">
            <span class="stat-emoji">🎮</span>
            <h3>📊 Progreso</h3>
            <p>🏆 Nivel: ${stats.gameState?.level || 1}</p>
            <p>⭐ XP: ${stats.gameState?.xp || 0}</p>
            <p>💩 CACA: ${stats.gameState?.cacaPoints || 0}</p>
            <p>🧠 CEREBRO: ${stats.gameState?.brainPoints || 0}</p>
            <p>🔥 Racha: ${stats.gameState?.streak || 0}</p>
            <p>🎯 Precisión: ${stats.gameState?.accuracy || 0}%</p>
            <p>⚡ Tiempo respuesta: ${stats.gameState?.avgResponseTime || 0}ms</p>
          </div>
          
          <div class="stat-absurd-card">
            <span class="stat-emoji">🧠</span>
            <h3>🧠 Vigía Neuro</h3>
            <p>Flujo: ${stats.metrics?.gameFlow || 'optimal'}</p>
            <p>Absurdez: ${Math.round(stats.metrics?.absurdityLevel || 0)}%</p>
            <p>Neuroplasticidad: ${Math.round(stats.metrics?.neuroplasticity || 0)}%</p>
            <p>Estado: ${stats.metrics?.emotionalState || 'neutral'}</p>
            <p>Tiempo reacción: ${Math.round(stats.metrics?.reactionTime || 0)}ms</p>
          </div>
          
          <div class="stat-absurd-card">
            <span class="stat-emoji">🏆</span>
            <h3>🏆 Logros</h3>
            <p>Desbloqueados: ${stats.totalAchievements || 0}</p>
            <p>Sesiones: ${stats.totalSessions || 0}</p>
            <p>Ratio CACA/CEREBRO: ${stats.gameState?.cacaPoints / (stats.gameState?.brainPoints || 1) > 0 ? (stats.gameState?.cacaPoints / (stats.gameState?.brainPoints || 1)).toFixed(2) : '0'}</p>
          </div>
          
          <div class="stat-absurd-card">
            <span class="stat-emoji">📊</span>
            <h3>📊 Scores</h3>
            <p>Total partidas: ${scoreStats.count || 0}</p>
            <p>Score máximo: ${scoreStats.max || 0}</p>
            <p>Score promedio: ${scoreStats.average || 0}</p>
            <p>Score total: ${scoreStats.total || 0}</p>
          </div>
          
          <div class="stat-absurd-card">
            <span class="stat-emoji">🧠</span>
            <h3>🧠 RCN</h3>
            <p>Repeticiones exitosas: ${this.cacaStats.repeticionesExitosas || 0}</p>
            <p>Repeticiones fallidas: ${this.cacaStats.repeticionesFallidas || 0}</p>
            <p>Aprendizaje: ${this.cacaStats.aprendizaje || 0}%</p>
            <p>Patrones en repetición: ${this.rcn.repeticiones?.length || 0}</p>
          </div>
        </div>
        
        <div class="stats-absurd-footer">
          <p class="caca-frase">💩 "${this.pLang?.translateMessage('La caca mental es el camino a la sabiduría absurda')}"</p>
        </div>
      `;
      
      this.ui.showScreen('stats');
      
    } catch (error) {
      console.error('Error getting stats:', error);
      this.ui.showToast('Error al obtener estadísticas: ' + error.message, 'error');
    }
  }

  // ============================================
  // 🆕 MOSTRAR LOGROS - CORREGIDO
  // ============================================
  async showAchievements() {
    if (!this.achievements) {
      this.ui.showToast('El sistema de logros no está listo', 'error');
      return;
    }
    
    try {
      const allAchievements = this.achievements.getAllAchievements();
      const unlocked = this.achievements.getUnlockedAchievements();
      const stats = this.achievements.getStatistics();
      
      const container = document.getElementById('achievementsContent');
      if (!container) {
        this.ui.showToast('Error: No se encontró el contenedor de logros', 'error');
        return;
      }
      
      let html = `
        <div class="achievements-absurd-header">
          <span class="achievement-emoji">🏆</span>
          <h2>🎯 LOGROS ABSURDOS</h2>
          <div class="achievement-stats">
            <span>${stats.unlocked}/${stats.total}</span>
            <span>${stats.percentage}% completado</span>
          </div>
        </div>
        <div class="achievements-absurd-grid">
      `;
      
      if (allAchievements.length === 0) {
        html += `<p class="no-achievements">🤪 No hay logros disponibles... ¡La caca mental te espera!</p>`;
      } else {
        for (const ach of allAchievements) {
          const isUnlocked = ach.unlocked;
          html += `
            <div class="achievement-absurd-card ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${isUnlocked ? '✨' : '🔒'}</div>
              <div class="achievement-info">
                <h4>${ach.name}</h4>
                <p>${ach.description || 'Sin descripción'}</p>
                <div class="achievement-progress">
                  ${isUnlocked ? '✅ ¡Desbloqueado!' : `🔜 ${ach.threshold || 0}`}
                </div>
                ${isUnlocked ? `<span class="achievement-date">📅 ${new Date(ach.unlockedAt).toLocaleDateString()}</span>` : ''}
              </div>
            </div>
          `;
        }
      }
      
      html += `
        </div>
        <div class="achievements-absurd-footer">
          <p class="caca-frase">💩 "${this.pLang?.translateMessage('Cada logro es una caca mental más cerca de la grandeza')}"</p>
        </div>
      `;
      
      container.innerHTML = html;
      this.ui.showScreen('achievements');
      
    } catch (error) {
      console.error('Error showing achievements:', error);
      this.ui.showToast('Error al cargar logros: ' + error.message, 'error');
    }
  }

  // ============================================
  // 🆕 MOSTRAR HISTORIAL DE SCORES
  // ============================================
  showScoreHistory() {
    if (!this.game) {
      this.ui.showToast('El juego no está listo', 'error');
      return;
    }
    
    const history = this.game.getScoreHistory(20);
    const stats = this.game.getScoreStats();
    
    let modal = document.getElementById('historyModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'historyModal';
      modal.className = 'modal-overlay caca-modal';
      document.body.appendChild(modal);
    }
    
    let html = `
      <div class="modal-content caca-modal-content">
        <div class="modal-header">
          <span class="modal-icon">📊</span>
          <h2>📈 HISTORIAL DE SCORES</h2>
          <button class="modal-close" onclick="document.getElementById('historyModal').style.display='none'">✕</button>
        </div>
        <div class="modal-body">
          <div class="stats-absurd-summary">
            <div class="stat-item"><span>🎯 Total</span><span>${stats.count}</span></div>
            <div class="stat-item"><span>🏆 Mejor</span><span>${stats.max}</span></div>
            <div class="stat-item"><span>📊 Promedio</span><span>${stats.average}</span></div>
            <div class="stat-item"><span>💩 Total</span><span>${stats.total}</span></div>
          </div>
    `;
    
    if (Object.keys(stats.byDifficulty).length > 0) {
      html += `<div class="difficulty-stats-absurd">`;
      for (const [diff, data] of Object.entries(stats.byDifficulty)) {
        html += `
          <div class="diff-item-absurd">
            <span class="diff-name">🎯 ${diff.toUpperCase()}</span>
            <span>${data.count} partidas</span>
            <span>📊 ${data.average}</span>
            <span>🏆 ${data.max}</span>
          </div>
        `;
      }
      html += `</div>`;
    }
    
    if (history.length > 0) {
      html += `
        <div class="history-list-absurd">
          <h4>📋 Últimas 20 partidas</h4>
          <div class="history-items-absurd">
      `;
      for (const entry of history) {
        const date = new Date(entry.timestamp).toLocaleDateString();
        const time = new Date(entry.timestamp).toLocaleTimeString();
        html += `
          <div class="history-item-absurd">
            <span class="score">💩 ${entry.score}</span>
            <span class="level">Nv. ${entry.level}</span>
            <span class="streak">🔥 ${entry.streak}</span>
            <span class="difficulty">${(entry.difficulty || 'normal').toUpperCase()}</span>
            <span class="date">📅 ${date}</span>
          </div>
        `;
      }
      html += `</div></div>`;
    } else {
      html += `<p class="no-history-absurd">🤪 ¡Aún no hay partidas! ¡La caca mental te espera!</p>`;
    }
    
    html += `
        </div>
        <div class="modal-footer">
          <button class="btn-close-caca" onclick="document.getElementById('historyModal').style.display='none'">✕ Cerrar</button>
        </div>
      </div>
    `;
    
    modal.innerHTML = html;
    modal.style.display = 'flex';
  }

  // ============================================
  // GENERATE THOUGHT
  // ============================================
  generateThought() {
    if (!this.game || !this.game.isInitialized) return;
    
    if (this.isWaitingForResponse) {
      console.log('⏳ Esperando respuesta del usuario...');
      return;
    }
    
    if (!this.thoughtGenerationEnabled) {
      console.log('⏸️ Generación de pensamientos deshabilitada');
      return;
    }
    
    let thought = this.verificarRepeticionRCN();
    
    if (!thought) {
      thought = this.game.generateThought();
    }
    
    if (thought) {
      console.log('💭 Pensamiento generado:', thought.text);
      
      this.rcn.history.push({
        ...thought,
        timestamp: Date.now(),
        repetido: thought.repetido || false
      });
      
      if (this.rcn.history.length > 50) {
        this.rcn.history.shift();
      }
      
      this.isWaitingForResponse = true;
      this.pendingThought = thought;
      this.thoughtGenerationEnabled = false;
      
      // Limpiar display
      const thoughtDisplay = document.getElementById('thoughtDisplay');
      if (thoughtDisplay) {
        thoughtDisplay.className = 'thought-bubble';
        thoughtDisplay.style.transition = 'all 0.3s ease';
        thoughtDisplay.style.transform = '';
        thoughtDisplay.style.borderColor = '';
        thoughtDisplay.style.borderWidth = '';
        thoughtDisplay.style.borderStyle = '';
        thoughtDisplay.style.background = '';
        thoughtDisplay.style.boxShadow = '';
        thoughtDisplay.style.color = '';
        thoughtDisplay.style.fontSize = '';
        thoughtDisplay.style.fontWeight = '';
        thoughtDisplay.style.textShadow = '';
        thoughtDisplay.style.opacity = '';
        thoughtDisplay.style.scale = '';
        thoughtDisplay.style.display = '';
        void thoughtDisplay.offsetHeight;
      }
      
      this.ui.updateThought(thought);
      
      if (thought.repetido) {
        const thoughtDisplay = document.getElementById('thoughtDisplay');
        if (thoughtDisplay) {
          thoughtDisplay.innerHTML = `🔄 ${thought.text}`;
          thoughtDisplay.style.borderColor = '#9C27B0';
          setTimeout(() => {
            if (thoughtDisplay) {
              thoughtDisplay.style.borderColor = '';
            }
          }, 500);
        }
      }
      
      const timer = document.getElementById('thoughtTimer');
      const timeLeftDisplay = document.getElementById('timeLeftDisplay');
      
      if (timer) {
        timer.className = 'thought-timer active';
        timer.style.width = '100%';
        timer.style.animation = 'none';
        void timer.offsetWidth;
        const duration = (thought.timeLimit || 8000) / 1000;
        timer.style.animation = `timerProgress ${duration}s linear forwards`;
      }
      
      if (timeLeftDisplay) {
        timeLeftDisplay.style.display = 'flex';
        timeLeftDisplay.textContent = `⏱️ ${Math.round((thought.timeLimit || 8000) / 1000)}s`;
        timeLeftDisplay.style.color = '#ffd93d';
      }
      
      let timeLeft = (thought.timeLimit || 8000);
      const startTime = Date.now();
      
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
      }
      
      this.timeUpdateInterval = setInterval(() => {
        if (!this.isWaitingForResponse || !this.pendingThought) {
          clearInterval(this.timeUpdateInterval);
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLeft - elapsed);
        const seconds = Math.ceil(remaining / 1000);
        
        if (timeLeftDisplay) {
          timeLeftDisplay.textContent = `⏱️ ${seconds}s`;
          if (seconds <= 2) {
            timeLeftDisplay.style.color = '#ff1744';
          } else if (seconds <= 4) {
            timeLeftDisplay.style.color = '#ff6b6b';
          } else {
            timeLeftDisplay.style.color = '#ffd93d';
          }
        }
        
        if (remaining <= 0) {
          clearInterval(this.timeUpdateInterval);
          if (timeLeftDisplay) {
            timeLeftDisplay.textContent = '⏱️ 0s';
            timeLeftDisplay.style.color = '#ff1744';
          }
        }
      }, 100);
      
      if (thought.absurdity > 80) {
        this.ui.showToast('🤪 ¡Pensamiento MEGA ABSURDO!', 'absurd', 2000);
      }
      
      const timeoutId = setTimeout(() => {
        if (this.isWaitingForResponse && this.pendingThought) {
          this.aplicarPenalizacionTimeout();
          
          if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
          }
          
          if (this.rcn.enabled) {
            this.rcn.repeticiones.push({
              ...this.pendingThought,
              intentos: (this.pendingThought.intentos || 0) + 1,
              repetido: true,
              originalId: this.pendingThought.id || this.pendingThought.originalId
            });
          }
          
          this.ui.showToast(
            this.pLang.translateMessage('💩 ¡TIEMPO AGOTADO! -5 pts'),
            'caca',
            3000
          );
          
          this.ui.cacaExplosionEffect();
          
          const thoughtDisplay = document.getElementById('thoughtDisplay');
          if (thoughtDisplay) {
            thoughtDisplay.textContent = '💥 ¡TIEMPO AGOTADO! -5 pts';
            thoughtDisplay.className = 'thought-bubble';
            thoughtDisplay.style.borderColor = '#ff1744';
            thoughtDisplay.style.borderWidth = '3px';
            thoughtDisplay.style.borderStyle = 'solid';
            thoughtDisplay.style.background = 'rgba(255, 23, 68, 0.25)';
            thoughtDisplay.style.transform = 'scale(0.92)';
            thoughtDisplay.style.boxShadow = '0 0 50px rgba(255, 23, 68, 0.5)';
            thoughtDisplay.style.color = '#ff1744';
            thoughtDisplay.style.fontWeight = 'bold';
            
            setTimeout(() => {
              if (thoughtDisplay) {
                thoughtDisplay.className = 'thought-bubble';
                thoughtDisplay.style.borderColor = '';
                thoughtDisplay.style.borderWidth = '';
                thoughtDisplay.style.borderStyle = '';
                thoughtDisplay.style.background = '';
                thoughtDisplay.style.transform = '';
                thoughtDisplay.style.boxShadow = '';
                thoughtDisplay.style.color = '';
                thoughtDisplay.style.fontWeight = '';
                thoughtDisplay.textContent = '💭 Pensando...';
              }
            }, 2000);
          }
          
          this.ui.updateGameUI(this.game.gameState, this.vigia.getVigiaStatus());
          this.actualizarPoderCaca();
          
          this.isWaitingForResponse = false;
          this.pendingThought = null;
          this.thoughtGenerationEnabled = true;
          
          if (timeLeftDisplay) {
            timeLeftDisplay.style.display = 'none';
          }
          
          if (timer) {
            timer.className = 'thought-timer';
            timer.style.width = '0%';
          }
          
          setTimeout(() => {
            if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
              this.generateThought();
            }
          }, 2500);
        }
      }, thought.timeLimit || 8000);
      
      this.currentThoughtTimeout = timeoutId;
    }
  }

  // ============================================
  // APLICAR PENALIZACIÓN POR TIEMPO AGOTADO
  // ============================================
  aplicarPenalizacionTimeout() {
    if (!this.game) return;
    
    const penalizacion = 5;
    
    this.game.gameState.score = Math.max(0, this.game.gameState.score - penalizacion);
    this.game.gameState.xp = Math.max(0, this.game.gameState.xp - penalizacion);
    
    this.cacaStats.cacaCritica++;
    this.game.gameState.streak = 0;
    this.cacaStats.rachaCaca = 0;
    this.cacaStats.cacaMortal++;
    
    if (this.cacaStats.cacaMortal >= 3) {
      this.game.gameState.level = Math.max(1, this.game.gameState.level - 1);
      this.cacaStats.cacaMortal = 0;
      this.ui.showToast(
        this.pLang.translateMessage('💀 ¡CACA MORTAL! Has perdido un nivel...'),
        'error',
        4000
      );
      this.ui.showConfetti(10);
    }
    
    this.cacaStats.poderCaca = Math.max(0, this.cacaStats.poderCaca - 15);
    this.game.saveState();
  }

  // ============================================
  // VERIFICAR RACHA
  // ============================================
  verificarRachaCaca() {
    const streak = this.game.gameState.streak;
    
    if (streak > 0) {
      this.cacaStats.rachaCaca = streak;
      if (streak > this.cacaStats.rachaMaxCaca) {
        this.cacaStats.rachaMaxCaca = streak;
      }
      
      if (streak % 5 === 0 && streak > 0) {
        const bonus = streak * 2;
        this.game.gameState.score += bonus;
        this.game.gameState.xp += bonus;
        this.ui.showToast(
          this.pLang.translateMessage(`🔥 ¡RACHA DE CACA x${streak}! +${bonus} pts bonus`),
          'success',
          3000
        );
        this.ui.showConfetti(20);
      }
    }
  }

  // ============================================
  // RCN - VERIFICAR REPETICIÓN
  // ============================================
  verificarRepeticionRCN() {
    if (!this.rcn.enabled || this.rcn.repeticiones.length === 0) {
      return null;
    }
    
    this.rcn.contador++;
    
    const rendimiento = this.game?.gameState?.score || 0;
    if (rendimiento > 50) {
      this.rcn.intervaloActual = Math.max(3, this.rcn.intervaloBase - 1);
    } else if (rendimiento < 20) {
      this.rcn.intervaloActual = Math.min(6, this.rcn.intervaloBase + 2);
    } else {
      this.rcn.intervaloActual = this.rcn.intervaloBase;
    }
    
    if (this.rcn.contador >= this.rcn.intervaloActual) {
      const repeticion = this.rcn.repeticiones.find(r => {
        const key = r.text + r.absurdity;
        this.rcn.pensamientosRepetidos[key] = (this.rcn.pensamientosRepetidos[key] || 0);
        return this.rcn.pensamientosRepetidos[key] < this.rcn.maxRepeticiones;
      });
      
      if (repeticion) {
        const key = repeticion.text + repeticion.absurdity;
        this.rcn.pensamientosRepetidos[key] = (this.rcn.pensamientosRepetidos[key] || 0) + 1;
        
        if (this.rcn.pensamientosRepetidos[key] >= this.rcn.maxRepeticiones) {
          const index = this.rcn.repeticiones.indexOf(repeticion);
          if (index > -1) {
            this.rcn.repeticiones.splice(index, 1);
          }
        }
        
        this.rcn.contador = 0;
        
        return {
          ...repeticion,
          repetido: true,
          originalId: repeticion.originalId || repeticion.id,
          timeLimit: Math.min(repeticion.timeLimit * 1.2, 10000)
        };
      }
    }
    
    return null;
  }

  // ============================================
  // PROCESAR RCN
  // ============================================
  procesarRCN(decision, thought, acierto) {
    if (!this.rcn.enabled) return;
    
    const key = thought.text + thought.absurdity;
    this.rcn.pensamientosRepetidos[key] = (this.rcn.pensamientosRepetidos[key] || 0);
    
    if (acierto) {
      const index = this.rcn.repeticiones.findIndex(r => r.text === thought.text && r.absurdity === thought.absurdity);
      if (index > -1) {
        this.rcn.repeticiones.splice(index, 1);
        this.cacaStats.repeticionesExitosas++;
        if (this.cacaStats.repeticionesExitosas % 5 === 0) {
          this.ui.showToast(
            this.pLang.translateMessage('🧠 ¡Tu cerebro está aprendiendo sin darte cuenta!'),
            'info',
            2500
          );
        }
      }
    } else {
      const yaExiste = this.rcn.repeticiones.some(r => r.text === thought.text && r.absurdity === thought.absurdity);
      if (!yaExiste && this.rcn.pensamientosRepetidos[key] < this.rcn.maxRepeticiones) {
        this.rcn.repeticiones.push({
          ...thought,
          intentos: (thought.intentos || 0) + 1,
          repetido: true,
          originalId: thought.id || thought.originalId
        });
        this.cacaStats.repeticionesFallidas++;
      }
    }
    
    const totalReps = this.cacaStats.repeticionesExitosas + this.cacaStats.repeticionesFallidas;
    if (totalReps > 0) {
      this.cacaStats.aprendizaje = Math.round((this.cacaStats.repeticionesExitosas / totalReps) * 100);
    }
    
    this.ui.updateElement('aprendizaje', this.cacaStats.aprendizaje + '%');
  }

  // ============================================
  // ACTUALIZAR PODER CACA
  // ============================================
  actualizarPoderCaca() {
    const stats = this.game?.gameState;
    if (!stats) return;
    
    const puntosCaca = Math.min(stats.cacaPoints || 0, 100);
    const rachaBonus = Math.min(stats.streak || 0, 20);
    const nivelBonus = stats.level || 1;
    const cacaPorMinuto = this.sessionStats.cacaPerMinute || 0;
    const aprendizajeBonus = this.cacaStats.aprendizaje / 10;
    
    let poder = 0;
    poder += puntosCaca * 0.25;
    poder += rachaBonus * 1.5;
    poder += nivelBonus * 1.5;
    poder += cacaPorMinuto * 1.5;
    poder += aprendizajeBonus * 2;
    
    this.cacaStats.poderCaca = Math.min(100, Math.round(poder));
    
    const poderFill = document.getElementById('poderCacaFill');
    if (poderFill) {
      poderFill.style.width = this.cacaStats.poderCaca + '%';
      
      if (this.cacaStats.poderCaca > 70) {
        poderFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ff1744)';
      } else if (this.cacaStats.poderCaca > 40) {
        poderFill.style.background = 'linear-gradient(90deg, #ffd93d, #ff6b6b)';
      } else {
        poderFill.style.background = 'linear-gradient(90deg, #4CAF50, #ffd93d)';
      }
    }
    
    const poderText = document.getElementById('poderCacaText');
    if (poderText) {
      poderText.textContent = `💪 CACA POWER ${this.cacaStats.poderCaca}%`;
    }
  }

  // ============================================
  // HANDLE START GAME
  // ============================================
  handleStartGame() {
    console.log('🔥 handleStartGame ejecutado!');
    
    try {
      const { username, absurdLevel, groqKey } = this.ui.getRegisterData();
      console.log('📝 Datos de registro:', { username, absurdLevel, groqKey });
      
      if (!username || username.trim().length === 0) {
        this.ui.showToast('¡Necesitas un nombre de usuario!', 'error');
        return;
      }
      
      if (username.length < 3) {
        this.ui.showToast('¡Nombre muy corto! Necesitas más caca', 'warning');
        return;
      }
      
      const user = {
        id: 'gamer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        username: username.trim(),
        absurdLevel: parseInt(absurdLevel) || 50,
        groqApiKey: groqKey || null,
        createdAt: new Date().toISOString(),
        settings: {
          notifications: true,
          vibration: true,
          soundEffects: true,
          pLangEnabled: true
        }
      };
      
      console.log('👤 Creando usuario:', user.username);
      
      this.db.create('users', user).then(() => {
        console.log('✅ Usuario guardado en DB');
      }).catch(err => {
        console.error('❌ Error guardando usuario:', err);
      });
      
      this.db.setConfig('currentUser', user.id);
      this.db.setConfig('username', user.username);
      this.db.setConfig('absurdLevel', user.absurdLevel);
      
      this.user = user;
      
      this.initializeGame(user).then(() => {
        console.log('✅ Juego inicializado');
        this.ui.showScreen('game');
        this.ui.updateElement('usernameDisplay', user.username);
        
        let welcomeMsg = '¡Bienvenido ' + user.username + '! La caca mental te espera';
        if (user.absurdLevel > 70) {
          welcomeMsg = '¡' + user.username + '! Eres un maestro del absurdo, ¡demuéstralo!';
        } else if (user.absurdLevel < 30) {
          welcomeMsg = '¡' + user.username + '! Empieza tu viaje hacia la caca mental...';
        }
        
        this.ui.showToast(
          this.pLang.translateMessage(welcomeMsg),
          'success',
          5000
        );
        
        setTimeout(() => {
          this.ui.showConfetti(30);
          if (user.absurdLevel > 70) {
            this.ui.cacaExplosionEffect();
          }
        }, 500);
      }).catch(err => {
        console.error('❌ Error inicializando juego:', err);
        this.ui.showToast('Error al iniciar el juego: ' + err.message, 'error');
      });
      
    } catch (error) {
      console.error('❌ Error en handleStartGame:', error);
      this.ui.showToast('Error al iniciar: ' + error.message, 'error');
    }
  }

  // ============================================
  // HANDLE VOTE - CORREGIDO
  // ============================================
  async handleVote(decision) {
    console.log('🎮 Voto recibido:', decision);

    if (!this.isInitialized || !this.game) {
      this.ui.showToast('El juego no está listo', 'error');
      return;
    }

    if (!this.isWaitingForResponse || !this.pendingThought) {
      this.ui.showToast('¡Espera a que aparezca un pensamiento!', 'warning');
      return;
    }

    const thought = this.pendingThought;
    const thoughtDisplay = document.getElementById('thoughtDisplay');
    if (!thoughtDisplay) {
      console.error('❌ No se encontró thoughtDisplay');
      return;
    }

    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }

    if (this.currentThoughtTimeout) {
      clearTimeout(this.currentThoughtTimeout);
      this.currentThoughtTimeout = null;
    }

    const timeLeftDisplay = document.getElementById('timeLeftDisplay');
    if (timeLeftDisplay) timeLeftDisplay.style.display = 'none';

    const timer = document.getElementById('thoughtTimer');
    if (timer) {
      timer.className = 'thought-timer';
      timer.style.width = '0%';
    }

    this.isWaitingForResponse = false;
    this.thoughtGenerationEnabled = false;

    try {
      const timeToDecide = Date.now() - thought.timestamp;
      let bonusExtra = 0;

      if (timeToDecide < 1000) {
        this.cacaStats.cacaPerfecta++;
        bonusExtra = 5;
      }

      const result = await this.game.vote(decision);

      if (!result || result.error) {
        throw new Error(result?.error || 'Error desconocido');
      }

      const esAbsurdo = result.isAbsurd;
      const acierto = result.acierto;

      console.log(`📊 RESULTADO: esAbsurdo=${esAbsurdo}, acierto=${acierto}, decision=${decision}`);
      console.log(`📊 PUNTUACIONES: Score=${result.score}, XP=${result.xp}, CACA=${result.cacaPoints}, CEREBRO=${result.brainPoints}`);

      // FEEDBACK VISUAL
      thoughtDisplay.className = 'thought-bubble';
      thoughtDisplay.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      thoughtDisplay.style.transform = '';
      thoughtDisplay.style.borderColor = '';
      thoughtDisplay.style.borderWidth = '';
      thoughtDisplay.style.borderStyle = '';
      thoughtDisplay.style.background = '';
      thoughtDisplay.style.boxShadow = '';
      thoughtDisplay.style.color = '';
      thoughtDisplay.style.fontSize = '';
      thoughtDisplay.style.fontWeight = '';
      thoughtDisplay.style.textShadow = '';
      thoughtDisplay.style.opacity = '';
      thoughtDisplay.style.scale = '';
      thoughtDisplay.style.display = '';
      
      void thoughtDisplay.offsetHeight;
      
      let mensaje = '';
      let color = '';
      let bgColor = '';
      let transform = '';
      let shadow = '';
      
      if (acierto) {
        if (decision === 'caca') {
          mensaje = `💩 ¡CACA CORRECTA! 🎉 +${result.points || 0} pts`;
          color = '#4CAF50';
          bgColor = 'rgba(76, 175, 80, 0.25)';
          transform = 'scale(1.05)';
          shadow = '0 0 40px rgba(76, 175, 80, 0.4)';
          this.ui.showConfetti(20);
          console.log('✅ ACIERTO CACA (verde)');
        } else {
          mensaje = `🧠 ¡CEREBRO CORRECTO! 🧠 +${result.points || 0} pts`;
          color = '#4d96ff';
          bgColor = 'rgba(77, 150, 255, 0.25)';
          transform = 'scale(1.05)';
          shadow = '0 0 40px rgba(77, 150, 255, 0.4)';
          this.ui.showConfetti(15);
          console.log('✅ ACIERTO CEREBRO (azul)');
        }
        this.ui.playSuccessSound?.();
      } else {
        mensaje = decision === 'caca' 
          ? `💥 ¡ERROR! No era CACA ❌ ${result.points || 0}pts` 
          : `💥 ¡ERROR! No era CEREBRO ❌ ${result.points || 0}pts`;
        color = '#ff1744';
        bgColor = 'rgba(255, 23, 68, 0.25)';
        transform = 'scale(0.92)';
        shadow = '0 0 50px rgba(255, 23, 68, 0.5)';
        
        console.log('❌ FALLO (rojo)');
        
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
        this.ui.playErrorSound?.();
        
        if (Math.random() > 0.3) {
          this.ui.cacaExplosionEffect();
          console.log('💥 EXPLOSIÓN DE CACA ACTIVADA');
        }
      }
      
      thoughtDisplay.textContent = mensaje;
      thoughtDisplay.style.borderColor = color;
      thoughtDisplay.style.borderWidth = '3px';
      thoughtDisplay.style.borderStyle = 'solid';
      thoughtDisplay.style.background = bgColor;
      thoughtDisplay.style.transform = transform;
      thoughtDisplay.style.boxShadow = shadow;
      thoughtDisplay.style.color = color;
      thoughtDisplay.style.fontWeight = 'bold';
      thoughtDisplay.style.fontSize = '';

      if (bonusExtra > 0) {
        this.ui.showToast(
          this.pLang.translateMessage(`⚡ ¡RESPUESTA RÁPIDA! +${bonusExtra} pts extra`),
          'success',
          2000
        );
        this.ui.showConfetti(15);
      }

      // ACTUALIZAR UI
      this.ui.updateGameUI(this.game.gameState, this.vigia.getVigiaStatus());
      
      this.ui.updateElement('cacaCount', this.game.gameState.cacaPoints || 0);
      this.ui.updateElement('cerebroCount', this.game.gameState.brainPoints || 0);
      this.ui.updateElement('xpDisplay', this.game.gameState.xp || 0);
      this.ui.updateElement('scoreDisplay', this.game.gameState.score || 0);
      this.ui.updateElement('levelDisplay', this.game.gameState.level || 1);
      this.ui.updateElement('streakDisplay', this.game.gameState.streak || 0);
      
      // Actualizar precisión y tiempo de respuesta
      this.ui.updateElement('accuracyDisplay', (this.game.gameState.accuracy || 0) + '%');
      this.ui.updateElement('avgTimeDisplay', (this.game.gameState.avgResponseTime || 0) + 'ms');
      
      const xpFill = document.getElementById('xpFill');
      if (xpFill) {
        const xp = this.game.gameState.xp || 0;
        const level = Math.floor(xp / CONFIG.GAME.XP_PER_LEVEL) + 1;
        const xpInLevel = xp % CONFIG.GAME.XP_PER_LEVEL;
        const percentage = (xpInLevel / CONFIG.GAME.XP_PER_LEVEL) * 100;
        xpFill.style.width = Math.min(percentage, 100) + '%';
      }

      console.log(`📊 UI ACTUALIZADA: CACA=${this.game.gameState.cacaPoints}, CEREBRO=${this.game.gameState.brainPoints}, XP=${this.game.gameState.xp}, Score=${this.game.gameState.score}`);

      this.procesarRCN(decision, thought, acierto);

      if (result.message) {
        this.ui.showToast(result.message, esAbsurdo ? 'caca' : 'brain', 3000);
      }

      if (esAbsurdo && acierto) {
        this.verificarRachaCaca();
        if (Math.random() > 0.4) {
          this.ui.cacaExplosionEffect();
        }
      }

      this.actualizarPoderCaca();

      if (this.achievements) {
        const newAchievements = await this.achievements.checkAchievements(this.game.gameState);
        if (newAchievements.length > 0) {
          for (const ach of newAchievements) {
            const msg = this.achievements.getAchievementMessage(ach);
            this.ui.showToast(msg, 'achievement', 6000);
            this.ui.showConfetti(50);
          }
        }
      }

      this.sessionStats.decisions.push({
        decision,
        time: Date.now(),
        points: result.points || 0,
        timeToDecide: timeToDecide,
        repetido: thought.repetido || false,
        acierto: acierto
      });
      this.updateSessionStats();

      await this.game.saveState();
      await this.vigia.save();

      setTimeout(() => {
        if (thoughtDisplay) {
          thoughtDisplay.className = 'thought-bubble';
          thoughtDisplay.style.transform = '';
          thoughtDisplay.style.borderColor = '';
          thoughtDisplay.style.borderWidth = '';
          thoughtDisplay.style.borderStyle = '';
          thoughtDisplay.style.background = '';
          thoughtDisplay.style.boxShadow = '';
          thoughtDisplay.style.transition = '';
          thoughtDisplay.style.color = '';
          thoughtDisplay.style.fontWeight = '';
          thoughtDisplay.style.fontSize = '';
          thoughtDisplay.style.textShadow = '';
          thoughtDisplay.style.opacity = '';
          thoughtDisplay.style.scale = '';
          
          void thoughtDisplay.offsetHeight;
          
          if (!this.isWaitingForResponse) {
            thoughtDisplay.textContent = '💭 Pensando...';
          }
        }
      }, 2500);

      this.thoughtGenerationEnabled = true;
      this.pendingThought = null;

      setTimeout(() => {
        if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
          this.generateThought();
        }
      }, 1500);

      return result;

    } catch (error) {
      console.error('❌ Error en handleVote:', error);
      
      if (thoughtDisplay) {
        thoughtDisplay.className = 'thought-bubble';
        thoughtDisplay.textContent = '💥 ¡ERROR! Vuelve a intentarlo';
        thoughtDisplay.style.borderColor = '#ff1744';
        thoughtDisplay.style.borderWidth = '3px';
        thoughtDisplay.style.borderStyle = 'solid';
        thoughtDisplay.style.background = 'rgba(255, 23, 68, 0.2)';
        thoughtDisplay.style.transform = 'scale(0.95)';
        setTimeout(() => {
          if (thoughtDisplay) {
            thoughtDisplay.className = 'thought-bubble';
            thoughtDisplay.style.transform = '';
            thoughtDisplay.style.borderColor = '';
            thoughtDisplay.style.borderWidth = '';
            thoughtDisplay.style.borderStyle = '';
            thoughtDisplay.style.background = '';
            thoughtDisplay.textContent = '💭 Pensando...';
          }
        }, 2000);
      }

      this.ui.showToast('💥 Error al procesar tu voto', 'error', 3000);
      this.thoughtGenerationEnabled = true;
      this.pendingThought = null;
      
      setTimeout(() => {
        if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
          this.generateThought();
        }
      }, 2000);
      
      return { error: error.message };
    }
  }

  // ============================================
  // HANDLE RESET - CON ESTILO ABSURDO
  // ============================================
  async handleReset() {
    if (!this.isInitialized || !this.game) {
      this.ui.showToast('El juego no está inicializado', 'error');
      return;
    }
    
    // Crear modal de confirmación absurdo
    const messages = [
      '💩 ¿Resetear? ¡Perderás toda tu caca acumulada!',
      '🔥 ¡No borres tu legado de caca! ¿Seguro?',
      '💀 ¿Empezar de nuevo? La caca te espera...',
      '🤪 ¡CACA RESET! ¿Estás seguro de querer perder tu caca mental?',
      '🎮 ¿Reiniciar partida? Tus stats de caca se irán al baño...'
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    // Modal personalizado en lugar de confirm()
    const confirmed = await this.showAbsurdConfirm(
      '💩 ¡CACA RESET!',
      msg,
      '💩 ¡RESETEAR!',
      '🧠 ¡NO, SOY PRO!'
    );
    
    if (!confirmed) return;
    
    try {
      const result = await this.game.reset();
      
      if (result && result.success) {
        this.vigia.metrics.decisionPatterns = [];
        this.vigia.metrics.absurdityLevel = 50;
        this.vigia.metrics.gameFlow = 'optimal';
        await this.vigia.save();
        
        this.sessionStats.decisions = [];
        this.sessionStats.startTime = Date.now();
        
        this.rcn = {
          enabled: true,
          history: [],
          repeticiones: [],
          intervaloBase: 4,
          intervaloActual: 4,
          contador: 0,
          maxRepeticiones: 2,
          pensamientosRepetidos: {},
          umbralDificultad: 70,
          ultimoPensamiento: null,
          pensamientosMostrados: 0,
          aciertosConsecutivos: 0,
          fallosConsecutivos: 0
        };
        
        this.cacaStats = {
          cacaCritica: 0,
          rachaCaca: 0,
          rachaMaxCaca: 0,
          cacaPerfecta: 0,
          cacaMortal: 0,
          poderCaca: 0,
          comboActual: 0,
          comboMaximo: 0,
          repeticionesExitosas: 0,
          repeticionesFallidas: 0,
          aprendizaje: 0
        };
        
        this.isWaitingForResponse = false;
        this.pendingThought = null;
        this.thoughtGenerationEnabled = true;
        
        if (this.currentThoughtTimeout) {
          clearTimeout(this.currentThoughtTimeout);
          this.currentThoughtTimeout = null;
        }
        
        if (this.timeUpdateInterval) {
          clearInterval(this.timeUpdateInterval);
          this.timeUpdateInterval = null;
        }
        
        const timeLeftDisplay = document.getElementById('timeLeftDisplay');
        if (timeLeftDisplay) {
          timeLeftDisplay.style.display = 'none';
        }
        
        const timer = document.getElementById('thoughtTimer');
        if (timer) {
          timer.className = 'thought-timer';
          timer.style.width = '0%';
        }
        
        this.ui.updateGameUI(this.game.gameState, this.vigia.getVigiaStatus());
        this.actualizarPoderCaca();
        this.ui.showToast(result.message, 'info', 4000);
        this.ui.showConfetti(20);
        
        setTimeout(() => {
          if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
            this.generateThought();
          }
        }, 1500);
        
        return result;
      }
      
    } catch (error) {
      console.error('Error resetting:', error);
      this.ui.showToast('Error al resetear: ' + error.message, 'error');
    }
  }

  // ============================================
  // 🆕 MODAL DE CONFIRMACIÓN ABSURDO
  // ============================================
  showAbsurdConfirm(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
      let modal = document.getElementById('absurdConfirmModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'absurdConfirmModal';
        modal.className = 'modal-overlay caca-modal';
        document.body.appendChild(modal);
      }
      
      modal.innerHTML = `
        <div class="modal-content caca-modal-content confirm-modal">
          <div class="modal-header">
            <span class="modal-icon">💩</span>
            <h2>${title}</h2>
          </div>
          <div class="modal-body">
            <p class="confirm-message">${message}</p>
            <div class="confirm-actions">
              <button class="btn-confirm-caca" id="confirmYes">${confirmText}</button>
              <button class="btn-confirm-brain" id="confirmNo">${cancelText}</button>
            </div>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
      
      document.getElementById('confirmYes').addEventListener('click', () => {
        modal.style.display = 'none';
        resolve(true);
      });
      
      document.getElementById('confirmNo').addEventListener('click', () => {
        modal.style.display = 'none';
        resolve(false);
      });
      
      // Cerrar al hacer clic fuera
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          resolve(false);
        }
      });
    });
  }

  // ============================================
  // HANDLE SHARE
  // ============================================
  async handleShare() {
    if (!this.game) {
      this.ui.showToast('Espera a que el juego esté listo', 'error');
      return;
    }
    
    const stats = this.game.gameState;
    const vigiaStatus = this.vigia?.getVigiaStatus() || {};
    const diff = this.game.getDifficulty();
    
    const shareText = `💩 CACA BRAIN ULTRA v2.0 - Mis stats épicos:
    
🎯 Dificultad: ${diff.level.toUpperCase()}
🎮 Score: ${stats.score || 0}
🏆 Nivel: ${stats.level || 1}
⭐ XP: ${stats.xp || 0}
🔥 Racha: ${stats.streak || 0}
💩 CACA: ${stats.cacaPoints || 0}
🧠 CEREBRO: ${stats.brainPoints || 0}
🎯 Precisión: ${stats.accuracy || 0}%
⚡ Tiempo respuesta: ${stats.avgResponseTime || 0}ms
${vigiaStatus.emoji || '🧠'} Estado: ${vigiaStatus.message || '¡Absurdo activado!'}

💪 CACA POWER: ${this.cacaStats.poderCaca}%
🔥 Racha máxima CACA: ${this.cacaStats.rachaMaxCaca}
⚡ CACA Perfecta: ${this.cacaStats.cacaPerfecta}
🧠 Aprendizaje RCN: ${this.cacaStats.aprendizaje}%

🎮 ¡Únete al absurdo y descarga CACA BRAIN ULTRA!`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mi CACA BRAIN ULTRA v2.0',
          text: shareText,
        });
        this.ui.showToast('¡Compartido con éxito!', 'success');
      } else {
        await navigator.clipboard.writeText(shareText);
        this.ui.showToast('📋 ¡Texto copiado! Comparte tu absurdez', 'success');
        this.ui.showConfetti(10);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        this.ui.showToast('Error al compartir', 'error');
      }
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  startStatsUpdate() {
    setInterval(() => {
      this.updateSessionStats();
    }, 5000);
  }

  updateSessionStats() {
    if (!this.game) return;
    
    const stats = this.game.gameState;
    const elapsed = (Date.now() - (this.sessionStats.startTime || Date.now())) / 60000;
    
    if (elapsed > 0) {
      const totalDecisions = this.sessionStats.decisions.length;
      const cacaCount = this.sessionStats.decisions.filter(d => d.decision === 'caca').length;
      
      this.sessionStats.cacaPerMinute = Math.round((cacaCount / elapsed) * 10) / 10;
      
      this.ui.updateElement('cacaPerMinute', this.sessionStats.cacaPerMinute + '/min');
    }
    
    const playTime = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(playTime / 60);
    const seconds = playTime % 60;
    this.ui.updateElement('playTime', `${minutes}m ${seconds}s`);
    
    this.actualizarPoderCaca();
  }

  // ============================================
  // LISTENERS GLOBALES
  // ============================================
  setupGlobalListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.isInitialized || !this.game) return;
      
      if (e.key === '1' || e.key === 'c' || e.key === 'C') {
        this.handleVote('caca');
        e.preventDefault();
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        this.handleVote('cerebro');
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        if (e.ctrlKey) return;
        this.handleReset();
        e.preventDefault();
      } else if (e.key === 'd' || e.key === 'D') {
        const levels = ['facil', 'normal', 'dificil', 'experto'];
        const current = this.game?.difficulty?.selected || 'normal';
        const index = levels.indexOf(current);
        const next = levels[(index + 1) % levels.length];
        this.handleDifficultyChange(next);
        e.preventDefault();
      } else if (e.key === 'h' || e.key === 'H') {
        this.showScoreHistory();
        e.preventDefault();
      } else if (e.key === 's' || e.key === 'S') {
        this.showStats();
        e.preventDefault();
      } else if (e.key === 'a' || e.key === 'A') {
        this.showAchievements();
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'Space') {
        const effects = ['cacaExplosion', 'showConfetti', 'absurdParticle'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        if (this.ui[effect]) {
          this.ui[effect]();
        }
        e.preventDefault();
      }
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.cacaCompa) {
          this.cacaCompa.isActive = false;
        }
        this.thoughtGenerationEnabled = false;
      } else {
        if (this.cacaCompa) {
          this.cacaCompa.isActive = true;
        }
        this.thoughtGenerationEnabled = true;
        if (this.isInitialized && !this.isWaitingForResponse) {
          setTimeout(() => {
            if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
              this.generateThought();
            }
          }, 1000);
        }
      }
    });
    
    window.addEventListener('error', (e) => {
      console.error('Error global:', e);
      this.ui.showToast('Error: ' + e.message, 'error');
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================
  getFullState() {
    return {
      user: this.user,
      gameState: this.game?.gameState || null,
      metrics: this.vigia?.metrics || null,
      achievements: this.achievements?.getUnlockedAchievements() || [],
      sessionStats: this.sessionStats,
      cacaStats: this.cacaStats,
      rcn: this.rcn,
      difficulty: this.game?.getDifficulty() || null,
      scoreHistory: this.game?.getScoreHistory(10) || [],
      isReady: this.isReady,
      isInitialized: this.isInitialized,
      isWaitingForResponse: this.isWaitingForResponse
    };
  }

  destroy() {
    if (this.cacaCompa) {
      this.cacaCompa.destroy();
    }
    
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    
    if (this.currentThoughtTimeout) {
      clearTimeout(this.currentThoughtTimeout);
      this.currentThoughtTimeout = null;
    }
    
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    
    this.ui.destroy();
    
    this.isInitialized = false;
    this.isReady = false;
    
    console.log('🧹 CACA BRAIN ULTRA v2.0 destruido');
  }

  async recover() {
    try {
      console.log('🔄 Intentando recuperar CACA BRAIN ULTRA...');
      
      await this.checkSavedSession();
      
      if (!this.user) {
        this.ui.showScreen('register');
        this.ui.showToast('Sesión perdida. Regístrate de nuevo.', 'info');
        return false;
      }
      
      if (!this.isInitialized) {
        await this.initializeGame(this.user);
        this.ui.showScreen('game');
        this.ui.showToast('¡Recuperado!', 'success');
        return true;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error en recuperación:', error);
      this.ui.showToast('Error al recuperar: ' + error.message, 'error');
      return false;
    }
  }
}

// ============================================
// EXPORTAR E INICIAR
// ============================================

console.log('🚀 CACA BRAIN ULTRA v2.0 - Cargando...');

const app = new CacaBrainApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, iniciando app...');
    app.init();
  });
} else {
  console.log('📄 DOM ya cargado, iniciando app...');
  app.init();
}

window.CacaBrainApp = app;
window.CACA_BRAIN = app;

export default app;