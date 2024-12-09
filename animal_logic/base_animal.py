# Base class for all animals
from components import ComponentType
import numpy as np
import random
import math

class BaseAnimal:
    def __init__(self, entity, ecosystem):
        self.entity = entity
        self.ecosystem = ecosystem
    
    def update(self):
        """Base update method to be overridden"""
        pass
    
    def move_towards(self, target, flee=False):
        """Common movement logic for all animals"""
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        traits = self.entity.get_component(ComponentType.TRAITS)
        target_pos = target.get_component(ComponentType.POSITION)
        
        direction = target_pos.value - pos.value
        if flee:
            direction = -direction
        
        if np.linalg.norm(direction) > 0:
            direction = direction / np.linalg.norm(direction)
            speed = traits.speed * 15
            vel.value = direction * speed
            
            if hasattr(vel, 'clamp_velocity'):
                vel.clamp_velocity()
    
    def random_movement(self):
        """Common random movement logic"""
        angle = random.uniform(0, 2 * math.pi)
        speed = self.entity.get_component(ComponentType.TRAITS).speed * 5
        vel = self.entity.get_component(ComponentType.VELOCITY)
        vel.value = np.array([
            math.cos(angle) * speed,
            math.sin(angle) * speed
        ]) 