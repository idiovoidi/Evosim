from typing import Dict, Optional, Type
from components import ComponentType
import uuid

class Entity:
    """Base class for all entities in the simulation"""
    def __init__(self):
        self.id = str(uuid.uuid4())
        self.active = True
        self._components: Dict[ComponentType, object] = {}
    
    def add_component(self, component_type: ComponentType, component: object) -> None:
        """Add a component to the entity"""
        self._components[component_type] = component
    
    def remove_component(self, component_type: ComponentType) -> None:
        """Remove a component from the entity"""
        if component_type in self._components:
            del self._components[component_type]
    
    def has_component(self, component_type: ComponentType) -> bool:
        """Check if entity has a specific component"""
        return component_type in self._components
    
    def get_component(self, component_type: ComponentType) -> Optional[object]:
        """Get a component by type"""
        return self._components.get(component_type)
    
    def has_components(self, *component_types: Type[ComponentType]) -> bool:
        """Check if entity has all specified components"""
        return all(self.has_component(ct) for ct in component_types) 