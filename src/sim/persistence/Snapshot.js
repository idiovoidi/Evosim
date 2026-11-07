import { Simulation } from '../Simulation.js';
import { Genome } from '../genetics/Genome.js';
import { Corpse } from '../creatures/Creature.js';
import { SPECIES } from '../../config/species.js';
import { LoadError, SaveError } from '../../errors/EvosimError.js';
import { guarded } from '../../utils/decorators.js';

export const SNAPSHOT_VERSION = 2;

const round = (v, digits = 2) => Math.round(v * 10 ** digits) / 10 ** digits;

/**
 * Serialize a simulation to plain JSON. Terrain is not stored: it is
 * regenerated deterministically from the seed.
 */
export function toSnapshot(sim) {
    const world = sim.world;
    return {
        version: SNAPSHOT_VERSION,
        savedAt: Date.now(),
        seed: sim.seed,
        overrides: sim.overrides,
        clock: world.clock.serialize(),
        vegetation: world.vegetation.serialize(),
        nextId: world.nextId,
        totals: world.totals,
        stats: sim.stats.serialize(),
        creatures: world.creatures.filter((c) => c.alive).map((c) => ({
            id: c.id,
            s: c.speciesId,
            g: c.genome.values,
            p: [round(c.x), round(c.y), round(c.vx), round(c.vy), round(c.heading, 3)],
            n: [round(c.needs.energy), round(c.needs.hydration, 3), round(c.needs.health), round(c.needs.stamina, 3)],
            l: [round(c.life.age), c.life.generation, round(c.life.breedCooldown), c.life.parents, round(c.life.longevity, 3)],
            r: [c.record.kills, c.record.offspring, round(c.record.eaten, 0), round(c.record.distance, 0)],
        })),
        corpses: world.corpses.filter((k) => k.alive).map((k) => ({
            id: k.id, x: round(k.x), y: round(k.y), meat: round(k.meat), maxMeat: round(k.maxMeat),
            speciesId: k.speciesId, radius: round(k.radius), age: round(k.age),
        })),
    };
}

/** Rebuild a simulation from a snapshot produced by `toSnapshot`. */
export function fromSnapshot(data, { events, profiler } = {}) {
    if (!data || data.version !== SNAPSHOT_VERSION) {
        throw new LoadError(`Unsupported save version ${data?.version}`);
    }
    const sim = new Simulation({ seed: data.seed, overrides: data.overrides ?? {}, events, profiler });
    const world = sim.world;
    world.clock.restore(data.clock);
    world.vegetation.restore(data.vegetation);
    world.totals = { ...world.totals, ...data.totals };
    sim.stats.restore(data.stats);

    for (const entry of data.creatures) {
        if (!SPECIES[entry.s]) continue;
        const [x, y, vx, vy, heading] = entry.p;
        const c = world.spawn(entry.s, x, y, {
            genome: new Genome(entry.g),
            generation: entry.l[1],
            parents: entry.l[3],
        });
        c.id = entry.id;
        c.vx = vx;
        c.vy = vy;
        c.heading = heading;
        [c.needs.energy, c.needs.hydration, c.needs.health, c.needs.stamina] = entry.n;
        c.life.age = entry.l[0];
        c.life.breedCooldown = entry.l[2];
        c.life.longevity = entry.l[4] ?? c.life.longevity;
        [c.record.kills, c.record.offspring, c.record.eaten, c.record.distance] = entry.r;
    }
    for (const k of data.corpses) {
        const corpse = new Corpse(k);
        corpse.maxMeat = k.maxMeat;
        corpse.age = k.age;
        world.corpses.push(corpse);
    }
    world.nextId = Math.max(data.nextId, world.nextId);
    return sim;
}

export const safeToSnapshot = guarded(SaveError, { rethrow: true })(toSnapshot, 'toSnapshot');
export const safeFromSnapshot = guarded(LoadError, { rethrow: true })(fromSnapshot, 'fromSnapshot');
