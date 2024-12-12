from .base_system import BaseSystem
from components import ComponentType
from PyQt6.QtGui import QPainter, QFont, QColor
from PyQt6.QtCore import QRect, Qt

class UISystem(BaseSystem):
    def __init__(self, ecosystem):
        super().__init__(ecosystem)
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
    
    def update(self, dt: float):
        """Update population counts"""
        counts = {
            'plant': 0,
            'herbivore': 0,
            'predator': 0,
        }
        
        for entity in self.ecosystem.world.get_entities():
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
            
            stats = entity.get_component(ComponentType.STATS)
            if stats.species_type in counts:
                counts[stats.species_type] += 1
        
        self.world.stats.update(counts)
    
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