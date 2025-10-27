import { Entity, ComponentType, Position, Velocity, Appearance, Stats, Status, Genetics, Traits } from './Entity.js';

export class EntityFactory {
    constructor(world) {
        this.world = world;
        
        this.speciesConfig = {
            herbivore: {
                emoji: '🐰',
                color: '#96c896',
                maxEnergy: 200,
                initialEnergy: 150,
                layer: 2
            },
            predator: {
                emoji: '🦊',
                color: '#c89696',
                maxEnergy: 250,
                initialEnergy: 200,
                layer: 2
            },
            plant: {
                emoji: '🌿',
                color: '#649650',
                maxEnergy: 100,
                initialEnergy: 100,
                layer: 0
            },
            fish: {
                emoji: '🐟',
                color: '#5a9ed4',
                maxEnergy: 150,
                initialEnergy: 120,
                layer: 1
            },
            bird: {
                emoji: '🦅',
                color: '#8b7355',
                maxEnergy: 180,
                initialEnergy: 140,
                layer: 3
            }
        };
    }
    
    createEntity(species, x, y, genetics = null) {
        const config = this.speciesConfig[species];
        if (!config) {
            throw new Error(`Unknown species: ${species}`);
        }
        
        const entity = new Entity();
        
        // Position
        entity.addComponent(ComponentType.POSITION, new Position(x, y));
        
        // Velocity
        entity.addComponent(ComponentType.VELOCITY, new Velocity());
        
        // Appearance
        entity.addComponent(ComponentType.APPEARANCE, 
            new Appearance(config.emoji, config.color, 1.0, config.layer));
        
        // Stats
        entity.addComponent(ComponentType.STATS, 
            new Stats(species, config.initialEnergy, config.maxEnergy));
        
        // Status
        entity.addComponent(ComponentType.STATUS, new Status());
        
        // Genetics
        const geneComponent = genetics || new Genetics();
        entity.addComponent(ComponentType.GENETICS, geneComponent);
        
        // Traits (derived from genetics)
        entity.addComponent(ComponentType.TRAITS, new Traits(geneComponent));
        
        return entity;
    }
    
    reproduce(parent1, parent2) {
        const stats1 = parent1.getComponent(ComponentType.STATS);
        const pos1 = parent1.getComponent(ComponentType.POSITION);
        const genetics1 = parent1.getComponent(ComponentType.GENETICS);
        const genetics2 = parent2.getComponent(ComponentType.GENETICS);
        
        // Create offspring genetics
        const offspringGenetics = genetics1.crossover(genetics2, 0.1);
        
        // Spawn near parent
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        const x = Math.max(0, Math.min(this.world.width, pos1.x + offsetX));
        const y = Math.max(0, Math.min(this.world.height, pos1.y + offsetY));
        
        return this.createEntity(stats1.species, x, y, offspringGenetics);
    }
}
