// js/config.js - CACA BRAIN ULTRA v2.0
// Configuración global de la aplicación

const CONFIG = {
  VERSION: '2.0.0',
  
  // Configuración del juego
  GAME: {
    DEFAULT_USERNAME: 'ProCagador',
    DEFAULT_ABSURD_LEVEL: 50,
    XP_PER_LEVEL: 100,
    MAX_STREAK_BONUS: 10,
    THOUGHT_INTERVAL: 7000, // ms entre pensamientos (7 segundos)
    VOTE_TIMEOUT: 8000, // ms para votar (8 segundos)
    MAX_DECISIONS_HISTORY: 100,
  },
  
  // Configuración de CACA COMPA
  CACA_COMPA: {
    NOTIFICATION_INTERVAL: 90, // segundos entre notificaciones
    MAX_MESSAGES_HISTORY: 50,
    ENABLED_BY_DEFAULT: true,
    NOTIFICATION_CHANCE: 0.3, // 30% de probabilidad de aparecer
    MIN_NOTIFICATION_INTERVAL: 60, // mínimo 60 segundos
    MAX_NOTIFICATIONS_PER_MINUTE: 0.5, // máximo 1 cada 2 minutos
  },
  
  // Configuración del Vigía Neuro
  VIGIA: {
    DECISION_HISTORY_SIZE: 50,
    ABSURDITY_OPTIMAL: 50,
    ABSURDITY_MIN: 20,
    ABSURDITY_MAX: 80,
    REACTION_OPTIMAL: 1000, // ms
    REACTION_MIN: 300,
    REACTION_MAX: 3000,
    NEUROPLASTICITY_STEP: 0.5,
  },
  
  // RCN - Repetición Cognitiva Neuroadaptativa
  RCN: {
    ENABLED: true,
    MAX_REPETICIONES: 2,
    INTERVALO_BASE: 4,
    INTERVALO_MIN: 2,
    INTERVALO_MAX: 6,
    PENSAMIENTOS_HISTORY: 50,
    UMBRAL_DIFICULTAD: 70,
    REPETICIONES_MAX: 2,
    APRENDIZAJE_UMBRAL: 70,
  },
  
  // Configuración de pensamientos
  THOUGHTS: {
    CACHE_SIZE: 100,
    MAX_HISTORY: 200,
    LOAD_BATCH: 50,
    MAX_USED_BEFORE_REFRESH: 5,
    CACA_THRESHOLD: 50, // > 50 es CACA, <= 50 es CEREBRO
  },
  
  // Logros
  ACHIEVEMENTS: {
    CACA_NOVICE: { id: 'caca_novice', name: '💩 Novato Cagón', threshold: 10, description: 'Haz 10 CACA mentales' },
    CACA_PRO: { id: 'caca_pro', name: '🔥 Pro Cagón', threshold: 50, description: 'Haz 50 CACA mentales' },
    CACA_LEGEND: { id: 'caca_legend', name: '👑 Leyenda Cagona', threshold: 100, description: 'Haz 100 CACA mentales' },
    CACA_MASTER: { id: 'caca_master', name: '💀 Maestro Cagón', threshold: 250, description: 'Haz 250 CACA mentales' },
    CACA_GOD: { id: 'caca_god', name: '🙏 Dios de la CACA', threshold: 500, description: 'Haz 500 CACA mentales' },
    BRAIN_NOVICE: { id: 'brain_novice', name: '🧠 Novato Cerebral', threshold: 10, description: 'Haz 10 CEREBRO mentales' },
    BRAIN_PRO: { id: 'brain_pro', name: '⚡ Pro Cerebral', threshold: 50, description: 'Haz 50 CEREBRO mentales' },
    BRAIN_LEGEND: { id: 'brain_legend', name: '🌟 Leyenda Cerebral', threshold: 100, description: 'Haz 100 CEREBRO mentales' },
    BRAIN_MASTER: { id: 'brain_master', name: '🧠 Maestro Cerebral', threshold: 250, description: 'Haz 250 CEREBRO mentales' },
    BRAIN_GOD: { id: 'brain_god', name: '🙏 Dios del Cerebro', threshold: 500, description: 'Haz 500 CEREBRO mentales' },
    STREAK_5: { id: 'streak_5', name: '🔥 Racha 5', threshold: 5, description: 'Consigue una racha de 5' },
    STREAK_10: { id: 'streak_10', name: '💀 Racha 10', threshold: 10, description: 'Consigue una racha de 10' },
    STREAK_25: { id: 'streak_25', name: '🚀 Racha 25', threshold: 25, description: 'Consigue una racha de 25' },
    STREAK_50: { id: 'streak_50', name: '🌟 Racha 50', threshold: 50, description: 'Consigue una racha de 50' },
    STREAK_100: { id: 'streak_100', name: '👑 Racha 100', threshold: 100, description: 'Consigue una racha de 100' },
    ABSURD_MASTER: { id: 'absurd_master', name: '🎭 Maestro del Absurdo', threshold: 80, description: 'Alcanza nivel 80 de absurdez' },
    ABSURD_GOD: { id: 'absurd_god', name: '🙏 Dios del Absurdo', threshold: 95, description: 'Alcanza nivel 95 de absurdez' },
    VIGIA_FRIEND: { id: 'vigia_friend', name: '🤖 Amigo del Vigía', threshold: 20, description: 'Toma 20 decisiones' },
    VIGIA_BESTIE: { id: 'vigia_bestie', name: '🤖 Mejor Amigo del Vigía', threshold: 100, description: 'Toma 100 decisiones' },
    RCN_MASTER: { id: 'rcn_master', name: '🧠 Maestro RCN', threshold: 50, description: 'Logra 50 repeticiones exitosas' },
    PERFECT_10: { id: 'perfect_10', name: '💯 Perfecto 10', threshold: 10, description: '10 respuestas rápidas seguidas' },
    CACA_BALANCE: { id: 'caca_balance', name: '⚖️ Balance Perfecto', threshold: 100, description: '100 CACA y 100 CEREBRO' },
  },
  
  // Colores temáticos
  COLORS: {
    primary: '#ff6b6b',
    secondary: '#ffd93d',
    success: '#4CAF50',
    info: '#2196F3',
    warning: '#FF9800',
    danger: '#ff1744',
    dark: '#1a1a2e',
    light: '#f5f5f5',
    caca: '#8B4513',
    brain: '#1565C0',
  },
  
  // Emojis
  EMOJIS: {
    caca: '💩',
    brain: '🧠',
    fire: '🔥',
    star: '🌟',
    rocket: '🚀',
    skull: '💀',
    lightning: '⚡',
    game: '🎮',
    trophy: '🏆',
    medal: '🥇',
  },
  
  // URLs
  URLS: {
    GROQ_API: 'https://api.groq.com/openai/v1/chat/completions',
    SEED_PATH: '/data/seed.json',
  },
  
  // Storage keys
  STORAGE_KEYS: {
    currentUser: 'caca_brain_current_user',
    username: 'caca_brain_username',
    absurdLevel: 'caca_brain_absurd_level',
    gameState: 'caca_brain_game_state',
    settings: 'caca_brain_settings',
    vigiaState: 'caca_brain_vigia_state',
    seedLoaded: 'caca_brain_seed_loaded',
    messages: 'caca_brain_messages',
    defaultUser: 'caca_brain_default_user',
    rcnState: 'caca_brain_rcn_state',
  },
};

export default CONFIG;