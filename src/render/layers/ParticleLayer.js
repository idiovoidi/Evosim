import { TAU } from '../../utils/math.js';

const MAX_PARTICLES = 2500;

const KIND = { SPARK: 0, RING: 1, HEART: 2 };

/**
 * Pooled world-space particles: sparks, ripples and hearts spawned in response
 * to simulation events (kills, births, mating) and ongoing activity.
 */
export class ParticleLayer {
    constructor(events, random) {
        this.random = random;
        this.particles = [];
        this.free = [];
        this.unsubscribe = [
            events.on('attack', ({ prey }) => this.burst(prey.x, prey.y, 5, '#d93b3b', 22, 0.45, 1.3)),
            events.on('kill', ({ prey }) => {
                this.burst(prey.x, prey.y, 14, '#b81f2a', 34, 0.7, 1.6);
                this.ring(prey.x, prey.y, '#7a1018', prey.radius * 4, 0.6);
            }),
            events.on('birth', ({ creature }) => {
                this.ring(creature.x, creature.y, '#fff6d6', 16, 0.9);
                this.burst(creature.x, creature.y, 4, '#ffe08a', 14, 0.8, 1.1);
            }),
            events.on('mating', ({ a, b }) => {
                this.heart((a.x + b.x) / 2, (a.y + b.y) / 2);
            }),
            events.on('death', ({ creature, cause }) => {
                if (cause === 'predation') return;
                this.burst(creature.x, creature.y, 6, '#9aa0a6', 8, 1.4, 1.8, -8);
            }),
            events.on('miss', ({ prey }) => {
                if (prey.species.habitat === 'water') this.ring(prey.x, prey.y, '#d8f4ff', 14, 0.5);
            }),
        ];
    }

    acquire() {
        let p = this.free.pop();
        if (!p) {
            if (this.particles.length >= MAX_PARTICLES) return null;
            p = {};
            this.particles.push(p);
        }
        p.inUse = true;
        return p;
    }

    spawn(kind, x, y, vx, vy, life, size, color, rise = 0) {
        const p = this.acquire();
        if (!p) return;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.age = 0;
        p.life = life;
        p.size = size;
        p.color = color;
        p.rise = rise;
    }

    burst(x, y, count, color, speed, life, size, rise = 0) {
        for (let i = 0; i < count; i++) {
            const a = this.random.angle();
            const v = speed * this.random.float(0.3, 1);
            this.spawn(KIND.SPARK, x, y, Math.cos(a) * v, Math.sin(a) * v, life * this.random.float(0.7, 1.2), size * this.random.float(0.6, 1.2), color, rise);
        }
    }

    ring(x, y, color, radius, life) {
        this.spawn(KIND.RING, x, y, 0, 0, life, radius, color);
    }

    heart(x, y) {
        this.spawn(KIND.HEART, x, y - 6, this.random.float(-4, 4), -14, 1.4, 3.2, '#ff6f91');
    }

    /** Ambient emitters driven by what visible creatures are doing. */
    emitAmbient(creatures, dt, bounds) {
        const r = this.random;
        for (const c of creatures) {
            if (c.x < bounds.left || c.x > bounds.right || c.y < bounds.top || c.y > bounds.bottom) continue;
            const label = c.mind.label;
            if (label === 'Grazing' && r.chance(dt * 1.2)) {
                this.spawn(KIND.SPARK, c.x + r.float(-3, 3), c.y + r.float(-3, 3), r.float(-6, 6), r.float(-6, 6), 0.5, 1, '#a6d86b');
            } else if (label === 'Drinking' && r.chance(dt * 1.5)) {
                this.ring(c.x + Math.cos(c.heading) * c.radius * 1.5, c.y + Math.sin(c.heading) * c.radius * 1.5, '#cdeffd', 9, 1.1);
            } else if (c.speciesId === 'fish' && c.speed > c.traits.cruiseSpeed * 0.8 && r.chance(dt * 0.6)) {
                this.ring(c.x, c.y, '#bfe9f7', 6, 0.8);
            }
        }
    }

    update(dt) {
        for (const p of this.particles) {
            if (!p.inUse) continue;
            p.age += dt;
            if (p.age >= p.life) {
                p.inUse = false;
                this.free.push(p);
                continue;
            }
            const drag = Math.exp(-dt * 4);
            p.vx *= drag;
            p.vy = p.vy * drag + p.rise * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            if (!p.inUse) continue;
            const k = p.age / p.life;
            const alpha = 1 - k;
            if (p.kind === KIND.SPARK) {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, TAU);
                ctx.fill();
            } else if (p.kind === KIND.RING) {
                ctx.globalAlpha = alpha * 0.8;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.2 * (1 - k) + 0.3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (0.2 + k * 0.8), 0, TAU);
                ctx.stroke();
            } else {
                ctx.globalAlpha = alpha;
                drawHeart(ctx, p.x, p.y, p.size * (0.8 + k * 0.4), p.color);
            }
        }
        ctx.globalAlpha = 1;
    }

    dispose() {
        this.unsubscribe.forEach((off) => off());
    }
}

function drawHeart(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.4, x, y - s * 0.5);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    ctx.fill();
}
