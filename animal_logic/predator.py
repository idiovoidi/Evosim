from animal_logic.base_animal import BaseAnimal
from components import ComponentType
import random
import numpy as np
from systems.map_system import TerrainType
from typing import Dict

class Predator(BaseAnimal):
    def __init__(self, entity, ecosystem):
        super().__init__(entity, ecosystem)
        self.hunt_radius = 300  # Large detection radius for hunting
        self.chase_speed_multiplier = 1.5  # Speed boost when chasing prey
        self.current_target = None
        self.target_last_pos = None
        self.hunt_cooldown = 0
    
    def update(self, dt: float):
        """Update predator state"""
        super().update(dt)
        
        # Get required components
        stats = self.entity.get_component(ComponentType.STATS)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        if not traits:
            print(f"Warning: Predator {self.entity.id} missing Traits component!")
            return
        
        # Base energy consumption from metabolism
        base_consumption = traits.metabolism * dt
        stats.energy -= base_consumption
        
        # Rest of update logic...
    
    def chase_prey(self, prey):
        """Chase prey with increased speed and prediction"""
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        traits = self.entity.get_component(ComponentType.TRAITS)
        stats = self.entity.get_component(ComponentType.STATS)
        
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
            
            # Increase energy consumption during chase
            energy_cost = traits.metabolism * 3.0  # Triple energy consumption while chasing
            stats.energy -= energy_cost
            
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
        prey_pos = prey.get_component(ComponentType.POSITION).value
        
        # Convert prey energy to predator energy
        gained_energy = prey_stats.energy * 0.5
        stats.energy = min(stats.max_energy, stats.energy + gained_energy)
        
        # Gain experience from successful hunt
        prey_size = prey.get_component(ComponentType.APPEARANCE).size
        experience_gain = 10.0 * prey_size  # More experience for catching larger prey
        self.gain_experience(experience_gain)
        
        # Add bones effect at prey's position
        self.ecosystem.effect_system.add_bones_effect(prey_pos)
        
        # Add eat effect slightly offset
        eat_pos = prey_pos + np.array([10, -10])  # Offset the eating effect
        self.ecosystem.effect_system.add_eat_effect(eat_pos)
        
        # Remove prey
        prey.destroy()
        self.ecosystem.entities.remove(prey)
        self.ecosystem.log_panel.log(f"🦊 caught prey! (Energy: {stats.energy:.1f}, Size: {self.entity.get_component(ComponentType.APPEARANCE).size:.1f})")
    
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
    
    def reproduce(self):
        """Create offspring with inherited genetics"""
        stats = self.entity.get_component(ComponentType.STATS)
        pos = self.entity.get_component(ComponentType.POSITION)
        traits = self.entity.get_component(ComponentType.TRAITS)
        parent_genetics = self.entity.get_component(ComponentType.GENETICS)
        
        # Create offspring position near parent
        offspring_pos = pos.value + np.random.uniform(-20, 20, 2)
        
        # Create new entity
        offspring = self.ecosystem.create_entity('predator', 
                                              offspring_pos[0], 
                                              offspring_pos[1], 
                                              'predator')
        
        # Mix genetics if mate exists
        if hasattr(self, 'mate') and self.mate:
            mate_genetics = self.mate.get_component(ComponentType.GENETICS)
            offspring_genetics = parent_genetics.mix_genes(mate_genetics)
            offspring.add_component(ComponentType.GENETICS, offspring_genetics)
        else:
            # Self reproduction - just mutate current genetics
            offspring_genetics = parent_genetics.mix_genes(parent_genetics)
            offspring.add_component(ComponentType.GENETICS, offspring_genetics)
        
        # Mutate traits
        if offspring.has_component(ComponentType.TRAITS):
            offspring_traits = offspring.get_component(ComponentType.TRAITS)
            for attr in ['speed', 'sense_radius', 'metabolism']:
                current = getattr(traits, attr)
                mutation = random.uniform(0.8, 1.2)
                setattr(offspring_traits, attr, current * mutation)
        
        # Add to ecosystem
        self.ecosystem.entities.append(offspring)
        self.ecosystem.log_panel.log("🦊 reproduced!")
        
        # Add heart effect
        self.ecosystem.effect_system.add_heart_effect(pos.value)
        
        # Set reproduction cooldown and consume energy
        stats.reproduction_cooldown = 300  # 5 seconds at 60 fps
        stats.energy *= 0.6  # Consume 40% energy for reproduction
    
    def get_movement_vector(self, nearby_entities: Dict[str, list]) -> np.ndarray:
        """Calculate movement direction based on nearby entities"""
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        traits = self.entity.get_component(ComponentType.TRAITS)
        stats = self.entity.get_component(ComponentType.STATS)
        status = self.entity.get_component(ComponentType.STATUS)
        
        movement = np.zeros(2)
        
        # If hunting, prioritize chasing target
        if self.current_target and self.current_target.active:
            target_pos = self.current_target.get_component(ComponentType.POSITION).value
            direction = target_pos - pos.value
            if np.linalg.norm(direction) > 0:
                movement = direction / np.linalg.norm(direction)
                movement *= traits.speed * 50 * self.chase_speed_multiplier
        
        # If hungry but no target, look for prey
        elif status.is_hungry and nearby_entities.get("herbivores"):
            nearest_prey = min(nearby_entities["herbivores"], 
                             key=lambda p: np.linalg.norm(
                                 p.get_component(ComponentType.POSITION).value - pos.value
                             ))
            prey_pos = nearest_prey.get_component(ComponentType.POSITION).value
            direction = prey_pos - pos.value
            if np.linalg.norm(direction) > 0:
                movement = direction / np.linalg.norm(direction)
                movement *= traits.speed * 40  # Slower when searching
        
        # Random movement when not hunting
        else:
            angle = np.random.uniform(0, 2 * np.pi)
            movement = np.array([np.cos(angle), np.sin(angle)])
            movement *= traits.speed * 30  # Even slower when wandering
        
        # Add some randomness to movement
        movement += np.random.normal(0, 0.1, 2)
        
        # Normalize and return
        if np.any(movement):
            movement = movement / np.linalg.norm(movement)
        
        return movement