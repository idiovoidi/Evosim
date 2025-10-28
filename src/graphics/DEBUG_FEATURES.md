# Debug Renderer Features

## Overview

The DebugRenderer provides developer visualization tools for troubleshooting and performance optimization in the ecosystem simulation.

## Keyboard Shortcuts

### Main Toggle

- **D** - Toggle debug mode ON/OFF

### Debug Views (when debug mode is enabled)

- **Q** - Toggle QuadTree view (spatial partitioning grid)
- **C** - Toggle Collision view (entity boundaries and sense ranges)
- **B** - Toggle Behavior view (color-coded by behavior state)
- **V** - Toggle Velocity view (velocity vectors as arrows)

## Debug Views

### QuadTree View (Q)

- Visualizes the spatial partitioning structure
- Shows grid boundaries with color-coded depth levels
- Displays entity count in each node
- Helps optimize spatial queries and understand entity distribution

### Collision View (C)

- Shows yellow circles around entities (collision boundaries)
- Displays cyan circles for sense ranges
- Helps debug entity detection and interaction ranges
- Useful for tuning gameplay parameters

### Behavior View (B)

- Color-codes entities based on their current behavior state
- Shows state labels below entities
- Colors:
  - Gray: idle
  - Green: wandering
  - Yellow: seeking_food
  - Light Green: eating
  - Red: fleeing
  - Orange: hunting
  - Pink: reproducing
  - Dark Gray: dead

### Velocity View (V)

- Displays velocity vectors as arrows from entity positions
- Arrow length indicates speed
- Arrow color indicates speed (green = slow, red = fast)
- Helps debug movement and pathfinding

## Usage Example

1. Press **D** to enable debug mode
2. Press **Q** to see the QuadTree structure
3. Press **C** to see collision boundaries
4. Press **B** to see behavior states
5. Press **V** to see velocity vectors
6. Press **D** again to disable debug mode

## Implementation Details

- Located in: `src/graphics/DebugRenderer.js`
- Integrated with: `src/graphics/Renderer.js`
- Renders after normal entities but before UI overlay
- Uses canvas 2D context for all visualizations
- Minimal performance impact when disabled
- On-screen notifications show current debug state

## Requirements Satisfied

✅ Requirement 8.1: Display entity collision boundaries
✅ Requirement 8.2: Display quadtree grid structure  
✅ Requirement 8.3: Display entity sense ranges as circles
✅ Requirement 8.4: Color-code entities by behavior state
✅ Requirement 8.5: Display entity velocity vectors as arrows
