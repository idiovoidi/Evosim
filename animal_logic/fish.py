from .base_animal import BaseAnimal
from components import ComponentType
import numpy as np
import random
from systems.map_system import TerrainType

class Fish(BaseAnimal):
    def update(self, dt):
        """Update fish behavior"""
        if not self.entity.active:
            return
            
        stats = self.entity.get_component(ComponentType.STATS)
        status = self.entity.get_component(ComponentType.STATUS)
        pos = self.entity.get_component(ComponentType.POSITION)
        
        # Check if in water
        tile = self.ecosystem.world_map.get_tile_at_position(pos.value[0], pos.value[1])
        if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
            stats.energy -= dt * 5  # Take damage when out of water
            
        # Basic needs check
        if status.is_hungry:
            # Fish feed on water nutrients
            if tile.current_food > 0:
                consumed = min(10 * dt, tile.current_food)
                tile.current_food -= consumed
                stats.energy += consumed
            else:
                self.random_movement()
        else:
            # School behavior and random movement
            nearby_fish = self.find_nearby_fish()
            if nearby_fish:
                # Move with the school
                self.school_movement(nearby_fish)
            elif random.random() < 0.02:
                self.random_movement()
        
        # Update energy
        traits = self.entity.get_component(ComponentType.TRAITS)
        stats.energy -= traits.metabolism * dt
        
        # Gain experience over time while in water
        if tile.terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
            self.gain_experience(0.1 * dt)  # Slow constant growth in water
    
    def find_nearby_fish(self):
        """Find nearby fish for schooling"""
        pos = self.entity.get_component(ComponentType.POSITION)
        nearby = []
        
        for entity in self.ecosystem.entities:
            if (entity != self.entity and entity.active and 
                entity.has_component(ComponentType.STATS)):
                other_stats = entity.get_component(ComponentType.STATS)
                if other_stats.species_type == 'fish':
                    other_pos = entity.get_component(ComponentType.POSITION)
                    dist = np.linalg.norm(other_pos.value - pos.value)
                    if dist < 100:  # School radius
                        nearby.append(entity)
        
        return nearby
    
    def school_movement(self, nearby_fish):
        """Move with the school"""
        if not nearby_fish:
            return
            
        # Calculate average position and velocity of nearby fish
        avg_pos = np.zeros(2)
        avg_vel = np.zeros(2)
        
        for fish in nearby_fish:
            pos = fish.get_component(ComponentType.POSITION)
            vel = fish.get_component(ComponentType.VELOCITY)
            avg_pos += pos.value
            avg_vel += vel.value
        
        avg_pos /= len(nearby_fish)
        avg_vel /= len(nearby_fish)
        
        # Move towards average position and match average velocity
        my_pos = self.entity.get_component(ComponentType.POSITION)
        my_vel = self.entity.get_component(ComponentType.VELOCITY)
        
        direction = avg_pos - my_pos.value
        if np.linalg.norm(direction) > 0:
            direction = direction / np.linalg.norm(direction)
            traits = self.entity.get_component(ComponentType.TRAITS)
            speed = traits.speed * 10
            my_vel.value = direction * speed + avg_vel * 0.5
    
    def random_movement(self):
        """Random movement in water"""
        pos = self.entity.get_component(ComponentType.POSITION)
        direction = np.random.uniform(-1, 1, 2)
        direction /= np.linalg.norm(direction)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        vel.value = direction * self.entity.get_component(ComponentType.TRAITS).speed * 5