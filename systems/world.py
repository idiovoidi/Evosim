from typing import List, Tuple, Optional
import numpy as np

from components import ComponentType
from entities.entity import Entity
from .map_system import WorldMap, TerrainType
from .genetic_system import EnhancedGeneticSystem
from systems.event_effect_system import EventEffectSystem
from constants import (
    INITIAL_HERBIVORES, INITIAL_PREDATORS, INITIAL_PLANTS,
    DEFAULT_MAP_TILES_X, DEFAULT_MAP_TILES_Y, DEFAULT_TILE_SIZE
)
from factories.entity_factory import EntityFactory
from behaviors import HerbivoreBehavior, PredatorBehavior, PlantBehavior

class World:
    """Main world class managing entities, map, and simulation state"""
    
    # Valid terrain types for each species
    VALID_TERRAINS = {
        "plant": [TerrainType.GRASSLAND, TerrainType.FOREST, TerrainType.DENSE_GRASS],
        "herbivore": [TerrainType.GRASSLAND, TerrainType.SAVANNA, TerrainType.DENSE_GRASS],
        "predator": [TerrainType.GRASSLAND, TerrainType.FOREST, TerrainType.SAVANNA]
    }
    
    # Behavior classes for each species
    BEHAVIOR_CLASSES = {
        'herbivore': HerbivoreBehavior,
        'predator': PredatorBehavior,
        'plant': PlantBehavior
    }
    
    def __init__(self, width: int = 800, height: int = 600):
        self.width = width
        self.height = height
        
        # Initialize world map
        print(f"Creating map with dimensions: {DEFAULT_MAP_TILES_X}x{DEFAULT_MAP_TILES_Y} tiles")
        self.world_map = WorldMap(
            width=DEFAULT_MAP_TILES_X,
            height=DEFAULT_MAP_TILES_Y,
            tile_size=DEFAULT_TILE_SIZE
        )
        
        # Calculate actual world size in pixels
        self.map_width = self.world_map.width * self.world_map.tile_size
        self.map_height = self.world_map.height * self.world_map.tile_size
        self.bounds = (0, self.map_width, 0, self.map_height)
        
        print(f"Map size in pixels: {self.map_width}x{self.map_height}")
        
        # Initialize entity management
        self._entities: List[Entity] = []
        self.behaviors = {}
        
        # Initialize subsystems
        self.genetic_system = EnhancedGeneticSystem(self)
        self.effect_system = EventEffectSystem(self)
        
        # World state
        self.stats = {}
        self.mouse_pos = (0, 0)
        self.quadtree = None
    
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
    
    def create_entity(self, emoji: str, x: float, y: float, species_type: str) -> Optional[Entity]:
        """
        Create a new entity with all required components
        
        Args:
            emoji: Display character (unused, kept for compatibility)
            x: X world coordinate
            y: Y world coordinate
            species_type: Type of species to create
            
        Returns:
            Created entity or None if position is invalid
        """
        # Validate position based on terrain type
        if not self._is_valid_spawn_position(x, y, species_type):
            return None
        
        # Create entity using factory
        entity = EntityFactory.create_entity(species_type, (x, y))
        
        # Create and attach behavior
        behavior_class = self.BEHAVIOR_CLASSES.get(species_type)
        if behavior_class:
            self.behaviors[entity] = behavior_class(entity, self)
        
        # Add to world
        self.add_entity(entity)
        
        return entity
    
    def _is_valid_spawn_position(self, x: float, y: float, species_type: str) -> bool:
        """Check if a position is valid for spawning a species"""
        tile = self.get_tile_at_position(x, y)
        if not tile:
            return False
        
        valid_terrains = self.VALID_TERRAINS.get(species_type, [TerrainType.GRASSLAND])
        return tile.terrain_type in valid_terrains
    
    def spawn_initial_entities(self):
        """Spawn initial population of entities"""
        def find_valid_spawn_location(species_type):
            max_attempts = 20  # Increased attempts
            valid_terrains = {
                "plant": [TerrainType.GRASSLAND, TerrainType.FOREST, TerrainType.DENSE_GRASS],
                "herbivore": [TerrainType.GRASSLAND, TerrainType.SAVANNA, TerrainType.DENSE_GRASS],
                "predator": [TerrainType.GRASSLAND, TerrainType.FOREST, TerrainType.SAVANNA]
            }
            
            for _ in range(max_attempts):
                # Generate position within map bounds with margin
                margin = self.world_map.tile_size * 2  # Two tiles margin from edges
                x = np.random.uniform(margin, self.map_width - margin)
                y = np.random.uniform(margin, self.map_height - margin)
                
                # Check if position is on valid terrain
                tile = self.world_map.get_tile_at_position(x, y)
                if tile and tile.terrain_type in valid_terrains.get(species_type, [TerrainType.GRASSLAND]):
                    return x, y
            return None

        def spawn_entity_in_valid_location(emoji, species_type):
            location = find_valid_spawn_location(species_type)
            if location:
                x, y = location
                entity = self.create_entity(emoji, x, y, species_type)
                if entity:
                    print(f"Spawned {species_type} at ({x:.1f}, {y:.1f}) on {self.world_map.get_tile_at_position(x, y).terrain_type.name}")
                    return True
            return False

        # Spawn entities with progress tracking
        spawn_config = [
            ("herbivore", INITIAL_HERBIVORES, "🐰"),
            ("predator", INITIAL_PREDATORS, "🦊"),
            ("plant", INITIAL_PLANTS, "🌿")
        ]
        
        for species_type, count, emoji in spawn_config:
            spawned = 0
            attempts = 0
            max_attempts = count * 2  # Allow more attempts than needed
            
            print(f"\nSpawning {count} {species_type}s...")
            while spawned < count and attempts < max_attempts:
                if spawn_entity_in_valid_location(emoji, species_type):
                    spawned += 1
                attempts += 1
            
            print(f"Successfully spawned {spawned}/{count} {species_type}s after {attempts} attempts")
    
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