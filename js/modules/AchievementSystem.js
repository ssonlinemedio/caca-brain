// js/modules/AchievementSystem.js
import CONFIG from '../config.js';

class AchievementSystem {
  constructor(userId, dbManager) {
    this.userId = userId;
    this.db = dbManager;
    this.unlockedAchievements = [];
    this.pendingAchievements = [];
    this.achievementDefinitions = CONFIG.ACHIEVEMENTS;
    this.listeners = [];
  }

  // Verificar todos los logros
  async checkAchievements(gameState) {
    const newAchievements = [];
    
    for (const [key, def] of Object.entries(this.achievementDefinitions)) {
      // Verificar si ya está desbloqueado
      const alreadyUnlocked = this.unlockedAchievements.find(a => a.id === def.id);
      if (alreadyUnlocked) continue;
      
      // Verificar condición
      if (this.checkCondition(def, gameState)) {
        const achievement = {
          id: def.id,
          name: def.name,
          threshold: def.threshold,
          unlockedAt: Date.now()
        };
        
        this.unlockedAchievements.push(achievement);
        newAchievements.push(achievement);
        
        // Guardar en base de datos
        await this.db.create('achievements', {
          userId: this.userId,
          achievementId: def.id,
          name: def.name,
          unlockedAt: Date.now(),
          gameState: { ...gameState }
        });
      }
    }
    
    // Notificar nuevos logros
    if (newAchievements.length > 0) {
      this.notifyAchievements(newAchievements);
    }
    
    return newAchievements;
  }

  checkCondition(def, gameState) {
    const stats = gameState;
    
    switch (def.id) {
      case 'caca_novice':
        return stats.cacaPoints >= 10;
      case 'caca_pro':
        return stats.cacaPoints >= 50;
      case 'caca_legend':
        return stats.cacaPoints >= 100;
      case 'brain_novice':
        return stats.brainPoints >= 10;
      case 'brain_pro':
        return stats.brainPoints >= 50;
      case 'brain_legend':
        return stats.brainPoints >= 100;
      case 'streak_5':
        return stats.streak >= 5;
      case 'streak_10':
        return stats.streak >= 10;
      case 'streak_25':
        return stats.streak >= 25;
      case 'absurd_master':
        return (stats.cacaPoints + stats.brainPoints) >= 80;
      case 'vigia_friend':
        return stats.totalDecisions >= 20;
      default:
        return false;
    }
  }

  // Cargar logros guardados
  async loadAchievements() {
    try {
      const achievements = await this.db.findByIndex('achievements', 'userId', this.userId);
      if (achievements && achievements.length > 0) {
        this.unlockedAchievements = achievements.map(a => ({
          id: a.achievementId,
          name: a.name,
          unlockedAt: a.unlockedAt
        }));
      }
      return this.unlockedAchievements;
    } catch (e) {
      console.error('Error loading achievements:', e);
      return [];
    }
  }

  // Obtener todos los logros (incluyendo no desbloqueados)
  getAllAchievements() {
    return Object.values(this.achievementDefinitions).map(def => {
      const unlocked = this.unlockedAchievements.find(a => a.id === def.id);
      return {
        ...def,
        unlocked: !!unlocked,
        unlockedAt: unlocked ? unlocked.unlockedAt : null
      };
    });
  }

  // Obtener logros desbloqueados
  getUnlockedAchievements() {
    return this.unlockedAchievements;
  }

  // Obtener progreso de logros
  getAchievementProgress(gameState) {
    const progress = {};
    
    for (const [key, def] of Object.entries(this.achievementDefinitions)) {
      const unlocked = this.unlockedAchievements.find(a => a.id === def.id);
      
      let current = 0;
      let target = def.threshold;
      
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
        case 'absurd_master':
          current = (gameState.cacaPoints || 0) + (gameState.brainPoints || 0);
          break;
        case 'vigia_friend':
          current = gameState.totalDecisions || 0;
          break;
        default:
          current = 0;
      }
      
      progress[def.id] = {
        name: def.name,
        current: Math.min(current, target),
        target: target,
        percentage: Math.min(100, (current / target) * 100),
        unlocked: !!unlocked,
        unlockedAt: unlocked ? unlocked.unlockedAt : null
      };
    }
    
    return progress;
  }

  // Notificar logros
  notifyAchievements(achievements) {
    for (const achievement of achievements) {
      // Emitir evento
      this.emit('achievement_unlocked', achievement);
      
      // Notificar a los listeners
      for (const listener of this.listeners) {
        if (listener.onAchievement) {
          listener.onAchievement(achievement);
        }
      }
    }
  }

  // Sistema de eventos simple
  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    // Para futura expansión
    console.log(`🏆 Achievement Event: ${event}`, data);
  }

  // Obtener estadísticas de logros
  getStatistics() {
    const total = Object.keys(this.achievementDefinitions).length;
    const unlocked = this.unlockedAchievements.length;
    const percentage = total > 0 ? (unlocked / total) * 100 : 0;
    
    return {
      total,
      unlocked,
      percentage: Math.round(percentage),
      remaining: total - unlocked
    };
  }

  // Generar mensaje de logro en P-Lang (opcional)
  getAchievementMessage(achievement) {
    const messages = [
      `¡${achievement.name}! 🏆`,
      `¡Logro desbloqueado! ${achievement.name} ✨`,
      `🎮 Achievement unlocked: ${achievement.name}`,
      `🌟 ¡Has conseguido ${achievement.name}!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export default AchievementSystem;