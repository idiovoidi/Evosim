import { GrazingPressureGrid } from './GrazingPressureGrid.js';

export class ResourceDepletionSystem {
    constructor(world) {
        this.world = world;
        this.grazingGrid = new GrazingPressureGrid(world.width, world.height, 100);
        this.lastDecayTime = 0;
    }
    
    update(dt) {
        // Check if 5 seconds elapsed since lastDecayTime for pressure decay
        if (this.world.time - this.lastDecayTime >= 5.0) {
            this.grazingGrid.decayAll(0.1);
            this.lastDecayTime = this.world.time;
        }
    }
    
    getPlantSpawnModifier(x, y) {
        const pressure = this.grazingGrid.getPressure(x, y);
        
        if (pressure > 20) {
            return 0.2;  // 80% reduction
        } else if (pressure > 10) {
            return 0.5;  // 50% reduction
        }
        return 1.0;      // No reduction
    }
}
