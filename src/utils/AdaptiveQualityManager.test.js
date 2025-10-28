/**
 * Simple test to verify AdaptiveQualityManager functionality
 * Run this in the browser console to test the quality manager
 */

import { AdaptiveQualityManager, QUALITY_PRESETS } from './AdaptiveQualityManager.js';

// Mock world and renderer
const mockWorld = {
    qualitySettings: null
};

const mockRenderer = {
    visualIndicators: {
        setEnabled: (enabled) => console.log(`Visual indicators: ${enabled}`)
    },
    setLODEnabled: (enabled) => console.log(`LOD enabled: ${enabled}`),
    setLODDistance: (distance) => console.log(`LOD distance: ${distance}`),
    cullingMargin: 50
};

// Create quality manager
const qm = new AdaptiveQualityManager(mockWorld, mockRenderer);

console.log('=== AdaptiveQualityManager Test ===');
console.log('Initial quality:', qm.getQualityLevel());
console.log('Initial settings:', qm.getQualitySettings());

// Test manual quality changes
console.log('\n--- Testing manual quality changes ---');
qm.setQualityLevel('MEDIUM', true);
console.log('After setting to MEDIUM:', qm.getQualityLevel());

qm.setQualityLevel('LOW', true);
console.log('After setting to LOW:', qm.getQualityLevel());

qm.setQualityLevel('HIGH', true);
console.log('After setting to HIGH:', qm.getQualityLevel());

// Test automatic quality adjustment
console.log('\n--- Testing automatic quality adjustment ---');
qm.resetToAuto();

// Simulate low FPS (should trigger downgrade after delay)
console.log('Simulating low FPS (25)...');
for (let i = 0; i < 30; i++) {
    qm.update(25);
}
console.log('Quality after low FPS:', qm.getQualityLevel());

// Simulate high FPS (should trigger upgrade after delay)
console.log('Simulating high FPS (60)...');
for (let i = 0; i < 30; i++) {
    qm.update(60);
}
console.log('Quality after high FPS:', qm.getQualityLevel());

// Test stats
console.log('\n--- Quality Manager Stats ---');
console.log(qm.getStats());

console.log('\n=== Test Complete ===');
