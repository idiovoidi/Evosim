# HeatmapRenderer Usage Guide

## Overview

The HeatmapRenderer visualizes population density across the world by dividing it into a grid and rendering a color gradient based on entity density in each cell.

## Features

- **Grid-based density visualization**: Divides the world into configurable grid cells
- **Automatic updates**: Updates density data every second (configurable)
- **Species filtering**: Can show combined density or species-specific heatmaps
- **Dynamic normalization**: Automatically adjusts color intensity based on maximum density
- **Performance optimized**: Only updates at specified intervals

## Basic Usage

The HeatmapRenderer is automatically initialized in the Renderer class:

```javascript
// In Renderer constructor
this.heatmapRenderer = new HeatmapRenderer(world);
```

### Enable/Disable Heatmap

```javascript
// Enable heatmap
renderer.heatmapRenderer.setEnabled(true);

// Disable heatmap
renderer.heatmapRenderer.setEnabled(false);

// Check if enabled
const isEnabled = renderer.heatmapRenderer.isEnabled();
```

### Species Filtering

```javascript
// Show all species (combined view)
renderer.heatmapRenderer.setSpecies('all');

// Show specific species
renderer.heatmapRenderer.setSpecies('herbivore');
renderer.heatmapRenderer.setSpecies('predator');
renderer.heatmapRenderer.setSpecies('plant');
renderer.heatmapRenderer.setSpecies('fish');
renderer.heatmapRenderer.setSpecies('bird');

// Get current species filter
const currentSpecies = renderer.heatmapRenderer.getSpecies();
```

## Configuration

### Grid Size

The grid size can be configured when creating the HeatmapRenderer:

```javascript
// Default grid size (50 pixels)
const heatmap = new HeatmapRenderer(world);

// Custom grid size (100 pixels)
const heatmap = new HeatmapRenderer(world, 100);
```

### Update Interval

The update interval is set to 1 second by default. To change it:

```javascript
// Update every 2 seconds
renderer.heatmapRenderer.updateInterval = 2.0;

// Update every 0.5 seconds (more frequent)
renderer.heatmapRenderer.updateInterval = 0.5;
```

### Species Colors

Species colors are defined in the constructor and can be customized:

```javascript
renderer.heatmapRenderer.speciesColors = {
    herbivore: [100, 200, 100], // RGB values
    predator: [200, 100, 100],
    plant: [100, 255, 100],
    fish: [100, 150, 255],
    bird: [200, 200, 100]
};
```

## Statistics

Get heatmap statistics:

```javascript
const stats = renderer.heatmapRenderer.getStats();
console.log(stats);
// {
//     gridWidth: 20,
//     gridHeight: 15,
//     totalCells: 300,
//     occupiedCells: 45,
//     maxDensity: 12,
//     averageDensity: 3.2,
//     currentSpecies: 'all',
//     enabled: true
// }
```

## Implementation Details

### Density Calculation

1. The world is divided into a grid based on `gridSize`
2. Every second (or at the specified `updateInterval`), the renderer counts entities in each cell
3. Entities are filtered by species if a specific species is selected
4. The maximum density is tracked for normalization

### Rendering

1. Each grid cell with entities is rendered with a color gradient
2. Color intensity (alpha) is based on normalized density (0-50% opacity)
3. Species-specific colors are used when filtering by species
4. Empty cells are skipped for performance

### Performance

- Updates only occur at specified intervals (default: 1 second)
- Empty cells are not rendered
- Grid size can be adjusted to balance detail vs. performance
- Automatic resize handling when world dimensions change

## Requirements Satisfied

- **Requirement 12.1**: Divides world into grid cells and counts entities
- **Requirement 12.2**: Renders color gradient based on density and updates every second

## Future Enhancements (Task 26)

The following features will be added in task 26:
- Toggle for species-specific heatmaps (Requirement 12.3)
- Different colors for each species (Requirement 12.4)
- Switching between combined and individual views (Requirement 12.5)
- Keyboard shortcut ('H' key) to enable/disable (Requirement 12.5)
