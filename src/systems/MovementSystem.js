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
            
            // Update position
            pos.set(pos.x + vel.dx, pos.y + vel.dy);
            
            // Wrap around world boundaries
            if (pos.x < 0) pos.x = this.world.width;
            if (pos.x > this.world.width) pos.x = 0;
            if (pos.y < 0) pos.y = this.world.height;
            if (pos.y > this.world.height) pos.y = 0;
        }
    }
}
