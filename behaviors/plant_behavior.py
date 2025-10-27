"""Plant behavior implementation"""
from .base_behavior import BaseBehavior
from constants import PLANT_GROWTH_RATE


class PlantBehavior(BaseBehavior):
    """Behavior for plant entities - mostly passive growth"""
    
    def __init__(self, entity, world):
        super().__init__(entity, world)
        self.growth_rate = PLANT_GROWTH_RATE
    
    def update(self, dt: float):
        """Update plant - just grow"""
        stats = self.get_stats()
        
        # Grow based on growth rate
        if stats.energy < stats.max_energy:
            stats.energy += self.growth_rate * dt
