from .base_system import BaseSystem
from components import ComponentType

class HealthSystem(BaseSystem):
    def update(self, dt: float):
        for entity in self.world.entities[:]:  # Copy list to allow removal
            if not entity.active:
                continue
            
            if not entity.has_components(ComponentType.STATS, ComponentType.STATUS):
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            status = entity.get_component(ComponentType.STATUS)
            
            # Check death conditions
            if stats.energy <= -20:
                self.world.kill_entity(entity)
                continue
            
            # Update status
            if entity.has_component(ComponentType.TRAITS):
                traits = entity.get_component(ComponentType.TRAITS)
                stats.energy -= traits.metabolism * 0.1 * dt
                
                # Update status conditions
                status.is_hungry = stats.energy < stats.max_energy * 0.2
                status.is_tired = stats.energy < stats.max_energy * 0.1 