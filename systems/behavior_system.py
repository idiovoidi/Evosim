"""System for updating entity behaviors"""
from components import ComponentType
from .base_system import BaseSystem


class BehaviorSystem(BaseSystem):
    """Manages and updates all entity behaviors"""
    
    def __init__(self, world):
        super().__init__(world)
    
    def update(self, dt: float):
        """Update behaviors for all entities"""
        for entity in self.world.get_entities():
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
            
            # Get behavior from world
            behavior = self.world.get_behavior(entity)
            if behavior:
                try:
                    behavior.update(dt)
                except Exception as e:
                    print(f"Error updating behavior for entity {entity.id}: {e}")
                    continue
                
                # Update status effects
                if entity.has_component(ComponentType.STATUS):
                    self._update_status(entity) 
 
   
    def _update_status(self, entity):
        """Update entity status based on stats"""
        status = entity.get_component(ComponentType.STATUS)
        stats = entity.get_component(ComponentType.STATS)
        
        # Update hunger status
        status.is_hungry = stats.energy < stats.max_energy * 0.3
        
        # Update other status conditions as needed
        status.is_tired = stats.energy < stats.max_energy * 0.1
