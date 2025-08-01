/**
 * Tilt Runner - Main Game Controller
 * Controlador principal que coordina todos los sistemas del juego
 */

class TiltRunnerGame {
    constructor() {
        // Sistemas del juego
        this.ball = null;
        this.physics = null;
        this.controls = null;
        this.ui = null;
        
        // Estado del juego
        this.gameState = 'menu'; // menu, playing, paused, victory, gameOver
        this.isInitialized = false;
        
        // Configuración
        this.config = {
            ballStartX: 50,
            ballStartY: 50,
            ballRadius: 12,
            gameTime: 60
        };
        
        // Efectos visuales
        this.ballTrails = [];
        this.maxTrails = 10;
        
        this.initialize();
    }
    
    /**
     * Inicializa todos los sistemas del juego
     */
    async initialize() {
        try {
            console.log('🎮 Inicializando Tilt Runner...');
            
            // Esperar a que el DOM esté completamente cargado
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Inicializar sistemas
            this.initializeUI();
            this.initializePhysics();
            this.initializeBall();
            this.initializeControls();
            
            // Configurar eventos del juego
            this.setupGameEvents();
            
            // Configurar eventos de redimensionamiento
            this.setupResizeHandler();
            
            this.isInitialized = true;
            console.log('✅ Tilt Runner inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando el juego:', error);
        }
    }
    
    /**
     * Inicializa el sistema de UI
     */
    initializeUI() {
        this.ui = new UIManager();
        
        // Configurar callbacks de UI
        this.ui.onGameStart = () => this.startGame();
        this.ui.onGamePause = () => this.pauseGame();
        this.ui.onGameResume = () => this.resumeGame();
        this.ui.onGameRestart = () => this.restartGame();
        this.ui.onTimeUp = () => this.gameOver();
    }
    
    /**
     * Inicializa el motor de físicas
     */
    initializePhysics() {
        this.physics = new PhysicsEngine();
    }
    
    /**
     * Inicializa la bolita del jugador
     */
    initializeBall() {
        // Calcular posición inicial basada en el contenedor del juego
        const gameContainer = document.querySelector('#gameArea .border-neon-blue');
        if (gameContainer) {
            const rect = gameContainer.getBoundingClientRect();
            this.config.ballStartX = this.config.ballStartX;
            this.config.ballStartY = this.config.ballStartY;
        }
        
        this.ball = new Ball(
            this.config.ballStartX,
            this.config.ballStartY,
            this.config.ballRadius
        );
        
        // Conectar la bolita con el motor de físicas
        this.physics.setBall(this.ball);
    }
    
    /**
     * Inicializa el sistema de controles
     */
    initializeControls() {
        this.controls = new ControlsManager();
        
        // Conectar controles con el motor de físicas
        this.controls.setPhysicsEngine(this.physics);
    }
    
    /**
     * Configura eventos personalizados del juego
     */
    setupGameEvents() {
        // Evento cuando se toca un obstáculo
        document.addEventListener('obstacleHit', (event) => {
            this.handleObstacleHit(event.detail.obstacle);
        });
        
        // Evento cuando se llega a la meta
        document.addEventListener('goalReached', () => {
            this.handleGoalReached();
        });
        
        // Eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') {
                this.pauseGame();
            }
        });
    }
    
    /**
     * Configura el manejador de redimensionamiento
     */
    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // También manejar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }
    
    /**
     * Maneja el redimensionamiento de la ventana
     */
    handleResize() {
        if (this.physics) {
            this.physics.resize();
        }
        
        if (this.ball) {
            this.ball.updateBounds();
        }
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        console.log('🚀 Iniciando juego...');
        
        this.gameState = 'playing';
        
        // Resetear elementos del juego
        this.resetGame();
        
        // Habilitar controles
        this.controls.enable();
        
        // Iniciar motor de físicas
        this.physics.start();
        
        // Iniciar bucle de efectos visuales
        this.startVisualEffects();
        
        console.log('▶️ Juego iniciado');
    }
    
    /**
     * Pausa el juego
     */
    pauseGame() {
        console.log('⏸️ Juego pausado');
        
        this.gameState = 'paused';
        
        // Deshabilitar controles
        this.controls.disable();
        
        // Pausar físicas
        this.physics.stop();
    }
    
    /**
     * Reanuda el juego
     */
    resumeGame() {
        console.log('▶️ Juego reanudado');
        
        this.gameState = 'playing';
        
        // Habilitar controles
        this.controls.enable();
        
        // Reanudar físicas
        this.physics.start();
    }
    
    /**
     * Reinicia el juego
     */
    restartGame() {
        console.log('🔄 Reiniciando juego...');
        
        // Detener sistemas
        this.physics.stop();
        this.controls.disable();
        
        // Resetear estado
        this.resetGame();
        
        // Iniciar de nuevo
        this.startGame();
    }
    
    /**
     * Resetea el estado del juego
     */
    resetGame() {
        // Resetear físicas
        this.physics.reset();
        
        // Limpiar efectos visuales
        this.clearVisualEffects();
        
        // Resetear trails de la bolita
        this.ballTrails = [];
    }
    
    /**
     * Maneja cuando se toca un obstáculo
     * @param {Object} obstacle - Obstáculo tocado
     */
    handleObstacleHit(obstacle) {
        console.log('💥 Obstáculo tocado');
        
        // Crear efecto visual de impacto
        this.createImpactEffect(obstacle);
        
        // Penalización de tiempo (opcional)
        // this.ui.gameTimer.remaining = Math.max(0, this.ui.gameTimer.remaining - 2);
    }
    
    /**
     * Maneja cuando se llega a la meta
     */
    handleGoalReached() {
        console.log('🎯 ¡Meta alcanzada!');
        
        this.gameState = 'victory';
        
        // Detener sistemas
        this.physics.stop();
        this.controls.disable();
        
        // Mostrar pantalla de victoria
        this.ui.handleVictory();
        
        // Crear efectos de celebración
        this.createVictoryEffects();
    }
    
    /**
     * Maneja el game over
     */
    gameOver() {
        console.log('💀 Game Over');
        
        this.gameState = 'gameOver';
        
        // Detener sistemas
        this.physics.stop();
        this.controls.disable();
        
        // Limpiar efectos
        this.clearVisualEffects();
    }
    
    /**
     * Inicia los efectos visuales del juego
     */
    startVisualEffects() {
        this.visualEffectsLoop();
    }
    
    /**
     * Bucle de efectos visuales
     */
    visualEffectsLoop() {
        if (this.gameState !== 'playing') return;
        
        // Crear trail de la bolita
        this.createBallTrail();
        
        // Limpiar trails antiguos
        this.cleanupBallTrails();
        
        // Continuar el bucle
        requestAnimationFrame(() => this.visualEffectsLoop());
    }
    
    /**
     * Crea trail de la bolita
     */
    createBallTrail() {
        if (!this.ball || this.ball.getVelocity().speed < 1) return;
        
        const position = this.ball.getPosition();
        const gameContainer = document.querySelector('#gameArea .border-neon-blue');
        
        if (!gameContainer) return;
        
        // Crear elemento de trail
        const trail = document.createElement('div');
        trail.className = 'ball-trail';
        trail.style.left = `${position.x}px`;
        trail.style.top = `${position.y}px`;
        
        gameContainer.appendChild(trail);
        
        // Agregar a la lista de trails
        this.ballTrails.push({
            element: trail,
            timestamp: Date.now()
        });
        
        // Limitar número de trails
        if (this.ballTrails.length > this.maxTrails) {
            const oldTrail = this.ballTrails.shift();
            if (oldTrail.element.parentNode) {
                oldTrail.element.parentNode.removeChild(oldTrail.element);
            }
        }
    }
    
    /**
     * Limpia trails antiguos de la bolita
     */
    cleanupBallTrails() {
        const now = Date.now();
        this.ballTrails = this.ballTrails.filter(trail => {
            if (now - trail.timestamp > 500) {
                if (trail.element.parentNode) {
                    trail.element.parentNode.removeChild(trail.element);
                }
                return false;
            }
            return true;
        });
    }
    
    /**
     * Crea efecto de impacto
     * @param {Object} obstacle - Obstáculo impactado
     */
    createImpactEffect(obstacle) {
        if (!obstacle.element) return;
        
        // Crear ondas de choque
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const shockwave = document.createElement('div');
                shockwave.className = 'absolute border-2 border-neon-pink rounded-full pointer-events-none';
                shockwave.style.left = `${obstacle.x + obstacle.width / 2}px`;
                shockwave.style.top = `${obstacle.y + obstacle.height / 2}px`;
                shockwave.style.width = '0px';
                shockwave.style.height = '0px';
                shockwave.style.transform = 'translate(-50%, -50%)';
                
                const gameContainer = document.querySelector('#gameArea .border-neon-blue');
                if (gameContainer) {
                    gameContainer.appendChild(shockwave);
                    
                    // Animar la onda de choque
                    shockwave.animate([
                        { width: '0px', height: '0px', opacity: 1 },
                        { width: '60px', height: '60px', opacity: 0 }
                    ], {
                        duration: 300,
                        easing: 'ease-out'
                    }).onfinish = () => {
                        if (shockwave.parentNode) {
                            shockwave.parentNode.removeChild(shockwave);
                        }
                    };
                }
            }, i * 100);
        }
    }
    
    /**
     * Crea efectos de victoria
     */
    createVictoryEffects() {
        // Efecto de explosión en la meta
        const goal = document.getElementById('goal');
        if (goal) {
            goal.style.animation = 'none';
            goal.offsetHeight; // Forzar reflow
            goal.style.animation = 'glow 0.5s ease-in-out infinite alternate';
        }
        
        // Crear partículas de celebración
        this.createCelebrationParticles();
    }
    
    /**
     * Crea partículas de celebración
     */
    createCelebrationParticles() {
        const gameContainer = document.querySelector('#gameArea .border-neon-blue');
        if (!gameContainer) return;
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'absolute w-2 h-2 rounded-full pointer-events-none';
                particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
                particle.style.left = `${Math.random() * gameContainer.clientWidth}px`;
                particle.style.top = `${Math.random() * gameContainer.clientHeight}px`;
                
                gameContainer.appendChild(particle);
                
                // Animar partícula
                particle.animate([
                    { 
                        transform: 'scale(0) translateY(0px)',
                        opacity: 1
                    },
                    { 
                        transform: 'scale(1) translateY(-100px)',
                        opacity: 0
                    }
                ], {
                    duration: 2000,
                    easing: 'ease-out'
                }).onfinish = () => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                };
            }, i * 50);
        }
    }
    
    /**
     * Limpia todos los efectos visuales
     */
    clearVisualEffects() {
        // Limpiar trails de la bolita
        this.ballTrails.forEach(trail => {
            if (trail.element.parentNode) {
                trail.element.parentNode.removeChild(trail.element);
            }
        });
        this.ballTrails = [];
        
        // Limpiar otros efectos
        const gameContainer = document.querySelector('#gameArea .border-neon-blue');
        if (gameContainer) {
            gameContainer.querySelectorAll('.ball-trail, .absolute').forEach(element => {
                if (element.classList.contains('ball-trail') || 
                    element.style.background?.includes('hsl')) {
                    element.remove();
                }
            });
        }
    }
    
    /**
     * Obtiene información de debug del juego
     * @returns {Object} - Información de debug
     */
    getDebugInfo() {
        return {
            gameState: this.gameState,
            isInitialized: this.isInitialized,
            config: this.config,
            physics: this.physics?.getDebugInfo(),
            controls: this.controls?.getDebugInfo(),
            ballTrails: this.ballTrails.length
        };
    }
    
    /**
     * Habilita modo debug (opcional)
     */
    enableDebugMode() {
        // Mostrar información de debug en consola cada segundo
        setInterval(() => {
            console.log('🐛 Debug Info:', this.getDebugInfo());
        }, 1000);
        
        // Agregar controles de debug
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey) {
                switch (event.code) {
                    case 'KeyD':
                        console.log('Debug Info:', this.getDebugInfo());
                        event.preventDefault();
                        break;
                    case 'KeyR':
                        this.restartGame();
                        event.preventDefault();
                        break;
                    case 'KeyV':
                        this.handleGoalReached();
                        event.preventDefault();
                        break;
                }
            }
        });
    }
}

// Inicializar el juego cuando se carga la página
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new TiltRunnerGame();
    
    // Habilitar modo debug en desarrollo (comentar en producción)
    // game.enableDebugMode();
});

// Exportar para uso global (opcional)
window.TiltRunnerGame = TiltRunnerGame;

