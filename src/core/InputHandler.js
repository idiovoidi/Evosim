import { ComponentType } from './Entity.js';

export class InputHandler {
    constructor(canvas, world) {
        this.canvas = canvas;
        this.world = world;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.world.mousePos = { x, y };
        
        // Find entity at hover position
        this.updateHoveredEntity(x, y);
    }
    
    /**
     * Update the hovered entity based on mouse position
     * @param {number} x - Mouse x position
     * @param {number} y - Mouse y position
     */
    updateHoveredEntity(x, y) {
        let closestEntity = null;
        let closestDist = 30; // Max hover distance
        
        for (const entity of this.world.getActiveEntities()) {
            if (!entity.hasComponent(ComponentType.POSITION)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestEntity = entity;
            }
        }
        
        this.world.hoveredEntity = closestEntity;
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find entity at click position
        let closestEntity = null;
        let closestDist = 30; // Max click distance
        
        for (const entity of this.world.getActiveEntities()) {
            if (!entity.hasComponent(ComponentType.POSITION)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestEntity = entity;
            }
        }
        
        this.world.selectedEntity = closestEntity;
    }
}
