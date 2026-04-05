/**
 * Test that plants cannot spawn in water, deep_water, and snow biomes
 */

import { World } from '../src/core/World.js';
import { ComponentType } from '../src/core/Entity.js';

console.log('=== Testing Plant Biome Restrictions ===\n');

// Create a world
const world = new World(800, 600);

// Test: Verify zero-density biomes prevent plant spawning
console.log('Test: Zero-density biomes (water, deep_water, snow)');

// Check all biome types in the world
const biomeTypes = new Set();
const biomeSamples = [];

// Sample the world to find different biomes
for (let i = 0; i < 100; i++) {
    const x = Math.random() * world.width;
    const y = Math.random() * world.height;
    const biome = world.getBiomeAt(x, y);
    
    if (!biomeTypes.has(biome.id)) {
        biomeTypes.add(biome.id);
        biomeSamples.push({ x, y, biome });
    }
}

console.log(`  Found ${biomeTypes.size} different biome types:`);
for (const sample of biomeSamples) {
    console.log(`    ${sample.biome.id}: density=${sample.biome.plantDensity}, growth=${sample.biome.plantGrowthRate}`);
}
console.log();

// Test plant reproduction in zero-density biomes
console.log('Test: Plant reproduction fails in zero-density biomes');

// Create a test plant manually in each biome type
for (const sample of biomeSamples) {
    if (sample.biome.plantDensity === 0.0) {
        console.log(`  Testing in ${sample.biome.id} biome (density: ${sample.biome.plantDensity})`);
        
        // Create a plant at this location
        const plant = world.pool.acquire('plant', sample.x, sample.y);
        world.addEntity(plant);
        
        const stats = plant.getComponent(ComponentType.STATS);
        if (stats) {
            // Give it enough energy to reproduce
            stats.energy = 150;
            stats.reproductionCooldown = 0;
            
            const beforeCount = world.getActiveEntities().length;
            
            // Try to reproduce
            const reproSystem = world.systems.find(s => s.constructor.name === 'ReproductionSystem');
            if (reproSystem) {
                reproSystem.update(1.0);
                
                const afterCount = world.getActiveEntities().length;
                const reproduced = afterCount > beforeCount;
                
                if (reproduced) {
                    console.log(`    ✗ ERROR: Plant reproduced in zero-density biome!`);
                } else {
                    console.log(`    ✓ Plant reproduction blocked in ${sample.biome.id}`);
                }
            }
        }
        
        // Clean up
        world.pool.release(plant);
    }
}

console.log();

// Test plant spawning attempts in various biomes
console.log('Test: spawnEntityOnValidTerrain respects plant density');

// Try spawning many plants and verify distribution
const spawnAttempts = 100;
const spawnedPlants = [];

for (let i = 0; i < spawnAttempts; i++) {
    const plant = world.spawnEntityOnValidTerrain('plant', ['grass', 'forest', 'water', 'deep_water', 'snow']);
    if (plant) {
        spawnedPlants.push(plant);
    }
}

console.log(`  Attempted to spawn ${spawnAttempts} plants`);
console.log(`  Successfully spawned ${spawnedPlants.length} plants`);

// Check where they spawned
const distribution = {};
let errorCount = 0;

for (const plant of spawnedPlants) {
    const pos = plant.getComponent(ComponentType.POSITION);
    if (pos) {
        const biome = world.getBiomeAt(pos.x, pos.y);
        distribution[biome.id] = (distribution[biome.id] || 0) + 1;
        
        // Check for violations
        if (biome.plantDensity === 0.0) {
            console.log(`  ✗ ERROR: Plant spawned in ${biome.id} (density: ${biome.plantDensity})`);
            errorCount++;
        }
    }
}

console.log('  Distribution:');
for (const [biomeId, count] of Object.entries(distribution)) {
    console.log(`    ${biomeId}: ${count} plants`);
}

if (errorCount === 0) {
    console.log('  ✓ No plants spawned in zero-density biomes');
} else {
    console.log(`  ✗ Found ${errorCount} plants in zero-density biomes`);
}

console.log('\n=== Test Complete ===');
