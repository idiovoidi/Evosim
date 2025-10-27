import { World } from './core/World.js';
import { Renderer } from './graphics/Renderer.js';
import { InputHandler } from './core/InputHandler.js';
import { UI } from './ui/UI.js';
import { Tutorial } from './ui/Tutorial.js';

class EcosystemSimulation {
    constructor() {
        this.updateLoadingStatus('Setting up canvas...');
        
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Setup canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.updateLoadingStatus('Creating world...');
        
        // Initialize systems
        this.world = new World(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.ctx, this.world);
        this.input = new InputHandler(this.canvas, this.world);
        this.ui = new UI(this.world);
        this.tutorial = new Tutorial();
        
        // Simulation state
        this.isPaused = false;
        this.speed = 1.0;
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        this.updateLoadingStatus('Setting up controls...');
        
        // Setup controls
        this.setupControls();
        this.setupKeyboardShortcuts();
        
        this.updateLoadingStatus('Spawning entities...');
        
        // Try to load saved game
        if (this.world.saveSystem.hasSave()) {
            const saveInfo = this.world.saveSystem.getSaveInfo();
            if (saveInfo && confirm(`Load saved game from ${saveInfo.date}?\n${saveInfo.entityCount} entities, ${saveInfo.time}s elapsed`)) {
                this.world.saveSystem.load();
            } else {
                this.world.spawnInitialEntities();
            }
        } else {
            this.world.spawnInitialEntities();
        }
        
        // Start auto-save
        this.world.saveSystem.startAutoSave();
        
        this.updateLoadingStatus('Starting simulation...');
        
        // Start simulation
        this.start();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            
            // Start tutorial after a brief delay
            setTimeout(() => {
                this.tutorial.start();
            }, 500);
        }, 500);
    }
    
    updateLoadingStatus(message) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) statusEl.textContent = message;
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
            this.togglePause();
        });
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Reset simulation? This will clear your current progress.')) {
                this.world.reset();
                this.world.spawnInitialEntities();
                this.ui.statsGraph.clear();
            }
        });
        
        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.world.saveSystem.save();
        });
        
        // Load button
        document.getElementById('load-btn').addEventListener('click', () => {
            if (this.world.saveSystem.hasSave()) {
                if (confirm('Load saved game? Current progress will be lost.')) {
                    this.world.saveSystem.load();
                    this.ui.statsGraph.clear();
                }
            } else {
                alert('No saved game found!');
            }
        });
        
        // Tutorial button
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.tutorial.restart();
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
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                case 'p':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) return; // Don't interfere with browser refresh
                    e.preventDefault();
                    if (confirm('Reset simulation?')) {
                        this.world.reset();
                        this.world.spawnInitialEntities();
                        this.ui.statsGraph.clear();
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.world.saveSystem.save();
                    }
                    break;
                case 'h':
                    e.preventDefault();
                    this.tutorial.restart();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.adjustSpeed(0.5);
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    this.adjustSpeed(-0.5);
                    break;
            }
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = 
            this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
    
    adjustSpeed(delta) {
        this.speed = Math.max(0.1, Math.min(5, this.speed + delta));
        document.getElementById('speed-slider').value = this.speed;
        document.getElementById('speed-value').textContent = `${this.speed.toFixed(1)}x`;
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
