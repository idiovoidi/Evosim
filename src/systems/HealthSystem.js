import { ComponentType } from '../core/Entity.js';

export class HealthSystem {
    constructor(world) {
        this.world = world;
    }
    
    update(dt) {
        for (const entity of this.world.getActiveEntities()) {
            if (!entity.hasComponent(ComponentType.STATS)) continue;
            
            const stats = entity.getComponent(ComponentType.STATS);
            const traits = entity.getComponent(ComponentType.TRAITS);
            const status = entity.getComponent(ComponentType.STATUS);
            
            // Age the entity
            stats.age += dt;
            
            // Get biome effects if available
            const biomeComp = entity.getComponent(ComponentType.BIOME);
            const habitat = entity.getComponent(ComponentType.HABITAT);
            const energyMultiplier = biomeComp ? biomeComp.biomeEffects.energyMultiplier : 1.0;
            
            // Energy consumption based on metabolism
            const baseMetabolism = this.getBaseMetabolism(stats.species);
            let energyChange = baseMetabolism * traits.metabolism * dt;
            
            // Apply biome energy multiplier to energy consumption/regeneration
            energyChange *= energyMultiplier;
            
            // Apply plant growth rate modifier for plants
            if (stats.species === 'plant' && baseMetabolism < 0) {
                // Plants have negative metabolism (they gain energy)
                const pos = entity.getComponent(ComponentType.POSITION);
                if (pos) {
                    const biomeData = this.world.getBiomeAt(pos.x, pos.y);
                    if (biomeData && biomeData.plantGrowthRate) {
                        // Apply plantGrowthRate modifier to energy regeneration
                        energyChange *= biomeData.plantGrowthRate;
                    }
                }
                
                // Apply plant fertility bonus in fertile biomes
                if (biomeComp && energyMultiplier < 1.0) {
                    // In fertile biomes (low energy multiplier), they gain more energy
                    const fertilityBonus = 1.0 - energyMultiplier; // 0.0 to 1.0
                    energyChange *= (1.0 + fertilityBonus * 0.5); // Up to 50% bonus
                }
            }
            
            // Apply resting energy bonus for entities in preferred biomes
            if (status && status.state === 'idle' && habitat && biomeComp) {
                const currentBiome = biomeComp.currentBiome;
                if (currentBiome && habitat.isPreferred(currentBiome)) {
                    // Reduce energy consumption by 20% when resting in preferred biome
                    if (energyChange > 0) { // Only for energy drain, not regeneration
                        energyChange *= 0.8;
                    }
                }
            }
            
            // Apply energy change
            stats.energy -= energyChange;
            
            // Die if out of energy
            if (stats.energy <= 0) {
                this.world.pool.release(entity);
            }
            
            // Update reproduction cooldown
            if (stats.reproductionCooldown > 0) {
                stats.reproductionCooldown -= dt;
            }
        }
    }
    
    getBaseMetabolism(species) {
        const rates = {
            herbivore: 0.10,  // Reduced from 0.15 - herbivores need less energy to survive
            predator: 0.14,   // Increased from 0.12 - predators should need to hunt more
            plant: -0.05,     // Plants gain energy
            fish: 0.1,
            bird: 0.18
        };
        return rates[species] || 0.1;
    }
}
