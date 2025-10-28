import { BIOME_DEFINITIONS } from '../core/BiomeConstants.js';

/**
 * BiomeLegendPanel - Displays a legend of all biome types with their properties
 * Shows color swatches, modifier values, and allows click-to-highlight on map
 */
export class BiomeLegendPanel {
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        
        // Create panel element
        this.panel = this.createPanelElement();
        
        // Panel state
        this.isVisible = false;
        this.highlightedBiome = null;
        
        // Create toggle button
        this.toggleButton = this.createToggleButton();
        
        // Populate panel with biome entries
        this.populatePanel();
        
        // Initially hidden
        this.hide();
    }
    
    /**
     * Create the main panel DOM element
     */
    createPanelElement() {
        const panel = document.createElement('div');
        panel.id = 'biome-legend-panel';
        panel.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 320px;
            max-height: calc(100vh - 100px);
            background: rgba(20, 20, 20, 0.95);
            color: #fff;
            border-radius: 12px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            z-index: 9999;
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        
        document.body.appendChild(panel);
        return panel;
    }
    
    /**
     * Create the toggle button
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'biome-legend-toggle';
        button.textContent = '🗺️ Biome Legend';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 16px;
            background: #666;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: background 0.2s ease, transform 0.1s ease;
            z-index: 10000;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = '#777';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = this.isVisible ? '#4caf50' : '#666';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', () => {
            this.toggle();
        });
        
        document.body.appendChild(button);
        return button;
    }
    
    /**
     * Populate the panel with biome entries
     */
    populatePanel() {
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0, 0, 0, 0.3);
        `;
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Biome Legend</h3>
                <span style="font-size: 12px; color: #888;">Click to highlight</span>
            </div>
        `;
        this.panel.appendChild(header);
        
        // Scrollable content area
        const content = document.createElement('div');
        content.style.cssText = `
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
            padding: 12px;
        `;
        
        // Add biome entries
        BIOME_DEFINITIONS.forEach(biomeDef => {
            const entry = this.createBiomeEntry(biomeDef);
            content.appendChild(entry);
        });
        
        this.panel.appendChild(content);
        
        // Footer with instructions
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0, 0, 0, 0.3);
            font-size: 11px;
            color: #888;
            text-align: center;
        `;
        footer.textContent = 'Click any biome to highlight it on the map';
        this.panel.appendChild(footer);
    }
    
    /**
     * Create a single biome entry element
     */
    createBiomeEntry(biomeDef) {
        const entry = document.createElement('div');
        entry.className = 'biome-entry';
        entry.dataset.biomeId = biomeDef.id;
        entry.style.cssText = `
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        // Hover effect
        entry.addEventListener('mouseenter', () => {
            if (this.highlightedBiome !== biomeDef.id) {
                entry.style.background = 'rgba(255, 255, 255, 0.1)';
                entry.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
        });
        
        entry.addEventListener('mouseleave', () => {
            if (this.highlightedBiome !== biomeDef.id) {
                entry.style.background = 'rgba(255, 255, 255, 0.05)';
                entry.style.borderColor = 'transparent';
            }
        });
        
        // Click to highlight
        entry.addEventListener('click', () => {
            this.toggleHighlight(biomeDef.id);
        });
        
        // Build entry content
        entry.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: ${biomeDef.color};
                    border-radius: 6px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    margin-right: 12px;
                    flex-shrink: 0;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                "></div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px; color: ${biomeDef.color};">
                        ${biomeDef.name}
                    </div>
                    <div style="font-size: 11px; color: #888;">
                        ${this.getBiomeDescription(biomeDef.id)}
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                ${this.buildModifierGrid(biomeDef)}
            </div>
        `;
        
        return entry;
    }
    
    /**
     * Get a brief description for each biome
     */
    getBiomeDescription(biomeId) {
        const descriptions = {
            deep_water: 'Deep aquatic zone',
            water: 'Shallow aquatic zone',
            sand: 'Coastal beach area',
            grassland: 'Open plains',
            forest: 'Dense woodland',
            savanna: 'Open grassland',
            desert: 'Arid wasteland',
            mountain: 'Rocky highlands',
            snow: 'Frozen peaks'
        };
        return descriptions[biomeId] || 'Unknown biome';
    }
    
    /**
     * Build the modifier grid for a biome
     */
    buildModifierGrid(biomeDef) {
        const modifiers = [];
        
        // Movement modifier
        const movementPercent = Math.round((biomeDef.movementModifier - 1) * 100);
        const movementColor = this.getModifierColor(movementPercent);
        const movementSign = movementPercent > 0 ? '+' : '';
        modifiers.push(`
            <div style="padding: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="color: #aaa; margin-bottom: 2px;">⚡ Movement</div>
                <div style="font-weight: bold; color: ${movementColor};">${movementSign}${movementPercent}%</div>
            </div>
        `);
        
        // Energy modifier
        const energyPercent = Math.round((biomeDef.energyModifier - 1) * 100);
        const energyColor = this.getModifierColor(-energyPercent); // Inverse for energy
        const energySign = energyPercent > 0 ? '+' : '';
        modifiers.push(`
            <div style="padding: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="color: #aaa; margin-bottom: 2px;">🔥 Energy</div>
                <div style="font-weight: bold; color: ${energyColor};">${energySign}${energyPercent}%</div>
            </div>
        `);
        
        // Plant density
        const plantPercent = Math.round((biomeDef.plantDensity - 1) * 100);
        const plantColor = this.getModifierColor(plantPercent);
        const plantSign = plantPercent > 0 ? '+' : '';
        const plantDisplay = biomeDef.plantDensity === 0 ? 'None' : `${plantSign}${plantPercent}%`;
        modifiers.push(`
            <div style="padding: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="color: #aaa; margin-bottom: 2px;">🌿 Plants</div>
                <div style="font-weight: bold; color: ${plantColor};">${plantDisplay}</div>
            </div>
        `);
        
        // Visibility modifier
        const visibilityPercent = Math.round((biomeDef.visibilityModifier - 1) * 100);
        const visibilityColor = this.getModifierColor(visibilityPercent);
        const visibilitySign = visibilityPercent > 0 ? '+' : '';
        modifiers.push(`
            <div style="padding: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="color: #aaa; margin-bottom: 2px;">👁️ Visibility</div>
                <div style="font-weight: bold; color: ${visibilityColor};">${visibilitySign}${visibilityPercent}%</div>
            </div>
        `);
        
        return modifiers.join('');
    }
    
    /**
     * Get color for modifier percentage
     */
    getModifierColor(percent) {
        if (percent > 20) return '#4CAF50'; // Strong positive
        if (percent > 0) return '#66BB6A';  // Mild positive
        if (percent < -20) return '#F44336'; // Strong negative
        if (percent < 0) return '#FF9800';   // Mild negative
        return '#888'; // Neutral
    }
    
    /**
     * Toggle biome highlight on the map
     */
    toggleHighlight(biomeId) {
        // If clicking the same biome, turn off highlight
        if (this.highlightedBiome === biomeId) {
            this.clearHighlight();
            return;
        }
        
        // Set new highlight
        this.highlightedBiome = biomeId;
        
        // Update renderer to highlight this biome
        if (this.renderer) {
            this.renderer.highlightedBiome = biomeId;
        }
        
        // Update visual state of entries
        this.updateEntryStates();
        
        console.log(`🗺️ Highlighting biome: ${biomeId}`);
    }
    
    /**
     * Clear biome highlight
     */
    clearHighlight() {
        this.highlightedBiome = null;
        
        // Clear renderer highlight
        if (this.renderer) {
            this.renderer.highlightedBiome = null;
        }
        
        // Update visual state of entries
        this.updateEntryStates();
        
        console.log('🗺️ Biome highlight cleared');
    }
    
    /**
     * Update visual state of all biome entries
     */
    updateEntryStates() {
        const entries = this.panel.querySelectorAll('.biome-entry');
        
        entries.forEach(entry => {
            const biomeId = entry.dataset.biomeId;
            
            if (biomeId === this.highlightedBiome) {
                // Highlighted state
                entry.style.background = 'rgba(76, 175, 80, 0.2)';
                entry.style.borderColor = '#4CAF50';
                entry.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.4)';
            } else {
                // Normal state
                entry.style.background = 'rgba(255, 255, 255, 0.05)';
                entry.style.borderColor = 'transparent';
                entry.style.boxShadow = 'none';
            }
        });
    }
    
    /**
     * Show the panel
     */
    show() {
        this.isVisible = true;
        this.panel.style.display = 'flex';
        this.panel.style.opacity = '0';
        this.panel.style.transform = 'translateX(20px)';
        
        // Animate in
        setTimeout(() => {
            this.panel.style.opacity = '1';
            this.panel.style.transform = 'translateX(0)';
        }, 10);
        
        // Update toggle button
        this.toggleButton.style.background = '#4caf50';
        this.toggleButton.textContent = '🗺️ Biome Legend ✓';
    }
    
    /**
     * Hide the panel
     */
    hide() {
        this.isVisible = false;
        
        // Animate out
        this.panel.style.opacity = '0';
        this.panel.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            if (!this.isVisible) {
                this.panel.style.display = 'none';
            }
        }, 300);
        
        // Update toggle button
        this.toggleButton.style.background = '#666';
        this.toggleButton.textContent = '🗺️ Biome Legend';
        
        // Clear highlight when hiding
        this.clearHighlight();
    }
    
    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Get current highlighted biome ID
     */
    getHighlightedBiome() {
        return this.highlightedBiome;
    }
    
    /**
     * Clean up panel and button elements
     */
    destroy() {
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
        
        if (this.toggleButton && this.toggleButton.parentNode) {
            this.toggleButton.parentNode.removeChild(this.toggleButton);
        }
        
        // Clear renderer highlight
        if (this.renderer) {
            this.renderer.highlightedBiome = null;
        }
    }
}
