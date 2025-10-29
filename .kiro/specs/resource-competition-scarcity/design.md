# Design Document

## Overview

The Resource Competition & Scarcity feature introduces three interconnected systems that create realistic resource dynamics in the ecosystem simulation:

1. **Territory System**: Entities claim and defend spatial areas
2. **Resource Depletion System**: Tracks grazing pressure and reduces plant growth in overgrazed areas
3. **Water Source System**: Creates strategic gathering points with thirst mechanics

These systems integrate with the existing ECS architecture, leveraging the World, BehaviorSystem, and BiomeGenerator components while adding new components and systems.

## Architecture

### Component Architecture

The feature follows the existing Entity-Component-System pattern:

**New Components:**
- `TerritoryComponent`: Stores territory ownership data
- `ThirstComponent`: Tracks water needs for land entities
- `GrazingPressureComponent`: Tracks resource depletion per grid cell (world-level)

**Modified Components:**
- `Status`: Extended to track territorial conflicts and water-seeking behavior

### System Architecture

**New Systems:**
- `TerritorySystem`: Manages territory claiming, defense, and conflicts
- `ResourceDepletionSystem`: Tracks grazing pressure and modifies plant spawn rates
- `WaterSourceSystem`: Manages water sources, thirst mechanics, and ambush behavior

**Modified Systems:**
- `BehaviorSystem`: Extended with water-seeking and ambush behaviors
- `ReproductionSystem`: Modified to respect resource depletion zones

### Data Flow

```
World Update Loop
├── TerritorySystem.update()
│   ├── Assign territories to mature entities
│   ├── Detect territorial intrusions
│   └── Trigger defensive behaviors
├── ResourceDepletionSystem.update()
│   ├── Track grazing events
│   ├── Decay pressure over time
│   └── Modify plant spawn rates
├── WaterSourceSystem.update()
│   ├── Decrease entity thirst
│   ├── Restore thirst at water sources
│   └── Apply dehydration damage
├── BehaviorSystem.update()
│   ├── Water-seeking behavior (priority)
│   ├── Ambush behavior (predators)
│   ├── Existing behaviors (food, flee, wander)
│   └── Territory defense modifiers
└── Renderer.render()
    ├── Territory boundaries
    ├── Resource depletion zones
    └── Water sources
```

## Components and Interfaces

### TerritoryComponent

```javascript
export class TerritoryComponent {
    constructor(centerX, centerY, radius) {
        this.centerX = centerX;           // Territory center X
        this.centerY = centerY;           // Territory center Y
        this.radius = radius;             // Territory radius (50-200 units)
        this.claimedAt = 0;               // Timestamp when claimed
        this.intruders = [];              // List of current intruders
        this.conflictCount = 0;           // Total conflicts
    }
    
    containsPoint(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }
    
    distanceFromCenter(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
```

### ThirstComponent

```javascript
export class ThirstComponent {
    constructor() {
        this.thirst = 100;                // Current thirst (0-100)
        this.maxThirst = 100;             // Maximum thirst
        this.thirstRate = 0.5;            // Decrease per second
        this.drinkingRate = 33.33;        // Restore rate (100 in 3 seconds)
        this.isDrinking = false;          // Currently at water source
        this.lastDrinkTime = 0;           // Timestamp of last drink
        this.targetWaterSource = null;    // Current water source target
    }
}
```

### GrazingPressureGrid

```javascript
export class GrazingPressureGrid {
    constructor(worldWidth, worldHeight, cellSize = 100) {
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(worldWidth / cellSize);
        this.gridHeight = Math.ceil(worldHeight / cellSize);
        this.grid = [];                   // 2D array of pressure values
        
        // Initialize grid
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = new Array(this.gridWidth).fill(0);
        }
    }
    
    getCellCoords(x, y) {
        return {
            cellX: Math.floor(x / this.cellSize),
            cellY: Math.floor(y / this.cellSize)
        };
    }
    
    getPressure(x, y) {
        const { cellX, cellY } = this.getCellCoords(x, y);
        if (cellX >= 0 && cellX < this.gridWidth && 
            cellY >= 0 && cellY < this.gridHeight) {
            return this.grid[cellY][cellX];
        }
        return 0;
    }
    
    incrementPressure(x, y, amount = 1) {
        const { cellX, cellY } = this.getCellCoords(x, y);
        if (cellX >= 0 && cellX < this.gridWidth && 
            cellY >= 0 && cellY < this.gridHeight) {
            this.grid[cellY][cellX] += amount;
        }
    }
    
    decayAll(decayRate = 0.1) {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] *= (1 - decayRate);
                if (this.grid[y][x] < 0.01) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }
    
    getAveragePressure() {
        let total = 0;
        let count = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                total += this.grid[y][x];
                count++;
            }
        }
        return count > 0 ? total / count : 0;
    }
}
```

### WaterSource

```javascript
export class WaterSource {
    constructor(x, y, radius = 30) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.visitCount = 0;              // Total visits
        this.recentVisits = 0;            // Visits in last minute
        this.lastResetTime = 0;           // For per-minute tracking
        this.nearbyEntities = [];         // Entities within 100 units
    }
    
    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    isInRange(x, y) {
        return this.distanceTo(x, y) <= this.radius;
    }
}
```

## Data Models

### Territory Assignment Rules

- **Trigger**: Entity reaches maturity (age > 100 or energy > 80% of max)
- **Territory Center**: Current entity position at time of claiming
- **Territory Radius**: `50 + (entity.traits.size * 150)` (range: 50-200 units)
- **Species Eligibility**: Herbivores and predators only (not plants, fish, or birds)

### Resource Depletion Calculation

```javascript
// Plant spawn rate modifier based on grazing pressure
function getPlantSpawnModifier(grazingPressure) {
    if (grazingPressure > 20) {
        return 0.2;  // 80% reduction
    } else if (grazingPressure > 10) {
        return 0.5;  // 50% reduction
    }
    return 1.0;      // No reduction
}

// Grazing pressure decay
function decayPressure(currentPressure, deltaTime) {
    const decayRate = 0.1;  // 10% every 5 seconds
    const decayInterval = 5.0;
    
    if (deltaTime >= decayInterval) {
        return currentPressure * (1 - decayRate);
    }
    return currentPressure;
}
```

### Water Source Placement

Water sources are generated during world initialization:

```javascript
function generateWaterSources(world) {
    const worldSize = world.width * world.height;
    const baseCount = 5;
    const scaleFactor = worldSize / (2000 * 2000);  // Normalize to 2000x2000
    const count = Math.floor(baseCount + (scaleFactor * 10));
    const finalCount = Math.max(5, Math.min(15, count));
    
    const sources = [];
    const attempts = finalCount * 10;
    
    for (let i = 0; i < attempts && sources.length < finalCount; i++) {
        const x = Math.random() * world.width;
        const y = Math.random() * world.height;
        const biome = world.getBiomeAt(x, y);
        
        // Check water affinity (water, deep_water have affinity > 0.3)
        if (biome && biome.waterAffinity > 0.3) {
            // Ensure minimum distance from other sources
            const minDistance = 200;
            const tooClose = sources.some(s => s.distanceTo(x, y) < minDistance);
            
            if (!tooClose) {
                sources.push(new WaterSource(x, y));
            }
        }
    }
    
    return sources;
}
```

## Error Handling

### Territory System

- **Invalid Position**: Skip territory assignment if entity position is out of bounds
- **Null Entity**: Check entity existence before processing intrusions
- **Concurrent Modifications**: Use entity ID for conflict tracking to avoid stale references

### Resource Depletion System

- **Grid Bounds**: Clamp coordinates to grid dimensions
- **Negative Pressure**: Floor pressure values at 0 during decay
- **NaN Values**: Validate all numeric operations, default to 0 on error

### Water Source System

- **No Water Sources**: If generation fails, create at least 3 sources at random valid positions
- **Thirst Overflow**: Clamp thirst values between 0 and maxThirst
- **Invalid Target**: Clear targetWaterSource if source no longer exists

## Testing Strategy

### Unit Tests

1. **TerritoryComponent Tests**
   - Territory radius calculation based on entity size
   - Point containment detection
   - Distance calculations

2. **GrazingPressureGrid Tests**
   - Cell coordinate conversion
   - Pressure increment and decay
   - Average pressure calculation
   - Grid bounds handling

3. **WaterSource Tests**
   - Distance calculations
   - Range detection
   - Visit tracking

### Integration Tests

1. **Territory System Integration**
   - Territory assignment on maturity
   - Intrusion detection between entities
   - Defensive behavior triggering
   - Aggression modifier application

2. **Resource Depletion Integration**
   - Grazing event tracking
   - Plant spawn rate modification
   - Pressure decay over time
   - Multi-cell grazing patterns

3. **Water Source Integration**
   - Thirst decrease over time
   - Water-seeking behavior activation
   - Thirst restoration at sources
   - Dehydration damage application
   - Ambush behavior triggering

### Behavior Tests

1. **Priority Testing**
   - Water-seeking overrides food-seeking when thirst < 30
   - Fleeing overrides water-seeking when predator nearby
   - Ambush mode activation conditions

2. **Performance Testing**
   - Territory system with 100+ entities
   - Grazing pressure grid updates with high entity density
   - Water source pathfinding with multiple targets

### Visual Verification

1. **Territory Rendering**
   - Boundaries visible when entity selected
   - Correct radius display
   - Color coding for conflicts

2. **Resource Depletion Visualization**
   - Brown tint overlay in depleted zones
   - Gradient based on pressure level
   - Heatmap integration

3. **Water Source Display**
   - Blue circles at correct positions
   - Tooltip showing statistics
   - Entity gathering visualization

## Performance Considerations

### Spatial Optimization

- **Territory Checks**: Use QuadTree for nearby entity queries (O(log n) instead of O(n²))
- **Water Source Pathfinding**: Cache nearest water source per entity, update every 5 seconds
- **Grazing Pressure**: Grid-based approach reduces per-entity checks

### Memory Management

- **Territory Component**: Only added to mature land entities (~30% of population)
- **Thirst Component**: Only added to land entities (excludes fish)
- **Grazing Grid**: Fixed size based on world dimensions, not entity count

### Update Frequency

- **Territory System**: Check intrusions every frame (required for responsive defense)
- **Resource Depletion**: Decay pressure every 5 seconds (not every frame)
- **Water Source**: Update thirst every frame, but pathfinding every 5 seconds

### Rendering Optimization

- **Territory Boundaries**: Only render for selected entity
- **Depletion Zones**: Only render when heatmap is enabled
- **Water Sources**: Always render (low count, 5-15 sources)

## Integration Points

### World.js Integration

```javascript
// Add to World constructor
this.grazingPressureGrid = new GrazingPressureGrid(width, height);
this.waterSources = [];

// Add to World.spawnInitialEntities()
this.waterSources = this.generateWaterSources();

// Add to World.systems array
new TerritorySystem(this),
new ResourceDepletionSystem(this),
new WaterSourceSystem(this)
```

### BehaviorSystem Integration

Modify behavior priority order:
1. Fleeing (highest priority - survival)
2. Water-seeking (thirst < 30)
3. Ambush mode (predators near water)
4. Food-seeking (existing)
5. Wandering (lowest priority)

### Renderer Integration

Add rendering methods:
- `renderTerritories(selectedEntity)`: Draw territory boundary for selected entity
- `renderDepletionZones(grazingGrid)`: Overlay brown tint on depleted areas
- `renderWaterSources(sources)`: Draw blue circles for water sources

### UI Integration

Extend EntityInfoPanel to show:
- Territory status (claimed/unclaimed)
- Thirst level (0-100)
- Current grazing pressure at entity location

Add statistics to StatsGraph:
- Active territories count
- Territorial conflicts per minute
- Average grazing pressure
- Water source utilization

## Migration Strategy

### Phase 1: Core Components
- Add new component classes to Entity.js
- Add ComponentType constants
- No breaking changes to existing code

### Phase 2: Systems Implementation
- Implement TerritorySystem, ResourceDepletionSystem, WaterSourceSystem
- Add to World.systems array
- Systems operate independently, no conflicts with existing systems

### Phase 3: Behavior Integration
- Modify BehaviorSystem to include new behaviors
- Maintain backward compatibility with existing behaviors
- Use feature flags if needed for gradual rollout

### Phase 4: Rendering & UI
- Add rendering methods to Renderer
- Extend UI panels with new statistics
- Visual features are additive, no removal of existing displays
