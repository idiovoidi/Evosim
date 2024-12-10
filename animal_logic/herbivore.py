from animal_logic.base_animal import BaseAnimal
from components import ComponentType
import random
import numpy as np
from map_system import TerrainType

class Herbivore(BaseAnimal):
    def __init__(self, entity, ecosystem):
        super().__init__(entity, ecosystem)
        self.herd_radius = 150  # Radius to consider other herbivores as part of herd
        self.personal_space = 30  # Minimum distance between herbivores
        
    def update(self, dt):
        """Update herbivore behavior"""
        if not self.entity.active:
            return
            
        stats = self.entity.get_component(ComponentType.STATS)
        status = self.entity.get_component(ComponentType.STATUS)
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Check for predators first (survival priority)
        nearest_predator = self.find_nearest_predator()
        if nearest_predator:
            predator_pos = nearest_predator.get_component(ComponentType.POSITION)
            dist_to_predator = np.linalg.norm(predator_pos.value - pos.value)
            if dist_to_predator < 200:  # Flee if predator is close
                self.move_towards(nearest_predator, flee=True)
                self.ecosystem.log_panel.log("🐰 fleeing from predator!")
                return
        
        # Get herd information
        herd_mates = self.find_herd_mates()
        
        # Prioritize needs
        if status.is_hungry:
            # Look for food while staying with herd
            nearest_food = self.find_nearest_food()
            if nearest_food:
                food_pos = nearest_food.get_component(ComponentType.POSITION)
                dist_to_food = np.linalg.norm(food_pos.value - pos.value)
                
                if dist_to_food < 20:  # Close enough to eat
                    self.consume_food(nearest_food)
                else:
                    # Move towards food while considering herd
                    self.move_with_herd(nearest_food, herd_mates)
            else:
                # Stay with herd while searching
                self.move_with_herd(None, herd_mates)
        else:
            # Check for reproduction
            if self.can_reproduce(stats):
                mate = self.find_mate(herd_mates)
                if mate:
                    self.move_towards(mate)
                    if np.linalg.norm(mate.get_component(ComponentType.POSITION).value - pos.value) < 30:
                        self.reproduce()
            else:
                # Normal herd behavior
                self.move_with_herd(None, herd_mates)
        
        # Update energy
        traits = self.entity.get_component(ComponentType.TRAITS)
        stats.energy -= traits.metabolism * dt
    
    def move_with_herd(self, target, herd_mates):
        """Move while maintaining herd cohesion"""
        if not herd_mates:
            if target:
                self.move_towards(target)
            else:
                self.random_movement()
            return
        
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        
        # Calculate herd center
        herd_center = np.mean([mate.get_component(ComponentType.POSITION).value 
                             for mate in herd_mates], axis=0)
        
        # Calculate separation force (avoid crowding)
        separation = np.zeros(2)
        for mate in herd_mates:
            mate_pos = mate.get_component(ComponentType.POSITION).value
            dist = np.linalg.norm(mate_pos - pos.value)
            if dist < self.personal_space:
                separation += (pos.value - mate_pos) / (dist + 1e-6)
        
        # Calculate target direction
        if target:
            target_pos = target.get_component(ComponentType.POSITION).value
            target_dir = (target_pos - pos.value)
            target_dir = target_dir / (np.linalg.norm(target_dir) + 1e-6)
        else:
            target_dir = np.zeros(2)
        
        # Combine forces
        direction = (
            target_dir * 1.0 +  # Target seeking
            (herd_center - pos.value) * 0.5 +  # Cohesion
            separation * 1.0  # Separation
        )
        
        # Normalize and apply movement
        if np.linalg.norm(direction) > 0:
            direction = direction / np.linalg.norm(direction)
            traits = self.entity.get_component(ComponentType.TRAITS)
            speed = traits.speed * 30
            vel.value = direction * speed
    
    def find_herd_mates(self):
        """Find nearby herbivores"""
        pos = self.entity.get_component(ComponentType.POSITION)
        herd_mates = []
        
        for entity in self.ecosystem.entities:
            if (entity != self.entity and entity.active and 
                entity.has_component(ComponentType.STATS)):
                stats = entity.get_component(ComponentType.STATS)
                if stats.species_type == 'herbivore':
                    other_pos = entity.get_component(ComponentType.POSITION)
                    dist = np.linalg.norm(other_pos.value - pos.value)
                    if dist < self.herd_radius:
                        herd_mates.append(entity)
        
        return herd_mates
    
    def find_nearest_predator(self):
        """Find nearest predator"""
        pos = self.entity.get_component(ComponentType.POSITION)
        nearest_dist = float('inf')
        nearest_predator = None
        
        for entity in self.ecosystem.entities:
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type == 'predator':
                other_pos = entity.get_component(ComponentType.POSITION)
                dist = np.linalg.norm(other_pos.value - pos.value)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_predator = entity
        
        return nearest_predator
    
    def consume_food(self, food_entity):
        """Consume food and gain energy"""
        stats = self.entity.get_component(ComponentType.STATS)
        food_stats = food_entity.get_component(ComponentType.STATS)
        
        gained_energy = min(50.0, food_stats.energy)
        stats.energy += gained_energy
        
        # Gain experience from eating
        self.gain_experience(5.0)  # Base experience for eating
        
        # Remove consumed plant
        food_entity.destroy()
        self.ecosystem.entities.remove(food_entity)
        self.ecosystem.log_panel.log(f"🐰 ate food (Energy: {stats.energy:.1f}, Size: {self.entity.get_component(ComponentType.APPEARANCE).size:.1f})")
    
    def can_reproduce(self, stats):
        """Check if the herbivore can reproduce"""
        return (stats.energy > stats.max_energy * 0.8 and  # Need high energy
                stats.reproduction_cooldown <= 0 and       # Not in cooldown
                random.random() < 0.005)                   # Random chance
    
    def find_mate(self, herd_mates):
        """Find a suitable mate from herd"""
        if not herd_mates:
            return None
        
        # Filter potential mates
        potential_mates = []
        for mate in herd_mates:
            mate_stats = mate.get_component(ComponentType.STATS)
            if (mate_stats.energy > mate_stats.max_energy * 0.6 and  # Healthy mate
                mate_stats.reproduction_cooldown <= 0):              # Ready to mate
                potential_mates.append(mate)
        
        # Return random mate if any found
        return random.choice(potential_mates) if potential_mates else None
    
    def reproduce(self):
        """Create a new herbivore"""
        stats = self.entity.get_component(ComponentType.STATS)
        pos = self.entity.get_component(ComponentType.POSITION)
        traits = self.entity.get_component(ComponentType.TRAITS)
        
        # Create offspring with slight trait variations
        offspring_pos = pos.value + np.random.uniform(-20, 20, 2)
        
        # Create new entity
        new_entity = self.ecosystem.create_entity('🐰', 
                                                offspring_pos[0], 
                                                offspring_pos[1], 
                                                'herbivore')
        
        # Mutate traits slightly
        if new_entity.has_component(ComponentType.TRAITS):
            offspring_traits = new_entity.get_component(ComponentType.TRAITS)
            for attr in ['speed', 'sense_radius', 'metabolism']:
                current = getattr(traits, attr)
                mutation = random.uniform(0.8, 1.2)
                setattr(offspring_traits, attr, current * mutation)
        
        # Add to ecosystem
        self.ecosystem.entities.append(new_entity)
        self.ecosystem.log_panel.log("🐰 reproduced!")
        
        # Set reproduction cooldown and consume energy
        stats.reproduction_cooldown = 300  # 5 seconds at 60 fps
        stats.energy *= 0.6  # Consume 40% energy for reproduction
        
        # Add heart effect
        pos = self.entity.get_component(ComponentType.POSITION).value
        self.ecosystem.effect_system.add_heart_effect(pos)
        
        # Gain experience from successful reproduction
        self.gain_experience(15.0)  # Significant experience for reproducing
        
        # Create offspring with size inheritance
        parent_size = self.entity.get_component(ComponentType.APPEARANCE).size
        if new_entity.has_component(ComponentType.APPEARANCE):
            # Offspring starts slightly smaller than parent
            new_entity.get_component(ComponentType.APPEARANCE).size = parent_size * 0.8