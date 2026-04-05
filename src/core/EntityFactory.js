import { Entity, ComponentType, Position, Velocity, Appearance, Stats, Status, Genetics, Traits, BiomeComponent, HabitatComponent, ThirstComponent } from './Entity.js';
import { HABITAT_PREFERENCES } from './BiomeConstants.js';
import { getSpeciesConfig } from './SpeciesConfig.js';
import { createBaseEntity, calculateOffspringGeneration, calculateSpawnPosition } from './EntityBuilder.js';

export class EntityFactory {
    constructor(world) {
        this.world = world;
    }
    
    createEntity(species, x, y, genetics = null, generation = 1) {
        const config = getSpeciesConfig(species);
        
        // Create base entity with standard components
        const entity = createBaseEntity(Entity, species, x, y, genetics, generation);
        
        // Biome components - add to all entities
        try {
            // Add BiomeComponent to track current biome and effects
            const biomeComponent = new BiomeComponent();
            entity.addComponent(ComponentType.BIOME, biomeComponent);
            
            // Add HabitatComponent with species-specific preferences
            const preferences = HABITAT_PREFERENCES[species];
            if (preferences) {
                entity.addComponent(ComponentType.HABITAT, new HabitatComponent(preferences));
            } else {
                console.warn(`[EntityFactory] No habitat preferences defined for species: ${species}`);
                // Add empty habitat component with neutral preferences
                entity.addComponent(ComponentType.HABITAT, new HabitatComponent({}));
            }
            
            // Initialize biome effects based on spawn location
            if (this.world.biomeGenerator) {
                const spawnBiome = this.world.biomeGenerator.getBiomeAt(x, y);
                if (spawnBiome) {
                    biomeComponent.currentBiome = spawnBiome.id;
                    
                    // Calculate initial biome effects based on habitat preference
                    const habitatComponent = entity.getComponent(ComponentType.HABITAT);
                    const preference = habitatComponent ? habitatComponent.getPreference(spawnBiome.id) : 1.0;
                    
                    // Apply modifiers with habitat preference
                    biomeComponent.biomeEffects.movementMultiplier = spawnBiome.movementModifier * preference;
                    biomeComponent.biomeEffects.energyMultiplier = spawnBiome.energyModifier * (2.0 - preference);
                    biomeComponent.biomeEffects.visibilityMultiplier = spawnBiome.visibilityModifier;
                    biomeComponent.biomeEffects.concealmentBonus = spawnBiome.concealmentBonus;
                    
                    biomeComponent.lastBiomeChange = this.world.time || 0;
                }
            } else {
                console.warn('[EntityFactory] BiomeGenerator not available, biome effects not initialized');
            }
        } catch (error) {
            console.error(`[EntityFactory] Error adding biome components to ${species}:`, error);
            // Continue without biome components - graceful degradation
        }
        
        // Add ThirstComponent to land entities (herbivores and predators only)
        if (species === 'herbivore' || species === 'predator') {
            const thirstComponent = new ThirstComponent();
            thirstComponent.thirst = 100;
            thirstComponent.thirstRate = 0.5;
            entity.addComponent(ComponentType.THIRST, thirstComponent);
        }
        
        return entity;
    }
    
    reproduce(parent1, parent2) {
        const stats1 = parent1.getComponent(ComponentType.STATS);
        const stats2 = parent2.getComponent(ComponentType.STATS);
        const pos1 = parent1.getComponent(ComponentType.POSITION);
        const genetics1 = parent1.getComponent(ComponentType.GENETICS);
        const genetics2 = parent2.getComponent(ComponentType.GENETICS);
        
        // Create offspring genetics
        const offspringGenetics = genetics1.crossover(genetics2, 0.1);
        
        // Calculate offspring generation and position
        const offspringGeneration = calculateOffspringGeneration(stats1.generation, stats2.generation);
        const spawnPos = calculateSpawnPosition(this.world, pos1.x, pos1.y);
        
        return this.createEntity(stats1.species, spawnPos.x, spawnPos.y, offspringGenetics, offspringGeneration);
    }
}
