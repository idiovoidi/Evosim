import { BIOMES } from '../../config/biomes.js';
import { TAU } from '../../utils/math.js';
import { hsl } from '../../utils/color.js';

/**
 * Paint static scenery (trees, rocks, reeds, cacti, flowers) onto the canopy
 * canvas, in world coordinates scaled to the bake resolution.
 */
export function paintDecorations(ctx, terrain, random, scale) {
    ctx.save();
    ctx.scale(scale, scale);
    const cs = terrain.cellSize;
    const painters = {
        forest: (x, y) => {
            const n = random.int(1, 4);
            for (let k = 0; k < n; k++) tree(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(5, 9.5), random);
        },
        grassland: (x, y) => {
            if (random.chance(0.05)) bush(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(3, 5), random);
            if (random.chance(0.16)) flowers(ctx, x, y, cs, random);
        },
        savanna: (x, y) => {
            if (random.chance(0.045)) acacia(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(6, 10), random);
        },
        marsh: (x, y) => {
            if (random.chance(0.55)) reeds(ctx, x + random.float(0, cs), y + random.float(0, cs), random);
        },
        mountain: (x, y) => {
            if (random.chance(0.35)) rock(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(3, 7), random, '#8d8478');
            if (random.chance(0.06)) tree(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(4, 6), random, 140);
        },
        desert: (x, y) => {
            if (random.chance(0.03)) cactus(ctx, x + random.float(0, cs), y + random.float(0, cs), random);
            if (random.chance(0.05)) rock(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(2, 4), random, '#b48d5b');
        },
        beach: (x, y) => {
            if (random.chance(0.03)) rock(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(1.5, 3), random, '#cfc2a0');
        },
        snow: (x, y) => {
            if (random.chance(0.12)) rock(ctx, x + random.float(0, cs), y + random.float(0, cs), random.float(2, 5), random, '#a9b1ba');
        },
    };

    for (let i = 0; i < terrain.count; i++) {
        const painter = painters[BIOMES[terrain.biome[i]].id];
        if (!painter) continue;
        painter((i % terrain.cols) * cs, ((i / terrain.cols) | 0) * cs);
    }
    ctx.restore();
}

function shadow(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(10, 18, 8, 0.32)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.35, y + r * 0.45, r * 1.05, r * 0.9, 0, 0, TAU);
    ctx.fill();
}

function tree(ctx, x, y, r, random, hue = random.float(95, 125)) {
    shadow(ctx, x, y, r);
    const light = random.float(20, 30);
    ctx.fillStyle = hsl(hue, 42, light);
    blob(ctx, x, y, r, random, 7);
    ctx.fillStyle = hsl(hue - 5, 45, light + 9);
    blob(ctx, x - r * 0.25, y - r * 0.3, r * 0.62, random, 6);
    ctx.fillStyle = hsl(hue - 10, 50, light + 17);
    ctx.beginPath();
    ctx.arc(x - r * 0.38, y - r * 0.45, r * 0.26, 0, TAU);
    ctx.fill();
}

function acacia(ctx, x, y, r, random) {
    shadow(ctx, x, y, r);
    ctx.fillStyle = hsl(random.float(70, 85), 35, 30);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.75, random.float(0, Math.PI), 0, TAU);
    ctx.fill();
    ctx.fillStyle = hsl(75, 38, 40);
    ctx.beginPath();
    ctx.ellipse(x - r * 0.2, y - r * 0.2, r * 0.6, r * 0.4, 0, 0, TAU);
    ctx.fill();
}

function bush(ctx, x, y, r, random) {
    shadow(ctx, x, y, r * 0.8);
    ctx.fillStyle = hsl(random.float(85, 110), 38, 30);
    blob(ctx, x, y, r, random, 6);
    ctx.fillStyle = hsl(95, 40, 40);
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU);
    ctx.fill();
}

function flowers(ctx, x, y, cs, random) {
    const hue = random.pick([0, 45, 280, 320, 200, 55]);
    const n = random.int(3, 8);
    for (let k = 0; k < n; k++) {
        ctx.fillStyle = hsl(hue + random.float(-10, 10), 80, random.float(65, 80), 0.9);
        ctx.beginPath();
        ctx.arc(x + random.float(0, cs), y + random.float(0, cs), random.float(0.7, 1.3), 0, TAU);
        ctx.fill();
    }
}

function reeds(ctx, x, y, random) {
    ctx.strokeStyle = hsl(random.float(60, 85), 35, random.float(28, 40));
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    const n = random.int(3, 7);
    for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + random.float(-0.6, 0.6);
        const len = random.float(4, 8);
        const bx = x + random.float(-3, 3);
        const by = y + random.float(-2, 2);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(a) * len, by + Math.sin(a) * len);
        ctx.stroke();
    }
}

function rock(ctx, x, y, r, random, base) {
    ctx.fillStyle = 'rgba(20, 16, 12, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.3, y + r * 0.35, r, r * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = base;
    polygon(ctx, x, y, r, random, random.int(5, 8));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    polygon(ctx, x - r * 0.25, y - r * 0.25, r * 0.5, random, 5);
}

function cactus(ctx, x, y, random) {
    shadow(ctx, x, y, 3);
    ctx.fillStyle = hsl(110, 35, random.float(28, 36));
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, TAU);
    ctx.arc(x + 3, y - 1, 1.6, 0, TAU);
    ctx.arc(x - 2.8, y + 1, 1.4, 0, TAU);
    ctx.fill();
}

function blob(ctx, x, y, r, random, points) {
    ctx.beginPath();
    for (let k = 0; k <= points; k++) {
        const a = (k / points) * TAU;
        const rr = r * random.float(0.82, 1.08);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

function polygon(ctx, x, y, r, random, points) {
    ctx.beginPath();
    for (let k = 0; k < points; k++) {
        const a = (k / points) * TAU + random.float(-0.25, 0.25);
        const rr = r * random.float(0.7, 1.05);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.85;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}
