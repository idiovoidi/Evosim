"""Base behavior class for all entities"""
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING
import numpy as np

from components import ComponentType

if TYPE_CHECKING:
    from entities.entity import Entity
    from systems.world import World


class BaseBehavior(ABC):
    """Base class for all entity behaviors"""
    
    def __init__(self, entity: 'Entity', world: 'World'):
        self.entity = entity
        self.world = world
        self._validate_components()
    
    def _validate_components(self):
        """Ensure entity has required components"""
        required = [ComponentType.POSITION, ComponentType.VELOCITY, ComponentType.STATS]
        for component_type in required:
            if not self.entity.has_component(component_type):
                raise ValueError(
                    f"Entity {self.entity.id} missing required component: {component_type}"
                )
    
    @abstractmethod
    def update(self, dt: float):
        """Update behavior logic - must be implemented by subclasses"""
        pass
    
    def get_position(self) -> np.ndarray:
        """Get entity position"""
        return self.entity.get_component(ComponentType.POSITION).value
    
    def get_velocity(self) -> np.ndarray:
        """Get entity velocity"""
        return self.entity.get_component(ComponentType.VELOCITY).value
    
    def set_velocity(self, velocity: np.ndarray):
        """Set entity velocity"""
        vel = self.entity.get_component(ComponentType.VELOCITY)
        vel.value = velocity
        vel.clamp_velocity()
    
    def get_stats(self):
        """Get entity stats"""
        return self.entity.get_component(ComponentType.STATS)
    
    def get_traits(self):
        """Get entity traits"""
        return self.entity.get_component(ComponentType.TRAITS)
    
    def move_towards(self, target_pos: np.ndarray, speed: float):
        """Move entity towards a target position"""
        pos = self.get_position()
        direction = target_pos - pos
        distance = np.linalg.norm(direction)
        
        if distance > 0:
            direction = direction / distance
            # Add slight randomness for natural movement
            direction += np.random.normal(0, 0.1, 2)
            direction = direction / np.linalg.norm(direction)
            
            traits = self.get_traits()
            actual_speed = speed * traits.speed
            self.set_velocity(direction * actual_speed)
    
    def move_away_from(self, target_pos: np.ndarray, speed: float):
        """Move entity away from a target position"""
        pos = self.get_position()
        direction = pos - target_pos
        distance = np.linalg.norm(direction)
        
        if distance > 0:
            direction = direction / distance
            traits = self.get_traits()
            actual_speed = speed * traits.speed
            self.set_velocity(direction * actual_speed)
    
    def wander(self, speed: float):
        """Random wandering movement"""
        angle = np.random.uniform(0, 2 * np.pi)
        direction = np.array([np.cos(angle), np.sin(angle)])
        
        traits = self.get_traits()
        actual_speed = speed * traits.speed
        self.set_velocity(direction * actual_speed)
