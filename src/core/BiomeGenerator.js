import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
import { BiomeType, BIOME_DEFINITIONS } from './BiomeConstants.js';
import { initializeGridConfig, resizeGridConfig } from './GridConfig.js';

/**
 * BiomeGenerator - Procedural biome generation using multi-layer noise
 * Generates diverse, realistic biomes with smooth transitions
 */
export class BiomeGenerator {
    constructor(width, height, seed = null) {
        const config = initializeGridConfig(width, height);
        Object.assign(this, config);
        
        // Seed for reproducibility
        this.seed = seed !== null ? seed : Math.random();
        
        // Initialize biome types from definitions
        this.biomes = this.initializeBiomes();
        
        // Create biome lookup map for fast access by ID
        this.biomeMap = [];
        this.biomeById = new Map();
        this.biomes.forEach(biome => {
            this.biomeById.set(biome.id, biome);
        });
        
        // Transition cache for smooth visual blending
        this.transitionCache = new Map();
        this.maxCacheSize = 1000;
        
        // Initialize noise generators with seeds
        this.initializeNoiseGenerators();
        
        // Generate the biome map
        this.generate();
    }
    
    /**
     * Initialize biome types from definitions
     */
    initializeBiomes() {
        return BIOME_DEFINITIONS.map(def => new BiomeType(def));
    }
    
    /**
     * Initialize multiple noise generators for different terrain features
     */
    initializeNoiseGenerators() {
        // Use alea for seeded random number generation
        const prng1 = alea(this.seed);
        const prng2 = alea(this.seed + 1);
        const prng3 = alea(this.seed + 2);
        
        // Create seeded noise generators
        this.elevationNoise = createNoise2D(prng1);
        this.moistureNoise = createNoise2D(prng2);
        this.temperatureNoise = createNoise2D(prng3);
    }
    
    /**
     * Resize the generator and regenerate biomes
     */
    resize(width, height) {
        resizeGridConfig(this, width, height);
        this.transitionCache.clear();
        this.generate();
    }
    
    /**
     * Generate the complete biome map using multi-layer noise
     */
    generate() {
        this.biomeMap = [];
        
        // Generate raw biome assignments
        const rawMap = this.generateRawBiomes();
        
        // Apply clustering and smoothing post-processing
        this.biomeMap = this.smoothBiomes(rawMap);
    }
    
    /**
     * Generate raw biome assignments based on noise values
     */
    generateRawBiomes() {
        const map = [];
        const elevationScale = 0.04;
        const moistureScale = 0.06;
        const temperatureScale = 0.05;
        
        for (let y = 0; y < this.tilesY; y++) {
            const row = [];
            for (let x = 0; x < this.tilesX; x++) {
                // Generate multiple octaves for each noise layer
                const elevation = this.getOctaveNoise(
                    this.elevationNoise, x, y, elevationScale, 3
                );
                const moisture = this.getOctaveNoise(
                    this.moistureNoise, x, y, moistureScale, 2
                );
                const temperature = this.getOctaveNoise(
                    this.temperatureNoise, x, y, temperatureScale, 2
                );
                
                // Combine noise values to determine biome
                const biome = this.assignBiome(elevation, moisture, temperature);
                
                row.push({
                    biome: biome,
                    elevation: elevation,
                    moisture: moisture,
                    temperature: temperature
                });
            }
            map.push(row);
        }
        
        return map;
    }
    
    /**
     * Generate multi-octave noise for more natural terrain
     */
    getOctaveNoise(noiseFunc, x, y, scale, octaves) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += noiseFunc(
                x * scale * frequency,
                y * scale * frequency
            ) * amplitude;
            
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        // Normalize to 0-1 range
        return (value / maxValue + 1) / 2;
    }
    
    /**
     * Assign biome based on elevation, moisture, and temperature
     */
    assignBiome(elevation, moisture, temperature) {
        // Primary biome assignment based on elevation
        // Water biomes (low elevation)
        if (elevation < 0.25) {
            return this.biomeById.get('deep_water');
        }
        if (elevation < 0.35) {
            return this.biomeById.get('water');
        }
        
        // Coastal/beach (low elevation, near water)
        if (elevation < 0.42) {
            return this.biomeById.get('sand');
        }
        
        // High elevation biomes
        if (elevation > 0.95) {
            return this.biomeById.get('snow');
        }
        if (elevation > 0.87) {
            return this.biomeById.get('mountain');
        }
        
        // Mid-elevation biomes - use moisture and temperature
        // Desert (hot and dry)
        if (moisture < 0.3 && temperature > 0.6) {
            return this.biomeById.get('desert');
        }
        
        // Savanna (moderate moisture, hot)
        if (moisture < 0.5 && temperature > 0.55) {
            return this.biomeById.get('savanna');
        }
        
        // Forest (high moisture)
        if (moisture > 0.6) {
            return this.biomeById.get('forest');
        }
        
        // Default to grassland
        return this.biomeById.get('grassland');
    }
    
    /**
     * Apply smoothing and clustering to create more realistic biome distributions
     */
    smoothBiomes(rawMap) {
        const smoothedMap = [];
        const smoothRadius = 1;
        
        for (let y = 0; y < this.tilesY; y++) {
            const row = [];
            for (let x = 0; x < this.tilesX; x++) {
                // Count neighboring biomes
                const biomeCounts = new Map();
                let totalWeight = 0;
                
                for (let dy = -smoothRadius; dy <= smoothRadius; dy++) {
                    for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < this.tilesX && ny >= 0 && ny < this.tilesY) {
                            const neighborBiome = rawMap[ny][nx].biome;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const weight = 1 / (1 + distance);
                            
                            const currentCount = biomeCounts.get(neighborBiome.id) || 0;
                            biomeCounts.set(neighborBiome.id, currentCount + weight);
                            totalWeight += weight;
                        }
                    }
                }
                
                // Find most common biome
                let maxCount = 0;
                let dominantBiomeId = rawMap[y][x].biome.id;
                
                for (const [biomeId, count] of biomeCounts.entries()) {
                    if (count > maxCount) {
                        maxCount = count;
                        dominantBiomeId = biomeId;
                    }
                }
                
                // Use dominant biome if it's significantly more common
                const dominantBiome = this.biomeById.get(dominantBiomeId);
                const originalBiome = rawMap[y][x].biome;
                
                // Check adjacency rules
                const finalBiome = this.respectAdjacencyRules(
                    dominantBiome,
                    originalBiome,
                    maxCount / totalWeight
                );
                
                row.push(finalBiome);
            }
            smoothedMap.push(row);
        }
        
        return smoothedMap;
    }
    
    /**
     * Respect biome adjacency rules for more realistic placement
     */
    respectAdjacencyRules(dominantBiome, originalBiome, dominanceRatio) {
        // If dominance is strong (>0.4), use dominant biome
        if (dominanceRatio > 0.4) {
            return dominantBiome;
        }
        
        // Otherwise keep original
        return originalBiome;
    }
    
    /**
     * Get biome at world coordinates with error handling
     */
    getBiomeAt(x, y) {
        try {
            // Bounds checking
            if (!this.isValidPosition(x, y)) {
                console.warn(`[BiomeGenerator] Invalid position: (${x}, ${y})`);
                return this.getDefaultBiome();
            }
            
            const tileX = Math.floor(x / this.tileSize);
            const tileY = Math.floor(y / this.tileSize);
            
            // Check tile bounds
            if (tileX < 0 || tileX >= this.tilesX || tileY < 0 || tileY >= this.tilesY) {
                return this.getDefaultBiome();
            }
            
            // Check if biome map is initialized
            if (!this.biomeMap[tileY] || !this.biomeMap[tileY][tileX]) {
                console.error(`[BiomeGenerator] Missing biome data at tile (${tileX}, ${tileY})`);
                return this.getDefaultBiome();
            }
            
            return this.biomeMap[tileY][tileX];
        } catch (error) {
            console.error('[BiomeGenerator] Error getting biome:', error);
            return this.getDefaultBiome();
        }
    }
    
    /**
     * Check if position is valid
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * Get default biome (grassland) for error cases
     */
    getDefaultBiome() {
        return this.biomeById.get('grassland') || this.biomes[0];
    }
    
    /**
     * Get biome transition data for smooth visual blending
     * Returns blend weights for nearby biomes within radius
     */
    getBiomeTransition(x, y, radius = 1) {
        // Create cache key
        const cacheKey = `${Math.floor(x)}_${Math.floor(y)}_${radius}`;
        
        // Check cache
        if (this.transitionCache.has(cacheKey)) {
            return this.transitionCache.get(cacheKey);
        }
        
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Collect nearby biomes with weights
        const biomeWeights = new Map();
        let totalWeight = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = tileX + dx;
                const ny = tileY + dy;
                
                if (nx >= 0 && nx < this.tilesX && ny >= 0 && ny < this.tilesY) {
                    const biome = this.biomeMap[ny][nx];
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const weight = 1 / (1 + distance);
                    
                    const currentWeight = biomeWeights.get(biome.id) || 0;
                    biomeWeights.set(biome.id, currentWeight + weight);
                    totalWeight += weight;
                }
            }
        }
        
        // Normalize weights
        const normalizedWeights = new Map();
        for (const [biomeId, weight] of biomeWeights.entries()) {
            normalizedWeights.set(biomeId, weight / totalWeight);
        }
        
        const transition = {
            weights: normalizedWeights,
            primaryBiome: this.getBiomeAt(x, y)
        };
        
        // Cache the result
        if (this.transitionCache.size >= this.maxCacheSize) {
            // Clear oldest entries (simple FIFO)
            const firstKey = this.transitionCache.keys().next().value;
            this.transitionCache.delete(firstKey);
        }
        this.transitionCache.set(cacheKey, transition);
        
        return transition;
    }
    
    /**
     * Regenerate biomes with a new seed
     */
    regenerate(newSeed = null) {
        this.seed = newSeed !== null ? newSeed : Math.random();
        this.initializeNoiseGenerators();
        this.transitionCache.clear();
        this.generate();
    }
    
    /**
     * Get biome color for rendering (backward compatibility)
     */
    getTerrainColor(biomeId) {
        const biome = this.biomeById.get(biomeId);
        return biome ? biome.color : '#6b9e4d';
    }
    
    /**
     * Get terrain type at position (backward compatibility)
     */
    getTerrainAt(x, y) {
        const biome = this.getBiomeAt(x, y);
        return biome.id;
    }
}
