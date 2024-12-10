from components import ComponentType
from map_system import TerrainType
import random
import numpy as np

class PlantSystem:
    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        self.growth_timer = 0
        self.growth_interval = 60  # Try to grow plants every 60 frames
    
    def update(self, dt):
        """Update plant growth"""
        self.growth_timer += 1
        
        if self.growth_timer >= self.growth_interval:
            self.growth_timer = 0
            self.try_grow_plants()
    
    def try_grow_plants(self):
        """Attempt to grow new plants on suitable tiles"""
        world_map = self.ecosystem.world_map
        
        # Count current plants
        plant_count = sum(1 for entity in self.ecosystem.entities 
                         if entity.active and 
                         entity.has_component(ComponentType.STATS) and
                         entity.get_component(ComponentType.STATS).species_type == 'plant')
        
        # Don't grow if too many plants
        if plant_count > world_map.width * world_map.height * 0.1:  # Max 10% coverage
            return
        
        # Try to grow plants
        for y in range(world_map.height):
            for x in range(world_map.width):
                tile = world_map.tiles[y][x]
                
                # Only grow on suitable terrain
                if (tile.terrain_type == TerrainType.GRASSLAND and 
                    random.random() < 0.01 * tile.TERRAIN_PROPERTIES[tile.terrain_type].fertility):
                    
                    # Calculate world position
                    pos_x = x * world_map.tile_size + random.uniform(0, world_map.tile_size)
                    pos_y = y * world_map.tile_size + random.uniform(0, world_map.tile_size)
                    
                    # Create new plant
                    plant = self.ecosystem.create_entity('🌿', pos_x, pos_y, 'plant')
                    if plant:
                        self.ecosystem.entities.append(plant) 