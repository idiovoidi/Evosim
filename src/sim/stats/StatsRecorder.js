import { SPECIES_IDS } from '../../config/species.js';
import { GENE_KEYS } from '../../config/genes.js';

/**
 * Samples population counts, vegetation and mean gene values at a fixed
 * simulated interval into bounded history buffers for charts.
 */
export class StatsRecorder {
    constructor(world) {
        this.world = world;
        this.timer = Infinity;
        this.history = [];
        this.latest = null;
    }

    update(dt) {
        this.timer += dt;
        if (this.timer < this.world.config.stats.sampleInterval) return;
        this.timer = 0;
        this.sample();
    }

    sample() {
        const world = this.world;
        const sums = {};
        const counts = {};
        const generations = {};
        for (const id of SPECIES_IDS) {
            sums[id] = Object.fromEntries(GENE_KEYS.map((k) => [k, 0]));
            counts[id] = 0;
            generations[id] = 0;
        }
        for (const c of world.creatures) {
            if (!c.alive) continue;
            const id = c.speciesId;
            counts[id]++;
            generations[id] = Math.max(generations[id], c.life.generation);
            const s = sums[id];
            for (const k of GENE_KEYS) s[k] += c.genome.values[k];
        }
        const traits = {};
        for (const id of SPECIES_IDS) {
            traits[id] = counts[id] ? Object.fromEntries(GENE_KEYS.map((k) => [k, sums[id][k] / counts[id]])) : null;
        }

        const entry = {
            time: world.time,
            counts,
            traits,
            generations,
            vegetation: world.vegetation.totals.land,
            algae: world.vegetation.totals.water,
        };
        this.latest = entry;
        this.history.push(entry);
        const max = world.config.stats.historyLength;
        if (this.history.length > max) this.history.splice(0, this.history.length - max);
        world.events.emit('stats', entry);
    }

    serialize() {
        return this.history.slice(-300);
    }

    restore(history) {
        this.history = history ?? [];
        this.latest = this.history.at(-1) ?? null;
    }
}
