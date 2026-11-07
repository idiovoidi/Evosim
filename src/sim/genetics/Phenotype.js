/**
 * Physical traits expressed from a genome for a given species archetype.
 * This is where evolutionary trade-offs live: every advantage carries upkeep.
 */
export class Phenotype {
    /**
     * @param {object} species  entry from config/species.js
     * @param {import('./Genome.js').Genome} genome
     */
    constructor(species, genome) {
        const g = genome.values;
        const mass = g.size * g.size;
        const allometric = Math.pow(mass, 0.75);

        this.mass = mass;
        this.radius = species.radius * g.size;
        this.maxSpeed = species.speed * g.speed * Math.pow(g.size, -0.18);
        this.cruiseSpeed = this.maxSpeed * 0.5;
        this.sense = species.sense * g.sense;
        this.energyCapacity = species.energy * mass;
        this.basal = species.basal * allometric * (1 + 0.18 * (g.endurance - 1)) + species.basal * 0.22 * (g.sense - 1);
        this.moveCost = species.moveCost * mass / (species.speed * species.speed);
        this.bite = species.bite * allometric;
        this.attack = species.attack * mass * (0.75 + 0.5 * g.boldness);
        this.maxHealth = species.health * Math.pow(mass, 0.8);
        this.sprintDuration = 4 * g.endurance;
        this.maturity = species.maturity * Math.sqrt(g.size);
        this.lifespan = species.lifespan * Math.pow(g.size, 0.3);
        this.litter = Math.max(1, Math.round(g.litter));
        this.breedCooldown = species.breedCooldown * (0.75 + 0.15 * this.litter);
        this.fleeDistance = this.sense * (0.85 - 0.55 * g.boldness);
        this.sociality = g.sociality;
        this.boldness = g.boldness;
        this.thirstRate = species.thirst * (0.8 + 0.2 * allometric);
        this.meat = species.meat * mass;

        const p = species.palette;
        this.hue = (p.hue + (g.hue - 0.5) * p.hueSpread + 360) % 360;
        this.saturation = p.sat;
        this.lightness = p.light;
    }
}
