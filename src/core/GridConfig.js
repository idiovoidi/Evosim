/**
 * Shared grid configuration utilities
 * Eliminates duplication between BiomeGenerator and TerrainGenerator
 */

export function initializeGridConfig(width, height, tileSize = 40) {
    return {
        width,
        height,
        tileSize,
        tilesX: Math.ceil(width / tileSize),
        tilesY: Math.ceil(height / tileSize)
    };
}

export function resizeGridConfig(obj, width, height) {
    obj.width = width;
    obj.height = height;
    obj.tilesX = Math.ceil(width / obj.tileSize);
    obj.tilesY = Math.ceil(height / obj.tileSize);
}
