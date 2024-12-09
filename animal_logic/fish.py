from .base_animal import BaseAnimal
from components import ComponentType
import numpy as np
import random
from map_system import TerrainType

class Fish(BaseAnimal):
    def update(self):
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Check if in water
        tile = self.ecosystem.world_map.get_tile_at_position(pos.value[0], pos.value[1])
        if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
            # Try to find nearby water
            water_pos = self.find_nearest_water()
            if water_pos is not None:
                direction = water_pos - pos.value
                if np.linalg.norm(direction) > 0:
                    direction = direction / np.linalg.norm(direction)
                    vel = self.entity.get_component(ComponentType.VELOCITY)
                    vel.value = direction * self.entity.get_component(ComponentType.TRAITS).speed * 5
            else:
                # Fish dies if can't find water
                self.ecosystem.kill_entity(self.entity)
                return
        
        # Random movement in water
        if random.random() < 0.05:
            self.random_movement()
    
    def find_nearest_water(self):
        """Find nearest water tile center"""
        pos = self.entity.get_component(ComponentType.POSITION)
        center_x = int(pos.value[0] / self.ecosystem.world_map.tile_size)
        center_y = int(pos.value[1] / self.ecosystem.world_map.tile_size)
        
        min_dist = float('inf')
        nearest_pos = None
        
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                x = center_x + dx
                y = center_y + dy
                if (0 <= x < self.ecosystem.world_map.width and 
                    0 <= y < self.ecosystem.world_map.height):
                    tile = self.ecosystem.world_map.tiles[y][x]
                    if tile.terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                        water_pos = np.array([
                            x * self.ecosystem.world_map.tile_size + self.ecosystem.world_map.tile_size/2,
                            y * self.ecosystem.world_map.tile_size + self.ecosystem.world_map.tile_size/2
                        ])
                        dist = np.linalg.norm(water_pos - pos.value)
                        if dist < min_dist:
                            min_dist = dist
                            nearest_pos = water_pos
        
        return nearest_pos 