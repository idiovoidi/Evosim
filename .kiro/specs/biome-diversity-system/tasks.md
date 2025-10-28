# Implementation Plan

- [x] 1. Create core biome data structures and definitions

  - Create BiomeType class with all visual and gameplay properties
  - Define BIOME_DEFINITIONS array with 9 biome types (deep_water, water, sand, grassland, forest, savanna, desert, mountain, snow)
  - Define HABITAT_PREFERENCES object mapping species to biome preference values
  - Add biome-related constants to a new BiomeConstants.js file
  - _Requirements: 1.1, 1.4_

- [x] 2. Implement BiomeGenerator class

  - Create BiomeGenerator.js in src/core/ directory
  - Implement multi-layer noise generation using elevation, moisture, and temperature
  - Implement biome assignment logic based on noise thresholds
  - Add biome clustering and smoothing post-processing
  - Implement getBiomeAt(x, y) method with error handling
  - Add seed-based generation for reproducibility
  - Implement biome transition calculation for smooth visual blending
  - _Requirements: 1.1, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 3. Create biome-related entity components

  - Create BiomeComponent class with currentBiome, biomeEffects, and timing properties
  - Create HabitatComponent class with preference map and helper methods

  - Add ComponentType.BIOME and ComponentType.HABITAT to Entity.js
  - Export new component classes from Entity.js
  - _Requirements: 2.1, 3.1, 5.1_

- [ ] 4. Implement BiomeEffectSystem

  - Create BiomeEffectSystem.js in src/systems/ directory
  - Implement update() method to detect biome changes for all entities
  - Implement onBiomeChange() to calculate and apply effective modifiers
  - Implement applyBiomeEffects() for cumulative effects like harsh biome drain
  - Add system to World.js systems array
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.5, 5.2_

- [x] 5. Update EntityFactory to add biome components

  - Modify EntityFactory.createEntity() to add BiomeComponent to all entities
  - Add HabitatComponent with species-specific preferences from HABITAT_PREFERENCES
  - Add error handling for missing habitat preferences
  - Initialize biome effects based on spawn location
  - _Requirements: 5.1, 5.5_

- [x] 6. Integrate biome effects with MovementSystem

  - Modify MovementSystem to read biomeEffects.movementMultiplier from BiomeComponent
  - Apply movement modifier to velocity calculations
  - Add special handling for fish entities outside water biomes
  - Add special handling for bird entities with minimal penalties
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Integrate biome effects with HealthSystem

  - Modify HealthSystem to read biomeEffects.energyMultiplier from BiomeComponent
  - Apply energy consumption modifier to all energy drain calculations

  - Implement energy regeneration bonus for plants in fertile biomes
  - Add resting energy bonus for entities in preferred biomes
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Integrate biome effects with ReproductionSystem

  - Modify ReproductionSystem to check current biome during reproduction
  - Apply reproduction success rate bonus for preferred biomes

  - Read habitat preferences to determine if biome is preferred
  - Adjust reproduction cooldown based on biome favorability
  - _Requirements: 5.5_

- [x] 9. Update plant spawning system with biome density modifiers

  - Modify plant spawning logic to read plantDensity from current biome
  - Apply density modifier to plant spawn rate calculations
  - Prevent plant spawning in water, deep_water, and snow biomes
  - Apply plantGrowthRate modifier to plant energy regeneration
  - Update spawnEntityOnValidTerrain to respect biome plant density

  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. Implement biome tactical modifiers for predator-prey interactions

  - Modify BehaviorSystem to apply visibilityModifier to detection ranges
  - Implement concealment bonus reducing detection probability in forest and mountain
  - Apply detection range bonuses for predators in open biomes like savanna
  - Apply detection range penalties in dense biomes like forest
  - Ensure modifiers apply dynamically as entities cross biome boundaries
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Update World class to use BiomeGenerator

  - Replace TerrainGenerator with BiomeGenerator in World constructor

  - Update resize() method to work with BiomeGenerator
  - Update getTerrainAt() to return biome type instead of terrain type
  - Add getBiomeAt() method that returns full BiomeType object
  - Update spawnEntityOnValidTerrain to use biome IDs instead of terrain types
  - _Requirements: 1.1, 8.5_

- [x] 12. Enhance Renderer with biome visual improvements

  - Modify renderTerrain() to use biome colors from BiomeGenerator
  - Implement biome pattern rendering (solid, dots, stripes, grass, waves, etc.)
  - Add smooth transition blending between adjacent biomes
  - Implement renderBiomePattern() helper methods for each pattern type
  - Add time parameter to patterns for animation support
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 13. Implement biome animation effects

  - Add animation timing to Renderer for animated biomes

  - Implement grass sway animation for grassland biome
  - Implement water wave animation for water and deep_water biomes
  - Add animation speed control based on biome animationSpeed property
  - Optimize animations to maintain performance with many tiles
  - _Requirements: 1.2, 1.5_

- [ ]\* 14. Add biome particle effects

  - Create BiomeParticleSystem class for environmental effects
  - Implement snowfall particle effect for snow biome
  - Add particle pooling for performance
  - Integrate particle rendering into Renderer
  - Add enable/disable toggle for particle effects
  - _Requirements: 1.5_

- [x] 15. Create biome tooltip UI component

  - Create BiomeTooltip.js in src/ui/ directory
  - Implement hover detection over terrain tiles
  - Display biome name, modifiers, and entity count in tooltip
  - Add smooth fade in/out transitions
  - Position tooltip near mouse cursor
  - _Requirements: 7.1_

- [x] 16. Enhance entity info panel with biome information

  - Modify EntityInfoPanel to display current biome name
  - Show active biome effects (movement, energy, visibility modifiers)
  - Display habitat preference indicator for current biome
  - Show time spent in current biome
  - Add visual indicator for preferred vs avoided biomes
  - _Requirements: 7.2_

- [x] 17. Create biome legend panel UI component

  - Create BiomeLegendPanel.js in src/ui/ directory

  - Display all biome types with color swatches
  - Show modifier values for each biome
  - Add toggle button to show/hide panel
  - Implement click-to-highlight biome on map feature
  - _Requirements: 7.3_

- [ ]\* 18. Add biome debug visualization mode

  - Add debug mode toggle to UI
  - Implement biome boundary overlay rendering
  - Display modifier values as text overlays on tiles
  - Show entity habitat preferences as colored indicators
  - Add biome statistics display (entity counts per biome)
  - _Requirements: 7.4, 7.5_

- [ ] 19. Update SaveSystem for biome data persistence

  - Add biome seed to save file format
  - Serialize BiomeComponent state for entities
  - Serialize HabitatComponent preferences
  - Implement biome data loading and validation
  - Add migration logic for old save files without biome data
  - _Requirements: 8.1_

- [ ]\* 20. Add biome-specific statistics tracking

  - Track population distribution across biomes
  - Calculate survival rates per biome per species
  - Track birth/death events by biome
  - Add biome statistics to stats panel
  - Implement biome heatmap visualization option
  - _Requirements: 7.5_

- [ ]\* 21. Performance optimization and profiling

  - Profile biome query performance with 1000+ entities
  - Implement biome query caching if needed
  - Optimize transition cache size and eviction
  - Profile rendering performance with all visual effects
  - Optimize pattern rendering with batching
  - Add performance metrics to debug panel
  - _Requirements: All performance-related_

- [ ]\* 22. Balance testing and tuning
  - Test gameplay with all biome modifiers active
  - Adjust modifier values for balanced gameplay
  - Test entity survival rates across different biomes
  - Verify predator-prey dynamics with tactical modifiers
  - Tune plant density and growth rates for ecosystem balance
  - _Requirements: All gameplay-related_
