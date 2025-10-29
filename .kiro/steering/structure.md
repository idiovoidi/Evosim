# Project Structure

## Directory Organization

```
src/
├── core/           # Core simulation logic and entity management
├── systems/        # ECS systems (behavior, movement, health, reproduction, biome effects)
├── graphics/       # Rendering (Renderer, HeatmapRenderer, DebugRenderer, VisualIndicatorSystem)
├── ui/             # User interface components (panels, tooltips, notifications, graphs)
├── utils/          # Utilities (AdaptiveQualityManager, PerformanceConfig)
└── main.js         # Application entry point

systems/            # Python backend
├── simulation_manager.py
└── network_protocol.py

player_actions/     # Python player interaction handlers
└── entity_inspector.py

static/             # Static assets
└── js/             # Legacy/alternative JS files

dist/               # Production build output (generated)
node_modules/       # Dependencies (generated)
```

## Code Organization Patterns

### Entity-Component-System (ECS)

**Entities** (`src/core/Entity.js`):
- Base Entity class with component management
- Component types defined as constants (ComponentType)
- Component classes: Position, Velocity, Appearance, Stats, Status, Genetics, Traits, BiomeComponent, HabitatComponent

**Systems** (`src/systems/`):
- BehaviorSystem: AI decision-making and state machines
- MovementSystem: Position updates and physics
- HealthSystem: Energy consumption and death
- ReproductionSystem: Breeding and offspring creation
- BiomeEffectSystem: Terrain-based modifiers

**World** (`src/core/World.js`):
- Central manager coordinating all systems
- Entity lifecycle management
- QuadTree spatial partitioning for performance
- EntityPool for object reuse

### Rendering Pipeline

**Renderer** (`src/graphics/Renderer.js`):
- Canvas-based 2D rendering
- Camera system with zoom and pan
- Layer-based entity rendering
- Batching for performance optimization

**Specialized Renderers**:
- HeatmapRenderer: Population density visualization
- DebugRenderer: Development tools and overlays
- VisualIndicatorSystem: Entity state indicators

### UI Components

All UI components in `src/ui/`:
- UI.js: Main controller
- EntityInfoPanel.js: Selected entity details
- BiomeLegendPanel.js: Biome information display
- BiomeTooltip.js: Hover tooltips
- NotificationManager.js: Event notifications
- StatsGraph.js: Population history graphs
- PerformanceMonitor.js: FPS and performance tracking
- Tutorial.js: Interactive onboarding

## File Naming Conventions

- **PascalCase** for class files: `World.js`, `EntityFactory.js`, `BiomeGenerator.js`
- **camelCase** for utility files: `main.js`
- **SCREAMING_SNAKE_CASE** for constants files: `BiomeConstants.js`
- **snake_case** for Python files: `simulation_manager.py`, `network_protocol.py`

## Import/Export Pattern

Use ES6 named exports for classes:
```javascript
export class World { }
```

Import with explicit names:
```javascript
import { World } from './core/World.js';
```

Always include `.js` extension in imports.

## Performance Considerations

- QuadTree for spatial queries (O(log n) instead of O(n²))
- EntityPool for object reuse (reduce GC pressure)
- Adaptive quality system adjusts rendering based on FPS
- Batched rendering reduces draw calls
- Periodic QuadTree rebuilds (every 5 seconds)
