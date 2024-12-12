from .base_system import BaseSystem
from components import ComponentType
from PyQt6.QtGui import QPainter, QFont, QColor
from PyQt6.QtCore import QRect, Qt

class UISystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.stats_rect = QRect(10, 10, 200, 100)  # Position and size of stats display
        self.icons = {
            'plant': '🌿',
            'herbivore': '🐰',
            'predator': '🦊',
        }
        self.colors = {
            'plant': QColor(50, 205, 50),     # Green
            'herbivore': QColor(30, 144, 255), # Blue
            'predator': QColor(220, 20, 60),   # Red
        }
        self.selected_entity = None
    
    def update(self, dt: float):
        """Update population counts"""
        counts = {
            'plant': 0,
            'herbivore': 0,
            'predator': 0,
        }
        
        for entity in self.world.get_entities():
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type in counts:
                counts[stats.species_type] += 1
        
        self.world.stats.update(counts)
        
        # Check for mouse hover on entities
        mouse_pos = self.world.get_mouse_pos()
        
        for entity in self.world.get_entities():
            if not entity.active or not entity.has_component(ComponentType.APPEARANCE):
                continue
            
            appearance = entity.get_component(ComponentType.APPEARANCE)
            if not appearance.visible:
                continue
            
            if entity.has_component(ComponentType.POSITION):
                pos = entity.get_component(ComponentType.POSITION)
                size = appearance.size * 30
                
                if (pos.value[0] - size/2 <= mouse_pos[0] <= pos.value[0] + size/2 and
                    pos.value[1] - size/2 <= mouse_pos[1] <= pos.value[1] + size/2):
                    # Mouse is hovering over this entity
                    self.selected_entity = entity
                    break
        else:
            self.selected_entity = None
    
    def render(self, painter: QPainter):
        """Render UI elements"""
        # Set up font
        painter.setFont(QFont('Segoe UI', 12))
        
        # Draw stats background
        painter.fillRect(self.stats_rect, QColor(0, 0, 0, 128))
        
        # Draw population counts
        y_offset = 25
        for species, icon in self.icons.items():
            count = self.world.stats.get(species, 0)
            text = f"{icon} {count}"
            
            # Draw with species color
            painter.setPen(self.colors[species])
            painter.drawText(
                20, y_offset,
                text
            )
            y_offset += 20 
        
        # Render selection highlight
        if self.selected_entity:
            appearance = self.selected_entity.get_component(ComponentType.APPEARANCE)
            pos = self.selected_entity.get_component(ComponentType.POSITION)
            size = appearance.size * 30
            
            painter.setPen(QColor(255, 255, 0))
            painter.drawRect(int(pos.value[0] - size/2), int(pos.value[1] - size/2), int(size), int(size))
        
        # Render other UI elements...