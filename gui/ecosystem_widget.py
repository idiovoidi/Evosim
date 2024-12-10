from PyQt6.QtWidgets import QWidget
from PyQt6.QtCore import QTimer
from systems.movement_system import MovementSystem
from systems.health_system import HealthSystem
from systems.rendering_system import RenderingSystem
from systems.ui_system import UISystem
from systems.behavior_system import BehaviorSystem
from systems.plant_system import PlantSystem
from map_system import WorldMap, TerrainType
import random
import numpy as np
from PyQt6.QtGui import QColor
from components import (ComponentType, Position, Velocity, Stats, Status, 
                       Appearance, Memory, Traits, Collision, Genetics)
from entity import Entity
from systems.event_effect_system import EventEffectSystem
from systems.genetic_system import GeneticSystem

class EcosystemWidget(QWidget):
    def __init__(self, log_panel):
        super().__init__()
        self.bounds = (0, 2000)
        self.entities = []
        self.log_panel = log_panel
        self.stats = {}
        
        # Initialize systems
        self.movement_system = MovementSystem(self)
        self.health_system = HealthSystem(self)
        self.behavior_system = BehaviorSystem(self)
        self.ui_system = UISystem(self)
        self.rendering_system = RenderingSystem(self)
        self.plant_system = PlantSystem(self)
        self.effect_system = EventEffectSystem(self)
        self.genetic_system = GeneticSystem(self)
        
        self.systems = [
            self.movement_system,
            self.health_system,
            self.behavior_system,
            self.plant_system,
            self.effect_system,
            self.ui_system,
            self.rendering_system
        ]
        
        # Generate new map
        self.world_map = WorldMap(width=40, height=40, tile_size=50)
        self.log_panel.log("Generated new map")
        
        # Initialize ecosystem
        self.init_ecosystem()
        
        # Setup update timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_simulation)
        self.timer.start(16)
    
    def update_simulation(self):
        """Update simulation with variable time step"""
        dt = self.timer.interval() / 16.0  # Normalize to base interval
        
        # Update all systems except rendering
        for system in self.systems:
            if system is not self.rendering_system:
                system.update(dt)
        
        # Update statistics occasionally
        if random.random() < 0.01:
            self.update_population_stats()
        
        # Trigger repaint
        self.update()
    
    def paintEvent(self, event):
        """Handle paint event using the rendering system"""
        if hasattr(self, 'rendering_system'):
            self.rendering_system.render(self) 
    
    def init_ecosystem(self):
        """Initialize the ecosystem with starting entities"""
        # Initialize plants
        for _ in range(120):
            self.spawn_organism('plant', '🌿')
        
        # Initialize herbivores
        for _ in range(66):
            self.spawn_organism('herbivore', '🐰')
        
        # Initialize predators
        for _ in range(15):
            self.spawn_organism('predator', '🦊')
        
        # Initialize fish in water tiles
        self.spawn_fish()
        
        # Log initialization
        self.log_panel.log("Ecosystem initialized")
        self.update_population_stats()
    
    def spawn_organism(self, species_type, char):
        """Spawn a new organism in a valid location"""
        for _ in range(10):  # Maximum attempts
            if species_type == 'plant':
                # Get random tile position for plants
                tile_x = random.randint(0, self.world_map.width - 1)
                tile_y = random.randint(0, self.world_map.height - 1)
                tile = self.world_map.tiles[tile_y][tile_x]
                
                # Only spawn on grassland
                if tile.terrain_type == TerrainType.GRASSLAND:
                    # Calculate world position with some randomness within tile
                    x = tile_x * self.world_map.tile_size + random.uniform(10, self.world_map.tile_size-10)
                    y = tile_y * self.world_map.tile_size + random.uniform(10, self.world_map.tile_size-10)
                    
                    entity = self.create_entity(char, x, y, species_type)
                    if entity:
                        self.entities.append(entity)
                        return entity
            else:
                # Original logic for animals
                x = random.uniform(*self.bounds)
                y = random.uniform(*self.bounds)
                tile = self.world_map.get_tile_at_position(x, y)
                
                if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                    entity = self.create_entity(char, x, y, species_type)
                    if entity:
                        self.entities.append(entity)
                        return entity
        
        return None
    
    def spawn_fish(self):
        """Spawn fish in water tiles"""
        for y in range(self.world_map.height):
            for x in range(self.world_map.width):
                tile = self.world_map.tiles[y][x]
                if tile.terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                    if random.random() < 0.3:  # 30% chance for each water tile
                        pos_x = x * self.world_map.tile_size + self.world_map.tile_size/2
                        pos_y = y * self.world_map.tile_size + self.world_map.tile_size/2
                        entity = self.create_entity('🐟', pos_x, pos_y, 'fish')
                        self.entities.append(entity)
    
    def create_entity(self, char: str, x: float, y: float, species_type: str) -> Entity:
        """Create a new entity with components"""
        entity = Entity()
        
        # Position component
        entity.add_component(ComponentType.POSITION, 
                        Position(np.array([x, y])))
        
        # Velocity component
        entity.add_component(ComponentType.VELOCITY, 
                        Velocity(np.array([0.0, 0.0])))
        
        # Stats component with proper energy values
        base_energy = {
            'predator': 200.0,
            'herbivore': 150.0,
            'plant': 100.0,
            'fish': 120.0
        }.get(species_type, 100.0)
        
        entity.add_component(ComponentType.STATS, 
                        Stats(energy=base_energy, 
                             max_energy=base_energy * 1.5,
                             species_type=species_type))
        
        # Appearance component
        base_colors = {
            'plant': QColor(50, 205, 50),      # Bright green for plants
            'herbivore': QColor(240, 240, 240), # Light gray/white for rabbits
            'predator': QColor(220, 20, 60),    # Red for predators
            'fish': QColor(70, 130, 180)        # Steel blue for fish
        }
        
        # Special appearance handling for plants
        if species_type == 'plant':
            color = base_colors['plant']
            size = random.uniform(0.8, 1.2)  # Random plant size
        else:
            # Existing color logic for animals...
            if species_type == 'herbivore':
                variation = int(random.uniform(-15, 15))
                base_value = 240
                color = QColor(
                    min(255, max(0, base_value + variation)),
                    min(255, max(0, base_value + variation)),
                    min(255, max(0, base_value + variation))
                )
            else:
                color = base_colors.get(species_type, QColor(128, 128, 128))
            size = 1.0
        
        entity.add_component(ComponentType.APPEARANCE, 
                        Appearance(char=char, color=color, size=size))
        
        # Add components for animals
        if species_type != 'plant':
            entity.add_component(ComponentType.MEMORY, Memory(capacity=10))
            
            base_metabolism = {
                'predator': 0.02,
                'herbivore': 0.03,
                'fish': 0.025
            }.get(species_type, 0.03)
            
            entity.add_component(ComponentType.TRAITS, 
                           Traits(speed=random.uniform(0.05, 0.15),
                                sense_radius=random.uniform(3.0, 7.0),
                                metabolism=random.uniform(base_metabolism, base_metabolism * 1.5),
                                size=random.uniform(0.8, 1.2),
                                aggression=random.uniform(0.0, 1.0),
                                intelligence=random.uniform(0.0, 1.0),
                                memory=random.uniform(0.0, 1.0)))
            
            entity.add_component(ComponentType.STATUS, 
                           Status(is_hungry=False,
                                is_thirsty=False,
                                is_tired=False))
            
            entity.add_component(ComponentType.COLLISION, 
                           Collision(radius=10.0))
        
        # Add genetics component with initial traits
        if species_type in ['predator', 'herbivore']:
            genetics = self.genetic_system.create_initial_genetics(species_type)
            entity.add_component(ComponentType.GENETICS, genetics)
        
        return entity
    
    def update_population_stats(self):
        """Update population statistics based on entities"""
        stats = {
            'plants': 0,
            'herbivores': 0,
            'predators': 0,
            'fish': 0
        }
        
        for entity in self.entities:
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
            
            stats_component = entity.get_component(ComponentType.STATS)
            species_type = stats_component.species_type
            if species_type in stats:
                stats[species_type] += 1
        
        self.stats = {
            **stats,
            'deaths': self.stats.get('deaths', {'starvation': 0})
        }
    
    def kill_entity(self, entity):
        """Handle entity death"""
        if not entity.has_component(ComponentType.STATS):
            return
        
        stats = entity.get_component(ComponentType.STATS)
        pos = entity.get_component(ComponentType.POSITION)
        
        # Only add bones for animals, not plants
        if stats.species_type in ['herbivore', 'predator', 'fish']:
            # Add bones effect at death location
            self.effect_system.add_bones_effect(pos.value)
        
        self.stats['deaths']['starvation'] += 1
        
        # Log death with more information
        self.log_panel.log(
            f"{stats.species_type} died (Energy: {stats.energy:.1f})"
        )
        
        # Remove from entities list and mark as inactive
        entity.destroy()
        if entity in self.entities:
            self.entities.remove(entity)