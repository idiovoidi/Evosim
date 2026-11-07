import { TAU, clamp, smoothstep } from '../../utils/math.js';
import { createCanvas, context2d } from '../canvas.js';

/**
 * Screen-space atmosphere: night tint, warm dawn/dusk grading, glowing eyes of
 * nocturnal hunters and a soft vignette.
 */
export class LightingLayer {
    constructor() {
        this.vignette = null;
        this.size = { w: 0, h: 0 };
    }

    resize(w, h) {
        if (w === this.size.w && h === this.size.h) return;
        this.size = { w, h };
        this.vignette = createCanvas(w, h);
        const ctx = context2d(this.vignette);
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    /** Draw in screen space (identity transform scaled by DPR). */
    drawAtmosphere(ctx, w, h, daylight) {
        const night = 1 - daylight;
        if (night > 0.01) {
            ctx.globalCompositeOperation = 'multiply';
            const r = Math.round(255 - night * 170);
            const g = Math.round(255 - night * 152);
            const b = Math.round(255 - night * 88);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, w, h);
        }
        const golden = smoothstep(0.15, 0.45, daylight) * (1 - smoothstep(0.55, 0.9, daylight));
        if (golden > 0.01) {
            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = `rgba(255, 150, 70, ${golden * 0.45})`;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
        if (this.vignette) ctx.drawImage(this.vignette, 0, 0, w, h);
    }

    /** Eye-shine for nocturnal species; world-space, additive. */
    drawEyeShine(ctx, creatures, daylight, bounds) {
        const night = clamp((0.6 - daylight) / 0.6, 0, 1);
        if (night <= 0.05) return;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 220, 120, ${0.85 * night})`;
        for (const c of creatures) {
            if (!c.species.nocturnal || c.needs.resting) continue;
            if (c.x < bounds.left || c.x > bounds.right || c.y < bounds.top || c.y > bounds.bottom) continue;
            const r = c.radius;
            const cos = Math.cos(c.heading);
            const sin = Math.sin(c.heading);
            for (const side of [-1, 1]) {
                const ex = c.x + cos * r * 1.25 - sin * side * r * 0.28;
                const ey = c.y + sin * r * 1.25 + cos * side * r * 0.28;
                ctx.beginPath();
                ctx.arc(ex, ey, r * 0.16 + 0.6, 0, TAU);
                ctx.fill();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
    }
}
