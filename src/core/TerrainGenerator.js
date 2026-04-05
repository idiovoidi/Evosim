import { createNoise2D } from 'simplex-noise';
import { initializeGridConfig, resizeGridConfig } from './GridConfig.js';

export class TerrainGenerator {
    constructor(width, height) {
        const config = initializeGridConfig(width, height);
        Object.assign(this, config);
        
        this.noise = createNoise2D();
        this.terrainMap = [];
        
        this.generate();
    }
    
    resize(width, height) {
        resizeGridConfig(this, width, height);
        this.generate();
    }
    
    generate() {
        this.terrainMap = [];
        const scale = 0.05;
        
        for (let y = 0; y < this.tilesY; y++) {
            const row = [];
            for (let x = 0; x < this.tilesX; x++) {
                // Generate multiple octaves of noise
                const value1 = this.noise(x * scale, y * scale);
                const value2 = this.noise(x * scale * 2, y * scale * 2) * 0.5;
                const value3 = this.noise(x * scale * 4, y * scale * 4) * 0.25;
                
                const combined = (value1 + value2 + value3) / 1.75;
                const normalized = (combined + 1) / 2; // 0 to 1
                
                row.push({
                    type: this.getTerrainType(normalized),
                    value: normalized
                });
            }
            this.terrainMap.push(row);
        }
    }
    
    getTerrainType(value) {
        if (value < 0.3) return 'deep_water';
        if (value < 0.4) return 'water';
        if (value < 0.5) return 'sand';
        if (value < 0.7) return 'grass';
        if (value < 0.8) return 'forest';
        if (value < 0.9) return 'mountain';
        return 'snow';
    }
    
    getTerrainColor(type) {
        const colors = {
            deep_water: '#1a4d7a',
            water: '#2e7db5',
            sand: '#ddc77d',
            grass: '#6b9e4d',
            forest: '#3d6b2e',
            mountain: '#8b7355',
            snow: '#f0f0f0'
        };
        return colors[type] || '#6b9e4d';
    }
    
    getTerrainAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.tilesX || tileY < 0 || tileY >= this.tilesY) {
            return 'grass';
        }
        
        return this.terrainMap[tileY][tileX].type;
    }
    
    regenerate() {
        this.noise = createNoise2D();
        this.generate();
    }
}
