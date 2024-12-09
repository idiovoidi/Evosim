from .base_system import BaseSystem
from components import ComponentType
import numpy as np

class MovementSystem(BaseSystem):
    def update(self, dt: float):
        for entity in self.world.entities:
            if not entity.active:
                continue
                
            if not entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY):
                continue
            
            pos = entity.get_component(ComponentType.POSITION)
            vel = entity.get_component(ComponentType.VELOCITY)
            
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