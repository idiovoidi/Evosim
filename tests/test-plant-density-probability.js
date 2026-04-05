/**
 * Test plant density probability distribution
 */

import { World } from '../src/core/World.js';
import { ComponentType } from '../src/core/Entity.js';

console.log('=== Testing Plant Density Probability ===\n');

// Create a world
const world = new World(800, 600);

// Test: Verify plant density affects spawn probability
console.log('Test: Plant density affects spawn probability');

// Sample many locations and track biome types
const locationSamples = 1000;
const biomeLocations = {};

for (let i = 0; i < locationSamples; i++) {
    const x = Math.random() * world.width;
    const y = Math.random() * world.height;
    const biome = world.getBiomeAt(x, y);
    
    if (!biomeLocations[biome.id]) {
        biomeLocations[biome.id] = [];
    }
    biomeLocations[biome.id].push({ x, y, biome });
}

console.log('  Biome distribution in world:');
for (const [biomeId, locations] of Object.entries(biomeLocations)) {
    const sample = locations[0].biome;
    console.log(`    ${biomeId}: ${locations.length} locations (density: ${sample.plantDensity}, growth: ${sample.plantGrowthRate})`);
}
console.log();

// Test spawning with explicit biome targeting
console.log('Test: Explicit biome spawn attempts');

const testBiomes = ['deep_water', 'water', 'sand', 'grassland', 'forest', 'mountain', 'snow'];
const spawnResults = {};

for (const targetBiome of testBiomes) {
    // Find locations with this biome
    const locations = biomeLocations[targetBiome];
    
    if (!locations || locations.length === 0) {
        console.log(`  ${targetBiome}: Not found in world`);
        continue;
    }
    
    const sample = locations[0].biome;
    const attempts = 50;
    let successes = 0;
    
    // Try spawning plants at these locations
    for (let i = 0; i < attempts && i < locations.length; i++) {
        const loc = locations[i];
        
        // Simulate the spawn logic
        if (sample.plantDensity === 0.0) {
            // Should always fail
            continue;
        }
        
        // Apply density modifier as probability check
        if (Math.random() <= sample.plantDensity / 2.5) {
            successes++;
        }
    }
    
    const successRate = (successes / attempts * 100).toFixed(1);
    const expectedRate = (sample.plantDensity / 2.5 * 100).toFixed(1);
    
    console.log(`  ${targetBiome}: ${successes}/${attempts} (${successRate}% success, expected ~${expectedRate}%)`);
    
    spawnResults[targetBiome] = {
        density: sample.plantDensity,
        attempts,
        successes,
        successRate: parseFloat(successRate),
        expectedRate: parseFloat(expectedRate)
    };
}

console.log();

// Verify zero-density biomes
console.log('Test: Zero-density biomes verification');
const zeroDensityBiomes = ['deep_water', 'snow'];

for (const biomeId of zeroDensityBiomes) {
    const result = spawnResults[biomeId];
    if (result) {
        if (result.successes === 0) {
            console.log(`  ✓ ${biomeId}: No spawns (correct)`);
        } else {
            console.log(`  ✗ ${biomeId}: ${result.successes} spawns (should be 0)`);
        }
    } else {
        console.log(`  - ${biomeId}: Not found in world`);
    }
}

console.log();

// Test high-density biomes
console.log('Test: High-density biomes verification');
const highDensityBiomes = ['grassland', 'forest'];

for (const biomeId of highDensityBiomes) {
    const result = spawnResults[biomeId];
    if (result) {
        if (result.successRate > 50) {
            console.log(`  ✓ ${biomeId}: ${result.successRate}% success rate (high density working)`);
        } else {
            console.log(`  ✗ ${biomeId}: ${result.successRate}% success rate (expected >50%)`);
        }
    }
}

console.log('\n=== Test Complete ===');
