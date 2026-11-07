/** Tunable simulation parameters. The settings panel edits a copy of these. */
export const DEFAULTS = Object.freeze({
    world: { width: 3000, height: 2000, cellSize: 16 },
    timestep: 1 / 30,
    clock: { dayLength: 150, daysPerSeason: 2 },
    population: { herbivore: 80, predator: 10, fish: 70, bird: 10 },
    caps: { herbivore: 600, predator: 120, fish: 500, bird: 100 },
    evolution: {
        mutationChance: 0.35,
        mutationScale: 1.0,
        compatibility: 0.22,
    },
    vegetation: {
        energyPerBiomass: 7,
        growthScale: 0.4,
        seedRate: 0.0006,
        updateInterval: 0.5,
        seasonalAmplitude: 0.3,
        corpseNutrient: 0.6,
        nutrientDecay: 0.004,
    },
    immigration: { enabled: true, interval: 40, threshold: 4 },
    stats: { sampleInterval: 2, historyLength: 900 },
    brainInterval: 0.2,
});

export function cloneDefaults() {
    return structuredClone(DEFAULTS);
}

/** Recursively merge `overrides` onto a fresh copy of the defaults. */
export function buildConfig(overrides = {}) {
    const merge = (target, source) => {
        for (const [key, value] of Object.entries(source)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                target[key] = merge(target[key] ?? {}, value);
            } else if (value !== undefined) {
                target[key] = value;
            }
        }
        return target;
    };
    return merge(cloneDefaults(), overrides);
}
