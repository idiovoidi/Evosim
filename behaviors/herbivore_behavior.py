"""Herbivore behavior implementation"""
import numpy as np

from .base_behavior import BaseBehavior
from components import ComponentType
from constants import (
    HERBIVORE_WANDER_SPEED, HERBIVORE_CHASE_SPEED,
    HERBIVORE_EATING_RANGE, FLEE_RANGE
)


class HerbivoreBehavior(BaseBehavior):
    """Behavior for herbivore entities"""
    
    def __init__(self, entity, world):
        super().__init__(entity, world)
        self.wander_timer = 0
        self.eating_range = HERBIVORE_EATING_RANGE
        self.wander_speed = HERBIVORE_WANDER_SPEED
        self.chase_speed = HERBIVORE_CHASE_SPEED
        self.flee_range = FLEE_RANGE
    
    def update(self, dt: float):
        """Update herbivore behavior"""
        stats = self.get_stats()
        pos = self.get_position()
        
        # Get nearby entities
        nearby = self.world.get_nearby_entities(self.entity, 200)
        
        # Priority 1: Run from predators
        if self._flee_from_predators(nearby['predators']):
            return
        
        # Priority 2: Look for food if hungry
        if stats.energy < stats.max_energy * 0.7:
            if self._seek_food(nearby['plants']):
                return
        
        # Priority 3: Wander
        self._wander(dt)
    
    def _flee_from_predators(self, predators: list) -> bool:
        """Flee from nearby predators"""
        pos = self.get_position()
        
        for predator in predators:
            pred_pos = predator.get_component(ComponentType.POSITION).value
            distance = np.linalg.norm(pred_pos - pos)
            
            if distance < self.flee_range:
                self.move_away_from(pred_pos, self.chase_speed)
                return True
        
        return False
    
    def _seek_food(self, plants: list) -> bool:
        """Seek and eat nearby plants"""
        pos = self.get_position()
        stats = self.get_stats()
        
        for plant in plants:
            plant_pos = plant.get_component(ComponentType.POSITION).value
            distance = np.linalg.norm(plant_pos - pos)
            
            if distance < self.eating_range:
                # Eat the plant
                plant_stats = plant.get_component(ComponentType.STATS)
                energy_gain = min(30, plant_stats.energy)
                stats.energy += energy_gain
                plant_stats.energy -= energy_gain
                
                # Add eating effect
                if hasattr(self.world, 'effect_system'):
                    self.world.effect_system.add_eat_effect(pos)
                
                return True
            
            # Move towards plant
            self.move_towards(plant_pos, self.chase_speed)
            return True
        
        return False
    
    def _wander(self, dt: float):
        """Wander randomly"""
        self.wander_timer -= dt
        if self.wander_timer <= 0:
            self.wander(self.wander_speed)
            self.wander_timer = np.random.uniform(1, 3)
