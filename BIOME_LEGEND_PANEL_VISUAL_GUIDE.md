# Biome Legend Panel - Visual Guide

## Component Overview

The Biome Legend Panel is a comprehensive UI component that displays all biome types in the ecosystem simulation with their visual properties and gameplay modifiers.

## Visual Layout

```
┌─────────────────────────────────────────┐
│  🗺️ Biome Legend          Click to highlight │
├─────────────────────────────────────────┤
│                                         │
│  ┌───┐  Deep Water                     │
│  │███│  Deep aquatic zone               │
│  └───┘                                  │
│  ⚡ Movement: -80%    🔥 Energy: +40%   │
│  🌿 Plants: None      👁️ Visibility: -40% │
│                                         │
│  ┌───┐  Shallow Water                  │
│  │███│  Shallow aquatic zone            │
│  └───┘                                  │
│  ⚡ Movement: -70%    🔥 Energy: +30%   │
│  🌿 Plants: -90%      👁️ Visibility: -20% │
│                                         │
│  ┌───┐  Sandy Beach                    │
│  │███│  Coastal beach area             │
│  └───┘                                  │
│  ⚡ Movement: -15%    🔥 Energy: +10%   │
│  🌿 Plants: -80%      👁️ Visibility: +30% │
│                                         │
│  ┌───┐  Grassland                      │
│  │███│  Open plains                    │
│  └───┘                                  │
│  ⚡ Movement: 0%      🔥 Energy: -10%   │
│  🌿 Plants: +80%      👁️ Visibility: 0%  │
│                                         │
│  [... more biomes ...]                 │
│                                         │
├─────────────────────────────────────────┤
│  Click any biome to highlight it on map │
└─────────────────────────────────────────┘
```

## Toggle Button

**Location:** Top-right corner of screen

**States:**

Hidden State:
```
┌──────────────────┐
│ 🗺️ Biome Legend  │  ← Gray background (#666)
└──────────────────┘
```

Visible State:
```
┌──────────────────┐
│ 🗺️ Biome Legend ✓│  ← Green background (#4caf50)
└──────────────────┘
```

## Biome Entry States

### Normal State
```
┌─────────────────────────────────────┐
│ ┌───┐  Grassland                    │
│ │███│  Open plains                  │
│ └───┘                               │
│ ⚡ Movement: 0%    🔥 Energy: -10%  │
│ 🌿 Plants: +80%    👁️ Visibility: 0% │
└─────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────┐
│ ┌───┐  Grassland                    │  ← Lighter background
│ │███│  Open plains                  │  ← Subtle border
│ └───┘                               │
│ ⚡ Movement: 0%    🔥 Energy: -10%  │
│ 🌿 Plants: +80%    👁️ Visibility: 0% │
└─────────────────────────────────────┘
```

### Highlighted State
```
╔═════════════════════════════════════╗  ← Green border (#4CAF50)
║ ┌───┐  Grassland                    ║  ← Green glow effect
║ │███│  Open plains                  ║  ← Green-tinted background
║ └───┘                               ║
║ ⚡ Movement: 0%    🔥 Energy: -10%  ║
║ 🌿 Plants: +80%    👁️ Visibility: 0% ║
╚═════════════════════════════════════╝
```

## Map Highlighting Effect

When a biome is selected, tiles of that biome on the map show a pulsing overlay:

```
Normal Tile:          Highlighted Tile:
┌──────────┐         ╔══════════╗
│          │         ║ ░░░░░░░░ ║  ← Pulsing green overlay
│  Grass   │   →     ║  Grass   ║  ← Green border
│          │         ║ ░░░░░░░░ ║
└──────────┘         ╚══════════╝
```

**Pulse Animation:**
- Intensity varies from 25% to 40% opacity
- Speed: 2 cycles per second
- Color: rgba(76, 175, 80, alpha)

## Color Coding for Modifiers

### Movement Speed (⚡)
- **Green** (+20% or more): Fast movement
- **Light Green** (+1% to +19%): Slightly faster
- **Gray** (0%): Normal speed
- **Orange** (-1% to -19%): Slightly slower
- **Red** (-20% or less): Very slow

### Energy Drain (🔥)
- **Green** (-20% or less): Low energy cost
- **Light Green** (-1% to -19%): Slightly lower cost
- **Gray** (0%): Normal cost
- **Orange** (+1% to +19%): Slightly higher cost
- **Red** (+20% or more): High energy cost

### Plant Density (🌿)
- **Green** (+20% or more): High plant density
- **Light Green** (+1% to +19%): Slightly more plants
- **Gray** (0%): Normal density
- **Orange** (-1% to -19%): Fewer plants
- **Red** (-20% or less): Very few plants
- **Gray "None"**: No plants can grow

### Visibility Range (👁️)
- **Green** (+20% or more): Excellent visibility
- **Light Green** (+1% to +19%): Good visibility
- **Gray** (0%): Normal visibility
- **Orange** (-1% to -19%): Reduced visibility
- **Red** (-20% or less): Poor visibility

## Complete Biome List

### 1. Deep Water (#1a4d7a - Dark Blue)
- Movement: -80% (Very slow for non-fish)
- Energy: +40% (High drain)
- Plants: None
- Visibility: -40% (Poor)

### 2. Shallow Water (#2e7db5 - Blue)
- Movement: -70% (Slow for non-fish)
- Energy: +30% (Moderate drain)
- Plants: -90% (Very few)
- Visibility: -20% (Reduced)

### 3. Sandy Beach (#ddc77d - Tan)
- Movement: -15% (Slightly slow)
- Energy: +10% (Slight drain)
- Plants: -80% (Few)
- Visibility: +30% (Good)

### 4. Grassland (#6b9e4d - Green)
- Movement: 0% (Normal)
- Energy: -10% (Efficient)
- Plants: +80% (High density)
- Visibility: 0% (Normal)

### 5. Dense Forest (#3d6b2e - Dark Green)
- Movement: -30% (Slow)
- Energy: -5% (Slightly efficient)
- Plants: +120% (Very high density)
- Visibility: -40% (Poor)

### 6. Savanna (#b8a76f - Light Brown)
- Movement: +20% (Fast)
- Energy: 0% (Normal)
- Plants: 0% (Normal)
- Visibility: +40% (Excellent)

### 7. Desert (#d4a76a - Sand)
- Movement: -20% (Slow)
- Energy: +40% (High drain)
- Plants: -85% (Very few)
- Visibility: +50% (Excellent)

### 8. Mountain (#8b7355 - Brown)
- Movement: -40% (Very slow)
- Energy: +50% (Very high drain)
- Plants: -70% (Few)
- Visibility: +20% (Good)

### 9. Snowy Peak (#f0f0f0 - White)
- Movement: -50% (Extremely slow)
- Energy: +60% (Extreme drain)
- Plants: None
- Visibility: -10% (Slightly reduced)

## Interaction Flow

```
1. Player clicks toggle button
   ↓
2. Panel slides in from right with fade
   ↓
3. Player browses biome list
   ↓
4. Player clicks "Grassland" entry
   ↓
5. Entry highlights with green border
   ↓
6. All grassland tiles on map show pulsing overlay
   ↓
7. Player clicks "Forest" entry
   ↓
8. Grassland highlight clears
   ↓
9. Forest entry highlights
   ↓
10. Forest tiles on map show pulsing overlay
    ↓
11. Player clicks "Forest" again
    ↓
12. Highlight clears from entry and map
    ↓
13. Player clicks toggle button
    ↓
14. Panel slides out with fade
    ↓
15. Any active highlight is cleared
```

## Responsive Behavior

**Panel Positioning:**
- Fixed position relative to viewport
- Always visible in top-right area
- Scrollable content if biomes exceed viewport height
- Max height: viewport height - 100px

**Z-Index Layers:**
- Toggle button: 10000 (top layer)
- Panel: 9999 (below button)
- Map highlight: Rendered in terrain layer

## Accessibility Features

- Clear visual hierarchy
- Color-coded modifiers with icons
- Descriptive text for each biome
- Hover feedback on interactive elements
- Click feedback with scale animation
- Smooth transitions for state changes

## Performance Notes

- Panel only updates when shown/hidden or highlight changes
- No continuous rendering when hidden
- Highlight check adds ~0.1ms per tile (negligible)
- Pulsing animation uses efficient sin calculation
- Event listeners properly cleaned up on destroy

## Usage Tips

**For Players:**
1. Use the legend to understand biome effects
2. Click biomes to see their distribution on the map
3. Plan entity movement based on biome modifiers
4. Identify favorable biomes for different species

**For Developers:**
1. Access via `ui.biomeLegendPanel`
2. Programmatically highlight biomes for tutorials
3. Extend with additional biome properties
4. Customize colors and animations as needed
