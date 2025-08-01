/**
 * Tilt Runner - UI Manager
 * Sistema de interfaz de usuario para manejar pantallas, transiciones y HUD
 */

class UIManager {
    constructor() {
        // Referencias a elementos DOM
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameScreen'),
            victory: document.getElementById('victoryScreen'),
            gameOver: document.getElementById('gameOverScreen')
        };
        
        this.buttons = {
            start: document.getElementById('startButton'),
            pause: document.getElementById('pauseButton'),
            playAgain: document.getElementById('playAgainButton'),
            restart: document.getElementById('restartButton')
        };
        
        this.hud = {
            timer: document.getElementById('timer'),
            victoryTime: document.getElementById('victoryTime')
        };
        
        // Estado actual
        this.currentScreen = 'start';
        this.isPaused = false;
        
        // Temporizador
        this.gameTimer = {
            duration: 60, // 60 segundos
            remaining: 60,
            interval: null,
            startTime: null
        };
        
        // Efectos visuales
        this.particles = [];
        this.scanLines = [];
        
        // Callbacks
        this.onGameStart = null;
        this.onGamePause = null;
        this.onGameResume = null;
        this.onGameRestart = null;
        this.onTimeUp = null;
        
        this.initializeUI();
    }
    
    /**
     * Inicializa la interfaz de usuario y eventos
     */
    initializeUI() {
        // Eventos de botones
        this.buttons.start?.addEventListener('click', () => this.startGame());
        this.buttons.pause?.addEventListener('click', () => this.togglePause());
        this.buttons.playAgain?.addEventListener('click', () => this.restartGame());
        this.buttons.restart?.addEventListener('click', () => this.restartGame());
        
        // Eventos de teclado globales
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    if (this.currentScreen === 'game') {
                        this.togglePause();
                    }
                    event.preventDefault();
                    break;
                case 'Escape':
                    if (this.currentScreen === 'game') {
                        this.showStartScreen();
                    }
                    break;
                case 'Enter':
                    if (this.currentScreen === 'start') {
                        this.startGame();
                    } else if (this.currentScreen === 'victory' || this.currentScreen === 'gameOver') {
                        this.restartGame();
                    }
                    break;
            }
        });
        
        // Eventos de orientación para solicitar permisos en iOS
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            
            this.buttons.start?.addEventListener('click', async (event) => {
                event.preventDefault();
                await this.requestOrientationPermission();
            });
        }
        
        // Inicializar con pantalla de inicio
        this.showStartScreen();
    }
    
    /**
     * Solicita permisos de orientación para iOS
     */
    async requestOrientationPermission() {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                this.startGame();
            } else {
                this.showPermissionDeniedMessage();
            }
        } catch (error) {
            console.error('Error solicitando permisos:', error);
            this.startGame(); // Continuar de todos modos
        }
    }
    
    /**
     * Muestra mensaje cuando se deniegan permisos
     */
    showPermissionDeniedMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neon-pink text-white px-6 py-4 rounded-lg font-bold z-50 text-center';
        message.innerHTML = `
            <p class="mb-2">⚠️ Permisos de orientación requeridos</p>
            <p class="text-sm opacity-80">Habilita los permisos en configuración del navegador</p>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            this.startGame(); // Continuar con controles de teclado
        }, 3000);
    }
    
    /**
     * Muestra la pantalla de inicio
     */
    showStartScreen() {
        this.transitionToScreen('start');
        this.stopTimer();
        this.createStartScreenEffects();
    }
    
    /**
     * Muestra la pantalla de juego
     */
    showGameScreen() {
        this.transitionToScreen('game');
        this.createGameScreenEffects();
    }
    
    /**
     * Muestra la pantalla de victoria
     * @param {number} completionTime - Tiempo que tomó completar el juego
     */
    showVictoryScreen(completionTime) {
        this.transitionToScreen('victory');
        
        // Actualizar tiempo de victoria
        if (this.hud.victoryTime) {
            const minutes = Math.floor(completionTime / 60);
            const seconds = Math.floor(completionTime % 60);
            this.hud.victoryTime.textContent = `Tiempo: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        this.createVictoryEffects();
    }
    
    /**
     * Muestra la pantalla de game over
     */
    showGameOverScreen() {
        this.transitionToScreen('gameOver');
        this.createGameOverEffects();
    }
    
    /**
     * Realiza transición entre pantallas
     * @param {string} screenName - Nombre de la pantalla de destino
     */
    transitionToScreen(screenName) {
        // Ocultar pantalla actual
        if (this.screens[this.currentScreen]) {
            this.screens[this.currentScreen].classList.add('fade-out');
            
            setTimeout(() => {
                this.screens[this.currentScreen].classList.add('hidden');
                this.screens[this.currentScreen].classList.remove('fade-out');
            }, 500);
        }
        
        // Mostrar nueva pantalla
        setTimeout(() => {
            if (this.screens[screenName]) {
                this.screens[screenName].classList.remove('hidden');
                this.screens[screenName].classList.add('fade-in');
                
                setTimeout(() => {
                    this.screens[screenName].classList.remove('fade-in');
                }, 500);
            }
            
            this.currentScreen = screenName;
        }, 250);
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        this.showGameScreen();
        this.startTimer();
        this.isPaused = false;
        
        if (this.onGameStart) {
            this.onGameStart();
        }
    }
    
    /**
     * Alterna pausa del juego
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseTimer();
            this.buttons.pause.textContent = 'REANUDAR';
            this.showPauseOverlay();
            
            if (this.onGamePause) {
                this.onGamePause();
            }
        } else {
            this.resumeTimer();
            this.buttons.pause.textContent = 'PAUSA';
            this.hidePauseOverlay();
            
            if (this.onGameResume) {
                this.onGameResume();
            }
        }
    }
    
    /**
     * Reinicia el juego
     */
    restartGame() {
        this.gameTimer.remaining = this.gameTimer.duration;
        this.updateTimerDisplay();
        this.startGame();
        
        if (this.onGameRestart) {
            this.onGameRestart();
        }
    }
    
    /**
     * Inicia el temporizador del juego
     */
    startTimer() {
        this.gameTimer.startTime = Date.now();
        this.gameTimer.remaining = this.gameTimer.duration;
        
        this.gameTimer.interval = setInterval(() => {
            if (!this.isPaused) {
                this.gameTimer.remaining--;
                this.updateTimerDisplay();
                
                // Efectos visuales cuando queda poco tiempo
                if (this.gameTimer.remaining <= 10) {
                    this.addUrgencyEffects();
                }
                
                // Tiempo agotado
                if (this.gameTimer.remaining <= 0) {
                    this.stopTimer();
                    this.showGameOverScreen();
                    
                    if (this.onTimeUp) {
                        this.onTimeUp();
                    }
                }
            }
        }, 1000);
    }
    
    /**
     * Pausa el temporizador
     */
    pauseTimer() {
        // El temporizador continúa corriendo pero no decrementa cuando está pausado
    }
    
    /**
     * Reanuda el temporizador
     */
    resumeTimer() {
        // El temporizador se reanuda automáticamente
    }
    
    /**
     * Detiene el temporizador
     */
    stopTimer() {
        if (this.gameTimer.interval) {
            clearInterval(this.gameTimer.interval);
            this.gameTimer.interval = null;
        }
    }
    
    /**
     * Actualiza la visualización del temporizador
     */
    updateTimerDisplay() {
        if (this.hud.timer) {
            this.hud.timer.textContent = this.gameTimer.remaining;
            
            // Cambiar color según tiempo restante
            if (this.gameTimer.remaining <= 10) {
                this.hud.timer.className = 'text-2xl font-bold text-neon-pink animate-pulse';
            } else if (this.gameTimer.remaining <= 30) {
                this.hud.timer.className = 'text-2xl font-bold text-yellow-400';
            } else {
                this.hud.timer.className = 'text-2xl font-bold text-neon-cyan';
            }
        }
    }
    
    /**
     * Obtiene el tiempo transcurrido desde el inicio
     * @returns {number} - Tiempo en segundos
     */
    getElapsedTime() {
        return this.gameTimer.duration - this.gameTimer.remaining;
    }
    
    /**
     * Maneja la victoria del jugador
     */
    handleVictory() {
        this.stopTimer();
        const completionTime = this.getElapsedTime();
        this.showVictoryScreen(completionTime);
    }
    
    /**
     * Crea efectos de fondo para la pantalla de inicio
     */
    createStartScreenEffects() {
        this.createFloatingParticles(this.screens.start, 15);
    }
    
    /**
     * Crea efectos de fondo para la pantalla de juego
     */
    createGameScreenEffects() {
        // Agregar grid futurista
        const gameArea = document.getElementById('gameArea');
        if (gameArea) {
            gameArea.classList.add('futuristic-grid');
        }
        
        // Agregar línea de escaneo ocasional
        this.createScanLine();
    }
    
    /**
     * Crea efectos para la pantalla de victoria
     */
    createVictoryEffects() {
        this.createFloatingParticles(this.screens.victory, 25);
        this.createFireworks();
    }
    
    /**
     * Crea efectos para la pantalla de game over
     */
    createGameOverEffects() {
        this.createGlitchEffect();
    }
    
    /**
     * Crea partículas flotantes
     * @param {HTMLElement} container - Contenedor para las partículas
     * @param {number} count - Número de partículas
     */
    createFloatingParticles(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 4}s`;
            particle.style.animationDuration = `${3 + Math.random() * 2}s`;
            
            // Colores aleatorios
            const colors = ['#00BFFF', '#8A2BE2', '#00FFFF', '#FF1493'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
            
            // Remover después de la animación
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 8000);
        }
    }
    
    /**
     * Crea línea de escaneo
     */
    createScanLine() {
        const scanLine = document.createElement('div');
        scanLine.className = 'scan-line';
        document.body.appendChild(scanLine);
        
        setTimeout(() => {
            if (scanLine.parentNode) {
                scanLine.parentNode.removeChild(scanLine);
            }
        }, 3000);
        
        // Crear otra línea después de un tiempo aleatorio
        setTimeout(() => {
            if (this.currentScreen === 'game') {
                this.createScanLine();
            }
        }, 5000 + Math.random() * 10000);
    }
    
    /**
     * Crea fuegos artificiales para la victoria
     */
    createFireworks() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createFirework();
            }, i * 200);
        }
    }
    
    /**
     * Crea un fuego artificial individual
     */
    createFirework() {
        const container = this.screens.victory;
        const centerX = Math.random() * container.clientWidth;
        const centerY = Math.random() * container.clientHeight;
        
        for (let i = 0; i < 12; i++) {
            const spark = document.createElement('div');
            spark.className = 'absolute w-1 h-1 rounded-full';
            spark.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            spark.style.left = `${centerX}px`;
            spark.style.top = `${centerY}px`;
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            
            container.appendChild(spark);
            
            // Animar la chispa
            spark.animate([
                { transform: `translate(0, 0)`, opacity: 1 },
                { transform: `translate(${endX - centerX}px, ${endY - centerY}px)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            }).onfinish = () => {
                if (spark.parentNode) {
                    spark.parentNode.removeChild(spark);
                }
            };
        }
    }
    
    /**
     * Crea efecto de glitch para game over
     */
    createGlitchEffect() {
        const title = this.screens.gameOver.querySelector('h1');
        if (title) {
            title.classList.add('hologram-text');
            title.setAttribute('data-text', title.textContent);
        }
    }
    
    /**
     * Añade efectos de urgencia cuando queda poco tiempo
     */
    addUrgencyEffects() {
        const gameArea = document.getElementById('gameArea');
        if (gameArea) {
            gameArea.style.filter = 'hue-rotate(180deg)';
            
            setTimeout(() => {
                gameArea.style.filter = '';
            }, 200);
        }
    }
    
    /**
     * Muestra overlay de pausa
     */
    showPauseOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'pauseOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';
        overlay.innerHTML = `
            <div class="text-center">
                <h2 class="text-4xl font-bold text-neon-cyan mb-4 animate-pulse">PAUSADO</h2>
                <p class="text-neon-blue">Presiona ESPACIO o el botón para continuar</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    /**
     * Oculta overlay de pausa
     */
    hidePauseOverlay() {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    /**
     * Limpia todos los efectos visuales
     */
    cleanup() {
        // Remover partículas
        document.querySelectorAll('.particle').forEach(p => p.remove());
        
        // Remover líneas de escaneo
        document.querySelectorAll('.scan-line').forEach(s => s.remove());
        
        // Remover overlay de pausa
        this.hidePauseOverlay();
        
        // Detener temporizador
        this.stopTimer();
    }
}

