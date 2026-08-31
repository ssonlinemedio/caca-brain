// js/modules/SeedLoader.js - CACA BRAIN ULTRA v2.0
// Carga automática de datos semilla en el primer acceso

import CONFIG from '../config.js';

class SeedLoader {
  constructor(db) {
    this.db = db;
    this.seedUrl = CONFIG.URLS.SEED_PATH || 'data/seed.json';
    this.seedFlag = CONFIG.STORAGE_KEYS.seedLoaded || 'caca_brain_seed_loaded';
    this.isLoading = false;
    this.loaded = false;
  }

  // ============================================
  // VERIFICAR SI YA SE CARGÓ LA SEMILLA
  // ============================================
  isSeedLoaded() {
    return localStorage.getItem(this.seedFlag) === 'true';
  }

  markSeedLoaded() {
    localStorage.setItem(this.seedFlag, 'true');
    this.loaded = true;
  }

  resetSeedFlag() {
    localStorage.removeItem(this.seedFlag);
    this.loaded = false;
  }

  // ============================================
  // CARGAR SEMILLA DESDE JSON
  // ============================================
  async loadSeed() {
    if (this.isLoading) {
      console.log('⏳ Ya se está cargando la semilla...');
      return { success: false, error: 'Loading in progress' };
    }

    try {
      // 1. Verificar si ya se cargó
      if (this.isSeedLoaded()) {
        console.log('✅ Semilla ya cargada anteriormente');
        return { success: true, alreadyLoaded: true };
      }

      this.isLoading = true;
      console.log('🌱 Cargando semilla de datos...');

      // 2. Obtener el JSON
      const response = await fetch(this.seedUrl);
      if (!response.ok) {
        throw new Error(`No se pudo cargar seed.json: ${response.status}`);
      }

      const seedData = await response.json();

      // 3. Validar estructura
      if (!seedData.thoughts || seedData.thoughts.length === 0) {
        throw new Error('Seed inválido: faltan pensamientos');
      }

      // 4. Verificar que la DB está lista
      await this.db.checkDB();

      // 5. Cargar pensamientos
      await this.loadThoughts(seedData.thoughts);

      // 6. Cargar logros (si existen)
      if (seedData.achievements) {
        await this.loadAchievements(seedData.achievements);
      }

      // 7. Cargar mensajes de CACA COMPA
      if (seedData.cacaCompaMessages) {
        this.loadMessages(seedData.cacaCompaMessages);
      }

      // 8. Guardar configuración predeterminada
      if (seedData.defaultUser) {
        this.saveDefaultConfig(seedData.defaultUser);
      }

      // 9. Marcar como cargado
      this.markSeedLoaded();

      const stats = {
        thoughts: seedData.thoughts.length,
        achievements: seedData.achievements?.length || 0,
        messages: seedData.cacaCompaMessages?.length || 0
      };

      console.log(`✅ Semilla cargada correctamente: ${stats.thoughts} pensamientos, ${stats.achievements} logros, ${stats.messages} mensajes`);
      this.isLoading = false;

      return {
        success: true,
        alreadyLoaded: false,
        stats: stats
      };

    } catch (error) {
      console.error('❌ Error cargando semilla:', error);
      this.isLoading = false;
      
      // En caso de error, marcar como cargado para no repetir
      this.markSeedLoaded();
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================
  // CARGAR PENSAMIENTOS
  // ============================================
  async loadThoughts(thoughts) {
    // Verificar si ya hay pensamientos en la DB
    const existing = await this.db.count('thoughts');
    
    if (existing > 0) {
      console.log(`⚠️ Ya existen ${existing} pensamientos en DB, saltando...`);
      return;
    }

    // Cargar pensamientos en lote
    const batchSize = 50;
    let loaded = 0;

    for (let i = 0; i < thoughts.length; i += batchSize) {
      const batch = thoughts.slice(i, i + batchSize);
      const promises = batch.map(thought => {
        const thoughtData = {
          ...thought,
          id: 'thought_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          used: 0,
          lastUsed: null,
          createdAt: Date.now()
        };
        return this.db.create('thoughts', thoughtData);
      });
      
      await Promise.all(promises);
      loaded += batch.length;
      console.log(`📥 Cargados ${loaded}/${thoughts.length} pensamientos...`);
    }
    
    console.log(`✅ ${thoughts.length} pensamientos cargados en IndexedDB`);
  }

  // ============================================
  // CARGAR LOGROS
  // ============================================
  async loadAchievements(achievements) {
    const existing = await this.db.count('achievements');
    
    if (existing > 0) {
      console.log(`⚠️ Ya existen ${existing} logros en DB, saltando...`);
      return;
    }

    for (const ach of achievements) {
      await this.db.create('achievements', {
        ...ach,
        isTemplate: true,
        unlocked: false,
        unlockedAt: null,
        userId: 'system'
      });
    }
    
    console.log(`✅ ${achievements.length} logros cargados`);
  }

  // ============================================
  // CARGAR MENSAJES
  // ============================================
  loadMessages(messages) {
    const existing = localStorage.getItem(CONFIG.STORAGE_KEYS.messages);
    
    if (existing) {
      console.log('⚠️ Mensajes ya existen en localStorage');
      return;
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.messages, JSON.stringify(messages));
    console.log(`✅ ${messages.length} mensajes cargados`);
  }

  // ============================================
  // GUARDAR CONFIGURACIÓN PREDETERMINADA
  // ============================================
  saveDefaultConfig(defaultUser) {
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.defaultUser)) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.defaultUser, JSON.stringify(defaultUser));
      console.log('✅ Configuración predeterminada guardada');
    }
  }

  // ============================================
  // RECUPERAR MENSAJES DE CACA COMPA
  // ============================================
  getCacaCompaMessages() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.messages);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // ============================================
  // RECUPERAR PENSAMIENTOS DE LA DB
  // ============================================
  async getThoughts() {
    try {
      const thoughts = await this.db.readAll('thoughts');
      if (thoughts && thoughts.length > 0) {
        return thoughts;
      }
    } catch (e) {
      console.warn('Error obteniendo pensamientos de DB:', e);
    }
    
    // Fallback: cargar del seed directamente
    try {
      const response = await fetch(this.seedUrl);
      const seedData = await response.json();
      return seedData.thoughts || [];
    } catch (e) {
      console.warn('Error cargando seed como fallback:', e);
      return [];
    }
  }

  // ============================================
  // RECUPERAR LOGROS DE LA DB
  // ============================================
  async getAchievements() {
    try {
      const achievements = await this.db.readAll('achievements');
      if (achievements && achievements.length > 0) {
        return achievements;
      }
    } catch (e) {
      console.warn('Error obteniendo logros de DB:', e);
    }
    
    try {
      const response = await fetch(this.seedUrl);
      const seedData = await response.json();
      return seedData.achievements || [];
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // RECARGAR SEMILLA (forzado)
  // ============================================
  async reloadSeed() {
    this.resetSeedFlag();
    await this.db.deleteAll('thoughts');
    await this.db.deleteAll('achievements');
    return await this.loadSeed();
  }

  // ============================================
  // ESTADÍSTICAS DE LA SEMILLA
  // ============================================
  async getSeedStats() {
    try {
      const thoughts = await this.db.readAll('thoughts');
      const cacaCount = thoughts.filter(t => t.absurdity > CONFIG.THOUGHTS.CACA_THRESHOLD).length;
      const cerebroCount = thoughts.filter(t => t.absurdity <= CONFIG.THOUGHTS.CACA_THRESHOLD).length;
      
      return {
        total: thoughts.length,
        caca: cacaCount,
        cerebro: cerebroCount,
        ratio: thoughts.length > 0 ? `${cacaCount}/${cerebroCount}` : '0/0'
      };
    } catch (e) {
      return { total: 0, caca: 0, cerebro: 0, ratio: '0/0' };
    }
  }
}

export default SeedLoader;