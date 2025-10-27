import { ComponentType } from '../core/Entity.js';

export class ReproductionSystem {
    constructor(world) {
        this.world = world;
        this.reproductionThresholds = {
            herbivore: 180,
            predator: 200,
            plant: 90,
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
        
        // Cost energy
        stats.energy -= 30;
        stats.reproductionCooldown = 5;
        
        // Create offspring
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 60;
        const x = Math.max(0, Math.min(this.world.width, pos.x + offsetX));
        const y = Math.max(0, Math.min(this.world.height, pos.y + offsetY));
        
        const offspring = this.world.factory.createEntity(stats.species, x, y);
        this.world.addEntity(offspring);
        
        // Show heart effect
        const status = parent.getComponent(ComponentType.STATUS);
        status.showingHeart = 2;
    }
    
    sexualReproduction(parent1, parent2) {
        const stats1 = parent1.getComponent(ComponentType.STATS);
        const stats2 = parent2.getComponent(ComponentType.STATS);
        const status1 = parent1.getComponent(ComponentType.STATUS);
        const status2 = parent2.getComponent(ComponentType.STATUS);
        
        // Cost energy
        stats1.energy -= 50;
        stats2.energy -= 50;
        stats1.reproductionCooldown = 10;
        stats2.reproductionCooldown = 10;
        
        // Create offspring with genetic crossover
        const offspring = this.world.factory.reproduce(parent1, parent2);
        this.world.addEntity(offspring);
        
        // Show heart effects
        status1.showingHeart = 2;
        status2.showingHeart = 2;
    }
}
