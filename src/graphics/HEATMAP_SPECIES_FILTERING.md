# Heatmap Species Filtering

## Overview

The heatmap system now supports species-specific filtering, allowing users to visualize population density for individual species or all species combined.

## Features

### 1. Toggle Heatmap On/Off
- **Keyboard**: Press `H` to toggle the heatmap on/off
- **UI**: Click the "🗺️ Heatmap" button in the sidebar
- When enabled, the heatmap overlay shows population density across the world

### 2. Species Filtering
- **Keyboard**: Press `Shift+H` to cycle through species filters
- **UI**: Click individual species buttons when heatmap is enabled
- Available filters:
  - **All**: Combined view of all species (red-orange color)
  - **Herbivore** (🐰): Green heatmap
  - **Predator** (🦊): Red heatmap
  - **Plant** (🌿): Bright green heatmap
  - **Fish** (🐟): Blue heatmap
  - **Bird** (🦅): Yellow heatmap

### 3. Visual Feedback
- Active species filter is highlighted in green with bold text
- Heatmap button shows ON/OFF state
- Species filter buttons only visible when heatmap is enabled
- Color intensity represents population density (darker = more entities)

## Implementation Details

### HeatmapRenderer Updates
The `HeatmapRenderer` class already supported species filtering through:
- `setSpecies(species)`: Set the species filter
- `getSpecies()`: Get current species filter
- Species-specific colors defined in `speciesColors` object

### UI Integration
New controls added to `index.html`:
- Heatmap toggle button
- Species filter buttons (grid layout)
- Keyboard shortcuts displayed in labels

### Main.js Updates
New methods added:
- `toggleHeatmap()`: Enable/disable heatmap
- `cycleHeatmapSpecies()`: Cycle through species filters
- `setHeatmapSpecies(species)`: Set specific species filter
- `updateHeatmapButton()`: Update toggle button state
- `updateHeatmapSpeciesButtons()`: Update species button states

### Keyboard Shortcuts
- `H`: Toggle heatmap on/off
- `Shift+H`: Cycle through species filters (when heatmap is enabled)

## Usage Example

1. Press `H` to enable the heatmap
2. Observe the combined population density (red-orange overlay)
3. Press `Shift+H` to cycle to herbivore-only view (green overlay)
4. Press `Shift+H` again to cycle to predator-only view (red overlay)
5. Continue cycling through plant, fish, bird, and back to all
6. Or click specific species buttons in the UI for direct selection
7. Press `H` again to disable the heatmap

## Requirements Satisfied

- ✅ **12.3**: Species-specific heatmap filtering implemented
- ✅ **12.4**: Different colors for each species (defined in HeatmapRenderer)
- ✅ **12.5**: Toggle between combined and individual views
- ✅ Heatmap enable/disable with 'H' key
- ✅ UI controls for species selection
- ✅ Visual feedback for active filters

## Technical Notes

- Heatmap updates every second (configurable via `updateInterval`)
- Grid size is 50 pixels (configurable via constructor)
- Maximum opacity is 50% to maintain visibility of entities
- Species filter is applied during grid density calculation
- Button states are synchronized with heatmap state
