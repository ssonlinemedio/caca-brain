// js/modules/GameEngine.js - CACA BRAIN ULTRA v2.0
// Motor del juego - VERSIÓN CORREGIDA Y PERFECTA

import CONFIG from '../config.js';
import SeedLoader from './SeedLoader.js';

class GameEngine {
  constructor(db, pLang) {
    this.db = db;
    this.pLang = pLang;
    this.user = null;
    this.vigia = null;
    this.isInitialized = false;
    this.currentThought = null;
    this.startTime = null;
    
    // Pensamientos - se cargan desde DB
    this.thoughts = [];
    this.thoughtHistory = [];
    this.usedThoughts = new Map();
    this.maxHistory = CONFIG.THOUGHTS?.MAX_HISTORY || 200;
    
    // Dificultad
    this.difficulty = {
      level: 'normal',
      multipliers: {
        facil: { timeBonus: 0.5, pointsMultiplier: 0.7, timeLimit: 1.5 },
        normal: { timeBonus: 1.0, pointsMultiplier: 1.0, timeLimit: 1.0 },
        dificil: { timeBonus: 1.5, pointsMultiplier: 1.3, timeLimit: 0.7 },
        experto: { timeBonus: 2.0, pointsMultiplier: 1.6, timeLimit: 0.5 }
      },
      selected: 'normal'
    };
    
    // Historial de scores
    this.scoreHistory = [];
    this.maxHistorySize = 100;
    this.sessionStats = {
      startTime: null,
      endTime: null,
      totalCorrect: 0,
      totalIncorrect: 0,
      maxStreak: 0,
      avgResponseTime: 0,
      responseTimes: [],
      decisions: []
    };
    
    // Estado del juego
    this.gameState = {
      isPlaying: false,
      score: 0,
      level: 1,
      xp: 0,
      streak: 0,
      totalDecisions: 0,
      cacaPoints: 0,
      brainPoints: 0,
      lastVote: null,
      lastVoteTime: null,
      absurdLevel: 50,
      bestStreak: 0,
      totalCaca: 0,
      totalBrain: 0,
      cacaStreak: 0,
      brainStreak: 0,
      combo: 0,
      maxCombo: 0,
      playTime: 0,
      startTime: null,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      avgResponseTime: 0
    };
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  async init(user, vigia) {
    this.user = user;
    this.vigia = vigia;
    this.isInitialized = true;
    this.gameState.isPlaying = true;
    this.startTime = Date.now();
    this.gameState.startTime = this.startTime;
    this.gameState.absurdLevel = user.absurdLevel || 50;
    
    // Cargar dificultad guardada
    this.difficulty.selected = this.db.getConfig('difficulty') || 'normal';
    
    // Cargar historial
    await this.loadScoreHistory();
    
    // Cargar pensamientos desde DB
    await this.loadThoughtsFromDB();
    
    await this.loadState();
    
    console.log(`✅ GameEngine inicializado con ${this.thoughts.length} pensamientos`);
    console.log(`🎯 Dificultad: ${this.difficulty.selected}`);
    return { success: true };
  }

  // ============================================
  // CARGAR PENSAMIENTOS DESDE DB
  // ============================================
  async loadThoughtsFromDB() {
    try {
      const thoughts = await this.db.readAll('thoughts');
      if (thoughts && thoughts.length > 0) {
        this.thoughts = thoughts;
        console.log(`🧠 ${this.thoughts.length} pensamientos cargados desde IndexedDB`);
        return;
      }
      
      const seedLoader = new SeedLoader(this.db);
      const seedThoughts = await seedLoader.getThoughts();
      if (seedThoughts && seedThoughts.length > 0) {
        this.thoughts = seedThoughts;
        console.log(`🌱 ${this.thoughts.length} pensamientos cargados desde seed`);
      }
    } catch (error) {
      console.error('Error cargando pensamientos:', error);
      this.thoughts = this.getDefaultThoughts();
    }
  }

  getDefaultThoughts() {
    return [
      { text: '¿Los peces sueñan con electricistas?', absurdity: 85, category: 'existencial' },
      { text: '2 + 2 = 4', absurdity: 0, category: 'matemático' },
      { text: '¿El agua tiene sed?', absurdity: 90, category: 'elemental' },
      { text: 'El agua hierve a 100 grados', absurdity: 10, category: 'ciencia' },
      { text: '¿La caca sueña con ser caca?', absurdity: 100, category: 'meta' },
      { text: 'La Tierra gira alrededor del Sol', absurdity: 5, category: 'ciencia' },
    ];
  }

  // ============================================
  // CONFIGURACIÓN DE DIFICULTAD
  // ============================================
  setDifficulty(level) {
    const validLevels = ['facil', 'normal', 'dificil', 'experto'];
    if (!validLevels.includes(level)) return false;
    
    this.difficulty.selected = level;
    this.difficulty.level = level;
    this.db.setConfig('difficulty', level);
    console.log(`🎯 Dificultad cambiada a: ${level}`);
    return true;
  }

  getDifficulty() {
    return {
      level: this.difficulty.selected,
      config: this.difficulty.multipliers[this.difficulty.selected]
    };
  }

  // ============================================
  // HISTORIAL DE SCORES
  // ============================================
  async loadScoreHistory() {
    try {
      const history = this.db.getConfig('scoreHistory');
      if (history && Array.isArray(history)) {
        this.scoreHistory = history.slice(-this.maxHistorySize);
      }
    } catch (e) {
      console.warn('Error cargando historial:', e);
      this.scoreHistory = [];
    }
  }

  async saveScoreHistory() {
    try {
      this.db.setConfig('scoreHistory', this.scoreHistory.slice(-this.maxHistorySize));
    } catch (e) {
      console.warn('Error guardando historial:', e);
    }
  }

  addScoreEntry(entry) {
    const newEntry = {
      ...entry,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      difficulty: this.difficulty.selected
    };
    this.scoreHistory.push(newEntry);
    if (this.scoreHistory.length > this.maxHistorySize) {
      this.scoreHistory.shift();
    }
    this.saveScoreHistory();
  }

  getScoreHistory(limit = 20) {
    return this.scoreHistory.slice(-limit).reverse();
  }

  getScoreStats() {
    if (this.scoreHistory.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0, count: 0, byDifficulty: {} };
    }
    
    const scores = this.scoreHistory.map(s => s.score || 0);
    const byDifficulty = {};
    
    for (const entry of this.scoreHistory) {
      const diff = entry.difficulty || 'normal';
      if (!byDifficulty[diff]) byDifficulty[diff] = [];
      byDifficulty[diff].push(entry.score || 0);
    }
    
    const diffStats = {};
    for (const [diff, vals] of Object.entries(byDifficulty)) {
      diffStats[diff] = {
        count: vals.length,
        average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        max: Math.max(...vals),
        min: Math.min(...vals)
      };
    }
    
    return {
      total: scores.reduce((a, b) => a + b, 0),
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      max: Math.max(...scores),
      min: Math.min(...scores),
      count: scores.length,
      byDifficulty: diffStats
    };
  }

  // ============================================
  // GENERAR PENSAMIENTO
  // ============================================
  generateThought() {
    if (!this.isInitialized) return null;
    if (this.thoughts.length === 0) {
      console.warn('⚠️ No hay pensamientos disponibles');
      return null;
    }

    const availableThoughts = this.getAvailableThoughts();
    
    if (availableThoughts.length === 0) {
      this.thoughtHistory = [];
      this.usedThoughts.clear();
      return this.generateThought();
    }

    const baseThought = availableThoughts[Math.floor(Math.random() * availableThoughts.length)];
    
    // Aplicar variación de absurdez
    let absurdity = this.applyAbsurdityVariation(baseThought.absurdity);
    
    // Aplicar límite de tiempo según dificultad
    const diffConfig = this.difficulty.multipliers[this.difficulty.selected];
    let timeLimit = this.calculateTimeLimit(absurdity);
    timeLimit = Math.round(timeLimit * diffConfig.timeLimit);
    
    const thought = {
      ...baseThought,
      absurdity: Math.round(Math.min(100, Math.max(0, absurdity))),
      timeLimit: Math.min(12000, Math.max(3000, timeLimit)),
      timestamp: Date.now(),
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      difficulty: this.difficulty.selected
    };

    this.recordThoughtUsage(baseThought);
    this.currentThought = thought;
    
    const tipo = thought.absurdity > CONFIG.THOUGHTS?.CACA_THRESHOLD ? '💩 CACA' : '🧠 CEREBRO';
    console.log(`💭 Pensamiento: "${thought.text}" | Absurdity: ${thought.absurdity} | ${tipo} | Dificultad: ${this.difficulty.selected}`);
    
    return thought;
  }

  getAvailableThoughts() {
    const usedIds = new Set();
    const recentHistory = this.thoughtHistory.slice(-CONFIG.THOUGHTS?.CACHE_SIZE || 50);
    recentHistory.forEach(t => usedIds.add(t.id));
    
    const available = this.thoughts.filter(t => !usedIds.has(t.id));
    return available.length === 0 ? this.thoughts : available;
  }

  applyAbsurdityVariation(baseAbsurdity) {
    let variation = 0;
    
    if (this.vigia && this.vigia.adaptations) {
      const vigiaVariation = this.vigia.adaptations.absurdityVariation || 0.2;
      variation += (Math.random() - 0.5) * vigiaVariation * 100;
    }
    
    const userAbsurdity = this.gameState.absurdLevel || 50;
    const userInfluence = (userAbsurdity - 50) * 0.3;
    
    let absurdity = baseAbsurdity + variation + userInfluence;
    return Math.min(100, Math.max(0, absurdity));
  }

  calculateTimeLimit(absurdity) {
    const difficulty = this.vigia?.adaptations?.difficulty || 1;
    let timeLimit = Math.max(5000, 10000 - (difficulty * 1000));
    
    if (absurdity > 80) timeLimit *= 0.85;
    else if (absurdity < 30) timeLimit *= 1.15;
    
    return Math.round(Math.min(12000, Math.max(4000, timeLimit)));
  }

  recordThoughtUsage(thought) {
    this.thoughtHistory.push({
      ...thought,
      usedAt: Date.now()
    });
    
    if (this.thoughtHistory.length > this.maxHistory) {
      this.thoughtHistory.shift();
    }
    
    const usedCount = this.usedThoughts.get(thought.id) || 0;
    this.usedThoughts.set(thought.id, usedCount + 1);
    
    if (thought.id && !thought.id.startsWith('thought_')) {
      this.db.markThoughtUsed(thought.id).catch(() => {});
    }
  }

  // ============================================
  // VOTAR - CORREGIDO (PENALIZACIÓN FUNCIONA)
  // ============================================
  async vote(decision) {
    if (!this.isInitialized) {
      return { error: 'El juego no está inicializado' };
    }

    const thought = this.currentThought;

    if (!thought) {
      return { error: 'No hay pensamiento activo' };
    }

    const timeToDecide = Date.now() - thought.timestamp;
    const diffConfig = this.difficulty.multipliers[this.difficulty.selected];

    // ==========================================
    // 🔥 DETERMINAR SI ES ABSURDO Y SI ACERTÓ
    // ==========================================
    const esAbsurdo = thought.absurdity > CONFIG.THOUGHTS?.CACA_THRESHOLD;
    const acierto = (decision === 'caca' && esAbsurdo) || (decision === 'cerebro' && !esAbsurdo);

    console.log(`📊 VOTO: "${thought.text}" | Absurdity: ${thought.absurdity} | esAbsurdo: ${esAbsurdo} | Usuario: ${decision} | ACIERTO: ${acierto}`);

    // ==========================================
    // 🔥 CALCULAR PUNTOS - CON PENALIZACIÓN
    // ==========================================
    let points = 0;
    
    if (acierto) {
      // ✅ ACIERTO - PUNTOS POSITIVOS
      let basePoints = esAbsurdo ? 10 : 5;
      
      let timeBonus = 0;
      const timeThreshold = 1000 / diffConfig.timeBonus;
      if (timeToDecide < timeThreshold) timeBonus = 3 * diffConfig.timeBonus;
      else if (timeToDecide < timeThreshold * 2) timeBonus = 1 * diffConfig.timeBonus;
      else if (timeToDecide < timeThreshold * 3) timeBonus = 0;
      else timeBonus = -1;

      const absurdBonus = thought.absurdity / 20;
      const streakBonus = Math.min(this.gameState.streak * 0.3, 5);
      
      let comboBonus = 0;
      if (this.gameState.combo > 0) {
        comboBonus = Math.min(this.gameState.combo * 0.5, 5);
      }

      const userAbsurdBonus = (this.gameState.absurdLevel - 50) / 20;

      points = Math.round(
        (basePoints + timeBonus + absurdBonus + streakBonus + comboBonus + userAbsurdBonus) * diffConfig.pointsMultiplier
      );
      points = Math.max(1, points);
      
      // Incrementar combo
      this.gameState.combo += 1;
      if (this.gameState.combo > this.gameState.maxCombo) {
        this.gameState.maxCombo = this.gameState.combo;
      }
      
      // Estadísticas de aciertos
      this.gameState.correctAnswers++;
      this.sessionStats.totalCorrect++;
      
      console.log(`✅ ACIERTO: +${points} pts`);
      
    } else {
      // ❌ FALLO - PUNTOS NEGATIVOS
      points = Math.round(-3 * diffConfig.pointsMultiplier);
      
      // Resetear combo y racha
      this.gameState.combo = 0;
      this.gameState.streak = 0;
      this.gameState.cacaStreak = 0;
      this.gameState.brainStreak = 0;
      
      // Estadísticas de fallos
      this.gameState.incorrectAnswers++;
      this.sessionStats.totalIncorrect++;
      
      // APLICAR PENALIZACIÓN REAL
      this.gameState.score = Math.max(0, this.gameState.score + points);
      this.gameState.xp = Math.max(0, this.gameState.xp + points);
      
      // Penalizar también los puntos específicos
      if (decision === 'caca') {
        this.gameState.cacaPoints = Math.max(0, this.gameState.cacaPoints + points);
      } else {
        this.gameState.brainPoints = Math.max(0, this.gameState.brainPoints + points);
      }
      
      console.log(`❌ FALLO: Penalización de ${points} pts`);
    }

    // ==========================================
    // 🔥 ACTUALIZAR ESTADO GENERAL
    // ==========================================
    this.gameState.totalDecisions++;
    this.gameState.playTime = Math.floor((Date.now() - this.startTime) / 1000);

    // Actualizar puntos específicos en caso de acierto
    if (acierto) {
      if (esAbsurdo) {
        this.gameState.cacaPoints += points;
        this.gameState.totalCaca += points;
        this.gameState.streak++;
        this.gameState.cacaStreak = (this.gameState.cacaStreak || 0) + 1;
        this.gameState.brainStreak = 0;
        this.gameState.absurdLevel = Math.min(100, this.gameState.absurdLevel + 0.5);
      } else {
        this.gameState.brainPoints += points;
        this.gameState.totalBrain += points;
        this.gameState.streak = 0;
        this.gameState.brainStreak = (this.gameState.brainStreak || 0) + 1;
        this.gameState.cacaStreak = 0;
        this.gameState.absurdLevel = Math.max(0, this.gameState.absurdLevel - 0.3);
      }
    }

    // Actualizar mejor racha
    if (this.gameState.streak > this.gameState.bestStreak) {
      this.gameState.bestStreak = this.gameState.streak;
    }

    // ==========================================
    // 🔥 CALCULAR ESTADÍSTICAS
    // ==========================================
    const total = this.gameState.correctAnswers + this.gameState.incorrectAnswers;
    this.gameState.accuracy = total > 0 ? Math.round((this.gameState.correctAnswers / total) * 100) : 0;

    this.sessionStats.responseTimes.push(timeToDecide);
    const avgTime = this.sessionStats.responseTimes.reduce((a, b) => a + b, 0) / this.sessionStats.responseTimes.length;
    this.gameState.avgResponseTime = Math.round(avgTime);

    // ==========================================
    // 🔥 VERIFICAR SUBIDA DE NIVEL
    // ==========================================
    const oldLevel = this.gameState.level;
    this.gameState.level = Math.floor(this.gameState.xp / CONFIG.GAME.XP_PER_LEVEL) + 1;

    let levelUp = false;
    if (this.gameState.level > oldLevel) {
      levelUp = true;
      this.onLevelUp();
    }

    // ==========================================
    // 🔥 GUARDAR EN HISTORIAL (CADA 50 PUNTOS)
    // ==========================================
    if (this.gameState.score > 0 && this.gameState.score % 50 === 0) {
      this.addScoreEntry({
        score: this.gameState.score,
        level: this.gameState.level,
        streak: this.gameState.streak,
        cacaPoints: this.gameState.cacaPoints,
        brainPoints: this.gameState.brainPoints,
        accuracy: this.gameState.accuracy
      });
    }

    await this.saveState();

    // ==========================================
    // 🔥 ANÁLISIS DEL VIGÍA
    // ==========================================
    let analysis = null;
    let recommendations = [];
    
    if (this.vigia) {
      analysis = this.vigia.analyzeDecision(decision, timeToDecide, thought.absurdity);
      recommendations = analysis.recommendations || [];
    }

    // ==========================================
    // 🔥 CONSTRUIR RESULTADO
    // ==========================================
    const result = {
      points: points,
      isAbsurd: esAbsurdo,
      acierto: acierto,
      timeToDecide: timeToDecide,
      thought: thought.text,
      thoughtAbsurdity: thought.absurdity,
      streak: this.gameState.streak,
      level: this.gameState.level,
      xp: this.gameState.xp,
      score: this.gameState.score,
      cacaPoints: this.gameState.cacaPoints,
      brainPoints: this.gameState.brainPoints,
      combo: this.gameState.combo,
      maxCombo: this.gameState.maxCombo,
      accuracy: this.gameState.accuracy,
      avgResponseTime: this.gameState.avgResponseTime,
      analysis: analysis,
      vigiaStatus: this.vigia?.getVigiaStatus() || {},
      recommendations: recommendations,
      message: this.getResultMessage(acierto, esAbsurdo, points, thought.absurdity),
      levelUp: levelUp,
      absurdLevel: this.gameState.absurdLevel,
      difficulty: this.difficulty.selected
    };

    console.log(`📊 RESULTADO: ${acierto ? '✅ ACIERTO' : '❌ FALLO'} | ${esAbsurdo ? '💩 CACA' : '🧠 CEREBRO'} | ${points}pts`);
    console.log(`📊 STATS: Score: ${this.gameState.score} | XP: ${this.gameState.xp} | CACA: ${this.gameState.cacaPoints} | CEREBRO: ${this.gameState.brainPoints} | Precisión: ${this.gameState.accuracy}%`);

    return result;
  }

  // ============================================
  // MENSAJE DE RESULTADO
  // ============================================
  getResultMessage(acierto, esAbsurdo, points, absurdity) {
    if (!acierto) {
      const fallos = [
        '😅 ¡Has fallado! Era ' + (esAbsurdo ? 'CACA 💩' : 'CEREBRO 🧠'),
        '💥 ¡Error! La respuesta era ' + (esAbsurdo ? 'CACA' : 'CEREBRO'),
        '🤔 ¡No era eso! Era ' + (esAbsurdo ? 'CACA' : 'CEREBRO'),
        '😵 ¡Fallaste! Era ' + (esAbsurdo ? 'CACA 💩' : 'CEREBRO 🧠')
      ];
      const msg = fallos[Math.floor(Math.random() * fallos.length)];
      return this.pLang ? this.pLang.translateMessage(msg) : msg;
    }

    let messages = [];
    if (esAbsurdo) {
      if (points > 20) messages = ['💩 ¡CACA LEGENDARIA! +' + points + ' pts', '🔥 ¡ABSURDO MÁXIMO! +' + points + ' pts'];
      else if (points > 10) messages = ['💩 ¡CACA PRO! +' + points + ' pts', '⚡ ¡ABSURDO POTENTE! +' + points + ' pts'];
      else messages = ['💩 CACA +' + points + ' pts', '💨 Absurdo +' + points + ' pts'];
    } else {
      if (points > 20) messages = ['🧠 ¡GENIO ABSOLUTO! +' + points + ' pts', '💡 ¡ILUMINACIÓN! +' + points + ' pts'];
      else if (points > 10) messages = ['🧠 ¡CEREBRO ACTIVADO! +' + points + ' pts', '⚡ ¡LÓGICA PRO! +' + points + ' pts'];
      else messages = ['🧠 Cerebro +' + points + ' pts', '💡 Lógica +' + points + ' pts'];
    }

    const message = messages[Math.floor(Math.random() * messages.length)];
    let comment = absurdity > 80 ? ' 🤪 ¡MEGA ABSURDO!' : absurdity > 60 ? ' 🤔 Bastante absurdo...' : absurdity < 30 ? ' 🧠 Muy lógico...' : '';
    const finalMessage = message + comment;
    return this.pLang ? this.pLang.translateMessage(finalMessage) : finalMessage;
  }

  // ============================================
  // SUBIDA DE NIVEL
  // ============================================
  onLevelUp() {
    const messages = [
      '🚀 ¡SUBISTE DE NIVEL! Nivel ' + this.gameState.level,
      '💪 ¡Nuevo nivel! ' + this.gameState.level,
      '🌟 ¡EVOLUCIONASTE! Nivel ' + this.gameState.level,
      '🔥 ¡RANK UP! Nivel ' + this.gameState.level
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const translated = this.pLang ? this.pLang.translateMessage(message) : message;
    
    if (typeof window !== 'undefined' && window.CACA_BRAIN) {
      window.CACA_BRAIN.ui?.showToast(translated, 'success', 4000);
      window.CACA_BRAIN.ui?.showConfetti(30);
    }
  }

  // ============================================
  // GUARDAR ESTADO
  // ============================================
  async saveState() {
    try {
      this.db.setConfig('gameState', this.gameState);
      this.db.setConfig('difficulty', this.difficulty.selected);
      
      await this.db.create('sessions', {
        userId: this.user.id,
        timestamp: Date.now(),
        gameState: { ...this.gameState },
        difficulty: this.difficulty.selected,
        userStats: {
          absurdLevel: this.user.absurdLevel,
          level: this.gameState.level,
          xp: this.gameState.xp,
          streak: this.gameState.streak,
          bestStreak: this.gameState.bestStreak,
          maxCombo: this.gameState.maxCombo,
          accuracy: this.gameState.accuracy
        }
      });
      return true;
    } catch (e) {
      console.error('Error saving game state:', e);
      return false;
    }
  }

  // ============================================
  // CARGAR ESTADO
  // ============================================
  async loadState() {
    try {
      const savedState = this.db.getConfig('gameState');
      if (savedState) {
        this.gameState = { ...this.gameState, ...savedState };
      }
      
      const savedDifficulty = this.db.getConfig('difficulty');
      if (savedDifficulty) {
        this.difficulty.selected = savedDifficulty;
      }
      
      try {
        const sessions = await this.db.readByIndex('sessions', 'userId', this.user.id);
        if (sessions && sessions.length > 0) {
          const last = sessions[sessions.length - 1];
          if (last && last.gameState) {
            this.gameState = { ...this.gameState, ...last.gameState };
          }
        }
      } catch (dbError) {
        console.warn('Error cargando sesiones:', dbError);
      }
      
      return true;
    } catch (e) {
      console.error('Error loading game state:', e);
      return false;
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  async getStats() {
    const sessions = await this.db.readByIndex('sessions', 'userId', this.user.id);
    const achievements = await this.db.readByIndex('achievements', 'userId', this.user.id);
    
    return {
      user: this.user,
      gameState: this.gameState,
      totalSessions: sessions ? sessions.length : 0,
      totalAchievements: achievements ? achievements.filter(a => a.unlocked).length : 0,
      playTime: this.gameState.playTime || 0,
      scoreHistory: this.getScoreHistory(20),
      scoreStats: this.getScoreStats(),
      difficulty: this.difficulty.selected,
      accuracy: this.gameState.accuracy,
      avgResponseTime: this.gameState.avgResponseTime,
      sessionStats: {
        totalCorrect: this.sessionStats.totalCorrect,
        totalIncorrect: this.sessionStats.totalIncorrect,
        maxStreak: this.gameState.bestStreak,
        avgResponseTime: this.gameState.avgResponseTime
      },
      metrics: this.vigia?.metrics || null
    };
  }

  // ============================================
  // RESET
  // ============================================
  async reset() {
    // Guardar score actual en historial antes de resetear
    if (this.gameState.score > 0) {
      this.addScoreEntry({
        score: this.gameState.score,
        level: this.gameState.level,
        streak: this.gameState.streak,
        cacaPoints: this.gameState.cacaPoints,
        brainPoints: this.gameState.brainPoints,
        accuracy: this.gameState.accuracy
      });
    }
    
    this.gameState = {
      isPlaying: true,
      score: 0,
      level: 1,
      xp: 0,
      streak: 0,
      totalDecisions: 0,
      cacaPoints: 0,
      brainPoints: 0,
      lastVote: null,
      lastVoteTime: null,
      absurdLevel: this.user?.absurdLevel || 50,
      bestStreak: 0,
      totalCaca: 0,
      totalBrain: 0,
      cacaStreak: 0,
      brainStreak: 0,
      combo: 0,
      maxCombo: 0,
      playTime: 0,
      startTime: Date.now(),
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      avgResponseTime: 0
    };
    
    this.startTime = Date.now();
    this.thoughtHistory = [];
    this.usedThoughts.clear();
    this.sessionStats.responseTimes = [];
    this.sessionStats.totalCorrect = 0;
    this.sessionStats.totalIncorrect = 0;
    
    const sessions = await this.db.readByIndex('sessions', 'userId', this.user.id);
    if (sessions) {
      for (const session of sessions) {
        await this.db.delete('sessions', session.id);
      }
    }
    
    await this.saveState();
    
    const messages = ['¡Juego reiniciado!', '¡CACA RESET!', '¡Nuevo juego!'];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      success: true,
      message: this.pLang ? this.pLang.translateMessage(message) : message
    };
  }

  // ============================================
  // GETTERS
  // ============================================
  getCurrentThought() {
    return this.currentThought;
  }

  getGameState() {
    return this.gameState;
  }

  isGameActive() {
    return this.isInitialized && this.gameState.isPlaying;
  }

  getThoughtStats() {
    return {
      total: this.thoughts.length,
      caca: this.thoughts.filter(t => t.absurdity > CONFIG.THOUGHTS?.CACA_THRESHOLD).length,
      cerebro: this.thoughts.filter(t => t.absurdity <= CONFIG.THOUGHTS?.CACA_THRESHOLD).length,
      history: this.thoughtHistory.length,
      used: this.usedThoughts.size
    };
  }
}

export default GameEngine;