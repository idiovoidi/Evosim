const ROT_RATE = 0.012;
const MAX_AGE = 90;

/** Corpses rot away over time and return nutrients to the soil, boosting regrowth. */
export class DecompositionSystem {
    constructor(world) {
        this.world = world;
    }

    update(dt) {
        const { vegetation, config } = this.world;
        for (const corpse of this.world.corpses) {
            if (!corpse.alive) continue;
            corpse.age += dt;
            corpse.meat -= corpse.maxMeat * ROT_RATE * dt;
            if (corpse.meat <= 0.5 || corpse.age > MAX_AGE) {
                corpse.alive = false;
                vegetation.fertilize(corpse.x, corpse.y, config.vegetation.corpseNutrient * (corpse.maxMeat / 75));
            }
        }
    }
}
