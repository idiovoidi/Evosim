from components import ComponentType
from systems.map_system import TerrainType
from systems.base_system import BaseSystem
import random
import numpy as np

class PlantSystem(BaseSystem):
    def __init__(self, ecosystem):
        super().__init__(ecosystem)
        self.growth_rate = 0.1
        self.spread_chance = 0.01
        self.max_plants_per_tile = 5
    
    def update(self, dt: float):
        # Grow existing plants
        for entity in self.ecosystem.world.get_entities_by_type(ComponentType.STATS):
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type == 'plant':
                stats.energy += self.growth_rate * dt
                if stats.energy > stats.max_energy:
                    stats.energy = stats.max_energy
        
        # Spawn new plants
        if random.random() < self.spread_chance:
            tile_x = random.randint(0, self.ecosystem.world.world_map.width - 1)
            tile_y = random.randint(0, self.ecosystem.world.world_map.height - 1)
            
            # Check if the tile is suitable for a new plant
            tile = self.ecosystem.world.world_map.tiles[tile_y][tile_x]
            if tile.terrain_type in [TerrainType.GRASSLAND, TerrainType.FOREST] and tile.current_food > 0:
                # Count existing plants on the tile
                plant_count = len([e for e in self.ecosystem.world.get_entities_by_type(ComponentType.STATS) 
                                   if e.get_component(ComponentType.STATS).species_type == 'plant' and
                                      e.get_component(ComponentType.POSITION).value[0] // self.ecosystem.world.world_map.tile_size == tile_x and
                                      e.get_component(ComponentType.POSITION).value[1] // self.ecosystem.world.world_map.tile_size == tile_y])
                
                if plant_count < self.max_plants_per_tile:
                    # Spawn a new plant
                    x = (tile_x + random.random()) * self.ecosystem.world.world_map.tile_size
                    y = (tile_y + random.random()) * self.ecosystem.world.world_map.tile_size
                    self.ecosystem.create_entity("🌿", x, y, "plant")