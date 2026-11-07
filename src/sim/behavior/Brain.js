import { flee, drink, graze, hunt, feed, mate, rest, wander } from './behaviors.js';
import { Perception } from './Perception.js';

/** Which behaviours each species' brain is composed of. */
export const SPECIES_BEHAVIORS = {
    herbivore: [flee, drink, graze, mate, rest, wander],
    predator: [drink, feed, hunt, mate, rest, wander],
    fish: [flee, graze, mate, rest, wander],
    bird: [drink, feed, hunt, mate, rest, wander],
};

/**
 * Utility-AI brain. Every `interval` seconds (staggered per creature) it
 * perceives, scores each behaviour and switches to the best; between thinks
 * the active behaviour steers every step.
 */
export class Brain {
    /**
     * @param {object} deps
     * @param {import('../World.js').World} deps.world
     * @param {import('../systems/ReproductionSystem.js').ReproductionSystem} deps.reproduction
     */
    constructor({ world, reproduction, interval, behaviors = SPECIES_BEHAVIORS }) {
        this.world = world;
        this.interval = interval;
        this.perception = new Perception(world);
        this.behaviors = behaviors;
        this.byId = new Map();
        for (const list of Object.values(behaviors)) {
            for (const b of list) this.byId.set(b.id, b);
        }
        this.ctx = {
            world,
            perception: this.perception,
            reproduction,
            config: world.config,
            random: world.random,
            events: world.events,
            sense: 0,
            candidate: null,
        };
    }

    update(dt) {
        const ctx = this.ctx;
        for (const c of this.world.creatures) {
            if (!c.alive) continue;
            const m = c.mind;
            m.thinkTimer -= dt;
            m.attackTimer -= dt;
            c.needs.sprinting = false;
            c.needs.resting = false;

            if (m.thinkTimer <= 0) {
                m.thinkTimer = this.interval * this.world.random.float(0.8, 1.2);
                this.think(c);
            }

            const behavior = this.byId.get(m.action);
            behavior.act(c, ctx, dt);
        }
    }

    think(c) {
        const ctx = this.ctx;
        ctx.sense = this.perception.perceive(c);
        ctx.reproduction.updateCrowding(c);
        const options = this.behaviors[c.speciesId];
        let best = null;
        let bestScore = -Infinity;
        let bestCandidate = null;
        for (const behavior of options) {
            ctx.candidate = null;
            const score = behavior.score(c, ctx);
            if (score > bestScore) {
                bestScore = score;
                best = behavior;
                bestCandidate = ctx.candidate;
            }
        }
        ctx.candidate = bestCandidate;
        c.mind.label = best.label;
        c.mind.action = best.id;
        best.plan(c, ctx);
    }
}
