# Design Document - Ecosystem Simulation

## Overview

The Ecosystem Simulation is built using the Entity-Component-System (ECS) architectural pattern, which provides excellent performance, flexibility, and maintainability. The system simulates a dynamic ecosystem where herbivores, predators, and plants interact with genetic evolution over time.

**Version 2.0 Enhancement:** This design includes a comprehensive 3D visualization system using PyQt6 with OpenGL, providing immersive camera controls, realistic lighting, and enhanced visual effects while maintaining the robust ECS architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GUI Layer (PyQt6)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Main Window  │  │  Ecosystem   │  │  Log Panel   │     │
│  │              │  │   Widget     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Systems Layer                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │Behavior  │ │Movement  │ │ Health   │ │  Plant   │     │
│  │ System   │ │ System   │ │ System   │ │ System   │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │   UI     │ │Rendering │ │ Genetic  │                  │
│  │ System   │ │ System   │ │ System   │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    World & Entities                         │
│  ┌──────────────────────────────────────────────────┐      │
│  │  World (Entity Manager, Map, Behaviors)          │      │
│  └──────────────────────────────────────────────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Entity 1 │ │ Entity 2 │ │ Entity 3 │ │   ...    │     │
│  │ 🐰       │ │ 🦊       │ │ 🌿       │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Components & Behaviors                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │Position  │ │Velocity  │ │  Stats   │ │Genetics  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │Herbivore │ │Predator  │ │  Plant   │                  │
│  │Behavior  │ │Behavior  │ │Behavior  │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Components

#### 1. Entity Component
```python
class Entity:
    - id: str (UUID)
    - active: bool
    - _components: Dict[ComponentType, Any]
    
    + add_component(type, component)
    + remove_component(type)
    + has_component(type) -> bool
    + get_component(type) -> Optional[Component]
    + has_components(*types) -> bool
```

#### 2. Component Types

**Position Component**
```python
class Position:
    - value: np.ndarray[float, float]  # [x, y]
    - previous: np.ndarray[float, float]
```

**Velocity Component**
```python
class Velocity:
    - value: np.ndarray[float, float]  # [dx, dy]
    - max_speed: float = 5.0
    
    + clamp_velocity()
```

**Stats Component**
```python
class Stats:
    - energy: float
    - max_energy: float
    - species_type: str
    - health: float
    - max_health: float
    - age: int
    - reproduction_cooldown: float
    - showing_heart: int
```

**Genetics Component**
```python
class Genetics:
    - genes: Dict[str, float]
    
    + mix_genes(other, mutation_rate) -> Genetics
```

**Traits Component**
```python
class Traits:
    - metabolism: float
    - speed: float
    - sense_radius: float
    - attack_strength: float  # Predators only
```

**Appearance Component**
```python
class Appearance:
    - char: str  # Emoji
    - color: QColor
    - size: float
    - visible: bool
    - layer: int
```

**Status Component**
```python
class Status:
    - is_hungry: bool
    - is_thirsty: bool
    - is_tired: bool
    - is_mating: bool
    - last_reproduction: int
    - state: str
    - status_effects: List[str]
    - showing_heart: int
```

### System Interfaces

#### Base System
```python
class BaseSystem:
    - world: World
    
    + update(dt: float)
```

#### Behavior System
```python
class BehaviorSystem(BaseSystem):
    + update(dt: float)
    - _update_status(entity)
```

#### Movement System
```python
class MovementSystem(BaseSystem):
    + update(dt: float)
    - _handle_boundaries(pos, vel)
```

#### Health System
```python
class HealthSystem(BaseSystem):
    - DEATH_ENERGY_THRESHOLD = -20
    - HUNGER_THRESHOLD = 0.2
    - TIRED_THRESHOLD = 0.1
    
    + update(dt: float)
    - _handle_death(entity)
```

### Behavior Interfaces

#### Base Behavior
```python
class BaseBehavior(ABC):
    - entity: Entity
    - world: World
    
    + update(dt: float)  # Abstract
    + get_position() -> np.ndarray
    + get_velocity() -> np.ndarray
    + set_velocity(velocity: np.ndarray)
    + get_stats() -> Stats
    + get_traits() -> Traits
    + move_towards(target_pos, speed)
    + move_away_from(target_pos, speed)
    + wander(speed)
```

#### Herbivore Behavior
```python
class HerbivoreBehavior(BaseBehavior):
    - wander_timer: float
    - eating_range: float = 30
    - wander_speed: float = 50
    - chase_speed: float = 80
    - flee_range: float = 100
    
    + update(dt: float)
    - _flee_from_predators(predators) -> bool
    - _seek_food(plants) -> bool
    - _wander(dt)
```

#### Predator Behavior
```python
class PredatorBehavior(BaseBehavior):
    - wander_timer: float
    - attack_range: float = 30
    - wander_speed: float = 60
    - chase_speed: float = 120
    - hunt_range: float = 400
    
    + update(dt: float)
    - _hunt_prey(herbivores) -> bool
    - _wander(dt)
```

### Factory Pattern

#### Entity Factory
```python
class EntityFactory:
    - SPECIES_CONFIG: Dict[str, SpeciesConfig]
    
    + create_entity(species_type, position, genetics?) -> Entity
    - _generate_genetics(species_type) -> Genetics
    - _create_traits_from_genetics(genetics, species_type) -> Traits
```

## Data Models

### World State
```python
class World:
    - width: int
    - height: int
    - map_width: int
    - map_height: int
    - bounds: Tuple[int, int, int, int]
    - _entities: List[Entity]
    - behaviors: Dict[Entity, BaseBehavior]
    - world_map: WorldMap
    - genetic_system: EnhancedGeneticSystem
    - effect_system: EventEffectSystem
    - stats: Dict[str, int]
    - mouse_pos: Tuple[float, float]
```

### Terrain System
```python
class TerrainType(Enum):
    DEEP_WATER, SHALLOW_WATER, BEACH
    GRASSLAND, DENSE_GRASS, SAVANNA
    FOREST, DENSE_FOREST, RAINFOREST
    DESERT, DESERT_DUNES
    HILLS, MOUNTAIN, MOUNTAIN_PEAK, SNOW
    SWAMP, MARSH, VOLCANIC, CAVE

class TerrainTile:
    - terrain_type: TerrainType
    - position: Tuple[int, int]
    - current_resources: Dict[str, float]
    - current_food: float
    - is_occupied: bool
    
class WorldMap:
    - width: int  # Tiles
    - height: int  # Tiles
    - tile_size: int  # Pixels
    - tiles: List[List[TerrainTile]]
    
    + generate_terrain()
    + get_tile_at_position(x, y) -> TerrainTile
```

### Genetic System
```python
class EnhancedGeneticSystem:
    - TRAIT_DEFINITIONS: Dict[str, Dict[str, TraitDef]]
    - toolbox: DEAP Toolbox
    
    + create_initial_genetics(species_type) -> Genetics
    + mix_parent_genes(parent1, parent2) -> Genetics
    - _clamp_traits(individual, species_type)
    - _genes_to_individual(genes) -> Individual
    - _create_genetics_component(individual, species_type) -> Genetics
```

## Error Handling

### Error Handling Strategy

1. **System-Level Errors**
   - Wrap system updates in try-catch blocks
   - Log errors with entity ID and system name
   - Continue processing other entities
   - Never crash the entire simulation

2. **Validation Errors**
   - Validate inputs at factory level
   - Raise descriptive ValueError for invalid species
   - Check component existence before access
   - Validate positions are within bounds

3. **Component Errors**
   - Check for required components before processing
   - Skip entities missing required components
   - Log warnings for missing components
   - Provide clear error messages

### Error Recovery

```python
# System Update Pattern
def update(self, dt: float):
    for entity in self.world.get_entities():
        try:
            # Process entity
            behavior = self.world.get_behavior(entity)
            if behavior:
                behavior.update(dt)
        except Exception as e:
            print(f"Error updating entity {entity.id}: {e}")
            continue  # Continue with next entity
```

## Testing Strategy

### Unit Tests

1. **Component Tests**
   - Test component initialization
   - Test component data integrity
   - Test component methods

2. **Entity Tests**
   - Test entity creation
   - Test component addition/removal
   - Test component queries

3. **Factory Tests**
   - Test entity creation for each species
   - Test genetics generation
   - Test trait derivation

4. **Behavior Tests**
   - Test movement methods
   - Test decision-making logic
   - Test state transitions

### Integration Tests

1. **System Integration**
   - Test system update order
   - Test inter-system communication
   - Test entity lifecycle

2. **Behavior Integration**
   - Test herbivore fleeing from predators
   - Test predator hunting herbivores
   - Test plant growth and reproduction

3. **World Integration**
   - Test entity spawning
   - Test spatial queries
   - Test terrain validation

### Performance Tests

1. **Scalability**
   - Test with 100, 500, 1000 entities
   - Measure frame rate
   - Profile system bottlenecks

2. **Memory**
   - Test memory usage over time
   - Check for memory leaks
   - Monitor entity cleanup

## Design Decisions and Rationales

### 1. Entity-Component-System Architecture

**Decision:** Use ECS pattern instead of traditional OOP inheritance

**Rationale:**
- Better performance through data-oriented design
- Easier to add new components without modifying entities
- Systems can process entities in batches
- Composition over inheritance provides flexibility
- Clear separation of data and logic

### 2. Factory Pattern for Entity Creation

**Decision:** Centralize entity creation in EntityFactory

**Rationale:**
- Ensures consistent initialization
- Single source of truth for species configuration
- Easy to add new species
- Reduces code duplication
- Simplifies testing with mock entities

### 3. Behavior Composition

**Decision:** Separate behaviors from entities

**Rationale:**
- Behaviors can be swapped at runtime
- Easier to test behavior logic independently
- Clear separation between data (components) and logic (behaviors)
- Behaviors can share common methods through inheritance
- Reduces entity complexity

### 4. Constants Management

**Decision:** Centralize all magic numbers in constants.py

**Rationale:**
- Easy to tune game balance
- Self-documenting code
- Single place to modify values
- Prevents inconsistencies
- Facilitates A/B testing

### 5. Type Hints Throughout

**Decision:** Add comprehensive type hints

**Rationale:**
- IDE autocomplete support
- Early error detection
- Better documentation
- Easier refactoring
- Professional code quality

### 6. Genetic Algorithm with DEAP

**Decision:** Use DEAP library for genetics

**Rationale:**
- Industry-standard genetic algorithms
- Proven crossover and mutation operators
- Extensible for complex evolution
- Well-documented and maintained
- Supports advanced features (selection, fitness)

### 7. Fixed Timestep Simulation

**Decision:** Use fixed 60 FPS timestep

**Rationale:**
- Consistent physics regardless of frame rate
- Predictable behavior
- Easier to debug
- Standard for game simulations
- Smooth visual experience

### 8. Spatial Query Optimization

**Decision:** Use radius-based filtering for nearby entities

**Rationale:**
- Reduces O(n²) comparisons
- Configurable search radius per behavior
- Good enough for current scale
- Can be upgraded to quadtree later
- Simple to implement and understand

## Performance Considerations

### Optimization Strategies

1. **Component Filtering**
   - Query entities by component type
   - Skip entities without required components
   - Early exit when possible

2. **Spatial Partitioning**
   - Limit search radius for nearby queries
   - Skip plants in movement system
   - Group entities by species type

3. **Fixed Timestep**
   - Consistent update rate
   - Predictable performance
   - Frame-independent physics

4. **Lazy Evaluation**
   - Only update active entities
   - Skip invisible entities in rendering
   - Cache frequently accessed values

### Future Optimizations

1. **Quadtree Spatial Partitioning**
   - O(log n) spatial queries
   - Better scaling for large populations
   - Efficient collision detection

2. **Object Pooling**
   - Reuse entity objects
   - Reduce garbage collection
   - Faster entity creation

3. **Parallel Processing**
   - Multi-threaded system updates
   - Parallel behavior processing
   - GPU-accelerated rendering

4. **Level of Detail**
   - Simplify distant entities
   - Reduce update frequency for far entities
   - Cull off-screen entities

## Security Considerations

### Input Validation

1. **Species Type Validation**
   - Validate species exists in configuration
   - Raise descriptive errors for invalid types

2. **Position Validation**
   - Ensure positions are within world bounds
   - Validate terrain compatibility

3. **Component Validation**
   - Check required components exist
   - Validate component data types

### Error Handling

1. **Graceful Degradation**
   - Continue simulation on entity errors
   - Log errors without crashing
   - Provide clear error messages

2. **Resource Limits**
   - Limit maximum entity count
   - Prevent infinite reproduction
   - Cap energy values

## Deployment Considerations

### Dependencies

```
PyQt6>=6.0.0      # GUI framework
numpy>=1.20.0     # Numerical operations
noise>=1.2.2      # Terrain generation
deap>=1.3.0       # Genetic algorithms
```

### Platform Support

- **Windows**: Primary platform (tested)
- **macOS**: Should work (PyQt6 compatible)
- **Linux**: Should work (PyQt6 compatible)

### Installation

```bash
pip install -r requirements.txt
python main.py
```

### Configuration

All configuration in `constants.py`:
- Population sizes
- Energy thresholds
- Movement speeds
- Detection ranges
- Simulation timing

## Future Enhancements

### Short Term (1-2 weeks)

1. **Unit Tests**
   - Test all behaviors
   - Test all systems
   - Test entity factory

2. **Performance Profiling**
   - Identify bottlenecks
   - Optimize hot paths
   - Measure frame times

3. **Additional Species**
   - Fish (water-based)
   - Birds (flying)
   - Insects (small, fast)

### Medium Term (1-2 months)

1. **Quadtree Optimization**
   - Implement spatial partitioning
   - Optimize nearby queries
   - Improve collision detection

2. **Save/Load System**
   - Serialize world state
   - Save/load simulations
   - Export statistics

3. **Statistics Dashboard**
   - Population graphs
   - Energy distribution
   - Genetic trait evolution

4. **Behavior Trees**
   - More complex AI
   - Configurable behaviors
   - Visual behavior editor

### Long Term (3-6 months)

1. **Machine Learning**
   - Neural network behaviors
   - Evolved strategies
   - Adaptive AI

2. **Multiplayer**
   - Networked simulation
   - Shared worlds
   - Collaborative research

3. **Mobile Version**
   - Touch controls
   - Optimized rendering
   - Cloud sync

4. **Advanced 3D Features**
   - Volumetric fog and weather
   - Dynamic day/night cycle
   - Particle systems for environmental effects
   - Advanced shader effects

## Conclusion

This design provides a solid foundation for the ecosystem simulation with clear separation of concerns, extensible architecture, and professional code quality. The ECS pattern enables excellent performance and flexibility, while the factory pattern and behavior composition make the system easy to extend and maintain.


---

## 3D Visualization System Design

### Architecture Overview

The 3D visualization system extends the existing 2D architecture with OpenGL rendering while maintaining backward compatibility with the 2D view.

```
┌─────────────────────────────────────────────────────────────┐
│                   Rendering Layer                           │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  2D Renderer │ ◄─────► │  3D Renderer │                 │
│  │   (PyQt6)    │         │   (OpenGL)   │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                         │                          │
│         └─────────┬───────────────┘                          │
│                   ▼                                          │
│         ┌──────────────────┐                                │
│         │  Render Manager  │                                │
│         │  (View Switcher) │                                │
│         └──────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### 3D Components

#### Position3D Component
```python
class Position3D:
    """Extended position component for 3D space"""
    - value: np.ndarray[float, float, float]  # [x, y, z]
    - previous: np.ndarray[float, float, float]
    - elevation: float  # Height above terrain
    
    + get_2d_position() -> np.ndarray  # For backward compatibility
    + set_from_2d(x: float, y: float)  # Convert from 2D
```

#### Model3D Component
```python
class Model3D:
    """3D model representation for entities"""
    - mesh_type: str  # 'sphere', 'cylinder', 'custom'
    - scale: np.ndarray[float, float, float]  # [sx, sy, sz]
    - rotation: np.ndarray[float, float, float]  # [rx, ry, rz] in radians
    - color: Tuple[float, float, float, float]  # RGBA
    - texture_id: Optional[int]
    - animation_state: str  # 'idle', 'walking', 'eating', 'attacking'
    
    + update_animation(dt: float)
    + get_transform_matrix() -> np.ndarray
```

#### Camera Component
```python
class Camera:
    """3D camera for viewing the world"""
    - position: np.ndarray[float, float, float]
    - target: np.ndarray[float, float, float]
    - up: np.ndarray[float, float, float]
    - fov: float  # Field of view in degrees
    - near_plane: float
    - far_plane: float
    - aspect_ratio: float
    
    + get_view_matrix() -> np.ndarray
    + get_projection_matrix() -> np.ndarray
    + rotate(yaw: float, pitch: float)
    + zoom(delta: float)
    + pan(dx: float, dy: float)
```

#### Light Component
```python
class Light:
    """Lighting for 3D scene"""
    - type: str  # 'directional', 'point', 'spot'
    - position: np.ndarray[float, float, float]
    - direction: np.ndarray[float, float, float]
    - color: np.ndarray[float, float, float]  # RGB
    - intensity: float
    - attenuation: Tuple[float, float, float]  # constant, linear, quadratic
    
    + calculate_contribution(surface_pos: np.ndarray) -> np.ndarray
```

### 3D Rendering System

#### OpenGL Renderer
```python
class OpenGLRenderer(BaseSystem):
    """Main 3D rendering system using OpenGL"""
    - gl_widget: QOpenGLWidget
    - shader_program: ShaderProgram
    - camera: Camera
    - lights: List[Light]
    - meshes: Dict[str, Mesh]
    - textures: Dict[str, Texture]
    
    + initialize_gl()
    + update(dt: float)
    + render()
    + render_terrain()
    + render_entities()
    + render_effects()
    + render_ui_overlay()
    
    - _setup_shaders()
    - _load_meshes()
    - _load_textures()
    - _update_camera()
    - _update_lights()
```

#### Shader System
```python
class ShaderProgram:
    """Manages GLSL shaders"""
    - vertex_shader: str
    - fragment_shader: str
    - program_id: int
    - uniforms: Dict[str, int]
    
    + compile()
    + use()
    + set_uniform_mat4(name: str, matrix: np.ndarray)
    + set_uniform_vec3(name: str, vector: np.ndarray)
    + set_uniform_float(name: str, value: float)
    + set_uniform_int(name: str, value: int)
```

#### Mesh System
```python
class Mesh:
    """3D mesh data"""
    - vertices: np.ndarray  # Vertex positions
    - normals: np.ndarray   # Vertex normals
    - texcoords: np.ndarray # Texture coordinates
    - indices: np.ndarray   # Triangle indices
    - vao: int              # Vertex Array Object
    - vbo: int              # Vertex Buffer Object
    - ebo: int              # Element Buffer Object
    
    + load_from_obj(filename: str)
    + generate_sphere(radius: float, segments: int)
    + generate_cylinder(radius: float, height: float, segments: int)
    + generate_plane(width: float, height: float)
    + upload_to_gpu()
    + render()
```

### 3D Terrain System

#### Terrain3D
```python
class Terrain3D:
    """3D terrain with height mapping"""
    - heightmap: np.ndarray  # 2D array of heights
    - width: int
    - height: int
    - scale: float
    - mesh: Mesh
    - texture_layers: List[Texture]  # Grass, dirt, rock, etc.
    
    + generate_from_noise(octaves: int, persistence: float)
    + get_height_at(x: float, z: float) -> float
    + get_normal_at(x: float, z: float) -> np.ndarray
    + apply_erosion(iterations: int)
    + generate_mesh()
    + update_mesh()
```

#### Biome3D
```python
class Biome3D:
    """3D biome with vegetation placement"""
    - biome_type: TerrainType
    - vegetation_density: float
    - tree_models: List[Mesh]
    - grass_models: List[Mesh]
    - rock_models: List[Mesh]
    
    + place_vegetation(terrain: Terrain3D)
    + get_color_at_height(height: float) -> np.ndarray
```

### Camera Control System

#### CameraController
```python
class CameraController:
    """Handles camera movement and controls"""
    - camera: Camera
    - target_entity: Optional[Entity]
    - mode: str  # 'free', 'follow', 'orbit', 'top_down'
    - movement_speed: float
    - rotation_speed: float
    - zoom_speed: float
    
    + update(dt: float)
    + handle_mouse_move(dx: float, dy: float)
    + handle_mouse_wheel(delta: float)
    + handle_keyboard(keys: Set[str])
    + set_mode(mode: str)
    + follow_entity(entity: Entity)
    + reset_to_default()
```

#### Camera Modes

1. **Free Camera**
   - WASD for movement
   - Mouse drag for rotation
   - Mouse wheel for zoom
   - Shift for faster movement

2. **Follow Camera**
   - Follows selected entity
   - Maintains offset distance
   - Smooth interpolation
   - Auto-rotation to face movement

3. **Orbit Camera**
   - Orbits around target point
   - Mouse drag to rotate
   - Mouse wheel to zoom in/out
   - Maintains up vector

4. **Top-Down Camera**
   - Fixed overhead view
   - Pan with mouse drag
   - Zoom with mouse wheel
   - Similar to 2D view

### Lighting System

#### Lighting Manager
```python
class LightingManager:
    """Manages scene lighting"""
    - ambient_light: np.ndarray  # RGB
    - directional_lights: List[Light]
    - point_lights: List[Light]
    - spot_lights: List[Light]
    - shadows_enabled: bool
    - shadow_map_size: int
    
    + add_light(light: Light)
    + remove_light(light: Light)
    + update_time_of_day(time: float)  # 0-24 hours
    + calculate_lighting(position: np.ndarray, normal: np.ndarray) -> np.ndarray
    + render_shadow_maps()
```

#### Dynamic Lighting

1. **Directional Light (Sun)**
   - Simulates sunlight
   - Changes angle based on time of day
   - Casts shadows
   - Affects ambient color

2. **Point Lights**
   - Entity-based lights (fireflies, etc.)
   - Distance-based attenuation
   - Dynamic creation/destruction

3. **Ambient Occlusion**
   - Screen-space ambient occlusion (SSAO)
   - Enhances depth perception
   - Configurable intensity

### Animation System

#### AnimationController
```python
class AnimationController:
    """Manages entity animations"""
    - entity: Entity
    - current_animation: str
    - animation_time: float
    - animations: Dict[str, Animation]
    - blend_time: float
    
    + play_animation(name: str, loop: bool)
    + update(dt: float)
    + blend_to(name: str, duration: float)
    + get_current_transform() -> np.ndarray
```

#### Animation Types

1. **Idle Animation**
   - Subtle breathing motion
   - Random head movements
   - Tail swaying

2. **Walk Animation**
   - Leg movement cycle
   - Body bobbing
   - Speed-based animation rate

3. **Run Animation**
   - Faster leg movement
   - More pronounced body motion
   - Leaning forward

4. **Eat Animation**
   - Head lowering
   - Mouth opening
   - Chewing motion

5. **Attack Animation**
   - Lunge forward
   - Bite motion
   - Recoil

### Particle System (3D)

#### ParticleEmitter3D
```python
class ParticleEmitter3D:
    """3D particle system"""
    - position: np.ndarray[float, float, float]
    - emission_rate: float
    - particle_lifetime: float
    - initial_velocity: np.ndarray
    - velocity_variance: float
    - gravity: np.ndarray
    - size: float
    - size_over_lifetime: Callable
    - color: np.ndarray
    - color_over_lifetime: Callable
    - particles: List[Particle3D]
    
    + emit(count: int)
    + update(dt: float)
    + render(shader: ShaderProgram)
```

#### Particle Effects

1. **Eating Effect**
   - Food particles rising
   - Green/brown colors
   - Short lifetime

2. **Death Effect**
   - Bone fragments
   - Dust particles
   - Fade to gray

3. **Reproduction Effect**
   - Heart particles
   - Pink/red colors
   - Floating upward

4. **Environmental Effects**
   - Dust motes in sunlight
   - Fireflies at night
   - Falling leaves

### UI Overlay System

#### UI3DOverlay
```python
class UI3DOverlay:
    """2D UI overlay on 3D view"""
    - stats_panel: StatsPanel
    - minimap: Minimap3D
    - entity_info: EntityInfoPanel
    - controls_help: ControlsPanel
    
    + render_overlay(painter: QPainter)
    + update_stats(world: World)
    + render_minimap(camera: Camera)
    + show_entity_info(entity: Entity)
```

#### Minimap3D
```python
class Minimap3D:
    """3D minimap showing terrain and entities"""
    - size: Tuple[int, int]
    - zoom_level: float
    - show_terrain: bool
    - show_entities: bool
    - camera_indicator: bool
    
    + render(world: World, camera: Camera)
    + handle_click(x: int, y: int)  # Jump camera to location
```

### Performance Optimizations

#### Level of Detail (LOD)
```python
class LODManager:
    """Manages level of detail for entities"""
    - lod_distances: List[float]  # [near, medium, far]
    - lod_meshes: Dict[str, List[Mesh]]
    
    + get_lod_mesh(entity: Entity, camera_distance: float) -> Mesh
    + update_lod_levels(camera: Camera)
```

#### Frustum Culling
```python
class FrustumCuller:
    """Culls objects outside camera view"""
    - frustum_planes: List[np.ndarray]
    
    + update_frustum(camera: Camera)
    + is_visible(position: np.ndarray, radius: float) -> bool
    + cull_entities(entities: List[Entity]) -> List[Entity]
```

#### Occlusion Culling
```python
class OcclusionCuller:
    """Culls objects hidden behind terrain"""
    - depth_buffer: np.ndarray
    
    + update_depth_buffer(terrain: Terrain3D, camera: Camera)
    + is_occluded(position: np.ndarray) -> bool
```

### Shader Specifications

#### Vertex Shader (GLSL)
```glsl
#version 330 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = mat3(transpose(inverse(model))) * aNormal;
    TexCoord = aTexCoord;
    gl_Position = projection * view * vec4(FragPos, 1.0);
}
```

#### Fragment Shader (GLSL)
```glsl
#version 330 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoord;

out vec4 FragColor;

uniform vec3 viewPos;
uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 objectColor;
uniform sampler2D texture1;

void main() {
    // Ambient
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * lightColor;
    
    // Diffuse
    vec3 norm = normalize(Normal);
    vec3 lightDirection = normalize(-lightDir);
    float diff = max(dot(norm, lightDirection), 0.0);
    vec3 diffuse = diff * lightColor;
    
    // Specular
    float specularStrength = 0.5;
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDirection, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
    vec3 specular = specularStrength * spec * lightColor;
    
    vec3 result = (ambient + diffuse + specular) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

### 3D Model Assets

#### Entity Models

1. **Herbivore (Rabbit)**
   - Low poly mesh (~500 triangles)
   - Animated legs, ears, tail
   - Fur texture with normal map
   - Multiple LOD levels

2. **Predator (Fox)**
   - Low poly mesh (~800 triangles)
   - Animated legs, tail, jaw
   - Fur texture with normal map
   - Multiple LOD levels

3. **Plant (Grass/Bush)**
   - Billboard for distant view
   - 3D mesh for close view
   - Wind animation shader
   - Seasonal color variations

#### Environmental Models

1. **Trees**
   - Multiple species (oak, pine, palm)
   - LOD system (billboard → low poly → high poly)
   - Procedural generation
   - Wind animation

2. **Rocks**
   - Various sizes and shapes
   - Procedurally placed
   - Normal mapped for detail

3. **Water**
   - Reflective surface
   - Wave animation
   - Foam at edges
   - Underwater fog

### Configuration

#### 3D Settings
```python
class Settings3D:
    """3D rendering settings"""
    - enabled: bool = True
    - resolution: Tuple[int, int] = (1920, 1080)
    - fullscreen: bool = False
    - vsync: bool = True
    - msaa_samples: int = 4  # Anti-aliasing
    - shadow_quality: str = 'medium'  # 'low', 'medium', 'high'
    - texture_quality: str = 'high'
    - view_distance: float = 1000.0
    - fov: float = 75.0
    - camera_mode: str = 'free'
    - show_fps: bool = True
    - show_minimap: bool = True
```

### Input Handling

#### Input Manager
```python
class InputManager3D:
    """Handles 3D-specific input"""
    - mouse_sensitivity: float = 0.1
    - keyboard_speed: float = 10.0
    - zoom_speed: float = 2.0
    
    + handle_key_press(key: str)
    + handle_key_release(key: str)
    + handle_mouse_move(dx: float, dy: float)
    + handle_mouse_wheel(delta: float)
    + handle_mouse_click(button: int, x: int, y: int)
```

#### Control Scheme

**Keyboard:**
- W/A/S/D: Move camera forward/left/back/right
- Q/E: Move camera up/down
- Shift: Move faster
- Space: Reset camera
- Tab: Switch camera mode
- F: Follow selected entity
- V: Toggle 2D/3D view
- ESC: Show menu

**Mouse:**
- Left drag: Rotate camera (free mode)
- Right drag: Pan camera
- Wheel: Zoom in/out
- Left click: Select entity
- Middle click: Reset camera rotation

### Migration Strategy

#### Backward Compatibility

1. **Dual Rendering**
   - Keep 2D renderer functional
   - Toggle between 2D and 3D views
   - Share same simulation data

2. **Component Compatibility**
   - Position3D extends Position
   - Automatic conversion between 2D/3D
   - Fallback to 2D if 3D unavailable

3. **Gradual Migration**
   - Phase 1: Add 3D components
   - Phase 2: Implement basic 3D rendering
   - Phase 3: Add camera controls
   - Phase 4: Add lighting and effects
   - Phase 5: Optimize and polish

### Testing Strategy

#### 3D-Specific Tests

1. **Rendering Tests**
   - Test mesh loading
   - Test shader compilation
   - Test texture loading
   - Test camera transformations

2. **Performance Tests**
   - FPS with varying entity counts
   - Memory usage with 3D assets
   - LOD system effectiveness
   - Culling system performance

3. **Integration Tests**
   - 2D/3D view switching
   - Entity selection in 3D
   - Camera following entities
   - Particle effects in 3D

### Dependencies (Additional)

```
PyOpenGL>=3.1.6       # OpenGL bindings
PyOpenGL-accelerate>=3.1.6  # Performance boost
Pillow>=9.0.0         # Texture loading
numpy-stl>=2.16.0     # STL mesh loading (optional)
```

### Performance Targets

- **60 FPS** with 500 entities (high settings)
- **30 FPS** with 1000 entities (medium settings)
- **Startup time** < 5 seconds
- **Memory usage** < 500 MB
- **View distance** up to 1000 units

### Future 3D Enhancements

1. **Advanced Rendering**
   - Physically-based rendering (PBR)
   - Screen-space reflections
   - Volumetric lighting
   - God rays

2. **Weather System**
   - Rain particles
   - Snow accumulation
   - Fog effects
   - Wind visualization

3. **Day/Night Cycle**
   - Dynamic sun position
   - Moon and stars
   - Changing ambient colors
   - Entity behavior changes

4. **VR Support**
   - Stereoscopic rendering
   - Head tracking
   - Hand controllers
   - Immersive experience
