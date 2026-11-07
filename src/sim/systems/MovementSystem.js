import { angleDelta } from '../../utils/math.js';

const AGILITY = { land: 5, water: 4, air: 2.5 };
const EDGE_MARGIN = 4;

/**
 * Integrates velocity towards each creature's desired velocity, applies
 * terrain speed costs and keeps creatures on passable cells.
 */
export class MovementSystem {
    constructor(world) {
        this.world = world;
    }

    update(dt) {
        const { terrain, width, height } = this.world;
        for (const c of this.world.creatures) {
            if (!c.alive) continue;
            const m = c.mind;
            const habitat = c.species.habitat;

            let terrainFactor = 1;
            if (habitat === 'land') terrainFactor = terrain.biomeAt(c.x, c.y).moveCost || 0.2;
            const speed = m.desiredSpeed * terrainFactor * (c.growth * 0.4 + 0.6);

            const tx = m.desiredX * speed + m.sepX * c.traits.cruiseSpeed * 0.8;
            const ty = m.desiredY * speed + m.sepY * c.traits.cruiseSpeed * 0.8;
            const k = 1 - Math.exp(-AGILITY[habitat] * dt);
            c.vx += (tx - c.vx) * k;
            c.vy += (ty - c.vy) * k;

            let nx = c.x + c.vx * dt;
            let ny = c.y + c.vy * dt;

            if (!terrain.isPassable(habitat, nx, ny)) {
                if (terrain.isPassable(habitat, nx, c.y)) {
                    ny = c.y;
                    c.vy *= -0.2;
                } else if (terrain.isPassable(habitat, c.x, ny)) {
                    nx = c.x;
                    c.vx *= -0.2;
                } else {
                    nx = c.x;
                    ny = c.y;
                    c.vx = 0;
                    c.vy = 0;
                    m.wanderAngle += Math.PI * 0.75;
                    m.thinkTimer = Math.min(m.thinkTimer, 0.05);
                }
            }

            nx = Math.min(width - EDGE_MARGIN, Math.max(EDGE_MARGIN, nx));
            ny = Math.min(height - EDGE_MARGIN, Math.max(EDGE_MARGIN, ny));
            const moved = Math.abs(nx - c.x) + Math.abs(ny - c.y);
            c.record.distance += moved;
            c.x = nx;
            c.y = ny;

            const v2 = c.vx * c.vx + c.vy * c.vy;
            if (v2 > 4) {
                const target = Math.atan2(c.vy, c.vx);
                c.heading += angleDelta(c.heading, target) * Math.min(1, dt * 8);
            }
        }
    }
}
