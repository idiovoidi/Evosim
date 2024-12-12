from components import ComponentType
from animal_logic.herbivore import Herbivore
from animal_logic.predator import Predator
from animal_logic.fish import Fish
import random
import numpy as np
from .base_system import BaseSystem

class BehaviorSystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.behaviors = {}  # Store behavior instances for each entity
    
    def update(self, dt: float):
        """Update behaviors for all entities"""
        for entity in self.world.get_entities():
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
            
            # Update age
            stats = entity.get_component(ComponentType.STATS)
            stats.age += dt
            
            # Get or create behavior instance for this entity
            if entity.id not in self.behaviors:
                self.create_behavior(entity)
            
            # Update behavior
            if entity.id in self.behaviors:
                behavior = self.behaviors[entity.id]
                behavior.update(dt)
                
                # Update status effects
                if entity.has_component(ComponentType.STATUS):
                    status = entity.get_component(ComponentType.STATUS)
                    stats = entity.get_component(ComponentType.STATS)
                    status.is_hungry = stats.energy < stats.max_energy * 0.3
    
    def create_behavior(self, entity):
        """Create appropriate behavior based on entity type"""
        stats = entity.get_component(ComponentType.STATS)
        
        if stats.species_type == 'herbivore':
            self.behaviors[entity.id] = Herbivore(entity, self.world)
        elif stats.species_type == 'predator':
            self.behaviors[entity.id] = Predator(entity, self.world)
        elif stats.species_type == 'fish':
            self.behaviors[entity.id] = Fish(entity, self.world) 