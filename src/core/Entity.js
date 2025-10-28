export class Entity {
    static nextId = 0;
    
    constructor() {
        this.id = Entity.nextId++;
        this.active = true;
        this.components = new Map();
    }
    
    addComponent(type, component) {
        this.components.set(type, component);
        return this;
    }
    
    getComponent(type) {
        return this.components.get(type);
    }
    
    hasComponent(type) {
        return this.components.has(type);
    }
    
    hasComponents(...types) {
        return types.every(type => this.hasComponent(type));
    }
    
    removeComponent(type) {
        this.components.delete(type);
    }
}

// Component types
export const ComponentType = {
    POSITION: 'position',
    VELOCITY: 'velocity',
    APPEARANCE: 'appearance',
    STATS: 'stats',
    STATUS: 'status',
    GENETICS: 'genetics',
    TRAITS: 'traits',
    BEHAVIOR: 'behavior',
    BIOME: 'biome',
    HABITAT: 'habitat'
};

// Component classes
export class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
    }
    
    set(x, y) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x = x;
        this.y = y;
    }
    
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export class Velocity {
    constructor(dx = 0, dy = 0) {
        this.dx = dx;
        this.dy = dy;
        this.maxSpeed = 5.0;
    }
    
    set(dx, dy) {
        this.dx = dx;
        this.dy = dy;
        this.clamp();
    }
    
    clamp() {
        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (speed > this.maxSpeed) {
            this.dx = (this.dx / speed) * this.maxSpeed;
            this.dy = (this.dy / speed) * this.maxSpeed;
        }
    }
}

export class Appearance {
    constructor(emoji, color, size = 1.0, layer = 0) {
        this.emoji = emoji;
        this.color = color;
        this.size = size;
        this.layer = layer;
        this.visible = true;
    }
}

export class Stats {
    constructor(species, energy, maxEnergy, generation = 1) {
        this.species = species;
        this.energy = energy;
        this.maxEnergy = maxEnergy;
        this.health = 100;
        this.maxHealth = 100;
        this.age = 0;
        this.reproductionCooldown = 0;
        this.generation = generation;
    }
}

export class Status {
    constructor() {
        this.state = 'idle';
        this.target = null;
        this.lastReproduction = 0;
        this.showingHeart = 0;
        this.actionLog = []; // Array to store recent actions
    }
    
    /**
     * Log an action to the entity's history
     * @param {string} action - The action type (ate, fled, hunted, reproduced, died)
     * @param {number} timestamp - The simulation time when the action occurred
     * @param {Object} details - Additional details about the action
     */
    logAction(action, timestamp, details = {}) {
        this.actionLog.push({
            action,
            timestamp,
            details
        });
        
        // Keep only the last 10 actions to prevent memory bloat
        if (this.actionLog.length > 10) {
            this.actionLog.shift();
        }
    }
    
    /**
     * Get the most recent actions (default: last 5)
     * @param {number} count - Number of recent actions to retrieve
     * @returns {Array} Array of recent actions
     */
    getRecentActions(count = 5) {
        return this.actionLog.slice(-count);
    }
}

export class Genetics {
    constructor(genes = null) {
        this.genes = genes || this.generateRandomGenes();
    }
    
    generateRandomGenes() {
        return {
            speed: 0.7 + Math.random() * 0.6,
            metabolism: 0.8 + Math.random() * 0.4,
            senseRadius: 0.8 + Math.random() * 0.4,
            size: 0.85 + Math.random() * 0.3,
            attackStrength: 0.8 + Math.random() * 0.4,
            colorVariation: Math.random()
        };
    }
    
    crossover(other, mutationRate = 0.1) {
        const newGenes = {};
        for (const key in this.genes) {
            // Inherit from random parent
            let value = Math.random() < 0.5 ? this.genes[key] : other.genes[key];
            
            // Apply mutation
            if (Math.random() < mutationRate) {
                value *= 0.9 + Math.random() * 0.2;
                value = Math.max(0.5, Math.min(1.5, value));
            }
            
            newGenes[key] = value;
        }
        return new Genetics(newGenes);
    }
}

export class Traits {
    constructor(genetics) {
        this.speed = genetics.genes.speed;
        this.metabolism = genetics.genes.metabolism;
        this.senseRadius = genetics.genes.senseRadius;
        this.size = genetics.genes.size;
        this.attackStrength = genetics.genes.attackStrength;
    }
}

export class BiomeComponent {
    constructor() {
        this.currentBiome = null;           // Current biome type ID
        this.biomeEffects = {               // Active modifiers
            movementMultiplier: 1.0,
            energyMultiplier: 1.0,
            visibilityMultiplier: 1.0,
            concealmentBonus: 0.0
        };
        this.timeInBiome = 0;               // Duration in current biome
        this.lastBiomeChange = 0;           // Timestamp of last biome change
    }
}

export class HabitatComponent {
    constructor(preferences = {}) {
        // Map of biome ID to preference value (0.0 to 2.0)
        // 1.0 = neutral, >1.0 = preferred, <1.0 = avoided
        this.preferences = preferences;
        
        // Derived from preferences
        this.preferredBiomes = [];          // List of biome IDs with preference > 1.2
        this.avoidedBiomes = [];            // List of biome IDs with preference < 0.8
        
        // Initialize derived arrays
        this._updateDerivedArrays();
    }
    
    /**
     * Get preference value for a specific biome
     * @param {string} biomeId - The biome identifier
     * @returns {number} Preference value (default 1.0 if not specified)
     */
    getPreference(biomeId) {
        return this.preferences[biomeId] || 1.0;
    }
    
    /**
     * Check if a biome is preferred by this entity
     * @param {string} biomeId - The biome identifier
     * @returns {boolean} True if preference > 1.2
     */
    isPreferred(biomeId) {
        return this.getPreference(biomeId) > 1.2;
    }
    
    /**
     * Check if a biome is avoided by this entity
     * @param {string} biomeId - The biome identifier
     * @returns {boolean} True if preference < 0.8
     */
    isAvoided(biomeId) {
        return this.getPreference(biomeId) < 0.8;
    }
    
    /**
     * Update the derived arrays based on current preferences
     * @private
     */
    _updateDerivedArrays() {
        this.preferredBiomes = [];
        this.avoidedBiomes = [];
        
        for (const [biomeId, preference] of Object.entries(this.preferences)) {
            if (preference > 1.2) {
                this.preferredBiomes.push(biomeId);
            } else if (preference < 0.8) {
                this.avoidedBiomes.push(biomeId);
            }
        }
    }
}
