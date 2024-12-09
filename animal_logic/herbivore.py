from .base_animal import BaseAnimal
from components import ComponentType
import numpy as np
import random

class Herbivore(BaseAnimal):
    def update(self):
        status = self.entity.get_component(ComponentType.STATUS)
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Check for nearby predators
        predator = self.ecosystem.find_nearest_entity(self.entity, 'predator')
        if predator:
            predator_pos = predator.get_component(ComponentType.POSITION)
            dist_to_predator = np.linalg.norm(predator_pos.value - pos.value)
            if dist_to_predator < 100:  # Flee distance
                self.move_towards(predator, flee=True)
                return
        
        # Look for food if hungry
        if status.is_hungry:
            target = self.ecosystem.find_nearest_entity(self.entity, 'plant')
            if target:
                self.move_towards(target)
                
                # Try to eat if close enough
                target_pos = target.get_component(ComponentType.POSITION)
                if np.linalg.norm(target_pos.value - pos.value) < 20:
                    stats = self.entity.get_component(ComponentType.STATS)
                    stats.energy += 50
                    self.ecosystem.entities.remove(target)
                    self.ecosystem.log_panel.log(f"🐰 ate a plant (Energy: {stats.energy:.1f})")
        else:
            # Random movement when not hungry
            if random.random() < 0.02:
                self.random_movement() 