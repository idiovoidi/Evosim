/**
 * BiomeType class representing a biome with visual and gameplay properties
 */
export class BiomeType {
  constructor(config) {
    // Identity
    this.id = config.id; // 'grassland', 'forest', etc.
    this.name = config.name; // Display name

    // Visual properties
    this.color = config.color; // Base color
    this.secondaryColor = config.secondaryColor; // For gradients/patterns
    this.pattern = config.pattern; // 'solid', 'dots', 'stripes', 'noise', etc.
    this.animationSpeed = config.animationSpeed || 0;
    this.particleEffect = config.particleEffect || null;

    // Gameplay modifiers
    this.movementModifier = config.movementModifier || 1.0;
    this.energyModifier = config.energyModifier || 1.0;
    this.plantDensity = config.plantDensity || 1.0;
    this.plantGrowthRate = config.plantGrowthRate || 1.0;
    this.visibilityModifier = config.visibilityModifier || 1.0;
    this.concealmentBonus = config.concealmentBonus || 0.0;

    // Terrain generation
    this.noiseThreshold = config.noiseThreshold; // [min, max] range
    this.adjacencyRules = config.adjacencyRules || []; // Preferred neighbors
  }
}

/**
 * Biome definitions with all 9 biome types
 */
export const BIOME_DEFINITIONS = [
  {
    id: "deep_water",
    name: "Deep Water",
    color: "#1a4d7a",
    secondaryColor: "#0d3a5f",
    pattern: "waves",
    animationSpeed: 0.5,
    movementModifier: 0.2, // Very slow for non-fish
    energyModifier: 1.4,
    plantDensity: 0.0,
    plantGrowthRate: 0.0,
    visibilityModifier: 0.6,
    concealmentBonus: 0.4,
    noiseThreshold: [0.0, 0.25],
  },
  {
    id: "water",
    name: "Shallow Water",
    color: "#2e7db5",
    secondaryColor: "#4a9fd9",
    pattern: "waves",
    animationSpeed: 0.3,
    movementModifier: 0.3,
    energyModifier: 1.3,
    plantDensity: 0.1,
    plantGrowthRate: 0.5,
    visibilityModifier: 0.8,
    concealmentBonus: 0.2,
    noiseThreshold: [0.25, 0.35],
    adjacencyRules: ["deep_water", "sand"],
  },
  {
    id: "sand",
    name: "Sandy Beach",
    color: "#ddc77d",
    secondaryColor: "#f0e5b8",
    pattern: "dots",
    movementModifier: 0.85,
    energyModifier: 1.1,
    plantDensity: 0.2,
    plantGrowthRate: 0.6,
    visibilityModifier: 1.3,
    concealmentBonus: 0.0,
    noiseThreshold: [0.35, 0.42],
    adjacencyRules: ["water", "grassland"],
  },
  {
    id: "grassland",
    name: "Grassland",
    color: "#6b9e4d",
    secondaryColor: "#7fb857",
    pattern: "grass",
    animationSpeed: 0.2,
    movementModifier: 1.0,
    energyModifier: 0.9,
    plantDensity: 1.8,
    plantGrowthRate: 1.3,
    visibilityModifier: 1.0,
    concealmentBonus: 0.1,
    noiseThreshold: [0.42, 0.58],
    adjacencyRules: ["sand", "forest", "savanna"],
  },
  {
    id: "forest",
    name: "Dense Forest",
    color: "#3d6b2e",
    secondaryColor: "#2d5221",
    pattern: "trees",
    movementModifier: 0.7,
    energyModifier: 0.95,
    plantDensity: 2.2,
    plantGrowthRate: 1.5,
    visibilityModifier: 0.6,
    concealmentBonus: 0.5,
    noiseThreshold: [0.58, 0.72],
    adjacencyRules: ["grassland", "mountain"],
  },
  {
    id: "savanna",
    name: "Savanna",
    color: "#b8a76f",
    secondaryColor: "#d4c291",
    pattern: "sparse_grass",
    movementModifier: 1.2,
    energyModifier: 1.0,
    plantDensity: 1.0,
    plantGrowthRate: 0.9,
    visibilityModifier: 1.4,
    concealmentBonus: 0.0,
    noiseThreshold: [0.72, 0.8],
    adjacencyRules: ["grassland", "desert"],
  },
  {
    id: "desert",
    name: "Desert",
    color: "#d4a76a",
    secondaryColor: "#e8c794",
    pattern: "dunes",
    movementModifier: 0.8,
    energyModifier: 1.4,
    plantDensity: 0.15,
    plantGrowthRate: 0.4,
    visibilityModifier: 1.5,
    concealmentBonus: 0.0,
    noiseThreshold: [0.8, 0.87],
    adjacencyRules: ["savanna", "mountain"],
  },
  {
    id: "mountain",
    name: "Mountain",
    color: "#8b7355",
    secondaryColor: "#6d5a44",
    pattern: "rocks",
    movementModifier: 0.6,
    energyModifier: 1.5,
    plantDensity: 0.3,
    plantGrowthRate: 0.5,
    visibilityModifier: 1.2,
    concealmentBonus: 0.6,
    noiseThreshold: [0.87, 0.95],
    adjacencyRules: ["forest", "snow"],
  },
  {
    id: "snow",
    name: "Snowy Peak",
    color: "#f0f0f0",
    secondaryColor: "#e0e8f0",
    pattern: "snow",
    particleEffect: "snowfall",
    movementModifier: 0.5,
    energyModifier: 1.6,
    plantDensity: 0.0,
    plantGrowthRate: 0.0,
    visibilityModifier: 0.9,
    concealmentBonus: 0.3,
    noiseThreshold: [0.95, 1.0],
    adjacencyRules: ["mountain"],
  },
];

/**
 * Species habitat preferences mapping
 * Values: 1.0 = neutral, >1.0 = preferred, <1.0 = avoided
 */
export const HABITAT_PREFERENCES = {
  herbivore: {
    grassland: 1.8,
    forest: 1.5,
    savanna: 1.3,
    sand: 0.9,
    mountain: 0.7,
    desert: 0.5,
    water: 0.3,
    deep_water: 0.1,
    snow: 0.4,
  },
  predator: {
    savanna: 1.7,
    grassland: 1.4,
    forest: 1.2,
    mountain: 1.3,
    sand: 1.0,
    desert: 0.8,
    water: 0.4,
    deep_water: 0.2,
    snow: 0.6,
  },
  plant: {
    grassland: 2.0,
    forest: 1.8,
    savanna: 1.2,
    sand: 0.5,
    mountain: 0.6,
    desert: 0.3,
    water: 0.0,
    deep_water: 0.0,
    snow: 0.0,
  },
  fish: {
    deep_water: 2.0,
    water: 1.8,
    sand: 0.1,
    grassland: 0.0,
    forest: 0.0,
    savanna: 0.0,
    desert: 0.0,
    mountain: 0.0,
    snow: 0.0,
  },
  bird: {
    grassland: 1.3,
    forest: 1.4,
    savanna: 1.5,
    mountain: 1.6,
    sand: 1.2,
    desert: 1.0,
    water: 1.1,
    deep_water: 0.9,
    snow: 0.8,
  },
};
