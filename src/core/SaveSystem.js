import { ComponentType } from './Entity.js';

export class SaveSystem {
    constructor(world) {
        this.world = world;
        this.saveKey = 'ecosystem-simulation-save';
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
    }
    
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.save(true);
        }, this.autoSaveInterval);
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    save(isAutoSave = false) {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                time: this.world.time,
                entities: this.serializeEntities(),
                config: this.world.config
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            
            if (!isAutoSave) {
                console.log('Game saved successfully');
                this.showNotification('💾 Game Saved!');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save:', error);
            this.showNotification('❌ Save Failed', true);
            return false;
        }
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.saveKey);
            if (!data) return false;
            
            const saveData = JSON.parse(data);
            
            // Clear current world
            this.world.entities = [];
            
            // Restore time
            this.world.time = saveData.time;
            
            // Restore entities
            this.deserializeEntities(saveData.entities);
            
            console.log('Game loaded successfully');
            this.showNotification('📂 Game Loaded!');
            
            return true;
        } catch (error) {
            console.error('Failed to load:', error);
            this.showNotification('❌ Load Failed', true);
            return false;
        }
    }
    
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    getSaveInfo() {
        try {
            const data = localStorage.getItem(this.saveKey);
            if (!data) return null;
            
            const saveData = JSON.parse(data);
            const date = new Date(saveData.timestamp);
            
            return {
                timestamp: saveData.timestamp,
                date: date.toLocaleString(),
                time: Math.floor(saveData.time),
                entityCount: saveData.entities.length
            };
        } catch (error) {
            return null;
        }
    }
    
    deleteSave() {
        localStorage.removeItem(this.saveKey);
        this.showNotification('🗑️ Save Deleted');
    }
    
    serializeEntities() {
        return this.world.entities
            .filter(e => e.active)
            .map(entity => {
                const data = { components: {} };
                
                // Position
                if (entity.hasComponent(ComponentType.POSITION)) {
                    const pos = entity.getComponent(ComponentType.POSITION);
                    data.components.position = { x: pos.x, y: pos.y };
                }
                
                // Velocity
                if (entity.hasComponent(ComponentType.VELOCITY)) {
                    const vel = entity.getComponent(ComponentType.VELOCITY);
                    data.components.velocity = { dx: vel.dx, dy: vel.dy };
                }
                
                // Stats
                if (entity.hasComponent(ComponentType.STATS)) {
                    const stats = entity.getComponent(ComponentType.STATS);
                    data.components.stats = {
                        species: stats.species,
                        energy: stats.energy,
                        maxEnergy: stats.maxEnergy,
                        age: stats.age,
                        reproductionCooldown: stats.reproductionCooldown
                    };
                }
                
                // Genetics
                if (entity.hasComponent(ComponentType.GENETICS)) {
                    const genetics = entity.getComponent(ComponentType.GENETICS);
                    data.components.genetics = { genes: genetics.genes };
                }
                
                return data;
            });
    }
    
    deserializeEntities(entitiesData) {
        for (const data of entitiesData) {
            const { components } = data;
            
            if (components.stats && components.position) {
                const genetics = components.genetics ? 
                    { genes: components.genetics.genes } : null;
                
                const entity = this.world.factory.createEntity(
                    components.stats.species,
                    components.position.x,
                    components.position.y,
                    genetics
                );
                
                // Restore stats
                const stats = entity.getComponent(ComponentType.STATS);
                stats.energy = components.stats.energy;
                stats.age = components.stats.age;
                stats.reproductionCooldown = components.stats.reproductionCooldown || 0;
                
                // Restore velocity
                if (components.velocity) {
                    const vel = entity.getComponent(ComponentType.VELOCITY);
                    vel.dx = components.velocity.dx;
                    vel.dy = components.velocity.dy;
                }
                
                this.world.addEntity(entity);
            }
        }
    }
    
    showNotification(message, isError = false) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'save-notification' + (isError ? ' error' : '');
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}
