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
        """Update plant growth and spawning"""
        # Count current plants
        plant_count = sum(1 for entity in self.ecosystem.entities 
                         if entity.active and 
                         entity.has_component(ComponentType.STATS) and
                         entity.get_component(ComponentType.STATS).species_type == 'plant')
        
        # Spawn new plants if below threshold
        max_plants = 120  # Maximum number of plants
        spawn_chance = 0.02  # Reduced spawn chance to avoid overwhelming
        
        if plant_count < max_plants and random.random() < spawn_chance:
            # Try to spawn a new plant
            for _ in range(5):  # Try 5 times to find a valid spot
                # Get random tile position
                tile_x = random.randint(0, self.ecosystem.world_map.width - 1)
                tile_y = random.randint(0, self.ecosystem.world_map.height - 1)
                tile = self.ecosystem.world_map.tiles[tile_y][tile_x]
                
                # Only spawn on suitable terrain
                if tile.terrain_type == TerrainType.GRASSLAND:
                    # Calculate world position with some randomness within tile
                    pos_x = tile_x * self.ecosystem.world_map.tile_size + random.uniform(10, self.ecosystem.world_map.tile_size-10)
                    pos_y = tile_y * self.ecosystem.world_map.tile_size + random.uniform(10, self.ecosystem.world_map.tile_size-10)
                    
                    # Create new plant
                    new_plant = self.ecosystem.create_entity('🌿', pos_x, pos_y, 'plant')
                    self.ecosystem.entities.append(new_plant)
                    break
        
        # Update existing plants
        for entity in self.ecosystem.entities:
            if (entity.active and 
                entity.has_component(ComponentType.STATS) and
                entity.get_component(ComponentType.STATS).species_type == 'plant'):
                
                stats = entity.get_component(ComponentType.STATS)
                # Slower energy regeneration
                stats.energy = min(stats.max_energy, stats.energy + dt)