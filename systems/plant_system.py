"""System for managing plant growth and reproduction"""
from .base_system import BaseSystem
from components import ComponentType
import numpy as np
from constants import PLANT_GROWTH_RATE, PLANT_REPRODUCTION_THRESHOLD


class PlantSystem(BaseSystem):
    """Manages plant growth and reproduction"""
    
    def __init__(self, world):
        super().__init__(world)
        self.growth_rate = PLANT_GROWTH_RATE
        self.reproduction_threshold = PLANT_REPRODUCTION_THRESHOLD
    
    def update(self, dt: float):
        """Update all plants"""
        for entity in self.world.get_entities_by_type(ComponentType.STATS):
            stats = entity.get_component(ComponentType.STATS)
            
            if stats.species_type != 'plant':
                continue
            
            # Grow the plant based on growth rate
            if stats.energy < stats.max_energy:
                stats.energy += self.growth_rate * dt
            
            # Reproduce if energy is high enough
            if stats.energy > self.reproduction_threshold:
                self._reproduce(entity)
                stats.energy = stats.max_energy * 0.5  # Reset to half energy
    
    def _reproduce(self, entity):
        """Reproduce the plant"""
        if not entity.has_component(ComponentType.POSITION):
            return
        
        # Spawn a new plant near the parent
        pos = entity.get_component(ComponentType.POSITION)
        offset = np.random.uniform(-50, 50, size=2)
        new_pos = pos.value + offset
        
        # Ensure new position is within bounds
        new_pos[0] = np.clip(new_pos[0], 0, self.world.map_width)
        new_pos[1] = np.clip(new_pos[1], 0, self.world.map_height)
        
        # Create a new plant entity
        new_plant = self.world.create_entity("🌿", new_pos[0], new_pos[1], "plant")
        
        if new_plant:
            # Set initial energy for offspring
            new_stats = new_plant.get_component(ComponentType.STATS)
            new_stats.energy = new_stats.max_energy * 0.5