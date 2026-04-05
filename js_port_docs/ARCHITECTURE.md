# 🏗️ Architecture Documentation

## Overview

The Ecosystem Simulation is built using modern JavaScript with a modular, component-based architecture. The system uses an Entity-Component pattern with specialized systems for different aspects of the simulation.

## Technology Stack

- **Vite** - Build tool and dev server
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **HTML5 Canvas** - Rendering
- **simplex-noise** - Procedural terrain generation
- **LocalStorage** - Save/load persistence

## Core Architecture

### High-Level Structure

```
┌─────────────────────────────────────────┐
│           Main Application              │
│         (src/main.js)                   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────┐
│     World      │  │   Renderer   │
│  (Core Logic)  │  │  (Graphics)  │
└───────┬────────┘  └──────────────┘
        │
    ┌───┴────┬────────┬────────┐
    │        │        │        │
┌───▼───┐ ┌─▼──┐ ┌───▼───┐ ┌──▼──┐
│Entity │ │ UI │ │Systems│ │Input│
└───────┘ └────┘ └───────┘ └─────┘
```

## Directory Structure

```
src/
├── core/               # Core simulation logic
│   ├── World.js           # Main world manager
│   ├── Entity.js          # Base entity class
│   ├── InputHandler.js    # Input management
│   └── SaveSystem.js      # Persistence
│
├── entities/           # Entity types
│   ├── Herbivore.js       # Herbivore behavior
│   ├── Predator.js        # Predator behavior
│   ├── Plant.js           # Plant behavior
│   ├── Fish.js            # Fish behavior
│   └── Bird.js            # Bird behavior
│
├── systems/            # Game systems
│   ├── TerrainSystem.js   # Terrain generation
│   ├── GeneticSystem.js   # Evolution mechanics
│   └── PhysicsSystem.js   # Movement & collision
│
├── graphics/           # Rendering
│   └── Renderer.js        # Canvas rendering
│
├── ui/                 # User interface
│   ├── UI.js              # Main UI controller
│   ├── Tutorial.js        # Interactive tutorial
│   └── StatsGraph.js      # Population graphs
│
└── main.js             # Application entry point
```

## Core Components

### 1. World (src/core/World.js)

**Responsibilities:**
- Entity lifecycle management
- System coordination
- Game loop timing
- State management

**Key Methods:**
```javascript
class World {
    constructor(width, height)
    update(deltaTime)
    spawnInitialEntities()
    addEntity(entity)
    removeEntity(entity)
    getNearbyEntities(entity, radius)
    reset()
}
```

**Update Loop:**
```
1. Update all entities
2. Check collisions
3. Handle interactions
4. Update genetics
5. Clean up dead entities
6. Update statistics
```

### 2. Entity (src/core/Entity.js)

**Base Class for All Entities:**

```javascript
class Entity {
    constructor(x, y, type) {
        this.id = generateId()
        this.x = x
        this.y = y
        this.type = type
        this.energy = 100
        this.age = 0
        this.genetics = new Genetics()
    }
    
    update(deltaTime, world)
    draw(ctx)
    die()
}
```

**Entity Types:**
- **Herbivore** - Seeks plants, flees predators
- **Predator** - Hunts herbivores
- **Plant** - Stationary, grows over time
- **Fish** - Aquatic movement
- **Bird** - Aerial movement

### 3. Renderer (src/graphics/Renderer.js)

**Responsibilities:**
- Canvas rendering
- Camera management
- Visual effects
- Performance optimization

**Rendering Pipeline:**
```
1. Clear canvas
2. Apply camera transform
3. Render terrain
4. Render entities (sorted by layer)
5. Render effects
6. Render UI overlays
7. Render debug info (if enabled)
```

**Optimization Techniques:**
- Culling off-screen entities
- Layer-based rendering
- Sprite caching
- Dirty rectangle tracking

### 4. Systems

#### Terrain System (src/systems/TerrainSystem.js)

**Procedural Generation:**
```javascript
class TerrainSystem {
    generateTerrain(width, height) {
        // Use simplex noise for natural-looking terrain
        // Multiple octaves for detail
        // Biome assignment based on noise values
    }
    
    getBiomeAt(x, y)
    isWalkable(x, y)
}
```

**Biome Types:**
- Grassland (common)
- Forest (dense vegetation)
- Water (fish habitat)
- Savanna (open plains)
- Mountains (impassable)

#### Genetic System (src/systems/GeneticSystem.js)

**Evolution Mechanics:**
```javascript
class GeneticSystem {
    createOffspring(parent1, parent2) {
        // Inherit traits from parents
        // Apply mutations
        // Return new genetics
    }
    
    mutate(gene, rate)
    crossover(gene1, gene2)
}
```

**Genetic Traits:**
- Speed (movement velocity)
- Size (visual and collision)
- Sense Range (detection distance)
- Efficiency (energy consumption)
- Reproduction Rate (breeding frequency)

**Mutation:**
- Small random changes each generation
- Configurable mutation rate
- Bounded by min/max values
- Creates evolutionary pressure

#### Physics System (src/systems/PhysicsSystem.js)

**Movement & Collision:**
```javascript
class PhysicsSystem {
    updatePosition(entity, deltaTime)
    checkCollision(entity1, entity2)
    resolveCollision(entity1, entity2)
    applyForce(entity, force)
}
```

**Features:**
- Velocity-based movement
- Simple collision detection
- Boundary checking
- Terrain interaction

## Entity Behaviors

### Herbivore Behavior

**State Machine:**
```
WANDER → SEEK_FOOD → EAT → FLEE → REPRODUCE
```

**Decision Logic:**
```javascript
update(deltaTime, world) {
    // 1. Check for threats
    if (predatorNearby) {
        flee()
        return
    }
    
    // 2. Check energy
    if (energy < threshold) {
        seekFood()
        return
    }
    
    // 3. Check reproduction
    if (canReproduce) {
        reproduce()
        return
    }
    
    // 4. Default behavior
    wander()
}
```

### Predator Behavior

**State Machine:**
```
WANDER → HUNT → CHASE → ATTACK → EAT → REPRODUCE
```

**Hunting Logic:**
```javascript
update(deltaTime, world) {
    // 1. Find prey
    const prey = findNearestPrey(world)
    
    // 2. Chase if found
    if (prey && inRange(prey)) {
        chase(prey)
        
        // 3. Attack if close
        if (canAttack(prey)) {
            attack(prey)
        }
        return
    }
    
    // 4. Reproduce if possible
    if (canReproduce) {
        reproduce()
        return
    }
    
    // 5. Wander
    wander()
}
```

### Plant Behavior

**Growth Cycle:**
```javascript
update(deltaTime, world) {
    // 1. Grow over time
    energy += growthRate * deltaTime
    
    // 2. Reproduce when mature
    if (energy > threshold && canReproduce) {
        spreadSeeds(world)
    }
    
    // 3. Die if too old
    if (age > maxAge) {
        die()
    }
}
```

## UI System

### Main UI (src/ui/UI.js)

**Components:**
- Population counters
- Statistics display
- Control buttons
- Sliders (speed, zoom)
- Entity info panel

**Update Cycle:**
```javascript
update(fps) {
    updatePopulationCounts()
    updateStatistics(fps)
    updateGraph()
    updateEntityInfo()
}
```

### Tutorial System (src/ui/Tutorial.js)

**Interactive Steps:**
1. Welcome & Overview
2. Species Introduction
3. Controls Tutorial
4. Statistics Explanation
5. Save/Load Guide

**Features:**
- Step-by-step guidance
- Highlighted UI elements
- Skip option
- Progress tracking
- Persistent completion state

### Stats Graph (src/ui/StatsGraph.js)

**Population History:**
```javascript
class StatsGraph {
    addDataPoint(populations)
    draw(ctx)
    clear()
    
    // Tracks:
    // - Herbivore count
    // - Predator count
    // - Plant count
    // - Fish count
    // - Bird count
}
```

## Save System

### LocalStorage Persistence

**Save Format:**
```javascript
{
    version: "2.0.0",
    timestamp: Date.now(),
    world: {
        width: 1920,
        height: 1080,
        time: 1234.56
    },
    entities: [
        {
            type: "herbivore",
            x: 100,
            y: 200,
            energy: 150,
            genetics: {...}
        },
        // ... more entities
    ],
    statistics: {
        totalBirths: 100,
        totalDeaths: 50,
        // ... more stats
    }
}
```

**Features:**
- Manual save/load
- Auto-save every 30 seconds
- Save validation
- Version compatibility
- Compression (future)

## Performance Optimization

### Current Optimizations

1. **Spatial Partitioning**
   - Grid-based entity lookup
   - Reduces collision checks from O(n²) to O(n)

2. **Culling**
   - Only render visible entities
   - Skip updates for far entities (future)

3. **Object Pooling**
   - Reuse entity objects
   - Reduce garbage collection

4. **Dirty Flags**
   - Only update changed elements
   - Skip unnecessary calculations

### Future Optimizations

1. **Web Workers**
   - Move physics to separate thread
   - Parallel entity updates

2. **WebGL Rendering**
   - GPU-accelerated rendering
   - Particle systems
   - Shader effects

3. **Quadtree**
   - Better spatial partitioning
   - Faster collision detection

4. **LOD System**
   - Reduce detail for distant entities
   - Simplified physics for far entities

## Event System

### Event Types

```javascript
const Events = {
    ENTITY_BORN: 'entity:born',
    ENTITY_DIED: 'entity:died',
    ENTITY_ATE: 'entity:ate',
    ENTITY_REPRODUCED: 'entity:reproduced',
    POPULATION_CHANGED: 'population:changed'
}
```

### Event Flow

```
Entity Action → Event Emitted → Listeners Notified → UI Updated
```

## Data Flow

### Update Cycle

```
User Input → Input Handler → World Update → Entity Updates → 
System Updates → Renderer → Canvas → Display
```

### Interaction Flow

```
Mouse Click → Input Handler → Entity Selection → 
UI Update → Info Panel Display
```

## Configuration

### Constants (Configurable)

```javascript
const CONFIG = {
    // Population
    INITIAL_HERBIVORES: 15,
    INITIAL_PREDATORS: 8,
    INITIAL_PLANTS: 40,
    INITIAL_FISH: 10,
    INITIAL_BIRDS: 5,
    
    // Energy
    HERBIVORE_MAX_ENERGY: 200,
    PREDATOR_MAX_ENERGY: 250,
    PLANT_MAX_ENERGY: 100,
    
    // Behavior
    HERBIVORE_SPEED: 80,
    PREDATOR_SPEED: 120,
    FLEE_RANGE: 150,
    HUNT_RANGE: 400,
    
    // Genetics
    MUTATION_RATE: 0.1,
    GENE_MIN: 0.5,
    GENE_MAX: 1.5,
    
    // World
    WORLD_WIDTH: 2000,
    WORLD_HEIGHT: 1600,
    TILE_SIZE: 40
}
```

## Testing Strategy

### Unit Tests (Future)
- Entity behavior logic
- Genetic system
- Physics calculations
- Save/load functionality

### Integration Tests (Future)
- World update cycle
- Entity interactions
- System coordination

### Performance Tests
- FPS monitoring
- Entity count scaling
- Memory usage tracking

## Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- ES6+ JavaScript
- Canvas 2D API
- LocalStorage
- RequestAnimationFrame

## Deployment

### Build Process

```bash
npm run build
```

**Output:**
- Minified JavaScript
- Optimized assets
- Static HTML
- Ready for CDN

### Hosting Options

1. **Static Hosts**
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront

2. **CDN**
   - Cloudflare
   - Fastly

## Future Architecture

### Planned Improvements

1. **Module System**
   - Better code organization
   - Lazy loading
   - Dynamic imports

2. **State Management**
   - Centralized state
   - Time travel debugging
   - State snapshots

3. **Plugin System**
   - Custom entities
   - Mod support
   - Community extensions

4. **Networking**
   - Multiplayer support
   - Shared simulations
   - Leaderboards

---

## Summary

The architecture is designed to be:
- **Modular** - Easy to extend and modify
- **Performant** - Optimized for smooth gameplay
- **Maintainable** - Clear separation of concerns
- **Scalable** - Ready for future features

The system uses proven patterns and modern JavaScript features to create a robust, enjoyable simulation experience.
