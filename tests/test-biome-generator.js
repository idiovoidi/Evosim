// Quick test to verify BiomeGenerator functionality
import { BiomeGenerator } from "../src/core/BiomeGenerator.js";

console.log("Testing BiomeGenerator...\n");

// Test 1: Basic initialization
console.log("Test 1: Basic initialization");
const generator = new BiomeGenerator(800, 600);
console.log("✓ Generator created successfully");
console.log(`  - Width: ${generator.width}, Height: ${generator.height}`);
console.log(`  - Tiles: ${generator.tilesX}x${generator.tilesY}`);
console.log(`  - Biomes loaded: ${generator.biomes.length}`);
console.log(`  - Seed: ${generator.seed}`);

// Test 2: Seeded generation
console.log("\nTest 2: Seeded generation");
const seededGen1 = new BiomeGenerator(800, 600, 12345);
const seededGen2 = new BiomeGenerator(800, 600, 12345);
const biome1 = seededGen1.getBiomeAt(400, 300);
const biome2 = seededGen2.getBiomeAt(400, 300);
console.log(
  `✓ Same seed produces same biome: ${biome1.id === biome2.id ? "YES" : "NO"}`
);
console.log(`  - Biome at (400, 300): ${biome1.id}`);

// Test 3: getBiomeAt with error handling
console.log("\nTest 3: getBiomeAt with error handling");
const validBiome = generator.getBiomeAt(100, 100);
console.log(`✓ Valid position (100, 100): ${validBiome.id}`);

const invalidBiome = generator.getBiomeAt(-10, -10);
console.log(
  `✓ Invalid position (-10, -10): ${invalidBiome.id} (should be default)`
);

const outOfBounds = generator.getBiomeAt(10000, 10000);
console.log(
  `✓ Out of bounds (10000, 10000): ${outOfBounds.id} (should be default)`
);

// Test 4: Biome diversity
console.log("\nTest 4: Biome diversity");
const biomeCount = new Map();
for (let y = 0; y < generator.tilesY; y++) {
  for (let x = 0; x < generator.tilesX; x++) {
    const biome = generator.biomeMap[y][x];
    biomeCount.set(biome.id, (biomeCount.get(biome.id) || 0) + 1);
  }
}
console.log("✓ Biome distribution:");
for (const [biomeId, count] of biomeCount.entries()) {
  const percentage = (
    (count / (generator.tilesX * generator.tilesY)) *
    100
  ).toFixed(1);
  console.log(`  - ${biomeId}: ${count} tiles (${percentage}%)`);
}

// Test 5: Biome transitions
console.log("\nTest 5: Biome transitions");
const transition = generator.getBiomeTransition(400, 300, 1);
console.log(`✓ Transition at (400, 300):`);
console.log(`  - Primary biome: ${transition.primaryBiome.id}`);
console.log(`  - Nearby biomes: ${transition.weights.size}`);
for (const [biomeId, weight] of transition.weights.entries()) {
  console.log(`    - ${biomeId}: ${(weight * 100).toFixed(1)}%`);
}

// Test 6: Resize functionality
console.log("\nTest 6: Resize functionality");
const oldTilesX = generator.tilesX;
const oldTilesY = generator.tilesY;
generator.resize(1200, 800);
console.log(
  `✓ Resized from ${oldTilesX}x${oldTilesY} to ${generator.tilesX}x${generator.tilesY}`
);

// Test 7: Regenerate with new seed
console.log("\nTest 7: Regenerate with new seed");
const oldBiome = generator.getBiomeAt(400, 300);
generator.regenerate(99999);
const newBiome = generator.getBiomeAt(400, 300);
console.log(`✓ Regenerated with new seed`);
console.log(`  - Old biome: ${oldBiome.id}`);
console.log(`  - New biome: ${newBiome.id}`);
console.log(`  - Changed: ${oldBiome.id !== newBiome.id ? "YES" : "NO"}`);

// Test 8: Backward compatibility methods
console.log("\nTest 8: Backward compatibility");
const terrainType = generator.getTerrainAt(100, 100);
const terrainColor = generator.getTerrainColor(terrainType);
console.log(`✓ getTerrainAt(100, 100): ${terrainType}`);
console.log(`✓ getTerrainColor('${terrainType}'): ${terrainColor}`);

console.log("\n✅ All tests completed successfully!");
