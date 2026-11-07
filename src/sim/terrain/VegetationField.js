import { BIOMES } from '../../config/biomes.js';
import { TAU } from '../../utils/math.js';

const ROOT_RESERVE = 0.15;

/**
 * Per-cell plant biomass (land vegetation and aquatic algae share the grid).
 * Grows logistically towards a capacity set by biome fertility, the season and
 * nutrients released by decomposing corpses.
 */
export class VegetationField {
    /**
     * @param {import('./Terrain.js').Terrain} terrain
     * @param {object} config  vegetation section of the sim config
     * @param {import('../../utils/random.js').Random} random
     */
    constructor(terrain, config, random) {
        this.terrain = terrain;
        this.config = config;
        this.random = random;
        this.biomass = new Float32Array(terrain.count);
        this.nutrient = new Float32Array(terrain.count);
        this.fertility = new Float32Array(terrain.count);
        this.growth = new Float32Array(terrain.count);
        this.accumulator = 0;
        this.version = 0;
        this.totals = { land: 0, water: 0 };

        for (let i = 0; i < terrain.count; i++) {
            const biome = BIOMES[terrain.biome[i]];
            this.fertility[i] = biome.fertility;
            this.growth[i] = biome.growth * (config.growthScale ?? 1);
            this.biomass[i] = biome.fertility * random.float(0.4, 0.75);
        }
        this.recount();
    }

    /** Recompute totals; `edible*` exclude the root reserve that grazers can't reach. */
    recount() {
        const water = this.terrain.water;
        const t = { land: 0, water: 0, edibleLand: 0, edibleWater: 0 };
        for (let i = 0; i < this.biomass.length; i++) {
            const b = this.biomass[i];
            const edible = Math.max(0, b - this.fertility[i] * ROOT_RESERVE);
            if (water[i]) {
                t.water += b;
                t.edibleWater += edible;
            } else {
                t.land += b;
                t.edibleLand += edible;
            }
        }
        this.totals = t;
    }

    capacity(i, season) {
        return this.fertility[i] * season * (1 + this.nutrient[i]);
    }

    update(dt, season) {
        this.accumulator += dt;
        const step = this.config.updateInterval;
        if (this.accumulator < step) return;
        const elapsed = this.accumulator;
        this.accumulator = 0;

        const { seedRate, nutrientDecay } = this.config;
        const decay = Math.exp(-nutrientDecay * elapsed);
        for (let i = 0; i < this.biomass.length; i++) {
            const k = this.fertility[i] * season * (1 + this.nutrient[i]);
            let b = this.biomass[i];
            if (k <= 0) {
                b = 0;
            } else {
                const growth = this.growth[i] * season * b * (1 - b / k) + seedRate * k;
                b = Math.max(0, b + growth * elapsed);
            }
            this.biomass[i] = b;
            this.nutrient[i] *= decay;
        }
        this.recount();
        this.version++;
    }

    biomassAt(x, y) {
        return this.biomass[this.terrain.cellIndex(x, y)];
    }

    /**
     * Remove up to `amount` biomass from the cell under (x, y); returns what was
     * eaten. Roots survive grazing, so a reserve always remains to regrow from.
     */
    graze(x, y, amount) {
        const i = this.terrain.cellIndex(x, y);
        const available = this.biomass[i] - this.fertility[i] * ROOT_RESERVE;
        if (available <= 0) return 0;
        const eaten = Math.min(amount, available);
        this.biomass[i] -= eaten;
        return eaten;
    }

    /** Biomass that can actually be eaten at (x, y). */
    edibleAt(x, y) {
        const i = this.terrain.cellIndex(x, y);
        return Math.max(0, this.biomass[i] - this.fertility[i] * ROOT_RESERVE);
    }

    /** Spread nutrients from a decomposed body around (x, y). */
    fertilize(x, y, amount) {
        const t = this.terrain;
        const cx = (x / t.cellSize) | 0;
        const cy = (y / t.cellSize) | 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= t.cols || ny >= t.rows) continue;
                const share = dx === 0 && dy === 0 ? 0.36 : 0.08;
                const i = ny * t.cols + nx;
                this.nutrient[i] = Math.min(2, this.nutrient[i] + amount * share);
            }
        }
    }

    /**
     * Probe points around (x, y) and return the most attractive food location,
     * or null. `aquatic` selects water cells (algae) vs land cells (vegetation).
     */
    findForage(x, y, radius, aquatic, out) {
        const t = this.terrain;
        let bestScore = 0.05;
        let found = false;
        const here = t.cellIndex(x, y);
        const edible = (i) => this.biomass[i] - this.fertility[i] * ROOT_RESERVE;
        if (t.water[here] === (aquatic ? 1 : 0) && edible(here) > 0.2) {
            out.x = x;
            out.y = y;
            return out;
        }
        const offset = this.random.angle();
        for (let ring = 1; ring <= 3; ring++) {
            const r = (radius * ring) / 3;
            const samples = 4 + ring * 2;
            for (let s = 0; s < samples; s++) {
                const a = offset + (s / samples) * TAU;
                const px = x + Math.cos(a) * r;
                const py = y + Math.sin(a) * r;
                if (!t.inBounds(px, py)) continue;
                const i = t.cellIndex(px, py);
                if (t.water[i] !== (aquatic ? 1 : 0)) continue;
                if (!aquatic && BIOMES[t.biome[i]].water === 'deep') continue;
                const score = edible(i) * (1 - 0.35 * (r / radius));
                if (score > bestScore) {
                    bestScore = score;
                    out.x = px;
                    out.y = py;
                    found = true;
                }
            }
        }
        return found ? out : null;
    }

    serialize() {
        return { biomass: encode(this.biomass), nutrient: encode(this.nutrient) };
    }

    restore(data) {
        decode(data.biomass, this.biomass);
        decode(data.nutrient, this.nutrient);
        this.recount();
        this.version++;
    }
}

function encode(array) {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
}

function decode(text, target) {
    const binary = atob(text);
    const bytes = new Uint8Array(target.buffer, target.byteOffset, target.byteLength);
    const n = Math.min(bytes.length, binary.length);
    for (let i = 0; i < n; i++) bytes[i] = binary.charCodeAt(i);
}
