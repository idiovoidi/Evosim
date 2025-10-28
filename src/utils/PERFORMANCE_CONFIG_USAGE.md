# Performance Configuration System

## Overview

The `PerformanceConfig.js` module provides centralized configuration for all performance-related settings in the ecosystem simulation. This includes spatial partitioning, entity pooling, rendering optimizations, quality presets, and adaptive quality management.

## Features

- **Centralized Configuration**: All tunable parameters in one place
- **Quality Presets**: Pre-defined HIGH, MEDIUM, and LOW quality settings
- **Adaptive Quality**: Automatic FPS-based quality adjustment settings
- **Validation**: Built-in configuration validation
- **Persistence**: Save/load configuration from localStorage
- **Type Safety**: Well-documented configuration structure

## Usage

### Basic Usage

```javascript
import { getDefaultConfig } from './utils/PerformanceConfig.js';

// Get default configuration
const config = getDefaultConfig();

// Access specific settings
console.log(config.quadtree.maxEntitiesPerNode); // 10
console.log(config.rendering.lodDistance); // 500
console.log(config.quality.presets.HIGH.particles); // true
```

### Custom Configuration

```javascript
import { mergeConfig, validateConfig } from './utils/PerformanceConfig.js';

// Define custom settings
const customConfig = {
    quadtree: {
        maxEntitiesPerNode: 15,
        maxDepth: 6
    },
    rendering: {
        lodDistance: 600,
        cullingMargin: 75
    }
};

// Merge with defaults
const config = mergeConfig(customConfig);

// Validate configuration
const validation = validateConfig(config);
if (!validation.valid) {
    console.error('Invalid configuration:', validation.errors);
}
```

### Using Individual Config Objects

```javascript
import { 
    QUADTREE_CONFIG, 
    RENDERING_CONFIG, 
    QUALITY_PRESETS 
} from './utils/PerformanceConfig.js';

// Use in QuadTree initialization
const quadTree = new QuadTree(
    bounds, 
    QUADTREE_CONFIG.maxEntitiesPerNode, 
    QUADTREE_CONFIG.maxDepth
);

// Use in Renderer
renderer.setLODDistance(RENDERING_CONFIG.lodDistance);
renderer.cullingMargin = RENDERING_CONFIG.cullingMargin;

// Apply quality preset
const highQuality = QUALITY_PRESETS.HIGH;
renderer.setLODEnabled(highQuality.lodEnabled);
```

### Persistence

```javascript
import { saveConfig, loadConfig, resetConfig } from './utils/PerformanceConfig.js';

// Save current configuration
const config = getDefaultConfig();
config.rendering.lodDistance = 700;
saveConfig(config);

// Load saved configuration
const savedConfig = loadConfig();
if (savedConfig) {
    console.log('Loaded config:', savedConfig);
}

// Reset to defaults
const defaultConfig = resetConfig();
```

## Configuration Sections

### 1. QuadTree Configuration (`QUADTREE_CONFIG`)

Controls spatial partitioning behavior:

```javascript
{
    maxEntitiesPerNode: 10,    // Entities before subdivision
    maxDepth: 5,               // Maximum tree depth
    rebuildInterval: 5.0,      // Seconds between rebuilds
    autoRebuild: true          // Enable auto-rebuild
}
```

### 2. Entity Pool Configuration (`POOL_CONFIG`)

Controls object pooling:

```javascript
{
    initialSize: {
        herbivore: 50,
        predator: 30,
        plant: 100,
        fish: 40,
        bird: 30
    },
    expansionFactor: 1.25,     // 25% growth when depleted
    expansionWarningThreshold: 10.0,
    trackStatistics: true
}
```

### 3. Rendering Configuration (`RENDERING_CONFIG`)

Controls rendering optimizations:

```javascript
{
    cullingMargin: 50,         // Pixels to render off-screen
    lodDistance: 500,          // Distance for LOD switch
    lodEnabled: true,
    batchingEnabled: true,
    maxTrailLength: 10,
    minTrailVelocity: 2.0,
    indicatorFadeTime: 1.0,
    indicatorOffset: -25
}
```

### 4. Quality Presets (`QUALITY_PRESETS`)

Pre-defined quality levels (HIGH, MEDIUM, LOW):

```javascript
{
    HIGH: {
        particles: true,
        indicators: true,
        trails: true,
        maxEntitiesRendered: 1000,
        lodDistance: 500,
        // ... more settings
    },
    MEDIUM: { /* ... */ },
    LOW: { /* ... */ }
}
```

### 5. Adaptive Quality Configuration (`ADAPTIVE_QUALITY_CONFIG`)

Controls automatic quality adjustment:

```javascript
{
    fpsThresholds: {
        high: 50,
        medium: 30,
        low: 20
    },
    hysteresis: {
        upgradeDelay: 5000,    // ms before upgrading
        downgradeDelay: 2000,  // ms before downgrading
        sampleCount: 30        // FPS samples to average
    },
    granularThresholds: {
        particleReduction: 45,
        indicatorDisable: 30,
        updateReduction: 20
    }
}
```

### 6. Visual Indicator Configuration (`VISUAL_INDICATOR_CONFIG`)

Controls visual feedback elements:

```javascript
{
    indicators: {
        hungry: { icon: '🍖', color: '#FFA500', offset: -25 },
        fleeing: { icon: '😰', color: '#FF0000', offset: -25 },
        // ... more indicators
    },
    relationships: {
        predatorPrey: { color: '#FF0000', dash: [5, 5] },
        // ... more relationships
    },
    trails: {
        maxLength: 10,
        fadeRate: 0.1,
        minVelocity: 2.0
    }
}
```

### 7. Performance Monitor Configuration (`PERFORMANCE_MONITOR_CONFIG`)

Controls performance display:

```javascript
{
    fpsAveragingFrames: 60,
    fpsColorThresholds: {
        good: 50,
        warning: 30,
        critical: 20
    },
    detailedTiming: true,
    memoryTracking: true,
    displayUpdateInterval: 100
}
```

### 8. Heatmap Configuration (`HEATMAP_CONFIG`)

Controls population density heatmap:

```javascript
{
    gridSize: 50,
    updateInterval: 1.0,
    colors: {
        herbivore: [100, 200, 100],
        predator: [200, 100, 100],
        // ... more species
    },
    maxAlpha: 0.5,
    enabled: false
}
```

### 9. Debug Configuration (`DEBUG_CONFIG`)

Controls debug visualizations:

```javascript
{
    enabled: false,
    modes: {
        quadtree: false,
        collision: false,
        behavior: false,
        velocity: false
    },
    shortcuts: {
        toggleDebug: 'KeyD',
        toggleQuadtree: 'KeyQ',
        // ... more shortcuts
    }
}
```

### 10. Notification Configuration (`NOTIFICATION_CONFIG`)

Controls event notifications:

```javascript
{
    duration: 5000,
    maxVisible: 5,
    types: {
        extinction: { color: '#FF0000', icon: '💀' },
        milestone: { color: '#FFD700', icon: '🎉' },
        // ... more types
    },
    enabled: true
}
```

## Integration Example

Here's how to integrate the configuration system into your main application:

```javascript
import { World } from './core/World.js';
import { Renderer } from './graphics/Renderer.js';
import { 
    getDefaultConfig, 
    loadConfig, 
    mergeConfig,
    validateConfig 
} from './utils/PerformanceConfig.js';

// Load configuration
let config = loadConfig();
if (!config) {
    config = getDefaultConfig();
}

// Validate
const validation = validateConfig(config);
if (!validation.valid) {
    console.error('Configuration errors:', validation.errors);
    config = getDefaultConfig();
}

// Initialize systems with configuration
const world = new World(
    1600, 
    1200,
    config.quadtree.maxEntitiesPerNode,
    config.quadtree.maxDepth
);

const renderer = new Renderer(ctx, world);
renderer.setLODDistance(config.rendering.lodDistance);
renderer.setLODEnabled(config.rendering.lodEnabled);
renderer.cullingMargin = config.rendering.cullingMargin;

// Initialize adaptive quality manager
const qualityManager = new AdaptiveQualityManager(world, renderer);
qualityManager.setQualityLevel(config.quality.presets.HIGH.name);
```

## Best Practices

1. **Load on Startup**: Load saved configuration at application startup
2. **Validate Always**: Always validate configuration before use
3. **Save on Change**: Save configuration when user changes settings
4. **Use Presets**: Start with quality presets and customize as needed
5. **Document Changes**: Comment any custom configuration values
6. **Test Validation**: Test configuration validation with edge cases

## Requirements Satisfied

- **Requirement 15.1**: Configurable performance settings with presets
- **Requirement 15.2**: Individual adjustment of performance parameters
- **Requirement 15.3**: Save preferences to local storage
- **Requirement 15.4**: Validation and error handling
- **Requirement 15.5**: Centralized configuration management

## Future Enhancements

- UI for editing configuration in-app
- Export/import configuration as JSON files
- Configuration profiles for different hardware
- Real-time configuration hot-reloading
- Configuration presets for specific scenarios (low-end, high-end, mobile)
