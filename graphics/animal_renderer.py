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
        """Draw a predator (fox) with sharp teeth"""
        # Save current state
        painter.save()
        
        # Move to position
        painter.translate(x, y)
        
        # Base color from genetics if available
        if genetics and 'color_brightness' in genetics.genes:
            brightness = genetics.genes['color_brightness']
            color = QColor(
                min(255, int(color.red() * brightness)),
                min(255, int(color.green() * brightness)),
                min(255, int(color.blue() * brightness))
            )
        
        # Draw body
        body_path = QPainterPath()
        body_path.addEllipse(-size/2, -size/2, size, size)
        
        # Draw head
        head_size = size * 0.6
        head_path = QPainterPath()
        head_path.addEllipse(size/4, -head_size/2, head_size, head_size)
        
        # Draw teeth (new)
        teeth_color = QColor(255, 255, 255)  # White teeth
        teeth_size = size * 0.15
        teeth_path = QPainterPath()
        # Upper teeth
        teeth_path.moveTo(size/2 + head_size*0.7, -teeth_size/2)
        teeth_path.lineTo(size/2 + head_size*0.7 + teeth_size, 0)
        teeth_path.lineTo(size/2 + head_size*0.7, teeth_size/2)
        # Lower teeth
        teeth_path.moveTo(size/2 + head_size*0.7, teeth_size/2)
        teeth_path.lineTo(size/2 + head_size*0.7 + teeth_size, head_size/2)
        teeth_path.lineTo(size/2 + head_size*0.7, head_size)
        
        # Draw eyes
        eye_size = size * 0.15
        eye_color = QColor(0, 0, 0)  # Black eyes
        eye_path = QPainterPath()
        eye_path.addEllipse(size/2, -head_size/4, eye_size, eye_size)
        
        # Fill paths
        painter.setBrush(color)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawPath(body_path)
        painter.drawPath(head_path)
        
        # Draw teeth
        painter.setBrush(teeth_color)
        painter.drawPath(teeth_path)
        
        # Draw eyes
        painter.setBrush(eye_color)
        painter.drawPath(eye_path)
        
        # Restore state
        painter.restore()
 