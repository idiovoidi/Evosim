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
    BEHAVIOR: 'behavior'
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
    constructor(species, energy, maxEnergy) {
        this.species = species;
        this.energy = energy;
        this.maxEnergy = maxEnergy;
        this.health = 100;
        this.maxHealth = 100;
        this.age = 0;
        this.reproductionCooldown = 0;
    }
}

export class Status {
    constructor() {
        this.state = 'idle';
        this.target = null;
        this.lastReproduction = 0;
        this.showingHeart = 0;
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
