import { ComponentType } from '../core/Entity.js';

/**
 * HeatmapRenderer - Visualizes population density across the world
 * 
 * Divides the world into a grid and renders a color gradient based on entity density.
 * Can show combined density or species-specific heatmaps.
 * 
 * Requirements: 12.1, 12.2
 */
export class HeatmapRenderer {
    /**
     * Create a new HeatmapRenderer
     * @param {World} world - The world instance
     * @param {number} gridSize - Size of each grid cell in pixels (default: 50)
     */
    constructor(world, gridSize = 50) {
        this.world = world;
        this.gridSize = gridSize;
        this.enabled = false;
        
        // Calculate grid dimensions
        this.gridWidth = Math.ceil(world.width / gridSize);
        this.gridHeight = Math.ceil(world.height / gridSize);
        
        // Initialize density grid
        this.densityGrid = this.createEmptyGrid();
        
        // Update tracking
        this.lastUpdateTime = 0;
        this.updateInterval = 1.0; // Update every second (Requirement 12.2)
        
        // Species colors for heatmap visualization
        this.speciesColors = {
            herbivore: [100, 200, 100], // Green
            predator: [200, 100, 100],  // Red
            plant: [100, 255, 100],     // Bright green
            fish: [100, 150, 255],      // Blue
            bird: [200, 200, 100]       // Yellow
        };
        
        // Current species filter ('all' or specific species name)
        this.currentSpecies = 'all';
        
        // Max density for normalization (updated dynamically)
        this.maxDensity = 1;
    }
    
    /**
     * Create an empty density grid
     * @returns {Array} - 2D array of zeros
     */
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                grid[y][x] = 0;
            }
        }
        return grid;
    }
    
    /**
     * Enable or disable the heatmap
     * @param {boolean} enabled - Whether heatmap should be displayed
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            // Force immediate update when enabled
            this.update(true);
        }
    }
    
    /**
     * Check if heatmap is enabled
     * @returns {boolean} - True if heatmap is enabled
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Set the species filter for the heatmap
     * @param {string} species - Species name or 'all' for combined view
     */
    setSpecies(species) {
        this.currentSpecies = species;
        // Force immediate update when species changes
        this.update(true);
    }
    
    /**
     * Get the current species filter
     * @returns {string} - Current species filter
     */
    getSpecies() {
        return this.currentSpecies;
    }
    
    /**
     * Update the density grid by counting entities in each cell
     * @param {boolean} force - Force update even if interval hasn't elapsed
     */
    update(force = false) {
        const currentTime = this.world.time;
        
        // Check if we should update (every second or forced)
        if (!force && currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        
        this.lastUpdateTime = currentTime;
        
        // Reset grid
        this.densityGrid = this.createEmptyGrid();
        this.maxDensity = 1; // Reset max density
        
        // Get active entities
        const entities = this.world.getActiveEntities();
        
        // Count entities in each grid cell
        for (const entity of entities) {
            if (!entity.hasComponent(ComponentType.POSITION)) continue;
            
            // Filter by species if not showing all
            if (this.currentSpecies !== 'all') {
                if (!entity.hasComponent(ComponentType.STATS)) continue;
                const stats = entity.getComponent(ComponentType.STATS);
                if (stats.species !== this.currentSpecies) continue;
            }
            
            const pos = entity.getComponent(ComponentType.POSITION);
            
            // Calculate grid cell coordinates
            const cellX = Math.floor(pos.x / this.gridSize);
            const cellY = Math.floor(pos.y / this.gridSize);
            
            // Ensure cell is within bounds
            if (cellX >= 0 && cellX < this.gridWidth && 
                cellY >= 0 && cellY < this.gridHeight) {
                this.densityGrid[cellY][cellX]++;
                
                // Track maximum density for normalization
                if (this.densityGrid[cellY][cellX] > this.maxDensity) {
                    this.maxDensity = this.densityGrid[cellY][cellX];
                }
            }
        }
    }
    
    /**
     * Render the heatmap overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.enabled) return;
        
        // Update heatmap data if needed
        this.update();
        
        // Determine color based on current species filter
        let baseColor;
        if (this.currentSpecies === 'all') {
            // Use a neutral color for combined view
            baseColor = [255, 100, 100]; // Red-orange
        } else {
            // Use species-specific color
            baseColor = this.speciesColors[this.currentSpecies] || [255, 255, 255];
        }
        
        // Render each grid cell with color gradient based on density
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const density = this.densityGrid[y][x];
                
                // Skip empty cells
                if (density === 0) continue;
                
                // Calculate alpha based on density (normalized to max density)
                const normalizedDensity = density / this.maxDensity;
                const alpha = Math.min(normalizedDensity, 1) * 0.5; // Max 50% opacity
                
                // Set fill color with calculated alpha
                ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
                
                // Draw grid cell
                ctx.fillRect(
                    x * this.gridSize,
                    y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
            }
        }
    }
    
    /**
     * Get heatmap statistics
     * @returns {Object} - Statistics about the heatmap
     */
    getStats() {
        let totalDensity = 0;
        let cellsWithEntities = 0;
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const density = this.densityGrid[y][x];
                if (density > 0) {
                    totalDensity += density;
                    cellsWithEntities++;
                }
            }
        }
        
        return {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            totalCells: this.gridWidth * this.gridHeight,
            occupiedCells: cellsWithEntities,
            maxDensity: this.maxDensity,
            averageDensity: cellsWithEntities > 0 ? totalDensity / cellsWithEntities : 0,
            currentSpecies: this.currentSpecies,
            enabled: this.enabled
        };
    }
    
    /**
     * Resize the heatmap grid when world size changes
     * @param {number} width - New world width
     * @param {number} height - New world height
     */
    resize(width, height) {
        this.gridWidth = Math.ceil(width / this.gridSize);
        this.gridHeight = Math.ceil(height / this.gridSize);
        this.densityGrid = this.createEmptyGrid();
        
        // Force update after resize
        this.update(true);
    }

    /**
     * Render resource depletion zones based on grazing pressure
     * Only renders when heatmap is enabled
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {GrazingPressureGrid} grazingGrid - The grazing pressure grid
     */
    renderDepletionZones(ctx, grazingGrid) {
        if (!this.enabled || !grazingGrid) {
            return;
        }

        ctx.save();

        // Iterate through grazing grid cells
        for (let y = 0; y < grazingGrid.gridHeight; y++) {
            for (let x = 0; x < grazingGrid.gridWidth; x++) {
                const pressure = grazingGrid.grid[y][x];

                // Only render cells with pressure > 5
                if (pressure <= 5) continue;

                // Calculate alpha based on pressure: min(0.3, pressure / 40)
                const alpha = Math.min(0.3, pressure / 40);

                // Draw brown tint overlay (rgba(139, 69, 19, alpha))
                ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.fillRect(
                    x * grazingGrid.cellSize,
                    y * grazingGrid.cellSize,
                    grazingGrid.cellSize,
                    grazingGrid.cellSize
                );
            }
        }

        ctx.restore();
    }
}
