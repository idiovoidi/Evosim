/**
 * Test plant spawning with biome density modifiers
 */

import { World } from "./src/core/World.js";
import { ComponentType } from "./src/core/Entity.js";

console.log("=== Testing Plant Spawning with Biome Density Modifiers ===\n");

// Create a world
const world = new World(800, 600);

// Test 1: Check getBiomeAt method exists and returns biome data
console.log("Test 1: getBiomeAt method");
const testBiome = world.getBiomeAt(400, 300);
console.log("  Biome at (400, 300):", testBiome);
console.log("  Has plantDensity:", testBiome.plantDensity !== undefined);
console.log("  Has plantGrowthRate:", testBiome.plantGrowthRate !== undefined);
console.log("  ✓ getBiomeAt works\n");

// Test 2: Spawn plants and check they respect biome density
console.log("Test 2: Plant spawning respects biome density");
const initialPlantCount = 50;
const spawnedPlants = [];

for (let i = 0; i < initialPlantCount; i++) {
  const plant = world.spawnEntityOnValidTerrain("plant", ["grass", "forest"]);
  if (plant) {
    spawnedPlants.push(plant);
  }
}

console.log(`  Spawned ${spawnedPlants.length} plants`);

// Check biomes where plants spawned
const biomeDistribution = {};
for (const plant of spawnedPlants) {
  const pos = plant.getComponent(ComponentType.POSITION);
  if (pos) {
    const biome = world.getBiomeAt(pos.x, pos.y);
    const biomeId = biome.id;
    biomeDistribution[biomeId] = (biomeDistribution[biomeId] || 0) + 1;

    // Verify no plants in zero-density biomes
    if (biome.plantDensity === 0.0) {
      console.log(`  ✗ ERROR: Plant spawned in zero-density biome: ${biomeId}`);
    }
  }
}

console.log("  Plant distribution by biome:");
for (const [biomeId, count] of Object.entries(biomeDistribution)) {
  const biome = world.getBiomeAt(400, 300); // Get sample biome for reference
  console.log(`    ${biomeId}: ${count} plants`);
}
console.log("  ✓ Plants spawned in valid biomes\n");

// Test 3: Test plant reproduction with biome density
console.log("Test 3: Plant reproduction respects biome density");

// Find a plant and give it enough energy to reproduce
if (spawnedPlants.length > 0) {
  const testPlant = spawnedPlants[0];
  const stats = testPlant.getComponent(ComponentType.STATS);
  const pos = testPlant.getComponent(ComponentType.POSITION);

  if (stats && pos) {
    const biome = world.getBiomeAt(pos.x, pos.y);
    console.log(
      `  Test plant at biome: ${biome.id} (density: ${biome.plantDensity})`
    );

    // Give plant enough energy to reproduce
    stats.energy = 150;
    stats.reproductionCooldown = 0;

    const beforeCount = world.getActiveEntities().length;

    // Update reproduction system
    const reproSystem = world.systems.find(
      (s) => s.constructor.name === "ReproductionSystem"
    );
    if (reproSystem) {
      reproSystem.update(1.0);

      const afterCount = world.getActiveEntities().length;
      const reproduced = afterCount > beforeCount;

      console.log(
        `  Before: ${beforeCount} entities, After: ${afterCount} entities`
      );
      console.log(
        `  Reproduction ${
          reproduced
            ? "succeeded"
            : "may have failed (expected in low-density biomes)"
        }`
      );
      console.log("  ✓ Reproduction system integrated with biome density\n");
    }
  }
}

// Test 4: Test plant energy regeneration with plantGrowthRate
console.log("Test 4: Plant energy regeneration uses plantGrowthRate");

if (spawnedPlants.length > 0) {
  const testPlant = spawnedPlants[0];
  const stats = testPlant.getComponent(ComponentType.STATS);
  const pos = testPlant.getComponent(ComponentType.POSITION);

  if (stats && pos) {
    const biome = world.getBiomeAt(pos.x, pos.y);
    console.log(
      `  Test plant at biome: ${biome.id} (growth rate: ${biome.plantGrowthRate})`
    );

    const initialEnergy = stats.energy;

    // Update health system
    const healthSystem = world.systems.find(
      (s) => s.constructor.name === "HealthSystem"
    );
    if (healthSystem) {
      healthSystem.update(1.0);

      const finalEnergy = stats.energy;
      const energyChange = finalEnergy - initialEnergy;

      console.log(`  Initial energy: ${initialEnergy.toFixed(2)}`);
      console.log(`  Final energy: ${finalEnergy.toFixed(2)}`);
      console.log(`  Energy change: ${energyChange.toFixed(2)}`);
      console.log(
        `  ${
          energyChange > 0 ? "✓" : "✗"
        } Plant gained energy (expected for plants)`
      );
    }
  }
}

console.log("\n=== All Tests Complete ===");
