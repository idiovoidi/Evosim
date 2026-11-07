import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Genome } from '../src/sim/genetics/Genome.js';
import { Phenotype } from '../src/sim/genetics/Phenotype.js';
import { GENES, GENE_KEYS } from '../src/config/genes.js';
import { SPECIES } from '../src/config/species.js';
import { GeneticsError, SimulationError, EvosimError } from '../src/errors/EvosimError.js';
import { Random } from '../src/utils/random.js';

const evolution = { mutationChance: 1, mutationScale: 3 };

test('random genomes respect initial ranges', () => {
    const random = new Random('genes');
    for (let i = 0; i < 50; i++) {
        const g = Genome.random(random);
        for (const key of GENE_KEYS) {
            const [lo, hi] = GENES[key].init;
            assert.ok(g.get(key) >= lo && g.get(key) <= hi, `${key} out of init range`);
        }
    }
});

test('crossover always stays within legal gene bounds', () => {
    const random = new Random('cross');
    let a = Genome.random(random);
    let b = Genome.random(random);
    for (let i = 0; i < 500; i++) {
        const child = a.crossover(b, evolution, random);
        for (const key of GENE_KEYS) {
            assert.ok(child.get(key) >= GENES[key].min && child.get(key) <= GENES[key].max);
        }
        [a, b] = [b, child];
    }
});

test('crossover rejects a non-genome partner with a GeneticsError', () => {
    const g = Genome.random(new Random(1));
    assert.throws(() => g.crossover({}, evolution, new Random(2)), (e) => {
        assert.ok(e instanceof GeneticsError);
        assert.ok(e instanceof SimulationError);
        assert.ok(e instanceof EvosimError);
        return true;
    });
});

test('genetic distance is zero for identical genomes and symmetric', () => {
    const random = new Random('dist');
    const a = Genome.random(random);
    const b = Genome.random(random);
    assert.equal(a.distance(a), 0);
    assert.equal(a.distance(b), b.distance(a));
});

test('bigger bodies trade speed for strength', () => {
    const base = Object.fromEntries(GENE_KEYS.map((k) => [k, (GENES[k].init[0] + GENES[k].init[1]) / 2]));
    const small = new Phenotype(SPECIES.herbivore, new Genome({ ...base, size: 0.7 }));
    const big = new Phenotype(SPECIES.herbivore, new Genome({ ...base, size: 1.8 }));
    assert.ok(big.energyCapacity > small.energyCapacity);
    assert.ok(big.basal > small.basal);
    assert.ok(big.maxSpeed < small.maxSpeed);
});
