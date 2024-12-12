from .base_system import BaseSystem
from components import ComponentType, Stats, Position
import numpy as np

class PlantSystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.growth_rate = 0.1
    
    def update(self, dt: float):
        """Update all plants"""
        for entity in self.world.get_entities_by_type(ComponentType.STATS):
            stats = entity.get_component(ComponentType.STATS)
            
            if stats.species_type != 'plant':
                continue
            
            # Grow the plant based on growth rate
            stats.energy += self.growth_rate * dt
            
            # Reproduce if energy is high enough
            if stats.energy > 200:
                self.reproduce(entity)
                stats.energy = 100
    
    def reproduce(self, entity):
        """Reproduce the plant"""
        if not entity.has_component(ComponentType.POSITION):
            return
        
        # Spawn a new plant near the parent
        pos = entity.get_component(ComponentType.POSITION)
        new_pos = pos.value + np.random.uniform(-50, 50, size=2)
        
        # Create a new plant entity
        new_plant = self.world.create_entity("🌿", new_pos[0], new_pos[1], "plant")
        
        # Inherit some properties from the parent
        new_plant.get_component(ComponentType.STATS).energy = 100