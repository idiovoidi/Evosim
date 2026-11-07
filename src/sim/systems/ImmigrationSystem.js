import { SPECIES_IDS } from '../../config/species.js';

const GROUP_SIZE = 6;
const GROUP_SPREAD = 40;

/**
 * Keeps the ecosystem from collapsing permanently: when a species dwindles
 * below the threshold, a small herd of wild-type migrants arrives together.
 */
export class ImmigrationSystem {
    constructor(world) {
        this.world = world;
        this.timer = 0;
    }

    update(dt) {
        const { enabled, interval, threshold } = this.world.config.immigration;
        if (!enabled) return;
        this.timer += dt;
        if (this.timer < interval) return;
        this.timer = 0;

        const { world } = this;
        for (const id of SPECIES_IDS) {
            if (world.counts[id] >= threshold) continue;
            const leader = world.spawnRandom(id);
            const habitat = leader.species.habitat;
            for (let i = 1; i < GROUP_SIZE; i++) {
                const x = leader.x + world.random.float(-GROUP_SPREAD, GROUP_SPREAD);
                const y = leader.y + world.random.float(-GROUP_SPREAD, GROUP_SPREAD);
                const ok = world.terrain.isPassable(habitat, x, y);
                const member = world.spawn(id, ok ? x : leader.x, ok ? y : leader.y);
                member.life.age = member.traits.maturity;
            }
            leader.life.age = leader.traits.maturity;
            world.events.emit('immigration', { speciesId: id, count: GROUP_SIZE });
        }
    }
}
