# 📁 Project Structure

## Overview

This project now contains both the original Python version and the new web version.

```
ecosystem-simulation/
├── 🐍 PYTHON VERSION (Original)
│   ├── animal_logic/          # Legacy animal classes
│   ├── behaviors/             # Behavior implementations
│   ├── entities/              # Entity management
│   ├── factories/             # Entity factory pattern
│   ├── graphics/              # PyQt6 rendering
│   ├── gui/                   # PyQt6 UI components
│   ├── systems/               # ECS systems
│   ├── components.py          # Component definitions
│   ├── constants.py           # Configuration
│   ├── main.py               # Python entry point
│   └── requirements.txt       # Python dependencies
│
├── 🌐 WEB VERSION (New)
│   ├── src/
│   │   ├── core/
│   │   │   ├── Entity.js           # Entity & components
│   │   │   ├── World.js            # World management
│   │   │   ├── EntityFactory.js    # Entity creation
│   │   │   ├── TerrainGenerator.js # Procedural terrain
│   │   │   └── InputHandler.js     # Mouse/keyboard
│   │   ├── systems/
│   │   │   ├── BehaviorSystem.js   # AI behaviors
│   │   │   ├── MovementSystem.js   # Physics
│   │   │   ├── HealthSystem.js     # Energy/death
│   │   │   └── ReproductionSystem.js # Breeding
│   │   ├── graphics/
│   │   │   └── Renderer.js         # Canvas rendering
│   │   ├── ui/
│   │   │   └── UI.js               # Stats panel
│   │   └── main.js                 # JS entry point
│   ├── index.html                  # HTML template
│   ├── package.json                # Node dependencies
│   └── vite.config.js              # Vite configuration
│
└── 📚 DOCUMENTATION
    ├── README.md                   # Original Python docs
    ├── WEB_README.md              # Web version guide
    ├── QUICK_START_WEB.md         # Quick start guide
    ├── MIGRATION_GUIDE.md         # Python → JS guide
    ├── EXPANSION_SUMMARY.md       # What's new
    ├── ARCHITECTURE.md            # System design
    ├── CHANGELOG.md               # Version history
    └── PROJECT_STRUCTURE.md       # This file
```

## 🐍 Python Version Files

### Core Systems
- `systems/world.py` - World state and entity management
- `systems/behavior_system.py` - AI behavior updates
- `systems/movement_system.py` - Physics and movement
- `systems/health_system.py` - Energy and death
- `systems/plant_system.py` - Plant growth
- `systems/map_system.py` - Terrain generation
- `systems/genetic_system.py` - Genetics and evolution

### Entity Management
- `entities/entity.py` - Base entity class
- `components.py` - Component definitions
- `factories/entity_factory.py` - Entity creation

### Behaviors
- `behaviors/base_behavior.py` - Abstract behavior
- `behaviors/herbivore_behavior.py` - Herbivore AI
- `behaviors/predator_behavior.py` - Predator AI
- `behaviors/plant_behavior.py` - Plant growth

### Graphics & UI
- `graphics/rendering_system.py` - Main renderer
- `graphics/animal_renderer.py` - Animal drawing
- `graphics/terrain_renderer.py` - Terrain drawing
- `gui/main_window.py` - Main window
- `gui/ecosystem_widget.py` - Canvas widget

### Configuration
- `constants.py` - Game constants
- `config.py` - Deprecated config

## 🌐 Web Version Files

### Core (`src/core/`)

#### `Entity.js`
- Entity class
- Component types enum
- All component classes:
  - Position, Velocity
  - Appearance, Stats
  - Status, Genetics, Traits

#### `World.js`
- World state management
- Entity lifecycle
- Spatial queries
- Statistics tracking
- Initial spawning

#### `EntityFactory.js`
- Species configurations
- Entity creation
- Genetic crossover
- Offspring generation

#### `TerrainGenerator.js`
- Simplex noise generation
- Biome determination
- Terrain queries
- Color mapping

#### `InputHandler.js`
- Mouse event handling
- Entity selection
- Click detection

### Systems (`src/systems/`)

#### `BehaviorSystem.js`
Contains 5 behavior classes:
- `HerbivoreBehavior` - Flee, eat, wander
- `PredatorBehavior` - Hunt, attack, wander
- `PlantBehavior` - Grow based on terrain
- `FishBehavior` - School, stay in water
- `BirdBehavior` - Hunt, soar, patrol

#### `MovementSystem.js`
- Position updates
- Velocity application
- Boundary wrapping

#### `HealthSystem.js`
- Energy consumption
- Age tracking
- Death conditions
- Cooldown management

#### `ReproductionSystem.js`
- Reproduction thresholds
- Mate finding
- Genetic crossover
- Asexual reproduction (plants)

### Graphics (`src/graphics/`)

#### `Renderer.js`
- Canvas rendering
- Terrain drawing
- Entity rendering
- Health bars
- Effects (hearts)
- Camera/zoom

### UI (`src/ui/`)

#### `UI.js`
- Statistics updates
- Entity info panel
- FPS counter
- Time tracking

### Entry Point

#### `main.js`
- Application initialization
- Game loop
- System coordination
- Control setup

## 📦 Configuration Files

### Web Version
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite configuration
- `index.html` - HTML template

### Python Version
- `requirements.txt` - Python dependencies
- `constants.py` - Game configuration

### Both
- `.gitignore` - Git ignore rules
- `README.md` - Documentation

## 🎯 Key Differences

| Aspect | Python | JavaScript |
|--------|--------|------------|
| **Entry** | `main.py` | `src/main.js` |
| **UI** | PyQt6 | HTML/Canvas |
| **Math** | NumPy | Native JS |
| **Rendering** | QPainter | Canvas 2D |
| **Components** | Dataclasses | ES6 Classes |
| **Modules** | Python imports | ES6 modules |

## 🔄 Shared Concepts

Both versions share:
- ECS architecture
- Component types
- System update order
- Behavior patterns
- Genetic algorithms
- Terrain generation
- Entity lifecycle

## 📊 File Sizes (Approximate)

### Python Version
- Total: ~50 files
- Code: ~5,000 lines
- Dependencies: PyQt6, NumPy, noise, DEAP

### Web Version
- Total: ~15 files
- Code: ~2,000 lines
- Dependencies: simplex-noise, vite

## 🚀 Running Each Version

### Python
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Web
```bash
npm install
npm run dev
```

## 🎨 Asset Organization

### Python
- Emojis rendered via PyQt6
- Colors in `components.py`
- No external assets

### Web
- Emojis rendered via Canvas
- Colors in `EntityFactory.js` and `TerrainGenerator.js`
- No external assets

## 🧪 Testing

### Python
- Manual testing via GUI
- No automated tests currently

### Web
- Manual testing via browser
- Can add Jest/Vitest for unit tests
- Can add Playwright for E2E tests

## 📈 Future Organization

Potential additions:
```
src/
├── assets/          # Images, sounds
├── tests/           # Unit tests
├── utils/           # Helper functions
├── config/          # Configuration files
└── types/           # TypeScript definitions
```

## 🔍 Finding Things

### To modify species behavior:
- Python: `behaviors/[species]_behavior.py`
- Web: `src/systems/BehaviorSystem.js`

### To change initial population:
- Python: `constants.py`
- Web: `src/core/World.js`

### To add new species:
- Python: `factories/entity_factory.py`
- Web: `src/core/EntityFactory.js`

### To adjust rendering:
- Python: `graphics/rendering_system.py`
- Web: `src/graphics/Renderer.js`

### To modify UI:
- Python: `gui/main_window.py`
- Web: `index.html` + `src/ui/UI.js`

## 📝 Notes

- Both versions can coexist
- Python version still fully functional
- Web version is the recommended version
- Documentation covers both versions
- Migration guide available

---

**Choose your version and start exploring! 🌍**
