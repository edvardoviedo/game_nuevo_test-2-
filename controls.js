/**
 * Tilt Runner - Controls System
 * Sistema de controles para dispositivos móviles (inclinación) y desktop (teclado)
 */

class ControlsManager {
    constructor() {
        // Estado de los controles
        this.isEnabled = false;
        this.isMobile = this.detectMobile();
        this.hasOrientationPermission = false;
        
        // Configuración de sensibilidad
        this.sensitivity = {
            mobile: 0.8,
            desktop: 1.0
        };
        
        // Estado de las teclas (para desktop)
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyW: false,
            KeyS: false,
            KeyA: false,
            KeyD: false
        };
        
        // Datos de orientación
        this.orientation = {
            alpha: 0, // Rotación Z (brújula)
            beta: 0,  // Rotación X (inclinación frontal/trasera)
            gamma: 0  // Rotación Y (inclinación izquierda/derecha)
        };
        
        // Calibración inicial
        this.calibration = {
            beta: 0,
            gamma: 0,
            isCalibrated: false
        };
        
        // Referencia al motor de físicas
        this.physicsEngine = null;
        
        // Callbacks
        this.onForceChange = null;
        
        this.initializeControls();
    }
    
    /**
     * Detecta si el dispositivo es móvil
     * @returns {boolean}
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (typeof window.orientation !== 'undefined');
    }
    
    /**
     * Inicializa los sistemas de control
     */
    initializeControls() {
        if (this.isMobile) {
            this.initializeMobileControls();
        } else {
            this.initializeDesktopControls();
        }
        
        // Mostrar información de controles
        this.updateControlsInfo();
    }
    
    /**
     * Inicializa controles móviles (DeviceOrientationEvent)
     */
    async initializeMobileControls() {
        // Verificar soporte para DeviceOrientationEvent
        if (!window.DeviceOrientationEvent) {
            console.warn('DeviceOrientationEvent no soportado');
            this.fallbackToDesktopControls();
            return;
        }
        
        // Solicitar permisos en iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.hasOrientationPermission = true;
                    this.setupOrientationListener();
                } else {
                    console.warn('Permiso de orientación denegado');
                    this.fallbackToDesktopControls();
                }
            } catch (error) {
                console.error('Error solicitando permisos:', error);
                this.fallbackToDesktopControls();
            }
        } else {
            // Android y otros dispositivos
            this.hasOrientationPermission = true;
            this.setupOrientationListener();
        }
    }
    
    /**
     * Configura el listener de orientación del dispositivo
     */
    setupOrientationListener() {
        window.addEventListener('deviceorientation', (event) => {
            if (!this.isEnabled) return;
            
            // Actualizar datos de orientación
            this.orientation.alpha = event.alpha || 0;
            this.orientation.beta = event.beta || 0;
            this.orientation.gamma = event.gamma || 0;
            
            // Aplicar calibración si está disponible
            let adjustedBeta = this.orientation.beta - this.calibration.beta;
            let adjustedGamma = this.orientation.gamma - this.calibration.gamma;
            
            // Normalizar valores y aplicar sensibilidad
            const forceX = this.normalizeOrientation(adjustedGamma, 45) * this.sensitivity.mobile;
            const forceY = this.normalizeOrientation(adjustedBeta, 45) * this.sensitivity.mobile;
            
            // Enviar fuerzas al motor de físicas
            this.applyForces(forceX, forceY);
        });
        
        console.log('Controles móviles inicializados');
    }
    
    /**
     * Inicializa controles de desktop (teclado)
     */
    initializeDesktopControls() {
        // Listener para teclas presionadas
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return;
            
            if (event.code in this.keys) {
                this.keys[event.code] = true;
                event.preventDefault();
            }
        });
        
        // Listener para teclas liberadas
        document.addEventListener('keyup', (event) => {
            if (event.code in this.keys) {
                this.keys[event.code] = false;
                event.preventDefault();
            }
        });
        
        // Bucle de actualización para controles de teclado
        this.startKeyboardLoop();
        
        console.log('Controles de teclado inicializados');
    }
    
    /**
     * Fallback a controles de desktop cuando móvil no funciona
     */
    fallbackToDesktopControls() {
        this.isMobile = false;
        this.initializeDesktopControls();
        this.updateControlsInfo();
    }
    
    /**
     * Inicia el bucle de actualización para controles de teclado
     */
    startKeyboardLoop() {
        const updateKeyboard = () => {
            if (!this.isEnabled) {
                requestAnimationFrame(updateKeyboard);
                return;
            }
            
            let forceX = 0;
            let forceY = 0;
            
            // Calcular fuerzas basadas en teclas presionadas
            if (this.keys.ArrowLeft || this.keys.KeyA) forceX -= 1;
            if (this.keys.ArrowRight || this.keys.KeyD) forceX += 1;
            if (this.keys.ArrowUp || this.keys.KeyW) forceY -= 1;
            if (this.keys.ArrowDown || this.keys.KeyS) forceY += 1;
            
            // Aplicar sensibilidad
            forceX *= this.sensitivity.desktop;
            forceY *= this.sensitivity.desktop;
            
            // Enviar fuerzas al motor de físicas
            this.applyForces(forceX, forceY);
            
            requestAnimationFrame(updateKeyboard);
        };
        
        updateKeyboard();
    }
    
    /**
     * Normaliza valores de orientación a un rango -1 a 1
     * @param {number} value - Valor de orientación
     * @param {number} maxAngle - Ángulo máximo esperado
     * @returns {number} - Valor normalizado
     */
    normalizeOrientation(value, maxAngle) {
        return Math.max(-1, Math.min(1, value / maxAngle));
    }
    
    /**
     * Aplica fuerzas al motor de físicas
     * @param {number} forceX - Fuerza horizontal (-1 a 1)
     * @param {number} forceY - Fuerza vertical (-1 a 1)
     */
    applyForces(forceX, forceY) {
        // Enviar al motor de físicas si está disponible
        if (this.physicsEngine) {
            this.physicsEngine.updateGravity(forceY * 45, forceX * 45);
        }
        
        // Callback personalizado si está definido
        if (this.onForceChange) {
            this.onForceChange(forceX, forceY);
        }
    }
    
    /**
     * Calibra los controles móviles con la posición actual
     */
    calibrate() {
        if (this.isMobile && this.hasOrientationPermission) {
            this.calibration.beta = this.orientation.beta;
            this.calibration.gamma = this.orientation.gamma;
            this.calibration.isCalibrated = true;
            
            console.log('Controles calibrados:', this.calibration);
            
            // Mostrar mensaje de calibración
            this.showCalibrationMessage();
        }
    }
    
    /**
     * Muestra mensaje de calibración exitosa
     */
    showCalibrationMessage() {
        // Crear elemento de notificación temporal
        const notification = document.createElement('div');
        notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neon-cyan text-deep-black px-6 py-3 rounded-lg font-bold z-50 animate-pulse';
        notification.textContent = '¡Calibración completada!';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    /**
     * Solicita permisos de orientación (para iOS)
     */
    async requestOrientationPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.hasOrientationPermission = true;
                    this.setupOrientationListener();
                    return true;
                }
            } catch (error) {
                console.error('Error solicitando permisos:', error);
            }
        }
        return false;
    }
    
    /**
     * Actualiza la información de controles en la UI
     */
    updateControlsInfo() {
        const infoElement = document.querySelector('#gameScreen .bottom-4 p');
        if (infoElement) {
            if (this.isMobile) {
                infoElement.innerHTML = '📱 Inclina tu celular para mover la bolita<br><small>Toca para calibrar</small>';
                
                // Agregar listener para calibración al tocar
                infoElement.addEventListener('click', () => {
                    this.calibrate();
                });
            } else {
                infoElement.innerHTML = '⌨️ Usa las flechas o WASD para mover la bolita';
            }
        }
    }
    
    /**
     * Establece la referencia al motor de físicas
     * @param {PhysicsEngine} physicsEngine - Instancia del motor de físicas
     */
    setPhysicsEngine(physicsEngine) {
        this.physicsEngine = physicsEngine;
    }
    
    /**
     * Habilita los controles
     */
    enable() {
        this.isEnabled = true;
        
        // Auto-calibrar en móviles si no está calibrado
        if (this.isMobile && !this.calibration.isCalibrated) {
            setTimeout(() => {
                this.calibrate();
            }, 1000);
        }
    }
    
    /**
     * Deshabilita los controles
     */
    disable() {
        this.isEnabled = false;
        
        // Resetear estado de teclas
        Object.keys(this.keys).forEach(key => {
            this.keys[key] = false;
        });
    }
    
    /**
     * Obtiene información de debug de los controles
     * @returns {Object} - Información de debug
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            isMobile: this.isMobile,
            hasOrientationPermission: this.hasOrientationPermission,
            orientation: this.orientation,
            calibration: this.calibration,
            keys: this.keys,
            sensitivity: this.sensitivity
        };
    }
    
    /**
     * Ajusta la sensibilidad de los controles
     * @param {number} mobileSensitivity - Sensibilidad para móviles (0-2)
     * @param {number} desktopSensitivity - Sensibilidad para desktop (0-2)
     */
    setSensitivity(mobileSensitivity, desktopSensitivity) {
        this.sensitivity.mobile = Math.max(0, Math.min(2, mobileSensitivity));
        this.sensitivity.desktop = Math.max(0, Math.min(2, desktopSensitivity));
    }
}

