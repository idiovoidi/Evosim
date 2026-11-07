const DIAGONAL = Math.SQRT2;

/**
 * Two-pass chamfer distance transform: approximate euclidean distance (in
 * cells) from every cell to the nearest cell satisfying `isSource`.
 */
export function distanceField(cols, rows, isSource) {
    const dist = new Float32Array(cols * rows);
    for (let i = 0; i < dist.length; i++) dist[i] = isSource(i) ? 0 : Infinity;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            let d = dist[i];
            if (x > 0) d = Math.min(d, dist[i - 1] + 1);
            if (y > 0) {
                d = Math.min(d, dist[i - cols] + 1);
                if (x > 0) d = Math.min(d, dist[i - cols - 1] + DIAGONAL);
                if (x < cols - 1) d = Math.min(d, dist[i - cols + 1] + DIAGONAL);
            }
            dist[i] = d;
        }
    }

    for (let y = rows - 1; y >= 0; y--) {
        for (let x = cols - 1; x >= 0; x--) {
            const i = y * cols + x;
            let d = dist[i];
            if (x < cols - 1) d = Math.min(d, dist[i + 1] + 1);
            if (y < rows - 1) {
                d = Math.min(d, dist[i + cols] + 1);
                if (x < cols - 1) d = Math.min(d, dist[i + cols + 1] + DIAGONAL);
                if (x > 0) d = Math.min(d, dist[i + cols - 1] + DIAGONAL);
            }
            dist[i] = d;
        }
    }
    return dist;
}
