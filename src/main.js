import { World } from './core/World.js';
import { Renderer } from './graphics/Renderer.js';
import { InputHandler } from './core/InputHandler.js';
import { UI } from './ui/UI.js';

class EcosystemSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Setup canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize systems
        this.world = new World(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.ctx, this.world);
        this.input = new InputHandler(this.canvas, this.world);
        this.ui = new UI(this.world);
        
        // Simulation state
        this.isPaused = false;
        this.speed = 1.0;
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        // Setup controls
        this.setupControls();
        
        // Start simulation
        this.world.spawnInitialEntities();
        this.start();
    }
    
    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        if (this.world) {
            this.world.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    setupControls() {
        // Pause button
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            document.getElementById('pause-btn').textContent = 
                this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        });
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.world.reset();
            this.world.spawnInitialEntities();
        });
        
        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = `${this.speed.toFixed(1)}x`;
        });
        
        // Zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        zoomSlider.addEventListener('input', (e) => {
            const zoom = parseFloat(e.target.value);
            this.renderer.setZoom(zoom);
            document.getElementById('zoom-value').textContent = `${zoom.toFixed(1)}x`;
        });
    }
    
    start() {
        requestAnimationFrame((time) => this.loop(time));
    }
    
    loop(currentTime) {
        requestAnimationFrame((time) => this.loop(time));
        
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.frameCount++;
        this.fpsTime += deltaTime;
        if (this.fpsTime >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        // Update simulation
        if (!this.isPaused) {
            const adjustedDelta = Math.min(deltaTime * this.speed, 0.1); // Cap at 100ms
            this.world.update(adjustedDelta);
        }
        
        // Render
        this.renderer.render();
        
        // Update UI
        this.ui.update(this.fps);
    }
}

// Start the simulation when DOM is ready
new EcosystemSimulation();
