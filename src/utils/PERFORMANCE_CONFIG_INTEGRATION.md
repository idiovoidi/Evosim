# Performance Configuration Integration Guide

## Overview

This guide shows how to integrate the `PerformanceConfig.js` system into the existing ecosystem simulation codebase.

## Current State

The simulation currently uses hardcoded values in various places:
- `World.js`: QuadTree parameters (10, 5), rebuild interval (5.0)
- `EntityPool.js`: Initial pool sizes, expansion factor (1.25)
- `Renderer.js`: Culling margin (50), LOD distance (500)
- `AdaptiveQualityManager.js`: FPS thresholds, hysteresis delays

## Integration Steps

### Step 1: Update World.js Constructor

**Before:**
```javascript
constructor(width, height) {
    // ...
    this.quadTree = new QuadTree(
        { x: 0, y: 0, width, height },
        10,  // maxEntities per node
        5    // maxDepth
    );
    // ...
    this.rebuildInterval = 5.0; // Rebuild every 5 seconds
}
```

**After:**
```javascript
import { QUADTREE_CONFIG } from '../utils/PerformanceConfig.js';

constructor(width, height) {
    // ...
    this.quadTree = new QuadTree(
        { x: 0, y: 0, width, height },
        QUADTREE_CONFIG.maxEntitiesPerNode,
        QUADTREE_CONFIG.maxDepth
    );
    // ...
    this.rebuildInterval = QUADTREE_CONFIG.rebuildInterval;
}
```

### Step 2: Update EntityPool.js Constructor

**Before:**
```javascript
constructor(world) {
    // ...
    this.config = {
        initialSize: {
            herbivore: 50,
            predator: 30,
            plant: 100,
            fish: 40,
            bird: 30
        },
        expansionFactor: 1.25
    };
}
```

**After:**
```javascript
import { POOL_CONFIG } from '../utils/PerformanceConfig.js';

constructor(world) {
    // ...
    this.config = {
        initialSize: { ...POOL_CONFIG.initialSize },
        expansionFactor: POOL_CONFIG.expansionFactor
    };
}
```

### Step 3: Update Renderer.js Constructor

**Before:**
```javascript
constructor(ctx, world) {
    // ...
    this.cullingMargin = 50;
    this.lodDistance = 500;
    this.lodEnabled = true;
}
```

**After:**
```javascript
import { RENDERING_CONFIG } from '../utils/PerformanceConfig.js';

constructor(ctx, world) {
    // ...
    this.cullingMargin = RENDERING_CONFIG.cullingMargin;
    this.lodDistance = RENDERING_CONFIG.lodDistance;
    this.lodEnabled = RENDERING_CONFIG.lodEnabled;
}
```

### Step 4: Update AdaptiveQualityManager.js

**Before:**
```javascript
const FPS_THRESHOLDS = {
    HIGH: 50,
    MEDIUM: 30,
    LOW: 20
};

const HYSTERESIS = {
    UPGRADE_DELAY: 5000,
    DOWNGRADE_DELAY: 2000,
    SAMPLE_COUNT: 30
};
```

**After:**
```javascript
import { ADAPTIVE_QUALITY_CONFIG } from './PerformanceConfig.js';

const FPS_THRESHOLDS = ADAPTIVE_QUALITY_CONFIG.fpsThresholds;
const HYSTERESIS = ADAPTIVE_QUALITY_CONFIG.hysteresis;
```

### Step 5: Update main.js for Configuration Loading

**Add at the top of EcosystemSimulation constructor:**

```javascript
import { getDefaultConfig, loadConfig, mergeConfig } from './utils/PerformanceConfig.js';

constructor() {
    // Load configuration
    this.config = this.loadConfiguration();
    
    this.updateLoadingStatus('Setting up canvas...');
    // ... rest of constructor
}

loadConfiguration() {
    // Try to load saved configuration
    let config = loadConfig();
    
    if (!config) {
        // Use defaults if no saved config
        config = getDefaultConfig();
        console.log('📋 Using default performance configuration');
    } else {
        // Merge with defaults to ensure all properties exist
        config = mergeConfig(config);
        console.log('📋 Loaded saved performance configuration');
    }
    
    return config;
}
```

### Step 6: Pass Configuration to Systems

**Update World initialization:**

```javascript
this.world = new World(
    this.canvas.width, 
    this.canvas.height,
    this.config
);
```

**Update World.js constructor to accept config:**

```javascript
constructor(width, height, config = null) {
    this.width = width;
    this.height = height;
    
    // Use provided config or load defaults
    if (!config) {
        const { getDefaultConfig } = await import('../utils/PerformanceConfig.js');
        config = getDefaultConfig();
    }
    
    this.performanceConfig = config;
    
    // Use config values
    this.quadTree = new QuadTree(
        { x: 0, y: 0, width, height },
        config.quadtree.maxEntitiesPerNode,
        config.quadtree.maxDepth
    );
    
    this.rebuildInterval = config.quadtree.rebuildInterval;
    // ... rest of constructor
}
```

## Complete Integration Example

Here's a complete example showing how to integrate the configuration system:

```javascript
// main.js
import { World } from './core/World.js';
import { Renderer } from './graphics/Renderer.js';
import { 
    getDefaultConfig, 
    loadConfig, 
    saveConfig,
    validateConfig 
} from './utils/PerformanceConfig.js';

class EcosystemSimulation {
    constructor() {
        // Load and validate configuration
        this.config = this.initializeConfiguration();
        
        // Initialize systems with configuration
        this.world = new World(
            this.canvas.width, 
            this.canvas.height,
            this.config
        );
        
        this.renderer = new Renderer(this.ctx, this.world);
        this.applyRenderingConfig(this.config.rendering);
        
        // ... rest of initialization
    }
    
    initializeConfiguration() {
        // Try to load saved config
        let config = loadConfig();
        
        if (!config) {
            config = getDefaultConfig();
            console.log('📋 Using default configuration');
        } else {
            console.log('📋 Loaded saved configuration');
        }
        
        // Validate configuration
        const validation = validateConfig(config);
        if (!validation.valid) {
            console.error('❌ Configuration validation failed:', validation.errors);
            console.log('📋 Falling back to defaults');
            config = getDefaultConfig();
        }
        
        return config;
    }
    
    applyRenderingConfig(renderingConfig) {
        this.renderer.setLODDistance(renderingConfig.lodDistance);
        this.renderer.setLODEnabled(renderingConfig.lodEnabled);
        this.renderer.cullingMargin = renderingConfig.cullingMargin;
        this.renderer.batchingEnabled = renderingConfig.batchingEnabled;
    }
    
    updateConfiguration(newConfig) {
        // Validate new configuration
        const validation = validateConfig(newConfig);
        if (!validation.valid) {
            console.error('❌ Invalid configuration:', validation.errors);
            return false;
        }
        
        // Apply new configuration
        this.config = newConfig;
        
        // Update systems
        this.applyRenderingConfig(newConfig.rendering);
        
        // Update quality manager
        if (this.world.adaptiveQualityManager) {
            this.world.adaptiveQualityManager.setQualityLevel(
                newConfig.quality.presets.HIGH.name
            );
        }
        
        // Save configuration
        saveConfig(newConfig);
        console.log('✅ Configuration updated and saved');
        
        return true;
    }
}
```

## Settings UI Integration

To allow users to modify configuration through the UI:

```javascript
// ui/SettingsPanel.js
import { 
    QUALITY_PRESETS,
    saveConfig 
} from '../utils/PerformanceConfig.js';

class SettingsPanel {
    constructor(simulation) {
        this.simulation = simulation;
        this.setupUI();
    }
    
    setupUI() {
        // Quality preset buttons
        document.getElementById('quality-high').addEventListener('click', () => {
            this.setQualityPreset('HIGH');
        });
        
        document.getElementById('quality-medium').addEventListener('click', () => {
            this.setQualityPreset('MEDIUM');
        });
        
        document.getElementById('quality-low').addEventListener('click', () => {
            this.setQualityPreset('LOW');
        });
        
        // Individual settings sliders
        this.setupSlider('lod-distance', 'rendering.lodDistance', 100, 1000);
        this.setupSlider('culling-margin', 'rendering.cullingMargin', 0, 200);
    }
    
    setQualityPreset(preset) {
        const config = this.simulation.config;
        const presetConfig = QUALITY_PRESETS[preset];
        
        // Apply preset to rendering config
        config.rendering.lodDistance = presetConfig.lodDistance;
        config.rendering.cullingMargin = presetConfig.cullingMargin;
        config.rendering.lodEnabled = presetConfig.lodEnabled;
        
        // Update simulation
        this.simulation.updateConfiguration(config);
        
        // Update UI
        this.updateUIFromConfig();
    }
    
    setupSlider(elementId, configPath, min, max) {
        const slider = document.getElementById(elementId);
        
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            
            // Update config using path (e.g., 'rendering.lodDistance')
            const parts = configPath.split('.');
            let obj = this.simulation.config;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
            
            // Apply and save
            this.simulation.updateConfiguration(this.simulation.config);
        });
    }
}
```

## Benefits of Integration

1. **Centralized Configuration**: All settings in one place
2. **Easy Tuning**: Change values without hunting through code
3. **Persistence**: Settings saved automatically
4. **Validation**: Prevents invalid configurations
5. **Presets**: Quick switching between quality levels
6. **Extensibility**: Easy to add new configuration options

## Migration Checklist

- [ ] Update World.js to use QUADTREE_CONFIG
- [ ] Update EntityPool.js to use POOL_CONFIG
- [ ] Update Renderer.js to use RENDERING_CONFIG
- [ ] Update AdaptiveQualityManager.js to use ADAPTIVE_QUALITY_CONFIG
- [ ] Update main.js to load and apply configuration
- [ ] Add configuration validation on startup
- [ ] Create settings UI for user configuration
- [ ] Test configuration persistence
- [ ] Document custom configuration options
- [ ] Add configuration export/import feature

## Testing

After integration, test the following:

1. **Default Configuration**: Start with no saved config
2. **Saved Configuration**: Verify settings persist across sessions
3. **Invalid Configuration**: Test validation catches errors
4. **Quality Presets**: Switch between HIGH/MEDIUM/LOW
5. **Custom Settings**: Modify individual parameters
6. **Performance Impact**: Verify settings affect performance as expected

## Future Enhancements

- In-game settings UI with real-time preview
- Configuration profiles for different hardware
- Export/import configuration as JSON
- Configuration presets for specific scenarios
- Hot-reloading of configuration changes
- Configuration versioning and migration
