import { Phenotype } from '../genetics/Phenotype.js';

/** Physiological state. Energy is absolute; hydration, stamina are 0..1. */
export class Needs {
    constructor(traits, energy) {
        this.energy = Math.min(energy, traits.energyCapacity);
        this.hydration = 1;
        this.health = traits.maxHealth;
        this.stamina = 1;
        this.sprinting = false;
        this.resting = false;
        this.lastDamage = null;
    }
}

export class Lifecycle {
    constructor(generation, parents) {
        this.age = 0;
        this.generation = generation;
        this.parents = parents;
        this.breedCooldown = 0;
        this.causeOfDeath = null;
        this.bornAt = 0;
        this.diedAt = null;
    }
}

/** Decision-making state owned by the Brain. */
export class Mind {
    constructor(random) {
        this.action = 'wander';
        this.target = null;
        this.point = { x: 0, y: 0, valid: false };
        this.thinkTimer = random.float(0, 0.2);
        this.wanderAngle = random.angle();
        this.attackTimer = 0;
        this.ignore = new Map();
        this.desiredX = 0;
        this.desiredY = 0;
        this.desiredSpeed = 0;
        this.flockX = 0;
        this.flockY = 0;
        this.sepX = 0;
        this.sepY = 0;
        this.neighbors = 0;
        this.crowded = false;
        this.label = 'Wandering';
        this.threat = null;
        this.threatDistance = Infinity;
    }
}

/** Lifetime achievements, shown in the inspector. */
export class Record {
    constructor() {
        this.kills = 0;
        this.offspring = 0;
        this.eaten = 0;
        this.distance = 0;
    }
}

export class Creature {
    /**
     * @param {object} params
     * @param {number} params.id
     * @param {object} params.species  archetype from config/species.js
     * @param {import('../genetics/Genome.js').Genome} params.genome
     */
    constructor({ id, species, genome, x, y, energy, generation = 1, parents = null, random }) {
        this.id = id;
        this.species = species;
        this.genome = genome;
        this.traits = new Phenotype(species, genome);
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.heading = random.angle();
        this.alive = true;
        this.needs = new Needs(this.traits, energy ?? this.traits.energyCapacity * 0.7);
        this.life = new Lifecycle(generation, parents);
        this.life.longevity = random.float(0.7, 1.3);
        this.mind = new Mind(random);
        this.record = new Record();
        this.animPhase = random.float(0, 10);
    }

    get speciesId() {
        return this.species.id;
    }

    get isMature() {
        return this.life.age >= this.traits.maturity;
    }

    /** Visual/physical growth factor: juveniles start at half size. */
    get growth() {
        return Math.min(1, 0.5 + 0.5 * (this.life.age / this.traits.maturity));
    }

    get radius() {
        return this.traits.radius * this.growth;
    }

    /** Individual life expectancy: the species/genome value scaled by personal longevity. */
    get lifespan() {
        return this.traits.lifespan * this.life.longevity;
    }

    get hunger() {
        return 1 - this.needs.energy / this.traits.energyCapacity;
    }

    get thirst() {
        return 1 - this.needs.hydration;
    }

    get speed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
}

/** Remains of a dead creature: food for scavengers, then fertilizer. */
export class Corpse {
    constructor({ id, x, y, meat, speciesId, radius }) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.meat = meat;
        this.maxMeat = meat;
        this.speciesId = speciesId;
        this.radius = radius;
        this.age = 0;
        this.alive = true;
    }
}
