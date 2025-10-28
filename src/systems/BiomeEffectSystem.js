import { ComponentType } from '../core/Entity.js';

/**
 * BiomeEffectSystem - Manages biome effects on entities
 * Detects biome changes and applies modifiers based on habitat preferences
 */
export class BiomeEffectSystem {
    constructor(world) {
        this.world = world;
        this.biomeGenerator = world.biomeGenerator;
    }
    
    /**
     * Update all entities with biome effects
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        for (const entity of this.world.getActiveEntities()) {
            // Skip entities without biome component
            if (!entity.hasComponent(ComponentType.BIOME)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const biomeComp = entity.getComponent(ComponentType.BIOME);
            const habitat = entity.getComponent(ComponentType.HABITAT);
            
            // Skip if no position component
            if (!pos) continue;
            
            // Get current biome at entity position
            const currentBiome = this.biomeGenerator.getBiomeAt(pos.x, pos.y);
            
            // Check if biome changed
            if (biomeComp.currentBiome !== currentBiome.id) {
                this.onBiomeChange(entity, currentBiome, biomeComp, habitat);
            }
            
            // Update time in biome
            biomeComp.timeInBiome += dt;
            
            // Apply ongoing biome effects
            this.applyBiomeEffects(entity, currentBiome, biomeComp, habitat, dt);
        }
    }
    
    /**
     * Handle biome change event for an entity
     * Calculates and applies effective modifiers based on habitat preference
     * @param {Entity} entity - The entity changing biomes
     * @param {BiomeType} newBiome - The new biome
     * @param {BiomeComponent} biomeComp - The entity's biome component
     * @param {HabitatComponent} habitat - The entity's habitat component (optional)
     */
    onBiomeChange(entity, newBiome, biomeComp, habitat) {
        // Update biome component
        biomeComp.currentBiome = newBiome.id;
        biomeComp.timeInBiome = 0;
        biomeComp.lastBiomeChange = this.world.time;
        
        // Get habitat preference for this biome (default to 1.0 if no habitat component)
        const preference = habitat ? habitat.getPreference(newBiome.id) : 1.0;
        
        // Calculate effective modifiers based on habitat preference
        // Movement: preference directly affects movement (preferred = faster)
        biomeComp.biomeEffects.movementMultiplier = 
            newBiome.movementModifier * preference;
        
        // Energy: inverse relationship (preferred = less energy consumption)
        // Formula: energyModifier * (2.0 - preference)
        // preference 1.8 -> multiplier 0.2 (80% reduction)
        // preference 1.0 -> multiplier 1.0 (no change)
        // preference 0.5 -> multiplier 1.5 (50% increase)
        biomeComp.biomeEffects.energyMultiplier = 
            newBiome.energyModifier * (2.0 - preference);
        
        // Visibility: use biome's visibility modifier directly
        biomeComp.biomeEffects.visibilityMultiplier = 
            newBiome.visibilityModifier;
        
        // Concealment: use biome's concealment bonus directly
        biomeComp.biomeEffects.concealmentBonus = 
            newBiome.concealmentBonus;
    }
    
    /**
     * Apply cumulative biome effects over time
     * Handles special cases like harsh biome energy drain
     * @param {Entity} entity - The entity
     * @param {BiomeType} biome - Current biome
     * @param {BiomeComponent} biomeComp - The entity's biome component
     * @param {HabitatComponent} habitat - The entity's habitat component (optional)
     * @param {number} dt - Delta time in seconds
     */
    applyBiomeEffects(entity, biome, biomeComp, habitat, dt) {
        // Most effects are applied by other systems reading biomeComp.biomeEffects
        // This method handles special cumulative effects
        
        // Harsh biome cumulative drain
        // If energy multiplier is high (>1.3) and entity has been in biome for a while (>10s)
        if (biomeComp.biomeEffects.energyMultiplier > 1.3 && 
            biomeComp.timeInBiome > 10.0) {
            
            const stats = entity.getComponent(ComponentType.STATS);
            if (stats) {
                // Apply additional drain that increases with time
                // Drain rate increases linearly: 0.5 energy/sec at 10s, 1.0 at 20s, etc.
                const drainRate = 0.5 * (biomeComp.timeInBiome / 10.0);
                stats.energy -= drainRate * dt;
            }
        }
    }
}
