import { ComponentType } from './Entity.js';

/**
 * Find the closest entity to a position within a maximum distance
 * @param {World} world - The world instance
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {number} maxDist - Maximum distance to consider
 * @returns {Entity|null} The closest entity or null
 */
export function findClosestEntity(world, x, y, maxDist) {
    let closestEntity = null;
    let closestDist = maxDist;
    
    for (const entity of world.getActiveEntities()) {
        if (!entity.hasComponent(ComponentType.POSITION)) continue;
        
        const pos = entity.getComponent(ComponentType.POSITION);
        const dx = pos.x - x;
        const dy = pos.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
            closestDist = dist;
            closestEntity = entity;
        }
    }
    
    return closestEntity;
}
