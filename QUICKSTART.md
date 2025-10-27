# Quick Start Guide

## Running the Simulation

```bash
python main.py
```

## Project Overview

This is an ecosystem simulation featuring:
- **Herbivores** (🐰) that eat plants and flee from predators
- **Predators** (🦊) that hunt herbivores
- **Plants** (🌿) that grow and reproduce

## Key Files

- `main.py` - Entry point
- `constants.py` - Tune simulation parameters here
- `ARCHITECTURE.md` - Detailed architecture documentation
- `REFACTORING_SUMMARY.md` - What was improved

## Customizing the Simulation

### Change Population Sizes

Edit `constants.py`:
```python
INITIAL_HERBIVORES = 15  # Change this
INITIAL_PREDATORS = 8    # Change this
INITIAL_PLANTS = 40      # Change this
```

### Adjust Movement Speeds

Edit `constants.py`:
```python
HERBIVORE_WANDER_SPEED = 50
HERBIVORE_CHASE_SPEED = 80
PREDATOR_WANDER_SPEED = 60
PREDATOR_CHASE_SPEED = 120
```

### Modify Energy Levels

Edit `constants.py`:
```python
HERBIVORE_MAX_ENERGY = 200
PREDATOR_MAX_ENERGY = 250
PLANT_MAX_ENERGY = 100
```

## Adding a New Species

1. **Add species config** to `factories/entity_factory.py`:
```python
SPECIES_CONFIG = {
    'my_species': {
        'emoji': '🦌',
        'color': QColor(180, 150, 120),
        'max_energy': 180,
        'initial_energy': 140,
        'layer': 1,
    }
}
```

2. **Create behavior** in `behaviors/my_species_behavior.py`:
```python
from .base_behavior import BaseBehavior

class MySpeciesBehavior(BaseBehavior):
    def update(self, dt: float):
        # Your AI logic here
        pass
```

3. **Register behavior** in `systems/world.py`:
```python
BEHAVIOR_CLASSES = {
    'my_species': MySpeciesBehavior,
}
```

4. **Define valid terrain** in `systems/world.py`:
```python
VALID_TERRAINS = {
    'my_species': [TerrainType.GRASSLAND, TerrainType.FOREST],
}
```

## Controls

- **Mouse hover** - View entity information
- **Speed control** - Use dropdown in toolbar (0.5x to 10x)

## Understanding the Code

### Entity-Component-System (ECS)

**Entities** are just IDs with components attached:
```python
entity = Entity()
entity.add_component(ComponentType.POSITION, Position([100, 100]))
```

**Components** are data containers:
```python
class Stats:
    def __init__(self, energy, max_energy, species_type):
        self.energy = energy
        self.max_energy = max_energy
        self.species_type = species_type
```

**Systems** process entities with specific components:
```python
class MovementSystem(BaseSystem):
    def update(self, dt):
        for entity in self.world.get_entities_by_type(ComponentType.VELOCITY):
            # Update position based on velocity
```

### Creating Entities

Use the factory:
```python
from factories.entity_factory import EntityFactory

entity = EntityFactory.create_entity(
    species_type='herbivore',
    position=(100, 200)
)
```

### Implementing Behaviors

Extend `BaseBehavior`:
```python
from behaviors.base_behavior import BaseBehavior

class MyBehavior(BaseBehavior):
    def update(self, dt: float):
        pos = self.get_position()
        stats = self.get_stats()
        
        # Your logic here
        if stats.energy < 50:
            self.wander(speed=30)
```

## Troubleshooting

### Simulation runs too fast/slow
Adjust speed in the toolbar or modify `BASE_FPS` in `constants.py`

### Entities not spawning
Check terrain types - entities only spawn on valid terrain

### Performance issues
- Reduce initial population in `constants.py`
- Decrease detection ranges
- Lower map size in `World.__init__()`

## Development

### Running Tests
```bash
# Add tests in tests/ directory
python -m pytest
```

### Code Style
```bash
# Format code
black .

# Type checking
mypy .
```

### Dependencies
```bash
pip install PyQt6 numpy noise deap
```

## Resources

- **ARCHITECTURE.md** - Detailed system design
- **REFACTORING_SUMMARY.md** - Recent improvements
- **constants.py** - All tunable parameters
