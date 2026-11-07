const HOT_BIOMES = new Set(['desert', 'savanna', 'beach']);

/**
 * Energy upkeep (basal + movement), hydration, stamina, healing, ageing and
 * death from starvation, dehydration or old age.
 */
export class MetabolismSystem {
    constructor(world) {
        this.world = world;
    }

    update(dt) {
        const world = this.world;
        for (const c of world.creatures) {
            if (!c.alive) continue;
            const t = c.traits;
            const n = c.needs;
            const life = c.life;

            life.age += dt;
            if (life.breedCooldown > 0) life.breedCooldown -= dt;

            const v2 = c.vx * c.vx + c.vy * c.vy;
            const basal = t.basal * (n.resting ? 0.55 : 1) * (0.5 + 0.5 * c.growth);
            n.energy -= (basal + t.moveCost * v2) * dt;

            if (t.thirstRate > 0) {
                const heat = HOT_BIOMES.has(world.terrain.biomeAt(c.x, c.y).id) ? 1.5 : 1;
                n.hydration -= t.thirstRate * heat * dt;
            }

            if (n.sprinting) n.stamina = Math.max(0, n.stamina - dt / t.sprintDuration);
            else n.stamina = Math.min(1, n.stamina + dt * (n.resting ? 0.22 : 0.1));

            let damage = 0;
            if (n.energy <= 0) {
                n.energy = 0;
                damage += t.maxHealth * 0.06;
                n.lastDamage = 'starvation';
            }
            if (n.hydration <= 0) {
                n.hydration = 0;
                damage += t.maxHealth * 0.07;
                n.lastDamage = 'dehydration';
            }
            const lifespan = c.lifespan;
            if (life.age > lifespan) {
                damage += t.maxHealth * 0.035 * (1 + (life.age - lifespan) / 60);
                n.lastDamage = 'old age';
            }

            if (damage > 0) {
                n.health -= damage * dt;
            } else if (n.energy > t.energyCapacity * 0.25 && n.hydration > 0.25 && n.health < t.maxHealth) {
                const heal = t.maxHealth * (n.resting ? 0.03 : 0.015) * dt;
                n.health = Math.min(t.maxHealth, n.health + heal);
                n.energy -= heal * 0.3;
            }

            if (n.health <= 0) world.kill(c, n.lastDamage ?? 'unknown');
        }
    }
}
