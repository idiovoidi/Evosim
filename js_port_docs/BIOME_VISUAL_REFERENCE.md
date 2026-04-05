# Biome Visual Reference Guide

## Pattern Descriptions

### 1. Deep Water & Shallow Water - `waves`
**Animation**: Yes (speed 0.5 and 0.3)
- Concentric expanding circles
- 3 wave rings per tile
- Semi-transparent white/light blue waves
- Creates rippling water effect

### 2. Sandy Beach - `dots`
**Animation**: No
- 8 scattered dots per tile
- Uses secondary color (#f0e5b8)
- Deterministic placement for consistency
- Represents sand granules

### 3. Grassland - `grass`
**Animation**: Yes (speed 0.2)
- 12 grass blades per tile
- Animated swaying motion
- Blades extend 1/3 of tile height
- Uses secondary color (#7fb857)

### 4. Dense Forest - `trees`
**Animation**: No
- 4 tree shapes per tile
- Simple triangle representation
- Dark green secondary color (#2d5221)
- Scattered placement

### 5. Savanna - `sparse_grass`
**Animation**: No
- 6 grass blades per tile (fewer than grassland)
- Taller blades (1/4 tile height)
- No animation for sparse look
- Light tan secondary color (#d4c291)

### 6. Desert - `dunes`
**Animation**: No
- 3 wavy horizontal lines
- Sine wave curves
- Semi-transparent (alpha 0.3)
- Light sand secondary color (#e8c794)

### 7. Mountain - `rocks`
**Animation**: No
- 5 circular rocks per tile
- Varying sizes
- Dark brown secondary color (#6d5a44)
- Irregular placement

### 8. Snowy Peak - `snow`
**Animation**: No
- 10 snowflakes per tile
- Cross-shaped flakes
- Light blue-white secondary color (#e0e8f0)
- Scattered placement

## Transition Blending

### How It Works
1. Query BiomeGenerator for nearby biomes within radius 1
2. Calculate weighted blend based on distance
3. Render primary biome as base
4. Overlay adjacent biomes with alpha transparency
5. Alpha capped at 0.6 for visibility

### Visual Effect
- Smooth color gradients between biomes
- No harsh boundaries
- Natural-looking biome edges
- Maintains pattern visibility

## Animation System

### Animated Biomes
- **Deep Water**: Fastest waves (0.5 speed)
- **Shallow Water**: Medium waves (0.3 speed)
- **Grassland**: Gentle grass sway (0.2 speed)

### Animation Calculation
```javascript
// Grass sway example
const sway = Math.sin(time * animSpeed + seed) * (size / 15);

// Wave expansion example
const offset = ((time * animSpeed * 10 + i * 10) % size);
```

### Time Parameter
- Uses `world.time` for consistency
- Synchronized across all tiles
- Deterministic animation
- No frame-rate dependency

## Color Scheme

### Primary Colors (Base)
- Deep Water: #1a4d7a (dark blue)
- Shallow Water: #2e7db5 (medium blue)
- Sandy Beach: #ddc77d (tan)
- Grassland: #6b9e4d (green)
- Dense Forest: #3d6b2e (dark green)
- Savanna: #b8a76f (light brown)
- Desert: #d4a76a (sand)
- Mountain: #8b7355 (brown)
- Snowy Peak: #f0f0f0 (white)

### Secondary Colors (Patterns)
- Used for pattern overlays
- Slightly lighter/darker than primary
- Creates depth and texture
- Maintains biome theme

## Performance Notes

### Optimization Techniques
1. **Deterministic Placement**: Uses tile coordinates as seed
2. **No Random Calls**: Consistent rendering every frame
3. **Minimal Calculations**: Simple geometric shapes
4. **Cached Transitions**: BiomeGenerator caches blend data
5. **Conditional Rendering**: Skips patterns for 'solid' type

### Rendering Order
1. Base color with transition blending
2. Pattern overlay
3. Entities
4. UI elements

## Visual Testing Checklist

When testing in browser, verify:
- [ ] All 9 biomes render with distinct colors
- [ ] Patterns visible on each biome type
- [ ] Water waves animate smoothly
- [ ] Grass sways gently
- [ ] Transitions blend smoothly between biomes
- [ ] No harsh biome boundaries
- [ ] Patterns don't obscure entities
- [ ] Performance remains smooth (60 FPS)
- [ ] Patterns consistent across frames
- [ ] Animation synchronized across tiles

## Integration with Gameplay

### Visual Feedback
- Players can identify biomes at a glance
- Patterns reinforce biome characteristics
- Animations add life to the world
- Transitions create natural-looking terrain

### Strategic Information
- Biome type immediately visible
- Movement implications clear
- Habitat preferences obvious
- Tactical advantages apparent
