from animal_logic.base_animal import BaseAnimal
from components import ComponentType
import random
import numpy as np

class Predator(BaseAnimal):
    def update(self, dt):
        """Update predator behavior"""
        if not self.entity.active:
            return
            
        stats = self.entity.get_component(ComponentType.STATS)
        status = self.entity.get_component(ComponentType.STATUS)
        
        # Basic needs check
        if status.is_hungry:
            # Look for prey (herbivores or fish)
            nearest_prey = self.find_nearest_prey()
            if nearest_prey:
                self.move_towards(nearest_prey)
                
                # Try to catch prey
                pos = self.entity.get_component(ComponentType.POSITION)
                prey_pos = nearest_prey.get_component(ComponentType.POSITION)
                dist = np.linalg.norm(prey_pos.value - pos.value)
                
                if dist < 20:  # Catch distance
                    # Successful hunt
                    prey_stats = nearest_prey.get_component(ComponentType.STATS)
                    stats.energy += prey_stats.energy * 0.5  # Convert prey energy to predator energy
                    nearest_prey.destroy()
                    self.ecosystem.log_panel.log(f"🦊 caught prey (Energy: {stats.energy:.1f})")
            else:
                self.random_movement()
        else:
            # Random movement with occasional stops
            if random.random() < 0.01:  # 1% chance to change direction
                self.random_movement()
        
        # Update energy
        traits = self.entity.get_component(ComponentType.TRAITS)
        stats.energy -= traits.metabolism * dt
    
    def find_nearest_prey(self):
        """Find nearest prey"""
        pos = self.entity.get_component(ComponentType.POSITION)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        nearest_dist = float('inf')
        nearest_prey = None
        
        # Look for herbivores and fish
        for entity in self.ecosystem.entities:
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
                
            other_stats = entity.get_component(ComponentType.STATS)
            if other_stats.species_type not in ['herbivore', 'fish']:
                continue
            
            other_pos = entity.get_component(ComponentType.POSITION)
            dist = np.linalg.norm(other_pos.value - pos.value)
            
            if dist < nearest_dist and dist < traits.sense_radius * 50:
                nearest_dist = dist
                nearest_prey = entity
        
        return nearest_prey