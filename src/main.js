import { World } from './core/World.js';
import { Renderer } from './graphics/Renderer.js';
import { InputHandler } from './core/InputHandler.js';
import { UI } from './ui/UI.js';
import { Tutorial } from './ui/Tutorial.js';
import { AdaptiveQualityManager } from './utils/AdaptiveQualityManager.js';
import { EcosystemEventDetector } from './systems/EcosystemEventDetector.js';

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
        
        // Initialize adaptive quality manager after world and renderer are created
        this.world.adaptiveQualityManager = new AdaptiveQualityManager(this.world, this.renderer);
        console.log('✅ AdaptiveQualityManager initialized');
        console.log('   - Press Q to cycle quality levels manually');
        console.log('   - Press A to toggle automatic quality adjustment');
        
        // Set up quality change notification
        this.world.adaptiveQualityManager.onQualityChange = (newQuality, oldQuality, manual) => {
            console.log(`🎨 Quality ${manual ? 'manually' : 'automatically'} adjusted: ${oldQuality} → ${newQuality}`);
            
            // Show notification to user
            if (this.ui && this.ui.notificationManager) {
                this.ui.notificationManager.notifyQualityChange(newQuality, oldQuality, manual);
            }
        };
        
        // Initialize ecosystem event detector after UI is created
        this.world.ecosystemEventDetector = new EcosystemEventDetector(this.world, this.ui.notificationManager);
        console.log('✅ EcosystemEventDetector initialized');
        console.log('   - Monitoring for extinctions, milestones, and ecosystem imbalances');
        
        // Simulation state
        this.isPaused = false;
        this.speed = 1.0;
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        // Performance monitoring for batching
        this.batchingLogInterval = 5.0; // Log every 5 seconds
        this.batchingLogTimer = 0;
        
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
        
        // Initialize UI button states
        this.updateHeatmapButton();
        this.updateHeatmapSpeciesButtons();
        
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
        
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
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
        
        // Quality control buttons
        document.getElementById('quality-low').addEventListener('click', () => {
            this.setQualityLevel('LOW');
        });
        
        document.getElementById('quality-medium').addEventListener('click', () => {
            this.setQualityLevel('MEDIUM');
        });
        
        document.getElementById('quality-high').addEventListener('click', () => {
            this.setQualityLevel('HIGH');
        });
        
        document.getElementById('quality-auto').addEventListener('click', () => {
            this.toggleAutoQuality();
        });
        
        // Heatmap controls
        document.getElementById('heatmap-toggle').addEventListener('click', () => {
            this.toggleHeatmap();
        });
        
        document.getElementById('heatmap-all').addEventListener('click', () => {
            this.setHeatmapSpecies('all');
        });
        
        document.getElementById('heatmap-herbivore').addEventListener('click', () => {
            this.setHeatmapSpecies('herbivore');
        });
        
        document.getElementById('heatmap-predator').addEventListener('click', () => {
            this.setHeatmapSpecies('predator');
        });
        
        document.getElementById('heatmap-plant').addEventListener('click', () => {
            this.setHeatmapSpecies('plant');
        });
        
        document.getElementById('heatmap-fish').addEventListener('click', () => {
            this.setHeatmapSpecies('fish');
        });
        
        document.getElementById('heatmap-bird').addEventListener('click', () => {
            this.setHeatmapSpecies('bird');
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'p':
                    e.preventDefault();
                    // Toggle detailed performance view
                    this.renderer.showDetailedPerformance = !this.renderer.showDetailedPerformance;
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
                    if (e.shiftKey) {
                        // Shift+H: Cycle through heatmap species
                        this.cycleHeatmapSpecies();
                    } else {
                        // H: Toggle heatmap
                        this.toggleHeatmap();
                    }
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
                case 'q':
                    e.preventDefault();
                    // Cycle through quality levels manually
                    this.cycleQualityLevel();
                    break;
                case 'a':
                    e.preventDefault();
                    // Toggle automatic quality adjustment
                    if (this.world.adaptiveQualityManager) {
                        if (this.world.adaptiveQualityManager.isManualOverride()) {
                            this.world.adaptiveQualityManager.resetToAuto();
                            console.log('🎨 Automatic quality adjustment enabled');
                        } else {
                            this.world.adaptiveQualityManager.setManualOverride(true);
                            console.log('🎨 Automatic quality adjustment disabled');
                        }
                    }
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
    
    cycleQualityLevel() {
        if (!this.world.adaptiveQualityManager) return;
        
        const qualityOrder = ['LOW', 'MEDIUM', 'HIGH'];
        const currentQuality = this.world.adaptiveQualityManager.getQualityLevel();
        const currentIndex = qualityOrder.indexOf(currentQuality);
        const nextIndex = (currentIndex + 1) % qualityOrder.length;
        const nextQuality = qualityOrder[nextIndex];
        
        this.world.adaptiveQualityManager.setQualityLevel(nextQuality, true);
        console.log(`🎨 Quality manually set to: ${nextQuality}`);
    }
    
    setQualityLevel(level) {
        if (!this.world.adaptiveQualityManager) return;
        
        this.world.adaptiveQualityManager.setQualityLevel(level, true);
        console.log(`🎨 Quality manually set to: ${level}`);
    }
    
    toggleAutoQuality() {
        if (!this.world.adaptiveQualityManager) return;
        
        if (this.world.adaptiveQualityManager.isManualOverride()) {
            this.world.adaptiveQualityManager.resetToAuto();
            console.log('🎨 Automatic quality adjustment enabled');
        } else {
            this.world.adaptiveQualityManager.setManualOverride(true);
            console.log('🎨 Automatic quality adjustment disabled');
        }
    }
    
    toggleHeatmap() {
        if (!this.renderer.heatmapRenderer) return;
        
        const isEnabled = this.renderer.heatmapRenderer.isEnabled();
        this.renderer.heatmapRenderer.setEnabled(!isEnabled);
        
        console.log(`🗺️ Heatmap ${!isEnabled ? 'enabled' : 'disabled'}`);
        
        // Update UI button state
        this.updateHeatmapButton();
    }
    
    cycleHeatmapSpecies() {
        if (!this.renderer.heatmapRenderer || !this.renderer.heatmapRenderer.isEnabled()) return;
        
        const speciesOrder = ['all', 'herbivore', 'predator', 'plant', 'fish', 'bird'];
        const currentSpecies = this.renderer.heatmapRenderer.getSpecies();
        const currentIndex = speciesOrder.indexOf(currentSpecies);
        const nextIndex = (currentIndex + 1) % speciesOrder.length;
        const nextSpecies = speciesOrder[nextIndex];
        
        this.renderer.heatmapRenderer.setSpecies(nextSpecies);
        
        const displayName = nextSpecies === 'all' ? 'All Species' : 
            nextSpecies.charAt(0).toUpperCase() + nextSpecies.slice(1);
        console.log(`🗺️ Heatmap species: ${displayName}`);
        
        // Update UI button state
        this.updateHeatmapSpeciesButtons();
    }
    
    setHeatmapSpecies(species) {
        if (!this.renderer.heatmapRenderer) return;
        
        this.renderer.heatmapRenderer.setSpecies(species);
        
        const displayName = species === 'all' ? 'All Species' : 
            species.charAt(0).toUpperCase() + species.slice(1);
        console.log(`🗺️ Heatmap species: ${displayName}`);
        
        // Update UI button state
        this.updateHeatmapSpeciesButtons();
    }
    
    updateHeatmapButton() {
        const heatmapBtn = document.getElementById('heatmap-toggle');
        if (!heatmapBtn || !this.renderer.heatmapRenderer) return;
        
        const isEnabled = this.renderer.heatmapRenderer.isEnabled();
        if (isEnabled) {
            heatmapBtn.style.background = '#4caf50';
            heatmapBtn.textContent = '🗺️ Heatmap: ON';
        } else {
            heatmapBtn.style.background = '#666';
            heatmapBtn.textContent = '🗺️ Heatmap: OFF';
        }
        
        // Show/hide species filter buttons
        const speciesControls = document.getElementById('heatmap-species-controls');
        if (speciesControls) {
            speciesControls.style.display = isEnabled ? 'block' : 'none';
        }
    }
    
    updateHeatmapSpeciesButtons() {
        if (!this.renderer.heatmapRenderer) return;
        
        const currentSpecies = this.renderer.heatmapRenderer.getSpecies();
        
        const buttons = {
            'all': document.getElementById('heatmap-all'),
            'herbivore': document.getElementById('heatmap-herbivore'),
            'predator': document.getElementById('heatmap-predator'),
            'plant': document.getElementById('heatmap-plant'),
            'fish': document.getElementById('heatmap-fish'),
            'bird': document.getElementById('heatmap-bird')
        };
        
        for (const [species, button] of Object.entries(buttons)) {
            if (button) {
                if (species === currentSpecies) {
                    button.style.background = '#4caf50';
                    button.style.fontWeight = 'bold';
                } else {
                    button.style.background = '#666';
                    button.style.fontWeight = 'normal';
                }
            }
        }
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
        
        // Log batching statistics periodically
        this.batchingLogTimer += deltaTime;
        if (this.batchingLogTimer >= this.batchingLogInterval) {
            this.batchingLogTimer = 0;
            const stats = this.renderer.getBatchingStats();
            console.log('🎨 Render Batching Stats:', {
                'Visible Entities': stats.visibleEntities,
                'Draw Calls': stats.drawCalls,
                'Draw Call Reduction': stats.reduction,
                'FPS': this.fps
            });
        }
    }
}

// Start the simulation when DOM is ready
new EcosystemSimulation();
