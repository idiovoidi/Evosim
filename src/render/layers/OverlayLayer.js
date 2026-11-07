import { TAU } from '../../utils/math.js';

const TRAIL_LENGTH = 90;
const TRAIL_INTERVAL = 0.12;

/** World-space annotations for the hovered and selected creature. */
export class OverlayLayer {
    constructor() {
        this.trail = [];
        this.trailFor = null;
        this.trailTimer = 0;
    }

    update(dt, selected) {
        if (selected !== this.trailFor) {
            this.trail = [];
            this.trailFor = selected;
        }
        if (!selected?.alive) return;
        this.trailTimer += dt;
        if (this.trailTimer >= TRAIL_INTERVAL) {
            this.trailTimer = 0;
            this.trail.push(selected.x, selected.y);
            if (this.trail.length > TRAIL_LENGTH * 2) this.trail.splice(0, 2);
        }
    }

    draw(ctx, { selected, hovered, zoom, time, options, senseOf }) {
        const px = 1 / zoom;

        if (hovered && hovered !== selected && hovered.alive) {
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1.5 * px;
            ctx.beginPath();
            ctx.arc(hovered.x, hovered.y, hovered.radius * 1.9 + 3 * px, 0, TAU);
            ctx.stroke();
        }

        if (!selected?.alive) return;
        const c = selected;

        if (options.trails && this.trail.length > 4) {
            const n = this.trail.length / 2;
            ctx.lineWidth = 2 * px;
            ctx.lineCap = 'round';
            for (let i = 1; i < n; i++) {
                ctx.strokeStyle = `rgba(255, 236, 170, ${(i / n) * 0.6})`;
                ctx.beginPath();
                ctx.moveTo(this.trail[(i - 1) * 2], this.trail[(i - 1) * 2 + 1]);
                ctx.lineTo(this.trail[i * 2], this.trail[i * 2 + 1]);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255, 236, 170, 0.6)';
            ctx.beginPath();
            ctx.moveTo(this.trail[(n - 1) * 2], this.trail[(n - 1) * 2 + 1]);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
        }

        if (options.senses) {
            ctx.setLineDash([6 * px, 6 * px]);
            ctx.lineDashOffset = -time * 20 * px;
            ctx.strokeStyle = 'rgba(160, 220, 255, 0.45)';
            ctx.lineWidth = 1.2 * px;
            ctx.beginPath();
            ctx.arc(c.x, c.y, senseOf(c), 0, TAU);
            ctx.stroke();
            if (c.species.territory) {
                ctx.strokeStyle = 'rgba(255, 180, 120, 0.3)';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.species.territory, 0, TAU);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        const target = c.mind.target;
        if (target?.alive && target !== c) {
            const hostile = c.mind.action === 'hunt';
            const color = c.mind.action === 'flee' ? '#ffd166' : hostile ? '#ff5d5d' : c.mind.action === 'mate' ? '#ff8fb1' : '#9be37a';
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.8;
            ctx.lineWidth = 1.5 * px;
            ctx.setLineDash([4 * px, 4 * px]);
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(target.x, target.y, (target.radius ?? 4) * 1.6 + 2 * px, 0, TAU);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (c.mind.action === 'graze' && c.mind.point.valid) {
            ctx.fillStyle = 'rgba(155, 227, 122, 0.7)';
            ctx.beginPath();
            ctx.arc(c.mind.point.x, c.mind.point.y, 3 * px + 1, 0, TAU);
            ctx.fill();
        }

        const pulse = 1 + Math.sin(time * 4) * 0.08;
        const r = (c.radius * 2 + 4 * px) * pulse;
        ctx.strokeStyle = '#ffe27a';
        ctx.lineWidth = 2 * px;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 226, 122, 0.35)';
        ctx.lineWidth = 5 * px;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r + 3 * px, -time * 2, -time * 2 + Math.PI * 0.6);
        ctx.stroke();
    }
}
