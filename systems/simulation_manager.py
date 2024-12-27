from typing import Dict, List, Optional
import asyncio
import numpy as np
from dataclasses import dataclass
from .world import World

@dataclass
class SimulationState:
    entities: List[Dict]
    terrain: Dict
    statistics: Dict

class SimulationManager:
    def __init__(self, sim_id: str):
        self.id = sim_id
        self.world = World()
        self.running = False
        self.speed_multiplier = 1.0
        self.tick_rate = 1/60  # 60 FPS base rate
        
    def update(self) -> SimulationState:
        """Update simulation and return current state"""
        if not self.running:
            return
            
        # Update world systems
        self.world.update(self.tick_rate * self.speed_multiplier)
        
        # Convert state to JSON-serializable format
        return self.get_state()
    
    def get_state(self) -> SimulationState:
        """Get current simulation state in a format suitable for network transmission"""
        entities = []
        
        for entity in self.world.get_entities():
            entity_data = {
                'id': entity.id,
                'type': entity.get_component('stats').species_type,
                'position': {
                    'x': float(entity.get_component('position').value[0]),
                    'y': 0,  # Height in 3D space
                    'z': float(entity.get_component('position').value[1])
                },
                'rotation': 0,  # Add rotation for 3D
                'stats': {
                    'energy': entity.get_component('stats').energy,
                    'health': entity.get_component('stats').health
                }
            }
            entities.append(entity_data)
        
        # Get terrain data
        terrain = {
            'size': {
                'width': self.world.map_width,
                'height': self.world.map_height
            },
            'tiles': self.get_terrain_data()
        }
        
        # Get statistics
        statistics = {
            'population': {
                'herbivores': len([e for e in entities if e['type'] == 'herbivore']),
                'predators': len([e for e in entities if e['type'] == 'predator']),
                'plants': len([e for e in entities if e['type'] == 'plant'])
            }
        }
        
        return SimulationState(
            entities=entities,
            terrain=terrain,
            statistics=statistics
        )
    
    def get_terrain_data(self) -> List[Dict]:
        """Convert terrain data to network-friendly format"""
        terrain_data = []
        
        for y in range(self.world.world_map.height):
            for x in range(self.world.world_map.width):
                tile = self.world.world_map.tiles[y][x]
                terrain_data.append({
                    'x': x,
                    'z': y,  # y becomes z in 3D space
                    'type': tile.terrain_type.name,
                    'height': tile.properties.elevation,
                    'resources': tile.current_resources
                })
        
        return terrain_data
    
    def set_speed(self, speed: float) -> None:
        """Set simulation speed multiplier"""
        self.speed_multiplier = max(0.1, min(10.0, speed))
    
    def start(self) -> None:
        """Start the simulation"""
        self.running = True
    
    def stop(self) -> None:
        """Stop the simulation"""
        self.running = False 