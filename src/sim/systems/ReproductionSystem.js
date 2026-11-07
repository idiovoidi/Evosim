import { smoothstep } from '../../utils/math.js';

/**
 * Sexual reproduction. Partners must be mature, rested, well fed and
 * genetically compatible; offspring share the pooled energy investment, so
 * large litters produce weaker young.
 */
export class ReproductionSystem {
    constructor(world) {
        this.world = world;
    }

    isReady(c) {
        if (!c.alive || !c.isMature || c.life.breedCooldown > 0) return false;
        if (c.needs.energy < c.traits.energyCapacity * 0.7 || c.needs.hydration < 0.35) return false;
        if (c.life.age > c.lifespan) return false;
        if (c.mind.crowded) return false;
        return this.world.counts[c.speciesId] < this.world.config.caps[c.speciesId];
    }

    /**
     * Density-dependent fertility. Territorial species count rivals within
     * their territory; herding species use the flockmates seen this think.
     */
    updateCrowding(c) {
        const { territory, crowdLimit } = c.species;
        if (!territory) {
            c.mind.crowded = c.mind.neighbors > crowdLimit;
            return;
        }
        if (!c.isMature || c.life.breedCooldown > 0) return;
        let rivals = 0;
        this.world.spatial.query(c.x, c.y, territory, (other) => {
            if (other !== c && other.species === c.species && ++rivals > crowdLimit) return false;
            return true;
        });
        c.mind.crowded = rivals > crowdLimit;
    }

    /**
     * Scramble competition: the chance each potential offspring is viable
     * falls as food (or prey) per head drops below the species' need, so
     * populations level off before they strip their food supply.
     */
    fertility(species) {
        const { source, perCapita } = species.forage;
        const world = this.world;
        const n = Math.max(1, world.counts[species.id]);
        const supply = source === 'vegetation' ? world.vegetation.totals.edibleLand
            : source === 'algae' ? world.vegetation.totals.edibleWater
                : world.counts[source];
        return smoothstep(0.4, 1.4, supply / (n * perCapita));
    }

    isCompatible(a, b) {
        return a.genome.distance(b.genome) <= this.world.config.evolution.compatibility;
    }

    canPair(c, other) {
        return other !== c && other.species === c.species && this.isReady(other) && this.isCompatible(c, other);
    }

    /** Closest suitable partner among already-perceived creatures. */
    findPartner(c, nearby) {
        let best = null;
        let bestD2 = Infinity;
        for (const other of nearby) {
            if (!this.canPair(c, other)) continue;
            const dx = other.x - c.x;
            const dy = other.y - c.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) {
                best = other;
                bestD2 = d2;
            }
        }
        return best;
    }

    /** Mating calls carry further than sight: search a wider radius when sparse. */
    findDistantPartner(c, radius) {
        return this.world.spatial.nearest(c.x, c.y, radius, (other) => this.canPair(c, other));
    }

    breed(a, b) {
        if (!this.isReady(a) || !this.isReady(b)) return false;
        const world = this.world;
        const { random, config } = world;
        const investA = a.traits.energyCapacity * 0.3;
        const investB = b.traits.energyCapacity * 0.3;
        a.needs.energy -= investA;
        b.needs.energy -= investB;
        a.life.breedCooldown = a.traits.breedCooldown;
        b.life.breedCooldown = b.traits.breedCooldown;

        const fertility = this.fertility(a.species);
        let litter = 0;
        const attempts = Math.max(1, Math.round((a.traits.litter + b.traits.litter) / 2));
        for (let k = 0; k < attempts; k++) if (random.chance(fertility)) litter++;
        if (litter === 0) {
            world.events.emit('mating', { a, b, litter });
            return true;
        }
        const share = ((investA + investB) * 0.85) / litter;
        const generation = Math.max(a.life.generation, b.life.generation) + 1;

        for (let k = 0; k < litter; k++) {
            const genome = a.genome.crossover(b.genome, config.evolution, random);
            const angle = random.angle();
            let x = (a.x + b.x) / 2 + Math.cos(angle) * 8;
            let y = (a.y + b.y) / 2 + Math.sin(angle) * 8;
            if (!world.terrain.isPassable(a.species.habitat, x, y)) {
                x = a.x;
                y = a.y;
            }
            world.pendingBirths.push({
                speciesId: a.speciesId,
                x,
                y,
                genome,
                generation,
                energy: share,
                parents: [a.id, b.id],
            });
        }
        a.record.offspring += litter;
        b.record.offspring += litter;
        world.events.emit('mating', { a, b, litter });
        return true;
    }

    /** Materialize queued births (done outside the creature iteration). */
    flush() {
        const world = this.world;
        if (!world.pendingBirths.length) return;
        for (const birth of world.pendingBirths) {
            if (world.counts[birth.speciesId] >= world.config.caps[birth.speciesId]) continue;
            const child = world.spawn(birth.speciesId, birth.x, birth.y, birth);
            world.totals.births++;
            world.events.emit('birth', { creature: child });
        }
        world.pendingBirths.length = 0;
    }
}
