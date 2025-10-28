/**
 * PerformanceConfig - Centralized configuration for all performance-related settings
 * 
 * This module provides tunable parameters for:
 * - Spatial partitioning (QuadTree)
 * - Entity pooling
 * - Rendering optimizations
 * - Quality presets and adaptive settings
 * - Visual effects
 * 
 * Requirements: 15.1, 15.2
 */

/**
 * QuadTree spatial partitioning configuration
 */
export const QUADTREE_CONFIG = {
    // Maximum entities per node before subdivision
    maxEntitiesPerNode: 10,
    
    // Maximum tree depth to prevent excessive recursion
    maxDepth: 5,
    
    // Interval (in seconds) between automatic tree rebuilds for rebalancing
    rebuildInterval: 5.0,
    
    // Enable automatic rebuilding
    autoRebuild: true
};

/**
 * Entity pool configuration
 */
export const POOL_CONFIG = {
    // Initial pool sizes for each species type
    initialSize: {
        herbivore: 50,
        predator: 30,
        plant: 100,
        fish: 40,
        bird: 30
    },
    
    // Factor by which to expand pools when depleted (1.25 = 25% increase)
    expansionFactor: 1.25,
    
    // Warn if pool expansion happens more frequently than this (in seconds)
    expansionWarningThreshold: 10.0,
    
    // Enable pool statistics tracking
    trackStatistics: true
};

/**
 * Rendering optimization configuration
 */
export const RENDERING_CONFIG = {
    // Viewport culling margin (pixels) - render entities slightly off-screen
    cullingMargin: 50,
    
    // Level of Detail (LOD) distance threshold (pixels)
    // Entities beyond this distance are rendered as simple shapes
    lodDistance: 500,
    
    // Enable LOD system
    lodEnabled: false,
    
    // Enable render batching (group similar entities to reduce draw calls)
    batchingEnabled: true,
    
    // Maximum trail length for motion trails
    maxTrailLength: 10,
    
    // Minimum velocity to show motion trails
    minTrailVelocity: 2.0,
    
    // Indicator fade time (seconds)
    indicatorFadeTime: 1.0,
    
    // Indicator offset above entity (pixels)
    indicatorOffset: -25,
    
    // Enable dirty rectangle optimization (not yet implemented)
    dirtyRectEnabled: false,
    
    // Maximum dirty rectangles before falling back to full redraw
    maxDirtyRects: 10
};

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
        shadows: false,
        detailedTerrain: true,
        maxEntitiesRendered: 1000,
        lodEnabled: false,
        lodDistance: 500,
        cullingMargin: 50,
        batchingEnabled: true,
        heatmapEnabled: true,
        debugOverlaysEnabled: true
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
        cullingMargin: 30,
        batchingEnabled: true,
        heatmapEnabled: true,
        debugOverlaysEnabled: true
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
        cullingMargin: 20,
        batchingEnabled: true,
        heatmapEnabled: false,
        debugOverlaysEnabled: false
    }
};

/**
 * Adaptive quality management configuration
 */
export const ADAPTIVE_QUALITY_CONFIG = {
    // FPS thresholds for quality level switching
    fpsThresholds: {
        high: 50,      // Switch to HIGH when FPS > 50
        medium: 30,    // Switch to MEDIUM when FPS between 30-50
        low: 20        // Switch to LOW when FPS < 30
    },
    
    // Hysteresis settings to prevent rapid quality changes
    hysteresis: {
        // Wait time (ms) before upgrading quality
        upgradeDelay: 5000,
        
        // Wait time (ms) before downgrading quality
        downgradeDelay: 2000,
        
        // Number of FPS samples to average for stability
        sampleCount: 30
    },
    
    // Granular adjustment thresholds (Requirements 9.2, 9.3, 9.4)
    granularThresholds: {
        // Reduce particle effects when FPS drops below this
        particleReduction: 45,
        
        // Disable visual indicators when FPS drops below this
        indicatorDisable: 30,
        
        // Reduce entity update frequency when FPS drops below this
        updateReduction: 20,
        
        // Restore thresholds (with buffer to prevent oscillation)
        particleRestore: 50,
        indicatorRestore: 35,
        updateRestore: 25
    },
    
    // Enable automatic quality adjustment
    autoAdjustEnabled: true,
    
    // Enable notifications when quality changes
    notificationsEnabled: true
};

/**
 * Visual indicator configuration
 */
export const VISUAL_INDICATOR_CONFIG = {
    // State indicators (emoji, color, offset)
    indicators: {
        hungry: {
            icon: '🍖',
            color: '#FFA500',
            offset: -25,
            energyThreshold: 0.3  // Show when energy < 30%
        },
        fleeing: {
            icon: '😰',
            color: '#FF0000',
            offset: -25
        },
        hunting: {
            icon: '🎯',
            color: '#FF4444',
            offset: -25
        },
        eating: {
            icon: '🍽️',
            color: '#00FF00',
            offset: -25
        },
        reproducing: {
            icon: '💕',
            color: '#FF69B4',
            offset: -30
        }
    },
    
    // Relationship visualization
    relationships: {
        predatorPrey: {
            color: '#FF0000',
            dash: [5, 5],
            width: 1,
            alpha: 0.6
        },
        dangerRadius: {
            color: '#FFFF00',
            alpha: 0.1,
            width: 1
        },
        senseRange: {
            color: '#00FF00',
            alpha: 0.2,
            width: 1
        }
    },
    
    // Motion trails
    trails: {
        maxLength: 10,
        fadeRate: 0.1,
        minVelocity: 2.0,
        lineWidth: 2,
        alpha: 0.5
    },
    
    // Enable/disable individual features
    enabled: {
        stateIndicators: true,
        relationshipLines: true,
        motionTrails: true,
        dangerZones: true
    }
};

/**
 * Performance monitoring configuration
 */
export const PERFORMANCE_MONITOR_CONFIG = {
    // Number of frames to average for FPS calculation
    fpsAveragingFrames: 60,
    
    // FPS color coding thresholds
    fpsColorThresholds: {
        good: 50,      // Green
        warning: 30,   // Yellow
        critical: 20   // Red
    },
    
    // Enable detailed timing breakdown
    detailedTiming: true,
    
    // Enable memory tracking (if available)
    memoryTracking: true,
    
    // Update interval for performance display (ms)
    displayUpdateInterval: 100,
    
    // Position of performance overlay
    overlayPosition: {
        x: 10,
        y: 10,
        align: 'top-right'
    },
    
    // Enable performance graph
    graphEnabled: false,  // Not yet implemented
    
    // Graph configuration
    graph: {
        width: 200,
        height: 60,
        samples: 60,
        position: { x: 10, y: 80 }
    }
};

/**
 * Heatmap renderer configuration
 */
export const HEATMAP_CONFIG = {
    // Grid cell size (pixels)
    gridSize: 50,
    
    // Update interval (seconds)
    updateInterval: 1.0,
    
    // Species colors (RGB arrays)
    colors: {
        herbivore: [100, 200, 100],
        predator: [200, 100, 100],
        plant: [100, 255, 100],
        fish: [100, 150, 255],
        bird: [200, 200, 100],
        combined: [255, 100, 100]  // For all species combined
    },
    
    // Maximum alpha for heatmap overlay
    maxAlpha: 0.5,
    
    // Minimum density to show (entities per cell)
    minDensity: 1,
    
    // Enable by default
    enabled: false,
    
    // Default species filter ('all' or specific species)
    defaultSpecies: 'all'
};

/**
 * Debug renderer configuration
 */
export const DEBUG_CONFIG = {
    // Enable debug mode by default
    enabled: false,
    
    // Debug visualization modes
    modes: {
        quadtree: false,
        collision: false,
        behavior: false,
        velocity: false,
        performance: false
    },
    
    // Quadtree visualization
    quadtree: {
        nodeColor: '#00FF00',
        nodeAlpha: 0.2,
        lineWidth: 1,
        showEntityCount: true
    },
    
    // Collision visualization
    collision: {
        boundaryColor: '#FFFF00',
        senseRangeColor: '#00FFFF',
        lineWidth: 1,
        alpha: 0.3
    },
    
    // Behavior visualization (color by state)
    behavior: {
        colors: {
            idle: '#888888',
            wandering: '#4CAF50',
            hunting: '#FF0000',
            fleeing: '#FFA500',
            eating: '#00FF00',
            reproducing: '#FF69B4'
        }
    },
    
    // Velocity visualization
    velocity: {
        arrowColor: '#00FFFF',
        arrowLength: 50,
        lineWidth: 2,
        minVelocity: 0.1
    },
    
    // Keyboard shortcuts
    shortcuts: {
        toggleDebug: 'KeyD',
        toggleQuadtree: 'KeyQ',
        toggleCollision: 'KeyC',
        toggleBehavior: 'KeyB',
        toggleVelocity: 'KeyV',
        togglePerformance: 'KeyP'
    }
};

/**
 * Notification system configuration
 */
export const NOTIFICATION_CONFIG = {
    // Notification duration (ms)
    duration: 5000,
    
    // Maximum notifications to show at once
    maxVisible: 5,
    
    // Notification position
    position: {
        x: 20,
        y: 100,
        spacing: 70
    },
    
    // Notification types and styling
    types: {
        extinction: {
            color: '#FF0000',
            icon: '💀',
            priority: 3
        },
        milestone: {
            color: '#FFD700',
            icon: '🎉',
            priority: 2
        },
        warning: {
            color: '#FFA500',
            icon: '⚠️',
            priority: 1
        },
        info: {
            color: '#2196F3',
            icon: 'ℹ️',
            priority: 0
        },
        quality: {
            color: '#9C27B0',
            icon: '⚙️',
            priority: 1
        }
    },
    
    // Enable sound effects (not yet implemented)
    soundEnabled: false,
    
    // Enable notifications by default
    enabled: true
};

/**
 * Entity update optimization configuration
 */
export const UPDATE_CONFIG = {
    // Fixed timestep for consistent physics (seconds)
    fixedTimestep: 0.016,  // 60 FPS
    
    // Maximum accumulated time before skipping updates
    maxAccumulatedTime: 0.1,
    
    // Distance threshold for reduced update frequency (pixels)
    distantEntityThreshold: 1000,
    
    // Update frequency reduction for distant entities
    distantUpdateInterval: 3,  // Update every 3rd frame
    
    // Maximum update time per frame (ms) to maintain FPS
    maxUpdateTimePerFrame: 10,
    
    // Enable update frequency reduction
    adaptiveUpdateEnabled: true,
    
    // Skip counter for reduced update frequency
    updateSkipInterval: 2  // Update every 2nd frame when FPS < 20
};

/**
 * Ecosystem event detection configuration
 */
export const EVENT_DETECTION_CONFIG = {
    // Population thresholds for milestone notifications
    milestones: [100, 250, 500, 750, 1000],
    
    // Imbalance detection thresholds
    imbalance: {
        // Ratio of predators to herbivores that triggers warning
        predatorHerbivoreRatio: 0.8,
        
        // Minimum population before checking imbalance
        minPopulation: 50
    },
    
    // Check interval (seconds)
    checkInterval: 5.0,
    
    // Enable event detection
    enabled: true
};

/**
 * Get default configuration object with all settings
 * @returns {Object} Complete configuration object
 */
export function getDefaultConfig() {
    return {
        quadtree: { ...QUADTREE_CONFIG },
        pool: { ...POOL_CONFIG },
        rendering: { ...RENDERING_CONFIG },
        quality: {
            presets: {
                HIGH: { ...QUALITY_PRESETS.HIGH },
                MEDIUM: { ...QUALITY_PRESETS.MEDIUM },
                LOW: { ...QUALITY_PRESETS.LOW }
            },
            adaptive: { ...ADAPTIVE_QUALITY_CONFIG }
        },
        visualIndicators: { ...VISUAL_INDICATOR_CONFIG },
        performanceMonitor: { ...PERFORMANCE_MONITOR_CONFIG },
        heatmap: { ...HEATMAP_CONFIG },
        debug: { ...DEBUG_CONFIG },
        notifications: { ...NOTIFICATION_CONFIG },
        update: { ...UPDATE_CONFIG },
        eventDetection: { ...EVENT_DETECTION_CONFIG }
    };
}

/**
 * Merge user configuration with defaults
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} Merged configuration
 */
export function mergeConfig(userConfig) {
    const defaultConfig = getDefaultConfig();
    
    // Deep merge helper
    function deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    return deepMerge(defaultConfig, userConfig);
}

/**
 * Validate configuration values
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateConfig(config) {
    const errors = [];
    
    // Validate quadtree config
    if (config.quadtree) {
        if (config.quadtree.maxEntitiesPerNode < 1) {
            errors.push('quadtree.maxEntitiesPerNode must be >= 1');
        }
        if (config.quadtree.maxDepth < 1 || config.quadtree.maxDepth > 10) {
            errors.push('quadtree.maxDepth must be between 1 and 10');
        }
    }
    
    // Validate pool config
    if (config.pool) {
        if (config.pool.expansionFactor <= 1.0) {
            errors.push('pool.expansionFactor must be > 1.0');
        }
    }
    
    // Validate rendering config
    if (config.rendering) {
        if (config.rendering.cullingMargin < 0) {
            errors.push('rendering.cullingMargin must be >= 0');
        }
        if (config.rendering.lodDistance < 0) {
            errors.push('rendering.lodDistance must be >= 0');
        }
    }
    
    // Validate adaptive quality config
    if (config.quality?.adaptive) {
        const thresholds = config.quality.adaptive.fpsThresholds;
        if (thresholds && thresholds.low >= thresholds.medium) {
            errors.push('quality.adaptive.fpsThresholds.low must be < medium');
        }
        if (thresholds && thresholds.medium >= thresholds.high) {
            errors.push('quality.adaptive.fpsThresholds.medium must be < high');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Save configuration to localStorage
 * @param {Object} config - Configuration to save
 * @param {string} key - Storage key (default: 'ecosystemPerformanceConfig')
 */
export function saveConfig(config, key = 'ecosystemPerformanceConfig') {
    try {
        localStorage.setItem(key, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('[PerformanceConfig] Failed to save config:', error);
        return false;
    }
}

/**
 * Load configuration from localStorage
 * @param {string} key - Storage key (default: 'ecosystemPerformanceConfig')
 * @returns {Object|null} Loaded configuration or null if not found
 */
export function loadConfig(key = 'ecosystemPerformanceConfig') {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('[PerformanceConfig] Failed to load config:', error);
    }
    return null;
}

/**
 * Reset configuration to defaults
 * @param {string} key - Storage key (default: 'ecosystemPerformanceConfig')
 */
export function resetConfig(key = 'ecosystemPerformanceConfig') {
    try {
        localStorage.removeItem(key);
        return getDefaultConfig();
    } catch (error) {
        console.error('[PerformanceConfig] Failed to reset config:', error);
        return getDefaultConfig();
    }
}

// Export all configuration objects
export default {
    QUADTREE_CONFIG,
    POOL_CONFIG,
    RENDERING_CONFIG,
    QUALITY_PRESETS,
    ADAPTIVE_QUALITY_CONFIG,
    VISUAL_INDICATOR_CONFIG,
    PERFORMANCE_MONITOR_CONFIG,
    HEATMAP_CONFIG,
    DEBUG_CONFIG,
    NOTIFICATION_CONFIG,
    UPDATE_CONFIG,
    EVENT_DETECTION_CONFIG,
    getDefaultConfig,
    mergeConfig,
    validateConfig,
    saveConfig,
    loadConfig,
    resetConfig
};
