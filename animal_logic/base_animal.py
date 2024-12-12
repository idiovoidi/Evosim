# Base class for all animals
from abc import ABC, abstractmethod
from .organism import Organism
from components import ComponentType
import numpy as np
import random
import math

class BaseAnimal(Organism):
    def __init__(self, entity, ecosystem):
        super().__init__(entity, ecosystem)
        self.target = None
        self.state = 'idle'
    
    def update(self, dt: float):
        """Update base animal state"""
        super().update(dt)  # Call Organism's update
        
        # Base animal behavior can go here
        if not self.entity.active:
            return
    
    @abstractmethod
    def get_movement_vector(self, nearby_entities):
        """Calculate movement direction based on nearby entities"""
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
    
    def gain_experience(self, amount):
        """Gain experience and grow"""
        self.experience += amount
        
        # Update size based on experience
        appearance = self.entity.get_component(ComponentType.APPEARANCE)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        # Calculate new size based on experience and traits
        base_size = 1.0 + (self.experience * self.growth_rate)
        size_multiplier = traits.size  # Use trait size as a multiplier
        new_size = min(self.max_size, base_size * size_multiplier)
        
        # Update appearance size
        appearance.size = new_size 