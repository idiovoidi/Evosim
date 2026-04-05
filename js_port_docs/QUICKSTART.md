# 🚀 Quick Start Guide

Get your ecosystem simulation running in 2 minutes!

## Prerequisites

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **Modern Browser** - Chrome, Firefox, Edge, or Safari

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Vite (build tool)
- simplex-noise (terrain generation)

### 2. Start Development Server

```bash
npm run dev
```

The simulation will automatically open at `http://localhost:3000`

**That's it!** 🎉

## First Time Setup

### Interactive Tutorial

When you first open the simulation, an interactive tutorial will guide you through:

1. **Understanding the Ecosystem**
   - Different species and their behaviors
   - How entities interact
   - Genetic evolution basics

2. **Using Controls**
   - Pause/resume simulation
   - Adjust speed and zoom
   - Select entities for details

3. **Statistics Panel**
   - Population counts
   - Historical graphs
   - Ecosystem metrics

4. **Save/Load System**
   - Saving your progress
   - Loading saved games
   - Auto-save feature

### Skip Tutorial

Press `Esc` or click "Skip Tutorial" to start immediately.

## Basic Controls

### Essential Shortcuts

```
Space / P  →  Pause/Resume
R          →  Reset simulation
Ctrl+S     →  Save game
H          →  Show tutorial
+/-        →  Adjust speed
```

### Mouse Controls

- **Click entity** - View detailed stats
- **Hover** - Quick preview
- **Click background** - Deselect

## Understanding the Simulation

### Species

| Icon | Species | Behavior |
|------|---------|----------|
| 🐰 | Herbivore | Eats plants, flees predators |
| 🦊 | Predator | Hunts herbivores |
| 🌿 | Plant | Grows and reproduces |
| 🐟 | Fish | Swims in water |
| 🦅 | Bird | Flies around |

### Energy System

- All entities have **energy**
- Energy depletes over time
- Eating restores energy
- Low energy = death
- High energy = reproduction

### Genetic Evolution

Entities pass traits to offspring:
- **Speed** - How fast they move
- **Size** - Visual size
- **Sense Range** - Detection distance
- **Efficiency** - Energy consumption

Traits mutate slightly each generation, creating evolution!

## Sidebar Overview

### Population Stats
Real-time count of each species

### Statistics
- Total entities
- FPS (performance)
- Time elapsed

### Population History Graph
Visual representation of population changes over time

### Controls
- **Pause** - Stop/start simulation
- **Reset** - Start fresh
- **Save** - Save current state
- **Load** - Load saved state
- **Tutorial** - Restart tutorial

### Sliders
- **Speed** - 0.1x to 5x simulation speed
- **Zoom** - 0.5x to 3x zoom level

## Tips for Beginners

### 1. Start Slow
Set speed to 0.5x to observe behaviors clearly

### 2. Watch Interactions
Click entities to see their stats and understand their decisions

### 3. Observe Patterns
- Predator-prey cycles
- Plant growth patterns
- Genetic trait changes

### 4. Experiment
- Try different speeds
- Reset and compare runs
- Save interesting states

### 5. Use the Graph
The population history shows ecosystem balance over time

## Common Questions

### Why do populations fluctuate?
This is natural predator-prey dynamics! Populations cycle:
1. Plants grow → Herbivores thrive
2. Herbivores increase → Predators thrive
3. Predators increase → Herbivores decline
4. Herbivores decline → Predators decline
5. Cycle repeats

### What if a species goes extinct?
The ecosystem will rebalance. You can reset to try again or let it evolve naturally.

### How does evolution work?
Each reproduction creates offspring with slightly mutated traits. Over time, beneficial traits become more common.

### Can I save my progress?
Yes! Click "💾 Save" or press Ctrl+S. The game auto-saves every 30 seconds.

## Advanced Features

### Speed Control
- **0.1x-0.5x** - Observe details
- **1x** - Normal speed
- **2x-5x** - See long-term patterns

### Zoom Control
- **0.5x** - See entire ecosystem
- **1x** - Normal view
- **2x-3x** - Focus on specific area

### Save System
- **Manual Save** - Click save button
- **Auto-Save** - Every 30 seconds
- **Load** - Restore saved state
- **Persistent** - Survives page refresh

## Troubleshooting

### Simulation won't start?

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Performance issues?

1. Close other browser tabs
2. Reduce zoom level
3. Lower simulation speed
4. Check FPS in sidebar

### Blank screen?

1. Open DevTools (F12)
2. Check Console for errors
3. Refresh page (Ctrl+R)
4. Clear browser cache

### Port already in use?

Vite will automatically try another port (3001, 3002, etc.)
Check terminal output for actual URL.

## Next Steps

### Customize the Simulation

Edit `src/core/World.js` to change:
- Initial population counts
- World size
- Spawn rates

### Add New Features

Check out:
- `src/entities/` - Entity behaviors
- `src/systems/` - Game systems
- `src/graphics/` - Rendering

### Learn the Architecture

Read `ARCHITECTURE.md` for detailed system design

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build
rm -rf dist && npm run build
```

## Getting Help

- Check `README.md` for full documentation
- Read `ARCHITECTURE.md` for technical details
- Open browser DevTools (F12) for debugging
- Check console for error messages

## Have Fun! 🎮

The simulation is designed to be:
- **Educational** - Learn about ecosystems
- **Entertaining** - Watch emergent behaviors
- **Experimental** - Try different scenarios

Enjoy watching your ecosystem evolve! 🐰🦊🌿🐟🦅

---

**Ready to start?**

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser!
