import { GENES, GENE_KEYS } from '../../config/genes.js';
import { GeneticsError } from '../../errors/EvosimError.js';
import { clamp } from '../../utils/math.js';
import { decorate, validated, is } from '../../utils/decorators.js';

/** Heritable gene values. Immutable once created; children are new genomes. */
export class Genome {
    constructor(values) {
        this.values = Object.freeze({ ...values });
    }

    static random(random, overrides = {}) {
        const values = {};
        for (const key of GENE_KEYS) {
            const [lo, hi] = overrides[key] ?? GENES[key].init;
            values[key] = random.float(lo, hi);
        }
        return new Genome(values);
    }

    get(key) {
        return this.values[key];
    }

    /**
     * Uniform crossover with Gaussian mutation.
     * @param {Genome} other
     * @param {{mutationChance:number, mutationScale:number}} evolution
     * @param {import('../../utils/random.js').Random} random
     */
    crossover(other, evolution, random) {
        const values = {};
        for (const key of GENE_KEYS) {
            const gene = GENES[key];
            const a = this.values[key];
            const b = other.values[key];
            let v = random.chance(0.5) ? a : b;
            if (random.chance(0.25)) v = (a + b) / 2;
            if (random.chance(evolution.mutationChance)) {
                v += random.gaussian(0, (gene.max - gene.min) * gene.step * evolution.mutationScale);
            }
            values[key] = clamp(v, gene.min, gene.max);
        }
        return new Genome(values);
    }

    /** Normalized genetic distance in [0, 1]; drives mate compatibility. */
    distance(other) {
        let sum = 0;
        for (const key of GENE_KEYS) {
            const gene = GENES[key];
            const d = (this.values[key] - other.values[key]) / (gene.max - gene.min);
            sum += key === 'hue' ? d * d * 4 : d * d;
        }
        return Math.sqrt(sum / (GENE_KEYS.length + 3));
    }

    toJSON() {
        return this.values;
    }
}

decorate(Genome, {
    crossover: [validated(GeneticsError, (g) => g instanceof Genome || 'expected a Genome', is.object, is.object)],
});
