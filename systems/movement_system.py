from typing import Dict, Any, List
from components import ComponentType
from .base_system import BaseSystem
import numpy as np

class MovementSystem(BaseSystem):
    def update(self, dt: float) -> Dict[str, Any]:
        movements = []
        
        for entity in self.world.get_entities_by_type(ComponentType.VELOCITY):
            if not entity.active:
                continue
                
            if not entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY):
                continue
            
            pos = entity.get_component(ComponentType.POSITION)
            vel = entity.get_component(ComponentType.VELOCITY)
            
            # Update position
            new_pos = pos.value + vel.value * dt
            
            # Boundary checking
            for i in range(2):
                if new_pos[i] < 0:
                    new_pos[i] = 0
                    vel.value[i] *= -1
                elif new_pos[i] > self.world.bounds[i]:
                    new_pos[i] = self.world.bounds[i]
                    vel.value[i] *= -1
            
            pos.value = new_pos
            
            # Record movement for client update
            movements.append({
                'entity_id': entity.id,
                'position': {
                    'x': float(pos.value[0]),
                    'y': 0,  # Height in 3D space
                    'z': float(pos.value[1])
                },
                'velocity': {
                    'x': float(vel.value[0]),
                    'y': 0,
                    'z': float(vel.value[1])
                }
            })
        
        return {'movements': movements} 