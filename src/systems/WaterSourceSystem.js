import { WaterSource } from './WaterSource.js';
import { ComponentType } from '../core/Entity.js';

/**
 * WaterSourceSystem
 * 
 * Manages water sources in the ecosystem and handles thirst mechanics for entities.
 * Responsibilities:
 * - Generate water sources during world initialization
 * - Decrease entity thirst over time
 * - Restore thirst when entities reach water sources
 * - Apply dehydration damage when thirst reaches 0
 */
export class WaterSourceSystem {
    /**
     * @param {World} world - The world instance
     */
    constructor(world) {
        this.world = world;
        this.waterSources = [];
    }
    
    /**
     * Generate water sources across the world
     * Places sources in biomes with high water affinity (water, deep_water, sand)
     * Ensures minimum spacing between sources
     * @returns {WaterSource[]} Array of generated water sources
     */
    generateWaterSources() {
        const worldSize = this.world.width * this.world.height;
        const baseSize = 2000 * 2000; // Reference size
        const baseCount = 5;
        const scaleFactor = worldSize / baseSize;
        
        // Calculate count: 5 + (worldSize / baseSize * 10), clamped to 5-15
        const count = Math.floor(baseCount + (scaleFactor * 10));
        const finalCount = Math.max(5, Math.min(15, count));
        
        const sources = [];
        const minDistance = 200; // Minimum spacing between sources
        const maxAttempts = finalCount * 10;
        
        // Biomes with high water affinity (>0.3)
        // Based on biome definitions: water and deep_water are water biomes
        // Sand is coastal and should also have water sources
        const waterBiomes = ['water', 'deep_water', 'sand'];
        
        for (let attempt = 0; attempt < maxAttempts && sources.length < finalCount; attempt++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            
            // Check if position is in a water-affinity biome
            const biome = this.world.getBiomeAt(x, y);
            if (!biome || !waterBiomes.includes(biome.id)) {
                continue;
            }
            
            // Check minimum distance from other sources
            const tooClose = sources.some(source => source.distanceTo(x, y) < minDistance);
            if (tooClose) {
                continue;
            }
            
            // Create water source
            sources.push(new WaterSource(x, y));
        }
        
        // If we didn't generate enough sources, create some at random valid positions
        if (sources.length < 3) {
            console.warn(`[WaterSourceSystem] Only generated ${sources.length} water sources, adding fallback sources`);
            
            for (let i = sources.length; i < 3; i++) {
                const x = Math.random() * this.world.width;
                const y = Math.random() * this.world.height;
                sources.push(new WaterSource(x, y));
            }
        }
        
        this.waterSources = sources;
        console.log(`[WaterSourceSystem] Generated ${sources.length} water sources`);
        return sources;
    }
    
    /**
     * Update the water source system
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Iterate through all entities with ThirstComponent
        for (const entity of this.world.entities) {
            if (!entity.active || !entity.hasComponent(ComponentType.THIRST)) {
                continue;
            }
            
            const thirst = entity.getComponent(ComponentType.THIRST);
            const position = entity.getComponent(ComponentType.POSITION);
            const stats = entity.getComponent(ComponentType.STATS);
            
            if (!position || !stats) continue;
            
            // Decrease thirst over time
            thirst.thirst -= thirst.thirstRate * dt;
            thirst.thirst = Math.max(0, thirst.thirst);
            
            // Check if entity is near any water source
            let isNearWater = false;
            for (const waterSource of this.waterSources) {
                if (waterSource.isInRange(position.x, position.y)) {
                    isNearWater = true;
                    
                    // Restore thirst
                    thirst.isDrinking = true;
                    thirst.thirst += thirst.drinkingRate * dt;
                    thirst.thirst = Math.min(thirst.maxThirst, thirst.thirst);
                    thirst.lastDrinkTime = this.world.time;
                    
                    // Increment visit count
                    waterSource.visitCount++;
                    
                    break;
                }
            }
            
            // Reset drinking state if not near water
            if (!isNearWater) {
                thirst.isDrinking = false;
            }
            
            // Apply dehydration damage if thirst is 0
            if (thirst.thirst <= 0) {
                stats.health -= 1 * dt;
            }
        }
    }
}
