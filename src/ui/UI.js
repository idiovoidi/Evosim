import { StatsGraph } from './StatsGraph.js';
import { EntityInfoPanel } from './EntityInfoPanel.js';
import { NotificationManager } from './NotificationManager.js';
import { BiomeTooltip } from './BiomeTooltip.js';
import { BiomeLegendPanel } from './BiomeLegendPanel.js';

export class UI {
    constructor(world, renderer = null) {
        this.world = world;
        this.renderer = renderer;
        this.startTime = Date.now();
        
        // Initialize stats graph
        const graphCanvas = document.getElementById('stats-graph');
        if (graphCanvas) {
            this.statsGraph = new StatsGraph(graphCanvas);
        }
        
        // Initialize enhanced entity info panel
        this.entityInfoPanel = new EntityInfoPanel(world);
        
        // Initialize notification manager
        this.notificationManager = new NotificationManager();
        
        // Initialize biome tooltip (will be set up after renderer is available)
        this.biomeTooltip = null;
        
        // Initialize biome legend panel (will be set up after renderer is available)
        this.biomeLegendPanel = null;
    }
    
    /**
     * Set the renderer reference and initialize biome tooltip
     */
    setRenderer(renderer) {
        this.renderer = renderer;
        
        // Initialize biome tooltip now that we have the renderer
        if (this.renderer && !this.biomeTooltip) {
            this.biomeTooltip = new BiomeTooltip(this.world, this.renderer);
        }
        
        // Initialize biome legend panel now that we have the renderer
        if (this.renderer && !this.biomeLegendPanel) {
            this.biomeLegendPanel = new BiomeLegendPanel(this.world, this.renderer);
        }
    }
    
    update(fps, dt = 0.016) {
        const stats = this.world.getStats();
        
        // Update population counts
        document.getElementById('herbivore-count').textContent = stats.herbivores;
        document.getElementById('predator-count').textContent = stats.predators;
        document.getElementById('plant-count').textContent = stats.plants;
        document.getElementById('fish-count').textContent = stats.fish;
        document.getElementById('bird-count').textContent = stats.birds;
        document.getElementById('total-count').textContent = stats.total;
        
        // Update FPS
        document.getElementById('fps').textContent = Math.round(fps);
        
        // Update time elapsed
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('time-elapsed').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update quality level display
        if (this.world.adaptiveQualityManager) {
            const qualityLevel = this.world.adaptiveQualityManager.getQualityLevel();
            const qualityElement = document.getElementById('quality-level');
            if (qualityElement) {
                qualityElement.textContent = qualityLevel;
                
                // Color code based on quality level
                qualityElement.style.color = 
                    qualityLevel === 'HIGH' ? '#4caf50' :
                    qualityLevel === 'MEDIUM' ? '#ff9800' :
                    '#f44336';
            }
            
            // Update quality button states
            this.updateQualityButtons();
        }
        
        // Update stats graph
        if (this.statsGraph) {
            this.statsGraph.update(stats);
            this.statsGraph.render();
        }
        
        // Update selected entity info using enhanced panel
        this.entityInfoPanel.update();
        
        // Update notification manager
        if (this.notificationManager) {
            this.notificationManager.update(dt);
        }
        
        // Update biome tooltip
        if (this.biomeTooltip && this.world.mousePos) {
            this.biomeTooltip.update(dt, this.world.mousePos.x, this.world.mousePos.y);
        }
    }
    
    /**
     * Update quality button states to reflect current quality
     */
    updateQualityButtons() {
        if (!this.world.adaptiveQualityManager) return;
        
        const currentQuality = this.world.adaptiveQualityManager.getQualityLevel();
        const isAuto = !this.world.adaptiveQualityManager.isManualOverride();
        
        // Update quality preset buttons
        const buttons = {
            'LOW': document.getElementById('quality-low'),
            'MEDIUM': document.getElementById('quality-medium'),
            'HIGH': document.getElementById('quality-high')
        };
        
        for (const [quality, button] of Object.entries(buttons)) {
            if (button) {
                if (quality === currentQuality && !isAuto) {
                    button.style.background = '#4caf50';
                } else {
                    button.style.background = '#666';
                }
            }
        }
        
        // Update auto button
        const autoButton = document.getElementById('quality-auto');
        if (autoButton) {
            if (isAuto) {
                autoButton.style.background = '#4caf50';
                autoButton.textContent = '🔄 Auto Quality: ON';
            } else {
                autoButton.style.background = '#666';
                autoButton.textContent = '🔄 Auto Quality: OFF';
            }
        }
    }
    
    /**
     * Get the notification manager instance
     * @returns {NotificationManager} Notification manager
     */
    getNotificationManager() {
        return this.notificationManager;
    }
}
