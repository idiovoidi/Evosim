/**
 * PerformanceMonitor - Tracks and displays performance metrics
 * 
 * Monitors FPS, frame time, section timings, and entity counts.
 * Provides real-time performance data for optimization and debugging.
 */
export class PerformanceMonitor {
    constructor() {
        // Frame timing
        this.frameStartTime = 0;
        this.frameEndTime = 0;
        this.frameTime = 0;
        
        // FPS tracking with rolling average over 60 frames
        this.fps = 60;
        this.fpsHistory = new Array(60).fill(60);
        this.fpsIndex = 0;
        
        // Section timing
        this.sections = {};
        this.sectionStartTimes = {};
        this.updateTime = 0;
        this.renderTime = 0;
        
        // Entity counts by species
        this.entityCounts = {
            herbivore: 0,
            predator: 0,
            plant: 0,
            fish: 0,
            bird: 0,
            total: 0
        };
        
        // Additional metrics
        this.queryCount = 0;
        this.drawCalls = 0;
        
        // Memory tracking (if available)
        this.memoryUsage = 0;
        this.memoryTotal = 0;
    }
    
    /**
     * Mark the beginning of a frame
     */
    beginFrame() {
        this.frameStartTime = performance.now();
        
        // Reset per-frame counters
        this.queryCount = 0;
        this.drawCalls = 0;
        this.sections = {};
    }
    
    /**
     * Mark the end of a frame and calculate metrics
     */
    endFrame() {
        this.frameEndTime = performance.now();
        this.frameTime = this.frameEndTime - this.frameStartTime;
        
        // Calculate FPS
        const currentFps = this.frameTime > 0 ? 1000 / this.frameTime : 60;
        
        // Update rolling average
        this.fpsHistory[this.fpsIndex] = currentFps;
        this.fpsIndex = (this.fpsIndex + 1) % this.fpsHistory.length;
        
        // Calculate average FPS
        this.fps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
        
        // Update memory usage if available
        if (performance.memory) {
            this.memoryUsage = performance.memory.usedJSHeapSize;
            this.memoryTotal = performance.memory.totalJSHeapSize;
        }
    }
    
    /**
     * Mark the beginning of a timed section
     * @param {string} name - Section name (e.g., 'update', 'render', 'behaviors')
     */
    beginSection(name) {
        this.sectionStartTimes[name] = performance.now();
    }
    
    /**
     * Mark the end of a timed section
     * @param {string} name - Section name
     */
    endSection(name) {
        if (this.sectionStartTimes[name] !== undefined) {
            const endTime = performance.now();
            const duration = endTime - this.sectionStartTimes[name];
            this.sections[name] = duration;
            
            // Track specific sections for easy access
            if (name === 'update') {
                this.updateTime = duration;
            } else if (name === 'render') {
                this.renderTime = duration;
            }
            
            delete this.sectionStartTimes[name];
        }
    }
    
    /**
     * Update entity counts
     * @param {Object} counts - Entity counts by species
     */
    updateEntityCounts(counts) {
        this.entityCounts = { ...counts };
        this.entityCounts.total = Object.values(counts)
            .filter(v => typeof v === 'number')
            .reduce((sum, count) => sum + count, 0);
    }
    
    /**
     * Increment query counter
     */
    incrementQueryCount() {
        this.queryCount++;
    }
    
    /**
     * Increment draw call counter
     */
    incrementDrawCalls() {
        this.drawCalls++;
    }
    
    /**
     * Get all current metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            fps: Math.round(this.fps * 10) / 10,
            frameTime: Math.round(this.frameTime * 100) / 100,
            updateTime: Math.round(this.updateTime * 100) / 100,
            renderTime: Math.round(this.renderTime * 100) / 100,
            sections: { ...this.sections },
            entityCounts: { ...this.entityCounts },
            queryCount: this.queryCount,
            drawCalls: this.drawCalls,
            memory: {
                used: this.memoryUsage,
                total: this.memoryTotal
            }
        };
    }
    
    /**
     * Get FPS color based on performance thresholds
     * @returns {string} Color code
     */
    getFpsColor() {
        if (this.fps >= 50) {
            return '#00FF00'; // Green
        } else if (this.fps >= 30) {
            return '#FFFF00'; // Yellow
        } else {
            return '#FF0000'; // Red
        }
    }
    
    /**
     * Format memory size for display
     * @param {number} bytes - Memory in bytes
     * @returns {string} Formatted string
     */
    formatMemory(bytes) {
        if (bytes === 0) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${Math.round(mb * 10) / 10} MB`;
    }
    
    /**
     * Render performance overlay on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {boolean} expanded - Show detailed view
     */
    render(ctx, expanded = false) {
        const metrics = this.getMetrics();
        const padding = 15;
        const lineHeight = 20;
        const x = ctx.canvas.width - 220;
        const y = 10;
        
        // Save context state
        ctx.save();
        
        // Draw background
        const bgHeight = expanded ? 280 : 120;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(x - padding, y, 220, bgHeight);
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - padding, y, 220, bgHeight);
        
        // Set text style
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        
        let currentY = y + 25;
        
        // FPS with color coding
        const fpsColor = this.getFpsColor();
        ctx.fillStyle = fpsColor;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`FPS: ${metrics.fps}`, x, currentY);
        ctx.font = '14px monospace';
        currentY += lineHeight + 5;
        
        // Frame time
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Frame: ${metrics.frameTime.toFixed(2)}ms`, x, currentY);
        currentY += lineHeight;
        
        // Entity counts
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Entities:', x, currentY);
        currentY += lineHeight;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.fillText(`  🐰 ${metrics.entityCounts.herbivore}`, x, currentY);
        currentY += 16;
        ctx.fillText(`  🦊 ${metrics.entityCounts.predator}`, x, currentY);
        currentY += 16;
        ctx.fillText(`  🌿 ${metrics.entityCounts.plant}`, x, currentY);
        currentY += 16;
        
        // Show expanded details
        if (expanded) {
            currentY += 5;
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '14px monospace';
            ctx.fillText('Timing:', x, currentY);
            currentY += lineHeight;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px monospace';
            ctx.fillText(`  Update: ${metrics.updateTime.toFixed(2)}ms`, x, currentY);
            currentY += 16;
            ctx.fillText(`  Render: ${metrics.renderTime.toFixed(2)}ms`, x, currentY);
            currentY += 16;
            
            // Show other sections if available
            for (const [name, time] of Object.entries(metrics.sections)) {
                if (name !== 'update' && name !== 'render') {
                    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                    ctx.fillText(`  ${displayName}: ${time.toFixed(2)}ms`, x, currentY);
                    currentY += 16;
                }
            }
            
            // Memory usage if available
            if (metrics.memory.used > 0) {
                currentY += 5;
                ctx.fillStyle = '#AAAAAA';
                ctx.font = '14px monospace';
                ctx.fillText('Memory:', x, currentY);
                currentY += lineHeight;
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px monospace';
                ctx.fillText(`  ${this.formatMemory(metrics.memory.used)}`, x, currentY);
            }
        }
        
        // Show toggle hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(expanded ? 'Press P for less' : 'Press P for more', x, y + bgHeight - 8);
        
        // Restore context state
        ctx.restore();
    }
}
