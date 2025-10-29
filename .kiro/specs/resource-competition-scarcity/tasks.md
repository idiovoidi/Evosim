# Implementation Plan

- [x] 1. Create core component classes

  - [x] 1.1 Add TerritoryComponent class to Entity.js

    - Implement constructor with centerX, centerY, radius parameters
    - Add containsPoint() and distanceFromCenter() methods
    - Add intruders array and conflictCount tracking
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Add ThirstComponent class to Entity.js

    - Implement constructor with thirst, maxThirst, thirstRate properties
    - Add drinkingRate and isDrinking state tracking
    - Add targetWaterSource reference property
    - _Requirements: 3.3, 3.4_

  - [x] 1.3 Add new ComponentType constants

    - Add TERRITORY constant to ComponentType enum
    - Add THIRST constant to ComponentType enum
    - _Requirements: 1.1, 3.3_

- [x] 2. Implement GrazingPressureGrid and WaterSource classes

  - [x] 2.1 Create GrazingPressureGrid class in new file src/systems/GrazingPressureGrid.js

        - Implement constructor with worldWidth, worldHeight, cellSize pa

    rameters - Add getCellCoords(), getPressure(), incrementPressure() methods - Add decayAll() method with 10% decay rate - Add getAveragePressure() calculation method - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Create WaterSource class in new file src/systems/WaterSource.js

    - Implement constructor with x, y, radius parameters
    - Add distanceTo() and isInRange() methods
    - Add visitCount and recentVisits tracking properties
    - Add nearbyEntities array for ambush detection
    - _Requirements: 3.1, 3.2, 3.6_

- [x] 3. Implement TerritorySystem

  - [x] 3.1 Create TerritorySystem class in new file src/systems/TerritorySystem.js

    - Implement constructor accepting world parameter
    - Add update(dt) method with entity iteration
    - _Requirements: 1.1_

  - [x] 3.2 Implement territory assignment logic

    - Check entity maturity (age > 100 or energy > 80% maxEnergy)
    - Calculate territory radius: 50 + (traits.size \* 150)
    - Create and add TerritoryComponent to eligible entities (herbivores, predators only)
    - Set territory center to current entity position
    - _Requirements: 1.1, 1.2_

  - [x] 3.3 Implement intrusion detection

    - Use world.getNearbyEntities() with territory radius
    - Filter for same-species entities
    - Check if intruder position is within territory using containsPoint()
    - Add intruders to territory.intruders array
    - _Requirements: 1.3_

  - [x] 3.4 Implement defensive behavior triggering

    - When intruders detected, increase owner aggression by 50%
    - Modify velocity to move toward intruder
    - Update status.state to 'defending_territory'
    - Increment territory.conflictCount
    - _Requirements: 1.4_

- [x] 4. Implement ResourceDepletionSystem

  - [x] 4.1 Create ResourceDepletionSystem class in new file src/systems/ResourceDepletionSystem.js

    - Implement constructor accepting world parameter
    - Initialize GrazingPressureGrid instance
    - Add update(dt) method
    - Add lastDecayTime tracking for 5-second intervals
    - _Requirements: 2.1, 2.3_

  - [x] 4.2 Implement grazing event tracking

    - Hook into herbivore eating events in BehaviorSystem
    - Call grazingGrid.incrementPressure() at plant consumption location
    - Increment by 1 per plant eaten
    - _Requirements: 2.2_

  - [x] 4.3 Implement pressure decay logic

    - Check if 5 seconds elapsed since lastDecayTime
    - Call grazingGrid.decayAll(0.1) for 10% decay
    - Update lastDecayTime
    - _Requirements: 2.3_

  - [x] 4.4 Modify plant spawn rate based on pressure

    - Add getPlantSpawnModifier() method to ResourceDepletionSystem
    - Return 0.2 if pressure > 20 (80% reduction)
    - Return 0.5 if pressure > 10 (50% reduction)
    - Return 1.0 otherwise
    - Integrate with ReproductionSystem plant spawning logic
    - _Requirements: 2.4, 2.5_

- [x] 5. Implement WaterSourceSystem

  - [x] 5.1 Create WaterSourceSystem class in new file src/systems/WaterSourceSystem.js

    - Implement constructor accepting world parameter
    - Add update(dt) method
    - Add waterSources array property
    - _Requirements: 3.1, 3.3_

  - [x] 5.2 Implement water source generation

    - Add generateWaterSources() method
    - Calculate count: 5 + (worldSize / baseSize \* 10), clamped to 5-15
    - Place sources in biomes with waterAffinity > 0.3
    - Ensure minimum 200-unit spacing between sources
    - Call during World initialization
    - _Requirements: 3.1, 3.2_

  - [x] 5.3 Add ThirstComponent to land entities

    - Modify EntityFactory to add ThirstComponent to herbivores and predators
    - Initialize thirst to 100
    - Set thirstRate to 0.5 per second
    - Do not add to fish or plants
    - _Requirements: 3.3_

  - [x] 5.4 Implement thirst decrease logic

    - Iterate through entities with ThirstComponent
    - Decrease thirst by thirstRate \* dt
    - Clamp thirst to minimum of 0
    - _Requirements: 3.4_

  - [x] 5.5 Implement thirst restoration at water sources

    - Check if entity is within 20 units of any water source
    - Set isDrinking to true
    - Restore thirst by drinkingRate \* dt (100 in 3 seconds)
    - Clamp thirst to maximum of 100
    - Increment waterSource.visitCount
    - _Requirements: 3.6_

  - [x] 5.6 Implement dehydration damage

    - Check if thirst <= 0
    - Apply 1 health damage per second to stats.health
    - _Requirements: 3.7_

- [x] 6. Extend BehaviorSystem with water-seeking behavior

  - [x] 6.1 Add water-seeking behavior to HerbivoreBehavior

    - Check if thirst < 30 before existing food-seeking logic
    - Find nearest water source using waterSourceSystem.waterSources
    - Calculate direction vector to water source
    - Set velocity toward water source at 2.5 \* traits.speed
    - Set status.state to 'seeking_water'
    - Store target in thirstComponent.targetWaterSource
    - _Requirements: 3.5_

  - [x] 6.2 Add water-seeking behavior to PredatorBehavior

    - Check if thirst < 30 before existing hunting logic
    - Find nearest water source
    - Set velocity toward water source at 3.0 \* traits.speed
    - Set status.state to 'seeking_water'
    - _Requirements: 3.5_

- [x] 7. Implement predator ambush behavior

  - [x] 7.1 Add ambush opportunity evaluation to PredatorBehavior

        - Check if predator is hungry (energy < 80% maxEnergy)
        - Check if within 300 units of any water source
        - Count prey entities within 100 units o

    f water source - Trigger ambush mode if 2+ prey present - _Requirements: 4.1, 4.2_

  - [x] 7.2 Implement ambush mode behavior

    - Position predator within 50 units of water source
    - Reduce movement speed by 70% (multiply velocity by 0.3)
    - Set status.state to 'ambushing'
    - Monitor prey distance continuously
    - _Requirements: 4.3, 4.4_

  - [x] 7.3 Implement ambush attack trigger

    - Check if prey within 40 units while in ambush mode
    - Trigger normal attack behavior
    - Exit ambush mode after attack
    - _Requirements: 4.5_

- [x] 8. Add rendering for new features

  - [x] 8.1 Implement territory boundary rendering in Renderer.js

        - Add renderTerritories() method
        - Only render for selectedEntity
        - Draw semi-transparent circle a

    t territory center with territory radius - Use strokeStyle with alpha 0.4 - Color: yellow for no conflicts, red for active conflicts - _Requirements: 1.5_

  - [x] 8.2 Implement resource depletion zone rendering in HeatmapRenderer.js

    - Add renderDepletionZones() method
    - Only render when heatmap is enabled
    - Iterate through grazingGrid cells
    - Draw brown tint overlay (rgba(139, 69, 19, alpha)) where pressure > 5
    - Alpha based on pressure: min(0.3, pressure / 40)
    - _Requirements: 2.6_

  - [x] 8.3 Implement water source rendering in Renderer.js

    - Add renderWaterSources() method
    - Draw blue circles (fillStyle '#4da6ff') at each water source position
    - Radius: 30 units
    - Add subtle white border (strokeStyle '#ffffff', lineWidth 2)
    - _Requirements: 3.8_

- [x] 9. Extend UI with resource competition statistics

  - [x] 9.1 Add territory statistics to EntityInfoPanel.js

    - Display "Territory: Claimed" or "Territory: None" based on TerritoryComponent presence
    - Show territory radius if claimed
    - Show conflict count if > 0
    - _Requirements: 5.1_

  - [x] 9.2 Add thirst display to EntityInfoPanel.js

    - Display thirst level as percentage (0-100%)
    - Show "Thirst: X%" with color coding (green > 60, yellow 30-60, red < 30)
    - Only show for entities with ThirstComponent
    - _Requirements: 5.1_

  - [x] 9.3 Add grazing pressure display to EntityInfoPanel.js

    - Query grazingGrid.getPressure() at entity position
    - Display "Grazing Pressure: X" rounded to 1 decimal
    - Show color indicator (green < 5, yellow 5-15, red > 15)
    - _Requirements: 5.1_

  - [x] 9.4 Extend StatsGraph.js with new statistics

    - Add "Active Territories" line to population graph
    - Add "Avg Grazing Pressure" line to ecosystem metrics
    - Track territorial conflicts per minute
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 9.5 Implement water source tooltip in BiomeTooltip.js

    - Detect mouse hover over water sources
    - Display tooltip with water source statistics
    - Show visit count and recent visits per minute
    - Show count of nearby entities (within 100 units)
    - _Requirements: 5.5_

- [ ] 10. Integrate systems with World.js



  - [x] 10.1 Add GrazingPressureGrid to World constructor



    - Initialize this.grazingPressureGrid with world dimensions
    - Add this.waterSources array property
    - _Requirements: 2.1, 3.1_

  - [x] 10.2 Add water source generation to World.spawnInitialEntities()



    - Call waterSourceSystem.generateWaterSources()
    - Store result in this.waterSources
    - _Requirements: 3.1, 3.2_

  - [ ] 10.3 Add new systems to World.systems array

    - Instantiate TerritorySystem(this)
    - Instantiate ResourceDepletionSystem(this)
    - Instantiate WaterSourceSystem(this)
    - Add before BehaviorSystem to ensure proper update order
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 10.4 Update World.reset() to clear new systems

    - Clear grazingPressureGrid (reinitialize)
    - Clear waterSources array
    - Reset territory assignments
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 10.5 Update World.getStats() to include new metrics
    - Add activeTerritories count
    - Add averageGrazingPressure
    - Add territorialConflictsPerMinute
    - Add waterSourceUtilization
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 11. Wire rendering calls in main render loop

  - [x] 11.1 Add territory rendering call


    - Call renderer.renderTerritories(world.selectedEntity) after entity rendering
    - Only if selectedEntity exists and has TerritoryComponent
    - _Requirements: 1.5_

  - [x] 11.2 Add depletion zone rendering call

    - Call heatmapRenderer.renderDepletionZones(world.grazingPressureGrid)
    - Only if heatmap is enabled in UI settings
    - Call before entity rendering for proper layering
    - _Requirements: 2.6_

  - [x] 11.3 Add water source rendering call

    - Call renderer.renderWaterSources(world.waterSources)
    - Always render (not conditional)
    - Call after terrain but before entities
    - _Requirements: 3.8_
