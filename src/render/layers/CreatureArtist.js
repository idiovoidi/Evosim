import { TAU } from '../../utils/math.js';
import { hsl } from '../../utils/color.js';

/** Flat colours used for far-zoom dots, the minimap and UI swatches. */
export const SPECIES_COLORS = {
    herbivore: '#e9c58b',
    predator: '#ef7a3c',
    fish: '#5fd3e6',
    bird: '#e8ecf4',
};

/**
 * Procedural top-down sprites for each species. Colours are derived from the
 * creature's genes (hue drifts with lineage), animation from its motion.
 */
export class CreatureArtist {
    constructor() {
        this.styles = new WeakMap();
        this.painters = {
            herbivore: (ctx, c, r, t, s) => this.grazer(ctx, c, r, t, s),
            predator: (ctx, c, r, t, s) => this.hunter(ctx, c, r, t, s),
            fish: (ctx, c, r, t, s) => this.fish(ctx, c, r, t, s),
            bird: (ctx, c, r, t, s) => this.raptor(ctx, c, r, t, s),
        };
    }

    style(c) {
        let s = this.styles.get(c);
        if (!s) {
            const { hue, saturation: sat, lightness: light } = c.traits;
            s = {
                body: hsl(hue, sat, light),
                dark: hsl(hue, sat + 5, light - 18),
                light: hsl(hue, sat - 5, Math.min(95, light + 16)),
                accent: hsl((hue + 25) % 360, sat + 10, light - 8),
            };
            this.styles.set(c, s);
        }
        return s;
    }

    draw(ctx, c, time) {
        const r = c.radius;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.heading);
        this.painters[c.speciesId](ctx, c, r, time + c.animPhase, this.style(c));
        ctx.restore();
    }

    /** Ground shadow for flyers, drawn in a separate pass beneath everything airborne. */
    drawAirShadow(ctx, c) {
        const r = c.radius;
        ctx.save();
        ctx.translate(c.x + 14, c.y + 20);
        ctx.rotate(c.heading);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.9, r * 1.6, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
    }

    grazer(ctx, c, r, t, s) {
        const moving = c.speed > 4;
        const hop = moving ? Math.abs(Math.sin(t * 11)) : 0;
        const sx = 1 + hop * 0.14;
        const sy = 1 - hop * 0.08;
        const resting = c.needs.resting;

        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(r * 0.25, r * 0.35, r * 1.2, r * 0.85, 0, 0, TAU);
        ctx.fill();

        ctx.fillStyle = s.dark;
        ctx.beginPath();
        ctx.ellipse(r * 0.42, -r * 0.33, r * 0.62, r * 0.17, -0.35 - hop * 0.2, 0, TAU);
        ctx.ellipse(r * 0.42, r * 0.33, r * 0.62, r * 0.17, 0.35 + hop * 0.2, 0, TAU);
        ctx.fill();

        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.ellipse(-r * 0.1, 0, r * 1.15 * sx, r * 0.86 * sy, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = s.light;
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, 0, r * 0.65 * sx, r * 0.45 * sy, 0, 0, TAU);
        ctx.fill();

        ctx.fillStyle = '#f4efe6';
        ctx.beginPath();
        ctx.arc(-r * 1.2 * sx, 0, r * 0.3, 0, TAU);
        ctx.fill();

        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.arc(r * 0.98, 0, r * 0.52, 0, TAU);
        ctx.fill();

        if (!resting) {
            ctx.fillStyle = '#1b1410';
            ctx.beginPath();
            ctx.arc(r * 1.18, -r * 0.24, r * 0.1, 0, TAU);
            ctx.arc(r * 1.18, r * 0.24, r * 0.1, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#d58c8c';
        ctx.beginPath();
        ctx.arc(r * 1.47, 0, r * 0.1, 0, TAU);
        ctx.fill();
    }

    hunter(ctx, c, r, t, s) {
        const speed = c.speed;
        const sway = Math.sin(t * (speed > 5 ? 9 : 2.5)) * (speed > 5 ? 0.25 : 0.12);

        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(r * 0.2, r * 0.4, r * 1.6, r * 0.75, 0, 0, TAU);
        ctx.fill();

        ctx.save();
        ctx.translate(-r * 0.95, 0);
        ctx.rotate(sway);
        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.ellipse(-r * 0.75, 0, r * 0.85, r * 0.34, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#f3eee8';
        ctx.beginPath();
        ctx.ellipse(-r * 1.45, 0, r * 0.25, r * 0.2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.2, r * 0.6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = s.dark;
        ctx.beginPath();
        ctx.ellipse(-r * 0.1, 0, r * 0.85, r * 0.2, 0, 0, TAU);
        ctx.fill();

        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.moveTo(r * 1.85, 0);
        ctx.quadraticCurveTo(r * 1.3, r * 0.5, r * 0.75, r * 0.5);
        ctx.lineTo(r * 0.75, -r * 0.5);
        ctx.quadraticCurveTo(r * 1.3, -r * 0.5, r * 1.85, 0);
        ctx.fill();

        ctx.fillStyle = s.dark;
        ctx.beginPath();
        ctx.moveTo(r * 0.75, -r * 0.3);
        ctx.lineTo(r * 0.55, -r * 0.78);
        ctx.lineTo(r * 1.1, -r * 0.42);
        ctx.moveTo(r * 0.75, r * 0.3);
        ctx.lineTo(r * 0.55, r * 0.78);
        ctx.lineTo(r * 1.1, r * 0.42);
        ctx.fill();

        ctx.fillStyle = '#f3eee8';
        ctx.beginPath();
        ctx.moveTo(r * 1.85, 0);
        ctx.quadraticCurveTo(r * 1.5, r * 0.25, r * 1.3, r * 0.2);
        ctx.lineTo(r * 1.3, -r * 0.2);
        ctx.quadraticCurveTo(r * 1.5, -r * 0.25, r * 1.85, 0);
        ctx.fill();
        ctx.fillStyle = '#1a120d';
        ctx.beginPath();
        ctx.arc(r * 1.9, 0, r * 0.09, 0, TAU);
        ctx.fill();
    }

    fish(ctx, c, r, t, s) {
        const pace = 6 + c.speed * 0.25;
        const wiggle = Math.sin(t * pace) * 0.35;
        ctx.globalAlpha = 0.92;

        ctx.save();
        ctx.translate(-r * 0.7, 0);
        ctx.rotate(wiggle);
        ctx.fillStyle = s.dark;
        ctx.beginPath();
        ctx.moveTo(r * 0.1, 0);
        ctx.lineTo(-r * 0.8, -r * 0.62);
        ctx.quadraticCurveTo(-r * 0.55, 0, -r * 0.8, r * 0.62);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.rotate(-wiggle * 0.25);
        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.moveTo(r * 1.25, 0);
        ctx.quadraticCurveTo(r * 0.3, r * 0.75, -r * 0.8, 0);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.75, r * 1.25, 0);
        ctx.fill();
        ctx.fillStyle = s.light;
        ctx.beginPath();
        ctx.ellipse(r * 0.3, 0, r * 0.6, r * 0.14, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#0d1b22';
        ctx.beginPath();
        ctx.arc(r * 0.85, -r * 0.18, r * 0.09, 0, TAU);
        ctx.arc(r * 0.85, r * 0.18, r * 0.09, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    raptor(ctx, c, r, t, s) {
        const flapping = c.speed > c.traits.cruiseSpeed * 0.9 || c.mind.action === 'hunt';
        const flap = Math.sin(t * (flapping ? 11 : 2.2));
        const span = 0.82 + flap * (flapping ? 0.2 : 0.06);

        ctx.fillStyle = s.dark;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(r * 0.35, side * r * 0.2);
            ctx.quadraticCurveTo(r * 0.5, side * r * 1.6 * span, -r * 0.15, side * r * 2.6 * span);
            ctx.quadraticCurveTo(-r * 0.35, side * r * 1.3 * span, -r * 0.5, side * r * 0.2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = s.body;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(r * 0.3, side * r * 0.2);
            ctx.quadraticCurveTo(r * 0.35, side * r * 1.1 * span, -r * 0.05, side * r * 1.6 * span);
            ctx.quadraticCurveTo(-r * 0.2, side * r * 0.8 * span, -r * 0.4, side * r * 0.2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = s.dark;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, 0);
        ctx.lineTo(-r * 1.45, -r * 0.45);
        ctx.lineTo(-r * 1.45, r * 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.85, r * 0.34, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#f7f5ee';
        ctx.beginPath();
        ctx.arc(r * 0.78, 0, r * 0.3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#e8b33a';
        ctx.beginPath();
        ctx.moveTo(r * 1.25, 0);
        ctx.lineTo(r * 1.0, -r * 0.1);
        ctx.lineTo(r * 1.0, r * 0.1);
        ctx.closePath();
        ctx.fill();
    }

    drawCorpse(ctx, corpse) {
        const freshness = Math.max(0, corpse.meat / corpse.maxMeat);
        const r = corpse.radius;
        ctx.globalAlpha = 0.35 + freshness * 0.6;
        ctx.fillStyle = '#5a2b22';
        ctx.beginPath();
        ctx.ellipse(corpse.x, corpse.y, r * (0.6 + freshness * 0.6), r * (0.4 + freshness * 0.4), corpse.id % 3, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#efe6d8';
        ctx.lineWidth = Math.max(0.6, r * 0.14);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let k = -1; k <= 1; k++) {
            ctx.moveTo(corpse.x - r * 0.5, corpse.y + k * r * 0.3);
            ctx.lineTo(corpse.x + r * 0.5, corpse.y + k * r * 0.3);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}
