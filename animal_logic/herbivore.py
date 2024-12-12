from typing import Dict
import numpy as np
from .organism import Organism
from components import ComponentType

class Herbivore(Organism):
    def __init__(self, entity, ecosystem):
        super().__init__(entity, ecosystem)
        self.herd_radius = 150
        self.personal_space = 30
        
        # Initialize velocity if not present
        if not entity.has_component(ComponentType.VELOCITY):
            entity.add_component(ComponentType.VELOCITY, np.zeros(2))
    
    def get_movement_vector(self, nearby_entities: Dict[str, list]) -> np.ndarray:
        # Get required components
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        genetics = self.entity.get_component(ComponentType.GENETICS)
        status = self.entity.get_component(ComponentType.STATUS)
        
        # Debug print component states
        print(f"\nHerbivore {self.entity.id} state:")
        print(f"Position: {pos.value}")
        print(f"Velocity: {vel.value}")
        print(f"Genetics: {genetics.genes}")
        print(f"Status: hungry={status.is_hungry}")
        
        movement = np.zeros(2)
        
        # Get genetic traits with default values
        sense_radius = genetics.genes.get('sense_radius', 1.0) * 50
        speed = genetics.genes.get('speed', 1.0)
        
        # Add random movement if no other influences
        if not any(nearby_entities.values()):
            movement = np.random.normal(0, 1, 2)
            print(f"Random movement: {movement}")
        
        # Move towards food if hungry
        if status.is_hungry and nearby_entities.get("plants"):
            nearest_plant = min(nearby_entities["plants"], 
                              key=lambda p: np.linalg.norm(
                                  p.get_component(ComponentType.POSITION).value - pos.value
                              ))
            plant_pos = nearest_plant.get_component(ComponentType.POSITION)
            dist_to_plant = np.linalg.norm(plant_pos.value - pos.value)
            
            print(f"Distance to nearest plant: {dist_to_plant}")
            if dist_to_plant < sense_radius:
                food_vector = plant_pos.value - pos.value
                movement += food_vector
                print(f"Moving towards food: {food_vector}")
        
        # Normalize and apply speed
        if np.any(movement):
            movement = movement / np.linalg.norm(movement)
            base_speed = 30
            movement *= base_speed * speed
            
            # Update velocity with smoothing
            vel.value = vel.value * 0.8 + movement * 0.2
            print(f"Final velocity: {vel.value}")
        
        return movement

    def update(self, dt: float):
        """Update method called each frame"""
        super().update(dt)
        
        # Ensure velocity component exists
        vel = self.entity.get_component(ComponentType.VELOCITY)
        if vel is None:
            print(f"Warning: Herbivore {self.entity.id} missing velocity component!")
            return
            
        # Get nearby entities from ecosystem directly
        nearby_entities = self.ecosystem.get_nearby_entities(self.entity)
        
        # Apply movement
        movement = self.get_movement_vector(nearby_entities)
        if np.any(movement):
            print(f"Applying movement: {movement}")