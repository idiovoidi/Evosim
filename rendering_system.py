from PyQt6.QtGui import QPainter, QFont, QColor
from PyQt6.QtCore import QPoint
from components import Position, Appearance, ComponentType
from entity import Entity
import numpy as np

class RenderingSystem:
    def __init__(self, world_system):
        self.world_system = world_system
    
    def render(self, surface):
        # Render the world map
        self.render_world(surface)
        
        # Render entities
        self.render_entities(surface)
    
    def render_world(self, surface):
        """Render the world map tiles"""
        if hasattr(self.world_system, 'world_map'):
            self.world_system.world_map.draw(surface)
    
    def render_entities(self, surface):
        """Render entities with Position and Appearance components"""
        painter = QPainter(surface)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Sort entities by layer for proper rendering order
        entities = sorted(
            [e for e in self.world_system.entities 
             if e.active and e.has_components(ComponentType.POSITION, ComponentType.APPEARANCE)],
            key=lambda e: e.get_component(ComponentType.APPEARANCE).layer
        )
        
        for entity in entities:
            pos = entity.get_component(ComponentType.POSITION)
            appearance = entity.get_component(ComponentType.APPEARANCE)
            
            if not appearance.visible:
                continue
            
            # Draw entity
            painter.setPen(appearance.color)
            size = 20 * appearance.size
            painter.setFont(QFont('Segoe UI Emoji', int(size)))
            
            # Create QPoint with integer coordinates
            painter_pos = QPoint(
                int(pos.value[0] - size/2),
                int(pos.value[1] + size/2)
            )
            painter.drawText(painter_pos, appearance.char) 