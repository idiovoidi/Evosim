import { ComponentType } from '../core/Entity.js';

export class MovementSystem {
    constructor(world) {
        this.world = world;
    }
    
    update(dt) {
        for (const entity of this.world.getActiveEntities()) {
            if (!entity.hasComponents(ComponentType.POSITION, ComponentType.VELOCITY)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const vel = entity.getComponent(ComponentType.VELOCITY);
            
            // Store old position for QuadTree update
            const oldX = pos.x;
            const oldY = pos.y;
            
            // Update position
            pos.set(pos.x + vel.dx, pos.y + vel.dy);
            
            // Wrap around world boundaries
            if (pos.x < 0) pos.x = this.world.width;
            if (pos.x > this.world.width) pos.x = 0;
            if (pos.y < 0) pos.y = this.world.height;
            if (pos.y > this.world.height) pos.y = 0;
            
            // Update QuadTree if position changed significantly
            // Note: QuadTree is rebuilt periodically, but we update for large movements
            const dx = pos.x - oldX;
            const dy = pos.y - oldY;
            const distSq = dx * dx + dy * dy;
            
            // Only update QuadTree for significant movements (> 10 pixels)
            // This reduces overhead while keeping spatial queries accurate
            if (distSq > 100) {
                this.world.quadTree.remove(entity);
                this.world.quadTree.insert(entity, pos);
            }
        }
    }
}
