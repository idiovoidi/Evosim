import { Entity, ComponentType, Position, Velocity, Appearance, Stats, Status, Genetics, Traits, BiomeComponent, HabitatComponent } from './Entity.js';
import { HABITAT_PREFERENCES } from './BiomeConstants.js';

export class EntityFactory {
    constructor(world) {
        this.world = world;
        
        this.speciesConfig = {
            herbivore: {
                emoji: '🐰',
                color: '#96c896',
                maxEnergy: 200,
                initialEnergy: 150,
                layer: 2
            },
            predator: {
                emoji: '🦊',
                color: '#c89696',
                maxEnergy: 250,
                initialEnergy: 200,
                layer: 2
            },
            plant: {
                emoji: '🌿',
                color: '#649650',
                maxEnergy: 100,
                initialEnergy: 100,
                layer: 0
            },
            fish: {
                emoji: '🐟',
                color: '#5a9ed4',
                maxEnergy: 150,
                initialEnergy: 120,
                layer: 1
            },
            bird: {
                emoji: '🦅',
                color: '#8b7355',
                maxEnergy: 180,
                initialEnergy: 140,
                layer: 3
            }
        };
    }
    
    createEntity(species, x, y, genetics = null, generation = 1) {
        const config = this.speciesConfig[species];
        if (!config) {
            throw new Error(`Unknown species: ${species}`);
        }
        
        const entity = new Entity();
        
        // Position
        entity.addComponent(ComponentType.POSITION, new Position(x, y));
        
        // Velocity
        entity.addComponent(ComponentType.VELOCITY, new Velocity());
        
        // Appearance
        entity.addComponent(ComponentType.APPEARANCE, 
            new Appearance(config.emoji, config.color, 1.0, config.layer));
        
        // Stats
        entity.addComponent(ComponentType.STATS, 
            new Stats(species, config.initialEnergy, config.maxEnergy, generation));
        
        // Status
        entity.addComponent(ComponentType.STATUS, new Status());
        
        // Genetics
        const geneComponent = genetics || new Genetics();
        entity.addComponent(ComponentType.GENETICS, geneComponent);
        
        // Traits (derived from genetics)
        entity.addComponent(ComponentType.TRAITS, new Traits(geneComponent));
        
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
        
        // Calculate offspring generation (max of parents + 1)
        const offspringGeneration = Math.max(stats1.generation, stats2.generation) + 1;
        
        // Spawn near parent
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        const x = Math.max(0, Math.min(this.world.width, pos1.x + offsetX));
        const y = Math.max(0, Math.min(this.world.height, pos1.y + offsetY));
        
        return this.createEntity(stats1.species, x, y, offspringGenetics, offspringGeneration);
    }
}
