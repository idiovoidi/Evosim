import { ComponentType, TerritoryComponent } from '../core/Entity.js';

export class TerritorySystem {
    constructor(world) {
        this.world = world;
    }
    
    update(dt) {
        for (const entity of this.world.getActiveEntities()) {
            // Only process entities with required components
            if (!entity.hasComponents(ComponentType.POSITION, ComponentType.STATS, ComponentType.TRAITS)) {
                continue;
            }
            
            const stats = entity.getComponent(ComponentType.STATS);
            const pos = entity.getComponent(ComponentType.POSITION);
            const traits = entity.getComponent(ComponentType.TRAITS);
            
            // Only herbivores and predators can have territories
            if (stats.species !== 'herbivore' && stats.species !== 'predator') {
                continue;
            }
            
            // Check if entity already has a territory
            let territory = entity.getComponent(ComponentType.TERRITORY);
            
            if (!territory) {
                // Check if entity is mature enough to claim territory
                // Maturity: age > 100 or energy > 80% maxEnergy
                const isMature = stats.age > 100 || stats.energy > (stats.maxEnergy * 0.8);
                
                if (isMature) {
                    // Assign territory
                    const radius = 50 + (traits.size * 150);
                    territory = new TerritoryComponent(pos.x, pos.y, radius);
                    territory.claimedAt = this.world.time;
                    entity.addComponent(ComponentType.TERRITORY, territory);
                }
            }
            
            // If entity has territory, check for intrusions
            if (territory) {
                // Clear previous intruders list
                territory.intruders = [];
                
                // Get nearby entities within territory radius
                const nearby = this.world.getNearbyEntities(pos, territory.radius);
                
                // Filter for same-species entities
                for (const { entity: nearbyEntity, distance } of nearby) {
                    // Skip self
                    if (nearbyEntity.id === entity.id) {
                        continue;
                    }
                    
                    // Check if same species
                    if (!nearbyEntity.hasComponent(ComponentType.STATS)) {
                        continue;
                    }
                    
                    const nearbyStats = nearbyEntity.getComponent(ComponentType.STATS);
                    if (nearbyStats.species !== stats.species) {
                        continue;
                    }
                    
                    // Check if intruder is within territory
                    const nearbyPos = nearbyEntity.getComponent(ComponentType.POSITION);
                    if (territory.containsPoint(nearbyPos.x, nearbyPos.y)) {
                        territory.intruders.push(nearbyEntity);
                    }
                }
                
                // Trigger defensive behavior if intruders detected
                if (territory.intruders.length > 0 && entity.hasComponent(ComponentType.VELOCITY)) {
                    const vel = entity.getComponent(ComponentType.VELOCITY);
                    const status = entity.getComponent(ComponentType.STATUS);
                    
                    // Get the nearest intruder
                    const intruder = territory.intruders[0];
                    const intruderPos = intruder.getComponent(ComponentType.POSITION);
                    
                    // Calculate direction to intruder
                    const dx = intruderPos.x - pos.x;
                    const dy = intruderPos.y - pos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        // Increase aggression by 50%
                        const aggressionMultiplier = 1.5;
                        
                        // Move toward intruder
                        vel.dx = (dx / dist) * traits.speed * aggressionMultiplier;
                        vel.dy = (dy / dist) * traits.speed * aggressionMultiplier;
                        
                        // Update status
                        if (status) {
                            status.state = 'defending_territory';
                        }
                        
                        // Increment conflict count
                        territory.conflictCount++;
                    }
                }
            }
        }
    }
}
