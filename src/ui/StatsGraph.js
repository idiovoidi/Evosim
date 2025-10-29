export class StatsGraph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.history = [];
        this.maxHistory = 300; // 5 minutes at 60fps
        this.colors = {
            herbivores: '#96c896',
            predators: '#c89696',
            plants: '#649650',
            fish: '#5a9ed4',
            birds: '#8b7355',
            activeTerritories: '#FFD700',
            avgGrazingPressure: '#FF9800',
            territorialConflicts: '#F44336'
        };
    }
    
    update(stats) {
        this.history.push({
            time: stats.time,
            herbivores: stats.herbivores,
            predators: stats.predators,
            plants: stats.plants,
            fish: stats.fish,
            birds: stats.birds,
            activeTerritories: stats.activeTerritories || 0,
            avgGrazingPressure: stats.avgGrazingPressure || 0,
            territorialConflictsPerMinute: stats.territorialConflictsPerMinute || 0
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        if (this.history.length < 2) {
            // Show "Collecting data..." message
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Collecting data...', width / 2, height / 2);
            return;
        }
        
        // Find max value for scaling (population metrics)
        const maxValue = Math.max(
            1, // Minimum 1 to avoid division by zero
            ...this.history.flatMap(h => [
                h.herbivores, h.predators, h.plants, h.fish, h.birds, h.activeTerritories
            ])
        );
        
        // Draw grid
        this.drawGrid(ctx, width, height, maxValue);
        
        // Draw lines for each species
        this.drawLine(ctx, width, height, maxValue, 'plants', this.colors.plants);
        this.drawLine(ctx, width, height, maxValue, 'herbivores', this.colors.herbivores);
        this.drawLine(ctx, width, height, maxValue, 'fish', this.colors.fish);
        this.drawLine(ctx, width, height, maxValue, 'predators', this.colors.predators);
        this.drawLine(ctx, width, height, maxValue, 'birds', this.colors.birds);
        this.drawLine(ctx, width, height, maxValue, 'activeTerritories', this.colors.activeTerritories);
        
        // Draw legend
        this.drawLegend(ctx);
        
        // Draw ecosystem metrics
        this.drawEcosystemMetrics(ctx, width, height);
    }
    
    drawGrid(ctx, width, height, maxValue) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        
        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            
            ctx.beginPath();
            ctx.moveTo(30, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // Labels
            const value = Math.round(maxValue * (1 - i / 4));
            ctx.fillStyle = '#666';
            ctx.fillText(value.toString(), 25, y + 3);
        }
        
        // Vertical lines (time markers)
        ctx.strokeStyle = '#2a2a2a';
        for (let i = 0; i <= 5; i++) {
            const x = 30 + ((width - 30) / 5) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }
    
    drawLine(ctx, width, height, maxValue, species, color) {
        if (this.history.length < 2) return;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let started = false;
        
        for (let i = 0; i < this.history.length; i++) {
            const x = 30 + ((i / this.maxHistory) * (width - 30));
            const value = this.history[i][species];
            const y = height - (value / maxValue) * height;
            
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    drawLegend(ctx) {
        const legends = [
            { label: '🐰', species: 'herbivores', color: this.colors.herbivores },
            { label: '🦊', species: 'predators', color: this.colors.predators },
            { label: '🌿', species: 'plants', color: this.colors.plants },
            { label: '🐟', species: 'fish', color: this.colors.fish },
            { label: '🦅', species: 'birds', color: this.colors.birds },
            { label: '🏰', species: 'activeTerritories', color: this.colors.activeTerritories }
        ];
        
        const startX = 35;
        const startY = 10;
        const spacing = 45;
        
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        legends.forEach((legend, i) => {
            const x = startX + (i * spacing);
            
            // Color line
            ctx.strokeStyle = legend.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x + 15, startY);
            ctx.stroke();
            
            // Emoji
            ctx.fillStyle = '#fff';
            ctx.fillText(legend.label, x + 18, startY + 4);
        });
    }
    
    drawEcosystemMetrics(ctx, width, height) {
        if (this.history.length === 0) return;
        
        const latest = this.history[this.history.length - 1];
        
        // Position at bottom of graph
        const startY = height - 25;
        const startX = 35;
        
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        
        // Average Grazing Pressure
        ctx.fillStyle = this.colors.avgGrazingPressure;
        ctx.fillText(`🌾 Avg Grazing: ${latest.avgGrazingPressure.toFixed(1)}`, startX, startY);
        
        // Territorial Conflicts per Minute
        ctx.fillStyle = this.colors.territorialConflicts;
        ctx.fillText(`⚔️ Conflicts/min: ${latest.territorialConflictsPerMinute.toFixed(1)}`, startX + 130, startY);
    }
    
    clear() {
        this.history = [];
    }
}
