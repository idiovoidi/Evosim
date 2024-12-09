from .base_animal import BaseAnimal
from components import ComponentType
import numpy as np
import random

class Predator(BaseAnimal):
    def update(self):
        status = self.entity.get_component(ComponentType.STATUS)
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Look for prey
        target = self.ecosystem.find_nearest_entity(self.entity, 'herbivore')
        if target:
            self.move_towards(target)
            
            # Try to catch prey if close enough
            target_pos = target.get_component(ComponentType.POSITION)
            if np.linalg.norm(target_pos.value - pos.value) < 20:
                stats = self.entity.get_component(ComponentType.STATS)
                stats.energy += 100
                self.ecosystem.entities.remove(target)
                self.ecosystem.log_panel.log(f"🦊 caught a 🐰 (Energy: {stats.energy:.1f})")
                self.ecosystem.sound_manager.play_sound('eat')
        else:
            # Random movement when no prey in sight
            if random.random() < 0.02:
                self.random_movement() 