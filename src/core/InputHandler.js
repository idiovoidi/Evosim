import { findClosestEntity } from './EntityFinder.js';

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
        this.world.hoveredEntity = findClosestEntity(this.world, x, y, 30);
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.world.selectedEntity = findClosestEntity(this.world, x, y, 30);
    }
}
