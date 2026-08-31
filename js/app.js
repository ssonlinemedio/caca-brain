// js/app.js - CACA BRAIN ULTRA v2.0 - VERSIÓN CORREGIDA

import CONFIG from './config.js';
import DatabaseManager from './modules/DatabaseManager.js';
import PLangTranslator from './modules/PLangTranslator.js';
import CacaCompa from './modules/CacaCompa.js';  // ← IMPORTANTE
import VigiaNeuro from './modules/VigiaNeuro.js';
import GameEngine from './modules/GameEngine.js';
import AchievementSystem from './modules/AchievementSystem.js';
import UIManager from './modules/UIManager.js';
import SeedLoader from './modules/SeedLoader.js';

class CacaBrainApp {
    constructor() {
        this.db = new DatabaseManager();
        this.pLang = new PLangTranslator();
        this.ui = new UIManager();
        this.game = null;
        this.vigia = null;
        this.cacaCompa = null;  // ← CACA COMPA
        this.achievements = null;
        this.seedLoader = null;
        this.isReady = false;
        this.isInitialized = false;
        this.user = null;
        this.startTime = null;
        this.isWaitingForResponse = false;
        this.pendingThought = null;
        this.currentThoughtTimeout = null;
        this.thoughtGenerationEnabled = true;
        this.timeUpdateInterval = null;
        
        // RCN
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
        
        this.sessionStats = {
            cacaPerMinute: 0,
            totalCaca: 0,
            startTime: null,
            decisions: []
        };
        
        console.log('🎮 CACA BRAIN ULTRA v2.0 - Constructor listo');
    }

    async init() {
        try {
            console.log('🎮 Iniciando CACA BRAIN ULTRA v2.0...');
            
            this.ui.init();
            this.ui.setPLangTranslator(this.pLang);
            
            this.ui.onStartGame = (username, absurdLevel) => {
                this.handleStartGame(username, absurdLevel);
            };
            this.ui.onVote = (decision) => {
                this.handleVote(decision);
            };
            this.ui.onReset = () => {
                this.handleReset();
            };
            this.ui.onShowStats = () => {
                this.showStats();
            };
            this.ui.onShowAchievements = () => {
                this.showAchievements();
            };
            this.ui.onTogglePause = () => {
                this.togglePause();
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
                    this.handleStartGame(data?.username, data?.absurdLevel);
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
                case 'showStats':
                    this.showStats();
                    break;
                case 'showAchievements':
                    this.showAchievements();
                    break;
                case 'togglePause':
                    this.togglePause();
                    break;
                case 'cacaExplosion':
                    this.ui.cacaExplosionEffect();
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
            
            // ============================================
            // 🔥 INICIALIZAR CACA COMPA
            // ============================================
            const messages = this.seedLoader?.getCacaCompaMessages() || [];
            this.cacaCompa = new CacaCompa(
                user.id,
                null, // Sin API Key de Groq
                this.pLang,
                messages
            );
            
            // Configurar CACA COMPA
            this.cacaCompa.setNotificationFrequency(35);
            this.cacaCompa.setMaxNotificationsPerMinute(0.3);
            
            // Callback para mostrar mensajes
            this.cacaCompa.addCallback((msg, type) => {
                this.showThrottledNotification(msg, type);
            });
            
            // Iniciar notificaciones periódicas
            this.cacaCompa.startPeriodicNotifications(
                (msg, type) => this.showThrottledNotification(msg, type),
                35
            );
            
            // ============================================
            // INICIALIZAR LOGROS
            // ============================================
            this.achievements = new AchievementSystem(user.id, this.db);
            await this.achievements.loadAchievements();
            
            this.game.achievements = this.achievements;
            
            await this.game.loadState();
            
            this.isWaitingForResponse = false;
            this.pendingThought = null;
            this.thoughtGenerationEnabled = true;
            
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
            
            // Mostrar mensaje de bienvenida de CACA COMPA
            setTimeout(() => {
                if (this.cacaCompa) {
                    const welcomeMsg = this.cacaCompa.getRandomMessage();
                    this.showThrottledNotification(welcomeMsg, 'caca-compa');
                }
            }, 2000);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando juego:', error);
            this.ui.showToast('Error al iniciar el juego: ' + error.message, 'error');
            return false;
        }
    }

    // ============================================
    // NOTIFICACIONES CON THROTTLE
    // ============================================
    showThrottledNotification(message, type = 'info') {
        if (!this.cacaCompa) return;
        if (this.cacaCompa.canShowNotification()) {
            this.ui.showToast(message, type, 5000);
            this.cacaCompa.lastNotificationTime = Date.now();
        }
    }

    // ============================================
    // START GAME
    // ============================================
    handleStartGame(username, absurdLevel) {
        console.log('🔥 handleStartGame ejecutado!');
        
        try {
            const finalUsername = username || this.ui.getRegisterData().username || 'ProCagador';
            const finalAbsurdLevel = absurdLevel || this.ui.getRegisterData().absurdLevel || 50;
            
            if (!finalUsername || finalUsername.trim().length === 0) {
                this.ui.showToast('¡Necesitas un nombre de usuario!', 'error');
                return;
            }
            
            if (finalUsername.length < 3) {
                this.ui.showToast('¡Nombre muy corto! Necesitas más caca', 'warning');
                return;
            }
            
            const user = {
                id: 'gamer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                username: finalUsername.trim(),
                absurdLevel: parseInt(finalAbsurdLevel) || 50,
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
                
                this.ui.showToast(
                    this.pLang.translateMessage('¡Bienvenido ' + user.username + '! La caca mental te espera'),
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
    // GENERATE THOUGHT
    // ============================================
    generateThought() {
        if (!this.game || !this.game.isInitialized) return;
        if (this.isWaitingForResponse) return;
        if (!this.thoughtGenerationEnabled) return;
        
        const thought = this.game.generateThought();
        
        if (thought) {
            console.log('💭 Pensamiento generado:', thought.text);
            
            this.isWaitingForResponse = true;
            this.pendingThought = thought;
            this.thoughtGenerationEnabled = false;
            
            this.ui.updateThought(thought);
            
            const timer = document.getElementById('thoughtTimer');
            const timeLeftDisplay = document.getElementById('timeLeftDisplay');
            
            if (timer) {
                timer.className = 'thought-timer active';
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
                        
                        setTimeout(() => {
                            if (thoughtDisplay) {
                                thoughtDisplay.className = 'thought-bubble';
                                thoughtDisplay.style.borderColor = '';
                                thoughtDisplay.style.borderWidth = '';
                                thoughtDisplay.style.borderStyle = '';
                                thoughtDisplay.style.background = '';
                                thoughtDisplay.style.transform = '';
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
    // VOTAR
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

            thoughtDisplay.className = 'thought-bubble';
            
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
                } else {
                    mensaje = `🧠 ¡CEREBRO CORRECTO! 🧠 +${result.points || 0} pts`;
                    color = '#4d96ff';
                    bgColor = 'rgba(77, 150, 255, 0.25)';
                    transform = 'scale(1.05)';
                    shadow = '0 0 40px rgba(77, 150, 255, 0.4)';
                    this.ui.showConfetti(15);
                }
            } else {
                mensaje = decision === 'caca' 
                    ? `💥 ¡ERROR! No era CACA ❌ ${result.points || 0}pts` 
                    : `💥 ¡ERROR! No era CEREBRO ❌ ${result.points || 0}pts`;
                color = '#ff1744';
                bgColor = 'rgba(255, 23, 68, 0.25)';
                transform = 'scale(0.92)';
                shadow = '0 0 50px rgba(255, 23, 68, 0.5)';
                
                if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }
                
                if (Math.random() > 0.3) {
                    this.ui.cacaExplosionEffect();
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

            if (bonusExtra > 0) {
                this.ui.showToast(
                    this.pLang.translateMessage(`⚡ ¡RESPUESTA RÁPIDA! +${bonusExtra} pts extra`),
                    'success',
                    2000
                );
                this.ui.showConfetti(15);
            }

            this.ui.updateGameUI(this.game.gameState, this.vigia.getVigiaStatus());
            
            this.ui.updateElement('cacaCount', this.game.gameState.cacaPoints || 0);
            this.ui.updateElement('cerebroCount', this.game.gameState.brainPoints || 0);
            this.ui.updateElement('xpDisplay', this.game.gameState.xp || 0);
            this.ui.updateElement('scoreDisplay', this.game.gameState.score || 0);
            this.ui.updateElement('levelDisplay', this.game.gameState.level || 1);
            this.ui.updateElement('streakDisplay', this.game.gameState.streak || 0);
            
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
                    thoughtDisplay.style.color = '';
                    thoughtDisplay.style.fontWeight = '';
                    
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
    // RESET
    // ============================================
    async handleReset() {
        if (!this.isInitialized || !this.game) {
            this.ui.showToast('El juego no está inicializado', 'error');
            return;
        }
        
        const messages = [
            '💩 ¿Resetear? ¡Perderás toda tu caca acumulada!',
            '🔥 ¡No borres tu legado de caca! ¿Seguro?',
            '💀 ¿Empezar de nuevo? La caca te espera...'
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        if (!confirm(msg)) return;
        
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
    // PAUSA / CONTINUAR
    // ============================================
    togglePause() {
        if (!this.game) return;
        
        const wasPaused = this.game.gameState.isPaused || false;
        this.game.gameState.isPaused = !wasPaused;
        
        if (this.game.gameState.isPaused) {
            this.ui.showToast('⏸️ Juego en pausa', 'info', 1500);
            if (this.cacaCompa) {
                this.cacaCompa.stopNotifications();
            }
        } else {
            this.ui.showToast('▶️ ¡Juego reanudado!', 'success', 1500);
            if (this.cacaCompa) {
                this.cacaCompa.startPeriodicNotifications(
                    (msg, type) => this.showThrottledNotification(msg, type),
                    35
                );
            }
            if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
                this.generateThought();
            }
        }
    }

    // ============================================
    // APLICAR PENALIZACIÓN
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
    // MOSTRAR ESTADÍSTICAS
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
                    </div>
                    <div class="stat-absurd-card">
                        <span class="stat-emoji">🧠</span>
                        <h3>🧠 Vigía Neuro</h3>
                        <p>Flujo: ${stats.metrics?.gameFlow || 'optimal'}</p>
                        <p>Absurdez: ${Math.round(stats.metrics?.absurdityLevel || 0)}%</p>
                        <p>Neuroplasticidad: ${Math.round(stats.metrics?.neuroplasticity || 0)}%</p>
                    </div>
                    <div class="stat-absurd-card">
                        <span class="stat-emoji">🏆</span>
                        <h3>🏆 Logros</h3>
                        <p>Desbloqueados: ${stats.totalAchievements || 0}</p>
                        <p>Sesiones: ${stats.totalSessions || 0}</p>
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
    // MOSTRAR LOGROS
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
                    <h2>🎯 LOGROS</h2>
                    <div class="achievement-stats">
                        <span>${stats.unlocked}/${stats.total}</span>
                        <span>${stats.percentage}%</span>
                    </div>
                </div>
                <div class="achievements-absurd-grid">
            `;
            
            if (allAchievements.length === 0) {
                html += `<p class="no-achievements">🤪 ¡No hay logros disponibles!</p>`;
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
    // COMPARTIR
    // ============================================
    async handleShare() {
        if (!this.game) {
            this.ui.showToast('Espera a que el juego esté listo', 'error');
            return;
        }
        
        const stats = this.game.gameState;
        const vigiaStatus = this.vigia?.getVigiaStatus() || {};
        const diff = this.game.getDifficulty();
        const totalAchievements = this.achievements?.getStatistics() || { unlocked: 0, total: 0 };
        
        const shareText = `💩 CACA BRAIN ULTRA v2.0 - Mis stats épicos:
    
🎯 Dificultad: ${diff.level.toUpperCase()}
🎮 Score: ${stats.score || 0}
🏆 Nivel: ${stats.level || 1}
⭐ XP: ${stats.xp || 0}
🔥 Racha: ${stats.streak || 0}
💩 CACA: ${stats.cacaPoints || 0}
🧠 CEREBRO: ${stats.brainPoints || 0}
🎯 Precisión: ${stats.accuracy || 0}%
🏆 Logros: ${totalAchievements.unlocked}/${totalAchievements.total}

💪 CACA POWER: ${this.cacaStats.poderCaca}%
🔥 Racha máxima: ${this.cacaStats.rachaMaxCaca}
⚡ CACA Perfecta: ${this.cacaStats.cacaPerfecta}

🎮 ¡Únete al absurdo!`;
        
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
    // GAME LOOP
    // ============================================
    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        const interval = CONFIG.GAME.THOUGHT_INTERVAL || 7000;
        
        this.gameLoopInterval = setInterval(() => {
            if (this.isInitialized && 
                this.game?.isInitialized && 
                !this.isWaitingForResponse && 
                this.thoughtGenerationEnabled &&
                !this.game.gameState?.isPaused) {
                this.generateThought();
            }
        }, interval);
    }

    // ============================================
    // GLOBAL LISTENERS
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
            } else if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
                e.preventDefault();
            } else if (e.key === 'r' || e.key === 'R') {
                if (e.ctrlKey) return;
                this.handleReset();
                e.preventDefault();
            } else if (e.key === ' ' || e.key === 'Space') {
                this.ui.cacaExplosionEffect();
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
                if (this.isInitialized && !this.isWaitingForResponse && !this.game.gameState?.isPaused) {
                    setTimeout(() => {
                        if (!this.isWaitingForResponse && this.thoughtGenerationEnabled) {
                            this.generateThought();
                        }
                    }, 1000);
                }
            }
        });
    }

    // ============================================
    // DESTRUIR
    // ============================================
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