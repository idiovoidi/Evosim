# Quick Debug Reference Card

## Start Simulation
| Method | Command |
|--------|---------|
| **VS Code Debug** | Press `F5` |
| **Command Line** | `python main.py` |
| **Batch Script** | `run_simulation.bat` |
| **Test Only** | `python test_simulation.py` |

## Debug Shortcuts
| Action | Shortcut |
|--------|----------|
| Start/Continue | `F5` |
| Step Over | `F10` |
| Step Into | `F11` |
| Step Out | `Shift+F11` |
| Stop | `Shift+F5` |
| Restart | `Ctrl+Shift+F5` |

## Key Breakpoint Locations
```python
# Core Logic
systems/world.py:update()              # Main update loop
systems/world.py:spawn_initial_entities()  # Entity spawning

# Behavior
behaviors/herbivore_behavior.py:update()  # Herbivore AI
behaviors/predator_behavior.py:update()   # Predator AI

# GUI
gui/main_window.py:__init__()         # Window setup
gui/ecosystem_widget.py:update_world()    # Render loop
```

## Debug Console Quick Commands
```python
# Population stats
world.stats

# Count entities
len(world.entities)

# Get herbivores
herbivores = [e for e in world.entities if e.has_component(ComponentType.STATS) and e.get_component(ComponentType.STATS).species_type == 'herbivore']

# Check entity
entity = world.entities[0]
entity.get_component(ComponentType.POSITION).value
entity.get_component(ComponentType.STATS).energy
entity.get_component(ComponentType.STATS).species_type

# Map info
world.map_width, world.map_height
world.world_map.tiles
```

## Common Issues
| Problem | Solution |
|---------|----------|
| Module not found | `pip install -r requirements.txt` |
| Slow performance | Reduce population in `constants.py` |
| No entities spawn | Check `test_simulation.py` output |
| GUI won't open | Verify: `python -c "import PyQt6"` |

## Configuration Files
| File | Purpose |
|------|---------|
| `constants.py` | Simulation parameters |
| `.vscode/launch.json` | Debug configs |
| `requirements.txt` | Dependencies |

## Quick Tweaks
```python
# In constants.py

# More entities
INITIAL_HERBIVORES = 30
INITIAL_PREDATORS = 15
INITIAL_PLANTS = 80

# Faster action
HERBIVORE_CHASE_SPEED = 120
PREDATOR_CHASE_SPEED = 180

# Longer lives
HERBIVORE_MAX_ENERGY = 300
PREDATOR_MAX_ENERGY = 400
```

## Status Check
```bash
# Verify setup
python test_simulation.py

# Check Python
python --version

# Check packages
python -c "import PyQt6, numpy, noise, deap; print('All OK')"
```

## Current Setup
- ✅ Python 3.10.6
- ✅ Virtual environment active
- ✅ All dependencies installed
- ✅ 63 entities spawn successfully
- ✅ Map: 2000x1600 pixels (50x40 tiles)
- ✅ Debug configs ready

**Press F5 to start!** 🚀
