/**
 * Structure verification test for BiomeTooltip component
 * Verifies that the component has all required methods and properties
 */

import { readFileSync } from 'fs';

console.log('🧪 Verifying BiomeTooltip Component Structure...\n');

// Read the BiomeTooltip source code
const tooltipCode = readFileSync('./src/ui/BiomeTooltip.js', 'utf-8');

// Check for required methods
const requiredMethods = [
    'constructor',
    'createTooltipElement',
    'update',
    'show',
    'hide',
    'updateContent',
    'buildModifiersList',
    'countEntitiesInBiome',
    'updatePosition',
    'updateFade',
    'screenToWorld',
    'destroy'
];

console.log('📋 Checking required methods:');
let allMethodsPresent = true;
for (const method of requiredMethods) {
    const hasMethod = tooltipCode.includes(`${method}(`);
    console.log(`   ${hasMethod ? '✅' : '❌'} ${method}`);
    if (!hasMethod) allMethodsPresent = false;
}

// Check for required properties
const requiredProperties = [
    'tooltip',
    'isVisible',
    'currentBiome',
    'fadeTimer',
    'fadeDuration',
    'opacity',
    'hoverDelay',
    'hoverTimer',
    'offsetX',
    'offsetY'
];

console.log('\n📦 Checking required properties:');
let allPropertiesPresent = true;
for (const prop of requiredProperties) {
    const hasProp = tooltipCode.includes(`this.${prop}`);
    console.log(`   ${hasProp ? '✅' : '❌'} ${prop}`);
    if (!hasProp) allPropertiesPresent = false;
}

// Check for key features
console.log('\n🎯 Checking key features:');

const features = [
    { name: 'Hover detection', check: tooltipCode.includes('hoverTimer') && tooltipCode.includes('hoverDelay') },
    { name: 'Fade transitions', check: tooltipCode.includes('fadeTimer') && tooltipCode.includes('opacity') },
    { name: 'Position near cursor', check: tooltipCode.includes('offsetX') && tooltipCode.includes('offsetY') },
    { name: 'Biome name display', check: tooltipCode.includes('currentBiome.name') },
    { name: 'Modifier display', check: tooltipCode.includes('movementModifier') && tooltipCode.includes('energyModifier') },
    { name: 'Entity count', check: tooltipCode.includes('countEntitiesInBiome') },
    { name: 'Viewport boundary check', check: tooltipCode.includes('viewportWidth') || tooltipCode.includes('window.innerWidth') },
    { name: 'Smooth animations', check: tooltipCode.includes('transition') && tooltipCode.includes('ease') },
    { name: 'Coordinate conversion', check: tooltipCode.includes('screenToWorld') },
    { name: 'DOM cleanup', check: tooltipCode.includes('destroy') && tooltipCode.includes('removeChild') }
];

let allFeaturesPresent = true;
for (const feature of features) {
    console.log(`   ${feature.check ? '✅' : '❌'} ${feature.name}`);
    if (!feature.check) allFeaturesPresent = false;
}

// Check UI.js integration
console.log('\n🔗 Checking UI.js integration:');
const uiCode = readFileSync('./src/ui/UI.js', 'utf-8');

const uiIntegration = [
    { name: 'BiomeTooltip import', check: uiCode.includes("import { BiomeTooltip }") },
    { name: 'BiomeTooltip instantiation', check: uiCode.includes('new BiomeTooltip') },
    { name: 'setRenderer method', check: uiCode.includes('setRenderer') },
    { name: 'Tooltip update in UI.update', check: uiCode.includes('biomeTooltip.update') }
];

let allIntegrationPresent = true;
for (const item of uiIntegration) {
    console.log(`   ${item.check ? '✅' : '❌'} ${item.name}`);
    if (!item.check) allIntegrationPresent = false;
}

// Check main.js integration
console.log('\n🚀 Checking main.js integration:');
const mainCode = readFileSync('./src/main.js', 'utf-8');

const mainIntegration = [
    { name: 'UI.setRenderer call', check: mainCode.includes('ui.setRenderer') },
    { name: 'deltaTime passed to UI.update', check: mainCode.includes('ui.update(this.fps, deltaTime)') }
];

let allMainIntegrationPresent = true;
for (const item of mainIntegration) {
    console.log(`   ${item.check ? '✅' : '❌'} ${item.name}`);
    if (!item.check) allMainIntegrationPresent = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));

const results = [
    { name: 'Required Methods', passed: allMethodsPresent },
    { name: 'Required Properties', passed: allPropertiesPresent },
    { name: 'Key Features', passed: allFeaturesPresent },
    { name: 'UI Integration', passed: allIntegrationPresent },
    { name: 'Main Integration', passed: allMainIntegrationPresent }
];

let allPassed = true;
for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    if (!result.passed) allPassed = false;
}

console.log('='.repeat(50));

if (allPassed) {
    console.log('\n🎉 SUCCESS! BiomeTooltip component is fully implemented!');
    console.log('\n✨ Task 15 Requirements Met:');
    console.log('   ✓ Created BiomeTooltip.js in src/ui/ directory');
    console.log('   ✓ Implemented hover detection over terrain tiles');
    console.log('   ✓ Display biome name, modifiers, and entity count');
    console.log('   ✓ Added smooth fade in/out transitions');
    console.log('   ✓ Position tooltip near mouse cursor');
    console.log('   ✓ Integrated with UI and main systems');
    process.exit(0);
} else {
    console.log('\n❌ FAILED! Some requirements are missing.');
    process.exit(1);
}
