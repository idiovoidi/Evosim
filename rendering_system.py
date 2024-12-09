from PyQt6.QtGui import (QPainter, QFont, QColor, QPainterPath, 
                        QLinearGradient, QPen)
from PyQt6.QtCore import QPoint, Qt
from components import Position, Appearance, ComponentType
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
        
        # Tree trunk
        trunk_width = size * 0.2
        trunk_height = size * 0.4
        trunk_x = x + (size - trunk_width) / 2
        trunk_y = y + size*0.6
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
        
        # Draw mountain with gradient and slight shadow
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

class RenderingSystem:
    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        self.terrain_renderer = TerrainRenderer()
    
    def render(self, surface):
        """Main render method"""
        # Create painter for the surface
        painter = QPainter(surface)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        try:
            # Render the world map
            self.render_world(painter)
            
            # Render entities
            self.render_entities(painter)
            
            # Render UI on top
            self.ecosystem.ui_system.render(painter)
            
        finally:
            # Always end painting
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
        """Render entities with Position and Appearance components"""
        # Sort entities by layer for proper rendering order
        entities = sorted(
            [e for e in self.ecosystem.entities 
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