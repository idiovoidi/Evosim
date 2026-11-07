import { createNoise2D } from 'simplex-noise';
import { BIOMES, BIOME_INDEX, ELEVATION } from '../../config/biomes.js';
import { Random } from '../../utils/random.js';
import { clamp, smoothstep } from '../../utils/math.js';
import { hexToRgb, mixRgb } from '../../utils/color.js';
import { createCanvas, context2d, nextFrame } from '../canvas.js';
import { decorate, guarded } from '../../utils/decorators.js';
import { RenderError } from '../../errors/EvosimError.js';
import { paintDecorations } from './decorations.js';

const PIXELS_PER_UNIT = 1 / 1.5;
const LIGHT = { x: -0.62, y: -0.78 };
const ROWS_PER_CHUNK = 48;

const DEEP = hexToRgb('#081f3a');
const MID = hexToRgb('#14507a');
const SHALLOW = hexToRgb('#2c8fae');
const SHORE = hexToRgb('#6cc3c9');
const FOAM = [236, 246, 248];
const WET_SAND = [0.82, 0.82, 0.8];

/**
 * Bakes the static terrain into canvases once per world:
 *   ground   - hill-shaded biome ground and water depth with shoreline foam
 *   canopy   - trees, rocks, reeds (drawn above vegetation and walkers)
 *   shimmer  - two animated water-highlight layers
 */
export class TerrainPainter {
    constructor(terrain, seed) {
        this.terrain = terrain;
        this.random = new Random(`${seed}:paint`);
        this.noise = createNoise2D(this.random.fork('detail').next);
        this.warp = createNoise2D(this.random.fork('warp').next);
        this.waveNoise = createNoise2D(this.random.fork('waves').next);
        this.scale = PIXELS_PER_UNIT;
        this.width = Math.ceil(terrain.width * this.scale);
        this.height = Math.ceil(terrain.height * this.scale);
        this.palettes = BIOMES.map((b) => b.ground.map(hexToRgb));
    }

    async bake(onProgress = () => {}) {
        const ground = createCanvas(this.width, this.height);
        const gctx = context2d(ground);
        const image = gctx.createImageData(this.width, this.height);

        const shimmerScale = 0.5;
        const sw = Math.ceil(this.width * shimmerScale);
        const sh = Math.ceil(this.height * shimmerScale);
        const shimmerA = createCanvas(sw, sh);
        const shimmerB = createCanvas(sw, sh);
        const imgA = context2d(shimmerA).createImageData(sw, sh);
        const imgB = context2d(shimmerB).createImageData(sw, sh);

        for (let y0 = 0; y0 < this.height; y0 += ROWS_PER_CHUNK) {
            const y1 = Math.min(this.height, y0 + ROWS_PER_CHUNK);
            this.paintRows(image.data, y0, y1);
            onProgress((y1 / this.height) * 0.7, 'Painting terrain');
            await nextFrame();
        }
        gctx.putImageData(image, 0, 0);

        this.paintShimmer(imgA.data, imgB.data, sw, sh, shimmerScale);
        context2d(shimmerA).putImageData(imgA, 0, 0);
        context2d(shimmerB).putImageData(imgB, 0, 0);
        onProgress(0.8, 'Growing forests');
        await nextFrame();

        const canopy = createCanvas(this.width, this.height);
        paintDecorations(context2d(canopy), this.terrain, this.random.fork('decor'), this.scale);
        onProgress(0.95, 'Finishing touches');
        await nextFrame();

        const thumbnail = createCanvas(240, Math.round((240 * this.height) / this.width));
        const tctx = context2d(thumbnail);
        tctx.imageSmoothingQuality = 'high';
        tctx.drawImage(ground, 0, 0, thumbnail.width, thumbnail.height);
        tctx.drawImage(canopy, 0, 0, thumbnail.width, thumbnail.height);

        return { ground, canopy, shimmer: [shimmerA, shimmerB], thumbnail, scale: this.scale };
    }

    paintRows(data, y0, y1) {
        const t = this.terrain;
        const cs = t.cellSize;
        const inv = 1 / this.scale;
        const warpAmp = cs * 0.55;

        for (let py = y0; py < y1; py++) {
            for (let px = 0; px < this.width; px++) {
                const wx = (px + 0.5) * inv;
                const wy = (py + 0.5) * inv;
                const fx = wx / cs - 0.5;
                const fy = wy / cs - 0.5;

                const jx = wx + this.warp(wx * 0.018, wy * 0.018) * warpAmp + this.warp(wx * 0.11, wy * 0.11) * cs * 0.4;
                const jy = wy + this.warp(wx * 0.018 + 31.7, wy * 0.018 + 17.3) * warpAmp + this.warp(wx * 0.11 + 9.1, wy * 0.11 + 4.4) * cs * 0.4;
                const biomeIndex = t.biome[t.cellIndex(jx, jy)];
                const biome = BIOMES[biomeIndex];
                const h = this.sample(t.elevation, fx, fy);
                const detail = this.noise(wx * 0.05, wy * 0.05) * 0.6 + this.noise(wx * 0.17, wy * 0.17) * 0.4;

                let color;
                if (biome.water) {
                    color = this.waterColor(wx, wy, fx, fy, h, detail, biomeIndex === BIOME_INDEX.shallows && t.river[t.cellIndex(jx, jy)] === 1);
                } else {
                    color = this.landColor(biomeIndex, fx, fy, detail);
                }

                const o = (py * this.width + px) * 4;
                data[o] = color[0];
                data[o + 1] = color[1];
                data[o + 2] = color[2];
                data[o + 3] = 255;
            }
        }
    }

    landColor(biomeIndex, fx, fy, detail) {
        const t = this.terrain;
        const [dark, light] = this.palettes[biomeIndex];
        let c = mixRgb(dark, light, clamp(detail * 0.5 + 0.5, 0, 1));

        const e = 0.6;
        const gx = this.sample(t.elevation, fx + e, fy) - this.sample(t.elevation, fx - e, fy);
        const gy = this.sample(t.elevation, fx, fy + e) - this.sample(t.elevation, fx, fy - e);
        const relief = biomeIndex === BIOME_INDEX.mountain || biomeIndex === BIOME_INDEX.snow ? 26 : 14;
        const shade = clamp(1 - (gx * LIGHT.x + gy * LIGHT.y) * relief, 0.55, 1.4);
        c = [c[0] * shade, c[1] * shade, c[2] * shade];

        const dw = this.sample(t.distToWater, fx, fy);
        if (dw < 1.6) {
            const wet = 1 - smoothstep(0.6, 1.6, dw);
            c = [c[0] * (1 - wet * (1 - WET_SAND[0])), c[1] * (1 - wet * (1 - WET_SAND[1])), c[2] * (1 - wet * (1 - WET_SAND[2]))];
        }
        return [clamp(c[0], 0, 255), clamp(c[1], 0, 255), clamp(c[2], 0, 255)];
    }

    waterColor(wx, wy, fx, fy, h, detail, isRiver) {
        const t = this.terrain;
        const dl = this.sample(t.distToLand, fx, fy);
        const depth = isRiver ? 0.05 : clamp((ELEVATION.sea - h) / ELEVATION.sea, 0, 1);
        let c = depth > 0.35
            ? mixRgb(MID, DEEP, smoothstep(0.35, 0.9, depth))
            : mixRgb(SHALLOW, MID, smoothstep(0, 0.35, depth));
        c = mixRgb(c, SHORE, (1 - smoothstep(0.2, 2.2, dl)) * 0.55);
        const caustic = Math.abs(this.waveNoise(wx * 0.03, wy * 0.03));
        const ripple = (1 - smoothstep(0.0, 0.08, caustic)) * 0.12 * (1 - depth);
        c = mixRgb(c, SHORE, ripple + detail * 0.03);
        if (dl < 1.1) {
            const band = Math.sin(dl * 9 + this.noise(wx * 0.04, wy * 0.04) * 3);
            const foam = (1 - smoothstep(0.35, 1.1, dl)) * smoothstep(0.2, 0.9, band) * 0.7;
            c = mixRgb(c, FOAM, foam);
        }
        return c;
    }

    paintShimmer(a, b, sw, sh, shimmerScale) {
        const t = this.terrain;
        const inv = 1 / (this.scale * shimmerScale);
        for (let py = 0; py < sh; py++) {
            for (let px = 0; px < sw; px++) {
                const wx = (px + 0.5) * inv;
                const wy = (py + 0.5) * inv;
                const i = t.cellIndex(wx, wy);
                if (!t.water[i] || t.distToLand[i] < 0.5) continue;
                const o = (py * sw + px) * 4;
                const fade = smoothstep(0.5, 2.5, t.distToLand[i]) * (0.55 + 0.45 * this.noise(wx * 0.004, wy * 0.004));
                const qx = this.warp(wx * 0.006, wy * 0.006) * 60;
                const qy = this.warp(wx * 0.006 + 13, wy * 0.006 + 7) * 60;
                const na = 1 - Math.abs(this.waveNoise((wx + qx) * 0.022, (wy + qy) * 0.022));
                const nb = 1 - Math.abs(this.waveNoise((wy - qy) * 0.022 + 50, (wx - qx) * 0.022 + 50));
                const va = smoothstep(0.93, 0.995, na) * fade;
                const vb = smoothstep(0.93, 0.995, nb) * fade;
                a[o] = a[o + 1] = a[o + 2] = 255;
                a[o + 3] = Math.max(0, va * 80);
                b[o] = b[o + 1] = b[o + 2] = 255;
                b[o + 3] = Math.max(0, vb * 80);
            }
        }
    }

    /** Bilinear sample of a cell field at fractional cell coordinates. */
    sample(field, fx, fy) {
        const t = this.terrain;
        const x0 = clamp(Math.floor(fx), 0, t.cols - 1);
        const y0 = clamp(Math.floor(fy), 0, t.rows - 1);
        const x1 = Math.min(x0 + 1, t.cols - 1);
        const y1 = Math.min(y0 + 1, t.rows - 1);
        const tx = clamp(fx - x0, 0, 1);
        const ty = clamp(fy - y0, 0, 1);
        const a = Math.min(field[y0 * t.cols + x0], 60);
        const b = Math.min(field[y0 * t.cols + x1], 60);
        const c = Math.min(field[y1 * t.cols + x0], 60);
        const d = Math.min(field[y1 * t.cols + x1], 60);
        return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
}

decorate(TerrainPainter, { bake: [guarded(RenderError, { rethrow: true })] });
