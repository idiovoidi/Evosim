# Biome Diversity System - Design Document

## Overview

The Biome Diversity System enhances the ecosystem simulation by transforming the current basic terrain visualization into a rich, interactive biome system that meaningfully affects gameplay. The system introduces 8+ distinct biomes with unique visual characteristics and gameplay modifiers that influence entity movement, energy consumption, food availability, and survival strategies.

The design integrates seamlessly with the existing Entity-Component-System (ECS) architecture, adding new components and systems while maintaining performance through efficient spatial queries and caching.

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    World System                         │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┬──────────────┬──────────────┐
    │                 │              │              │
┌───▼────────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│  Biome     │  │  Biome   │  │  Entity  │  │ Visual   │
│ Generator  │  │  Effect  │  │ Habitat  │  │ Renderer │
│            │  │  System  │  │  System  │  │          │
└────────────┘  └──────────┘  └──────────┘  └──────────┘
```

### System Integration

The biome system integrates with existing systems:

- **TerrainGenerator** → Enhanced to **BiomeGenerator** with richer biome data
- **MovementSystem** → Modified to apply biome movement modifiers
- **HealthSystem** → Modified to apply biome energy modifiers
- **ReproductionSystem** → Modified to apply biome reproduction bonuses
- **Renderer** → Enhanced with biome visual effects and transitions
- **Entity Components** → New **Habitat** component for biome preferences

## Components and Interfaces

### 1. Biome Data Structure

```javascript
class BiomeType {
    constructor(config) {
        this.id = config.id;                    // 'grassland', 'forest', etc.
        this.name = config.name;                // Display name
        this.color = config.color;              // Base color
        this.secondaryColor = config.secondaryColor; // For gradients/patterns
        
        // Visual properties
        this.pattern = config.pattern;          // 'solid', 'dots', 'stripes', 'noise'
        this.animationSpeed = config.animationSpeed || 0;
        this.particleEffect = config.particleEffect || null;
        
        // Gameplay modifiers
        this.movementModifier = config.movementModifier || 1.0;
        this.energyModifier = config.energyModifier || 1.0;
        this.plantDensity = config.plantDensity || 1.0;
        this.plantGrowthRate = config.plantGrowthRate || 1.0;
        this.visibilityModifier = config.visibilityModifier || 1.0;
        this.concealmentBonus = config.concealmentBonus || 0.0;
        
        // Terrain generation
        this.noiseThreshold = config.noiseThreshold; // [min, max] range
        this.adjacencyRules = config.adjacencyRules || []; // Preferred neighbors
    }
}
```

### 2. Biome Component (Entity)

```javascript
class BiomeComponent {
    constructor() {
        this.currentBiome = null;           // Current biome type ID
        this.biomeEffects = {               // Active modifiers
            movementMultiplier: 1.0,
            energyMultiplier: 1.0,
            visibilityMultiplier: 1.0,
            concealmentBonus: 0.0
        };
        this.timeInBiome = 0;               // Duration in current biome
        this.lastBiomeChange = 0;           // Timestamp of last biome change
    }
}
```

### 3. Habitat Component (Entity)

```javascript
class HabitatComponent {
    constructor(preferences) {
        // Map of biome ID to preference value (0.0 to 2.0)
        // 1.0 = neutral, >1.0 = preferred, <1.0 = avoided
        this.preferences = preferences || {};
        
        // Derived from preferences
        this.preferredBiomes = [];          // List of biome IDs with preference > 1.2
        this.avoidedBiomes = [];            // List of biome IDs with preference < 0.8
    }
    
    getPreference(biomeId) {
        return this.preferences[biomeId] || 1.0;
    }
    
    isPreferred(biomeId) {
        return this.getPreference(biomeId) > 1.2;
    }
    
    isAvoided(biomeId) {
        return this.getPreference(biomeId) < 0.8;
    }
}
```

### 4. BiomeGenerator Class

Enhanced version of TerrainGenerator with richer biome data:

```javascript
class BiomeGenerator {
    constructor(width, height, seed = null) {
        this.width = width;
        this.height = height;
        this.tileSize = 40;
        this.seed = seed || Math.random();
        
        // Initialize noise generators (multiple for different features)
        this.elevationNoise = createNoise2D(alea(this.seed));
        this.moistureNoise = createNoise2D(alea(this.seed + 1));
        this.temperatureNoise = createNoise2D(alea(this.seed + 2));
        
        // Biome definitions
        this.biomes = this.initializeBiomes();
        
        // Generated biome map
        this.biomeMap = [];
        
        // Biome transition cache for smooth rendering
        this.transitionCache = new Map();
        
        this.generate();
    }
    
    initializeBiomes() {
        // Returns array of BiomeType instances
        // Defined in detail in Data Models section
    }
    
    generate() {
        // Multi-layer noise generation
        // Biome assignment based on elevation + moisture + temperature
        // Post-processing for biome clustering and smoothing
    }
    
    getBiomeAt(x, y) {
        // Returns BiomeType for given world coordinates
    }
    
    getBiomeTransition(x, y, radius) {
        // Returns blend of nearby biomes for smooth transitions
        // Used by renderer for visual blending
    }
}
```

### 5. BiomeEffectSystem

New system that applies biome effects to entities:

```javascript
class BiomeEffectSystem {
    constructor(world) {
        this.world = world;
        this.biomeGenerator = world.biomeGenerator;
    }
    
    update(dt) {
        for (const entity of this.world.getActiveEntities()) {
            if (!entity.hasComponent(ComponentType.BIOME)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const biomeComp = entity.getComponent(ComponentType.BIOME);
            const habitat = entity.getComponent(ComponentType.HABITAT);
            
            // Get current biome
            const currentBiome = this.biomeGenerator.getBiomeAt(pos.x, pos.y);
            
            // Check if biome changed
            if (biomeComp.currentBiome !== currentBiome.id) {
                this.onBiomeChange(entity, currentBiome, biomeComp, habitat);
            }
            
            // Update time in biome
            biomeComp.timeInBiome += dt;
            
            // Apply ongoing biome effects
            this.applyBiomeEffects(entity, currentBiome, biomeComp, habitat, dt);
        }
    }
    
    onBiomeChange(entity, newBiome, biomeComp, habitat) {
        // Update biome component
        biomeComp.currentBiome = newBiome.id;
        biomeComp.timeInBiome = 0;
        biomeComp.lastBiomeChange = this.world.time;
        
        // Calculate effective modifiers based on habitat preference
        const preference = habitat ? habitat.getPreference(newBiome.id) : 1.0;
        
        biomeComp.biomeEffects.movementMultiplier = 
            newBiome.movementModifier * preference;
        biomeComp.biomeEffects.energyMultiplier = 
            newBiome.energyModifier * (2.0 - preference); // Inverse for energy
        biomeComp.biomeEffects.visibilityMultiplier = 
            newBiome.visibilityModifier;
        biomeComp.biomeEffects.concealmentBonus = 
            newBiome.concealmentBonus;
    }
    
    applyBiomeEffects(entity, biome, biomeComp, habitat, dt) {
        // Effects are applied by other systems reading biomeComp.biomeEffects
        // This method handles special cases like cumulative effects
        
        // Example: Harsh biome cumulative drain
        if (biomeComp.biomeEffects.energyMultiplier > 1.3 && 
            biomeComp.timeInBiome > 10.0) {
            const stats = entity.getComponent(ComponentType.STATS);
            if (stats) {
                const drainRate = 0.5 * (biomeComp.timeInBiome / 10.0);
                stats.energy -= drainRate * dt;
            }
        }
    }
}
```

## Data Models

### Biome Definitions

```javascript
const BIOME_DEFINITIONS = [
    {
        id: 'deep_water',
        name: 'Deep Water',
        color: '#1a4d7a',
        secondaryColor: '#0d3a5f',
        pattern: 'waves',
        animationSpeed: 0.5,
        movementModifier: 0.2,      // Very slow for non-fish
        energyModifier: 1.4,
        plantDensity: 0.0,
        plantGrowthRate: 0.0,
        visibilityModifier: 0.6,
        concealmentBonus: 0.4,
        noiseThreshold: [0.0, 0.25]
    },
    {
        id: 'water',
        name: 'Shallow Water',
        color: '#2e7db5',
        secondaryColor: '#4a9fd9',
        pattern: 'waves',
        animationSpeed: 0.3,
        movementModifier: 0.3,
        energyModifier: 1.3,
        plantDensity: 0.1,
        plantGrowthRate: 0.5,
        visibilityModifier: 0.8,
        concealmentBonus: 0.2,
        noiseThreshold: [0.25, 0.35],
        adjacencyRules: ['deep_water', 'sand']
    },
    {
        id: 'sand',
        name: 'Sandy Beach',
        color: '#ddc77d',
        secondaryColor: '#f0e5b8',
        pattern: 'dots',
        movementModifier: 0.85,
        energyModifier: 1.1,
        plantDensity: 0.2,
        plantGrowthRate: 0.6,
        visibilityModifier: 1.3,
        concealmentBonus: 0.0,
        noiseThreshold: [0.35, 0.42],
        adjacencyRules: ['water', 'grassland']
    },
    {
        id: 'grassland',
        name: 'Grassland',
        color: '#6b9e4d',
        secondaryColor: '#7fb857',
        pattern: 'grass',
        animationSpeed: 0.2,
        movementModifier: 1.0,
        energyModifier: 0.9,
        plantDensity: 1.8,
        plantGrowthRate: 1.3,
        visibilityModifier: 1.0,
        concealmentBonus: 0.1,
        noiseThreshold: [0.42, 0.58],
        adjacencyRules: ['sand', 'forest', 'savanna']
    },
    {
        id: 'forest',
        name: 'Dense Forest',
        color: '#3d6b2e',
        secondaryColor: '#2d5221',
        pattern: 'trees',
        movementModifier: 0.7,
        energyModifier: 0.95,
        plantDensity: 2.2,
        plantGrowthRate: 1.5,
        visibilityModifier: 0.6,
        concealmentBonus: 0.5,
        noiseThreshold: [0.58, 0.72],
        adjacencyRules: ['grassland', 'mountain']
    },
    {
        id: 'savanna',
        name: 'Savanna',
        color: '#b8a76f',
        secondaryColor: '#d4c291',
        pattern: 'sparse_grass',
        movementModifier: 1.2,
        energyModifier: 1.0,
        plantDensity: 1.0,
        plantGrowthRate: 0.9,
        visibilityModifier: 1.4,
        concealmentBonus: 0.0,
        noiseThreshold: [0.72, 0.80],
        adjacencyRules: ['grassland', 'desert']
    },
    {
        id: 'desert',
        name: 'Desert',
        color: '#d4a76a',
        secondaryColor: '#e8c794',
        pattern: 'dunes',
        movementModifier: 0.8,
        energyModifier: 1.4,
        plantDensity: 0.15,
        plantGrowthRate: 0.4,
        visibilityModifier: 1.5,
        concealmentBonus: 0.0,
        noiseThreshold: [0.80, 0.87],
        adjacencyRules: ['savanna', 'mountain']
    },
    {
        id: 'mountain',
        name: 'Mountain',
        color: '#8b7355',
        secondaryColor: '#6d5a44',
        pattern: 'rocks',
        movementModifier: 0.6,
        energyModifier: 1.5,
        plantDensity: 0.3,
        plantGrowthRate: 0.5,
        visibilityModifier: 1.2,
        concealmentBonus: 0.6,
        noiseThreshold: [0.87, 0.95],
        adjacencyRules: ['forest', 'snow']
    },
    {
        id: 'snow',
        name: 'Snowy Peak',
        color: '#f0f0f0',
        secondaryColor: '#e0e8f0',
        pattern: 'snow',
        particleEffect: 'snowfall',
        movementModifier: 0.5,
        energyModifier: 1.6,
        plantDensity: 0.0,
        plantGrowthRate: 0.0,
        visibilityModifier: 0.9,
        concealmentBonus: 0.3,
        noiseThreshold: [0.95, 1.0],
        adjacencyRules: ['mountain']
    }
];
```

### Species Habitat Preferences

```javascript
const HABITAT_PREFERENCES = {
    herbivore: {
        grassland: 1.8,
        forest: 1.5,
        savanna: 1.3,
        sand: 0.9,
        mountain: 0.7,
        desert: 0.5,
        water: 0.3,
        deep_water: 0.1,
        snow: 0.4
    },
    predator: {
        savanna: 1.7,
        grassland: 1.4,
        forest: 1.2,
        mountain: 1.3,
        sand: 1.0,
        desert: 0.8,
        water: 0.4,
        deep_water: 0.2,
        snow: 0.6
    },
    plant: {
        grassland: 2.0,
        forest: 1.8,
        savanna: 1.2,
        sand: 0.5,
        mountain: 0.6,
        desert: 0.3,
        water: 0.0,
        deep_water: 0.0,
        snow: 0.0
    },
    fish: {
        deep_water: 2.0,
        water: 1.8,
        sand: 0.1,
        grassland: 0.0,
        forest: 0.0,
        savanna: 0.0,
        desert: 0.0,
        mountain: 0.0,
        snow: 0.0
    },
    bird: {
        grassland: 1.3,
        forest: 1.4,
        savanna: 1.5,
        mountain: 1.6,
        sand: 1.2,
        desert: 1.0,
        water: 1.1,
        deep_water: 0.9,
        snow: 0.8
    }
};
```

## Error Handling

### Biome Query Errors

```javascript
getBiomeAt(x, y) {
    try {
        // Bounds checking
        if (!this.isValidPosition(x, y)) {
            console.warn(`[BiomeGenerator] Invalid position: (${x}, ${y})`);
            return this.getDefaultBiome();
        }
        
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (!this.biomeMap[tileY] || !this.biomeMap[tileY][tileX]) {
            console.error(`[BiomeGenerator] Missing biome data at tile (${tileX}, ${tileY})`);
            return this.getDefaultBiome();
        }
        
        return this.biomeMap[tileY][tileX];
    } catch (error) {
        console.error('[BiomeGenerator] Error getting biome:', error);
        return this.getDefaultBiome();
    }
}

getDefaultBiome() {
    return this.biomes.find(b => b.id === 'grassland') || this.biomes[0];
}
```

### Component Initialization Errors

```javascript
// In EntityFactory
createEntity(species, x, y) {
    const entity = new Entity();
    
    // ... existing component setup ...
    
    // Add biome component with error handling
    try {
        entity.addComponent(ComponentType.BIOME, new BiomeComponent());
        
        // Add habitat component if preferences exist
        const preferences = HABITAT_PREFERENCES[species];
        if (preferences) {
            entity.addComponent(ComponentType.HABITAT, new HabitatComponent(preferences));
        } else {
            console.warn(`[EntityFactory] No habitat preferences for species: ${species}`);
        }
    } catch (error) {
        console.error(`[EntityFactory] Error adding biome components to ${species}:`, error);
    }
    
    return entity;
}
```

### Graceful Degradation

If biome system fails to initialize:
- Fall back to basic terrain rendering
- Apply default modifiers (1.0) to all entities
- Log errors but continue simulation
- Display warning message to user

## Testing Strategy

### Unit Tests

1. **BiomeGenerator Tests**
   - Verify biome generation produces valid biome types
   - Test noise threshold ranges produce expected biomes
   - Validate biome clustering and adjacency rules
   - Test seed reproducibility

2. **BiomeEffectSystem Tests**
   - Verify modifiers are applied correctly
   - Test biome change detection
   - Validate habitat preference calculations
   - Test cumulative effect application

3. **Component Tests**
   - Test BiomeComponent state management
   - Validate HabitatComponent preference queries
   - Test component serialization for save/load

### Integration Tests

1. **Entity-Biome Interaction**
   - Spawn entities in different biomes
   - Verify movement speed changes across biomes
   - Test energy consumption in various biomes
   - Validate reproduction rate modifiers

2. **System Integration**
   - Test BiomeEffectSystem with MovementSystem
   - Verify HealthSystem reads biome energy modifiers
   - Test ReproductionSystem biome bonuses
   - Validate BehaviorSystem habitat preferences

3. **Performance Tests**
   - Measure biome query performance with 1000+ entities
   - Test transition cache effectiveness
   - Validate QuadTree integration
   - Monitor frame rate with biome effects enabled

### Visual Tests

1. **Rendering Quality**
   - Verify biome colors match specifications
   - Test transition smoothness between biomes
   - Validate pattern rendering (grass, waves, etc.)
   - Test particle effects (snowfall, etc.)

2. **UI Integration**
   - Test biome tooltip display
   - Verify entity info panel shows biome effects
   - Test biome legend panel
   - Validate debug overlay rendering

## Performance Considerations

### Optimization Strategies

1. **Biome Query Caching**
   - Cache biome lookups per tile
   - Invalidate cache only on terrain regeneration
   - Use spatial hashing for fast lookups

2. **Effect Application**
   - Apply modifiers only on biome change
   - Store computed effects in BiomeComponent
   - Avoid recalculating every frame

3. **Rendering Optimization**
   - Batch render tiles by biome type
   - Use texture atlases for patterns
   - Implement LOD for distant biome details
   - Cache transition blends

4. **Memory Management**
   - Reuse BiomeComponent instances via EntityPool
   - Limit transition cache size
   - Use typed arrays for biome map storage

### Performance Targets

- Biome query: < 0.1ms per entity
- Effect application: < 0.5ms for 1000 entities
- Rendering overhead: < 5ms per frame
- Memory footprint: < 10MB for biome data

## Visual Design

### Biome Rendering Techniques

1. **Base Layer**: Solid color fill per tile
2. **Pattern Layer**: Procedural patterns (dots, stripes, noise)
3. **Animation Layer**: Subtle movement (grass sway, water waves)
4. **Particle Layer**: Environmental effects (snow, leaves)
5. **Transition Layer**: Gradient blending between biomes

### Pattern Examples

```javascript
// Grass pattern
function renderGrassPattern(ctx, x, y, size, time) {
    const blades = 5;
    for (let i = 0; i < blades; i++) {
        const offsetX = (i / blades) * size;
        const sway = Math.sin(time + i) * 2;
        ctx.strokeStyle = 'rgba(100, 150, 70, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x + offsetX, y + size);
        ctx.lineTo(x + offsetX + sway, y);
        ctx.stroke();
    }
}

// Wave pattern
function renderWavePattern(ctx, x, y, size, time) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const offset = (time * 20 + i * 10) % size;
        ctx.arc(x + size/2, y + size/2, offset, 0, Math.PI * 2);
        ctx.stroke();
    }
}
```

### UI Components

1. **Biome Tooltip**
   - Display on hover over terrain
   - Show biome name, modifiers, and current entity count
   - Fade in/out smoothly

2. **Biome Legend Panel**
   - Toggleable panel showing all biomes
   - Color swatches with names
   - Modifier values displayed
   - Click to highlight biome on map

3. **Entity Biome Info**
   - Add to existing entity info panel
   - Show current biome and active effects
   - Display habitat preference indicator
   - Show time in current biome

## Migration Strategy

### Phase 1: Core Infrastructure
- Replace TerrainGenerator with BiomeGenerator
- Add BiomeComponent and HabitatComponent
- Implement BiomeEffectSystem
- Update EntityFactory to add new components

### Phase 2: System Integration
- Modify MovementSystem to read movement modifiers
- Update HealthSystem to apply energy modifiers
- Enhance ReproductionSystem with biome bonuses
- Update BehaviorSystem for habitat preferences

### Phase 3: Visual Enhancement
- Implement biome pattern rendering
- Add transition blending
- Create particle effects
- Build UI components

### Phase 4: Polish & Optimization
- Performance profiling and optimization
- Visual polish and effects tuning
- Balance gameplay modifiers
- User testing and feedback

### Backward Compatibility

- Save files without biome data will initialize with default values
- Existing entities will receive BiomeComponent on load
- Terrain will regenerate with new biome system
- Old terrain type names map to new biome IDs

## Future Enhancements

1. **Dynamic Biomes**: Seasonal changes, weather effects
2. **Biome Events**: Fires, floods, droughts
3. **Terraforming**: Player ability to modify biomes
4. **Biome-Specific Species**: Unique creatures per biome
5. **Migration Patterns**: Entities move between biomes seasonally
6. **Biome Resources**: Special resources spawn in specific biomes
7. **Climate Zones**: Temperature and moisture gradients
8. **Biome Sounds**: Audio ambience per biome type
