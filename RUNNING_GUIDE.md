# 🚀 Running the Ecosystem Simulation

You have **TWO versions** of the simulation available:

## 1. 🌐 Web Version (Browser-Based) - NOW RUNNING! ✅

**Status:** Running at http://localhost:3001/

### Access the Simulation:
Open your browser and go to:
```
http://localhost:3001/
```

### Features:
- ✅ Runs in any modern browser
- ✅ Interactive tutorial
- ✅ Save/Load functionality
- ✅ Real-time statistics graph
- ✅ Multiple species (herbivores, predators, plants, fish, birds)
- ✅ Zoom and speed controls
- ✅ Keyboard shortcuts

### Controls:
- **Space/P** - Pause/Resume
- **R** - Reset simulation
- **Ctrl+S** - Save game
- **H** - Show tutorial
- **+/-** - Adjust speed
- **Mouse** - Click entities for details

### To Stop the Web Server:
The dev server is running in the background. To stop it, use the VS Code terminal or run:
```bash
# Find the process and stop it from VS Code's terminal panel
```

---

## 2. 🖥️ Desktop Version (Python/PyQt6)

### Start the Desktop Version:

**Option A: VS Code Debugger (Recommended)**
```
Press F5
```
Select "Python: Ecosystem Simulation"

**Option B: Command Line**
```bash
python main.py
```

**Option C: Windows Batch Script**
```bash
run_simulation.bat
```

### Features:
- ✅ Native desktop application
- ✅ Full debugging support
- ✅ Breakpoint debugging
- ✅ Variable inspection
- ✅ Step-through code execution

### Desktop Controls:
- **Mouse Hover** - View entity details
- **Speed Dropdown** - Adjust simulation speed (0.5x - 10x)

---

## Which Version Should You Use?

### Use Web Version When:
- 🌐 You want quick access without setup
- 📊 You want the statistics graph
- 💾 You need save/load functionality
- 🎮 You prefer browser-based interaction
- 📱 You want to share with others easily

### Use Desktop Version When:
- 🐛 You need to debug the code
- 🔍 You want to inspect variables
- ⚙️ You're developing new features
- 🎯 You need breakpoint debugging
- 📝 You're modifying the Python code

---

## Current Status

### Web Version: ✅ RUNNING
- URL: http://localhost:3001/
- Dev Server: Active
- Hot Reload: Enabled

### Desktop Version: ✅ READY
- Python: 3.10.6
- Dependencies: Installed
- Debug Config: Ready
- Press F5 to start

---

## Quick Commands

### Web Version
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Desktop Version
```bash
# Run simulation
python main.py

# Run tests
python test_simulation.py

# Debug in VS Code
Press F5
```

---

## Troubleshooting

### Web Version Issues

**Port already in use?**
- Vite will automatically try another port (like 3001)
- Check the terminal output for the actual URL

**Module not found?**
- Run: `npm install`

**Blank screen?**
- Check browser console (F12) for errors
- Ensure all files in `src/` directory exist

### Desktop Version Issues

**Import errors?**
- Activate venv: `.venv\Scripts\activate`
- Install deps: `pip install -r requirements.txt`

**GUI won't open?**
- Verify PyQt6: `python -c "import PyQt6"`
- Check for errors in terminal

**No entities spawn?**
- Run: `python test_simulation.py`

---

## Next Steps

### For Web Version:
1. ✅ Open http://localhost:3001/ in your browser
2. Complete the interactive tutorial
3. Experiment with controls
4. Try saving and loading

### For Desktop Version:
1. Press F5 in VS Code
2. Set breakpoints in Python files
3. Use Debug Console to inspect variables
4. Step through code execution

---

## Documentation

- **[DEBUG_GUIDE.md](DEBUG_GUIDE.md)** - Desktop debugging guide
- **[QUICK_DEBUG_REFERENCE.md](QUICK_DEBUG_REFERENCE.md)** - Quick commands
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[README.md](README.md)** - Project overview

---

## 🎮 Ready to Go!

**Web Version:** http://localhost:3001/ (Open in browser now!)

**Desktop Version:** Press F5 in VS Code

Both versions are fully functional and ready to use! 🐰🦊🌿
