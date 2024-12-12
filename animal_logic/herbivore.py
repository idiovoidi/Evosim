import numpy as np
from components import ComponentType
from .base_behavior import BaseBehavior

class Herbivore(BaseBehavior):
    def __init__(self, entity, world):
        super().__init__(entity, world)
        self.wander_timer = 0
        self.eating_range = 30
        self.wander_speed = 50
        self.chase_speed = 80
        
    def update(self, dt):
        if not self.entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY, ComponentType.STATS):
            return
            
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        stats = self.entity.get_component(ComponentType.STATS)
        
        # Get nearby entities
        nearby = self.world.get_nearby_entities(self.entity, 200)
        
        # Run from predators
        for predator in nearby['predators']:
            pred_pos = predator.get_component(ComponentType.POSITION)
            direction = pos.value - pred_pos.value
            distance = np.linalg.norm(direction)
            
            if distance < 100:  # Run if predator is close
                vel.value = direction / distance * self.chase_speed
                return
        
        # Look for food if hungry
        if stats.energy < stats.max_energy * 0.7:
            for plant in nearby['plants']:
                plant_pos = plant.get_component(ComponentType.POSITION)
                direction = plant_pos.value - pos.value
                distance = np.linalg.norm(direction)
                
                if distance < self.eating_range:
                    # Eat the plant
                    plant_stats = plant.get_component(ComponentType.STATS)
                    energy_gain = min(30, plant_stats.energy)
                    stats.energy += energy_gain
                    plant_stats.energy -= energy_gain
                    return
                    
                # Move towards plant
                vel.value = direction / distance * self.chase_speed
                return
        
        # Wander if nothing else to do
        self.wander_timer -= dt
        if self.wander_timer <= 0:
            angle = np.random.uniform(0, 2 * np.pi)
            vel.value = np.array([np.cos(angle), np.sin(angle)]) * self.wander_speed
            self.wander_timer = np.random.uniform(1, 3)