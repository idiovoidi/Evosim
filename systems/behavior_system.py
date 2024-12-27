from typing import Dict, Any
from components import ComponentType
from .base_system import BaseSystem

class BehaviorSystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.behaviors = {}
    
    def update(self, dt: float) -> Dict[str, Any]:
        changes = []
        
        for entity in self.world.get_entities():
            if not entity.active:
                continue
                
            behavior = self.behaviors.get(entity.id)
            if behavior:
                result = behavior.update(dt)
                if result:
                    changes.append({
                        'entity_id': entity.id,
                        'type': 'behavior',
                        'data': result
                    })
        
        return {'behavior_changes': changes}
    
    def create_behavior(self, entity_type: str, entity_id: str) -> None:
        """Create appropriate behavior based on entity type"""
        behavior_data = {
            'herbivore': {
                'flee_distance': 10,
                'eat_distance': 2,
                'wander_speed': 0.5
            },
            'predator': {
                'chase_distance': 15,
                'attack_distance': 3,
                'hunt_speed': 1.0
            }
        }
        
        if entity_type in behavior_data:
            self.behaviors[entity_id] = behavior_data[entity_type] 