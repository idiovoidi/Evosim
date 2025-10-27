"""Plant behavior implementation"""
from .base_behavior import BaseBehavior
from constants import PLANT_GROWTH_RATE
from components import ComponentType
import numpy as np


class PlantBehavior(BaseBehavior):
    """Behavior for plant entities - mostly passive growth"""
    
    def __init__(self, entity, world):
        super().__init__(entity, world)
        self.growth_rate = PLANT_GROWTH_RATE
        
        # Ensure plant velocity is always zero
        if entity.has_component(ComponentType.VELOCITY):
            vel = entity.get_component(ComponentType.VELOCITY)
            vel.value = np.zeros(2)
    
    def update(self, dt: float):
        """Update plant - just grow"""
        stats = self.get_stats()
        
        # Grow based on growth rate
        if stats.energy < stats.max_energy:
            stats.energy += self.growth_rate * dt
        
        # Ensure plant stays stationary (in case something tries to move it)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        if vel is not None:
            vel.value = np.zeros(2)
