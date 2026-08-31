// js/modules/DatabaseManager.js - CACA BRAIN ULTRA v2.0
// Gestión de IndexedDB + LocalStorage

import CONFIG from '../config.js';

class DatabaseManager {
  constructor() {
    this.dbName = 'CacaBrainDB';
    this.dbVersion = 4;
    this.db = null;
    this.isReady = false;
    this.localStoragePrefix = 'caca_brain_';
    
    // Stores con sus índices
    this.storeNames = ['users', 'sessions', 'achievements', 'messages', 'thoughts'];
    this.storeIndexes = {
      users: ['username', 'level'],
      sessions: ['userId', 'timestamp'],
      achievements: ['userId', 'unlocked'],
      messages: ['userId', 'read'],
      thoughts: ['category', 'absurdity', 'used']
    };
  }

  // ============================================
  // INICIALIZACIÓN DE INDEXEDDB
  // ============================================
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Crear stores si no existen
        this.storeNames.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            
            // Crear índices
            const indexes = this.storeIndexes[storeName] || [];
            indexes.forEach(indexName => {
              store.createIndex(indexName, indexName);
            });
          }
        });
        
        console.log('📁 Database schema actualizado a versión', this.dbVersion);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isReady = true;
        console.log('✅ IndexedDB inicializada correctamente');
        resolve(this.db);
      };
      
      request.onerror = (event) => {
        console.error('❌ IndexedDB Error:', event.target.error);
        reject(`IndexedDB Error: ${event.target.error}`);
      };
    });
  }

  // ============================================
  // VERIFICAR DB
  // ============================================
  async checkDB() {
    if (!this.db || !this.isReady) {
      await this.initDB();
    }
    return this.db;
  }

  // ============================================
  // OPERACIONES CRUD - INDEXEDDB
  // ============================================

  async create(storeName, data) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async read(storeName, id) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async readAll(storeName) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async readByIndex(storeName, indexName, value) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async update(storeName, data) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAll(storeName) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName) {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // OPERACIONES ESPECÍFICAS PARA PENSAMIENTOS
  // ============================================

  async getRandomThoughts(count = 1) {
    await this.checkDB();
    try {
      const thoughts = await this.readAll('thoughts');
      if (!thoughts || thoughts.length === 0) return [];
      
      // Barajar y seleccionar
      const shuffled = thoughts.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting random thoughts:', error);
      return [];
    }
  }

  async getThoughtsByCategory(category) {
    await this.checkDB();
    try {
      return await this.readByIndex('thoughts', 'category', category);
    } catch (error) {
      console.error('Error getting thoughts by category:', error);
      return [];
    }
  }

  async getThoughtsByAbsurdity(min, max) {
    await this.checkDB();
    try {
      const all = await this.readAll('thoughts');
      return all.filter(t => t.absurdity >= min && t.absurdity <= max);
    } catch (error) {
      console.error('Error getting thoughts by absurdity:', error);
      return [];
    }
  }

  async markThoughtUsed(thoughtId) {
    await this.checkDB();
    try {
      const thought = await this.read('thoughts', thoughtId);
      if (thought) {
        thought.used = (thought.used || 0) + 1;
        thought.lastUsed = Date.now();
        await this.update('thoughts', thought);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking thought used:', error);
      return false;
    }
  }

  async getLeastUsedThoughts(count = 10) {
    await this.checkDB();
    try {
      const all = await this.readAll('thoughts');
      return all.sort((a, b) => (a.used || 0) - (b.used || 0)).slice(0, count);
    } catch (error) {
      console.error('Error getting least used thoughts:', error);
      return [];
    }
  }

  // ============================================
  // OPERACIONES - LOCALSTORAGE
  // ============================================

  setConfig(key, value) {
    try {
      localStorage.setItem(this.localStoragePrefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('LocalStorage error:', e);
      return false;
    }
  }

  getConfig(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.localStoragePrefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('LocalStorage error:', e);
      return defaultValue;
    }
  }

  removeConfig(key) {
    try {
      localStorage.removeItem(this.localStoragePrefix + key);
      return true;
    } catch (e) {
      console.error('LocalStorage error:', e);
      return false;
    }
  }

  clearConfig() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.localStoragePrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error('LocalStorage error:', e);
      return false;
    }
  }

  // ============================================
  // BACKUP Y RESTORE
  // ============================================

  async backup() {
    await this.checkDB();
    const data = {};
    for (const storeName of this.storeNames) {
      data[storeName] = await this.readAll(storeName);
    }
    data._config = {
      timestamp: Date.now(),
      version: CONFIG.VERSION,
      totalItems: Object.values(data).reduce((acc, arr) => acc + arr.length, 0)
    };
    return data;
  }

  async restore(backupData) {
    await this.checkDB();
    for (const storeName of this.storeNames) {
      if (backupData[storeName]) {
        await this.deleteAll(storeName);
        for (const item of backupData[storeName]) {
          await this.create(storeName, item);
        }
      }
    }
    return true;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async getStats() {
    await this.checkDB();
    const stats = {};
    for (const storeName of this.storeNames) {
      stats[storeName] = await this.count(storeName);
    }
    return stats;
  }

  // ============================================
  // DESTRUCCIÓN
  // ============================================

  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isReady = false;
    }
    this.clearConfig();
  }
}

export default DatabaseManager;