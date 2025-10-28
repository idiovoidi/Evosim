import { TerrainGenerator } from './TerrainGenerator.js';
import { EntityFactory } from './EntityFactory.js';
import { EntityPool } from './EntityPool.js';
import { SaveSystem } from './SaveSystem.js';
import { QuadTree } from './QuadTree.js';
import { BehaviorSystem } from '../systems/BehaviorSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { ReproductionSystem } from '../systems/ReproductionSystem.js';
import { ComponentType } from './Entity.js';
import { PerformanceMonitor } from '../ui/PerformanceMonitor.js';

export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.terrain = new TerrainGenerator(width, height);
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
        
        // Initialize systems
        this.systems = [
            new BehaviorSystem(this),
            new MovementSystem(this),
            new HealthSystem(this),
            new ReproductionSystem(this)
        ];
        
        // World state
        this.time = 0;
        this.mousePos = { x: 0, y: 0 };
        this.selectedEntity = null;
        
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
        this.terrain.resize(width, height);
        
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
        return this.terrain.getTerrainAt(x, y);
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    spawnInitialEntities() {
        // Spawn herbivores
        for (let i = 0; i < this.config.initialHerbivores; i++) {
            this.spawnEntityOnValidTerrain('herbivore', ['grass', 'forest']);
        }
        
        // Spawn predators
        for (let i = 0; i < this.config.initialPredators; i++) {
            this.spawnEntityOnValidTerrain('predator', ['grass', 'forest', 'mountain']);
        }
        
        // Spawn plants
        for (let i = 0; i < this.config.initialPlants; i++) {
            this.spawnEntityOnValidTerrain('plant', ['grass', 'forest']);
        }
        
        // Spawn fish
        for (let i = 0; i < this.config.initialFish; i++) {
            this.spawnEntityOnValidTerrain('fish', ['water', 'deep_water']);
        }
        
        // Spawn birds
        for (let i = 0; i < this.config.initialBirds; i++) {
            this.spawnEntityOnValidTerrain('bird', ['grass', 'forest', 'mountain']);
        }
    }
    
    spawnEntityOnValidTerrain(species, validTerrains) {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const terrain = this.getTerrainAt(x, y);
            
            if (validTerrains.includes(terrain)) {
                const entity = this.pool.acquire(species, x, y);
                this.addEntity(entity);
                return entity;
            }
            
            attempts++;
        }
        
        // Fallback: spawn anywhere
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
        for (const system of this.systems) {
            system.update(dt);
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
    }
    
    reset() {
        this.entities = [];
        this.time = 0;
        this.selectedEntity = null;
        this.lastRebuildTime = 0;
        this.terrain.regenerate();
        
        // Clear QuadTree
        this.quadTree.clear();
        
        // Clear and re-allocate pools
        this.pool.clear();
        this.pool.preAllocate();
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
