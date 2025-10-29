import { ComponentType } from '../core/Entity.js';

export class ReproductionSystem {
    constructor(world) {
        this.world = world;
        this.reproductionThresholds = {
            herbivore: 160,  // Reduced from 180 - easier to reproduce
            predator: 210,   // Increased from 200 - harder to reproduce
            plant: 140,
            fish: 130,
            bird: 150
        };
    }
    
    update(dt) {
        const entities = this.world.getActiveEntities();
        
        for (const entity of entities) {
            if (!entity.hasComponents(ComponentType.STATS, ComponentType.POSITION)) continue;
            
            const stats = entity.getComponent(ComponentType.STATS);
            const pos = entity.getComponent(ComponentType.POSITION);
            const status = entity.getComponent(ComponentType.STATUS);
            
            // Check if ready to reproduce
            const threshold = this.reproductionThresholds[stats.species];
            if (stats.energy < threshold || stats.reproductionCooldown > 0) continue;
            
            // Plants reproduce asexually
            if (stats.species === 'plant') {
                this.asexualReproduction(entity);
                continue;
            }
            
            // Find mate
            const nearby = this.world.getNearbyEntities(pos, 50);
            const mates = nearby.filter(n => {
                const mateStats = n.entity.getComponent(ComponentType.STATS);
                return mateStats?.species === stats.species &&
                       n.entity.id !== entity.id &&
                       mateStats.energy >= threshold &&
                       mateStats.reproductionCooldown <= 0;
            });
            
            if (mates.length > 0) {
                this.sexualReproduction(entity, mates[0].entity);
            }
        }
    }
    
    asexualReproduction(parent) {
        const stats = parent.getComponent(ComponentType.STATS);
        const pos = parent.getComponent(ComponentType.POSITION);
        const status = parent.getComponent(ComponentType.STATUS);
        const biome = parent.getComponent(ComponentType.BIOME);
        const habitat = parent.getComponent(ComponentType.HABITAT);
        
        // Calculate biome favorability bonus
        let reproductionBonus = 1.0;
        let cooldownModifier = 1.0;
        
        if (biome && habitat && biome.currentBiome) {
            const preference = habitat.getPreference(biome.currentBiome);
            
            // Apply reproduction success rate bonus for preferred biomes (15-30% as per requirements)
            if (habitat.isPreferred(biome.currentBiome)) {
                reproductionBonus = 1.0 + (preference - 1.0) * 0.25; // Up to 25% bonus
            }
            
            // Adjust reproduction cooldown based on biome favorability
            // Preferred biomes reduce cooldown, avoided biomes increase it
            cooldownModifier = 2.0 - preference; // preference 1.5 -> 0.5 modifier (faster), preference 0.5 -> 1.5 modifier (slower)
        }
        
        // For plants, check biome plant density at current location
        if (stats.species === 'plant') {
            const currentBiomeData = this.world.getBiomeAt(pos.x, pos.y);
            
            // Prevent plant spawning in water, deep_water, and snow biomes
            if (currentBiomeData && currentBiomeData.plantDensity === 0.0) {
                // Cannot reproduce in this biome
                stats.energy -= 10; // Small energy cost for failed attempt
                stats.reproductionCooldown = 4 * cooldownModifier;
                return;
            }
            
            // Apply plant density modifier to reproduction success rate
            if (currentBiomeData && currentBiomeData.plantDensity < 1.0) {
                // Lower density biomes reduce reproduction success
                reproductionBonus *= currentBiomeData.plantDensity;
            }
            
            // Apply grazing pressure modifier to reproduction success rate
            if (this.world.resourceDepletionSystem) {
                const pressureModifier = this.world.resourceDepletionSystem.getPlantSpawnModifier(pos.x, pos.y);
                reproductionBonus *= pressureModifier;
            }
        }
        
        // Apply reproduction success check for preferred biomes
        if (Math.random() > reproductionBonus) {
            // Reproduction attempt failed due to unfavorable conditions
            stats.energy -= 20; // Partial energy cost for failed attempt
            stats.reproductionCooldown = 4 * cooldownModifier;
            return;
        }
        
        // Cost energy
        stats.energy -= 50;
        stats.reproductionCooldown = 8 * cooldownModifier;
        
        // Create offspring
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 60;
        let x = Math.max(0, Math.min(this.world.width, pos.x + offsetX));
        let y = Math.max(0, Math.min(this.world.height, pos.y + offsetY));
        
        // For plants, verify offspring location has valid plant density
        if (stats.species === 'plant') {
            let validLocation = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!validLocation && attempts < maxAttempts) {
                const offspringBiome = this.world.getBiomeAt(x, y);
                
                if (offspringBiome && offspringBiome.plantDensity > 0) {
                    validLocation = true;
                } else {
                    // Try a different location
                    const newOffsetX = (Math.random() - 0.5) * 60;
                    const newOffsetY = (Math.random() - 0.5) * 60;
                    x = Math.max(0, Math.min(this.world.width, pos.x + newOffsetX));
                    y = Math.max(0, Math.min(this.world.height, pos.y + newOffsetY));
                    attempts++;
                }
            }
            
            // If no valid location found, reproduction fails
            if (!validLocation) {
                stats.energy += 30; // Refund some energy
                stats.reproductionCooldown = 4 * cooldownModifier;
                return;
            }
        }
        
        // Offspring inherits parent's generation + 1
        const offspringGeneration = (stats.generation || 1) + 1;
        const offspring = this.world.pool.acquire(stats.species, x, y, null, offspringGeneration);
        this.world.addEntity(offspring);
        
        // Log reproduction action
        status.logAction('reproduced', stats.age, {
            type: 'asexual',
            offspringId: offspring.id,
            energyCost: 50,
            position: { x: Math.round(pos.x), y: Math.round(pos.y) },
            biome: biome?.currentBiome,
            reproductionBonus: reproductionBonus
        });
        
        // Show heart effect
        status.showingHeart = 2;
    }
    
    sexualReproduction(parent1, parent2) {
        const stats1 = parent1.getComponent(ComponentType.STATS);
        const stats2 = parent2.getComponent(ComponentType.STATS);
        const pos1 = parent1.getComponent(ComponentType.POSITION);
        const status1 = parent1.getComponent(ComponentType.STATUS);
        const status2 = parent2.getComponent(ComponentType.STATUS);
        const genetics1 = parent1.getComponent(ComponentType.GENETICS);
        const genetics2 = parent2.getComponent(ComponentType.GENETICS);
        const biome1 = parent1.getComponent(ComponentType.BIOME);
        const habitat1 = parent1.getComponent(ComponentType.HABITAT);
        
        // Calculate biome favorability bonus (use parent1's location)
        let reproductionBonus = 1.0;
        let cooldownModifier = 1.0;
        
        if (biome1 && habitat1 && biome1.currentBiome) {
            const preference = habitat1.getPreference(biome1.currentBiome);
            
            // Apply reproduction success rate bonus for preferred biomes (15-30% as per requirements)
            if (habitat1.isPreferred(biome1.currentBiome)) {
                reproductionBonus = 1.0 + (preference - 1.0) * 0.25; // Up to 25% bonus
            }
            
            // Adjust reproduction cooldown based on biome favorability
            // Preferred biomes reduce cooldown, avoided biomes increase it
            cooldownModifier = 2.0 - preference; // preference 1.5 -> 0.5 modifier (faster), preference 0.5 -> 1.5 modifier (slower)
        }
        
        // Apply reproduction success check for preferred biomes
        if (Math.random() > reproductionBonus) {
            // Reproduction attempt failed due to unfavorable conditions
            stats1.energy -= 20; // Partial energy cost for failed attempt
            stats2.energy -= 20;
            stats1.reproductionCooldown = 5 * cooldownModifier;
            stats2.reproductionCooldown = 5 * cooldownModifier;
            return;
        }
        
        // Cost energy
        stats1.energy -= 50;
        stats2.energy -= 50;
        stats1.reproductionCooldown = 10 * cooldownModifier;
        stats2.reproductionCooldown = 10 * cooldownModifier;
        
        // Create offspring genetics with crossover
        const offspringGenetics = genetics1.crossover(genetics2, 0.1);
        
        // Calculate offspring generation (max of parents + 1)
        const offspringGeneration = Math.max(stats1.generation || 1, stats2.generation || 1) + 1;
        
        // Spawn near parent
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        const x = Math.max(0, Math.min(this.world.width, pos1.x + offsetX));
        const y = Math.max(0, Math.min(this.world.height, pos1.y + offsetY));
        
        // Acquire offspring from pool with genetics and generation
        const offspring = this.world.pool.acquire(stats1.species, x, y, offspringGenetics, offspringGeneration);
        this.world.addEntity(offspring);
        
        // Log reproduction action for both parents
        const reproductionDetails = {
            type: 'sexual',
            offspringId: offspring.id,
            mateId: parent2.id,
            energyCost: 50,
            position: { x: Math.round(pos1.x), y: Math.round(pos1.y) },
            biome: biome1?.currentBiome,
            reproductionBonus: reproductionBonus
        };
        status1.logAction('reproduced', stats1.age, reproductionDetails);
        status2.logAction('reproduced', stats2.age, {
            ...reproductionDetails,
            mateId: parent1.id
        });
        
        // Show heart effects
        status1.showingHeart = 2;
        status2.showingHeart = 2;
    }
}
