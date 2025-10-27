import { ComponentType } from '../core/Entity.js';

export class Renderer {
    constructor(ctx, world) {
        this.ctx = ctx;
        this.world = world;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0
        };
    }
    
    setZoom(zoom) {
        this.camera.zoom = zoom;
    }
    
    render() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        
        // Apply camera transform
        ctx.translate(this.camera.x, this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        
        // Render terrain
        this.renderTerrain();
        
        // Sort entities by layer
        const entities = this.world.getActiveEntities()
            .filter(e => e.hasComponent(ComponentType.APPEARANCE))
            .sort((a, b) => {
                const layerA = a.getComponent(ComponentType.APPEARANCE).layer;
                const layerB = b.getComponent(ComponentType.APPEARANCE).layer;
                return layerA - layerB;
            });
        
        // Render entities
        for (const entity of entities) {
            this.renderEntity(entity);
        }
        
        // Render effects
        this.renderEffects(entities);
        
        ctx.restore();
    }
    
    renderTerrain() {
        const terrain = this.world.terrain;
        const ctx = this.ctx;
        
        for (let y = 0; y < terrain.tilesY; y++) {
            for (let x = 0; x < terrain.tilesX; x++) {
                const tile = terrain.terrainMap[y][x];
                const color = terrain.getTerrainColor(tile.type);
                
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * terrain.tileSize,
                    y * terrain.tileSize,
                    terrain.tileSize,
                    terrain.tileSize
                );
            }
        }
    }
    
    renderEntity(entity) {
        const pos = entity.getComponent(ComponentType.POSITION);
        const appearance = entity.getComponent(ComponentType.APPEARANCE);
        const stats = entity.getComponent(ComponentType.STATS);
        const traits = entity.getComponent(ComponentType.TRAITS);
        
        if (!appearance.visible) return;
        
        const ctx = this.ctx;
        const size = 24 * appearance.size * traits.size;
        
        // Draw emoji
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(appearance.emoji, pos.x, pos.y);
        
        // Draw health bar
        if (stats) {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = stats.energy / stats.maxEnergy;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(pos.x - barWidth/2, pos.y - size/2 - 8, barWidth, barHeight);
            
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : 
                           healthPercent > 0.25 ? '#FFC107' : '#f44336';
            ctx.fillRect(pos.x - barWidth/2, pos.y - size/2 - 8, barWidth * healthPercent, barHeight);
        }
        
        // Highlight selected entity
        if (entity === this.world.selectedEntity) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    renderEffects(entities) {
        const ctx = this.ctx;
        
        for (const entity of entities) {
            const status = entity.getComponent(ComponentType.STATUS);
            if (!status || status.showingHeart <= 0) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            
            // Draw heart effect
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💕', pos.x, pos.y - 30);
            
            status.showingHeart -= 0.016; // Decrease over time
        }
    }
}
