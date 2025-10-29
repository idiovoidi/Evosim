import { ComponentType } from '../core/Entity.js';

/**
 * BiomeTooltip - Displays biome information when hovering over terrain
 * Shows biome name, modifiers, and entity count in the hovered tile
 */
export class BiomeTooltip {
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        
        // Create tooltip element
        this.tooltip = this.createTooltipElement();
        
        // Tooltip state
        this.isVisible = false;
        this.currentBiome = null;
        this.currentWaterSource = null;
        this.fadeTimer = 0;
        this.fadeDuration = 0.15; // 150ms fade
        this.opacity = 0;
        
        // Hover detection
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        this.hoverDelay = 0.3; // 300ms delay before showing
        this.hoverTimer = 0;
        
        // Position offset from cursor
        this.offsetX = 15;
        this.offsetY = 15;
    }
    
    /**
     * Create the tooltip DOM element
     */
    createTooltipElement() {
        const tooltip = document.createElement('div');
        tooltip.id = 'biome-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(20, 20, 20, 0.95);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 200px;
            opacity: 0;
            transition: opacity 0.15s ease-in-out;
            display: none;
        `;
        
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const camera = this.renderer.camera;
        const worldX = (screenX - camera.x) / camera.zoom;
        const worldY = (screenY - camera.y) / camera.zoom;
        return { x: worldX, y: worldY };
    }
    
    /**
     * Update tooltip based on mouse position
     */
    update(dt, mouseX, mouseY) {
        // Check if mouse position changed
        const mouseMoved = mouseX !== this.lastMouseX || mouseY !== this.lastMouseY;
        
        if (mouseMoved) {
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
            this.hoverTimer = 0;
        }
        
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(mouseX, mouseY);
        
        // Check if hovering over a water source
        const waterSource = this.getWaterSourceAt(worldPos.x, worldPos.y);
        
        if (waterSource) {
            // Show water source tooltip
            const waterSourceChanged = !this.currentWaterSource || this.currentWaterSource !== waterSource;
            
            if (waterSourceChanged) {
                this.currentWaterSource = waterSource;
                this.currentBiome = null;
                this.hoverTimer = 0;
            }
            
            // Update hover timer
            if (!this.isVisible) {
                this.hoverTimer += dt;
                
                if (this.hoverTimer >= this.hoverDelay) {
                    this.show(mouseX, mouseY);
                }
            } else {
                // Update position if visible
                this.updatePosition(mouseX, mouseY);
                
                // Update content if water source changed
                if (waterSourceChanged) {
                    this.updateContent();
                }
            }
            
            // Update fade animation
            this.updateFade(dt);
            return;
        }
        
        // Clear water source if not hovering
        this.currentWaterSource = null;
        
        // Get biome at mouse position
        const biome = this.world.biomeGenerator.getBiomeAt(worldPos.x, worldPos.y);
        
        if (!biome) {
            this.hide();
            return;
        }
        
        // Check if biome changed
        const biomeChanged = !this.currentBiome || this.currentBiome.id !== biome.id;
        
        if (biomeChanged) {
            this.currentBiome = biome;
            this.hoverTimer = 0;
        }
        
        // Update hover timer
        if (!this.isVisible) {
            this.hoverTimer += dt;
            
            if (this.hoverTimer >= this.hoverDelay) {
                this.show(mouseX, mouseY);
            }
        } else {
            // Update position if visible
            this.updatePosition(mouseX, mouseY);
            
            // Update content if biome changed
            if (biomeChanged) {
                this.updateContent();
            }
        }
        
        // Update fade animation
        this.updateFade(dt);
    }
    
    /**
     * Get water source at world position
     */
    getWaterSourceAt(worldX, worldY) {
        if (!this.world.waterSources) return null;
        
        for (const waterSource of this.world.waterSources) {
            const dx = worldX - waterSource.x;
            const dy = worldY - waterSource.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if within water source radius (with some extra margin for easier hovering)
            if (distance <= waterSource.radius + 10) {
                return waterSource;
            }
        }
        
        return null;
    }
    
    /**
     * Show the tooltip
     */
    show(mouseX, mouseY) {
        if (!this.currentBiome && !this.currentWaterSource) return;
        
        this.isVisible = true;
        this.tooltip.style.display = 'block';
        this.fadeTimer = 0;
        
        this.updateContent();
        this.updatePosition(mouseX, mouseY);
    }
    
    /**
     * Hide the tooltip
     */
    hide() {
        this.isVisible = false;
        this.hoverTimer = 0;
        this.fadeTimer = 0;
        
        // Fade out
        this.tooltip.style.opacity = '0';
        
        // Hide after fade completes
        setTimeout(() => {
            if (!this.isVisible) {
                this.tooltip.style.display = 'none';
            }
        }, this.fadeDuration * 1000);
    }
    
    /**
     * Update tooltip content
     */
    updateContent() {
        // Check if showing water source tooltip
        if (this.currentWaterSource) {
            this.updateWaterSourceContent();
            return;
        }
        
        if (!this.currentBiome) return;
        
        // Count entities in the current biome tile
        const entityCount = this.countEntitiesInBiome();
        
        // Build tooltip HTML
        const html = `
            <div style="margin-bottom: 8px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px; color: ${this.currentBiome.color};">
                    ${this.currentBiome.name}
                </div>
                <div style="font-size: 11px; color: #888;">
                    ${entityCount} ${entityCount === 1 ? 'entity' : 'entities'} present
                </div>
            </div>
            
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px; margin-top: 8px;">
                <div style="font-size: 11px; color: #aaa; margin-bottom: 6px; font-weight: bold;">
                    BIOME EFFECTS
                </div>
                ${this.buildModifiersList()}
            </div>
        `;
        
        this.tooltip.innerHTML = html;
    }
    
    /**
     * Update water source tooltip content
     */
    updateWaterSourceContent() {
        if (!this.currentWaterSource) return;
        
        // Count nearby entities (within 100 units)
        const nearbyCount = this.countNearbyEntities(this.currentWaterSource.x, this.currentWaterSource.y, 100);
        
        // Calculate recent visits per minute
        const currentTime = this.world.time;
        const timeSinceReset = currentTime - this.currentWaterSource.lastResetTime;
        const visitsPerMinute = timeSinceReset > 0 
            ? (this.currentWaterSource.recentVisits / timeSinceReset) * 60 
            : 0;
        
        // Build tooltip HTML
        const html = `
            <div style="margin-bottom: 8px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px; color: #4da6ff;">
                    💧 Water Source
                </div>
                <div style="font-size: 11px; color: #888;">
                    Essential resource for land entities
                </div>
            </div>
            
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px; margin-top: 8px;">
                <div style="font-size: 11px; color: #aaa; margin-bottom: 6px; font-weight: bold;">
                    STATISTICS
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px;">
                    <span style="color: #aaa;">
                        <span style="margin-right: 6px;">📊</span>Total Visits
                    </span>
                    <span style="font-weight: bold; color: #4da6ff;">${this.currentWaterSource.visitCount}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px;">
                    <span style="color: #aaa;">
                        <span style="margin-right: 6px;">⏱️</span>Visits/Minute
                    </span>
                    <span style="font-weight: bold; color: #4da6ff;">${visitsPerMinute.toFixed(1)}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px;">
                    <span style="color: #aaa;">
                        <span style="margin-right: 6px;">👥</span>Nearby Entities
                    </span>
                    <span style="font-weight: bold; color: ${nearbyCount > 5 ? '#FFD700' : '#4da6ff'};">${nearbyCount}</span>
                </div>
            </div>
            
            ${nearbyCount > 5 ? `
                <div style="margin-top: 8px; padding: 6px; background: rgba(255, 215, 0, 0.1); border-radius: 4px; border-left: 3px solid #FFD700;">
                    <div style="font-size: 10px; color: #FFD700;">
                        ⚠️ High activity - potential ambush site
                    </div>
                </div>
            ` : ''}
        `;
        
        this.tooltip.innerHTML = html;
    }
    
    /**
     * Build list of biome modifiers
     */
    buildModifiersList() {
        const modifiers = [];
        
        // Movement modifier
        const movementPercent = Math.round((this.currentBiome.movementModifier - 1) * 100);
        if (movementPercent !== 0) {
            const sign = movementPercent > 0 ? '+' : '';
            const color = movementPercent > 0 ? '#4CAF50' : '#F44336';
            modifiers.push({
                icon: '🏃',
                label: 'Movement Speed',
                value: `${sign}${movementPercent}%`,
                color: color
            });
        }
        
        // Energy modifier
        const energyPercent = Math.round((this.currentBiome.energyModifier - 1) * 100);
        if (energyPercent !== 0) {
            const sign = energyPercent > 0 ? '+' : '';
            const color = energyPercent > 0 ? '#F44336' : '#4CAF50';
            modifiers.push({
                icon: '⚡',
                label: 'Energy Drain',
                value: `${sign}${energyPercent}%`,
                color: color
            });
        }
        
        // Plant density
        const plantPercent = Math.round((this.currentBiome.plantDensity - 1) * 100);
        if (this.currentBiome.plantDensity > 0) {
            const sign = plantPercent > 0 ? '+' : '';
            const color = plantPercent > 0 ? '#4CAF50' : '#F44336';
            modifiers.push({
                icon: '🌿',
                label: 'Plant Density',
                value: `${sign}${plantPercent}%`,
                color: color
            });
        } else {
            modifiers.push({
                icon: '🌿',
                label: 'Plant Density',
                value: 'None',
                color: '#888'
            });
        }
        
        // Visibility modifier
        const visibilityPercent = Math.round((this.currentBiome.visibilityModifier - 1) * 100);
        if (visibilityPercent !== 0) {
            const sign = visibilityPercent > 0 ? '+' : '';
            const color = visibilityPercent > 0 ? '#FFD700' : '#888';
            modifiers.push({
                icon: '👁️',
                label: 'Visibility',
                value: `${sign}${visibilityPercent}%`,
                color: color
            });
        }
        
        // Concealment bonus
        if (this.currentBiome.concealmentBonus > 0) {
            const concealmentPercent = Math.round(this.currentBiome.concealmentBonus * 100);
            modifiers.push({
                icon: '🌲',
                label: 'Concealment',
                value: `+${concealmentPercent}%`,
                color: '#4ECDC4'
            });
        }
        
        // Build HTML
        if (modifiers.length === 0) {
            return '<div style="font-size: 11px; color: #666; font-style: italic;">No special effects</div>';
        }
        
        return modifiers.map(mod => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px;">
                <span style="color: #aaa;">
                    <span style="margin-right: 6px;">${mod.icon}</span>${mod.label}
                </span>
                <span style="font-weight: bold; color: ${mod.color};">${mod.value}</span>
            </div>
        `).join('');
    }
    
    /**
     * Count entities in the current biome tile
     */
    countEntitiesInBiome() {
        if (!this.currentBiome || this.lastMouseX < 0 || this.lastMouseY < 0) {
            return 0;
        }
        
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(this.lastMouseX, this.lastMouseY);
        
        // Calculate tile bounds
        const tileSize = this.world.biomeGenerator.tileSize;
        const tileX = Math.floor(worldPos.x / tileSize);
        const tileY = Math.floor(worldPos.y / tileSize);
        
        const tileBounds = {
            x: tileX * tileSize,
            y: tileY * tileSize,
            width: tileSize,
            height: tileSize
        };
        
        // Query entities in tile bounds using QuadTree
        const entitiesInTile = this.world.quadTree.query(tileBounds);
        
        // Filter to only active entities
        return entitiesInTile.filter(entity => entity.active).length;
    }
    
    /**
     * Count entities near a specific position
     */
    countNearbyEntities(x, y, radius) {
        const nearby = this.world.getNearbyEntities({ x, y }, radius);
        return nearby.length;
    }
    
    /**
     * Update tooltip position near cursor
     */
    updatePosition(mouseX, mouseY) {
        // Calculate position with offset
        let x = mouseX + this.offsetX;
        let y = mouseY + this.offsetY;
        
        // Get tooltip dimensions
        const rect = this.tooltip.getBoundingClientRect();
        
        // Keep tooltip within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust horizontal position if tooltip would go off-screen
        if (x + rect.width > viewportWidth - 10) {
            x = mouseX - rect.width - this.offsetX;
        }
        
        // Adjust vertical position if tooltip would go off-screen
        if (y + rect.height > viewportHeight - 10) {
            y = mouseY - rect.height - this.offsetY;
        }
        
        // Ensure tooltip doesn't go off the left or top edge
        x = Math.max(10, x);
        y = Math.max(10, y);
        
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }
    
    /**
     * Update fade animation
     */
    updateFade(dt) {
        if (this.isVisible) {
            // Fade in
            this.fadeTimer = Math.min(this.fadeTimer + dt, this.fadeDuration);
            this.opacity = this.fadeTimer / this.fadeDuration;
        } else {
            // Fade out
            this.fadeTimer = Math.max(this.fadeTimer - dt, 0);
            this.opacity = this.fadeTimer / this.fadeDuration;
        }
        
        this.tooltip.style.opacity = this.opacity.toString();
    }
    
    /**
     * Clean up tooltip element
     */
    destroy() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
    }
}
