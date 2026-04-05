/**
 * Shared entity building utilities
 * Eliminates duplication between EntityFactory and EntityPool
 */

import { ComponentType, Position, Velocity, Appearance, Stats, Status, Genetics, Traits } from './Entity.js';
import { getSpeciesConfig } from './SpeciesConfig.js';

/**
 * Create base entity with standard components
 * @param {string} species - Entity species
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Genetics} genetics - Optional genetics
 * @param {number} generation - Generation number
 * @returns {Entity} Entity with base components
 */
export function createBaseEntity(EntityClass, species, x, y, genetics = null, generation = 1) {
    const config = getSpeciesConfig(species);
    const entity = new EntityClass();
    
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
    
    return entity;
}

/**
 * Calculate offspring generation from parents
 * @param {number} gen1 - Parent 1 generation
 * @param {number} gen2 - Parent 2 generation
 * @returns {number} Offspring generation
 */
export function calculateOffspringGeneration(gen1, gen2) {
    return Math.max(gen1 || 1, gen2 || 1) + 1;
}

/**
 * Calculate spawn position near a parent with random offset
 * @param {Object} world - World with width/height
 * @param {number} parentX - Parent X position
 * @param {number} parentY - Parent Y position
 * @param {number} offsetRange - Max offset distance (default 50)
 * @returns {Object} Spawn position {x, y}
 */
export function calculateSpawnPosition(world, parentX, parentY, offsetRange = 50) {
    const offsetX = (Math.random() - 0.5) * offsetRange;
    const offsetY = (Math.random() - 0.5) * offsetRange;
    
    return {
        x: Math.max(0, Math.min(world.width, parentX + offsetX)),
        y: Math.max(0, Math.min(world.height, parentY + offsetY))
    };
}
