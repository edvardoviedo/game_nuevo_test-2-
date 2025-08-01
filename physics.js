/**
 * Tilt Runner - Physics Engine
 * Sistema de físicas para manejar colisiones, fuerzas y movimiento
 */

class PhysicsEngine {
    constructor() {
        // Configuración de físicas globales
        this.gravity = {
            x: 0,
            y: 0
        };
        
        // Configuración de sensibilidad
        this.sensitivity = {
            mobile: 0.5,
            desktop: 0.3
        };
        
        // Lista de obstáculos y elementos del juego
        this.obstacles = [];
        this.goal = null;
        this.ball = null;
        
        // Estado del motor
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.initializeGameElements();
    }
    
    /**
     * Inicializa los elementos del juego obteniendo sus posiciones del DOM
     */
    initializeGameElements() {
        // Obtener obstáculos del DOM
        this.updateObstacles();
        
        // Obtener meta del DOM
        this.updateGoal();
    }
    
    /**
     * Actualiza la lista de obstáculos basada en elementos DOM
     */
    updateObstacles() {
        this.obstacles = [];
        const obstacleElements = document.querySelectorAll('.obstacle');
        const gameContainer = document.querySelector('#gameArea .border-neon-blue');
        
        if (!gameContainer) return;
        
        const containerRect = gameContainer.getBoundingClientRect();
        
        obstacleElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // Calcular posición relativa al contenedor del juego
            const relativeX = rect.left - containerRect.left;
            const relativeY = rect.top - containerRect.top;
            
            this.obstacles.push({
                element: element,
                x: relativeX,
                y: relativeY,
                width: rect.width,
                height: rect.height,
                originalX: relativeX,
                originalY: relativeY,
                // Propiedades para movimiento de obstáculos
                moveSpeed: Math.random() * 2 + 1,
                moveDirection: Math.random() * Math.PI * 2,
                moveRadius: Math.random() * 20 + 10
            });
        });
    }
    
    /**
     * Actualiza la posición de la meta basada en el DOM
     */
    updateGoal() {
        const goalElement = document.getElementById('goal');
        const gameContainer = document.querySelector('#gameArea .border-neon-blue');
        
        if (!goalElement || !gameContainer) return;
        
        const goalRect = goalElement.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        // Calcular posición relativa al contenedor del juego
        const relativeX = goalRect.left - containerRect.left + goalRect.width / 2;
        const relativeY = goalRect.top - containerRect.top + goalRect.height / 2;
        
        this.goal = {
            element: goalElement,
            x: relativeX,
            y: relativeY,
            radius: goalRect.width / 2
        };
    }
    
    /**
     * Establece la referencia a la bolita
     * @param {Ball} ball - Instancia de la clase Ball
     */
    setBall(ball) {
        this.ball = ball;
    }
    
    /**
     * Actualiza la gravedad basada en la orientación del dispositivo
     * @param {number} beta - Inclinación frontal/trasera (-180 a 180)
     * @param {number} gamma - Inclinación izquierda/derecha (-90 a 90)
     */
    updateGravity(beta, gamma) {
        // Normalizar valores de orientación
        const normalizedBeta = Math.max(-45, Math.min(45, beta)) / 45;
        const normalizedGamma = Math.max(-45, Math.min(45, gamma)) / 45;
        
        // Aplicar sensibilidad
        const sensitivity = this.isMobile() ? this.sensitivity.mobile : this.sensitivity.desktop;
        
        this.gravity.x = normalizedGamma * sensitivity;
        this.gravity.y = normalizedBeta * sensitivity;
    }
    
    /**
     * Detecta si el dispositivo es móvil
     * @returns {boolean}
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Inicia el motor de físicas
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.update();
    }
    
    /**
     * Detiene el motor de físicas
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * Bucle principal de actualización del motor de físicas
     */
    update() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Actualizar elementos del juego
        this.updateMovingObstacles();
        
        // Aplicar físicas a la bolita si existe
        if (this.ball) {
            // Aplicar gravedad
            this.ball.applyForce(this.gravity.x, this.gravity.y);
            
            // Actualizar bolita
            this.ball.update();
            
            // Verificar colisiones
            this.checkCollisions();
        }
        
        // Continuar el bucle
        requestAnimationFrame(() => this.update());
    }
    
    /**
     * Actualiza la posición de obstáculos móviles
     */
    updateMovingObstacles() {
        const time = performance.now() * 0.001; // Convertir a segundos
        
        this.obstacles.forEach(obstacle => {
            // Movimiento circular suave para algunos obstáculos
            const offsetX = Math.sin(time * obstacle.moveSpeed) * obstacle.moveRadius;
            const offsetY = Math.cos(time * obstacle.moveSpeed * 0.7) * obstacle.moveRadius * 0.5;
            
            obstacle.x = obstacle.originalX + offsetX;
            obstacle.y = obstacle.originalY + offsetY;
            
            // Actualizar posición visual del elemento DOM
            if (obstacle.element) {
                obstacle.element.style.left = `${obstacle.x}px`;
                obstacle.element.style.top = `${obstacle.y}px`;
            }
        });
    }
    
    /**
     * Verifica todas las colisiones del juego
     */
    checkCollisions() {
        if (!this.ball) return;
        
        // Verificar colisiones con obstáculos
        this.obstacles.forEach(obstacle => {
            if (this.ball.checkObstacleCollision(obstacle)) {
                this.ball.handleObstacleCollision(obstacle);
                this.onObstacleHit(obstacle);
            }
        });
        
        // Verificar colisión con la meta
        if (this.goal && this.ball.checkGoalCollision(this.goal)) {
            this.onGoalReached();
        }
    }
    
    /**
     * Maneja el evento cuando la bolita toca un obstáculo
     * @param {Object} obstacle - Obstáculo tocado
     */
    onObstacleHit(obstacle) {
        // Efecto visual en el obstáculo
        if (obstacle.element) {
            obstacle.element.classList.add('shake');
            setTimeout(() => {
                obstacle.element.classList.remove('shake');
            }, 300);
        }
        
        // Vibración más intensa para obstáculos
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('obstacleHit', {
            detail: { obstacle: obstacle }
        }));
    }
    
    /**
     * Maneja el evento cuando la bolita llega a la meta
     */
    onGoalReached() {
        // Efecto visual en la meta
        if (this.goal && this.goal.element) {
            this.goal.element.classList.add('animate-pulse');
        }
        
        // Vibración de victoria
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('goalReached'));
    }
    
    /**
     * Reinicia las posiciones de todos los elementos
     */
    reset() {
        // Reiniciar obstáculos a posiciones originales
        this.obstacles.forEach(obstacle => {
            obstacle.x = obstacle.originalX;
            obstacle.y = obstacle.originalY;
            
            if (obstacle.element) {
                obstacle.element.style.left = `${obstacle.x}px`;
                obstacle.element.style.top = `${obstacle.y}px`;
                obstacle.element.classList.remove('shake', 'animate-pulse');
            }
        });
        
        // Reiniciar meta
        if (this.goal && this.goal.element) {
            this.goal.element.classList.remove('animate-pulse');
        }
        
        // Reiniciar bolita
        if (this.ball) {
            this.ball.reset();
        }
        
        // Reiniciar gravedad
        this.gravity.x = 0;
        this.gravity.y = 0;
    }
    
    /**
     * Actualiza las dimensiones y posiciones cuando cambia el tamaño de pantalla
     */
    resize() {
        // Actualizar límites de la bolita
        if (this.ball) {
            this.ball.updateBounds();
        }
        
        // Actualizar posiciones de elementos del juego
        this.updateObstacles();
        this.updateGoal();
    }
    
    /**
     * Obtiene información de debug del motor de físicas
     * @returns {Object} - Información de debug
     */
    getDebugInfo() {
        return {
            gravity: this.gravity,
            isRunning: this.isRunning,
            obstacleCount: this.obstacles.length,
            deltaTime: this.deltaTime,
            ballPosition: this.ball ? this.ball.getPosition() : null,
            ballVelocity: this.ball ? this.ball.getVelocity() : null
        };
    }
}

