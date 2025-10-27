# Ecosystem Simulation

A Python-based ecosystem simulation featuring herbivores, predators, and plants with genetic evolution, built using Entity-Component-System (ECS) architecture and PyQt6.

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![PyQt6](https://img.shields.io/badge/PyQt6-6.0+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🐰 **Herbivores** that eat plants and flee from predators
- 🦊 **Predators** that hunt herbivores
- 🌿 **Plants** that grow and reproduce
- 🧬 **Genetic System** with trait inheritance and mutation
- 🗺️ **Procedural Terrain** generation with multiple biomes
- ⚡ **ECS Architecture** for performance and flexibility
- 🎨 **Visual Effects** for eating, reproduction, and death
- 📊 **Real-time Statistics** and population tracking

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ecosystem-simulation

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install PyQt6 numpy noise deap
```

### Running

```bash
python main.py
```

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started quickly
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and architecture
- **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)** - Recent improvements
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## Project Structure

```
.
├── behaviors/              # Entity AI behaviors
├── entities/              # Entity management
├── factories/             # Entity creation patterns
├── systems/               # ECS systems
├── graphics/              # Rendering systems
├── gui/                   # PyQt6 interface
├── components.py          # Component definitions
├── constants.py           # Configuration
└── main.py               # Entry point
```

## Customization

### Adjust Population

Edit `constants.py`:
```python
INITIAL_HERBIVORES = 15
INITIAL_PREDATORS = 8
INITIAL_PLANTS = 40
```

### Modify Behavior

Edit `constants.py`:
```python
HERBIVORE_CHASE_SPEED = 80
PREDATOR_HUNT_RANGE = 400
```

### Add New Species

See [QUICKSTART.md](QUICKSTART.md#adding-a-new-species) for detailed instructions.

## Architecture

This project uses **Entity-Component-System (ECS)** architecture:

- **Entities**: Containers with unique IDs
- **Components**: Data structures (Position, Velocity, Stats, etc.)
- **Systems**: Logic that operates on entities with specific components

### Key Systems

- `BehaviorSystem` - AI decision making
- `MovementSystem` - Physics and movement
- `HealthSystem` - Energy and death
- `PlantSystem` - Growth and reproduction
- `RenderingSystem` - Visual display

## Controls

- **Mouse Hover** - View entity details
- **Speed Control** - Adjust simulation speed (0.5x - 10x)

## Development

### Code Style

```bash
# Format code
black .

# Type checking
mypy .
```

### Testing

```bash
python -m pytest
```

### Adding Features

1. Create new behavior in `behaviors/`
2. Add species config to `factories/entity_factory.py`
3. Register in `systems/world.py`
4. Update constants in `constants.py`

## Performance

- Fixed 60 FPS timestep
- Efficient spatial queries
- Optimized component lookups
- Configurable population limits

## Dependencies

- **PyQt6** - GUI framework
- **NumPy** - Numerical operations
- **noise** - Procedural terrain generation
- **DEAP** - Genetic algorithms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with Entity-Component-System architecture
- Inspired by natural ecosystem dynamics
- Uses DEAP for genetic algorithms
- Terrain generation with Perlin noise

## Roadmap

### Planned Features
- [ ] Quadtree spatial partitioning
- [ ] Save/load simulation state
- [ ] Statistics graphs and charts
- [ ] More species types
- [ ] Seasonal changes
- [ ] Weather systems
- [ ] Behavior trees for complex AI

### Future Ideas
- [ ] 3D visualization
- [ ] Machine learning behaviors
- [ ] Multiplayer/networked simulation
- [ ] Mobile version

## Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check documentation in `/docs`
- Review ARCHITECTURE.md for technical details

## Recent Updates

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Latest Refactoring
- ✅ Factory pattern for entity creation
- ✅ Unified behavior system
- ✅ Constants management
- ✅ Improved error handling
- ✅ Comprehensive documentation
- ✅ Type hints and validation

---

**Made with ❤️ using Python and PyQt6**
