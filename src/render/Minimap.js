import { context2d } from './canvas.js';
import { SPECIES_COLORS } from './layers/CreatureArtist.js';

const REDRAW_MS = 100;

/** Overview map with creature dots and the camera viewport; click or drag to navigate. */
export class Minimap {
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.ctx = context2d(canvas);
        this.renderer = renderer;
        this.lastDraw = 0;
        this.dragging = false;

        const navigate = (e) => {
            const sim = this.renderer.sim;
            if (!sim) return;
            const rect = canvas.getBoundingClientRect();
            const cam = this.renderer.camera;
            cam.follow = null;
            cam.x = ((e.clientX - rect.left) / rect.width) * sim.world.width;
            cam.y = ((e.clientY - rect.top) / rect.height) * sim.world.height;
            cam.clampPosition();
        };
        canvas.addEventListener('pointerdown', (e) => {
            this.dragging = true;
            canvas.setPointerCapture(e.pointerId);
            navigate(e);
        });
        canvas.addEventListener('pointermove', (e) => this.dragging && navigate(e));
        canvas.addEventListener('pointerup', () => {
            this.dragging = false;
        });
    }

    draw(now) {
        const sim = this.renderer.sim;
        const thumb = this.renderer.thumbnail;
        if (!sim || !thumb || now - this.lastDraw < REDRAW_MS) return;
        this.lastDraw = now;

        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;
        const sx = w / sim.world.width;
        const sy = h / sim.world.height;
        ctx.drawImage(thumb, 0, 0, w, h);

        const night = 1 - sim.world.clock.daylight;
        if (night > 0.02) {
            ctx.fillStyle = `rgba(8, 14, 40, ${night * 0.45})`;
            ctx.fillRect(0, 0, w, h);
        }

        for (const c of sim.world.creatures) {
            if (!c.alive) continue;
            ctx.fillStyle = SPECIES_COLORS[c.speciesId];
            ctx.fillRect(c.x * sx - 1, c.y * sy - 1, 2, 2);
        }

        const b = this.renderer.camera.bounds();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.left * sx, b.top * sy, (b.right - b.left) * sx, (b.bottom - b.top) * sy);

        const sel = this.renderer.selected;
        if (sel?.alive) {
            ctx.strokeStyle = '#ffe27a';
            ctx.beginPath();
            ctx.arc(sel.x * sx, sel.y * sy, 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
