/**
 * Shared species configuration
 * Centralized to eliminate duplication between EntityFactory and EntityPool
 */

export const SPECIES_CONFIG = {
    herbivore: {
        emoji: '🐰',
        color: '#96c896',
        maxEnergy: 220,
        initialEnergy: 170,
        layer: 2
    },
    predator: {
        emoji: '🦊',
        color: '#c89696',
        maxEnergy: 240,
        initialEnergy: 180,
        layer: 2
    },
    plant: {
        emoji: '🌿',
        color: '#649650',
        maxEnergy: 100,
        initialEnergy: 100,
        layer: 0
    },
    fish: {
        emoji: '🐟',
        color: '#5a9ed4',
        maxEnergy: 150,
        initialEnergy: 120,
        layer: 1
    },
    bird: {
        emoji: '🦅',
        color: '#8b7355',
        maxEnergy: 180,
        initialEnergy: 140,
        layer: 3
    }
};

export const SPECIES_KEYS = Object.keys(SPECIES_CONFIG);

export function getSpeciesConfig(species) {
    const config = SPECIES_CONFIG[species];
    if (!config) {
        throw new Error(`Unknown species: ${species}`);
    }
    return config;
}

export function validateSpecies(species) {
    return SPECIES_CONFIG.hasOwnProperty(species);
}
