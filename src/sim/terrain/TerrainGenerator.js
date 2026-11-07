import { createNoise2D } from 'simplex-noise';
import { BIOME_INDEX, ELEVATION, classifyBiome } from '../../config/biomes.js';
import { smoothstep, clamp } from '../../utils/math.js';
import { TerrainError } from '../../errors/EvosimError.js';
import { decorate, guarded } from '../../utils/decorators.js';
import { distanceField } from './distanceField.js';
import { Terrain } from './Terrain.js';

/**
 * Procedurally generates terrain fields on a cell grid:
 * domain-warped elevation with an oceanic rim, carved rivers, then moisture
 * (boosted near water) and temperature (latitude + altitude) to classify biomes.
 */
export class TerrainGenerator {
    /**
     * @param {import('../../utils/random.js').Random} random
     */
    constructor(random) {
        this.random = random;
    }

    generate({ width, height, cellSize }) {
        const cols = Math.ceil(width / cellSize);
        const rows = Math.ceil(height / cellSize);
        const count = cols * rows;

        const noise = {
            elevation: createNoise2D(this.random.fork('elevation').next),
            warp: createNoise2D(this.random.fork('warp').next),
            moisture: createNoise2D(this.random.fork('moisture').next),
            temperature: createNoise2D(this.random.fork('temperature').next),
        };

        const elevation = this.buildElevation(noise, cols, rows);
        const river = this.carveRivers(elevation, cols, rows);

        const isWaterCell = (i) => elevation[i] < ELEVATION.sea || river[i] === 1;
        const waterDistance = distanceField(cols, rows, isWaterCell);

        const moisture = new Float32Array(count);
        const temperature = new Float32Array(count);
        const biome = new Uint8Array(count);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                const nx = x / cols;
                const ny = y / rows;
                const wet = Math.exp(-waterDistance[i] / 7);
                moisture[i] = clamp(fbm(noise.moisture, nx * 4, ny * 4, 4) * 0.7 + wet * 0.45 - 0.05, 0, 1);
                temperature[i] = clamp(
                    fbm(noise.temperature, nx * 2.5, ny * 2.5, 3) * 0.5 + ny * 0.55
                        - Math.max(0, elevation[i] - 0.5) * 0.9 + 0.1,
                    0, 1,
                );
                biome[i] = river[i] === 1 ? BIOME_INDEX.shallows : classifyBiome(elevation[i], moisture[i], temperature[i]);
            }
        }

        return new Terrain({ cols, rows, cellSize, width, height, elevation, moisture, temperature, biome, river });
    }

    buildElevation(noise, cols, rows) {
        const raw = new Float32Array(cols * rows);
        const aspect = cols / rows;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const nx = x / cols;
                const ny = y / rows;
                const wx = fbm(noise.warp, nx * 2 * aspect, ny * 2, 3);
                const wy = fbm(noise.warp, nx * 2 * aspect + 7.3, ny * 2 + 3.1, 3);
                let e = fbm(noise.elevation, nx * 3 * aspect + wx * 1.1, ny * 3 + wy * 1.1, 6);
                e += ridge(noise.elevation, nx * 6 * aspect + 11, ny * 6 + 5) * 0.25;
                const edge = Math.max(Math.abs(nx * 2 - 1), Math.abs(ny * 2 - 1));
                e -= smoothstep(0.68, 1.0, edge) * 0.9;
                raw[y * cols + x] = e;
            }
        }
        return rankNormalize(raw);
    }

    /** Trace rivers downhill from highlands to the sea, lowering their valleys. */
    carveRivers(elevation, cols, rows) {
        const river = new Uint8Array(cols * rows);
        const riverCount = Math.round((cols * rows) / 3500);
        const maxSteps = cols + rows;
        let carved = 0;

        for (let attempt = 0; attempt < riverCount * 30 && carved < riverCount; attempt++) {
            let x = this.random.int(2, cols - 2);
            let y = this.random.int(2, rows - 2);
            const start = y * cols + x;
            if (elevation[start] < 0.7 || elevation[start] > ELEVATION.snow) continue;

            const path = [];
            const visited = new Set();
            let reachedSea = false;
            for (let step = 0; step < maxSteps; step++) {
                const i = y * cols + x;
                path.push(i);
                visited.add(i);
                if (elevation[i] < ELEVATION.sea || (river[i] === 1 && step > 0)) {
                    reachedSea = true;
                    break;
                }
                let best = -1;
                let bestH = Infinity;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        if (dx && dy) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                        const j = ny * cols + nx;
                        if (visited.has(j)) continue;
                        const h = elevation[j] + this.random.float(0, 0.004);
                        if (h < bestH) {
                            bestH = h;
                            best = j;
                        }
                    }
                }
                if (best < 0) break;
                x = best % cols;
                y = (best / cols) | 0;
            }

            if (!reachedSea || path.length < 12) continue;
            carved++;
            for (const i of path) {
                river[i] = 1;
                elevation[i] = Math.min(elevation[i], ELEVATION.sea + 0.02) - 0.005;
                const cx = i % cols;
                const cy = (i / cols) | 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = cx + dx;
                        const ny = cy + dy;
                        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                        const j = ny * cols + nx;
                        if (!river[j]) elevation[j] = elevation[j] * 0.85 + (ELEVATION.beach + 0.03) * 0.15;
                    }
                }
            }
        }
        for (let i = 0; i < river.length; i++) {
            if (river[i] && elevation[i] < ELEVATION.sea) river[i] = 0;
        }
        return river;
    }
}

decorate(TerrainGenerator, { generate: [guarded(TerrainError, { rethrow: true })] });

function fbm(noise2D, x, y, octaves) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
        value += noise2D(x * frequency, y * frequency) * amplitude;
        norm += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }
    return (value / norm) * 0.5 + 0.5;
}

function ridge(noise2D, x, y) {
    return 1 - Math.abs(noise2D(x, y));
}

/** Replace values with their rank in [0,1] so thresholds act as area fractions. */
function rankNormalize(values) {
    const order = Array.from(values.keys()).sort((a, b) => values[a] - values[b]);
    const out = new Float32Array(values.length);
    const n = values.length - 1 || 1;
    order.forEach((index, rank) => {
        out[index] = rank / n;
    });
    return out;
}
