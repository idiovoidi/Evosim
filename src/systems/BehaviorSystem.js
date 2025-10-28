import { ComponentType } from '../core/Entity.js';

export class BehaviorSystem {
    constructor(world) {
        this.world = world;
        this.behaviors = {
            herbivore: new HerbivoreBehavior(world),
            predator: new PredatorBehavior(world),
            plant: new PlantBehavior(world),
            fish: new FishBehavior(world),
            bird: new BirdBehavior(world)
        };
    }
    
    update(dt) {
        for (const entity of this.world.getActiveEntities()) {
            if (!entity.hasComponents(ComponentType.STATS, ComponentType.POSITION)) continue;
            
            const stats = entity.getComponent(ComponentType.STATS);
            const behavior = this.behaviors[stats.species];
            
            if (behavior) {
                behavior.update(entity, dt);
            }
        }
    }
}

class HerbivoreBehavior {
    constructor(world) {
        this.world = world;
    }
    
    update(entity, dt) {
        const pos = entity.getComponent(ComponentType.POSITION);
        const vel = entity.getComponent(ComponentType.VELOCITY);
        const stats = entity.getComponent(ComponentType.STATS);
        const traits = entity.getComponent(ComponentType.TRAITS);
        const status = entity.getComponent(ComponentType.STATUS);
        
        const senseRadius = 200 * traits.senseRadius;
        const nearby = this.world.getNearbyEntities(pos, senseRadius);
        
        // Find threats (predators)
        const predators = nearby.filter(n => 
            n.entity.getComponent(ComponentType.STATS)?.species === 'predator'
        );
        
        if (predators.length > 0) {
            // Flee from nearest predator
            const threat = predators[0];
            const threatPos = threat.entity.getComponent(ComponentType.POSITION);
            const dx = pos.x - threatPos.x;
            const dy = pos.y - threatPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Log fleeing action (only if state changed to avoid spam)
            if (status.state !== 'fleeing') {
                status.logAction('fled', stats.age, {
                    threat: 'predator',
                    distance: Math.round(dist),
                    position: { x: Math.round(pos.x), y: Math.round(pos.y) }
                });
            }
            
            vel.dx = (dx / dist) * 3 * traits.speed;
            vel.dy = (dy / dist) * 3 * traits.speed;
            status.state = 'fleeing';
            return;
        }
        
        // Find food (plants)
        const plants = nearby.filter(n => 
            n.entity.getComponent(ComponentType.STATS)?.species === 'plant'
        );
        
        if (stats.energy < stats.maxEnergy * 0.7 && plants.length > 0) {
            // Move towards nearest plant
            const food = plants[0];
            const foodPos = food.entity.getComponent(ComponentType.POSITION);
            const dx = foodPos.x - pos.x;
            const dy = foodPos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 20) {
                // Eat the plant
                const plantStats = food.entity.getComponent(ComponentType.STATS);
                const energyGain = Math.min(30, plantStats.energy);
                stats.energy = Math.min(stats.maxEnergy, stats.energy + energyGain);
                plantStats.energy -= energyGain;
                
                // Log the eating action
                status.logAction('ate', stats.age, {
                    target: 'plant',
                    energyGained: energyGain,
                    position: { x: Math.round(pos.x), y: Math.round(pos.y) }
                });
                
                if (plantStats.energy <= 0) {
                    this.world.pool.release(food.entity);
                }
                
                vel.dx *= 0.5;
                vel.dy *= 0.5;
                status.state = 'eating';
            } else {
                vel.dx = (dx / dist) * 2 * traits.speed;
                vel.dy = (dy / dist) * 2 * traits.speed;
                status.state = 'seeking_food';
            }
            return;
        }
        
        // Wander
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            vel.dx = Math.cos(angle) * 1.5 * traits.speed;
            vel.dy = Math.sin(angle) * 1.5 * traits.speed;
        }
        
        vel.dx *= 0.98;
        vel.dy *= 0.98;
        status.state = 'wandering';
    }
}

class PredatorBehavior {
    constructor(world) {
        this.world = world;
    }
    
    update(entity, dt) {
        const pos = entity.getComponent(ComponentType.POSITION);
        const vel = entity.getComponent(ComponentType.VELOCITY);
        const stats = entity.getComponent(ComponentType.STATS);
        const traits = entity.getComponent(ComponentType.TRAITS);
        const status = entity.getComponent(ComponentType.STATUS);
        
        const senseRadius = 300 * traits.senseRadius;
        const nearby = this.world.getNearbyEntities(pos, senseRadius);
        
        // Find prey (herbivores)
        const prey = nearby.filter(n => 
            n.entity.getComponent(ComponentType.STATS)?.species === 'herbivore'
        );
        
        if (stats.energy < stats.maxEnergy * 0.8 && prey.length > 0) {
            // Hunt nearest prey
            const target = prey[0];
            const targetPos = target.entity.getComponent(ComponentType.POSITION);
            const dx = targetPos.x - pos.x;
            const dy = targetPos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 25) {
                // Attack
                const targetStats = target.entity.getComponent(ComponentType.STATS);
                const damage = 50 * traits.attackStrength;
                targetStats.energy -= damage;
                const energyGained = damage * 0.8;
                stats.energy = Math.min(stats.maxEnergy, stats.energy + energyGained);
                
                // Log the hunting/eating action
                status.logAction('hunted', stats.age, {
                    target: 'herbivore',
                    energyGained: Math.round(energyGained),
                    damage: Math.round(damage),
                    position: { x: Math.round(pos.x), y: Math.round(pos.y) }
                });
                
                if (targetStats.energy <= 0) {
                    this.world.pool.release(target.entity);
                }
                
                vel.dx *= 0.3;
                vel.dy *= 0.3;
                status.state = 'attacking';
            } else {
                vel.dx = (dx / dist) * 3.5 * traits.speed;
                vel.dy = (dy / dist) * 3.5 * traits.speed;
                status.state = 'hunting';
            }
            return;
        }
        
        // Wander
        if (Math.random() < 0.015) {
            const angle = Math.random() * Math.PI * 2;
            vel.dx = Math.cos(angle) * 2 * traits.speed;
            vel.dy = Math.sin(angle) * 2 * traits.speed;
        }
        
        vel.dx *= 0.97;
        vel.dy *= 0.97;
        status.state = 'wandering';
    }
}

class PlantBehavior {
    constructor(world) {
        this.world = world;
    }
    
    update(entity, dt) {
        const stats = entity.getComponent(ComponentType.STATS);
        const pos = entity.getComponent(ComponentType.POSITION);
        
        // Check terrain
        const terrain = this.world.getTerrainAt(pos.x, pos.y);
        
        // Grow based on terrain
        let growthRate = 0.02;
        if (terrain === 'grass') growthRate = 0.03;
        if (terrain === 'forest') growthRate = 0.04;
        if (terrain === 'water') growthRate = 0.01;
        
        stats.energy = Math.min(stats.maxEnergy, stats.energy + growthRate);
    }
}

class FishBehavior {
    constructor(world) {
        this.world = world;
    }
    
    update(entity, dt) {
        const pos = entity.getComponent(ComponentType.POSITION);
        const vel = entity.getComponent(ComponentType.VELOCITY);
        const stats = entity.getComponent(ComponentType.STATS);
        const traits = entity.getComponent(ComponentType.TRAITS);
        const status = entity.getComponent(ComponentType.STATUS);
        
        // Stay in water
        const terrain = this.world.getTerrainAt(pos.x, pos.y);
        if (terrain !== 'water' && terrain !== 'deep_water') {
            // Move towards water
            const searchRadius = 100;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const checkX = pos.x + Math.cos(angle) * searchRadius;
                const checkY = pos.y + Math.sin(angle) * searchRadius;
                const checkTerrain = this.world.getTerrainAt(checkX, checkY);
                
                if (checkTerrain === 'water' || checkTerrain === 'deep_water') {
                    vel.dx = Math.cos(angle) * 2;
                    vel.dy = Math.sin(angle) * 2;
                    return;
                }
            }
        }
        
        // School behavior - stay near other fish
        const nearby = this.world.getNearbyEntities(pos, 100);
        const otherFish = nearby.filter(n => 
            n.entity.getComponent(ComponentType.STATS)?.species === 'fish' &&
            n.entity.id !== entity.id
        );
        
        if (otherFish.length > 0) {
            let avgX = 0, avgY = 0;
            for (const f of otherFish) {
                const fPos = f.entity.getComponent(ComponentType.POSITION);
                avgX += fPos.x;
                avgY += fPos.y;
            }
            avgX /= otherFish.length;
            avgY /= otherFish.length;
            
            const dx = avgX - pos.x;
            const dy = avgY - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                vel.dx += (dx / dist) * 0.5;
                vel.dy += (dy / dist) * 0.5;
            }
        }
        
        // Wander
        if (Math.random() < 0.03) {
            const angle = Math.random() * Math.PI * 2;
            vel.dx += Math.cos(angle) * 1.5 * traits.speed;
            vel.dy += Math.sin(angle) * 1.5 * traits.speed;
        }
        
        vel.dx *= 0.95;
        vel.dy *= 0.95;
        vel.maxSpeed = 3 * traits.speed;
        vel.clamp();
        status.state = 'swimming';
    }
}

class BirdBehavior {
    constructor(world) {
        this.world = world;
    }
    
    update(entity, dt) {
        const pos = entity.getComponent(ComponentType.POSITION);
        const vel = entity.getComponent(ComponentType.VELOCITY);
        const stats = entity.getComponent(ComponentType.STATS);
        const traits = entity.getComponent(ComponentType.TRAITS);
        const status = entity.getComponent(ComponentType.STATUS);
        
        const senseRadius = 250 * traits.senseRadius;
        const nearby = this.world.getNearbyEntities(pos, senseRadius);
        
        // Hunt fish or small herbivores
        const prey = nearby.filter(n => {
            const species = n.entity.getComponent(ComponentType.STATS)?.species;
            return species === 'fish' || species === 'herbivore';
        });
        
        if (stats.energy < stats.maxEnergy * 0.7 && prey.length > 0) {
            const target = prey[0];
            const targetPos = target.entity.getComponent(ComponentType.POSITION);
            const dx = targetPos.x - pos.x;
            const dy = targetPos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                // Attack
                const targetStats = target.entity.getComponent(ComponentType.STATS);
                const targetSpecies = targetStats.species;
                const damage = 40 * traits.attackStrength;
                targetStats.energy -= damage;
                const energyGained = damage * 0.7;
                stats.energy = Math.min(stats.maxEnergy, stats.energy + energyGained);
                
                // Log the hunting action
                status.logAction('hunted', stats.age, {
                    target: targetSpecies,
                    energyGained: Math.round(energyGained),
                    damage: Math.round(damage),
                    position: { x: Math.round(pos.x), y: Math.round(pos.y) }
                });
                
                if (targetStats.energy <= 0) {
                    this.world.pool.release(target.entity);
                }
                
                status.state = 'attacking';
            } else {
                vel.dx = (dx / dist) * 4 * traits.speed;
                vel.dy = (dy / dist) * 4 * traits.speed;
                status.state = 'hunting';
            }
            return;
        }
        
        // Soar and wander
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            vel.dx = Math.cos(angle) * 3 * traits.speed;
            vel.dy = Math.sin(angle) * 3 * traits.speed;
        }
        
        vel.dx *= 0.98;
        vel.dy *= 0.98;
        vel.maxSpeed = 4 * traits.speed;
        vel.clamp();
        status.state = 'soaring';
    }
}
