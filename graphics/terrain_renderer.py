from PyQt6.QtGui import (QPainter, QColor, QPainterPath, 
                        QLinearGradient, QPen)
from PyQt6.QtCore import Qt
import random
import math

class TerrainRenderer:
    def draw_tree(self, painter, x, y, size):
        """Draw a simple tree"""
        # Convert coordinates to integers
        x = int(x)
        y = int(y)
        size = int(size)
        
        # Trunk
        trunk_color = QColor(139, 69, 19)  # Brown
        painter.fillRect(
            int(x + size/3), 
            int(y + size/2), 
            int(size/3), 
            int(size/2), 
            trunk_color
        )
        
        # Foliage
        foliage = QPainterPath()
        foliage.addEllipse(x, y, size, size)
        
        gradient = QLinearGradient(x, y, x + size, y + size)
        gradient.setColorAt(0, QColor(34, 139, 34))  # Forest green
        gradient.setColorAt(1, QColor(0, 100, 0))    # Dark green
        
        painter.fillPath(foliage, gradient)
    
    def draw_mountain(self, painter, x, y, size):
        """Draw a mountain"""
        # Convert coordinates to integers
        x = int(x)
        y = int(y)
        size = int(size)
        
        # Create mountain shape
        mountain = QPainterPath()
        mountain.moveTo(x, y + size)
        mountain.lineTo(x + size//2, y)
        mountain.lineTo(x + size, y + size)
        mountain.closeSubpath()
        
        # Create gradient
        gradient = QLinearGradient(x, y, x + size, y + size)
        gradient.setColorAt(0, QColor(169, 169, 169))  # Light gray
        gradient.setColorAt(1, QColor(105, 105, 105))  # Dark gray
        
        painter.fillPath(mountain, gradient)
        
        # Add snow cap
        snow = QPainterPath()
        snow.moveTo(x + size//3, y + size//3)
        snow.lineTo(x + size//2, y)
        snow.lineTo(x + 2*size//3, y + size//3)
        snow.closeSubpath()
        
        painter.fillPath(snow, QColor(255, 255, 255))
    
    def draw_water(self, painter, x, y, size, deep=False):
        """Draw water tile with wave effect"""
        base_color = QColor(0, 105, 148) if deep else QColor(64, 164, 223)
        
        # Convert coordinates and size to integers
        x = int(x)
        y = int(y)
        size = int(size)
        
        # Draw base water
        painter.fillRect(x, y, size, size, base_color)
        
        # Draw wave lines
        wave_pen = QPen(base_color.lighter(120))
        wave_pen.setWidth(2)
        painter.setPen(wave_pen)
        
        for i in range(3):
            y_offset = y + (i + 1) * size//4
            painter.drawLine(x, y_offset, x + size, y_offset)
    
    def draw_grass_tuft(self, painter, x, y, size):
        """Draw a tuft of grass"""
        grass_color = QColor(34, 139, 34)  # Forest green
        pen = QPen(grass_color)
        pen.setWidth(2)
        painter.setPen(pen)
        
        # Draw several blades
        for _ in range(3):
            angle = random.uniform(-0.3, 0.3)
            end_x = x + size * math.sin(angle)
            end_y = y - size * math.cos(angle)
            painter.drawLine(int(x), int(y), int(end_x), int(end_y)) 