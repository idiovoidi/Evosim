/**
 * Uniform-grid spatial index rebuilt every step. Cheap to rebuild, exact, and
 * allocation-free to query (results go through a visitor callback).
 */
export class SpatialHash {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = Array.from({ length: this.cols * this.rows }, () => []);
    }

    rebuild(items) {
        for (const cell of this.cells) cell.length = 0;
        for (const item of items) {
            if (!item.alive) continue;
            this.cells[this.indexFor(item.x, item.y)].push(item);
        }
    }

    indexFor(x, y) {
        let cx = (x / this.cellSize) | 0;
        let cy = (y / this.cellSize) | 0;
        if (cx < 0) cx = 0;
        else if (cx >= this.cols) cx = this.cols - 1;
        if (cy < 0) cy = 0;
        else if (cy >= this.rows) cy = this.rows - 1;
        return cy * this.cols + cx;
    }

    /** Call `visit(item, distSq)` for each item within `radius` of (x, y). Return `false` to stop. */
    query(x, y, radius, visit) {
        const r2 = radius * radius;
        const minX = Math.max(0, ((x - radius) / this.cellSize) | 0);
        const minY = Math.max(0, ((y - radius) / this.cellSize) | 0);
        const maxX = Math.min(this.cols - 1, ((x + radius) / this.cellSize) | 0);
        const maxY = Math.min(this.rows - 1, ((y + radius) / this.cellSize) | 0);
        for (let cy = minY; cy <= maxY; cy++) {
            for (let cx = minX; cx <= maxX; cx++) {
                const cell = this.cells[cy * this.cols + cx];
                for (let k = 0; k < cell.length; k++) {
                    const item = cell[k];
                    if (!item.alive) continue;
                    const dx = item.x - x;
                    const dy = item.y - y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 <= r2 && visit(item, d2) === false) return;
                }
            }
        }
    }

    /** Nearest item within radius matching `filter`, or null. */
    nearest(x, y, radius, filter) {
        let best = null;
        let bestD2 = Infinity;
        this.query(x, y, radius, (item, d2) => {
            if (d2 < bestD2 && filter(item)) {
                best = item;
                bestD2 = d2;
            }
        });
        return best;
    }
}
