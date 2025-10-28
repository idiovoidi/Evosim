import { ComponentType } from '../core/Entity.js';

/**
 * DebugRenderer - Developer visualization tools for troubleshooting and optimization
 * Provides various debug views to visualize spatial partitioning, collision boundaries,
 * behavior states, and velocity vectors
 */
export class DebugRenderer {
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        
        // Debug mode state
        this.enabled = false;
        
        // Individual debug view toggles
        this.views = {
            quadtree: false,
            collision: false,
            behavior: false,
            velocity: false
        };
        
        // Behavior state colors for visualization
        this.behaviorColors = {
            'idle': '#888888',
            'wandering': '#4CAF50',
            'seeking_food': '#FFC107',
            'eating': '#8BC34A',
            'fleeing': '#f44336',
            'hunting': '#FF5722',
            'reproducing': '#E91E63',
            'dead': '#424242'
        };
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Setup keyboard shortcuts for debug mode
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key.toLowerCase()) {
                case 'd':
                    e.preventDefault();
                    this.toggleDebugMode();
                    break;
                case 'q':
                    if (this.enabled) {
                        e.preventDefault();
                        this.toggleView('quadtree');
                    }
                    break;
                case 'c':
                    if (this.enabled) {
                        e.preventDefault();
                        this.toggleView('collision');
                    }
                    break;
                case 'b':
                    if (this.enabled) {
                        e.preventDefault();
                        this.toggleView('behavior');
                    }
                    break;
                case 'v':
                    if (this.enabled) {
                        e.preventDefault();
                        this.toggleView('velocity');
                    }
                    break;
            }
        });
    }
    
    /**
     * Toggle debug mode on/off
     */
    toggleDebugMode() {
        this.enabled = !this.enabled;
        
        // Show notification
        const message = this.enabled 
            ? 'Debug Mode: ON (Q=QuadTree, C=Collision, B=Behavior, V=Velocity)'
            : 'Debug Mode: OFF';
        
        console.log(`🔧 ${message}`);
        this.showNotification(message);
        
        // If disabling, turn off all views
        if (!this.enabled) {
            this.views.quadtree = false;
            this.views.collision = false;
            this.views.behavior = false;
            this.views.velocity = false;
        }
    }
    
    /**
     * Toggle a specific debug view
     * @param {string} viewName - Name of the view to toggle
     */
    toggleView(viewName) {
        if (!this.enabled) return;
        
        this.views[viewName] = !this.views[viewName];
        
        const status = this.views[viewName] ? 'ON' : 'OFF';
        const message = `${viewName.charAt(0).toUpperCase() + viewName.slice(1)} View: ${status}`;
        
        console.log(`🔧 ${message}`);
        this.showNotification(message);
    }
    
    /**
     * Show a temporary notification message
     * @param {string} message - Message to display
     */
    showNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('debug-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'debug-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);
        }
        
        // Update message and show
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Hide after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 2000);
    }
    
    /**
     * Main render method - called after normal rendering
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.enabled) return;
        
        // Render active debug views
        if (this.views.quadtree) {
            this.renderQuadtreeView(ctx);
        }
        
        if (this.views.collision) {
            this.renderCollisionView(ctx);
        }
        
        if (this.views.behavior) {
            this.renderBehaviorView(ctx);
        }
        
        if (this.views.velocity) {
            this.renderVelocityView(ctx);
        }
        
        // Render debug info overlay
        this.renderDebugInfo(ctx);
    }
    
    /**
     * Render QuadTree spatial partitioning grid
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderQuadtreeView(ctx) {
        ctx.save();
        
        // Render the quadtree structure recursively
        this.renderQuadtreeNode(ctx, this.world.quadTree.root);
        
        ctx.restore();
    }
    
    /**
     * Recursively render a quadtree node and its children
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {QuadTreeNode} node - Node to render
     */
    renderQuadtreeNode(ctx, node) {
        const { x, y, width, height } = node.bounds;
        
        // Color based on depth
        const depthColors = [
            'rgba(255, 0, 0, 0.3)',
            'rgba(255, 165, 0, 0.3)',
            'rgba(255, 255, 0, 0.3)',
            'rgba(0, 255, 0, 0.3)',
            'rgba(0, 0, 255, 0.3)',
            'rgba(128, 0, 128, 0.3)'
        ];
        
        const color = depthColors[node.depth % depthColors.length];
        
        // Draw node boundary
        ctx.strokeStyle = color.replace('0.3', '0.8');
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Fill if has entities
        if (node.entities.length > 0) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);
            
            // Draw entity count
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.entities.length.toString(), x + width / 2, y + height / 2);
        }
        
        // Render children recursively
        if (node.isSubdivided()) {
            for (const child of node.children) {
                this.renderQuadtreeNode(ctx, child);
            }
        }
    }
    
    /**
     * Render collision boundaries and sense ranges
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderCollisionView(ctx) {
        ctx.save();
        
        const entities = this.world.getActiveEntities();
        
        for (const entity of entities) {
            if (!entity.hasComponent(ComponentType.POSITION)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const traits = entity.getComponent(ComponentType.TRAITS);
            const appearance = entity.getComponent(ComponentType.APPEARANCE);
            
            // Calculate entity size
            const size = 24 * appearance.size * traits.size;
            
            // Draw collision boundary (entity bounds)
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw sense radius
            const senseRadius = 100 * traits.senseRadius;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, senseRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * Render entities color-coded by behavior state
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderBehaviorView(ctx) {
        ctx.save();
        
        const entities = this.world.getActiveEntities();
        
        for (const entity of entities) {
            if (!entity.hasComponents(ComponentType.POSITION, ComponentType.STATUS)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const status = entity.getComponent(ComponentType.STATUS);
            const traits = entity.getComponent(ComponentType.TRAITS);
            const appearance = entity.getComponent(ComponentType.APPEARANCE);
            
            // Calculate entity size
            const size = 24 * appearance.size * traits.size;
            
            // Get color for current behavior state
            const color = this.behaviorColors[status.state] || this.behaviorColors['idle'];
            
            // Draw colored circle around entity
            ctx.fillStyle = color.replace(')', ', 0.4)').replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size / 2 + 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw state label
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(status.state, pos.x, pos.y + size / 2 + 10);
        }
        
        ctx.restore();
    }
    
    /**
     * Render velocity vectors as arrows
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderVelocityView(ctx) {
        ctx.save();
        
        const entities = this.world.getActiveEntities();
        
        for (const entity of entities) {
            if (!entity.hasComponents(ComponentType.POSITION, ComponentType.VELOCITY)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const vel = entity.getComponent(ComponentType.VELOCITY);
            
            // Calculate velocity magnitude
            const speed = Math.sqrt(vel.dx * vel.dx + vel.dy * vel.dy);
            
            // Skip if not moving
            if (speed < 0.1) continue;
            
            // Scale arrow length based on speed
            const arrowLength = Math.min(speed * 10, 50);
            const endX = pos.x + (vel.dx / speed) * arrowLength;
            const endY = pos.y + (vel.dy / speed) * arrowLength;
            
            // Color based on speed (green = slow, red = fast)
            const speedPercent = Math.min(speed / vel.maxSpeed, 1);
            const red = Math.floor(speedPercent * 255);
            const green = Math.floor((1 - speedPercent) * 255);
            ctx.strokeStyle = `rgb(${red}, ${green}, 0)`;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 2;
            
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Draw arrowhead
            const angle = Math.atan2(vel.dy, vel.dx);
            const headLength = 8;
            
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * Render debug information overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderDebugInfo(ctx) {
        ctx.save();
        
        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 250, 120);
        
        // Draw title
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('DEBUG MODE', 20, 20);
        
        // Draw active views
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        let y = 45;
        
        ctx.fillText('Active Views:', 20, y);
        y += 20;
        
        const viewLabels = {
            quadtree: '[Q] QuadTree',
            collision: '[C] Collision',
            behavior: '[B] Behavior',
            velocity: '[V] Velocity'
        };
        
        for (const [key, label] of Object.entries(viewLabels)) {
            const status = this.views[key] ? '✓' : '✗';
            const color = this.views[key] ? '#00ff00' : '#888888';
            ctx.fillStyle = color;
            ctx.fillText(`${status} ${label}`, 30, y);
            y += 18;
        }
        
        ctx.restore();
    }
    
    /**
     * Check if debug mode is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Set debug mode state
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Set a specific debug view state
     * @param {string} viewName - Name of the view
     * @param {boolean} enabled - Whether the view should be enabled
     */
    setView(viewName, enabled) {
        if (this.views.hasOwnProperty(viewName)) {
            this.views[viewName] = enabled;
        }
    }
}
