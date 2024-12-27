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
        # Basic movement parameters
        self.wander_timer = 0
        self.attack_range = 35  # Slightly increased range
        self.wander_speed = 60
        self.chase_speed = 150  # Increased for better hunting
        self.hunt_range = 500   # Increased detection range
        
        # Combat and stamina
        self.attack_cooldown = 0
        self.attack_cooldown_max = 0.8  # Reduced for more frequent attacks
        self.stamina = 100.0
        self.stamina_regen = 15.0  # Increased regen
        
        # Hunting state
        self.current_target = None
        self.target_last_seen = None
        self.hunting_memory = 3.0  # Seconds to remember prey location
        
    def update(self, dt):
        if not self.entity.has_components(ComponentType.POSITION, ComponentType.VELOCITY, ComponentType.STATS):
            return
            
        pos = self.entity.get_component(ComponentType.POSITION)
        vel = self.entity.get_component(ComponentType.VELOCITY)
        stats = self.entity.get_component(ComponentType.STATS)
        
        # Update timers and resources
        self.attack_cooldown = max(0, self.attack_cooldown - dt)
        self.stamina = min(100.0, self.stamina + self.stamina_regen * dt)
        
        # Check if current target is still valid
        if self.current_target and (
            not self.current_target.active or 
            not self.current_target.has_component(ComponentType.STATS) or
            self.current_target.get_component(ComponentType.STATS).energy <= 0
        ):
            self.current_target = None
        
        # Get nearby entities
        nearby = self.world.get_nearby_entities(self.entity, self.hunt_range)
        
        # Hunt if we have enough stamina and energy
        if self.stamina > 20.0 and stats.energy < stats.max_energy * 0.9:
            # Find the best target
            self.current_target = self._find_best_target(nearby['herbivores'], pos)
            
            if self.current_target:
                self.target_last_seen = self.world.time
                prey_pos = self.current_target.get_component(ComponentType.POSITION)
                direction = prey_pos.value - pos.value
                distance = np.linalg.norm(direction)
                
                if distance < self.attack_range and self.attack_cooldown <= 0:
                    self._attack_prey(self.current_target, stats)
                    return
                
                # Chase target
                self._chase_target(direction, distance, vel)
                return
            
        # Rest if low on stamina or full
        if self.stamina < 30.0 or stats.energy >= stats.max_energy * 0.9:
            self._rest(vel)
            return
        
        # Wander if no prey in sight
        self._wander(dt, vel)
    
    def _find_best_target(self, potential_targets, pos):
        """Find the best target based on distance and prey health"""
        if not potential_targets:
            return self.current_target  # Keep current target if no new targets
            
        best_target = None
        best_score = float('-inf')
        
        for prey in potential_targets:
            prey_pos = prey.get_component(ComponentType.POSITION)
            prey_stats = prey.get_component(ComponentType.STATS)
            
            if not prey_stats:
                continue
                
            distance = np.linalg.norm(prey_pos.value - pos.value)
            
            # Score based on distance and prey weakness
            score = (1000 / (distance + 1)) * (1 - prey_stats.energy / prey_stats.max_energy)
            
            if score > best_score:
                best_score = score
                best_target = prey
        
        return best_target or self.current_target
    
    def _attack_prey(self, prey, stats):
        """Attack the target prey"""
        prey_stats = prey.get_component(ComponentType.STATS)
        damage = min(60, prey_stats.energy)  # Increased damage
        
        # Convert damage to energy with better efficiency when hungry
        efficiency = 0.9 if stats.energy < stats.max_energy * 0.5 else 0.7
        energy_gain = damage * efficiency
        
        stats.energy = min(stats.max_energy, stats.energy + energy_gain)
        prey_stats.energy -= damage
        
        self.attack_cooldown = self.attack_cooldown_max
        self.stamina -= 15  # Reduced stamina cost
        
        # Trigger visual effect or animation here if needed
        if hasattr(self.world, 'effect_system'):
            self.world.effect_system.create_effect('attack', prey.get_component(ComponentType.POSITION).value)
    
    def _chase_target(self, direction, distance, vel):
        """Chase the current target"""
        # Adjust speed based on distance and stamina
        base_speed = self.chase_speed * (self.stamina / 100.0)
        speed_multiplier = min(1.0, distance / self.attack_range)  # Slow down when close
        
        chase_speed = base_speed * speed_multiplier
        vel.value = direction / distance * chase_speed
        
        # Add slight randomness to movement
        vel.value += np.random.normal(0, 5, 2)
        self.stamina -= 0.8  # Reduced stamina cost
    
    def _rest(self, vel):
        """Rest to recover stamina"""
        vel.value *= 0.8  # Slow down more gradually
    
    def _wander(self, dt, vel):
        """Wander around when no targets are available"""
        self.wander_timer -= dt
        if self.wander_timer <= 0:
            angle = np.random.uniform(0, 2 * np.pi)
            vel.value = np.array([np.cos(angle), np.sin(angle)]) * self.wander_speed
            self.wander_timer = np.random.uniform(1, 3)