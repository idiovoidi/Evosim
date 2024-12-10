from PyQt6.QtGui import (QPainter, QFont, QColor, QPainterPath, 
                        QLinearGradient, QPen, QBrush)
from PyQt6.QtCore import QPoint, Qt
from components import Position, Appearance, ComponentType, Genetics
from map_system import TerrainType, TerrainTile
from entity import Entity
import numpy as np
import math
import random

class TerrainRenderer:
    @staticmethod
    def draw_tree(painter, x, y, size):
        """Draw a more detailed tree using vector graphics"""
        # Tree crown
        crown_path = QPainterPath()
        crown_path.moveTo(x + size/2, y)  # Top point
        crown_path.lineTo(x + size, y + size*0.6)  # Bottom right
        crown_path.lineTo(x, y + size*0.6)  # Bottom left
        crown_path.closeSubpath()
        
        # Create gradient for crown
        gradient = QLinearGradient(x, y, x + size, y + size)
        gradient.setColorAt(0, QColor(34, 139, 34))  # Forest green
        gradient.setColorAt(1, QColor(0, 100, 0))    # Darker green
        
        # Draw crown with gradient
        painter.fillPath(crown_path, gradient)
        
        # Tree trunk - convert float coordinates to integers
        trunk_width = int(size * 0.2)
        trunk_height = int(size * 0.4)
        trunk_x = int(x + (size - trunk_width) / 2)
        trunk_y = int(y + size*0.6)
        painter.fillRect(trunk_x, trunk_y, trunk_width, trunk_height, 
                        QColor(139, 69, 19))  # Saddle brown

    @staticmethod
    def draw_mountain(painter, x, y, size):
        """Draw a more detailed mountain using vector graphics"""
        mountain_path = QPainterPath()
        
        # Main peak
        mountain_path.moveTo(x + size/2, y)  # Top
        mountain_path.lineTo(x + size, y + size)  # Bottom right
        mountain_path.lineTo(x, y + size)  # Bottom left
        mountain_path.closeSubpath()
        
        # Create gradient for mountain
        gradient = QLinearGradient(x, y, x + size, y + size)
        gradient.setColorAt(0, QColor(169, 169, 169))  # Light gray
        gradient.setColorAt(1, QColor(105, 105, 105))  # Darker gray
        
        # Draw mountain with gradient
        painter.fillPath(mountain_path, gradient)
        
        # Add snow cap
        snow_path = QPainterPath()
        snow_path.moveTo(x + size/2, y)  # Peak
        snow_path.lineTo(x + size/2 + size/6, y + size/4)
        snow_path.lineTo(x + size/2 - size/6, y + size/4)
        snow_path.closeSubpath()
        painter.fillPath(snow_path, QColor(255, 250, 250))

    @staticmethod
    def draw_water(painter, x, y, size, is_deep=True):
        """Draw water with wave effects"""
        # Create base water rectangle
        water_color = QColor(28, 107, 160) if is_deep else QColor(65, 155, 249)
        painter.fillRect(x, y, size, size, water_color)
        
        # Draw wave patterns
        wave_path = QPainterPath()
        wave_height = size / 8
        num_waves = 3
        
        for i in range(num_waves):
            start_y = y + (i + 1) * size / (num_waves + 1)
            wave_path.moveTo(x, start_y)
            
            # Create sine-wave pattern
            for dx in range(0, size, 2):
                wave_y = start_y + math.sin(dx/10 + i) * wave_height
                wave_path.lineTo(x + dx, wave_y)
        
        # Draw waves with semi-transparent white
        wave_pen = QPen(QColor(255, 255, 255, 40))
        painter.setPen(wave_pen)
        painter.drawPath(wave_path)

    @staticmethod
    def draw_grass_tuft(painter, x, y, size):
        """Draw a small tuft of grass"""
        grass_path = QPainterPath()
        
        # Draw several blades of grass
        for i in range(3):
            start_x = x + i * size/3
            grass_path.moveTo(start_x, y + size)
            
            # Control points for quadratic curve
            ctrl_x = start_x + (random.random() - 0.5) * size/2
            ctrl_y = y + size/2
            end_x = start_x + (random.random() - 0.5) * size/2
            end_y = y
            
            grass_path.quadTo(ctrl_x, ctrl_y, end_x, end_y)
        
        # Create and use a pen with the gradient color
        grass_pen = QPen(QColor(126, 200, 80))
        grass_pen.setWidth(2)
        painter.setPen(grass_pen)
        painter.drawPath(grass_path)

class AnimalRenderer:
    @staticmethod
    def draw_herbivore(painter, x, y, size, color, genetics=None):
        """Draw a detailed rabbit with genetic variations"""
        x = int(x)
        y = int(y)
        size = int(size)
        
        if genetics:
            # Apply genetic modifications
            body_width = size * 0.4 * genetics.genes['body_width']
            body_length = size * 0.6 * genetics.genes['body_length']
            head_size = size * 0.35 * genetics.genes['head_size']
            ear_length = size * 0.5 * genetics.genes['ear_length']
            ear_width = size * 0.15 * genetics.genes['ear_width']
        else:
            # Default proportions
            body_width = size * 0.4
            body_length = size * 0.6
            head_size = size * 0.35
            ear_length = size * 0.5
            ear_width = size * 0.15
        
        # Body
        body = QPainterPath()
        body.addEllipse(x + size*0.2, y + size*0.3, body_length, body_width)
        
        # Head
        head = QPainterPath()
        head.addEllipse(x + size*0.45, y + size*0.15, head_size, head_size)
        
        # Ears with genetic variation
        ears = QPainterPath()
        # Left ear
        ears.moveTo(x + size*0.55, y + size*0.2)
        ears.quadTo(x + size*0.5, y - ear_length, x + size*0.6, y + size*0.15)
        # Right ear
        ears.moveTo(x + size*0.7, y + size*0.2)
        ears.quadTo(x + size*0.75, y - ear_length, x + size*0.75, y + size*0.15)
        
        # Draw parts
        painter.fillPath(body, color)
        painter.fillPath(head, color)
        
        # Draw ears with thicker outline
        painter.setPen(QPen(color.darker(130), 3))
        painter.drawPath(ears)
        
        # Eyes and nose remain constant
        painter.setBrush(QBrush(QColor(0, 0, 0)))
        painter.drawEllipse(
            int(x + size*0.55),
            int(y + size*0.25),
            int(size*0.08),
            int(size*0.08)
        )
        
        # Pink nose
        nose = QPainterPath()
        nose.addEllipse(x + size*0.7, y + size*0.35, size*0.06, size*0.04)
        painter.fillPath(nose, QColor(255, 192, 203))
        
        # Draw eyes (simple black circles)
        painter.setPen(Qt.NoPen)  # No outline for eyes
        painter.setBrush(QBrush(QColor(0, 0, 0)))  # Black eyes
        
        # Left eye
        eye_size = size * 0.08
        painter.drawEllipse(
            int(x + size * 0.5),  # Left eye position
            int(y + size * 0.25),
            int(eye_size),
            int(eye_size)
        )
        
        # Right eye
        painter.drawEllipse(
            int(x + size * 0.65),  # Right eye position
            int(y + size * 0.25),
            int(eye_size),
            int(eye_size)
        )
        
        # Add white reflection dots in eyes
        painter.setBrush(QBrush(QColor(255, 255, 255)))
        reflection_size = eye_size * 0.3
        for eye_x in [x + size * 0.52, x + size * 0.67]:
            painter.drawEllipse(
                int(eye_x),
                int(y + size * 0.26),
                int(reflection_size),
                int(reflection_size)
            )
    
    @staticmethod
    def draw_predator(painter, x, y, size, color, genetics=None):
        """Draw a detailed fox with genetic variations"""
        x = int(x)
        y = int(y)
        size = int(size)
        
        if genetics:
            # Apply genetic modifications
            body_width = size * 0.35 * genetics.genes['body_width']
            body_length = size * 0.8 * genetics.genes['body_length']
            head_size = size * 0.3 * genetics.genes['head_size']
            snout_length = size * 0.3 * genetics.genes['snout_length']
            ear_length = size * 0.3 * genetics.genes['ear_length']
            ear_width = size * 0.15 * genetics.genes['ear_width']
            tail_length = size * 0.4 * genetics.genes['tail_length']
        else:
            # Default proportions
            body_width = size * 0.35
            body_length = size * 0.8
            head_size = size * 0.3
            snout_length = size * 0.3
            ear_length = size * 0.3
            ear_width = size * 0.15
            tail_length = size * 0.4
        
        # Body
        body = QPainterPath()
        body.addEllipse(x + size*0.2, y + size*0.3, body_length, body_width)
        
        # Tail (bushy, S-shaped)
        tail = QPainterPath()
        tail.moveTo(x + size*0.2, y + size*0.4)
        tail.cubicTo(
            x + size*0.1, y + size*0.3,  # Control point 1
            x, y + size*0.4,             # Control point 2
            x + size*0.05, y + size*0.5  # End point
        )
        tail.cubicTo(
            x, y + size*0.6,             # Control point 1
            x + size*0.1, y + size*0.5,  # Control point 2
            x + size*0.2, y + size*0.4   # Back to start
        )
        
        # Head
        head = QPainterPath()
        head_x = x + size*0.6
        head_y = y + size*0.3
        
        # Base of head
        head.addEllipse(head_x, head_y, head_size, head_size)
        
        # Snout
        snout = QPainterPath()
        snout.moveTo(head_x + head_size*0.7, head_y + head_size*0.5)
        snout.quadTo(
            head_x + head_size + snout_length, head_y + head_size*0.5,  # Control point
            head_x + head_size*0.7, head_y + head_size*0.8             # End point
        )
        
        # Ears
        ears = QPainterPath()
        # Left ear
        ear_base_x = head_x + head_size*0.2
        ear_base_y = head_y
        ears.moveTo(ear_base_x, ear_base_y)
        ears.lineTo(ear_base_x - ear_width/2, ear_base_y - ear_length)  # Tip
        ears.lineTo(ear_base_x + ear_width/2, ear_base_y)
        # Right ear
        ear_base_x = head_x + head_size*0.7
        ears.moveTo(ear_base_x, ear_base_y)
        ears.lineTo(ear_base_x - ear_width/2, ear_base_y - ear_length)  # Tip
        ears.lineTo(ear_base_x + ear_width/2, ear_base_y)
        
        # Draw parts in order
        painter.fillPath(tail, color)  # Draw tail first (behind body)
        painter.fillPath(body, color)
        painter.fillPath(head, color)
        painter.fillPath(snout, color)
        
        # White parts
        white_color = QColor(255, 255, 255)
        # Chest/belly patch
        belly = QPainterPath()
        belly.addEllipse(x + size*0.4, y + size*0.4, body_length*0.4, body_width*0.8)
        painter.fillPath(belly, white_color)
        
        # Tail tip
        tail_tip = QPainterPath()
        tail_tip.addEllipse(x, y + size*0.45, size*0.1, size*0.1)
        painter.fillPath(tail_tip, white_color)
        
        # Draw ears with outline
        painter.setPen(QPen(color.darker(130), 2))
        painter.fillPath(ears, color)
        painter.drawPath(ears)
        
        # Draw eyes (yellow with black pupils)
        painter.setPen(Qt.NoPen)
        
        # Yellow eye base
        eye_color = QColor(255, 215, 0)  # Golden yellow
        painter.setBrush(QBrush(eye_color))
        
        eye_size = size * 0.1
        # Left eye
        painter.drawEllipse(
            int(x + size * 0.6),
            int(y + size * 0.25),
            int(eye_size),
            int(eye_size * 0.8)  # Slightly oval
        )
        
        # Right eye
        painter.drawEllipse(
            int(x + size * 0.75),
            int(y + size * 0.25),
            int(eye_size),
            int(eye_size * 0.8)
        )
        
        # Draw black pupils
        painter.setBrush(QBrush(QColor(0, 0, 0)))
        pupil_size = eye_size * 0.4
        
        for eye_x in [x + size * 0.63, x + size * 0.78]:
            painter.drawEllipse(
                int(eye_x),
                int(y + size * 0.27),
                int(pupil_size),
                int(pupil_size)
            )
        
        # Add white reflection dots
        painter.setBrush(QBrush(QColor(255, 255, 255)))
        reflection_size = pupil_size * 0.3
        
        for eye_x in [x + size * 0.635, x + size * 0.785]:
            painter.drawEllipse(
                int(eye_x),
                int(y + size * 0.275),
                int(reflection_size),
                int(reflection_size)
            )
    
    @staticmethod
    def draw_fish(painter, x, y, size, color):
        """Draw a fish"""
        # Convert coordinates to integers
        x = int(x)
        y = int(y)
        size = int(size)
        
        # Body
        body = QPainterPath()
        body.moveTo(x + size*0.3, y + size*0.5)
        body.quadTo(x + size*0.5, y + size*0.3, x + size*0.7, y + size*0.5)
        body.quadTo(x + size*0.5, y + size*0.7, x + size*0.3, y + size*0.5)
        
        # Tail
        tail = QPainterPath()
        tail.moveTo(x + size*0.3, y + size*0.5)
        tail.lineTo(x + size*0.1, y + size*0.3)
        tail.lineTo(x + size*0.1, y + size*0.7)
        tail.closeSubpath()
        
        # Draw with gradients
        gradient = QLinearGradient(x, y, x + size, y + size)
        gradient.setColorAt(0, color)
        gradient.setColorAt(1, color.darker(120))
        
        painter.fillPath(body, gradient)
        painter.fillPath(tail, gradient)
        
        # Eye (convert all coordinates to integers)
        eye_color = QColor(0, 0, 0)
        painter.fillRect(
            int(x + size*0.6), 
            int(y + size*0.45), 
            int(size*0.05), 
            int(size*0.05), 
            eye_color
        )

class RenderingSystem:
    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        self.terrain_renderer = TerrainRenderer()

    def render(self, surface):
        """Main render method"""
        painter = QPainter(surface)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        try:
            self.render_world(painter)
            self.render_entities(painter)
            self.render_effects(painter)
            
            # Only render UI if it exists
            if hasattr(self.ecosystem, 'ui_system'):
                self.ecosystem.ui_system.render(painter)
        finally:
            painter.end()

    def render_world(self, painter):
        """Render the world map tiles"""
        if not hasattr(self.ecosystem, 'world_map'):
            return
            
        world_map = self.ecosystem.world_map
        tile_size = world_map.tile_size
        
        for y in range(world_map.height):
            for x in range(world_map.width):
                tile = world_map.tiles[y][x]
                properties = TerrainTile.TERRAIN_PROPERTIES[tile.terrain_type]
                
                # Calculate pixel coordinates
                px = x * tile_size
                py = y * tile_size
                
                # Draw base tile
                painter.fillRect(px, py, tile_size, tile_size, properties.color)
                
                # Draw terrain-specific details
                if tile.terrain_type == TerrainType.FOREST:
                    self.terrain_renderer.draw_tree(painter, px + tile_size*0.2, py + tile_size*0.1, tile_size*0.6)
                elif tile.terrain_type == TerrainType.MOUNTAIN:
                    self.terrain_renderer.draw_mountain(painter, px + tile_size*0.1, py + tile_size*0.1, tile_size*0.8)
                elif tile.terrain_type == TerrainType.DEEP_WATER:
                    self.terrain_renderer.draw_water(painter, px, py, tile_size, True)
                elif tile.terrain_type == TerrainType.SHALLOW_WATER:
                    self.terrain_renderer.draw_water(painter, px, py, tile_size, False)
                elif tile.terrain_type == TerrainType.GRASSLAND:
                    # Draw grass tufts
                    for _ in range(3):
                        grass_x = px + random.uniform(0.2, 0.8) * tile_size
                        grass_y = py + random.uniform(0.2, 0.8) * tile_size
                        self.terrain_renderer.draw_grass_tuft(painter, grass_x, grass_y, tile_size * 0.2)
                
                # Draw subtle grid lines
                grid_pen = QPen(QColor(0, 0, 0, 30))
                painter.setPen(grid_pen)
                painter.drawRect(px, py, tile_size, tile_size)

    def render_entities(self, painter):
        """Render entities with vector graphics"""
        entities = sorted(
            [e for e in self.ecosystem.entities 
             if e.active and e.has_components(ComponentType.POSITION, ComponentType.APPEARANCE)],
            key=lambda e: e.get_component(ComponentType.APPEARANCE).layer
        )
        
        for entity in entities:
            pos = entity.get_component(ComponentType.POSITION)
            appearance = entity.get_component(ComponentType.APPEARANCE)
            stats = entity.get_component(ComponentType.STATS)
            genetics = entity.get_component(ComponentType.GENETICS) if entity.has_component(ComponentType.GENETICS) else None
            
            if not appearance.visible:
                continue
            
            # Calculate health and age factors
            health_percent = max(0.0, min(1.0, stats.energy / stats.max_energy))
            max_age = 3000
            age_factor = min(1.0, stats.age / max_age)
            
            # Calculate final color
            base_color = appearance.color
            if genetics and 'color_brightness' in genetics.genes:
                # Apply genetic color modification
                brightness = genetics.genes['color_brightness']
                base_color = QColor(
                    min(255, int(base_color.red() * brightness)),
                    min(255, int(base_color.green() * brightness)),
                    min(255, int(base_color.blue() * brightness))
                )
            
            # Apply health and age effects
            aged_color = QColor(
                int(base_color.red() * (1 - age_factor * 0.5) + 128 * age_factor * 0.5),
                int(base_color.green() * (1 - age_factor * 0.5) + 128 * age_factor * 0.5),
                int(base_color.blue() * (1 - age_factor * 0.5) + 128 * age_factor * 0.5)
            )
            
            final_color = QColor(
                int(aged_color.red() * health_percent + 128 * (1 - health_percent)),
                int(aged_color.green() * health_percent + 128 * (1 - health_percent)),
                int(aged_color.blue() * health_percent + 128 * (1 - health_percent))
            )
            
            # Calculate size
            base_size = 30 * appearance.size  # Increased base size for vector graphics
            size_modifier = 1.0 - (age_factor * 0.2)
            size = base_size * size_modifier
            
            # Draw appropriate vector graphic based on species type
            if stats.species_type == 'herbivore':
                AnimalRenderer.draw_herbivore(painter, pos.value[0], pos.value[1], size, final_color, genetics)
            elif stats.species_type == 'predator':
                AnimalRenderer.draw_predator(painter, pos.value[0], pos.value[1], size, final_color, genetics)
            elif stats.species_type == 'fish':
                AnimalRenderer.draw_fish(painter, pos.value[0], pos.value[1], size, final_color)
            elif stats.species_type == 'plant':
                self.terrain_renderer.draw_tree(painter, pos.value[0], pos.value[1], size)

    def render_effects(self, painter):
        """Render visual effects"""
        if not hasattr(self.ecosystem, 'effect_system'):
            return
        
        for effect in self.ecosystem.effect_system.effects:
            # Set color with fade
            color = effect.color
            if effect.fade:
                alpha = int(255 * effect.lifetime / effect.duration)
                color.setAlpha(alpha)
            painter.setPen(color)
            
            # Draw effect with scaling
            size = 20 * effect.scale
            painter.setFont(QFont('Segoe UI Emoji', int(size)))
            painter_pos = QPoint(
                int(effect.position[0] - size/2),
                int(effect.position[1] + size/2)
            )
            painter.drawText(painter_pos, effect.char)