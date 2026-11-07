import { BIOMES } from '../../config/biomes.js';
import { distanceField } from './distanceField.js';

const NEIGHBORS = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
];

/**
 * Immutable terrain grid plus derived navigation fields.
 * All public queries take world coordinates.
 */
export class Terrain {
    constructor({ cols, rows, cellSize, width, height, elevation, moisture, temperature, biome, river }) {
        Object.assign(this, { cols, rows, cellSize, width, height, elevation, moisture, temperature, biome, river });
        this.count = cols * rows;

        const water = new Uint8Array(this.count);
        for (let i = 0; i < this.count; i++) water[i] = BIOMES[biome[i]].water ? 1 : 0;
        this.water = water;

        this.distToWater = distanceField(cols, rows, (i) => water[i] === 1);
        this.distToLand = distanceField(cols, rows, (i) => water[i] === 0);
        this.waterFlow = this.buildDescentField(this.distToWater);
        this.landFlow = this.buildDescentField(this.distToLand);
    }

    /** For each cell, the direction (unit vector) to the neighbour with the lowest field value. */
    buildDescentField(field) {
        const flow = new Float32Array(this.count * 2);
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const i = y * this.cols + x;
                let best = field[i];
                let bx = 0;
                let by = 0;
                for (const [dx, dy] of NEIGHBORS) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) continue;
                    const v = field[ny * this.cols + nx];
                    if (v < best) {
                        best = v;
                        bx = dx;
                        by = dy;
                    }
                }
                const len = Math.hypot(bx, by) || 1;
                flow[i * 2] = bx / len;
                flow[i * 2 + 1] = by / len;
            }
        }
        return flow;
    }

    cellIndex(x, y) {
        let cx = (x / this.cellSize) | 0;
        let cy = (y / this.cellSize) | 0;
        if (cx < 0) cx = 0;
        else if (cx >= this.cols) cx = this.cols - 1;
        if (cy < 0) cy = 0;
        else if (cy >= this.rows) cy = this.rows - 1;
        return cy * this.cols + cx;
    }

    cellCenter(index) {
        return {
            x: ((index % this.cols) + 0.5) * this.cellSize,
            y: (((index / this.cols) | 0) + 0.5) * this.cellSize,
        };
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    biomeAt(x, y) {
        return BIOMES[this.biome[this.cellIndex(x, y)]];
    }

    isWater(x, y) {
        return this.water[this.cellIndex(x, y)] === 1;
    }

    isDeepWater(x, y) {
        return BIOMES[this.biome[this.cellIndex(x, y)]].water === 'deep';
    }

    /** Whether a creature of the given habitat may stand at (x, y). */
    isPassable(habitat, x, y) {
        if (!this.inBounds(x, y)) return false;
        if (habitat === 'air') return true;
        const biome = BIOMES[this.biome[this.cellIndex(x, y)]];
        if (habitat === 'water') return biome.water !== null;
        return biome.water !== 'deep';
    }

    /** Land creatures can drink when standing on or next to a water cell. */
    canDrinkAt(x, y) {
        return this.distToWater[this.cellIndex(x, y)] <= 1.5;
    }

    waterDistanceAt(x, y) {
        return this.distToWater[this.cellIndex(x, y)] * this.cellSize;
    }

    /** Unit direction towards the nearest water (land cells) or nearest land (water cells). */
    flowTowards(kind, x, y, out) {
        const i = this.cellIndex(x, y) * 2;
        const field = kind === 'water' ? this.waterFlow : this.landFlow;
        out.x = field[i];
        out.y = field[i + 1];
        return out;
    }

    /** Find a random position whose cell satisfies `predicate(cellIndex)`. */
    randomCell(random, predicate, attempts = 500) {
        for (let n = 0; n < attempts; n++) {
            const i = random.int(0, this.count);
            if (predicate(i)) {
                const c = this.cellCenter(i);
                c.x = Math.min(this.width - 1, c.x + random.float(-0.4, 0.4) * this.cellSize);
                c.y = Math.min(this.height - 1, c.y + random.float(-0.4, 0.4) * this.cellSize);
                return c;
            }
        }
        return null;
    }
}
