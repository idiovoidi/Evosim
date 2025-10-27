import { TerrainGenerator } from './TerrainGenerator.js';
import { EntityFactory } from './EntityFactory.js';
import { BehaviorSystem } from '../systems/BehaviorSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { ReproductionSystem } from '../systems/ReproductionSystem.js';
import { ComponentType } from './Entity.js';

export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.terrain = new TerrainGenerator(width, height);
        this.factory = new EntityFactory(this);
        
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
    }
    
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
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
                const entity = this.factory.createEntity(species, x, y);
                this.addEntity(entity);
                return entity;
            }
            
            attempts++;
        }
        
        // Fallback: spawn anywhere
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const entity = this.factory.createEntity(species, x, y);
        this.addEntity(entity);
        return entity;
    }
    
    update(dt) {
        this.time += dt;
        
        // Update all systems
        for (const system of this.systems) {
            system.update(dt);
        }
        
        // Remove dead entities
        this.entities = this.entities.filter(e => e.active);
    }
    
    reset() {
        this.entities = [];
        this.time = 0;
        this.selectedEntity = null;
        this.terrain.regenerate();
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
