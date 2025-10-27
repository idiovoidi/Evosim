import { ComponentType } from '../core/Entity.js';

export class UI {
    constructor(world) {
        this.world = world;
        this.startTime = Date.now();
    }
    
    update(fps) {
        const stats = this.world.getStats();
        
        // Update population counts
        document.getElementById('herbivore-count').textContent = stats.herbivores;
        document.getElementById('predator-count').textContent = stats.predators;
        document.getElementById('plant-count').textContent = stats.plants;
        document.getElementById('fish-count').textContent = stats.fish;
        document.getElementById('bird-count').textContent = stats.birds;
        document.getElementById('total-count').textContent = stats.total;
        
        // Update FPS
        document.getElementById('fps').textContent = Math.round(fps);
        
        // Update time elapsed
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('time-elapsed').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update selected entity info
        this.updateEntityInfo();
    }
    
    updateEntityInfo() {
        const entity = this.world.selectedEntity;
        const infoPanel = document.getElementById('entity-info');
        const detailsDiv = document.getElementById('entity-details');
        
        if (!entity || !entity.active) {
            infoPanel.style.display = 'none';
            this.world.selectedEntity = null;
            return;
        }
        
        infoPanel.style.display = 'block';
        
        const stats = entity.getComponent(ComponentType.STATS);
        const pos = entity.getComponent(ComponentType.POSITION);
        const vel = entity.getComponent(ComponentType.VELOCITY);
        const status = entity.getComponent(ComponentType.STATUS);
        const traits = entity.getComponent(ComponentType.TRAITS);
        const genetics = entity.getComponent(ComponentType.GENETICS);
        
        let html = `
            <div><strong>Species:</strong> ${stats.species}</div>
            <div><strong>Energy:</strong> ${Math.round(stats.energy)}/${stats.maxEnergy}</div>
            <div><strong>Age:</strong> ${Math.round(stats.age)}s</div>
            <div><strong>State:</strong> ${status.state}</div>
            <div><strong>Position:</strong> (${Math.round(pos.x)}, ${Math.round(pos.y)})</div>
            <div><strong>Speed:</strong> ${Math.round(Math.sqrt(vel.dx*vel.dx + vel.dy*vel.dy) * 10) / 10}</div>
        `;
        
        if (traits) {
            html += `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">
                    <strong>Traits:</strong>
                </div>
                <div>Speed: ${(traits.speed * 100).toFixed(0)}%</div>
                <div>Metabolism: ${(traits.metabolism * 100).toFixed(0)}%</div>
                <div>Sense: ${(traits.senseRadius * 100).toFixed(0)}%</div>
                <div>Size: ${(traits.size * 100).toFixed(0)}%</div>
            `;
        }
        
        detailsDiv.innerHTML = html;
    }
}
