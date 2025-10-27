# 🌍 Ecosystem Simulation - START HERE

## Welcome! 👋

You've just discovered a browser-based ecosystem simulation featuring 5 species with genetic evolution, procedural terrain, and complex behaviors.

## ⚡ Quick Start (2 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Simulation
```bash
npm run dev
```

### Step 3: Open Your Browser
Go to: **http://localhost:3000**

That's it! The simulation is now running. 🎉

## 🎮 What You'll See

### The Canvas (Left Side)
- 🗺️ **Procedurally generated terrain** with 7 biome types
- 🐰 **Herbivores** (rabbits) grazing and fleeing
- 🦊 **Predators** (foxes) hunting
- 🌿 **Plants** growing and reproducing
- 🐟 **Fish** schooling in water
- 🦅 **Birds** soaring and hunting

### The Sidebar (Right Side)
- **Population counts** for each species
- **Statistics** (FPS, time, total entities)
- **Controls** (pause, reset, speed, zoom)
- **Entity inspector** (click any creature to see details)

## 🎯 Try These First

1. **Watch for 30 seconds** - Observe the ecosystem dynamics
2. **Click on a creature** - See its stats, energy, and traits
3. **Adjust the speed** - Try 3x to see evolution faster
4. **Click Reset** - Generate new terrain and start fresh
5. **Zoom in** - Get a closer look at individual behaviors

## 🌟 Cool Things to Notice

- 🐰 Herbivores **flee** when predators get close
- 🦊 Predators **chase** and attack prey
- 🐟 Fish **school together** in water bodies
- 🦅 Birds **hunt from above** with wide vision
- 💕 **Hearts appear** when creatures reproduce
- 🧬 **Traits vary** between individuals (click to see)
- 📊 **Populations cycle** based on food availability

## 📚 Next Steps

### Learn More
- **[WEB_README.md](WEB_README.md)** - Complete feature guide
- **[EXPANSION_SUMMARY.md](EXPANSION_SUMMARY.md)** - What's new
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - All docs

### Customize
- **[WEB_README.md#customization](WEB_README.md#customization)** - Modify species
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Code organization

### Deploy
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Host it online

## 🎨 Features at a Glance

### Species (5 Total)
- 🐰 Herbivores - Eat plants, flee predators
- 🦊 Predators - Hunt herbivores
- 🌿 Plants - Grow based on terrain
- 🐟 Fish - School in water (NEW!)
- 🦅 Birds - Hunt from above (NEW!)

### Terrain (7 Types)
- 🌊 Deep Water
- 💧 Water
- 🏖️ Sand
- 🌱 Grass
- 🌲 Forest
- ⛰️ Mountain
- ❄️ Snow

### Genetics
- Traits inherited from parents
- Random mutations
- Natural selection
- Evolution over time

### Controls
- **Pause/Resume** - Stop/start simulation
- **Reset** - New terrain and entities
- **Speed** - 0.1x to 5x
- **Zoom** - 0.5x to 3x

## 🚀 Build for Production

```bash
npm run build
```

Output in `dist/` folder - ready to deploy!

## 🐛 Troubleshooting

### Nothing shows up?
- Check browser console (F12)
- Refresh the page
- Make sure `npm install` completed

### Runs slowly?
- Reduce speed slider
- Close other tabs
- Try Chrome/Edge

### Entities die quickly?
- This is normal! Ecosystem is harsh
- Watch population cycles
- Click Reset to try again

## 💡 Pro Tips

1. **Speed up time** to see evolution (3-5x)
2. **Click entities** to see genetic traits
3. **Watch the food chain** - plants → herbivores → predators
4. **Notice patterns** - populations cycle naturally
5. **Try different terrain** - click Reset multiple times

## 🎓 Understanding the Simulation

### Food Chain
```
Plants 🌿
  ↓ (eaten by)
Herbivores 🐰
  ↓ (hunted by)
Predators 🦊

Fish 🐟 ← (hunted by) → Birds 🦅 → Herbivores 🐰
```

### Energy System
- All creatures need energy to survive
- Energy decreases over time (metabolism)
- Eating restores energy
- Low energy = death
- High energy = reproduction

### Genetics
- Each creature has unique genes
- Genes affect: speed, metabolism, senses, size
- Offspring inherit parent genes
- Random mutations occur
- Better traits = survival advantage

## 🌐 Share Your Simulation

Deploy to free hosting:
```bash
# Netlify
npm run build
netlify deploy --prod --dir=dist

# Or drag dist/ folder to netlify.com/drop
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more options.

## 📊 What Makes This Special?

✅ **No installation** - Runs in browser
✅ **Cross-platform** - Works everywhere
✅ **Real evolution** - Genetic algorithms
✅ **Complex behaviors** - Hunting, fleeing, schooling
✅ **Procedural terrain** - Infinite variety
✅ **Interactive** - Click and inspect
✅ **Customizable** - Easy to modify
✅ **Open source** - Free to use and share

## 🎯 Quick Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
netlify deploy       # Deploy to Netlify
vercel deploy        # Deploy to Vercel
```

## 📖 Documentation

- **[QUICK_START_WEB.md](QUICK_START_WEB.md)** - Detailed quick start
- **[WEB_README.md](WEB_README.md)** - Complete guide
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - All docs
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical details

## 🤝 Contributing

Want to add features?

1. Fork the repository
2. Make changes
3. Test with `npm run dev`
4. Submit pull request

Ideas:
- New species
- Weather system
- Day/night cycle
- More terrain types
- Sound effects

## 🎊 Have Fun!

This simulation is:
- **Educational** - Learn about ecosystems
- **Entertaining** - Watch life evolve
- **Experimental** - Try different settings
- **Extensible** - Add your own features

## 🌟 What's Next?

1. ✅ Run the simulation
2. ✅ Observe for a few minutes
3. ✅ Click on creatures
4. ✅ Try different speeds
5. ✅ Read the documentation
6. ✅ Customize it
7. ✅ Deploy and share

---

## 🚀 Ready? Let's Go!

```bash
npm install
npm run dev
```

**Open http://localhost:3000 and watch evolution in action!**

---

**Questions?** Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

**Want to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md)

**Need help?** Read [WEB_README.md](WEB_README.md)

---

*Built with ❤️ using JavaScript, HTML5 Canvas, and Vite*

**Enjoy the simulation! 🌍✨**
