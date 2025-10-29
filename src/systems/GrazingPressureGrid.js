/**
 * GrazingPressureGrid
 * 
 * Tracks resource depletion across the world using a grid-based approach.
 * Each cell accumulates grazing pressure when herbivores consume plants,
 * and pressure decays over time to allow recovery.
 */
export class GrazingPressureGrid {
    /**
     * @param {number} worldWidth - Width of the world in units
     * @param {number} worldHeight - Height of the world in units
     * @param {number} cellSize - Size of each grid cell (default: 100 units)
     */
    constructor(worldWidth, worldHeight, cellSize = 100) {
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(worldWidth / cellSize);
        this.gridHeight = Math.ceil(worldHeight / cellSize);
        this.grid = [];
        
        // Initialize grid with zero pressure
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = new Array(this.gridWidth).fill(0);
        }
    }
    
    /**
     * Convert world coordinates to grid cell coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {{cellX: number, cellY: number}} Grid cell coordinates
     */
    getCellCoords(x, y) {
        return {
            cellX: Math.floor(x / this.cellSize),
            cellY: Math.floor(y / this.cellSize)
        };
    }
    
    /**
     * Get the grazing pressure at a world position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {number} Grazing pressure value (0 if out of bounds)
     */
    getPressure(x, y) {
        const { cellX, cellY } = this.getCellCoords(x, y);
        if (cellX >= 0 && cellX < this.gridWidth && 
            cellY >= 0 && cellY < this.gridHeight) {
            return this.grid[cellY][cellX];
        }
        return 0;
    }
    
    /**
     * Increment grazing pressure at a world position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} amount - Amount to increment (default: 1)
     */
    incrementPressure(x, y, amount = 1) {
        const { cellX, cellY } = this.getCellCoords(x, y);
        if (cellX >= 0 && cellX < this.gridWidth && 
            cellY >= 0 && cellY < this.gridHeight) {
            this.grid[cellY][cellX] += amount;
        }
    }
    
    /**
     * Decay all grazing pressure values by a percentage
     * @param {number} decayRate - Decay rate (0.1 = 10% decay)
     */
    decayAll(decayRate = 0.1) {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] *= (1 - decayRate);
                // Floor very small values to zero to prevent floating point drift
                if (this.grid[y][x] < 0.01) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }
    
    /**
     * Calculate the average grazing pressure across all grid cells
     * @returns {number} Average pressure value
     */
    getAveragePressure() {
        let total = 0;
        let count = 0;
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                total += this.grid[y][x];
                count++;
            }
        }
        
        return count > 0 ? total / count : 0;
    }
}
