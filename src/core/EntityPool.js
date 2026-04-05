import { Entity, ComponentType, Position, Velocity, Appearance, Stats, Status, Genetics, Traits } from './Entity.js';
import { SPECIES_CONFIG, getSpeciesConfig } from './SpeciesConfig.js';
import { createBaseEntity } from './EntityBuilder.js';

/**
 * EntityPool manages object reuse for entities to reduce garbage collection.
 * Maintains separate pools for each species type.
 */
export class EntityPool {
    constructor(world) {
        this.world = world;
        
        // Pools for each species type
        this.pools = {
            herbivore: { active: [], inactive: [] },
            predator: { active: [], inactive: [] },
            plant: { active: [], inactive: [] },
            fish: { active: [], inactive: [] },
            bird: { active: [], inactive: [] }
        };
        
        // Pool configuration
        this.config = {
            initialSize: {
                herbivore: 50,
                predator: 30,
                plant: 100,
                fish: 40,
                bird: 30
            },
            expansionFactor: 1.25
        };
    }
    
    /**
     * Pre-allocate entity pools for each species type
     */
    preAllocate() {
        for (const species in this.config.initialSize) {
            const count = this.config.initialSize[species];
            this.expandPool(species, count);
        }
    }
    
    /**
     * Acquire an entity from the pool or create a new one
     * @param {string} species - The species type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Genetics} genetics - Optional genetics component
     * @param {number} generation - Generation number (default 1)
     * @returns {Entity} The acquired entity
     */
    acquire(species, x, y, genetics = null, generation = 1) {
        const pool = this.pools[species];
        if (!pool) {
            throw new Error(`Unknown species: ${species}`);
        }
        
        let entity;
        
        // Try to reuse an inactive entity
        if (pool.inactive.length > 0) {
            entity = pool.inactive.pop();
            this.resetEntity(entity, species, x, y, genetics, generation);
        } else {
            // Create new entity if pool is empty
            entity = this.createNewEntity(species, x, y, genetics, generation);
            console.warn(`[EntityPool] Pool depleted for ${species}, creating new entity`);
        }
        
        // Move to active pool
        pool.active.push(entity);
        
        return entity;
    }
    
    /**
     * Release an entity back to the pool
     * @param {Entity} entity - The entity to release
     */
    release(entity) {
        if (!entity.hasComponent(ComponentType.STATS)) {
            console.error('[EntityPool] Cannot release entity without Stats component');
            return;
        }
        
        const stats = entity.getComponent(ComponentType.STATS);
        const species = stats.species;
        const pool = this.pools[species];
        
        if (!pool) {
            console.error(`[EntityPool] Unknown species: ${species}`);
            return;
        }
        
        // Remove from active pool
        const activeIndex = pool.active.indexOf(entity);
        if (activeIndex > -1) {
            pool.active.splice(activeIndex, 1);
        }
        
        // Mark as inactive
        entity.active = false;
        
        // Add to inactive pool for reuse
        pool.inactive.push(entity);
    }
    
    /**
     * Expand a species pool by creating new entities
     * @param {string} species - The species type
     * @param {number} count - Number of entities to create
     */
    expandPool(species, count) {
        const pool = this.pools[species];
        if (!pool) {
            throw new Error(`Unknown species: ${species}`);
        }
        
        for (let i = 0; i < count; i++) {
            const entity = this.createNewEntity(species, 0, 0, null);
            entity.active = false;
            pool.inactive.push(entity);
        }
    }
    
    /**
     * Create a new entity with all components
     * @param {string} species - The species type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Genetics} genetics - Optional genetics component
     * @param {number} generation - Generation number (default 1)
     * @returns {Entity} The new entity
     */
    createNewEntity(species, x, y, genetics = null, generation = 1) {
        return createBaseEntity(Entity, species, x, y, genetics, generation);
    }
    
    /**
     * Reset an entity's state for reuse
     * @param {Entity} entity - The entity to reset
     * @param {string} species - The species type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Genetics} genetics - Optional genetics component
     * @param {number} generation - Generation number (default 1)
     */
    resetEntity(entity, species, x, y, genetics = null, generation = 1) {
        const config = getSpeciesConfig(species);
        
        // Reset active state
        entity.active = true;
        
        // Reset Position
        const pos = entity.getComponent(ComponentType.POSITION);
        pos.set(x, y);
        pos.prevX = x;
        pos.prevY = y;
        
        // Reset Velocity
        const vel = entity.getComponent(ComponentType.VELOCITY);
        vel.dx = 0;
        vel.dy = 0;
        
        // Reset Appearance (in case it was modified)
        const appearance = entity.getComponent(ComponentType.APPEARANCE);
        appearance.emoji = config.emoji;
        appearance.color = config.color;
        appearance.size = 1.0;
        appearance.layer = config.layer;
        appearance.visible = true;
        
        // Reset Stats
        const stats = entity.getComponent(ComponentType.STATS);
        stats.species = species;
        stats.energy = config.initialEnergy;
        stats.maxEnergy = config.maxEnergy;
        stats.health = 100;
        stats.maxHealth = 100;
        stats.age = 0;
        stats.reproductionCooldown = 0;
        stats.generation = generation;
        
        // Reset Status
        const status = entity.getComponent(ComponentType.STATUS);
        status.state = 'idle';
        status.target = null;
        status.lastReproduction = 0;
        status.showingHeart = 0;
        
        // Reset or create new Genetics
        if (genetics) {
            entity.components.set(ComponentType.GENETICS, genetics);
        } else {
            entity.components.set(ComponentType.GENETICS, new Genetics());
        }
        
        // Reset Traits based on new genetics
        const geneComponent = entity.getComponent(ComponentType.GENETICS);
        entity.components.set(ComponentType.TRAITS, new Traits(geneComponent));
    }
    
    /**
     * Get pool statistics
     * @returns {Object} Pool statistics
     */
    getStats() {
        const stats = {};
        
        for (const species in this.pools) {
            const pool = this.pools[species];
            stats[species] = {
                active: pool.active.length,
                inactive: pool.inactive.length,
                total: pool.active.length + pool.inactive.length
            };
        }
        
        return stats;
    }
    
    /**
     * Clear all pools
     */
    clear() {
        for (const species in this.pools) {
            this.pools[species].active = [];
            this.pools[species].inactive = [];
        }
    }
}
