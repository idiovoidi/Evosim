# Migration Guide: Python to Web

## Overview

This ecosystem simulation has been successfully refactored from a PyQt6 desktop application to a modern web application running in the browser with Vite.

## What Changed

### Technology Stack

**Before (Python):**
- PyQt6 for GUI
- NumPy for math operations
- DEAP for genetic algorithms
- Perlin noise library

**After (JavaScript):**
- Vanilla JavaScript (ES6+)
- HTML5 Canvas for rendering
- Simplex Noise for terrain generation
- Vite for development and building

### Architecture

The core ECS (Entity-Component-System) architecture remains the same, but has been adapted to JavaScript:

- **Entities** - Still simple containers with components
- **Components** - Now JavaScript classes instead of Python dataclasses
- **Systems** - Same logic, different syntax

### New Features Added

1. **Additional Species:**
   - 🐟 Fish - School in water bodies
   - 🦅 Birds - Hunt from above with wide vision

2. **Enhanced Terrain:**
   - More biome types (deep water, sand, snow)
   - Better procedural generation
   - Terrain-specific behaviors

3. **Improved UI:**
   - Real-time statistics panel
   - Entity selection and inspection
   - Speed and zoom controls
   - Responsive design

4. **Better Performance:**
   - Optimized rendering
   - Efficient spatial queries
   - Smooth 60 FPS gameplay

## File Mapping

### Python → JavaScript

| Python File | JavaScript File | Notes |
|------------|----------------|-------|
| `entities/entity.py` | `src/core/Entity.js` | Core entity class |
| `components.py` | `src/core/Entity.js` | Component definitions |
| `systems/world.py` | `src/core/World.js` | World management |
| `factories/entity_factory.py` | `src/core/EntityFactory.js` | Entity creation |
| `systems/behavior_system.py` | `src/systems/BehaviorSystem.js` | AI behaviors |
| `systems/movement_system.py` | `src/systems/MovementSystem.js` | Physics |
| `systems/health_system.py` | `src/systems/HealthSystem.js` | Energy/death |
| `graphics/rendering_system.py` | `src/graphics/Renderer.js` | Canvas rendering |
| `gui/main_window.py` | `index.html` + `src/ui/UI.js` | User interface |
| `main.py` | `src/main.js` | Entry point |

## Running the Simulation

### Python Version (Old)
```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install PyQt6 numpy noise deap
python main.py
```

### Web Version (New)
```bash
npm install
npm run dev
```

Open browser to `http://localhost:3000`

## Key Differences

### Component Access

**Python:**
```python
pos = entity.get_component(ComponentType.POSITION)
pos.value[0] = x
pos.value[1] = y
```

**JavaScript:**
```javascript
const pos = entity.getComponent(ComponentType.POSITION);
pos.x = x;
pos.y = y;
```

### Vector Math

**Python (NumPy):**
```python
distance = np.linalg.norm(pos1.value - pos2.value)
```

**JavaScript:**
```javascript
const dx = pos1.x - pos2.x;
const dy = pos1.y - pos2.y;
const distance = Math.sqrt(dx * dx + dy * dy);
```

### Rendering

**Python (PyQt6):**
```python
painter.drawText(x, y, emoji)
```

**JavaScript (Canvas):**
```javascript
ctx.fillText(emoji, x, y);
```

## Benefits of Web Version

1. **Cross-Platform** - Runs on any device with a browser
2. **No Installation** - Just open the URL
3. **Easy Sharing** - Send a link to anyone
4. **Modern Tooling** - Hot reload, fast builds with Vite
5. **Deployment** - Can be hosted on any static site host
6. **Accessibility** - More people can access and enjoy

## Deployment Options

### Static Hosting (Free)

1. **Netlify**
   ```bash
   npm run build
   # Drag dist/ folder to Netlify
   ```

2. **Vercel**
   ```bash
   npm run build
   vercel --prod
   ```

3. **GitHub Pages**
   ```bash
   npm run build
   # Push dist/ to gh-pages branch
   ```

4. **Cloudflare Pages**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Output directory: `dist`

## Future Enhancements

### Planned Features
- [ ] Save/load simulation state to localStorage
- [ ] Export statistics as CSV
- [ ] Screenshot/video recording
- [ ] Mobile touch controls
- [ ] WebGL rendering for better performance
- [ ] WebWorkers for physics calculations
- [ ] Multiplayer observation mode
- [ ] Evolution timeline visualization

### Easy Additions
- More species (insects, amphibians, etc.)
- Weather system (rain, drought)
- Day/night cycle
- Seasonal changes
- Disease mechanics
- Territory system
- Pack/herd behavior

## Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.js
server: {
  port: 3001  // or any other port
}
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Slow Performance
- Reduce initial population in `src/core/World.js`
- Lower simulation speed with slider
- Close other browser tabs

## Contributing

The web version is easier to contribute to:
1. Fork the repository
2. Make changes
3. Test with `npm run dev`
4. Submit pull request

No Python environment setup needed!

## Conclusion

The web version maintains all the core functionality of the Python version while adding new features and making it more accessible. The ECS architecture translates cleanly to JavaScript, and the simulation runs smoothly in modern browsers.

**The ecosystem is now alive in your browser! 🌍**
