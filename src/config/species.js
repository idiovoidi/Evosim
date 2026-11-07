/**
 * Species archetypes. Values are for a creature with every gene at 1.0;
 * the phenotype model scales them by genes.
 *
 * Units: distance in world units, time in seconds, energy in arbitrary units.
 *
 * habitat   'land' | 'water' | 'air'  - which cells the creature can occupy
 * eats      what the creature can consume ('vegetation' | 'algae' | species ids | 'carrion')
 * fears     species that trigger fleeing
 * radius    body radius
 * speed     top (sprint) speed
 * sense     perception radius
 * energy    energy storage
 * basal     resting energy burn per second
 * moveCost  extra burn per second at full sprint
 * bite      food intake per second (vegetation biomass or meat)
 * attack    damage per strike (predators)
 * health    max health
 * maturity  age (s) before breeding
 * lifespan  expected max age (s)
 * breedCooldown seconds between litters
 * thirst    hydration lost per second (0 = never drinks)
 * crowdLimit flockmates nearby above which the creature is too stressed to breed
 * territory  if set, crowding counts rivals within this radius instead of flockmates
 * forage    food supply per head (vegetation / algae biomass, or prey count) needed for full fertility
 */
export const SPECIES = {
    herbivore: {
        id: 'herbivore',
        crowdLimit: 9,
        forage: { source: 'vegetation', perCapita: 45 },
        name: 'Grazers',
        singular: 'Grazer',
        habitat: 'land',
        eats: ['vegetation'],
        fears: ['predator'],
        radius: 6,
        speed: 46,
        sense: 115,
        energy: 100,
        basal: 0.55,
        moveCost: 0.9,
        bite: 0.32,
        attack: 0,
        health: 60,
        maturity: 80,
        lifespan: 520,
        breedCooldown: 55,
        thirst: 0.011,
        meat: 75,
        nocturnal: false,
        palette: { hue: 34, hueSpread: 40, sat: 42, light: 62 },
        geneInit: { litter: [1.6, 2.6], sociality: [0.5, 0.8], boldness: [0.2, 0.45] },
    },
    predator: {
        id: 'predator',
        crowdLimit: 2,
        forage: { source: 'herbivore', perCapita: 7 },
        territory: 260,
        name: 'Hunters',
        singular: 'Hunter',
        habitat: 'land',
        eats: ['herbivore'],
        fears: [],
        radius: 7.5,
        speed: 58,
        sense: 170,
        energy: 150,
        basal: 0.5,
        moveCost: 1.2,
        bite: 9,
        attack: 34,
        health: 90,
        maturity: 75,
        lifespan: 700,
        breedCooldown: 60,
        thirst: 0.009,
        meat: 60,
        nocturnal: true,
        palette: { hue: 14, hueSpread: 30, sat: 62, light: 50 },
        geneInit: { litter: [1.2, 2.0], sociality: [0.1, 0.4], boldness: [0.5, 0.8] },
    },
    fish: {
        id: 'fish',
        crowdLimit: 10,
        forage: { source: 'algae', perCapita: 9 },
        name: 'Fish',
        singular: 'Fish',
        habitat: 'water',
        eats: ['algae'],
        fears: ['bird'],
        radius: 4.5,
        speed: 40,
        sense: 85,
        energy: 70,
        basal: 0.32,
        moveCost: 0.5,
        bite: 0.22,
        attack: 0,
        health: 35,
        maturity: 55,
        lifespan: 380,
        breedCooldown: 42,
        thirst: 0,
        meat: 55,
        nocturnal: false,
        palette: { hue: 195, hueSpread: 120, sat: 60, light: 58 },
        geneInit: { litter: [2.5, 4], sociality: [0.6, 0.9], boldness: [0.2, 0.4] },
    },
    bird: {
        id: 'bird',
        crowdLimit: 2,
        forage: { source: 'fish', perCapita: 9 },
        territory: 300,
        name: 'Raptors',
        singular: 'Raptor',
        habitat: 'air',
        eats: ['fish', 'carrion'],
        fears: [],
        radius: 6,
        speed: 70,
        sense: 190,
        energy: 110,
        basal: 0.55,
        moveCost: 0.9,
        bite: 7,
        attack: 40,
        health: 50,
        maturity: 90,
        lifespan: 640,
        breedCooldown: 90,
        thirst: 0.007,
        meat: 40,
        nocturnal: false,
        palette: { hue: 220, hueSpread: 60, sat: 18, light: 82 },
        geneInit: { litter: [1.2, 2.2], sociality: [0.2, 0.5], boldness: [0.5, 0.8] },
    },
};

export const SPECIES_IDS = Object.keys(SPECIES);
