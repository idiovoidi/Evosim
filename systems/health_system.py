from typing import Dict, Any, List
from components import ComponentType
from .base_system import BaseSystem

class HealthSystem(BaseSystem):
    def update(self, dt: float) -> Dict[str, Any]:
        changes = []
        deaths = []
        
        for entity in self.world.get_entities_by_type(ComponentType.STATS):
            if not entity.active:
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            
            # Update energy
            if entity.has_component(ComponentType.TRAITS):
                traits = entity.get_component(ComponentType.TRAITS)
                stats.energy -= traits.metabolism * 0.1 * dt
            
            # Check death conditions
            if stats.energy <= -20:
                deaths.append(entity.id)
                continue
            
            # Record stat changes
            changes.append({
                'entity_id': entity.id,
                'stats': {
                    'energy': stats.energy,
                    'health': stats.health
                }
            })
        
        # Handle deaths
        for entity_id in deaths:
            self.world.kill_entity(entity_id)
        
        return {
            'stat_changes': changes,
            'deaths': deaths
        } 