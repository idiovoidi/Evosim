# Input Controls

## Camera Controls

### Mouse Wheel Zoom
- **Scroll Up**: Zoom in
- **Scroll Down**: Zoom out
- Zoom range: 0.5x to 3.0x
- Zoom centers on mouse cursor position

### Right-Click Pan
- **Right Mouse Button + Drag**: Pan across the map
- Cursor changes to "grabbing" while panning
- Camera follows mouse movement smoothly

### Keyboard Shortcuts
- **C**: Reset camera to default position and zoom (1.0x)

## Entity Interaction

### Mouse Controls
- **Left Click**: Select entity
- **Hover**: Highlight entity under cursor
- Entity selection and hover detection adjust with zoom level

## Existing Controls

### Simulation Controls
- **Space**: Pause/Resume simulation
- **R**: Reset simulation
- **Ctrl/Cmd + S**: Save game
- **+/=**: Increase simulation speed
- **-/_**: Decrease simulation speed

### Display Controls
- **P**: Toggle detailed performance view
- **H**: Toggle heatmap
- **Shift + H**: Cycle through heatmap species
- **Q**: Cycle through quality levels
- **A**: Toggle automatic quality adjustment

## UI Controls

### Zoom Slider
- Manual zoom control (syncs with mouse wheel)
- Range: 0.5x to 3.0x

### Speed Slider
- Control simulation speed
- Range: 0.1x to 5.0x

## Technical Details

### InputHandlerManager Features
- Zoom-aware entity selection and hover detection
- Smooth panning with right mouse button
- Prevents context menu on right-click
- Handles mouse leaving canvas during pan
- Synchronizes with UI zoom slider

### Camera System
- Position: `camera.x`, `camera.y`
- Zoom: `camera.zoom`
- Coordinate conversion between screen and world space
- Viewport culling adjusts with zoom level
