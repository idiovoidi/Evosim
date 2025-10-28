import { BiomeGenerator } from './BiomeGenerator.js';
import { EntityFactory } from './EntityFactory.js';
import { EntityPool } from './EntityPool.js';
import { SaveSystem } from './SaveSystem.js';
import { QuadTree } from './QuadTree.js';
import { BehaviorSystem } from '../systems/BehaviorSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { ReproductionSystem } from '../systems/ReproductionSystem.js';
import { BiomeEffectSystem } from '../systems/BiomeEffectSystem.js';
import { ComponentType } from './Entity.js';
import { PerformanceMonitor } from '../ui/PerformanceMonitor.js';
import { AdaptiveQualityManager } from '../utils/AdaptiveQualityManager.js';
import { EcosystemEventDetector } from '../systems/EcosystemEventDetector.js';

export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.biomeGenerator = new BiomeGenerator(width, height);
        this.factory = new EntityFactory(this);
        this.pool = new EntityPool(this);
        this.saveSystem = new SaveSystem(this);
        
        // Initialize QuadTree for spatial partitioning
        this.quadTree = new QuadTree(
            { x: 0, y: 0, width, height },
            10,  // maxEntities per node
            5    // maxDepth
        );
        
        // Pre-allocate entity pools
        this.pool.preAllocate();
        
        // Initialize performance monitor
        this.performanceMonitor = new PerformanceMonitor();
        
        // Initialize adaptive quality manager (will be set up after renderer is created)
        this.adaptiveQualityManager = null;
        
        // Initialize ecosystem event detector (will be set up after notification manager is created)
        this.ecosystemEventDetector = null;
        
        // Quality settings (set by AdaptiveQualityManager)
        this.qualitySettings = null;
        
        // Reduced update frequency flag (set by AdaptiveQualityManager)
        this.reducedUpdateFrequency = false;
        this.updateSkipCounter = 0;
        
        // Initialize systems
        this.systems = [
            new BiomeEffectSystem(this),
            new BehaviorSystem(this),
            new MovementSystem(this),
            new HealthSystem(this),
            new ReproductionSystem(this)
        ];
        
        // World state
        this.time = 0;
        this.mousePos = { x: 0, y: 0 };
        this.selectedEntity = null;
        this.hoveredEntity = null;
        
        // QuadTree rebuild tracking
        this.lastRebuildTime = 0;
        this.rebuildInterval = 5.0; // Rebuild every 5 seconds
        
        // Configuration
        this.config = {
            initialHerbivores: 20,
            initialPredators: 10,
            initialPlants: 60,
            initialFish: 15,
            initialBirds: 8
        };
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.biomeGenerator.resize(width, height);
        
        // Recreate QuadTree with new bounds
        this.quadTree = new QuadTree(
            { x: 0, y: 0, width, height },
            10,  // maxEntities per node
            5    // maxDepth
        );
        
        // Rebuild with current entities
        this.quadTree.rebuild(this.entities);
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        
        // Add to QuadTree if entity has position
        if (entity.hasComponent(ComponentType.POSITION)) {
            const pos = entity.getComponent(ComponentType.POSITION);
            this.quadTree.insert(entity, pos);
        }
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            // Remove from QuadTree
            this.quadTree.remove(entity);
        }
    }
    
    getActiveEntities() {
        return this.entities.filter(e => e.active);
    }
    
    getEntitiesBySpecies(species) {
        return this.entities.filter(e => 
            e.active && 
            e.hasComponent(ComponentType.STATS) && 
            e.getComponent(ComponentType.STATS).species === species
        );
    }
    
    getNearbyEntities(position, radius, filter = null) {
        try {
            // Use QuadTree for efficient spatial query
            const entities = this.quadTree.queryRadius(position, radius);
            const nearby = [];
            
            for (const entity of entities) {
                if (!entity.active || !entity.hasComponent(ComponentType.POSITION)) continue;
                
                const pos = entity.getComponent(ComponentType.POSITION);
                const dx = pos.x - position.x;
                const dy = pos.y - position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (!filter || filter(entity)) {
                    nearby.push({ entity, distance });
                }
            }
            
            return nearby.sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('[World] getNearbyEntities error, falling back to linear search:', error);
            
            // Fallback to linear search if QuadTree fails
            const nearby = [];
            const radiusSq = radius * radius;
            
            for (const entity of this.entities) {
                if (!entity.active || !entity.hasComponent(ComponentType.POSITION)) continue;
                
                const pos = entity.getComponent(ComponentType.POSITION);
                const dx = pos.x - position.x;
                const dy = pos.y - position.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq <= radiusSq) {
                    if (!filter || filter(entity)) {
                        nearby.push({ entity, distance: Math.sqrt(distSq) });
                    }
                }
            }
            
            return nearby.sort((a, b) => a.distance - b.distance);
        }
    }
    
    getTerrainAt(x, y) {
        // Return biome ID instead of terrain type
        const biome = this.biomeGenerator.getBiomeAt(x, y);
        return biome.id;
    }
    
    getBiomeAt(x, y) {
        // Return full BiomeType object
        return this.biomeGenerator.getBiomeAt(x, y);
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    spawnInitialEntities() {
        // Spawn herbivores
        for (let i = 0; i < this.config.initialHerbivores; i++) {
            this.spawnEntityOnValidTerrain('herbivore', ['grassland', 'forest']);
        }
        
        // Spawn predators
        for (let i = 0; i < this.config.initialPredators; i++) {
            this.spawnEntityOnValidTerrain('predator', ['grassland', 'forest', 'mountain']);
        }
        
        // Spawn plants
        for (let i = 0; i < this.config.initialPlants; i++) {
            this.spawnEntityOnValidTerrain('plant', ['grassland', 'forest']);
        }
        
        // Spawn fish
        for (let i = 0; i < this.config.initialFish; i++) {
            this.spawnEntityOnValidTerrain('fish', ['water', 'deep_water']);
        }
        
        // Spawn birds
        for (let i = 0; i < this.config.initialBirds; i++) {
            this.spawnEntityOnValidTerrain('bird', ['grassland', 'forest', 'mountain']);
        }
    }
    
    spawnEntityOnValidTerrain(species, validBiomes) {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const biomeId = this.getTerrainAt(x, y);
            
            if (validBiomes.includes(biomeId)) {
                // For plants, check biome plant density
                if (species === 'plant') {
                    const biome = this.getBiomeAt(x, y);
                    if (biome) {
                        // Prevent plant spawning in water, deep_water, and snow biomes
                        if (biome.plantDensity === 0.0) {
                            attempts++;
                            continue;
                        }
                        
                        // Apply density modifier as probability check
                        // Higher density = higher chance to spawn
                        if (Math.random() > biome.plantDensity / 2.5) {
                            attempts++;
                            continue;
                        }
                    }
                }
                
                const entity = this.pool.acquire(species, x, y);
                this.addEntity(entity);
                return entity;
            }
            
            attempts++;
        }
        
        // Fallback: spawn anywhere (but still respect plant density for plants)
        if (species === 'plant') {
            // Try to find a valid location with non-zero plant density
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const biome = this.getBiomeAt(x, y);
                
                if (biome && biome.plantDensity > 0) {
                    const entity = this.pool.acquire(species, x, y);
                    this.addEntity(entity);
                    return entity;
                }
            }
        }
        
        // Final fallback: spawn anywhere
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const entity = this.pool.acquire(species, x, y);
        this.addEntity(entity);
        return entity;
    }
    
    update(dt) {
        // Begin performance monitoring
        this.performanceMonitor.beginFrame();
        
        this.time += dt;
        
        // Update all systems with timing
        this.performanceMonitor.beginSection('update');
        
        // Check if we should skip updates due to reduced update frequency
        let shouldUpdate = true;
        if (this.reducedUpdateFrequency) {
            // Update every other frame when FPS is low
            this.updateSkipCounter++;
            if (this.updateSkipCounter % 2 === 0) {
                shouldUpdate = false;
            }
        }
        
        if (shouldUpdate) {
            for (const system of this.systems) {
                system.update(dt);
            }
        }
        
        this.performanceMonitor.endSection('update');
        
        // Remove dead entities
        const beforeCount = this.entities.length;
        this.entities = this.entities.filter(e => e.active);
        const afterCount = this.entities.length;
        
        // If entities were removed, clean up QuadTree
        if (beforeCount !== afterCount) {
            // Note: Individual removals are handled in removeEntity()
            // This is just a safety check for entities marked inactive
            for (let i = 0; i < beforeCount - afterCount; i++) {
                // QuadTree will be rebuilt periodically anyway
            }
        }
        
        // Periodic QuadTree rebuild for rebalancing
        if (this.time - this.lastRebuildTime >= this.rebuildInterval) {
            this.quadTree.rebuild(this.entities);
            this.lastRebuildTime = this.time;
        }
        
        // Update entity counts for performance monitor
        const stats = this.getStats();
        this.performanceMonitor.updateEntityCounts({
            herbivore: stats.herbivores,
            predator: stats.predators,
            plant: stats.plants,
            fish: stats.fish,
            bird: stats.birds
        });
        
        // Update adaptive quality manager if available
        if (this.adaptiveQualityManager) {
            this.adaptiveQualityManager.update(this.performanceMonitor.fps);
        }
        
        // Update ecosystem event detector if available
        if (this.ecosystemEventDetector) {
            this.ecosystemEventDetector.update(dt);
        }
    }
    
    reset() {
        this.entities = [];
        this.time = 0;
        this.selectedEntity = null;
        this.lastRebuildTime = 0;
        this.biomeGenerator.regenerate();
        
        // Clear QuadTree
        this.quadTree.clear();
        
        // Clear and re-allocate pools
        this.pool.clear();
        this.pool.preAllocate();
        
        // Reset ecosystem event detector if available
        if (this.ecosystemEventDetector) {
            this.ecosystemEventDetector.reset();
        }
    }
    
    getStats() {
        return {
            herbivores: this.getEntitiesBySpecies('herbivore').length,
            predators: this.getEntitiesBySpecies('predator').length,
            plants: this.getEntitiesBySpecies('plant').length,
            fish: this.getEntitiesBySpecies('fish').length,
            birds: this.getEntitiesBySpecies('bird').length,
            total: this.entities.filter(e => e.active).length,
            time: this.time
        };
    }
}
