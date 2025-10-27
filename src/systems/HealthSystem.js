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
            
            // Age the entity
            stats.age += dt;
            
            // Energy consumption based on metabolism
            const baseMetabolism = this.getBaseMetabolism(stats.species);
            stats.energy -= baseMetabolism * traits.metabolism * dt;
            
            // Die if out of energy
            if (stats.energy <= 0) {
                entity.active = false;
            }
            
            // Update reproduction cooldown
            if (stats.reproductionCooldown > 0) {
                stats.reproductionCooldown -= dt;
            }
        }
    }
    
    getBaseMetabolism(species) {
        const rates = {
            herbivore: 0.15,
            predator: 0.12,
            plant: -0.05, // Plants gain energy
            fish: 0.1,
            bird: 0.18
        };
        return rates[species] || 0.1;
    }
}
