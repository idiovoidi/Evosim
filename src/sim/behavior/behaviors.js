import { steerTowards, steerAway, arrive, addFlocking, stop, chaseSpeed } from './steering.js';

/**
 * Utility behaviours. Each one is a small strategy object:
 *   score(c, ctx)  -> desirability; may stash a candidate target in ctx.candidate
 *   plan(c, ctx)   -> called on (re)selection at think time
 *   act(c, ctx, dt)-> runs every step; sets steering and performs interactions
 *
 * Species compose their brains from these (see speciesBehaviors.js).
 */

const KEEP_BONUS = 0.12;
const flowScratch = { x: 0, y: 0 };
const forageScratch = { x: 0, y: 0 };

const keep = (c, id, score) => (c.mind.action === id && score > 0 ? score + KEEP_BONUS : score);

function reach(a, b) {
    return a.radius + b.radius + 4;
}

function isIgnored(c, target, now) {
    const until = c.mind.ignore.get(target.id);
    if (until === undefined) return false;
    if (until < now) {
        c.mind.ignore.delete(target.id);
        return false;
    }
    return true;
}

export const flee = {
    id: 'flee',
    label: 'Fleeing',
    score(c) {
        const m = c.mind;
        if (!m.threat || !m.threat.alive) return 0;
        const range = c.traits.fleeDistance;
        if (m.threatDistance > range) return 0;
        return 2 + (1 - m.threatDistance / range) * 2;
    },
    plan(c) {
        c.mind.target = c.mind.threat;
    },
    act(c, ctx) {
        const threat = c.mind.target;
        if (!threat || !threat.alive) {
            c.mind.thinkTimer = 0;
            return;
        }
        steerAway(c, threat.x, threat.y, chaseSpeed(c));
        addFlocking(c, 0.35 * c.traits.sociality);
        if (c.species.habitat === 'land' && ctx.world.terrain.isDeepWater(c.x + c.mind.desiredX * 24, c.y + c.mind.desiredY * 24)) {
            const t = c.mind.desiredX;
            c.mind.desiredX = -c.mind.desiredY;
            c.mind.desiredY = t;
        }
    },
};

export const drink = {
    id: 'drink',
    label: 'Drinking',
    score(c) {
        const thirst = c.thirst;
        if (c.mind.action === 'drink' && c.needs.hydration < 0.97) return Math.max(0.7, thirst * 1.8);
        if (thirst < 0.3) return 0;
        return Math.pow(thirst, 1.4) * 1.8;
    },
    plan(c) {
        c.mind.target = null;
    },
    act(c, ctx, dt) {
        const terrain = ctx.world.terrain;
        const canDrink = c.species.habitat === 'air' ? terrain.isWater(c.x, c.y) : terrain.canDrinkAt(c.x, c.y);
        if (canDrink) {
            stop(c);
            c.needs.hydration = Math.min(1, c.needs.hydration + 0.3 * dt);
            c.mind.label = 'Drinking';
            if (c.needs.hydration >= 0.97) c.mind.thinkTimer = 0;
            return;
        }
        c.mind.label = 'Seeking water';
        terrain.flowTowards('water', c.x, c.y, flowScratch);
        const m = c.mind;
        m.desiredX = flowScratch.x || Math.cos(m.wanderAngle);
        m.desiredY = flowScratch.y || Math.sin(m.wanderAngle);
        m.desiredSpeed = c.traits.cruiseSpeed * (c.thirst > 0.75 ? 1.4 : 1);
    },
};

/** Eat plant biomass: land vegetation, or algae for aquatic species. */
export const graze = {
    id: 'graze',
    label: 'Grazing',
    score(c) {
        const hunger = c.hunger;
        if (hunger < 0.06) return 0;
        return keep(c, 'graze', Math.pow(hunger, 0.7) * 1.1 + 0.05);
    },
    plan(c, ctx) {
        const aquatic = c.species.habitat === 'water';
        const spot = ctx.world.vegetation.findForage(c.x, c.y, ctx.sense * 0.75, aquatic, forageScratch);
        const p = c.mind.point;
        p.valid = !!spot;
        if (spot) {
            p.x = spot.x;
            p.y = spot.y;
        }
    },
    act(c, ctx, dt) {
        const veg = ctx.world.vegetation;
        const here = veg.edibleAt(c.x, c.y);
        const aquatic = c.species.habitat === 'water';
        const onRightCell = ctx.world.terrain.isWater(c.x, c.y) === aquatic;
        const m = c.mind;
        if (onRightCell && here > 0.04) {
            const eaten = veg.graze(c.x, c.y, c.traits.bite * dt);
            const energy = eaten * ctx.config.vegetation.energyPerBiomass;
            c.needs.energy = Math.min(c.traits.energyCapacity, c.needs.energy + energy);
            c.record.eaten += energy;
            m.label = aquatic ? 'Feeding' : 'Grazing';
            m.wanderAngle += ctx.random.gaussian(0, 2.5) * dt;
            m.desiredX = Math.cos(m.wanderAngle);
            m.desiredY = Math.sin(m.wanderAngle);
            m.desiredSpeed = c.traits.cruiseSpeed * 0.15;
            addFlocking(c, 0.4 * c.traits.sociality);
            if (c.hunger < 0.02) m.thinkTimer = 0;
            return;
        }
        m.label = 'Foraging';
        if (m.point.valid) {
            const d = steerTowards(c, m.point.x, m.point.y, c.traits.cruiseSpeed);
            addFlocking(c, 0.25 * c.traits.sociality);
            if (d < 6) m.point.valid = false;
        } else {
            wander.act(c, ctx, dt);
            m.desiredSpeed = c.traits.cruiseSpeed;
        }
    },
};

/** Chase and strike live prey from the species' `eats` list. */
export const hunt = {
    id: 'hunt',
    label: 'Hunting',
    score(c, ctx) {
        const hunger = c.hunger;
        if (hunger < 0.3) return 0;
        const m = c.mind;
        if (m.action === 'hunt' && m.target?.alive) {
            ctx.candidate = m.target;
            return Math.pow(hunger, 0.8) * 1.25 + 0.1 + KEEP_BONUS;
        }
        const prey = findPrey(c, ctx);
        if (!prey) return 0;
        ctx.candidate = prey;
        return Math.pow(hunger, 0.8) * 1.25 + 0.1;
    },
    plan(c, ctx) {
        c.mind.target = ctx.candidate;
    },
    act(c, ctx) {
        const m = c.mind;
        const prey = m.target;
        if (!prey || !prey.alive) {
            m.thinkTimer = 0;
            return;
        }
        const dx = prey.x - c.x;
        const dy = prey.y - c.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const lead = Math.min(1.2, d / (c.traits.maxSpeed + 1));
        const tx = prey.x + prey.vx * lead;
        const ty = prey.y + prey.vy * lead;
        const close = d < ctx.sense * 0.55;
        const speed = close ? chaseSpeed(c) : c.traits.cruiseSpeed;
        steerTowards(c, tx, ty, speed);
        m.label = close ? 'Chasing' : 'Stalking';

        if (close && c.needs.stamina <= 0.05 && d > reach(c, prey) * 2.5) {
            m.ignore.set(prey.id, ctx.world.time + 15);
            m.target = null;
            m.thinkTimer = 0;
            ctx.events.emit('escape', { predator: c, prey });
            return;
        }

        if (d <= reach(c, prey) && m.attackTimer <= 0) {
            m.attackTimer = 0.9;
            const agility = prey.genome.get('speed') / c.genome.get('speed');
            let dodge = (c.species.habitat === 'air' ? 0.5 : 0.12) * agility;
            if (prey.species.habitat === 'water' && ctx.world.terrain.isDeepWater(prey.x, prey.y)) dodge += 0.35;
            dodge += Math.min(0.3, prey.mind.neighbors * 0.03 * prey.traits.sociality);
            if (ctx.random.chance(dodge)) {
                ctx.events.emit('miss', { predator: c, prey });
                return;
            }
            prey.needs.health -= c.traits.attack;
            prey.needs.lastDamage = 'predation';
            prey.mind.threat = c;
            prey.mind.threatDistance = d;
            prey.mind.thinkTimer = 0;
            ctx.events.emit('attack', { predator: c, prey });
            if (prey.needs.health <= 0) {
                const corpse = ctx.world.kill(prey, 'predation');
                c.record.kills++;
                ctx.world.totals.kills++;
                ctx.events.emit('kill', { predator: c, prey });
                m.action = 'feed';
                m.target = corpse;
            }
        }
    },
};

function findPrey(c, ctx) {
    const eats = c.species.eats;
    const { nearby, nearbyDistSq } = ctx.perception;
    const now = ctx.world.time;
    const maxMass = c.traits.mass * (1.1 + c.traits.boldness);
    let best = null;
    let bestScore = Infinity;
    for (let i = 0; i < nearby.length; i++) {
        const other = nearby[i];
        if (!eats.includes(other.speciesId) || !other.alive) continue;
        if (other.traits.mass * other.growth > maxMass) continue;
        if (isIgnored(c, other, now)) continue;
        const hidden = ctx.perception.concealment(other);
        const visible = ctx.sense * (1 - hidden * 0.7);
        if (nearbyDistSq[i] > visible * visible) continue;
        const healthFrac = other.needs.health / other.traits.maxHealth;
        const score = Math.sqrt(nearbyDistSq[i]) * (0.5 + healthFrac) * (other.growth < 1 ? 0.7 : 1);
        if (score < bestScore) {
            bestScore = score;
            best = other;
        }
    }
    return best;
}

function isReachable(c, target, ctx) {
    return c.species.habitat === 'air' || ctx.world.terrain.isPassable(c.species.habitat, target.x, target.y);
}

/** Eat from corpses: fresh kills or scavenged carrion. */
export const feed = {
    id: 'feed',
    label: 'Feeding',
    score(c, ctx) {
        const hunger = c.hunger;
        const m = c.mind;
        if (m.action === 'feed' && m.target?.alive && m.target.meat > 0.5 && hunger > 0.02) {
            ctx.candidate = m.target;
            return 1.5;
        }
        if (hunger < 0.15) return 0;
        const eats = c.species.eats;
        const anyCarrion = eats.includes('carrion');
        const corpse = ctx.world.corpseIndex.nearest(c.x, c.y, ctx.sense,
            (k) => k.meat > 2 && (anyCarrion || eats.includes(k.speciesId)) && isReachable(c, k, ctx));
        if (!corpse) return 0;
        ctx.candidate = corpse;
        return hunger * 1.3 + 0.3;
    },
    plan(c, ctx) {
        c.mind.target = ctx.candidate;
    },
    act(c, ctx, dt) {
        const m = c.mind;
        const corpse = m.target;
        if (!corpse || !corpse.alive || corpse.meat <= 0.5) {
            m.thinkTimer = 0;
            return;
        }
        const d = arrive(c, corpse.x, corpse.y, c.traits.cruiseSpeed, 20);
        if (d <= c.radius + corpse.radius + 4) {
            stop(c);
            const eaten = Math.min(c.traits.bite * dt, corpse.meat);
            corpse.meat -= eaten;
            c.needs.energy = Math.min(c.traits.energyCapacity, c.needs.energy + eaten);
            c.record.eaten += eaten;
            m.label = 'Feeding';
            if (c.hunger < 0.02) m.thinkTimer = 0;
        } else {
            m.label = 'Scavenging';
        }
    },
};

export const mate = {
    id: 'mate',
    label: 'Courting',
    score(c, ctx) {
        if (!ctx.reproduction.isReady(c)) return 0;
        const m = c.mind;
        if (m.action === 'mate' && m.target?.alive && ctx.reproduction.isReady(m.target)) {
            ctx.candidate = m.target;
            return 0.75 + KEEP_BONUS;
        }
        const partner = ctx.reproduction.findPartner(c, ctx.perception.nearby)
            ?? (c.mind.neighbors < 3 ? ctx.reproduction.findDistantPartner(c, ctx.sense * 3.5) : null);
        if (!partner) return 0;
        ctx.candidate = partner;
        return 0.75;
    },
    plan(c, ctx) {
        c.mind.target = ctx.candidate;
    },
    act(c, ctx) {
        const m = c.mind;
        const partner = m.target;
        if (!partner || !partner.alive || !ctx.reproduction.isReady(partner) || !ctx.reproduction.isReady(c)) {
            m.thinkTimer = 0;
            return;
        }
        const d = steerTowards(c, partner.x, partner.y, c.traits.cruiseSpeed);
        if (d <= reach(c, partner)) {
            ctx.reproduction.breed(c, partner);
            m.thinkTimer = 0;
            partner.mind.thinkTimer = 0;
        }
    },
};

export const rest = {
    id: 'rest',
    label: 'Resting',
    score(c, ctx) {
        if (c.hunger > 0.55 || c.thirst > 0.55) return 0;
        const daylight = ctx.world.clock.daylight;
        const sleepy = c.species.nocturnal ? daylight * 0.5 : (1 - daylight) * 0.75;
        const tired = (1 - c.needs.stamina) * 0.4;
        return keep(c, 'rest', sleepy + tired - 0.15);
    },
    plan() {},
    act(c) {
        stop(c);
        c.needs.resting = true;
        c.mind.label = 'Resting';
    },
};

export const wander = {
    id: 'wander',
    label: 'Wandering',
    score() {
        return 0.12;
    },
    plan() {},
    act(c, ctx, dt) {
        const m = c.mind;
        m.wanderAngle += ctx.random.gaussian(0, 1.4) * dt;
        let dx = Math.cos(m.wanderAngle);
        let dy = Math.sin(m.wanderAngle);
        const probe = 30 + c.radius * 2;
        if (!ctx.world.terrain.isPassable(c.species.habitat, c.x + dx * probe, c.y + dy * probe)) {
            m.wanderAngle += Math.PI * (0.5 + ctx.random.float(0, 0.5));
            dx = Math.cos(m.wanderAngle);
            dy = Math.sin(m.wanderAngle);
        }
        m.desiredX = dx;
        m.desiredY = dy;
        m.desiredSpeed = c.traits.cruiseSpeed * (c.species.habitat === 'air' ? 1 : 0.6);
        addFlocking(c, 1.2 * c.traits.sociality);
        m.label = c.species.habitat === 'air' ? 'Soaring' : m.neighbors > 2 ? 'Roaming with group' : 'Wandering';
    },
};
