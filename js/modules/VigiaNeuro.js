// js/modules/VigiaNeuro.js
class VigiaNeuro {
  constructor(userId, dbManager) {
    this.userId = userId;
    this.db = dbManager;
    this.metrics = {
      absurdityLevel: 0,      // 0-100
      attentionSpan: 0,       // 0-100
      reactionTime: 0,        // ms
      emotionalState: 'neutral', // neutral, excited, confused, amused
      decisionPatterns: [],   // historial de decisiones
      gameFlow: 'optimal',    // optimal, challenge, boredom, anxiety
      neuroplasticity: 0,     // 0-100
      lastUpdate: Date.now()
    };
    
    this.thresholds = {
      absurdity: { min: 20, max: 80, optimal: 50 },
      reaction: { min: 500, max: 3000, optimal: 1000 },
      streak: { low: 3, medium: 7, high: 15 }
    };
    
    this.adaptations = {
      difficulty: 1,
      messageFrequency: 30, // segundos
      absurdityVariation: 0.2,
      notificationIntensity: 'normal'
    };
  }

  // === ANÁLISIS DE DECISIONES ===
  analyzeDecision(decision, timeToDecide, thoughtAbsurdity) {
    const timestamp = Date.now();
    
    // Registrar patrón
    this.metrics.decisionPatterns.push({
      decision,
      timeToDecide,
      thoughtAbsurdity,
      timestamp
    });
    
    // Mantener solo últimas 50 decisiones
    if (this.metrics.decisionPatterns.length > 50) {
      this.metrics.decisionPatterns.shift();
    }
    
    // Actualizar métricas
    this.updateMetrics(decision, timeToDecide, thoughtAbsurdity);
    
    // Evaluar estado
    this.evaluateState();
    
    // Ajustar juego
    this.adaptGame();
    
    return this.getAdaptationReport();
  }

  updateMetrics(decision, timeToDecide, thoughtAbsurdity) {
    // 1. Nivel de absurdez (basado en decisiones y pensamientos)
    const absurdScore = decision === 'caca' ? 1 : 0;
    this.metrics.absurdityLevel = Math.min(100, 
      (this.metrics.absurdityLevel * 0.7) + 
      (absurdScore * 20) + 
      (thoughtAbsurdity * 0.3)
    );
    
    // 2. Tiempo de reacción (promedio móvil)
    if (timeToDecide > 0) {
      this.metrics.reactionTime = this.metrics.reactionTime > 0
        ? (this.metrics.reactionTime * 0.8 + timeToDecide * 0.2)
        : timeToDecide;
    }
    
    // 3. Estado emocional basado en patrones
    const recentDecisions = this.metrics.decisionPatterns.slice(-10);
    const cacaRatio = recentDecisions.filter(d => d.decision === 'caca').length / (recentDecisions.length || 1);
    
    if (cacaRatio > 0.7) {
      this.metrics.emotionalState = 'excited';
    } else if (cacaRatio < 0.3) {
      this.metrics.emotionalState = 'confused';
    } else if (this.metrics.reactionTime > 2000) {
      this.metrics.emotionalState = 'amused';
    } else {
      this.metrics.emotionalState = 'neutral';
    }
    
    // 4. Neuroplasticidad (capacidad de adaptación)
    const patternVariety = new Set(this.metrics.decisionPatterns.slice(-20).map(d => d.decision)).size;
    this.metrics.neuroplasticity = Math.min(100, 
      (patternVariety * 30) + 
      (this.metrics.absurdityLevel * 0.3) +
      (this.metrics.decisionPatterns.length * 0.5)
    );
    
    // 5. Última actualización
    this.metrics.lastUpdate = Date.now();
  }

  evaluateState() {
    // Evaluar estado del flujo (Flow Theory - Csikszentmihalyi)
    const absurdity = this.metrics.absurdityLevel;
    const reaction = this.metrics.reactionTime;
    const streak = this.metrics.decisionPatterns.filter(d => d.decision === 'caca').length;
    
    if (absurdity < 30 || reaction > 2500) {
      this.metrics.gameFlow = 'boredom';
    } else if (absurdity > 80 || reaction < 300) {
      this.metrics.gameFlow = 'anxiety';
    } else if (streak > this.thresholds.streak.high) {
      this.metrics.gameFlow = 'optimal';
    } else if (streak > this.thresholds.streak.medium) {
      this.metrics.gameFlow = 'challenge';
    } else {
      this.metrics.gameFlow = 'optimal';
    }
  }

  adaptGame() {
    // 1. Ajustar dificultad basada en el estado
    switch (this.metrics.gameFlow) {
      case 'boredom':
        this.adaptations.difficulty = Math.min(3, this.adaptations.difficulty + 0.5);
        this.adaptations.messageFrequency = Math.max(15, this.adaptations.messageFrequency - 5);
        this.adaptations.notificationIntensity = 'high';
        break;
        
      case 'anxiety':
        this.adaptations.difficulty = Math.max(0.5, this.adaptations.difficulty - 0.5);
        this.adaptations.messageFrequency = Math.min(45, this.adaptations.messageFrequency + 10);
        this.adaptations.notificationIntensity = 'low';
        break;
        
      case 'challenge':
        this.adaptations.difficulty = Math.min(2, this.adaptations.difficulty + 0.2);
        this.adaptations.messageFrequency = Math.max(20, this.adaptations.messageFrequency - 2);
        this.adaptations.notificationIntensity = 'normal';
        break;
        
      case 'optimal':
        this.adaptations.difficulty = this.adaptations.difficulty;
        this.adaptations.messageFrequency = 30;
        this.adaptations.notificationIntensity = 'normal';
        break;
    }
    
    // 2. Variación de absurdez (más impredecible si está en flow)
    if (this.metrics.gameFlow === 'optimal') {
      this.adaptations.absurdityVariation = 0.4;
    } else {
      this.adaptations.absurdityVariation = 0.2;
    }
  }

  getAdaptationReport() {
    return {
      metrics: { ...this.metrics },
      adaptations: { ...this.adaptations },
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recs = [];
    
    // Recomendaciones basadas en estado
    if (this.metrics.gameFlow === 'boredom') {
      recs.push('💥 ¡Más intensidad! Aumenta la dificultad');
      recs.push('🔥 CACA COMPA te reta a una racha de 10');
    }
    
    if (this.metrics.gameFlow === 'anxiety') {
      recs.push('🧘 Tómate un respiro, la caca no huye');
      recs.push('🎯 Intenta decisiones más equilibradas');
    }
    
    if (this.metrics.gameFlow === 'optimal') {
      recs.push('🌟 ¡Flow perfecto! Sigue así');
      recs.push('💪 Estás en la zona, ¡aprovecha!');
    }
    
    if (this.metrics.absurdityLevel < 30) {
      recs.push('💩 ¡Más caca! El absurdo te hace más fuerte');
    }
    
    if (this.metrics.absurdityLevel > 80) {
      recs.push('🧠 Equilibra con un poco de lógica');
    }
    
    return recs;
  }

  // === PREDICCIÓN DE COMPORTAMIENTO ===
  predictNextDecision() {
    const recent = this.metrics.decisionPatterns.slice(-10);
    const cacaCount = recent.filter(d => d.decision === 'caca').length;
    const cacaRatio = cacaCount / (recent.length || 1);
    
    // Predicción basada en patrones y estado
    let prediction = 'caca';
    if (cacaRatio > 0.6) prediction = 'caca';
    else if (cacaRatio < 0.4) prediction = 'cerebro';
    else prediction = Math.random() > 0.5 ? 'caca' : 'cerebro';
    
    return {
      prediction,
      confidence: Math.abs(cacaRatio - 0.5) * 2,
      absurdityTrend: this.metrics.absurdityLevel > 50 ? 'increasing' : 'decreasing'
    };
  }

  // === VIGÍA VISUAL (feedback UI) ===
  getVigiaStatus() {
    const status = {
      emoji: '🧠',
      color: '#4CAF50',
      message: 'Todo bajo control'
    };
    
    // Elegir emoji según estado
    switch (this.metrics.gameFlow) {
      case 'optimal':
        status.emoji = '🌟';
        status.color = '#FFD700';
        status.message = '¡Flow neuronal activado!';
        break;
      case 'challenge':
        status.emoji = '⚡';
        status.color = '#FF6B6B';
        status.message = '¡Reto detectado!';
        break;
      case 'boredom':
        status.emoji = '😴';
        status.color = '#90A4AE';
        status.message = 'Necesitas más intensidad';
        break;
      case 'anxiety':
        status.emoji = '😰';
        status.color = '#FF1744';
        status.message = 'Demasiado estrés, relájate';
        break;
    }
    
    return status;
  }

  // === PERSISTENCIA ===
  async save() {
    try {
      await this.db.create('sessions', {
        userId: this.userId,
        timestamp: Date.now(),
        metrics: this.metrics,
        adaptations: this.adaptations,
        flow: this.metrics.gameFlow
      });
      
      // Guardar estado actual en localStorage
      localStorage.setItem(`vigia_${this.userId}`, JSON.stringify({
        metrics: this.metrics,
        adaptations: this.adaptations
      }));
      
      return true;
    } catch (e) {
      console.error('Error saving Vigia state:', e);
      return false;
    }
  }

  async load() {
    try {
      // Cargar último estado
      const saved = localStorage.getItem(`vigia_${this.userId}`);
      if (saved) {
        const data = JSON.parse(saved);
        this.metrics = data.metrics || this.metrics;
        this.adaptations = data.adaptations || this.adaptations;
      }
      
      // Cargar historial
      const history = await this.db.findByIndex('sessions', 'userId', this.userId);
      if (history && history.length > 0) {
        const last = history[history.length - 1];
        if (last.metrics) {
          this.metrics.decisionPatterns = last.metrics.decisionPatterns || [];
        }
      }
      
      return true;
    } catch (e) {
      console.error('Error loading Vigia state:', e);
      return false;
    }
  }
}

export default VigiaNeuro;