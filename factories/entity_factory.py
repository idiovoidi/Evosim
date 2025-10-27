"""Factory for creating entities with proper component initialization"""
from typing import Optional, Tuple
import numpy as np
from PyQt6.QtGui import QColor

from entities.entity import Entity
from components import (
    ComponentType, Position, Velocity, Appearance, Stats, 
    Status, Genetics, Traits
)
from constants import (
    HERBIVORE_MAX_ENERGY, PREDATOR_MAX_ENERGY, PLANT_MAX_ENERGY
)


class EntityFactory:
    """Factory class for creating properly initialized entities"""
    
    # Species-specific configurations
    SPECIES_CONFIG = {
        'herbivore': {
            'emoji': '🐰',
            'color': QColor(150, 200, 150),
            'max_energy': HERBIVORE_MAX_ENERGY,
            'initial_energy': 150,
            'layer': 1,
        },
        'predator': {
            'emoji': '🦊',
            'color': QColor(200, 150, 150),
            'max_energy': PREDATOR_MAX_ENERGY,
            'initial_energy': 200,
            'layer': 1,
        },
        'plant': {
            'emoji': '🌿',
            'color': QColor(100, 150, 100),
            'max_energy': PLANT_MAX_ENERGY,
            'initial_energy': 100,
            'layer': 0,
        }
    }
    
    @classmethod
    def create_entity(
        cls,
        species_type: str,
        position: Tuple[float, float],
        genetics: Optional[Genetics] = None
    ) -> Entity:
        """
        Create a new entity with all required components
        
        Args:
            species_type: Type of species ('herbivore', 'predator', 'plant')
            position: (x, y) world coordinates
            genetics: Optional genetics component (will be generated if not provided)
            
        Returns:
            Fully initialized Entity
        """
        if species_type not in cls.SPECIES_CONFIG:
            raise ValueError(f"Unknown species type: {species_type}")
        
        config = cls.SPECIES_CONFIG[species_type]
        entity = Entity()
        
        # Add position and velocity
        entity.add_component(
            ComponentType.POSITION,
            Position(np.array([position[0], position[1]], dtype=float))
        )
        entity.add_component(
            ComponentType.VELOCITY,
            Velocity(np.zeros(2))
        )
        
        # Add appearance
        appearance = Appearance(
            char=config['emoji'],
            color=config['color'],
            size=1.0,
            visible=True,
            layer=config['layer']
        )
        entity.add_component(ComponentType.APPEARANCE, appearance)
        
        # Add stats
        stats = Stats(
            energy=config['initial_energy'],
            max_energy=config['max_energy'],
            species_type=species_type,
            health=100.0,
            max_health=100.0,
            age=0,
            reproduction_cooldown=0,
            showing_heart=0
        )
        entity.add_component(ComponentType.STATS, stats)
        
        # Add status
        entity.add_component(ComponentType.STATUS, Status())
        
        # Add genetics (generate if not provided)
        if genetics is None:
            genetics = cls._generate_genetics(species_type)
        entity.add_component(ComponentType.GENETICS, genetics)
        
        # Add traits based on genetics
        traits = cls._create_traits_from_genetics(genetics, species_type)
        entity.add_component(ComponentType.TRAITS, traits)
        
        return entity
    
    @classmethod
    def _generate_genetics(cls, species_type: str) -> Genetics:
        """Generate random genetics for a species"""
        import random
        
        # Define genes based on species type
        if species_type == 'herbivore':
            genes = {
                'body_length': random.uniform(0.85, 1.15),
                'body_width': random.uniform(0.9, 1.1),
                'head_size': random.uniform(0.9, 1.1),
                'snout_length': random.uniform(0.8, 1.2),
                'ear_length': random.uniform(0.8, 1.2),
                'tail_length': random.uniform(0.8, 1.2),
                'speed': random.uniform(0.7, 1.3),
                'sense_radius': random.uniform(0.8, 1.2),
                'metabolism': random.uniform(0.9, 1.1),
                'color_brightness': random.uniform(0.9, 1.1),
            }
        elif species_type == 'predator':
            genes = {
                'body_length': random.uniform(0.9, 1.1),
                'body_width': random.uniform(0.9, 1.1),
                'head_size': random.uniform(0.9, 1.1),
                'snout_length': random.uniform(0.8, 1.2),
                'tail_length': random.uniform(0.8, 1.2),
                'speed': random.uniform(0.8, 1.4),
                'sense_radius': random.uniform(0.9, 1.3),
                'metabolism': random.uniform(0.8, 1.2),
                'attack_strength': random.uniform(0.8, 1.2),
            }
        else:  # plant
            genes = {
                'growth_rate': random.uniform(0.8, 1.2),
                'max_size': random.uniform(0.9, 1.1),
            }
        
        return Genetics(genes)
    
    @classmethod
    def _create_traits_from_genetics(cls, genetics: Genetics, species_type: str) -> Traits:
        """Create traits component from genetics"""
        traits = Traits()
        
        # Map genetic values to traits
        traits.metabolism = genetics.genes.get('metabolism', 1.0)
        traits.speed = genetics.genes.get('speed', 1.0)
        traits.sense_radius = genetics.genes.get('sense_radius', 1.0)
        
        if species_type == 'predator':
            traits.attack_strength = genetics.genes.get('attack_strength', 1.0)
        
        return traits
