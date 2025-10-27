"""System for handling entity movement and physics"""
from .base_system import BaseSystem
from components import ComponentType
import numpy as np


class MovementSystem(BaseSystem):
    """Manages entity movement and boundary collision"""
    
    def update(self, dt: float):
        """Update positions based on velocities"""
        for entity in self.world.get_entities_by_type(ComponentType.VELOCITY):
            if not entity.active:
                continue
                
            if not entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY):
                continue
            
            pos = entity.get_component(ComponentType.POSITION)
            vel = entity.get_component(ComponentType.VELOCITY)
            
            # Apply velocity to position
            if isinstance(pos.value, np.ndarray) and isinstance(vel.value, np.ndarray):
                pos.value += vel.value * dt
                
                # Handle boundary collisions
                self._handle_boundaries(pos, vel)
    
    def _handle_boundaries(self, pos, vel):
        """Handle entity collision with world boundaries"""
        # X boundaries
        if pos.value[0] < 0:
            pos.value[0] = 0
            vel.value[0] *= -1
        elif pos.value[0] > self.world.map_width:
            pos.value[0] = self.world.map_width
            vel.value[0] *= -1
        
        # Y boundaries
        if pos.value[1] < 0:
            pos.value[1] = 0
            vel.value[1] *= -1
        elif pos.value[1] > self.world.map_height:
            pos.value[1] = self.world.map_height
            vel.value[1] *= -1 