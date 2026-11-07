import { SPECIES, SPECIES_IDS } from '../../config/species.js';

const GENERATION_MILESTONES = [5, 10, 20, 35, 50, 75, 100, 150, 200, 300, 500];

/**
 * Turns raw simulation events and stat samples into human-readable notices
 * (extinctions, booms, crashes, generation milestones, seasons).
 */
export class EventDetector {
    constructor(world) {
        this.world = world;
        this.previous = null;
        this.generationMark = 0;
        this.season = null;
        this.lastByKey = new Map();
        this.unsubscribe = [
            world.events.on('stats', (s) => this.onStats(s)),
            world.events.on('immigration', ({ speciesId, count }) =>
                this.notice('info', `${count} ${SPECIES[speciesId].name.toLowerCase()} migrated into the region`, speciesId)),
        ];
    }

    notice(level, text, speciesId = null) {
        this.world.events.emit('notice', { level, text, speciesId, time: this.world.time });
    }

    /** Emit at most once per `cooldown` simulated seconds for a given key. */
    throttled(key, cooldown, level, text, speciesId) {
        const now = this.world.time;
        if (now - (this.lastByKey.get(key) ?? -Infinity) < cooldown) return;
        this.lastByKey.set(key, now);
        this.notice(level, text, speciesId);
    }

    onStats(sample) {
        const prev = this.previous;
        const clock = this.world.clock;

        if (this.season !== clock.season) {
            if (this.season !== null) this.notice('season', `${clock.season} has arrived`);
            this.season = clock.season;
        }

        if (prev) {
            for (const id of SPECIES_IDS) {
                const before = prev.counts[id];
                const now = sample.counts[id];
                const name = SPECIES[id].name;
                if (before > 0 && now === 0) this.throttled(`extinct:${id}`, 30, 'danger', `${name} have gone extinct`, id);
                if (before >= 20 && now <= before * 0.6) this.throttled(`crash:${id}`, 90, 'warning', `${name} population is crashing (${before} → ${now})`, id);
                if (now >= 40 && now >= before * 1.35) this.throttled(`boom:${id}`, 90, 'success', `${name} are booming (${now})`, id);
            }
        }

        const maxGen = this.world.totals.maxGeneration;
        while (this.generationMark < GENERATION_MILESTONES.length && maxGen >= GENERATION_MILESTONES[this.generationMark]) {
            const id = SPECIES_IDS.find((s) => sample.generations[s] >= GENERATION_MILESTONES[this.generationMark]);
            this.notice('milestone', `Generation ${GENERATION_MILESTONES[this.generationMark]} reached${id ? ` by ${SPECIES[id].name.toLowerCase()}` : ''}`, id);
            this.generationMark++;
        }

        // Only compare against samples ~20s apart so slow trends are detected without spam.
        if (!prev || sample.time - prev.time >= 20) this.previous = sample;
    }

    dispose() {
        this.unsubscribe.forEach((off) => off());
    }
}
