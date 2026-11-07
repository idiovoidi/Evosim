import { SpatialHash } from './SpatialHash.js';
import { Creature, Corpse } from './creatures/Creature.js';
import { Genome } from './genetics/Genome.js';
import { SPECIES } from '../config/species.js';
import { BIOMES } from '../config/biomes.js';
import { SpawnError } from '../errors/EvosimError.js';
import { decorate, validated, is } from '../utils/decorators.js';

/**
 * Mutable simulation state: terrain, vegetation, clock, creatures and corpses.
 * Systems read and write the world; the world itself contains no rules.
 */
export class World {
    /**
     * @param {object} deps
     * @param {object} deps.config
     * @param {import('./terrain/Terrain.js').Terrain} deps.terrain
     * @param {import('./terrain/VegetationField.js').VegetationField} deps.vegetation
     * @param {import('./Clock.js').Clock} deps.clock
     * @param {import('../utils/random.js').Random} deps.random
     * @param {import('../utils/EventBus.js').EventBus} deps.events
     */
    constructor({ config, terrain, vegetation, clock, random, events, seed }) {
        this.config = config;
        this.seed = seed;
        this.terrain = terrain;
        this.vegetation = vegetation;
        this.clock = clock;
        this.random = random;
        this.events = events;
        this.width = terrain.width;
        this.height = terrain.height;
        this.creatures = [];
        this.corpses = [];
        this.pendingBirths = [];
        this.nextId = 1;
        this.spatial = new SpatialHash(this.width, this.height, 64);
        this.corpseIndex = new SpatialHash(this.width, this.height, 96);
        this.counts = Object.fromEntries(Object.keys(SPECIES).map((id) => [id, 0]));
        this.totals = { births: 0, deaths: 0, kills: 0, maxGeneration: 1 };
    }

    get time() {
        return this.clock.time;
    }

    spawn(speciesId, x, y, { genome, generation = 1, parents = null, energy } = {}) {
        const species = SPECIES[speciesId];
        const creature = new Creature({
            id: this.nextId++,
            species,
            genome: genome ?? Genome.random(this.random, species.geneInit),
            x,
            y,
            energy,
            generation,
            parents,
            random: this.random,
        });
        creature.life.bornAt = this.time;
        this.creatures.push(creature);
        this.counts[speciesId]++;
        if (generation > this.totals.maxGeneration) this.totals.maxGeneration = generation;
        return creature;
    }

    /** Spawn at a random location appropriate for the species' habitat. */
    spawnRandom(speciesId, options) {
        const species = SPECIES[speciesId];
        const t = this.terrain;
        const predicate = species.habitat === 'water'
            ? (i) => t.water[i] === 1 && t.distToLand[i] > 1
            : (i) => t.water[i] === 0 && t.distToWater[i] < 25 && BIOMES[t.biome[i]].fertility > 0.3;
        const spot = t.randomCell(this.random, predicate);
        if (!spot) throw new SpawnError(`No valid spawn location for ${speciesId}`);
        return this.spawn(speciesId, spot.x, spot.y, options);
    }

    addCorpse(creature) {
        const corpse = new Corpse({
            id: this.nextId++,
            x: creature.x,
            y: creature.y,
            meat: creature.traits.meat * creature.growth,
            speciesId: creature.speciesId,
            radius: creature.radius,
        });
        this.corpses.push(corpse);
        return corpse;
    }

    /** Mark a creature dead and leave a corpse; returns the corpse. */
    kill(creature, cause) {
        if (!creature.alive) return null;
        creature.alive = false;
        creature.life.causeOfDeath = cause;
        creature.life.diedAt = this.time;
        this.counts[creature.speciesId]--;
        this.totals.deaths++;
        const corpse = this.addCorpse(creature);
        this.events.emit('death', { creature, cause });
        return corpse;
    }

    findById(id) {
        return this.creatures.find((c) => c.id === id && c.alive) ?? null;
    }

    reindex() {
        this.spatial.rebuild(this.creatures);
        this.corpseIndex.rebuild(this.corpses);
    }

    /** Drop dead creatures and consumed corpses from the live arrays. */
    compact() {
        if (this.creatures.some((c) => !c.alive)) this.creatures = this.creatures.filter((c) => c.alive);
        if (this.corpses.some((c) => !c.alive)) this.corpses = this.corpses.filter((c) => c.alive);
    }
}

decorate(World, {
    spawn: [validated(SpawnError,
        (id) => id in SPECIES || `unknown species "${id}"`,
        is.finite,
        is.finite)],
});
