/**
 * Tilt Runner - Ball Class
 * Clase que representa la bolita del jugador con físicas básicas
 */

class Ball {
    constructor(x, y, radius = 12) {
        // Posición inicial
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
        // Propiedades físicas
        this.radius = radius;
        this.vx = 0; // Velocidad en X
        this.vy = 0; // Velocidad en Y
        
        // Configuración de físicas
        this.friction = 0.95; // Fricción para desaceleración natural
        this.bounce = 0.7; // Factor de rebote al chocar
        this.maxSpeed = 8; // Velocidad máxima
        this.acceleration = 0.3; // Aceleración base
        
        // Referencias DOM
        this.element = document.getElementById('ball');
        this.gameArea = document.getElementById('gameArea');
        
        // Límites del área de juego (se calculan dinámicamente)
        this.bounds = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
        
        // Estado
        this.isColliding = false;
        
        this.updateBounds();
        this.updatePosition();
    }
    
    /**
     * Actualiza los límites del área de juego basado en el tamaño actual
     */
    updateBounds() {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const containerRect = this.gameArea.querySelector('.border-neon-blue').getBoundingClientRect();
        
        // Calcular límites relativos al contenedor del juego
        this.bounds = {
            left: this.radius,
            right: containerRect.width - this.radius,
            top: this.radius,
            bottom: containerRect.height - this.radius
        };
    }
    
    /**
     * Aplica fuerza a la bolita basada en la inclinación del dispositivo
     * @param {number} forceX - Fuerza horizontal (-1 a 1)
     * @param {number} forceY - Fuerza vertical (-1 a 1)
     */
    applyForce(forceX, forceY) {
        // Aplicar aceleración basada en la fuerza
        this.vx += forceX * this.acceleration;
        this.vy += forceY * this.acceleration;
        
        // Limitar velocidad máxima
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }
    
    /**
     * Actualiza la posición de la bolita aplicando físicas
     */
    update() {
        // Aplicar fricción
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Actualizar posición
        this.x += this.vx;
        this.y += this.vy;
        
        // Verificar colisiones con bordes
        this.checkBoundaryCollisions();
        
        // Actualizar posición visual
        this.updatePosition();
        
        // Verificar si la velocidad es muy baja para detener completamente
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;
    }
    
    /**
     * Verifica y maneja colisiones con los bordes del área de juego
     */
    checkBoundaryCollisions() {
        let collided = false;
        
        // Colisión con borde izquierdo
        if (this.x < this.bounds.left) {
            this.x = this.bounds.left;
            this.vx = -this.vx * this.bounce;
            collided = true;
        }
        
        // Colisión con borde derecho
        if (this.x > this.bounds.right) {
            this.x = this.bounds.right;
            this.vx = -this.vx * this.bounce;
            collided = true;
        }
        
        // Colisión con borde superior
        if (this.y < this.bounds.top) {
            this.y = this.bounds.top;
            this.vy = -this.vy * this.bounce;
            collided = true;
        }
        
        // Colisión con borde inferior
        if (this.y > this.bounds.bottom) {
            this.y = this.bounds.bottom;
            this.vy = -this.vy * this.bounce;
            collided = true;
        }
        
        // Si hubo colisión, activar efectos visuales y vibración
        if (collided && !this.isColliding) {
            this.onCollision();
        }
        
        this.isColliding = collided;
    }
    
    /**
     * Verifica colisión con un obstáculo rectangular
     * @param {Object} obstacle - Objeto con propiedades x, y, width, height
     * @returns {boolean} - True si hay colisión
     */
    checkObstacleCollision(obstacle) {
        const dx = this.x - Math.max(obstacle.x, Math.min(this.x, obstacle.x + obstacle.width));
        const dy = this.y - Math.max(obstacle.y, Math.min(this.y, obstacle.y + obstacle.height));
        
        return (dx * dx + dy * dy) < (this.radius * this.radius);
    }
    
    /**
     * Verifica colisión con la meta circular
     * @param {Object} goal - Objeto con propiedades x, y, radius
     * @returns {boolean} - True si hay colisión
     */
    checkGoalCollision(goal) {
        const dx = this.x - goal.x;
        const dy = this.y - goal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.radius + goal.radius);
    }
    
    /**
     * Maneja la colisión con un obstáculo
     * @param {Object} obstacle - Obstáculo con el que colisionó
     */
    handleObstacleCollision(obstacle) {
        // Calcular dirección de rebote
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        
        // Normalizar dirección
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            // Aplicar rebote
            this.vx = normalX * this.maxSpeed * 0.8;
            this.vy = normalY * this.maxSpeed * 0.8;
            
            // Separar de la colisión
            this.x = centerX + normalX * (this.radius + Math.max(obstacle.width, obstacle.height) / 2 + 5);
            this.y = centerY + normalY * (this.radius + Math.max(obstacle.width, obstacle.height) / 2 + 5);
        }
        
        this.onCollision();
    }
    
    /**
     * Efectos visuales y hápticos cuando hay colisión
     */
    onCollision() {
        // Efecto visual de shake
        this.element.classList.add('shake');
        setTimeout(() => {
            this.element.classList.remove('shake');
        }, 500);
        
        // Vibración en móviles
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        // Efecto de sonido (si se implementa más adelante)
        // this.playCollisionSound();
    }
    
    /**
     * Actualiza la posición visual del elemento DOM
     */
    updatePosition() {
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
    }
    
    /**
     * Reinicia la bolita a su posición inicial
     */
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vx = 0;
        this.vy = 0;
        this.isColliding = false;
        this.updatePosition();
    }
    
    /**
     * Obtiene la posición actual como objeto
     * @returns {Object} - Objeto con propiedades x, y, radius
     */
    getPosition() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius
        };
    }
    
    /**
     * Obtiene la velocidad actual
     * @returns {Object} - Objeto con propiedades vx, vy, speed
     */
    getVelocity() {
        return {
            vx: this.vx,
            vy: this.vy,
            speed: Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        };
    }
}

