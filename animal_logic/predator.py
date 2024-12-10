from animal_logic.base_animal import BaseAnimal
from components import ComponentType
import random
import numpy as np
from map_system import TerrainType

class Predator(BaseAnimal):
    def __init__(self, entity, ecosystem):
        super().__init__(entity, ecosystem)
        self.hunt_radius = 300  # Large detection radius for hunting
        self.chase_speed_multiplier = 1.5  # Speed boost when chasing prey
        self.current_target = None
        self.target_last_pos = None
        self.hunt_cooldown = 0
    
    def update(self, dt):
        """Update predator behavior"""
        if not self.entity.active:
            return
            
        stats = self.entity.get_component(ComponentType.STATS)
        status = self.entity.get_component(ComponentType.STATUS)
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Update hunt cooldown
        if self.hunt_cooldown > 0:
            self.hunt_cooldown -= dt
        
        # Hunting behavior
        if status.is_hungry or stats.energy < stats.max_energy * 0.7:
            # Look for prey
            if not self.current_target or not self.current_target.active:
                self.current_target = self.find_nearest_prey()
                if self.current_target:
                    self.ecosystem.log_panel.log("🦊 spotted prey!")
            
            if self.current_target:
                target_pos = self.current_target.get_component(ComponentType.POSITION)
                dist = np.linalg.norm(target_pos.value - pos.value)
                
                if dist < 20:  # Catch distance
                    # Successful hunt
                    self.catch_prey(self.current_target)
                    self.current_target = None
                    self.hunt_cooldown = 60  # Rest after successful hunt
                else:
                    # Chase behavior
                    self.chase_prey(self.current_target)
            else:
                # Search pattern when no prey spotted
                self.search_for_prey()
        else:
            # Rest when not hungry
            if random.random() < 0.02:
                self.random_movement()
        
        # Update energy
        traits = self.entity.get_component(ComponentType.TRAITS)
        stats.energy -= traits.metabolism * dt
    
    def chase_prey(self, prey):
        """Chase prey with increased speed and prediction"""
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        prey_pos = prey.get_component(ComponentType.POSITION).value
        prey_vel = prey.get_component(ComponentType.VELOCITY).value
        
        # Predict prey's next position
        prediction_time = 0.5  # Look ahead time
        predicted_pos = prey_pos + prey_vel * prediction_time
        
        # Calculate intercept course
        direction = predicted_pos - pos.value
        if np.linalg.norm(direction) > 0:
            direction = direction / np.linalg.norm(direction)
            
            # Apply chase speed boost
            speed = traits.speed * 50 * self.chase_speed_multiplier
            vel.value = direction * speed
            
            # Store last known position
            self.target_last_pos = prey_pos.copy()
    
    def search_for_prey(self):
        """Search pattern when no prey is visible"""
        if self.target_last_pos is not None:
            # Move towards last known position
            pos = self.entity.get_component(ComponentType.POSITION)
            if np.linalg.norm(self.target_last_pos - pos.value) < 50:
                # Reached last known position, clear it
                self.target_last_pos = None
                self.random_movement()
            else:
                direction = self.target_last_pos - pos.value
                direction = direction / np.linalg.norm(direction)
                vel = self.entity.get_component(ComponentType.VELOCITY)
                traits = self.entity.get_component(ComponentType.TRAITS)
                vel.value = direction * traits.speed * 30
        else:
            # Random search movement
            self.random_movement()
    
    def catch_prey(self, prey):
        """Handle successful prey catch"""
        stats = self.entity.get_component(ComponentType.STATS)
        prey_stats = prey.get_component(ComponentType.STATS)
        
        # Convert prey energy to predator energy
        gained_energy = prey_stats.energy * 0.5
        stats.energy = min(stats.max_energy, stats.energy + gained_energy)
        
        # Remove prey
        prey.destroy()
        self.ecosystem.entities.remove(prey)
        self.ecosystem.log_panel.log(f"🦊 caught prey! (Energy: {stats.energy:.1f})")
    
    def find_nearest_prey(self):
        """Find nearest suitable prey"""
        pos = self.entity.get_component(ComponentType.POSITION)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        nearest_dist = float('inf')
        nearest_prey = None
        
        for entity in self.ecosystem.entities:
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
                
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type in ['herbivore', 'fish']:
                other_pos = entity.get_component(ComponentType.POSITION)
                dist = np.linalg.norm(other_pos.value - pos.value)
                
                if dist < nearest_dist and dist < self.hunt_radius:
                    nearest_dist = dist
                    nearest_prey = entity
        
        return nearest_prey