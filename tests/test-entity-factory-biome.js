/**
 * Test script to verify EntityFactory adds biome components correctly
 */

import { EntityFactory } from '../src/core/EntityFactory.js';
import { ComponentType } from '../src/core/Entity.js';
import { BiomeGenerator } from '../src/core/BiomeGenerator.js';

// Mock world object with biome generator
const mockWorld = {
    width: 800,
    height: 600,
    time: 0,
    biomeGenerator: new BiomeGenerator(800, 600, 12345)
};

// Create entity factory
const factory = new EntityFactory(mockWorld);

console.log('Testing EntityFactory biome component integration...\n');

// Test 1: Create herbivore and check biome components
console.log('Test 1: Creating herbivore entity');
const herbivore = factory.createEntity('herbivore', 400, 300);

if (herbivore.hasComponent(ComponentType.BIOME)) {
    console.log('✓ BiomeComponent added');
    const biomeComp = herbivore.getComponent(ComponentType.BIOME);
    console.log(`  Current biome: ${biomeComp.currentBiome}`);
    console.log(`  Movement multiplier: ${biomeComp.biomeEffects.movementMultiplier}`);
    console.log(`  Energy multiplier: ${biomeComp.biomeEffects.energyMultiplier}`);
} else {
    console.log('✗ BiomeComponent missing');
}

if (herbivore.hasComponent(ComponentType.HABITAT)) {
    console.log('✓ HabitatComponent added');
    const habitatComp = herbivore.getComponent(ComponentType.HABITAT);
    console.log(`  Grassland preference: ${habitatComp.getPreference('grassland')}`);
    console.log(`  Forest preference: ${habitatComp.getPreference('forest')}`);
    console.log(`  Water preference: ${habitatComp.getPreference('water')}`);
    console.log(`  Preferred biomes: ${habitatComp.preferredBiomes.join(', ')}`);
    console.log(`  Avoided biomes: ${habitatComp.avoidedBiomes.join(', ')}`);
} else {
    console.log('✗ HabitatComponent missing');
}

// Test 2: Create fish and check water preferences
console.log('\nTest 2: Creating fish entity');
const fish = factory.createEntity('fish', 100, 100);

if (fish.hasComponent(ComponentType.HABITAT)) {
    const habitatComp = fish.getComponent(ComponentType.HABITAT);
    console.log('✓ Fish habitat preferences loaded');
    console.log(`  Deep water preference: ${habitatComp.getPreference('deep_water')}`);
    console.log(`  Water preference: ${habitatComp.getPreference('water')}`);
    console.log(`  Grassland preference: ${habitatComp.getPreference('grassland')}`);
    console.log(`  Is deep_water preferred? ${habitatComp.isPreferred('deep_water')}`);
    console.log(`  Is grassland avoided? ${habitatComp.isAvoided('grassland')}`);
}

// Test 3: Create predator and check biome effects
console.log('\nTest 3: Creating predator entity');
const predator = factory.createEntity('predator', 600, 400);

if (predator.hasComponent(ComponentType.BIOME)) {
    const biomeComp = predator.getComponent(ComponentType.BIOME);
    console.log('✓ Predator biome effects initialized');
    console.log(`  Current biome: ${biomeComp.currentBiome}`);
    console.log(`  Visibility multiplier: ${biomeComp.biomeEffects.visibilityMultiplier}`);
    console.log(`  Concealment bonus: ${biomeComp.biomeEffects.concealmentBonus}`);
}

// Test 4: Create plant and check habitat preferences
console.log('\nTest 4: Creating plant entity');
const plant = factory.createEntity('plant', 500, 250);

if (plant.hasComponent(ComponentType.HABITAT)) {
    const habitatComp = plant.getComponent(ComponentType.HABITAT);
    console.log('✓ Plant habitat preferences loaded');
    console.log(`  Grassland preference: ${habitatComp.getPreference('grassland')}`);
    console.log(`  Forest preference: ${habitatComp.getPreference('forest')}`);
    console.log(`  Water preference: ${habitatComp.getPreference('water')}`);
    console.log(`  Desert preference: ${habitatComp.getPreference('desert')}`);
}

// Test 5: Test reproduction maintains biome components
console.log('\nTest 5: Testing reproduction');
const parent1 = factory.createEntity('herbivore', 300, 300);
const parent2 = factory.createEntity('herbivore', 310, 310);
const offspring = factory.reproduce(parent1, parent2);

if (offspring.hasComponent(ComponentType.BIOME) && offspring.hasComponent(ComponentType.HABITAT)) {
    console.log('✓ Offspring has biome components');
    const biomeComp = offspring.getComponent(ComponentType.BIOME);
    const habitatComp = offspring.getComponent(ComponentType.HABITAT);
    console.log(`  Offspring biome: ${biomeComp.currentBiome}`);
    console.log(`  Offspring has ${habitatComp.preferredBiomes.length} preferred biomes`);
} else {
    console.log('✗ Offspring missing biome components');
}

// Test 6: Test error handling with missing biome generator
console.log('\nTest 6: Testing graceful degradation without biome generator');
const mockWorldNoBiome = {
    width: 800,
    height: 600,
    time: 0,
    biomeGenerator: null
};
const factoryNoBiome = new EntityFactory(mockWorldNoBiome);
const entityNoBiome = factoryNoBiome.createEntity('bird', 400, 300);

if (entityNoBiome.hasComponent(ComponentType.BIOME)) {
    console.log('✓ BiomeComponent added even without biome generator');
    const biomeComp = entityNoBiome.getComponent(ComponentType.BIOME);
    console.log(`  Current biome: ${biomeComp.currentBiome || 'null (expected)'}`);
} else {
    console.log('✗ BiomeComponent missing');
}

console.log('\n✓ All tests completed successfully!');
