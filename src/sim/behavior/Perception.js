/**
 * Gathers what a creature can currently see: threats, flockmates and a list of
 * nearby creatures that behaviours can search for prey or mates.
 */
export class Perception {
    constructor(world) {
        this.world = world;
        this.nearby = [];
        this.nearbyDistSq = [];
    }

    /** Effective perception radius after day/night adjustments. */
    senseRadius(c) {
        const daylight = this.world.clock.daylight;
        const night = 1 - daylight;
        const factor = c.species.nocturnal ? 1 + night * 0.15 : 1 - night * 0.4;
        return c.traits.sense * factor;
    }

    /** How hard `target` is to notice, given the cover of the biome it stands in. */
    concealment(target) {
        const biome = this.world.terrain.biomeAt(target.x, target.y);
        const stillness = target.speed < target.traits.cruiseSpeed * 0.4 ? 1 : 0.5;
        return biome.cover * stillness;
    }

    perceive(c) {
        const m = c.mind;
        const sense = this.senseRadius(c);
        const flockRadius = sense * 0.45;
        const flockR2 = flockRadius * flockRadius;
        const personal = c.radius * 4 + 6;
        const personalR2 = personal * personal;
        const fears = c.species.fears;
        const nearby = this.nearby;
        const nearbyD2 = this.nearbyDistSq;
        nearby.length = 0;
        nearbyD2.length = 0;

        let threat = null;
        let threatD2 = Infinity;
        let cx = 0;
        let cy = 0;
        let ax = 0;
        let ay = 0;
        let sx = 0;
        let sy = 0;
        let mates = 0;

        this.world.spatial.query(c.x, c.y, sense, (other, d2) => {
            if (other === c) return;
            nearby.push(other);
            nearbyD2.push(d2);
            if (fears.length && fears.includes(other.speciesId)) {
                const hidden = this.concealment(other);
                const visible = sense * (1 - hidden * 0.6);
                if (d2 < visible * visible && d2 < threatD2) {
                    threat = other;
                    threatD2 = d2;
                }
                return;
            }
            if (other.species !== c.species) return;
            if (d2 < flockR2) {
                cx += other.x;
                cy += other.y;
                ax += other.vx;
                ay += other.vy;
                mates++;
            }
            if (d2 < personalR2 && d2 > 1e-6) {
                const d = Math.sqrt(d2);
                const push = (personal - d) / personal;
                sx += ((c.x - other.x) / d) * push;
                sy += ((c.y - other.y) / d) * push;
            }
        });

        m.threat = threat;
        m.threatDistance = threat ? Math.sqrt(threatD2) : Infinity;
        m.neighbors = mates;

        let fx = 0;
        let fy = 0;
        if (mates > 0) {
            cx = cx / mates - c.x;
            cy = cy / mates - c.y;
            const cl = Math.sqrt(cx * cx + cy * cy) || 1;
            const al = Math.sqrt(ax * ax + ay * ay) || 1;
            fx = (cx / cl) * 0.6 + (ax / al) * 0.8;
            fy = (cy / cl) * 0.6 + (ay / al) * 0.8;
        }
        m.flockX = fx;
        m.flockY = fy;
        m.sepX = sx;
        m.sepY = sy;
        return sense;
    }
}
