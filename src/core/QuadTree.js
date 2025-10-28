/**
 * QuadTree spatial partitioning system for efficient entity queries
 * Divides 2D space into quadrants for O(log n) spatial lookups
 */

class QuadTreeNode {
    constructor(bounds, maxEntities, maxDepth, depth = 0) {
        this.bounds = bounds; // { x, y, width, height }
        this.maxEntities = maxEntities;
        this.maxDepth = maxDepth;
        this.depth = depth;
        this.entities = [];
        this.children = null; // [NW, NE, SW, SE] when subdivided
    }
    
    /**
     * Check if this node is subdivided
     */
    isSubdivided() {
        return this.children !== null;
    }
    
    /**
     * Subdivide this node into 4 children
     */
    subdivide() {
        if (this.isSubdivided()) return;
        
        const { x, y, width, height } = this.bounds;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const childDepth = this.depth + 1;
        
        // Create 4 child nodes: NW, NE, SW, SE
        this.children = [
            // Northwest
            new QuadTreeNode(
                { x, y, width: halfWidth, height: halfHeight },
                this.maxEntities,
                this.maxDepth,
                childDepth
            ),
            // Northeast
            new QuadTreeNode(
                { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
                this.maxEntities,
                this.maxDepth,
                childDepth
            ),
            // Southwest
            new QuadTreeNode(
                { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
                this.maxEntities,
                this.maxDepth,
                childDepth
            ),
            // Southeast
            new QuadTreeNode(
                { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
                this.maxEntities,
                this.maxDepth,
                childDepth
            )
        ];
        
        // Redistribute entities to children
        const entitiesToRedistribute = [...this.entities];
        this.entities = [];
        
        for (const item of entitiesToRedistribute) {
            this.insert(item.entity, item.position);
        }
    }
    
    /**
     * Insert an entity at a position
     */
    insert(entity, position) {
        // Check if position is within bounds
        if (!this.containsPoint(position)) {
            return false;
        }
        
        // If subdivided, insert into appropriate child
        if (this.isSubdivided()) {
            for (const child of this.children) {
                if (child.insert(entity, position)) {
                    return true;
                }
            }
            return false;
        }
        
        // Add to this node
        this.entities.push({ entity, position });
        
        // Subdivide if capacity exceeded and not at max depth
        if (this.entities.length > this.maxEntities && this.depth < this.maxDepth) {
            this.subdivide();
        }
        
        return true;
    }
    
    /**
     * Remove an entity from the tree
     */
    remove(entity) {
        if (this.isSubdivided()) {
            // Try to remove from children
            for (const child of this.children) {
                if (child.remove(entity)) {
                    return true;
                }
            }
            return false;
        }
        
        // Remove from this node
        const index = this.entities.findIndex(item => item.entity === entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    /**
     * Query entities within a rectangular bounds
     */
    query(bounds, results = []) {
        // Check if this node intersects the query bounds
        if (!this.intersectsBounds(bounds)) {
            return results;
        }
        
        // If subdivided, query children
        if (this.isSubdivided()) {
            for (const child of this.children) {
                child.query(bounds, results);
            }
            return results;
        }
        
        // Add entities from this node that are within bounds
        for (const item of this.entities) {
            if (this.pointInBounds(item.position, bounds)) {
                results.push(item.entity);
            }
        }
        
        return results;
    }
    
    /**
     * Query entities within a radius of a center point
     */
    queryRadius(center, radius, results = []) {
        // Create bounding box for the circle
        const bounds = {
            x: center.x - radius,
            y: center.y - radius,
            width: radius * 2,
            height: radius * 2
        };
        
        // Check if this node intersects the query bounds
        if (!this.intersectsBounds(bounds)) {
            return results;
        }
        
        // If subdivided, query children
        if (this.isSubdivided()) {
            for (const child of this.children) {
                child.queryRadius(center, radius, results);
            }
            return results;
        }
        
        // Add entities from this node that are within radius
        const radiusSq = radius * radius;
        for (const item of this.entities) {
            const dx = item.position.x - center.x;
            const dy = item.position.y - center.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= radiusSq) {
                results.push(item.entity);
            }
        }
        
        return results;
    }
    
    /**
     * Clear all entities from this node and children
     */
    clear() {
        this.entities = [];
        if (this.isSubdivided()) {
            for (const child of this.children) {
                child.clear();
            }
            this.children = null;
        }
    }
    
    /**
     * Check if a point is within this node's bounds
     */
    containsPoint(point) {
        return point.x >= this.bounds.x &&
               point.x < this.bounds.x + this.bounds.width &&
               point.y >= this.bounds.y &&
               point.y < this.bounds.y + this.bounds.height;
    }
    
    /**
     * Check if a point is within given bounds
     */
    pointInBounds(point, bounds) {
        return point.x >= bounds.x &&
               point.x < bounds.x + bounds.width &&
               point.y >= bounds.y &&
               point.y < bounds.y + bounds.height;
    }
    
    /**
     * Check if this node's bounds intersect with given bounds
     */
    intersectsBounds(bounds) {
        return !(bounds.x >= this.bounds.x + this.bounds.width ||
                 bounds.x + bounds.width <= this.bounds.x ||
                 bounds.y >= this.bounds.y + this.bounds.height ||
                 bounds.y + bounds.height <= this.bounds.y);
    }
    
    /**
     * Get total entity count in this node and children
     */
    getEntityCount() {
        let count = this.entities.length;
        if (this.isSubdivided()) {
            for (const child of this.children) {
                count += child.getEntityCount();
            }
        }
        return count;
    }
}

export class QuadTree {
    constructor(bounds, maxEntities = 10, maxDepth = 5) {
        this.bounds = bounds;
        this.maxEntities = maxEntities;
        this.maxDepth = maxDepth;
        this.root = new QuadTreeNode(bounds, maxEntities, maxDepth, 0);
    }
    
    /**
     * Insert an entity at a position
     */
    insert(entity, position) {
        try {
            return this.root.insert(entity, position);
        } catch (error) {
            console.error('[QuadTree] Insert error:', error);
            return false;
        }
    }
    
    /**
     * Remove an entity from the tree
     */
    remove(entity) {
        try {
            return this.root.remove(entity);
        } catch (error) {
            console.error('[QuadTree] Remove error:', error);
            return false;
        }
    }
    
    /**
     * Query entities within rectangular bounds
     * @param {Object} bounds - { x, y, width, height }
     * @param {Array} results - Optional array to store results
     * @returns {Array} Array of entities within bounds
     */
    query(bounds, results = []) {
        try {
            return this.root.query(bounds, results);
        } catch (error) {
            console.error('[QuadTree] Query error:', error);
            return results;
        }
    }
    
    /**
     * Query entities within a radius of a center point
     * @param {Object} center - { x, y }
     * @param {number} radius - Search radius
     * @param {Array} results - Optional array to store results
     * @returns {Array} Array of entities within radius
     */
    queryRadius(center, radius, results = []) {
        try {
            return this.root.queryRadius(center, radius, results);
        } catch (error) {
            console.error('[QuadTree] QueryRadius error:', error);
            return results;
        }
    }
    
    /**
     * Clear all entities from the tree
     */
    clear() {
        try {
            this.root.clear();
        } catch (error) {
            console.error('[QuadTree] Clear error:', error);
        }
    }
    
    /**
     * Rebuild the tree with a new set of entities
     * Useful for rebalancing after many insertions/removals
     */
    rebuild(entities) {
        try {
            this.clear();
            
            for (const entity of entities) {
                if (entity.active && entity.hasComponent) {
                    const ComponentType = { POSITION: 'position' };
                    if (entity.hasComponent(ComponentType.POSITION)) {
                        const pos = entity.getComponent(ComponentType.POSITION);
                        this.insert(entity, pos);
                    }
                }
            }
        } catch (error) {
            console.error('[QuadTree] Rebuild error:', error);
        }
    }
    
    /**
     * Get total number of entities in the tree
     */
    getEntityCount() {
        return this.root.getEntityCount();
    }
    
    /**
     * Get tree statistics for debugging
     */
    getStats() {
        const stats = {
            totalEntities: this.getEntityCount(),
            maxDepth: this.maxDepth,
            maxEntitiesPerNode: this.maxEntities,
            bounds: this.bounds
        };
        
        return stats;
    }
}
