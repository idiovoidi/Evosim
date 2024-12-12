from animal_logic.base_animal import BaseAnimal
from components import ComponentType
import random
import numpy as np
from systems.map_system import TerrainType
from typing import Dict
from .base_behavior import BaseBehavior

class Predator(BaseBehavior):
    def __init__(self, entity, world):
        super().__init__(entity, world)
        self.wander_timer = 0
        self.attack_range = 30
        self.wander_speed = 60
        self.chase_speed = 120
        self.hunt_range = 400
        
    def update(self, dt):
        if not self.entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY, ComponentType.STATS):
            return
            
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        stats = self.entity.get_component(ComponentType.STATS)
        
        # Get nearby entities
        nearby = self.world.get_nearby_entities(self.entity, self.hunt_range)
        
        # Always hunt if there's prey nearby
        for prey in nearby['herbivores']:
            prey_pos = prey.get_component(ComponentType.POSITION)
            direction = prey_pos.value - pos.value
            distance = np.linalg.norm(direction)
            
            if distance < self.attack_range:
                # Attack the prey
                prey_stats = prey.get_component(ComponentType.STATS)
                energy_gain = min(50, prey_stats.energy)
                stats.energy += energy_gain
                prey_stats.energy -= energy_gain * 2  # Extra damage
                return
                
            # Chase prey more aggressively
            vel.value = direction / distance * self.chase_speed
            
            # Add some randomness to movement to make it more interesting
            vel.value += np.random.normal(0, 10, 2)
            return
        
        # Wander if no prey in sight
        self.wander_timer -= dt
        if self.wander_timer <= 0:
            angle = np.random.uniform(0, 2 * np.pi)
            vel.value = np.array([np.cos(angle), np.sin(angle)]) * self.wander_speed
            self.wander_timer = np.random.uniform(1, 3)