import { buildConfig } from '../config/defaults.js';
import { SPECIES_IDS } from '../config/species.js';
import { SimulationError } from '../errors/EvosimError.js';
import { decorate, guarded, timed } from '../utils/decorators.js';
import { EventBus } from '../utils/EventBus.js';
import { Random } from '../utils/random.js';
import { Clock } from './Clock.js';
import { World } from './World.js';
import { TerrainGenerator } from './terrain/TerrainGenerator.js';
import { VegetationField } from './terrain/VegetationField.js';
import { Brain } from './behavior/Brain.js';
import { ReproductionSystem } from './systems/ReproductionSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { MetabolismSystem } from './systems/MetabolismSystem.js';
import { DecompositionSystem } from './systems/DecompositionSystem.js';
import { ImmigrationSystem } from './systems/ImmigrationSystem.js';
import { StatsRecorder } from './stats/StatsRecorder.js';
import { EventDetector } from './stats/EventDetector.js';

const MAX_STEPS_PER_FRAME = 24;

/**
 * Composition root of the headless simulation. Builds the world and wires the
 * systems in update order; runs on a fixed timestep independent of frame rate.
 */
export class Simulation {
    /**
     * @param {object} [options]
     * @param {string|number} [options.seed]
     * @param {object} [options.overrides]  partial config merged onto DEFAULTS
     * @param {EventBus} [options.events]
     * @param {import('../utils/Profiler.js').Profiler} [options.profiler]
     */
    constructor({ seed = Math.floor(Math.random() * 1e9), overrides = {}, events = new EventBus(), profiler = null } = {}) {
        this.config = buildConfig(overrides);
        this.overrides = overrides;
        this.seed = seed;
        this.events = events;
        this.profiler = profiler;
        this.accumulator = 0;
        this.steps = 0;

        const random = new Random(seed);
        const terrain = new TerrainGenerator(random.fork('terrain')).generate(this.config.world);
        const vegetation = new VegetationField(terrain, this.config.vegetation, random.fork('vegetation'));
        const clock = new Clock(this.config.clock, this.config.vegetation.seasonalAmplitude);

        this.world = new World({ config: this.config, terrain, vegetation, clock, random: random.fork('life'), events, seed });
        this.reproduction = new ReproductionSystem(this.world);
        this.brain = new Brain({ world: this.world, reproduction: this.reproduction, interval: this.config.brainInterval });
        this.stats = new StatsRecorder(this.world);
        this.detector = new EventDetector(this.world);

        this.systems = [
            this.brain,
            new MovementSystem(this.world),
            new MetabolismSystem(this.world),
            new DecompositionSystem(this.world),
            new ImmigrationSystem(this.world),
            this.stats,
        ];
    }

    populate() {
        for (const id of SPECIES_IDS) {
            const n = this.config.population[id] ?? 0;
            for (let i = 0; i < n; i++) {
                const c = this.world.spawnRandom(id);
                c.life.age = this.world.random.float(c.traits.maturity * 0.6, c.lifespan * 0.75);
                c.needs.energy = c.traits.energyCapacity * this.world.random.float(0.55, 0.85);
            }
        }
        this.stats.sample();
        return this;
    }

    /** Advance one fixed timestep. */
    step() {
        const dt = this.config.timestep;
        const world = this.world;
        world.clock.advance(dt);
        world.vegetation.update(dt, world.clock.growthFactor);
        world.reindex();
        for (const system of this.systems) system.update(dt);
        this.reproduction.flush();
        world.compact();
        this.steps++;
    }

    /**
     * Run as many fixed steps as fit in `realDt * speed` seconds.
     * @returns {number} steps executed
     */
    advance(realDt, speed) {
        this.accumulator += Math.min(realDt, 0.25) * speed;
        const dt = this.config.timestep;
        let n = 0;
        while (this.accumulator >= dt && n < MAX_STEPS_PER_FRAME) {
            this.step();
            this.accumulator -= dt;
            n++;
        }
        if (n === MAX_STEPS_PER_FRAME) this.accumulator = 0;
        return n;
    }

    /** Run headless for `seconds` of simulated time. */
    runFor(seconds) {
        const steps = Math.round(seconds / this.config.timestep);
        for (let i = 0; i < steps; i++) this.step();
    }

    dispose() {
        this.detector.dispose();
    }
}

decorate(Simulation, {
    step: [timed('sim'), guarded(SimulationError, { rethrow: true })],
    populate: [guarded(SimulationError, { rethrow: true })],
});
