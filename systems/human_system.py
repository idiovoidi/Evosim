from typing import Dict, Any, List
from components import ComponentType
from .base_system import BaseSystem
import numpy as np

class HumanSystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.selected_entity = None
        self.mouse_pos = np.array([0, 0])
    
    def update(self, dt: float) -> Dict[str, Any]:
        """Update human interaction state"""
        if not self.selected_entity:
            return {}
        
        # Return selected entity data
        entity = self.world.get_entity(self.selected_entity)
        if not entity or not entity.active:
            self.selected_entity = None
            return {'selected_entity': None}
        
        return {
            'selected_entity': {
                'id': entity.id,
                'position': {
                    'x': float(entity.get_component(ComponentType.POSITION).value[0]),
                    'y': 0,
                    'z': float(entity.get_component(ComponentType.POSITION).value[1])
                },
                'stats': self._get_entity_stats(entity)
            }
        }
    
    def handle_client_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle client interaction messages"""
        if message['type'] == 'select_entity':
            return self._handle_entity_selection(message['position'])
        elif message['type'] == 'spawn_entity':
            return self._handle_entity_spawn(message['entity_type'], message['position'])
        return {}
    
    def _handle_entity_selection(self, position: Dict[str, float]) -> Dict[str, Any]:
        """Handle entity selection at given position"""
        pos = np.array([position['x'], position['z']])  # z is y in 2D
        
        closest_entity = None
        closest_dist = float('inf')
        
        for entity in self.world.get_entities():
            if not entity.active:
                continue
                
            entity_pos = entity.get_component(ComponentType.POSITION).value
            dist = np.linalg.norm(pos - entity_pos)
            
            if dist < closest_dist and dist < 5:  # Selection radius
                closest_dist = dist
                closest_entity = entity
        
        self.selected_entity = closest_entity.id if closest_entity else None
        
        if closest_entity:
            return {
                'selected_entity': {
                    'id': closest_entity.id,
                    'stats': self._get_entity_stats(closest_entity)
                }
            }
        return {'selected_entity': None}
    
    def _handle_entity_spawn(self, entity_type: str, position: Dict[str, float]) -> Dict[str, Any]:
        """Handle spawning new entity at given position"""
        pos = np.array([position['x'], position['z']])
        
        entity = self.world.create_entity(
            "🦊" if entity_type == "predator" else "🐰",
            pos[0], pos[1],
            entity_type
        )
        
        return {
            'spawned_entity': {
                'id': entity.id,
                'type': entity_type,
                'position': position
            }
        }
    
    def _get_entity_stats(self, entity) -> Dict[str, Any]:
        """Get entity statistics for UI display"""
        stats = {}
        
        if entity.has_component(ComponentType.STATS):
            s = entity.get_component(ComponentType.STATS)
            stats.update({
                'energy': s.energy,
                'health': s.health,
                'species': s.species_type
            })
        
        if entity.has_component(ComponentType.GENETICS):
            g = entity.get_component(ComponentType.GENETICS)
            stats['genes'] = g.genes
        
        return stats 