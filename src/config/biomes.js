/**
 * Biome definitions.
 *
 * fertility   - vegetation carrying capacity (0..1) of a cell
 * growth      - logistic regrowth rate of vegetation per second
 * moveCost    - terrain speed multiplier for walkers (fish/birds ignore it)
 * cover       - concealment (0..1): reduces the distance at which prey is noticed
 * water       - 'deep' | 'shallow' | null
 * ground      - [dark, light] colours of the bare ground the terrain painter bakes
 * flora       - colour of fully grown vegetation drawn over the ground
 */
export const BIOMES = [
    {
        id: 'deep_water', name: 'Deep Ocean', water: 'deep',
        fertility: 0.2, growth: 0.035, moveCost: 0, cover: 0.3,
        ground: ['#0a2440', '#12385e'], flora: '#1d5a5a',
    },
    {
        id: 'shallows', name: 'Shallows', water: 'shallow',
        fertility: 0.9, growth: 0.07, moveCost: 0.35, cover: 0.15,
        ground: ['#1d6385', '#348cad'], flora: '#2f8a76',
    },
    {
        id: 'beach', name: 'Beach', water: null,
        fertility: 0.12, growth: 0.03, moveCost: 0.85, cover: 0,
        ground: ['#cdb784', '#eadcac'], flora: '#a8b469',
    },
    {
        id: 'marsh', name: 'Marsh', water: null,
        fertility: 0.95, growth: 0.06, moveCost: 0.6, cover: 0.35,
        ground: ['#4b4a34', '#625f42'], flora: '#5f8c3f',
    },
    {
        id: 'grassland', name: 'Grassland', water: null,
        fertility: 1.0, growth: 0.065, moveCost: 1.0, cover: 0.1,
        ground: ['#7a6744', '#968257'], flora: '#77ad45',
    },
    {
        id: 'forest', name: 'Forest', water: null,
        fertility: 0.75, growth: 0.05, moveCost: 0.75, cover: 0.55,
        ground: ['#3f3a28', '#544b33'], flora: '#3f7a34',
    },
    {
        id: 'savanna', name: 'Savanna', water: null,
        fertility: 0.55, growth: 0.045, moveCost: 1.1, cover: 0.05,
        ground: ['#a68d58', '#bfa66e'], flora: '#b3b356',
    },
    {
        id: 'desert', name: 'Desert', water: null,
        fertility: 0.08, growth: 0.015, moveCost: 0.8, cover: 0,
        ground: ['#cba061', '#e5c58c'], flora: '#a3a35a',
    },
    {
        id: 'mountain', name: 'Mountain', water: null,
        fertility: 0.2, growth: 0.02, moveCost: 0.55, cover: 0.4,
        ground: ['#5f574c', '#8c8273'], flora: '#62804a',
    },
    {
        id: 'snow', name: 'Snowcap', water: null,
        fertility: 0, growth: 0, moveCost: 0.45, cover: 0.2,
        ground: ['#d3dde6', '#fbfdff'], flora: '#ffffff',
    },
];

export const BIOME_INDEX = Object.fromEntries(BIOMES.map((b, i) => [b.id, i]));

/** Thresholds on rank-normalized elevation (so they are also area fractions). */
export const ELEVATION = {
    deep: 0.2,
    sea: 0.33,
    beach: 0.36,
    mountain: 0.87,
    snow: 0.985,
};

/** Map normalized height / moisture / temperature to a biome index. */
export function classifyBiome(h, m, t) {
    if (h < ELEVATION.deep) return BIOME_INDEX.deep_water;
    if (h < ELEVATION.sea) return BIOME_INDEX.shallows;
    if (h < ELEVATION.beach) return m > 0.7 ? BIOME_INDEX.marsh : BIOME_INDEX.beach;
    if (h > ELEVATION.snow) return BIOME_INDEX.snow;
    if (h > ELEVATION.mountain) return h > 0.93 && t < 0.15 ? BIOME_INDEX.snow : BIOME_INDEX.mountain;
    if (m > 0.74 && h < 0.5) return BIOME_INDEX.marsh;
    if (t > 0.6 && m < 0.3) return BIOME_INDEX.desert;
    if (t > 0.52 && m < 0.45) return BIOME_INDEX.savanna;
    if (m > 0.56) return BIOME_INDEX.forest;
    return BIOME_INDEX.grassland;
}
