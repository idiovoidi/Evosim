from typing import Dict, Any, Set, Type, Optional
from components import ComponentType
import uuid

class Entity:
    def __init__(self):
        self.id = str(uuid.uuid4())
        self.components = {}
        self.active = True
    
    def add_component(self, component_type: ComponentType, component: Any) -> None:
        """Add a component to the entity"""
        self.components[component_type] = component
    
    def remove_component(self, component_type: ComponentType) -> None:
        """Remove a component from the entity"""
        if component_type in self.components:
            del self.components[component_type]
    
    def has_component(self, component_type: ComponentType) -> bool:
        """Check if entity has a component"""
        return component_type in self.components
    
    def get_component(self, component_type: ComponentType) -> Any:
        """Get a component by type"""
        return self.components.get(component_type)
    
    def has_components(self, *component_types: ComponentType) -> bool:
        """Check if entity has all specified components"""
        return all(self.has_component(ct) for ct in component_types)
    
    def destroy(self) -> None:
        """Mark entity as inactive"""
        self.active = False

class EntityManager:
    def __init__(self):
        self.entities = {}
        self.next_entity_id = 0
    
    def create_entity(self):
        entity = Entity()
        self.entities[entity.id] = entity
        return entity
    
    def destroy_entity(self, entity):
        if entity.id in self.entities:
            entity.destroy()
            del self.entities[entity.id]
    
    def get_entity(self, entity_id):
        return self.entities.get(entity_id)
    
    def get_entities_with_component(self, component_type: ComponentType):
        return [entity for entity in self.entities.values() 
                if entity.active and entity.has_component(component_type)]