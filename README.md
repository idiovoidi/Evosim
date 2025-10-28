# 🌍 Ecosystem Simulation - Web Edition

A browser-based ecosystem simulation featuring herbivores, predators, plants, fish, and birds with genetic evolution and emergent behaviors.

![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)
![Vite](https://img.shields.io/badge/vite-5.0+-646CFF.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- 🐰 **Herbivores** - Eat plants, flee from predators, evolve traits
- 🦊 **Predators** - Hunt herbivores, strategic behavior
- 🌿 **Plants** - Grow, reproduce, spread across terrain
- 🐟 **Fish** - Swim in water areas, unique aquatic behavior
- 🦅 **Birds** - Fly around, aerial hunting
- 🧬 **Genetic Evolution** - Traits mutate and evolve over generations
- 🗺️ **Procedural Terrain** - Multiple biomes with Perlin noise
- 💾 **Save/Load System** - Persistent game state with auto-save
- 📊 **Real-time Statistics** - Population graphs and analytics
- 🎮 **Interactive Tutorial** - Learn as you play

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The simulation will open automatically at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Controls

### Mouse
- **Click** - Select entity to view details
- **Hover** - Preview entity information
- **Drag** - Pan camera (if implemented)

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` or `P` | Pause/Resume simulation |
| `R` | Reset simulation |
| `Ctrl+S` | Save game |
| `H` | Show tutorial |
| `+` / `-` | Adjust simulation speed |

### UI Controls
- **Speed Slider** - Adjust from 0.1x to 5x speed
- **Zoom Slider** - Zoom from 0.5x to 3x
- **Pause Button** - Pause/resume simulation
- **Reset Button** - Start fresh simulation
- **Save/Load** - Manage game states

## 📁 Project Structure

```
.
├── src/
│   ├── core/           # Core simulation logic
│   │   ├── World.js           # Main world manager
│   │   ├── Entity.js          # Entity base class
│   │   ├── InputHandler.js   # Mouse/keyboard input
│   │   └── SaveSystem.js      # Save/load functionality
│   ├── entities/       # Entity types
│   │   ├── Herbivore.js
│   │   ├── Predator.js
│   │   ├── Plant.js
│   │   ├── Fish.js
│   │   └── Bird.js
│   ├── systems/        # Game systems
│   │   ├── TerrainSystem.js   # Terrain generation
│   │   ├── GeneticSystem.js   # Evolution mechanics
│   │   └── PhysicsSystem.js   # Movement & collision
│   ├── graphics/       # Rendering
│   │   └── Renderer.js        # Canvas rendering
│   ├── ui/             # User interface
│   │   ├── UI.js              # Main UI controller
│   │   ├── Tutorial.js        # Interactive tutorial
│   │   └── StatsGraph.js      # Population graphs
│   └── main.js         # Application entry point
├── index.html          # Main HTML file
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## 🧬 Genetic System

Entities inherit and evolve traits:

- **Speed** - Movement velocity
- **Size** - Visual size and collision
- **Sense Range** - Detection distance
- **Energy Efficiency** - Metabolism rate
- **Reproduction Rate** - Breeding frequency

Traits mutate during reproduction, creating evolutionary pressure and adaptation over time.

## 🗺️ Terrain System

Multiple biomes generated with Perlin noise:

- **Grassland** - Common, supports all species
- **Forest** - Dense vegetation, good for herbivores
- **Water** - Fish habitat
- **Savanna** - Open plains, predator territory
- **Mountains** - Impassable terrain

## 📊 Statistics & Analytics

Real-time tracking of:
- Population counts per species
- Birth and death rates
- Average genetic traits
- Ecosystem balance metrics
- Historical population graphs

## 🎨 Customization

### Adjust Initial Population

Edit `src/core/World.js`:
```javascript
const CONFIG = {
    INITIAL_HERBIVORES: 15,
    INITIAL_PREDATORS: 8,
    INITIAL_PLANTS: 40,
    INITIAL_FISH: 10,
    INITIAL_BIRDS: 5
};
```

### Modify Behavior

Edit entity files in `src/entities/`:
```javascript
// Example: Make herbivores faster
this.speed = 100; // Default: 80
this.fleeRange = 200; // Default: 150
```

### Change Terrain

Edit `src/systems/TerrainSystem.js`:
```javascript
// Adjust terrain generation
this.scale = 0.05; // Larger = bigger biomes
this.octaves = 4;  // More = more detail
```

## 🔧 Development

### Hot Module Replacement
Vite provides instant updates during development. Edit any file and see changes immediately.

### Debug Mode
Open browser DevTools (F12) to:
- View console logs
- Inspect entity states
- Monitor performance
- Debug issues

### Performance Profiling
```javascript
// In browser console
performance.mark('start');
// ... simulation runs ...
performance.mark('end');
performance.measure('simulation', 'start', 'end');
```

## 🚢 Deployment

### Static Hosting (Recommended)

Build and deploy to any static host:

```bash
npm run build
# Upload 'dist' folder to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3
# - Any static host
```

### GitHub Pages

```bash
# Build
npm run build

# Deploy to gh-pages branch
# (Use gh-pages package or manual deployment)
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🎯 Roadmap

### Planned Features
- [ ] Multiplayer/shared simulations
- [ ] Custom species creator
- [ ] Advanced statistics dashboard
- [ ] Seasonal weather system
- [ ] Day/night cycle
- [ ] Sound effects and music
- [ ] Mobile touch controls
- [ ] VR/AR support

### Performance Improvements
- [ ] Spatial partitioning (quadtree)
- [ ] Web Workers for physics
- [ ] WebGL rendering
- [ ] Entity pooling
- [ ] LOD system

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with Vite for blazing fast development
- Terrain generation using simplex-noise
- Inspired by natural ecosystem dynamics
- Entity-Component-System architecture

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design details
- **[QUICKSTART.md](QUICKSTART.md)** - Detailed getting started guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🐛 Known Issues

Check the [Issues](https://github.com/yourusername/ecosystem-simulation/issues) page for current bugs and feature requests.

## 💬 Support

- Open an issue for bugs
- Discussions for questions
- Pull requests for contributions

---

**Made with ❤️ using JavaScript and Vite**

Start your ecosystem: `npm run dev` 🚀
