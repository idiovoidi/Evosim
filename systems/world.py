from typing import List, Tuple
import numpy as np
from components import ComponentType, Stats, Position, Velocity, Status, Appearance, Genetics
from entities.entity import Entity
from .map_system import WorldMap, TerrainType
from .genetic_system import EnhancedGeneticSystem
from animal_logic.herbivore import Herbivore
from animal_logic.predator import Predator
from systems.event_effect_system import EventEffectSystem
from config import INITIAL_HERBIVORES, INITIAL_PREDATORS, INITIAL_PLANTS
from PyQt6.QtGui import QColor

class World:
    # Define species-specific colors
    SPECIES_COLORS = {
        'herbivore': QColor(150, 200, 150),  # Light green
        'predator': QColor(200, 150, 150),   # Light red
        'plant': QColor(100, 150, 100)       # Dark green
    }
    
    # Define species-specific stats
    SPECIES_STATS = {
        'herbivore': {
            'max_energy': 200,
            'initial_energy': 150,
        },
        'predator': {
            'max_energy': 250,
            'initial_energy': 200,
        },
        'plant': {
            'max_energy': 100,
            'initial_energy': 100,
        }
    }
    
    def __init__(self, width=800, height=600):
        self.width = width
        self.height = height
        self.bounds = (0, width, 0, height)
        self._entities = []  # Private list of entities
        self.quadtree = None  # For spatial partitioning if needed
        self.stats = {}
        self.mouse_pos = (0, 0)  # Initialize mouse position
        
        # Initialize world map
        self.world_map = WorldMap(width=100, height=100, tile_size=50)
        
        self.genetic_system = EnhancedGeneticSystem(self)
        self.effect_system = EventEffectSystem(self)
        self.behaviors = {}  # Maps entities to their behavior controllers
        
    @property
    def entities(self):
        """Public access to entities list"""
        return self._entities
    
    def add_entity(self, entity):
        """Add an entity to the world"""
        self._entities.append(entity)
        
    def remove_entity(self, entity):
        """Remove an entity from the world"""
        if entity in self._entities:
            self._entities.remove(entity)
        if entity in self.behaviors:
            del self.behaviors[entity]
    
    def get_entities(self):
        """Get all active entities"""
        return [e for e in self._entities if e.active]
    
    def get_entities_by_type(self, component_type):
        """Get entities with a specific component type"""
        return [e for e in self._entities if e.active and e.has_component(component_type)]
    
    def update_stats(self):
        """Update world statistics"""
        self.stats = {
            'total_entities': len(self._entities),
            'active_entities': len([e for e in self._entities if e.active]),
            'herbivores': len([e for e in self._entities if e.active and 
                             e.has_component(ComponentType.STATS) and 
                             e.get_component(ComponentType.STATS).species_type == 'herbivore']),
            'predators': len([e for e in self._entities if e.active and 
                            e.has_component(ComponentType.STATS) and 
                            e.get_component(ComponentType.STATS).species_type == 'predator']),
            'plants': len([e for e in self._entities if e.active and 
                         e.has_component(ComponentType.STATS) and 
                         e.get_component(ComponentType.STATS).species_type == 'plant'])
        }
    
    def get_nearby_entities(self, entity, max_distance=200):
        """Get all entities within range, grouped by type"""
        if not entity.has_component(ComponentType.POSITION):
            return {}
            
        entity_pos = entity.get_component(ComponentType.POSITION).value
        nearby = {
            "plants": [],
            "herbivores": [],
            "predators": []
        }
        
        for other in self._entities:
            if not other.active or other == entity:
                continue
                
            if not other.has_component(ComponentType.POSITION):
                continue
                
            other_pos = other.get_component(ComponentType.POSITION).value
            distance = np.linalg.norm(other_pos - entity_pos)
            
            if distance > max_distance:
                continue
                
            # Categorize by type
            if other.has_component(ComponentType.STATS):
                stats = other.get_component(ComponentType.STATS)
                if stats.species_type in nearby:
                    nearby[stats.species_type].append(other)
        
        return nearby
    
    def get_tile_at_position(self, x: float, y: float) -> TerrainType:
        """Get the terrain type at a given world position"""
        if hasattr(self, 'world_map'):
            return self.world_map.get_tile_at_position(x, y)
        return None
    
    def is_valid_position(self, position: np.ndarray) -> bool:
        """Check if a position is within world bounds"""
        return (0 <= position[0] <= self.bounds[1] and 
                0 <= position[1] <= self.bounds[1])
    
    def create_entity(self, emoji: str, x: float, y: float, species_type: str) -> Entity:
        """Create a new entity with all required components"""
        entity = Entity()
        
        # Add basic components
        entity.add_component(ComponentType.POSITION, Position(np.array([x, y], dtype=float)))
        entity.add_component(ComponentType.VELOCITY, Velocity(np.zeros(2)))
        entity.add_component(ComponentType.STATUS, Status())
        
        # Create appearance with species-specific color
        color = self.SPECIES_COLORS.get(species_type, QColor(200, 200, 200))
        appearance = Appearance(emoji, color)
        appearance.size = 1.0
        appearance.layer = 1 if species_type != 'plant' else 0
        entity.add_component(ComponentType.APPEARANCE, appearance)
        
        # Add species-specific stats with initial energy
        species_stats = self.SPECIES_STATS.get(species_type, {
            'max_energy': 100,
            'initial_energy': 100
        })
        stats = Stats(energy=species_stats['initial_energy'])
        stats.species_type = species_type
        stats.max_energy = species_stats['max_energy']
        entity.add_component(ComponentType.STATS, stats)
        
        # Add genetics
        genetics = self.genetic_system.create_initial_genetics(species_type)
        entity.add_component(ComponentType.GENETICS, genetics)
        
        # Check if the spawned position is valid based on terrain type
        tile = self.get_tile_at_position(x, y)
        if tile.terrain_type not in [TerrainType.GRASSLAND, TerrainType.FOREST]:
            return None
        
        # Add behavior controller based on species
        if species_type == "herbivore":
            self.behaviors[entity] = Herbivore(entity, self)
        elif species_type == "predator":
            self.behaviors[entity] = Predator(entity, self)
        
        # Add to world
        self.add_entity(entity)
        
        return entity
    
    def spawn_initial_entities(self):
        """Spawn initial population of entities"""
        # Spawn herbivores
        for _ in range(INITIAL_HERBIVORES):
            x = np.random.uniform(0, self.width * self.world_map.tile_size)
            y = np.random.uniform(0, self.height * self.world_map.tile_size)
            self.create_entity("🐰", x, y, "herbivore")
        
        # Spawn predators
        for _ in range(INITIAL_PREDATORS):
            x = np.random.uniform(0, self.width * self.world_map.tile_size)
            y = np.random.uniform(0, self.height * self.world_map.tile_size)
            self.create_entity("🦊", x, y, "predator")
        
        # Spawn initial plants
        for _ in range(INITIAL_PLANTS):
            x = np.random.uniform(0, self.width * self.world_map.tile_size)
            y = np.random.uniform(0, self.height * self.world_map.tile_size)
            self.create_entity("🌿", x, y, "plant")
    
    def get_behavior(self, entity: Entity):
        """Get the behavior controller for an entity"""
        return self.behaviors.get(entity)
    
    def update(self, dt: float):
        """Update the world state"""
        # Update all behaviors
        for entity, behavior in list(self.behaviors.items()):
            if entity.active:
                behavior.update(dt)
        
        # Clean up dead entities
        for entity in list(self.behaviors.keys()):
            if not entity.active:
                self.remove_entity(entity)
        
        # Update world statistics
        self.update_stats()
    
    def get_mouse_pos(self):
        """Get the current mouse position in world coordinates"""
        return self.mouse_pos
    
    def set_mouse_pos(self, pos):
        """Set the current mouse position in world coordinates"""
        self.mouse_pos = pos