"""Predator behavior implementation"""
import numpy as np

from .base_behavior import BaseBehavior
from components import ComponentType
from constants import (
    PREDATOR_WANDER_SPEED, PREDATOR_CHASE_SPEED,
    PREDATOR_ATTACK_RANGE, PREDATOR_HUNT_RANGE
)


class PredatorBehavior(BaseBehavior):
    """Behavior for predator entities"""
    
    def __init__(self, entity, world):
        super().__init__(entity, world)
        self.wander_timer = 0
        self.attack_range = PREDATOR_ATTACK_RANGE
        self.wander_speed = PREDATOR_WANDER_SPEED
        self.chase_speed = PREDATOR_CHASE_SPEED
        self.hunt_range = PREDATOR_HUNT_RANGE
    
    def update(self, dt: float):
        """Update predator behavior"""
        pos = self.get_position()
        stats = self.get_stats()
        
        # Get nearby entities
        nearby = self.world.get_nearby_entities(self.entity, self.hunt_range)
        
        # Priority 1: Hunt herbivores
        if self._hunt_prey(nearby['herbivores']):
            return
        
        # Priority 2: Wander
        self._wander(dt)
    
    def _hunt_prey(self, herbivores: list) -> bool:
        """Hunt nearby herbivores"""
        pos = self.get_position()
        stats = self.get_stats()
        traits = self.get_traits()
        
        for prey in herbivores:
            prey_pos = prey.get_component(ComponentType.POSITION).value
            distance = np.linalg.norm(prey_pos - pos)
            
            if distance < self.attack_range:
                # Attack the prey
                prey_stats = prey.get_component(ComponentType.STATS)
                attack_damage = 50 * traits.attack_strength
                energy_gain = min(50, prey_stats.energy)
                
                stats.energy += energy_gain
                prey_stats.energy -= attack_damage
                
                # Add eating effect
                if hasattr(self.world, 'effect_system'):
                    self.world.effect_system.add_eat_effect(pos)
                
                return True
            
            # Chase prey
            self.move_towards(prey_pos, self.chase_speed)
            
            # Add randomness to make hunting more interesting
            vel = self.get_velocity()
            vel += np.random.normal(0, 10, 2)
            self.set_velocity(vel)
            
            return True
        
        return False
    
    def _wander(self, dt: float):
        """Wander randomly"""
        self.wander_timer -= dt
        if self.wander_timer <= 0:
            self.wander(self.wander_speed)
            self.wander_timer = np.random.uniform(1, 3)
