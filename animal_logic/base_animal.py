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
        
        # Calculate direction
        direction = target_pos.value - pos.value
        if flee:
            direction = -direction
        
        # Normalize direction
        distance = np.linalg.norm(direction)
        if distance > 0:
            direction = direction / distance
            
            # Scale speed by traits
            base_speed = traits.speed * 50  # Increase base speed multiplier
            
            # Add some randomness to movement
            direction += np.random.normal(0, 0.1, 2)  # Add noise
            direction = direction / np.linalg.norm(direction)  # Renormalize
            
            # Set velocity
            vel.value = direction * base_speed
            
            # Clamp velocity
            if hasattr(vel, 'clamp_velocity'):
                vel.clamp_velocity()
    
    def random_movement(self):
        """Enhanced random movement logic"""
        vel = self.entity.get_component(ComponentType.VELOCITY)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        # Generate random direction
        direction = np.random.uniform(-1, 1, 2)
        direction = direction / np.linalg.norm(direction)
        
        # Set velocity with trait-based speed
        base_speed = traits.speed * 30  # Adjust base speed multiplier
        vel.value = direction * base_speed
        
        # Clamp velocity
        if hasattr(vel, 'clamp_velocity'):
            vel.clamp_velocity() 