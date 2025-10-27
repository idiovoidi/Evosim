"""Entity class for the ECS architecture"""
from typing import Dict, Optional, Any
from components import ComponentType
import uuid


class Entity:
    """
    Base class for all entities in the simulation.
    
    An entity is a container for components. It has no behavior of its own,
    but serves as an identifier that components can be attached to.
    """
    
    def __init__(self):
        self.id: str = str(uuid.uuid4())
        self.active: bool = True
        self._components: Dict[ComponentType, Any] = {}
    
    def add_component(self, component_type: ComponentType, component: Any) -> None:
        """
        Add a component to the entity
        
        Args:
            component_type: Type of component to add
            component: Component instance
        """
        self._components[component_type] = component
    
    def remove_component(self, component_type: ComponentType) -> None:
        """
        Remove a component from the entity
        
        Args:
            component_type: Type of component to remove
        """
        if component_type in self._components:
            del self._components[component_type]
    
    def has_component(self, component_type: ComponentType) -> bool:
        """
        Check if entity has a specific component
        
        Args:
            component_type: Type of component to check
            
        Returns:
            True if entity has the component
        """
        return component_type in self._components
    
    def get_component(self, component_type: ComponentType) -> Optional[Any]:
        """
        Get a component by type
        
        Args:
            component_type: Type of component to get
            
        Returns:
            Component instance or None if not found
        """
        return self._components.get(component_type)
    
    def has_components(self, *component_types: ComponentType) -> bool:
        """
        Check if entity has all specified components
        
        Args:
            *component_types: Variable number of component types to check
            
        Returns:
            True if entity has all specified components
        """
        return all(self.has_component(ct) for ct in component_types)
    
    def __repr__(self) -> str:
        """String representation of entity"""
        components = ', '.join(ct.name for ct in self._components.keys())
        return f"Entity(id={self.id[:8]}, active={self.active}, components=[{components}])" 