from abc import ABC, abstractmethod
from typing import Dict, Tuple
import numpy as np
from components import ComponentType, Stats, Position, Velocity, Traits, Status

class Organism(ABC):
    def __init__(self, entity, ecosystem):
        self.entity = entity
        self.ecosystem = ecosystem
        
        # Debug print
        print(f"\nInitializing organism {entity.id}")
        print(f"Has Stats: {entity.has_component(ComponentType.STATS)}")
        print(f"Has Genetics: {entity.has_component(ComponentType.GENETICS)}")
        print(f"Has Traits: {entity.has_component(ComponentType.TRAITS)}")
        
        if entity.has_component(ComponentType.GENETICS):
            genetics = entity.get_component(ComponentType.GENETICS)
            print(f"Genetics: {genetics.genes}")
        
        # Ensure required components exist
        if not entity.has_component(ComponentType.STATS):
            raise ValueError(f"Entity {entity.id} missing required Stats component")
            
        # Initialize traits from genetics if not already present
        if not entity.has_component(ComponentType.TRAITS):
            genetics = entity.get_component(ComponentType.GENETICS)
            if not genetics:
                raise ValueError(f"Entity {entity.id} missing required Genetics component")
                
            # Create traits from genetics
            traits = Traits()
            traits.metabolism = genetics.genes.get('metabolism', 1.0)
            traits.speed = genetics.genes.get('speed', 1.0)
            traits.sense_radius = genetics.genes.get('sense_radius', 1.0)
            if 'attack_strength' in genetics.genes:  # For predators
                traits.attack_strength = genetics.genes.get('attack_strength', 1.0)
            entity.add_component(ComponentType.TRAITS, traits)

    def update(self, dt: float):
        """Update organism state"""
        stats = self.entity.get_component(ComponentType.STATS)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        if not traits:
            raise ValueError(f"Entity {self.entity.id} missing Traits component")
            
        # Apply metabolism
        stats.energy -= traits.metabolism * dt
        
        # Update age
        stats.age += dt
        
        # Check death conditions
        if stats.energy <= 0:
            self.entity.active = False
    
    def can_reproduce(self) -> bool:
        """Check if organism has enough energy to reproduce"""
        stats = self.entity.get_component(ComponentType.STATS)
        return stats.energy >= stats.max_energy * 0.8
    
    def reproduce(self, mate_entity) -> bool:
        """Create offspring with mate"""
        if not self.can_reproduce() or not mate_entity:
            return False
            
        stats = self.entity.get_component(ComponentType.STATS)
        mate_stats = mate_entity.get_component(ComponentType.STATS)
        
        # Verify both parents are ready
        if stats.reproduction_cooldown > 0 or mate_stats.reproduction_cooldown > 0:
            return False
            
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Create offspring position near parent
        offspring_pos = pos.value + np.random.uniform(-20, 20, 2)
        
        # Create new entity
        offspring = self.ecosystem.create_entity(
            self.entity.get_component(ComponentType.APPEARANCE).emoji,
            offspring_pos[0],
            offspring_pos[1],
            stats.species_type
        )
        
        # Mix genetics from parents
        parent1_genetics = self.entity.get_component(ComponentType.GENETICS)
        parent2_genetics = mate_entity.get_component(ComponentType.GENETICS)
        
        offspring_genetics = self.ecosystem.genetic_system.mix_parent_genes(
            self.entity, mate_entity
        )
        
        if offspring_genetics:
            offspring.add_component(ComponentType.GENETICS, offspring_genetics)
            
            # Update parent energy and cooldown
            stats.energy -= 50
            mate_stats.energy -= 50
            stats.reproduction_cooldown = 100
            mate_stats.reproduction_cooldown = 100
            
            return True
            
        return False
    
    @abstractmethod
    def get_movement_vector(self, nearby_entities: Dict[str, list]) -> np.ndarray:
        """Calculate movement direction based on nearby entities"""
        pass 