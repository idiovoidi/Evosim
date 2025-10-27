# 🌍 Ecosystem Simulation - Web Edition

A browser-based ecosystem simulation featuring multiple species with genetic evolution, procedural terrain, and complex behaviors. Built with vanilla JavaScript and Vite.

## ✨ Features

### Species
- 🐰 **Herbivores** - Graze on plants, flee from predators
- 🦊 **Predators** - Hunt herbivores for survival
- 🌿 **Plants** - Grow and reproduce based on terrain
- 🐟 **Fish** - School together in water bodies
- 🦅 **Birds** - Soar and hunt from above

### Simulation Features
- 🧬 **Genetic Evolution** - Traits inherited and mutated across generations
- 🗺️ **Procedural Terrain** - Dynamic biomes (water, grass, forest, mountains, snow)
- 🎯 **Complex Behaviors** - Hunting, fleeing, foraging, schooling
- 📊 **Real-time Statistics** - Population tracking and entity details
- ⚡ **High Performance** - Optimized ECS architecture
- 🎮 **Interactive Controls** - Click entities, adjust speed and zoom

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The simulation will open automatically at `http://localhost:3000`

## 🎮 Controls

- **Click** on any entity to view detailed stats
- **Speed Slider** - Adjust simulation speed (0.1x - 5x)
- **Zoom Slider** - Change view scale (0.5x - 3x)
- **Pause Button** - Pause/resume simulation
- **Reset Button** - Restart with new terrain

## 🏗️ Architecture

### Entity-Component-System (ECS)

The simulation uses a clean ECS architecture for maximum performance and flexibility:

**Entities** - Simple containers with unique IDs
```javascript
const entity = new Entity();
entity.addComponent(ComponentType.POSITION, new Position(x, y));
```

**Components** - Pure data structures
- `Position` - World coordinates
- `Velocity` - Movement vector
- `Stats` - Energy, health, species
- `Genetics` - Inheritable traits
- `Traits` - Derived attributes
- `Status` - Current state

**Systems** - Logic processors
- `BehaviorSystem` - AI decision making
- `MovementSystem` - Physics updates
- `HealthSystem` - Energy and aging
- `ReproductionSystem` - Breeding logic

### Project Structure

```
.
├── src/
│   ├── core/
│   │   ├── Entity.js           # Entity and component definitions
│   │   ├── World.js            # World management
│   │   ├── EntityFactory.js    # Entity creation
│   │   ├── TerrainGenerator.js # Procedural terrain
│   │   └── InputHandler.js     # Mouse/keyboard input
│   ├── systems/
│   │   ├── BehaviorSystem.js   # AI behaviors
│   │   ├── MovementSystem.js   # Physics
│   │   ├── HealthSystem.js     # Energy/death
│   │   └── ReproductionSystem.js # Breeding
│   ├── graphics/
│   │   └── Renderer.js         # Canvas rendering
│   ├── ui/
│   │   └── UI.js               # Stats panel
│   └── main.js                 # Entry point
├── index.html                  # HTML template
├── package.json
└── vite.config.js
```

## 🧬 Genetic System

Each entity has genes that affect their traits:

- **Speed** - Movement velocity multiplier
- **Metabolism** - Energy consumption rate
- **Sense Radius** - Detection range
- **Size** - Visual and collision size
- **Attack Strength** - Damage multiplier (predators/birds)

Offspring inherit genes from both parents with random mutations, leading to natural selection over time.

## 🗺️ Terrain Types

The procedurally generated world includes:

- **Deep Water** 🌊 - Fish habitat
- **Water** 💧 - Shallow water
- **Sand** 🏖️ - Beach areas
- **Grass** 🌱 - Primary habitat
- **Forest** 🌲 - Dense vegetation
- **Mountain** ⛰️ - High elevation
- **Snow** ❄️ - Mountain peaks

## 🎯 Behavior Patterns

### Herbivores
1. Flee from nearby predators
2. Seek plants when hungry
3. Wander when safe and fed
4. Reproduce when energy is high

### Predators
1. Hunt herbivores when hungry
2. Chase and attack prey
3. Wander when satiated
4. Reproduce when energy is high

### Plants
1. Grow based on terrain quality
2. Reproduce asexually
3. Provide food for herbivores

### Fish
1. Stay in water bodies
2. School with nearby fish
3. Swim in coordinated patterns
4. Reproduce in groups

### Birds
1. Hunt fish and small herbivores
2. Soar across the map
3. Fast movement and wide vision
4. Reproduce when successful

## 🔧 Customization

### Adjust Initial Population

Edit `src/core/World.js`:
```javascript
this.config = {
    initialHerbivores: 20,
    initialPredators: 10,
    initialPlants: 60,
    initialFish: 15,
    initialBirds: 8
};
```

### Modify Behavior Parameters

Edit behavior classes in `src/systems/BehaviorSystem.js`:
```javascript
const senseRadius = 200 * traits.senseRadius;
vel.dx = (dx / dist) * 3 * traits.speed;
```

### Add New Species

1. Add config to `EntityFactory.speciesConfig`
2. Create behavior class in `BehaviorSystem.js`
3. Update UI in `index.html`
4. Add terrain preferences in `World.spawnEntityOnValidTerrain()`

## 📈 Performance

- Runs at 60 FPS with hundreds of entities
- Efficient spatial queries for nearby entities
- Optimized rendering with layer sorting
- Minimal memory allocation per frame

## 🌟 Expansion Ideas

- [ ] Seasonal weather changes
- [ ] Day/night cycle
- [ ] More species (insects, amphibians)
- [ ] Disease and immunity system
- [ ] Territory and pack behavior
- [ ] Food chain visualization
- [ ] Evolution timeline graph
- [ ] Save/load simulation state
- [ ] Multiplayer observation mode

## 🐛 Troubleshooting

**Simulation runs slowly**
- Reduce initial population in `World.js`
- Lower simulation speed
- Close other browser tabs

**Entities disappear quickly**
- Increase initial energy in `EntityFactory.js`
- Adjust metabolism rates in `HealthSystem.js`
- Increase food availability

**No entities spawning**
- Check browser console for errors
- Verify terrain generation is working
- Ensure valid spawn positions exist

## 📝 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

- Built with vanilla JavaScript for maximum compatibility
- Uses Simplex Noise for terrain generation
- Inspired by natural ecosystem dynamics
- ECS architecture for clean, maintainable code

---

**Enjoy watching evolution in action! 🌱➡️🐰➡️🦊**
