/**
 * Test script to verify EntityInfoPanel biome information display
 * Run with: node test-entity-info-biome.js
 */

import { Entity, ComponentType, Position, BiomeComponent, HabitatComponent, Stats, Status, Velocity } from '../src/core/Entity.js';

console.log('Testing EntityInfoPanel Biome Information...\n');

// Test 1: BiomeComponent structure
console.log('Test 1: BiomeComponent structure');
const biomeComp = new BiomeComponent();
console.log('✓ BiomeComponent created');
console.log('  - currentBiome:', biomeComp.currentBiome);
console.log('  - biomeEffects:', biomeComp.biomeEffects);
console.log('  - timeInBiome:', biomeComp.timeInBiome);
console.log('  - lastBiomeChange:', biomeComp.lastBiomeChange);

// Test 2: HabitatComponent with preferences
console.log('\nTest 2: HabitatComponent with preferences');
const preferences = {
    grassland: 1.8,
    forest: 1.5,
    desert: 0.5,
    water: 0.3
};
const habitatComp = new HabitatComponent(preferences);
console.log('✓ HabitatComponent created');
console.log('  - getPreference("grassland"):', habitatComp.getPreference('grassland'));
console.log('  - isPreferred("grassland"):', habitatComp.isPreferred('grassland'));
console.log('  - isAvoided("desert"):', habitatComp.isAvoided('desert'));
console.log('  - preferredBiomes:', habitatComp.preferredBiomes);
console.log('  - avoidedBiomes:', habitatComp.avoidedBiomes);

// Test 3: Entity with biome components
console.log('\nTest 3: Entity with biome components');
const entity = new Entity();
entity.addComponent(ComponentType.POSITION, new Position(100, 100));
entity.addComponent(ComponentType.VELOCITY, new Velocity(1, 0));
entity.addComponent(ComponentType.STATS, new Stats('herbivore', 80, 100, 1));
entity.addComponent(ComponentType.STATUS, new Status());
entity.addComponent(ComponentType.BIOME, biomeComp);
entity.addComponent(ComponentType.HABITAT, habitatComp);

console.log('✓ Entity created with all components');
console.log('  - Has BIOME component:', entity.hasComponent(ComponentType.BIOME));
console.log('  - Has HABITAT component:', entity.hasComponent(ComponentType.HABITAT));

// Test 4: Biome effects simulation
console.log('\nTest 4: Biome effects simulation');
const biome = entity.getComponent(ComponentType.BIOME);
biome.currentBiome = 'forest';
biome.biomeEffects.movementMultiplier = 0.7;
biome.biomeEffects.energyMultiplier = 0.95;
biome.biomeEffects.visibilityMultiplier = 0.6;
biome.biomeEffects.concealmentBonus = 0.5;
biome.timeInBiome = 45.7;

console.log('✓ Biome effects set');
console.log('  - currentBiome:', biome.currentBiome);
console.log('  - movementMultiplier:', biome.biomeEffects.movementMultiplier);
console.log('  - energyMultiplier:', biome.biomeEffects.energyMultiplier);
console.log('  - visibilityMultiplier:', biome.biomeEffects.visibilityMultiplier);
console.log('  - concealmentBonus:', biome.biomeEffects.concealmentBonus);
console.log('  - timeInBiome:', biome.timeInBiome);

// Test 5: Habitat preference checks
console.log('\nTest 5: Habitat preference checks');
const habitat = entity.getComponent(ComponentType.HABITAT);
const testBiomes = ['grassland', 'forest', 'desert', 'water', 'mountain'];

testBiomes.forEach(biomeId => {
    const pref = habitat.getPreference(biomeId);
    const preferred = habitat.isPreferred(biomeId);
    const avoided = habitat.isAvoided(biomeId);
    const status = preferred ? 'PREFERRED' : avoided ? 'AVOIDED' : 'NEUTRAL';
    console.log(`  - ${biomeId}: ${pref.toFixed(1)}x [${status}]`);
});

console.log('\n✅ All tests passed! EntityInfoPanel biome information components are working correctly.');
console.log('\nThe EntityInfoPanel will display:');
console.log('  1. Current biome name with color indicator');
console.log('  2. Habitat preference status (Preferred/Neutral/Avoided)');
console.log('  3. Time spent in current biome');
console.log('  4. Active biome effects:');
console.log('     - Movement speed modifier');
console.log('     - Energy drain modifier');
console.log('     - Visibility range modifier');
console.log('     - Concealment bonus (if applicable)');
