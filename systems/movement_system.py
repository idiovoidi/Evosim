from .base_system import BaseSystem
from components import ComponentType
import numpy as np

class MovementSystem(BaseSystem):
    def update(self, dt: float):
        for entity in self.world.get_entities_by_type(ComponentType.VELOCITY):
            if not entity.active:
                continue
                
            if not entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY):
                continue
            
            pos = entity.get_component(ComponentType.POSITION)
            vel = entity.get_component(ComponentType.VELOCITY)
            
            # Debug print
            if entity.has_component(ComponentType.STATS):
                stats = entity.get_component(ComponentType.STATS)
                if stats.species_type == 'herbivore':
                    print(f"Herbivore {entity.id} velocity: {vel.value}, position: {pos.value}")
            
            # Apply velocity
            if isinstance(pos.value, np.ndarray) and isinstance(vel.value, np.ndarray):
                pos.value += vel.value * dt
                
                # Boundary checking
                for i in range(2):
                    if pos.value[i] < 0:
                        pos.value[i] = 0
                        vel.value[i] *= -1
                    elif pos.value[i] > self.world.bounds[1]:
                        pos.value[i] = self.world.bounds[1]
                        vel.value[i] *= -1 