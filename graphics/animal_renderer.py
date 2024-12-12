from PyQt6.QtGui import (QPainter, QColor, QPainterPath, 
                        QLinearGradient, QPen)
from PyQt6.QtCore import Qt

class AnimalRenderer:
    @staticmethod
    def draw_herbivore(painter, x, y, size, color, genetics=None):
        """Draw a herbivore (rabbit)"""
        # Convert coordinates to integers
        x = int(x)
        y = int(y)
        size = int(size)
        
        # Body
        body = QPainterPath()
        body.addEllipse(x - size/2, y - size/2, size, size)
        
        # Ears
        ear_width = size * 0.2
        ear_height = size * 0.4
        ear_left = QPainterPath()
        ear_left.addEllipse(x - size/4 - ear_width/2, y - size/2 - ear_height, ear_width, ear_height)
        ear_right = QPainterPath()
        ear_right.addEllipse(x + size/4 - ear_width/2, y - size/2 - ear_height, ear_width, ear_height)
        
        # Draw with gradients
        gradient = QLinearGradient(x, y - size/2, x, y + size/2)
        gradient.setColorAt(0, color)
        gradient.setColorAt(1, color.darker(120))
        
        painter.fillPath(body, gradient)
        painter.fillPath(ear_left, gradient)
        painter.fillPath(ear_right, gradient)
        
        # Eyes
        eye_color = QColor(0, 0, 0)
        painter.fillRect(
            int(x - size/4), 
            int(y - size/4), 
            int(size/8), 
            int(size/8), 
            eye_color
        )
        painter.fillRect(
            int(x + size/8), 
            int(y - size/4), 
            int(size/8), 
            int(size/8), 
            eye_color
        )
    
    @staticmethod
    def draw_predator(painter, x, y, size, color, genetics=None):
        """Draw a predator (fox)"""
        # Convert coordinates to integers
        x = int(x)
        y = int(y)
        size = int(size)
        
        # Body
        body = QPainterPath()
        body.addEllipse(x - size/2, y - size/2, size * 1.2, size)
        
        # Head
        head = QPainterPath()
        head.addEllipse(x + size/4, y - size/4, size/2, size/2)
        
        # Ears
        ear_width = size * 0.15
        ear_height = size * 0.3
        ear_left = QPainterPath()
        ear_left.addEllipse(x + size/4, y - size/2, ear_width, ear_height)
        ear_right = QPainterPath()
        ear_right.addEllipse(x + size/2, y - size/2, ear_width, ear_height)
        
        # Draw with gradients
        gradient = QLinearGradient(x, y - size/2, x, y + size/2)
        gradient.setColorAt(0, color)
        gradient.setColorAt(1, color.darker(120))
        
        painter.fillPath(body, gradient)
        painter.fillPath(head, gradient)
        painter.fillPath(ear_left, gradient)
        painter.fillPath(ear_right, gradient)
        
        # Eyes
        eye_color = QColor(0, 0, 0)
        painter.fillRect(
            int(x + size/2), 
            int(y - size/4), 
            int(size/8), 
            int(size/8), 
            eye_color
        ) 