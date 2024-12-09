from .base_system import BaseSystem
from components import ComponentType
from PyQt6.QtGui import QPainter, QFont
from PyQt6.QtCore import QPoint

class RenderingSystem(BaseSystem):
    def render(self, surface):
        painter = QPainter(surface)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Render world
        if hasattr(self.world, 'world_map'):
            self.world.world_map.draw(painter)
        
        # Get renderable entities
        render_entities = [
            e for e in self.world.entities
            if e.active and e.has_components(ComponentType.POSITION, ComponentType.APPEARANCE)
        ]
        
        # Sort by layer
        render_entities.sort(
            key=lambda e: e.get_component(ComponentType.APPEARANCE).layer
        )
        
        # Render entities
        for entity in render_entities:
            self.render_entity(painter, entity)
    
    def render_entity(self, painter: QPainter, entity):
        pos = entity.get_component(ComponentType.POSITION)
        appearance = entity.get_component(ComponentType.APPEARANCE)
        
        if not appearance.visible:
            return
        
        painter.setPen(appearance.color)
        size = 20 * appearance.size
        painter.setFont(QFont('Segoe UI Emoji', int(size)))
        
        painter_pos = QPoint(
            int(pos.value[0] - size/2),
            int(pos.value[1] + size/2)
        )
        painter.drawText(painter_pos, appearance.char) 