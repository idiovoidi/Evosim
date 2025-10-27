# Debugging Guide - Ecosystem Simulation

## Quick Start

### Running the Simulation

**Option 1: Direct Python Execution**
```bash
python main.py
```

**Option 2: VS Code Debugger (Recommended)**
1. Press `F5` or go to Run > Start Debugging
2. Select "Python: Ecosystem Simulation" from the dropdown
3. The simulation window will open with full debugging support

### Debug Configurations

Two debug configurations are available in `.vscode/launch.json`:

1. **Python: Ecosystem Simulation** (Default)
   - Standard debugging mode
   - Only debugs your code (justMyCode: true)
   - Best for normal development

2. **Python: Ecosystem Simulation (Debug Mode)**
   - Full debugging including libraries
   - Unbuffered output for real-time logs
   - Best for deep troubleshooting

## Debugging Features

### Breakpoints
Set breakpoints in any Python file:
- Click left of line number in editor
- Or press `F9` on the line
- Execution will pause at breakpoints

### Key Files to Debug

**Core Systems:**
- `systems/world.py` - Main world logic
- `systems/map_system.py` - Terrain generation
- `systems/genetic_system.py` - Evolution mechanics

**Entity Behavior:**
- `behaviors/herbivore_behavior.py` - Herbivore AI
- `behaviors/predator_behavior.py` - Predator AI
- `behaviors/plant_behavior.py` - Plant growth

**Entity Management:**
- `entities/entity.py` - Entity base class
- `factories/entity_factory.py` - Entity creation

**UI:**
- `gui/main_window.py` - Main window
- `gui/simulation_widget.py` - Rendering

### Debug Console Commands

While debugging, use the Debug Console to inspect:
```python
# Check world state
world.stats

# List all entities
len(world.entities)

# Get herbivores
[e for e in world.entities if e.has_component(ComponentType.STATS) and e.get_component(ComponentType.STATS).species_type == 'herbivore']

# Check specific entity
entity = world.entities[0]
entity.get_component(ComponentType.POSITION).value
entity.get_component(ComponentType.STATS).energy
```

## Testing

### Quick Test
```bash
python test_simulation.py
```

This verifies:
- All imports work correctly
- World can be created
- Entities spawn properly
- Systems initialize

### Manual Testing Checklist
- [ ] Herbivores move and eat plants
- [ ] Predators hunt herbivores
- [ ] Plants grow and reproduce
- [ ] Entities reproduce when energy is high
- [ ] Entities die when energy depletes
- [ ] Terrain displays correctly
- [ ] Statistics update in real-time
- [ ] Speed controls work

## Common Issues

### Issue: "ModuleNotFoundError"
**Solution:** Ensure virtual environment is activated and dependencies installed
```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: Simulation runs slowly
**Solution:** 
- Reduce initial population in `constants.py`
- Lower `INITIAL_HERBIVORES`, `INITIAL_PREDATORS`, `INITIAL_PLANTS`

### Issue: Entities not spawning
**Solution:**
- Check terrain generation in `systems/map_system.py`
- Verify spawn logic in `systems/world.py::spawn_initial_entities()`

### Issue: GUI doesn't open
**Solution:**
- Verify PyQt6 is installed: `python -c "import PyQt6"`
- Check for errors in `gui/main_window.py`

## Performance Profiling

### Using cProfile
```bash
python -m cProfile -o profile.stats main.py
```

### Analyze results
```python
import pstats
p = pstats.Stats('profile.stats')
p.sort_stats('cumulative')
p.print_stats(20)
```

## Logging

Add debug logging to any file:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
```

## VS Code Tips

### Useful Shortcuts
- `F5` - Start debugging
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Ctrl+Shift+F5` - Restart debugging
- `Shift+F5` - Stop debugging

### Watch Expressions
Add expressions to watch in the Debug sidebar:
- `world.stats`
- `len(world.entities)`
- `world.map_width`
- `world.map_height`

### Conditional Breakpoints
Right-click breakpoint > Edit Breakpoint > Add condition:
```python
entity.get_component(ComponentType.STATS).energy < 10
```

## Next Steps

1. Run `python test_simulation.py` to verify setup
2. Press `F5` to start debugging
3. Set breakpoints in files you want to inspect
4. Use Debug Console to explore runtime state
5. Check `ARCHITECTURE.md` for system design details

## Resources

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [QUICKSTART.md](QUICKSTART.md) - Feature guide
- [constants.py](constants.py) - Configuration values
- [PyQt6 Docs](https://www.riverbankcomputing.com/static/Docs/PyQt6/)
