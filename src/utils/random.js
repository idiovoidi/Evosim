import alea from 'alea';

/** Seeded random source. All simulation randomness flows through one of these. */
export class Random {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.next = alea(seed);
        this.spareGaussian = null;
    }

    float(min = 0, max = 1) {
        return min + this.next() * (max - min);
    }

    int(min, maxExclusive) {
        return Math.floor(this.float(min, maxExclusive));
    }

    chance(p) {
        return this.next() < p;
    }

    pick(array) {
        return array[Math.floor(this.next() * array.length)];
    }

    angle() {
        return this.next() * Math.PI * 2;
    }

    /** Standard normal sample (Box-Muller with caching). */
    gaussian(mean = 0, stdDev = 1) {
        if (this.spareGaussian !== null) {
            const v = this.spareGaussian;
            this.spareGaussian = null;
            return mean + v * stdDev;
        }
        let u;
        let v;
        let s;
        do {
            u = this.next() * 2 - 1;
            v = this.next() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);
        const m = Math.sqrt((-2 * Math.log(s)) / s);
        this.spareGaussian = v * m;
        return mean + u * m * stdDev;
    }

    fork(salt) {
        return new Random(`${this.seed}:${salt}`);
    }
}
