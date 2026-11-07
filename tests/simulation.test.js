import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/sim/Simulation.js';
import { toSnapshot, fromSnapshot } from '../src/sim/persistence/Snapshot.js';
import { SPECIES_IDS } from '../src/config/species.js';
import { LoadError } from '../src/errors/EvosimError.js';
import { setErrorReporter } from '../src/utils/decorators.js';

setErrorReporter(() => {});

const counts = (sim) => ({ ...sim.world.counts });

test('terrain has land, water and drinkable shores', () => {
    const sim = new Simulation({ seed: 'terrain-test' });
    const { terrain } = sim.world;
    let water = 0;
    for (let i = 0; i < terrain.count; i++) water += terrain.water[i];
    const share = water / terrain.count;
    assert.ok(share > 0.15 && share < 0.7, `water share ${share}`);
    assert.ok(terrain.randomCell(sim.world.random, (i) => !terrain.water[i] && terrain.distToWater[i] <= 1.5));
});

test('populate spawns every species on legal ground', () => {
    const sim = new Simulation({ seed: 'spawn-test' }).populate();
    for (const id of SPECIES_IDS) assert.equal(sim.world.counts[id], sim.config.population[id]);
    for (const c of sim.world.creatures) {
        assert.ok(sim.world.terrain.isPassable(c.species.habitat, c.x, c.y), `${c.speciesId} spawned on impassable cell`);
    }
});

test('simulation is deterministic for a seed', () => {
    const a = new Simulation({ seed: 'det' }).populate();
    const b = new Simulation({ seed: 'det' }).populate();
    a.runFor(20);
    b.runFor(20);
    assert.deepEqual(counts(a), counts(b));
    assert.equal(a.world.creatures[0].x, b.world.creatures[0].x);
});

test('ecosystem sustains every species for several simulated minutes', () => {
    const sim = new Simulation({ seed: 'smoke' }).populate();
    sim.runFor(360);
    for (const id of SPECIES_IDS) assert.ok(sim.world.counts[id] > 0, `${id} went extinct`);
    assert.ok(sim.world.totals.births > 0);
    for (const c of sim.world.creatures) {
        assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y), 'non-finite position');
    }
});

test('snapshot round-trips creatures, clock and vegetation', () => {
    const sim = new Simulation({ seed: 'snap', overrides: { population: { herbivore: 40 } } }).populate();
    sim.runFor(30);
    const data = JSON.parse(JSON.stringify(toSnapshot(sim)));
    const restored = fromSnapshot(data);
    assert.equal(restored.seed, sim.seed);
    assert.equal(restored.config.population.herbivore, 40);
    assert.deepEqual(counts(restored), counts(sim));
    assert.equal(restored.world.clock.day, sim.world.clock.day);
    const original = sim.world.creatures.find((c) => c.alive);
    const copy = restored.world.findById(original.id);
    assert.ok(copy);
    assert.equal(copy.genome.get('size'), original.genome.get('size'));
    assert.ok(Math.abs(restored.world.vegetation.totals.land - sim.world.vegetation.totals.land) / sim.world.vegetation.totals.land < 0.05);
    restored.runFor(5);
});

test('snapshot loader rejects unknown versions', () => {
    assert.throws(() => fromSnapshot({ version: 999 }), LoadError);
});
