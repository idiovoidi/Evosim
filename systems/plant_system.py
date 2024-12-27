from typing import Dict, Any, List
from components import ComponentType, Stats, Position
import numpy as np
from .base_system import BaseSystem
import random

class PlantSystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.spawn_timer = 0
        self.spawn_interval = 2.0  # Spawn new plant every 2 seconds
        
    def update(self, dt: float) -> Dict[str, Any]:
        spawned_plants = []
        grown_plants = []
        
        # Update existing plants
        for entity in self.world.get_entities_by_type(ComponentType.STATS):
            if not entity.active:
                continue
                
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type != 'plant':
                continue
            
            # Grow plants over time
            if stats.energy < stats.max_energy:
                growth = 5 * dt  # Growth rate
                stats.energy = min(stats.energy + growth, stats.max_energy)
                grown_plants.append({
                    'entity_id': entity.id,
                    'energy': stats.energy
                })
        
        # Spawn new plants
        self.spawn_timer += dt
        if self.spawn_timer >= self.spawn_interval:
            self.spawn_timer = 0
            
            if len(self.world.get_entities_by_type(ComponentType.STATS)) < 100:  # Plant limit
                new_plant = self._spawn_plant()
                if new_plant:
                    spawned_plants.append({
                        'entity_id': new_plant.id,
                        'position': {
                            'x': float(new_plant.get_component(ComponentType.POSITION).value[0]),
                            'y': 0,
                            'z': float(new_plant.get_component(ComponentType.POSITION).value[1])
                        },
                        'energy': new_plant.get_component(ComponentType.STATS).energy
                    })
        
        return {
            'spawned_plants': spawned_plants,
            'grown_plants': grown_plants
        }
    
    def _spawn_plant(self) -> Any:
        """Spawn a new plant at a random valid location"""
        for _ in range(10):  # Try 10 times to find valid spot
            pos = np.array([
                random.uniform(0, self.world.bounds[0]),
                random.uniform(0, self.world.bounds[1])
            ])
            
            # Check if position is valid (not in water, not too close to other plants)
            if self._is_valid_plant_position(pos):
                return self.world.create_entity("🌿", pos[0], pos[1], "plant")
        return None
    
    def _is_valid_plant_position(self, pos: np.ndarray) -> bool:
        """Check if position is valid for plant spawning"""
        # Get terrain type at position
        tile = self.world.world_map.get_tile_at_position(pos)
        if not tile or tile.terrain_type.value in ['deep_water', 'shallow_water']:
            return False
        
        # Check distance to other plants
        for entity in self.world.get_entities_by_type(ComponentType.STATS):
            if not entity.active:
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type != 'plant':
                continue
            
            other_pos = entity.get_component(ComponentType.POSITION).value
            if np.linalg.norm(pos - other_pos) < 5:  # Minimum spacing
                return False
        
        return True