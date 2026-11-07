# Project Structure

## Directory Organization

```
src/
├── main.js            # Entry point: creates the App
├── app/               # Browser composition root (App) and SaveManager
├── config/            # Data only: defaults, species archetypes, genes, biomes
├── errors/            # EvosimError hierarchy
├── utils/             # decorators, math, random, color, EventBus, Profiler
├── sim/               # Headless simulation (no DOM; runs in Node)
│   ├── Simulation.js  # Builds the world and runs systems on a fixed timestep
│   ├── World.js       # Creature/corpse storage, spawning, spatial indices
│   ├── Clock.js       # Day/night and seasons
│   ├── SpatialHash.js
│   ├── terrain/       # TerrainGenerator, Terrain, VegetationField, distanceField
│   ├── genetics/      # Genome (crossover/mutation), Phenotype (gene trade-offs)
│   ├── creatures/     # Creature composed of Needs, Lifecycle, Mind, Record parts
│   ├── behavior/      # Utility-AI Brain, Perception, behaviours, steering
│   ├── systems/       # Movement, Metabolism, Reproduction, Decomposition, Immigration
│   ├── stats/         # StatsRecorder (history) and EventDetector (notices)
│   └── persistence/   # Snapshot save/load (terrain regenerated from seed)
├── render/            # Canvas renderer, Camera, Minimap
│   ├── terrain/       # TerrainPainter bakes ground/canopy/shimmer once per world
│   └── layers/        # Vegetation, creatures, particles, lighting, overlays
├── ui/                # DOM HUD: TopBar, PopulationPanel, Inspector, Toasts, dialogs
│   └── charts/        # LineChart and sparklines
├── input/             # InputController (pointer, wheel, keyboard)
└── styles/main.css

scripts/headless.js    # Run the sim in Node and print a population report
tests/                 # node:test suites (npm test)
```

Python files under `systems/` and `player_actions/` are legacy and unused by the JS app.

## Code Organization Patterns

### Composition over inheritance
- `Creature` owns plain part objects (`Needs`, `Lifecycle`, `Mind`, `Record`) and a `Phenotype` derived from its `Genome`.
- `Simulation` wires systems in update order; each system has `update(dt)` and receives the `World` by injection.
- `App` is the only place that knows about every subsystem; UI widgets receive callbacks instead of reaching into the app.

### Behaviour
Each behaviour in `sim/behavior/behaviors.js` is `{ id, label, score, plan, act }`. The `Brain` scores the
species' behaviour list every `brainInterval` seconds, plans the winner, and acts every step.

### Events
`World.events` (an `EventBus`) carries `birth`, `death`, `kill`, `attack`, `mating`, `stats`, `notice`, etc.
Renderer particles and UI toasts subscribe; the simulation never imports render or UI code.

### Errors and decorators
- All custom errors extend `EvosimError` (`ConfigError`, `SimulationError` → `TerrainError`/`SpawnError`/`GeneticsError`,
  `RenderError`, `PersistenceError` → `SaveError`/`LoadError`).
- `utils/decorators.js` provides `guarded`, `validated` and `timed`, applied with
  `decorate(Class, { method: [guarded(RenderError)] })`.

## Conventions

- PascalCase files for classes, camelCase for function modules.
- Named ES exports; always include `.js` in imports.
- Tunables live in `src/config/`, never inline in systems.
