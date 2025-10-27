"""System for managing entity health and energy"""
from .base_system import BaseSystem
from components import ComponentType
from constants import BASE_METABOLISM


class HealthSystem(BaseSystem):
    """Manages health, energy, and death for all entities"""
    
    DEATH_ENERGY_THRESHOLD = -20
    HUNGER_THRESHOLD = 0.2
    TIRED_THRESHOLD = 0.1
    
    def update(self, dt: float):
        """Update health and energy for all entities"""
        for entity in self.world.get_entities_by_type(ComponentType.STATS):
            if not entity.active:
                continue
            
            if not entity.has_components(ComponentType.STATS, ComponentType.STATUS):
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            status = entity.get_component(ComponentType.STATUS)
            
            # Apply metabolism (energy drain)
            if entity.has_component(ComponentType.TRAITS):
                traits = entity.get_component(ComponentType.TRAITS)
                stats.energy -= traits.metabolism * BASE_METABOLISM * dt
            
            # Update age
            stats.age += dt
            
            # Update reproduction cooldown
            if stats.reproduction_cooldown > 0:
                stats.reproduction_cooldown -= dt
            
            # Check death conditions
            if stats.energy <= self.DEATH_ENERGY_THRESHOLD:
                self._handle_death(entity)
                continue
            
            # Update status conditions
            status.is_hungry = stats.energy < stats.max_energy * self.HUNGER_THRESHOLD
            status.is_tired = stats.energy < stats.max_energy * self.TIRED_THRESHOLD
    
    def _handle_death(self, entity):
        """Handle entity death"""
        # Add death effect
        if entity.has_component(ComponentType.POSITION):
            pos = entity.get_component(ComponentType.POSITION).value
            if hasattr(self.world, 'effect_system'):
                self.world.effect_system.add_bones_effect(pos)
        
        # Mark entity as inactive
        entity.active = False 