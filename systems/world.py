from typing import List, Optional, Tuple, Dict
import numpy as np
from .map_system import WorldMap
from components import Entity

class World:
    def __init__(self, width: int = 800, height: int = 600):
        self.width = width
        self.height = height
        
        # Initialize map
        self.world_map = WorldMap(
            width=50,  # Fixed number of tiles
            height=40
        )
        
        # Calculate actual world size
        self.map_width = self.world_map.width * self.world_map.tile_size
        self.map_height = self.world_map.height * self.world_map.tile_size
        
        # Entity storage
        self._entities: List[Entity] = []
        self.stats = {}
        
        # Initialize systems
        self.initialize_systems()
    
    def initialize_systems(self) -> None:
        """Initialize simulation systems without GUI dependencies"""
        from .movement_system import MovementSystem
        from .health_system import HealthSystem
        from .behavior_system import BehaviorSystem
        from .plant_system import PlantSystem
        
        self.systems = [
            MovementSystem(self),
            HealthSystem(self),
            BehaviorSystem(self),
            PlantSystem(self)
        ]
    
    def update(self, dt: float) -> None:
        """Update world state"""
        # Update all systems
        for system in self.systems:
            system.update(dt)
        
        # Update statistics
        self.update_stats()
    
    def get_entity_data(self) -> List[Dict]:
        """Get entity data in a format suitable for network transmission"""
        entity_data = []
        
        for entity in self._entities:
            if not entity.active:
                continue
                
            data = {
                'id': entity.id,
                'type': entity.get_component('stats').species_type,
                'position': {
                    'x': float(entity.get_component('position').value[0]),
                    'y': 0,  # Height in 3D space
                    'z': float(entity.get_component('position').value[1])
                }
            }
            
            if entity.has_component('stats'):
                stats = entity.get_component('stats')
                data['stats'] = {
                    'energy': stats.energy,
                    'health': stats.health
                }
            
            entity_data.append(data)
        
        return entity_data
    
    def get_entities(self) -> List[Entity]:
        """Get all active entities"""
        return [e for e in self._entities if e.active]