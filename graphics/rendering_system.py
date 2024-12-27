from PyQt6.QtGui import QPainter, QColor, QFont, QPen
from PyQt6.QtCore import Qt, QPoint, QRect
from components import ComponentType
from systems.base_system import BaseSystem
from entities.entity import Entity
from graphics.animal_renderer import AnimalRenderer
from graphics.terrain_renderer import TerrainRenderer
from graphics.effect_renderer import EffectRenderer
from systems.map_system import TerrainType, TerrainTile
import math
import random

class RenderingSystem(BaseSystem):
    def __init__(self, world):
        super().__init__(world)
        self.terrain_renderer = TerrainRenderer()
        self.animal_renderer = AnimalRenderer()
        self.effect_renderer = EffectRenderer()
        self.animation_time = 0.0

    def update(self, dt: float):
        """Update visual states and animations"""
        self.animation_time += dt
        
        # Update any visual effects or animations
        for entity in self.world.get_entities():
            if not entity.has_component(ComponentType.APPEARANCE):
                continue
            
            appearance = entity.get_component(ComponentType.APPEARANCE)
            
            # Animate plants swaying - make it smoother and slower
            if entity.has_component(ComponentType.STATS):
                stats = entity.get_component(ComponentType.STATS)
                if stats.species_type == 'plant':
                    # Slower, gentler sway animation
                    sway = math.sin(self.animation_time * 0.5 + hash(entity.id) % 10) * 0.05
                    appearance.rotation = sway
            
            # Animate hearts above breeding animals
            if entity.has_component(ComponentType.STATUS):
                status = entity.get_component(ComponentType.STATUS)
                if status.showing_heart > 0:
                    status.showing_heart -= dt
                    if status.showing_heart <= 0:
                        status.showing_heart = 0

    def render(self, surface):
        """Main render method"""
        painter = QPainter(surface)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        try:
            # Apply view transformation
            painter.translate(surface.view_offset_x, surface.view_offset_y)
            painter.scale(surface.view_scale, surface.view_scale)
            
            # Render terrain first
            if hasattr(self.world, 'world_map'):
                self.render_terrain(painter)
            
            # Then render entities
            self.render_entities(painter)
            
            # Reset transformation for UI elements
            painter.resetTransform()
            
            # Finally render effects and UI
            if hasattr(self.world, 'effect_system'):
                self.render_effects(painter)
            
            if hasattr(self.world, 'ui_system'):
                self.world.ui_system.render(painter)
            
            # Draw entity inspector window (in screen space)
            self.world.entity_inspector.render(painter)
            
        finally:
            painter.end()

    def render_terrain(self, painter):
        """Render the world map tiles"""
        if not hasattr(self.world, 'world_map'):
            return
            
        world_map = self.world.world_map
        tile_size = int(world_map.tile_size)
        
        for y in range(world_map.height):
            for x in range(world_map.width):
                tile = world_map.tiles[y][x]
                properties = TerrainTile.TERRAIN_PROPERTIES[tile.terrain_type]
                
                # Calculate pixel coordinates
                px = int(x * tile_size)
                py = int(y * tile_size)
                
                # Draw base tile using QRect
                tile_rect = QRect(px, py, tile_size, tile_size)
                painter.fillRect(tile_rect, properties.color)
                
                # Draw terrain-specific details
                if tile.terrain_type == TerrainType.FOREST:
                    self.terrain_renderer.draw_tree(painter, 
                        int(px + tile_size*0.2), 
                        int(py + tile_size*0.1), 
                        int(tile_size*0.6))
                elif tile.terrain_type == TerrainType.MOUNTAIN:
                    self.terrain_renderer.draw_mountain(painter, 
                        int(px + tile_size*0.1), 
                        int(py + tile_size*0.1), 
                        int(tile_size*0.8))
                elif tile.terrain_type == TerrainType.DEEP_WATER:
                    self.terrain_renderer.draw_water(painter, px, py, tile_size, True)
                elif tile.terrain_type == TerrainType.SHALLOW_WATER:
                    self.terrain_renderer.draw_water(painter, px, py, tile_size, False)
                elif tile.terrain_type == TerrainType.GRASSLAND:
                    # Draw grass tufts
                    for _ in range(3):
                        grass_x = int(px + random.uniform(0.2, 0.8) * tile_size)
                        grass_y = int(py + random.uniform(0.2, 0.8) * tile_size)
                        self.terrain_renderer.draw_grass_tuft(painter, grass_x, grass_y, int(tile_size * 0.2))
                
                # Draw subtle grid lines using QRect
                grid_pen = QPen(QColor(0, 0, 0, 30))
                painter.setPen(grid_pen)
                painter.drawRect(tile_rect)

    def render_entities(self, painter):
        """Render all entities in the world"""
        # Get all entities from world, sorted by layer
        entities = sorted(
            [e for e in self.world.get_entities()
             if e.has_component(ComponentType.POSITION) and 
                e.has_component(ComponentType.APPEARANCE)],
            key=lambda e: e.get_component(ComponentType.APPEARANCE).layer
        )
        
        for entity in entities:
            pos = entity.get_component(ComponentType.POSITION)
            appearance = entity.get_component(ComponentType.APPEARANCE)
            genetics = entity.get_component(ComponentType.GENETICS) if entity.has_component(ComponentType.GENETICS) else None
            
            if not appearance.visible:
                continue
            
            # Calculate final color with genetics
            final_color = appearance.color
            if genetics and 'color_brightness' in genetics.genes:
                brightness = genetics.genes['color_brightness']
                final_color = QColor(
                    min(255, int(appearance.color.red() * brightness)),
                    min(255, int(appearance.color.green() * brightness)),
                    min(255, int(appearance.color.blue() * brightness))
                )
            
            # Calculate size
            size = 30 * appearance.size  # Base size for vector graphics
            
            # Draw appropriate vector graphic based on species type
            if entity.has_component(ComponentType.STATS):
                stats = entity.get_component(ComponentType.STATS)
                if stats.species_type == 'herbivore':
                    AnimalRenderer.draw_herbivore(painter, pos.value[0], pos.value[1], size, final_color, genetics)
                elif stats.species_type == 'predator':
                    AnimalRenderer.draw_predator(painter, pos.value[0], pos.value[1], size, final_color, genetics)
                elif stats.species_type == 'plant':
                    self.terrain_renderer.draw_tree(painter, pos.value[0], pos.value[1], size)

    def render_effects(self, painter):
        """Render visual effects"""
        if not hasattr(self.world, 'effect_system'):
            return
        
        for effect in self.world.effect_system.effects:
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