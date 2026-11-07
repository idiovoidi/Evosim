import { createNoise2D } from 'simplex-noise';
import { BIOMES } from '../../config/biomes.js';
import { hexToRgb } from '../../utils/color.js';
import { Random } from '../../utils/random.js';
import { createCanvas, context2d } from '../canvas.js';

const PIXELS_PER_CELL = 5;
const REDRAW_MS = 250;

/**
 * Living vegetation drawn over the bare ground. Coverage follows biomass with a
 * static grain so grazed areas thin out into patches instead of fading evenly.
 */
export class VegetationLayer {
    constructor(world) {
        this.world = world;
        const t = world.terrain;
        this.w = t.cols * PIXELS_PER_CELL;
        this.h = t.rows * PIXELS_PER_CELL;
        this.canvas = createCanvas(this.w, this.h);
        this.ctx = context2d(this.canvas);
        this.image = this.ctx.createImageData(this.w, this.h);
        this.version = -1;
        this.lastDraw = 0;

        const random = new Random(`${world.seed}:grain`);
        const warp = createNoise2D(random.fork('warp').next);
        const n = this.w * this.h;
        this.grain = new Float32Array(n);
        this.colors = new Uint8Array(n * 3);
        this.aquatic = new Uint8Array(n);
        const flora = BIOMES.map((b) => hexToRgb(b.flora));
        const clump = createNoise2D(random.fork('clump').next);
        const amp = PIXELS_PER_CELL * 0.8;
        const f = 0.27 / PIXELS_PER_CELL;
        for (let py = 0; py < this.h; py++) {
            for (let px = 0; px < this.w; px++) {
                const p = py * this.w + px;
                const wx = Math.min(this.w - 1, Math.max(0, px + warp(px * f, py * f) * amp));
                const wy = Math.min(this.h - 1, Math.max(0, py + warp(px * f + 7.3, py * f + 2.9) * amp));
                const cell = ((wy / PIXELS_PER_CELL) | 0) * t.cols + ((wx / PIXELS_PER_CELL) | 0);
                const tuft = clump(px * f * 4, py * f * 4);
                const jitter = tuft * 0.08 + random.float(-0.05, 0.05);
                const c = flora[t.biome[cell]];
                this.colors[p * 3] = c[0] * (1 + jitter);
                this.colors[p * 3 + 1] = c[1] * (1 + jitter);
                this.colors[p * 3 + 2] = c[2] * (1 + jitter * 0.5);
                this.grain[p] = Math.min(1, Math.max(0, 0.5 + clump(px * f * 1.6 + 40, py * f * 1.6) * 0.35 + tuft * 0.2 + random.float(-0.08, 0.08)));
                this.aquatic[p] = t.water[cell];
            }
        }
    }

    refresh(now) {
        const veg = this.world.vegetation;
        if (veg.version === this.version || now - this.lastDraw < REDRAW_MS) return;
        this.version = veg.version;
        this.lastDraw = now;

        const t = this.world.terrain;
        const data = this.image.data;
        const biomass = veg.biomass;
        const cols = t.cols;
        const rows = t.rows;
        const inv = 1 / PIXELS_PER_CELL;

        for (let py = 0; py < this.h; py++) {
            const fy = (py + 0.5) * inv - 0.5;
            const y0 = fy < 0 ? 0 : fy | 0;
            const y1 = y0 + 1 < rows ? y0 + 1 : y0;
            const ty = fy - y0 < 0 ? 0 : fy - y0;
            for (let px = 0; px < this.w; px++) {
                const fx = (px + 0.5) * inv - 0.5;
                const x0 = fx < 0 ? 0 : fx | 0;
                const x1 = x0 + 1 < cols ? x0 + 1 : x0;
                const tx = fx - x0 < 0 ? 0 : fx - x0;
                const a = biomass[y0 * cols + x0];
                const b = biomass[y0 * cols + x1];
                const c = biomass[y1 * cols + x0];
                const d = biomass[y1 * cols + x1];
                const value = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;

                const p = py * this.w + px;
                const threshold = this.grain[p] * 0.55;
                let coverage = (value - threshold) / 0.25;
                coverage = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
                const o = p * 4;
                const shade = 0.78 + value * 0.3;
                data[o] = this.colors[p * 3] * shade;
                data[o + 1] = this.colors[p * 3 + 1] * shade;
                data[o + 2] = this.colors[p * 3 + 2] * shade;
                data[o + 3] = (this.aquatic[p] ? coverage * 0.32 : coverage * 0.92) * 255;
            }
        }
        this.ctx.putImageData(this.image, 0, 0);
    }

    draw(ctx) {
        const t = this.world.terrain;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.canvas, 0, 0, t.cols * t.cellSize, t.rows * t.cellSize);
    }
}
