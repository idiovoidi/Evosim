# Ecosystem Simulation - Architecture

## Overview
This is an Entity-Component-System (ECS) based ecosystem simulation built with PyQt6.

## Project Structure

```
.
├── behaviors/              # Entity behavior implementations
│   ├── base_behavior.py   # Abstract base behavior class
│   ├── herbivore_behavior.py
│   ├── predator_behavior.py
│   └── plant_behavior.py
├── entities/              # Entity management
│   └── entity.py         # Core Entity class
├── factories/            # Factory patterns for entity creation
│   └── entity_factory.py # EntityFactory for creating entities
├── systems/              # ECS Systems
│   ├── base_system.py   # Base system class
│   ├── behavior_system.py
│   ├── health_system.py
│   ├── movement_system.py
│   ├── plant_system.py
│   ├── ui_system.py
│   ├── world.py         # World management
│   ├── map_system.py    # Terrain and map generation
│   ├── genetic_system.py
│   └── event_effect_system.py
├── graphics/             # Rendering systems
│   ├── rendering_system.py
│   ├── animal_renderer.py
│   ├── terrain_renderer.py
│   └── effect_renderer.py
├── gui/                  # PyQt6 GUI components
│   ├── main_window.py
│   ├── ecosystem_widget.py
│   └── log_panel.py
├── components.py         # Component definitions
├── constants.py          # Game constants and configuration
├── config.py            # Deprecated - use constants.py
└── main.py              # Application entry point
```

## Core Concepts

### Entity-Component-System (ECS)

**Entities** are simple containers with a unique ID and a collection of components.

**Components** are pure data structures that define properties:
- `Position`: World coordinates
- `Velocity`: Movement vector
- `Stats`: Energy, health, age, species type
- `Appearance`: Visual representation
- `Genetics`: Genetic traits
- `Traits`: Derived attributes from genetics
- `Status`: Current state flags

**Systems** contain the logic that operates on entities with specific components:
- `BehaviorSystem`: Updates entity AI behaviors
- `MovementSystem`: Applies velocity to position
- `HealthSystem`: Manages energy, health, and death
- `PlantSystem`: Handles plant growth and reproduction
- `UISystem`: Manages UI rendering and interaction

### Behavior Pattern

Behaviors are separate from the ECS systems and handle entity-specific AI logic:

```python
class BaseBehavior(ABC):
    def update(self, dt: float):
        """Update behavior logic"""
        pass
```

Each species has its own behavior implementation:
- `HerbivoreBehavior`: Flee from predators, seek food, wander
- `PredatorBehavior`: Hunt herbivores, wander
- `PlantBehavior`: Passive growth

### Factory Pattern

The `EntityFactory` creates fully initialized entities with all required components:

```python
entity = EntityFactory.create_entity(
    species_type='herbivore',
    position=(100, 100),
    genetics=None  # Auto-generated if not provided
)
```

## System Update Order

1. **BehaviorSystem** - AI decisions and actions
2. **MovementSystem** - Apply velocities to positions
3. **HealthSystem** - Energy drain, death checks
4. **PlantSystem** - Growth and reproduction
5. **UISystem** - Update UI state
6. **RenderingSystem** - Draw everything

## Key Features

### Genetic System
- Uses DEAP library for genetic algorithms
- Traits are inherited and mutated during reproduction
- Genes affect speed, metabolism, sense radius, etc.

### Terrain System
- Procedurally generated using Perlin noise
- Multiple biome types (grassland, forest, desert, water, etc.)
- Terrain affects entity spawning and movement

### Visual Effects
- Heart effects for reproduction
- Bone effects for death
- Eating particle effects

## Configuration

All game constants are defined in `constants.py`:
- Population sizes
- Energy thresholds
- Movement speeds
- Detection ranges
- Simulation timing

## Adding New Species

1. Add species config to `EntityFactory.SPECIES_CONFIG`
2. Create behavior class extending `BaseBehavior`
3. Add behavior class to `World.BEHAVIOR_CLASSES`
4. Define valid terrain types in `World.VALID_TERRAINS`
5. Add genetic traits to `EnhancedGeneticSystem.TRAIT_DEFINITIONS`

## Performance Considerations

- Fixed timestep simulation (60 FPS)
- Spatial queries for nearby entities
- Efficient component lookups
- Lazy evaluation where possible

## Future Improvements

- Quadtree spatial partitioning for better performance
- More complex behavior trees
- Seasonal changes and weather
- Predator-prey population dynamics tuning
- Save/load simulation state
- Statistics and graphs
