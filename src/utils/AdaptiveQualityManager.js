/**
 * AdaptiveQualityManager - Automatically adjusts visual quality based on performance
 * 
 * Monitors FPS and dynamically reduces or restores quality settings to maintain
 * smooth performance. Implements hysteresis to prevent rapid quality changes.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

/**
 * Quality preset definitions
 * Each preset defines which visual features are enabled at that quality level
 */
export const QUALITY_PRESETS = {
    HIGH: {
        name: 'HIGH',
        particles: true,
        indicators: true,
        trails: true,
        shadows: false, // Not yet implemented
        detailedTerrain: true,
        maxEntitiesRendered: 1000,
        lodEnabled: false,
        lodDistance: 500,
        cullingMargin: 50
    },
    MEDIUM: {
        name: 'MEDIUM',
        particles: true,
        indicators: true,
        trails: false,
        shadows: false,
        detailedTerrain: true,
        maxEntitiesRendered: 500,
        lodEnabled: false,
        lodDistance: 400,
        cullingMargin: 30
    },
    LOW: {
        name: 'LOW',
        particles: false,
        indicators: false,
        trails: false,
        shadows: false,
        detailedTerrain: false,
        maxEntitiesRendered: 300,
        lodEnabled: false,
        lodDistance: 300,
        cullingMargin: 20
    }
};

/**
 * FPS thresholds for quality level switching
 */
const FPS_THRESHOLDS = {
    HIGH: 50,      // Switch to HIGH when FPS > 50
    MEDIUM: 30,    // Switch to MEDIUM when FPS < 45 or > 30
    LOW: 20        // Switch to LOW when FPS < 30
};

/**
 * Hysteresis settings to prevent rapid quality changes
 */
const HYSTERESIS = {
    UPGRADE_DELAY: 5000,    // Wait 5 seconds before upgrading quality
    DOWNGRADE_DELAY: 2000,  // Wait 2 seconds before downgrading quality
    SAMPLE_COUNT: 30        // Number of FPS samples to average
};

export class AdaptiveQualityManager {
    /**
     * Create an AdaptiveQualityManager
     * @param {World} world - World instance
     * @param {Renderer} renderer - Renderer instance
     */
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        
        // Current quality level
        this.currentQuality = QUALITY_PRESETS.HIGH;
        this.currentQualityName = 'HIGH';
        
        // Manual override flag
        this.manualOverride = false;
        
        // FPS tracking for hysteresis
        this.fpsHistory = new Array(HYSTERESIS.SAMPLE_COUNT).fill(60);
        this.fpsIndex = 0;
        
        // Timing for quality changes
        this.lastQualityChange = 0;
        this.pendingQualityChange = null;
        this.pendingQualityChangeTime = 0;
        
        // Notification callback (optional)
        this.onQualityChange = null;
        
        // Apply initial quality settings
        this.applyQualitySettings();
    }
    
    /**
     * Update quality based on current FPS
     * Called each frame from the main loop
     * @param {number} fps - Current frames per second
     */
    update(fps) {
        // Skip if manual override is active
        if (this.manualOverride) {
            return;
        }
        
        // Update FPS history for averaging
        this.fpsHistory[this.fpsIndex] = fps;
        this.fpsIndex = (this.fpsIndex + 1) % this.fpsHistory.length;
        
        // Calculate average FPS
        const avgFps = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;
        
        // Determine target quality level based on FPS
        const targetQuality = this.determineTargetQuality(avgFps);
        
        // Check if we need to change quality
        if (targetQuality !== this.currentQualityName) {
            this.handleQualityChange(targetQuality);
        } else {
            // Cancel pending change if FPS recovered
            this.pendingQualityChange = null;
        }
        
        // Apply granular quality adjustments based on FPS thresholds
        this.applyGranularAdjustments(avgFps);
    }
    
    /**
     * Apply granular quality adjustments based on FPS
     * Implements specific requirements for different FPS thresholds
     * @param {number} fps - Average FPS
     */
    applyGranularAdjustments(fps) {
        const settings = this.currentQuality;
        let adjustmentsMade = false;
        
        // Requirement 9.2: Reduce particle effects when FPS < 45
        if (fps < 45 && settings.particles) {
            settings.particles = false;
            adjustmentsMade = true;
            console.log('[AdaptiveQualityManager] Particle effects disabled (FPS < 45)');
        } else if (fps >= 50 && !settings.particles && this.currentQualityName !== 'LOW') {
            // Restore particles when FPS recovers
            settings.particles = true;
            adjustmentsMade = true;
            console.log('[AdaptiveQualityManager] Particle effects restored (FPS >= 50)');
        }
        
        // Requirement 9.3: Disable visual indicators when FPS < 30
        if (fps < 30 && settings.indicators) {
            settings.indicators = false;
            adjustmentsMade = true;
            console.log('[AdaptiveQualityManager] Visual indicators disabled (FPS < 30)');
            
            // Apply to visual indicator system
            if (this.renderer && this.renderer.visualIndicators) {
                this.renderer.visualIndicators.setEnabled(false);
            }
        } else if (fps >= 35 && !settings.indicators && this.currentQualityName !== 'LOW') {
            // Restore indicators when FPS recovers
            settings.indicators = true;
            adjustmentsMade = true;
            console.log('[AdaptiveQualityManager] Visual indicators restored (FPS >= 35)');
            
            // Apply to visual indicator system
            if (this.renderer && this.renderer.visualIndicators) {
                this.renderer.visualIndicators.setEnabled(true);
            }
        }
        
        // Requirement 9.4: Reduce entity update frequency when FPS < 20
        if (fps < 20 && !this.world.reducedUpdateFrequency) {
            this.world.reducedUpdateFrequency = true;
            this.world.updateSkipCounter = 0;
            adjustmentsMade = true;
            console.log('[AdaptiveQualityManager] Entity update frequency reduced (FPS < 20)');
        } else if (fps >= 25 && this.world.reducedUpdateFrequency) {
            // Restore normal update frequency when FPS recovers
            this.world.reducedUpdateFrequency = false;
            adjustmentsMade = true;
            console.log('[AdaptiveQualityManager] Entity update frequency restored (FPS >= 25)');
        }
        
        // If adjustments were made, notify callback
        if (adjustmentsMade && this.onQualityChange) {
            this.onQualityChange(this.currentQualityName, this.currentQualityName, false);
        }
    }
    
    /**
     * Determine target quality level based on FPS
     * @param {number} fps - Average FPS
     * @returns {string} Target quality level name
     */
    determineTargetQuality(fps) {
        // Downgrade thresholds (with some buffer to prevent oscillation)
        if (fps < FPS_THRESHOLDS.LOW) {
            return 'LOW';
        } else if (fps < FPS_THRESHOLDS.MEDIUM) {
            return 'MEDIUM';
        }
        
        // Upgrade thresholds (require higher FPS to upgrade)
        if (fps > FPS_THRESHOLDS.HIGH && this.currentQualityName !== 'HIGH') {
            return 'HIGH';
        } else if (fps > FPS_THRESHOLDS.MEDIUM + 10 && this.currentQualityName === 'LOW') {
            return 'MEDIUM';
        }
        
        // Stay at current quality
        return this.currentQualityName;
    }
    
    /**
     * Handle quality change with hysteresis
     * @param {string} targetQuality - Target quality level name
     */
    handleQualityChange(targetQuality) {
        const now = performance.now();
        const isUpgrade = this.isQualityUpgrade(targetQuality);
        const delay = isUpgrade ? HYSTERESIS.UPGRADE_DELAY : HYSTERESIS.DOWNGRADE_DELAY;
        
        // Check if we already have a pending change to this quality
        if (this.pendingQualityChange === targetQuality) {
            // Check if enough time has passed
            if (now - this.pendingQualityChangeTime >= delay) {
                // Execute the quality change
                this.setQualityLevel(targetQuality);
                this.pendingQualityChange = null;
            }
        } else {
            // Start a new pending change
            this.pendingQualityChange = targetQuality;
            this.pendingQualityChangeTime = now;
        }
    }
    
    /**
     * Check if changing to target quality is an upgrade
     * @param {string} targetQuality - Target quality level name
     * @returns {boolean} True if upgrade, false if downgrade
     */
    isQualityUpgrade(targetQuality) {
        const qualityOrder = ['LOW', 'MEDIUM', 'HIGH'];
        const currentIndex = qualityOrder.indexOf(this.currentQualityName);
        const targetIndex = qualityOrder.indexOf(targetQuality);
        return targetIndex > currentIndex;
    }
    
    /**
     * Set quality level
     * @param {string} level - Quality level name ('HIGH', 'MEDIUM', 'LOW')
     * @param {boolean} manual - Whether this is a manual change (disables auto-adjustment)
     */
    setQualityLevel(level, manual = false) {
        const levelUpper = level.toUpperCase();
        
        if (!QUALITY_PRESETS[levelUpper]) {
            console.error(`[AdaptiveQualityManager] Invalid quality level: ${level}`);
            return;
        }
        
        const previousQuality = this.currentQualityName;
        this.currentQuality = QUALITY_PRESETS[levelUpper];
        this.currentQualityName = levelUpper;
        this.manualOverride = manual;
        this.lastQualityChange = performance.now();
        
        // Apply the new quality settings
        this.applyQualitySettings();
        
        // Log the change
        console.log(`[AdaptiveQualityManager] Quality changed: ${previousQuality} → ${levelUpper}${manual ? ' (manual)' : ''}`);
        
        // Notify callback if set
        if (this.onQualityChange && previousQuality !== levelUpper) {
            this.onQualityChange(levelUpper, previousQuality, manual);
        }
    }
    
    /**
     * Apply current quality settings to renderer and systems
     */
    applyQualitySettings() {
        const settings = this.currentQuality;
        
        // Apply to renderer
        if (this.renderer) {
            // LOD settings
            this.renderer.setLODEnabled(settings.lodEnabled);
            this.renderer.setLODDistance(settings.lodDistance);
            this.renderer.cullingMargin = settings.cullingMargin;
            
            console.log(`[AdaptiveQualityManager] Applied LOD settings: enabled=${settings.lodEnabled}, distance=${settings.lodDistance}`);
            
            // Visual indicator system
            if (this.renderer.visualIndicators) {
                this.renderer.visualIndicators.setEnabled(settings.indicators);
            }
        }
        
        // Store settings for other systems to access
        this.world.qualitySettings = settings;
        
        // Reset reduced update frequency when quality changes
        // It will be re-enabled by applyGranularAdjustments if needed
        this.world.reducedUpdateFrequency = false;
        this.world.updateSkipCounter = 0;
    }
    
    /**
     * Get current quality settings
     * @returns {Object} Current quality preset
     */
    getQualitySettings() {
        return { ...this.currentQuality };
    }
    
    /**
     * Get current quality level name
     * @returns {string} Quality level name
     */
    getQualityLevel() {
        return this.currentQualityName;
    }
    
    /**
     * Enable or disable manual override
     * @param {boolean} enabled - Whether manual override is enabled
     */
    setManualOverride(enabled) {
        this.manualOverride = enabled;
        console.log(`[AdaptiveQualityManager] Manual override ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Check if manual override is active
     * @returns {boolean} True if manual override is active
     */
    isManualOverride() {
        return this.manualOverride;
    }
    
    /**
     * Reset to automatic quality adjustment
     */
    resetToAuto() {
        this.manualOverride = false;
        this.pendingQualityChange = null;
        console.log('[AdaptiveQualityManager] Reset to automatic quality adjustment');
    }
    
    /**
     * Get statistics about quality management
     * @returns {Object} Statistics
     */
    getStats() {
        const avgFps = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;
        
        return {
            currentQuality: this.currentQualityName,
            manualOverride: this.manualOverride,
            averageFps: Math.round(avgFps * 10) / 10,
            pendingChange: this.pendingQualityChange,
            timeSinceLastChange: performance.now() - this.lastQualityChange
        };
    }
}
