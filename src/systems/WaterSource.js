/**
 * WaterSource
 * 
 * Represents a water source in the ecosystem that entities must visit
 * to satisfy their thirst needs. Tracks usage statistics and nearby
 * entities for ambush detection.
 */
export class WaterSource {
    /**
     * @param {number} x - X coordinate of the water source
     * @param {number} y - Y coordinate of the water source
     * @param {number} radius - Interaction radius (default: 30 units)
     */
    constructor(x, y, radius = 30) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        
        // Usage tracking
        this.visitCount = 0;              // Total visits since creation
        this.recentVisits = 0;            // Visits in the last minute
        this.lastResetTime = 0;           // Timestamp for per-minute tracking
        
        // Ambush detection
        this.nearbyEntities = [];         // Entities within 100 units
    }
    
    /**
     * Calculate distance from this water source to a point
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     * @returns {number} Distance in world units
     */
    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check if a point is within interaction range of this water source
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     * @returns {boolean} True if within range
     */
    isInRange(x, y) {
        return this.distanceTo(x, y) <= this.radius;
    }
}
