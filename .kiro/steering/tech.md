# Technology Stack

## Build System

- **Vite 5.0+**: Build tool and development server
- **Node.js 18+**: Runtime requirement (tests use `node:test`)
- **ES6+ Modules**: Native JavaScript modules (type: "module")

## Frontend Stack

- **Vanilla JavaScript (ES6+)**: No framework dependencies
- **HTML5 Canvas**: 2D rendering via Canvas API
- **LocalStorage**: Client-side persistence

## Key Libraries

- **simplex-noise (4.0.1)**: Procedural terrain generation using Perlin/simplex noise
- **alea (1.0.1)**: Seedable random number generator

## Backend (Python)

- **Python 3.x**: Backend simulation manager
- **asyncio**: Asynchronous operations
- **numpy**: Numerical computations
- **dataclasses**: Type-safe data structures

## Common Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
```

### Production
```bash
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
```

### Testing and tuning
```bash
npm test                                   # node:test suites in tests/
npm run headless -- 1800 myseed 60         # simulate 1800s headless, report every 60s
```

### Development Server
- Hot Module Replacement (HMR) enabled
- Auto-opens browser on start
- Runs on port 3000

## Browser Requirements

- ES6+ JavaScript support
- Canvas 2D API
- LocalStorage API
- RequestAnimationFrame API
