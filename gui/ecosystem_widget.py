from PyQt6.QtWidgets import QWidget
from PyQt6.QtCore import QTimer
from systems.movement_system import MovementSystem
from systems.health_system import HealthSystem
from graphics.rendering_system import RenderingSystem
from systems.ui_system import UISystem
from systems.behavior_system import BehaviorSystem
from systems.plant_system import PlantSystem
from systems.map_system import WorldMap, TerrainType
from systems.world import World
import random
import numpy as np
from PyQt6.QtGui import QColor
from components import (ComponentType, Position, Velocity, Stats, Status, 
                       Appearance, Memory, Traits, Collision, Genetics)
from entities.entity import Entity
from systems.event_effect_system import EventEffectSystem
from systems.genetic_system import EnhancedGeneticSystem
from PyQt6.QtCore import Qt

class EcosystemWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Create world
        self.world = World(width=100, height=100)
        
        # Initialize systems with world
        self.movement_system = MovementSystem(self.world)
        self.health_system = HealthSystem(self.world)
        self.behavior_system = BehaviorSystem(self.world)
        self.ui_system = UISystem(self.world)
        self.rendering_system = RenderingSystem(self.world)
        self.plant_system = PlantSystem(self.world)
        
        self.systems = [
            self.movement_system,
            self.health_system,
            self.behavior_system,
            self.plant_system,
            self.ui_system,
            self.rendering_system
        ]
        
        # Setup update timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_simulation)
        self.timer.start(16)
        
        # Spawn initial entities
        self.world.spawn_initial_entities()
        
        # Add camera/view properties
        self.view_offset_x = 0
        self.view_offset_y = 0
        self.view_scale = 1.0
    
    def screen_to_world(self, screen_x: float, screen_y: float) -> tuple:
        """Convert screen coordinates to world coordinates"""
        # Apply view transformation
        world_x = (screen_x - self.view_offset_x) / self.view_scale
        world_y = (screen_y - self.view_offset_y) / self.view_scale
        return (world_x, world_y)
    
    def world_to_screen(self, world_x: float, world_y: float) -> tuple:
        """Convert world coordinates to screen coordinates"""
        # Apply inverse view transformation
        screen_x = world_x * self.view_scale + self.view_offset_x
        screen_y = world_y * self.view_scale + self.view_offset_y
        return (screen_x, screen_y)
    
    def update_simulation(self):
        """Update all simulation systems"""
        dt = 1/60  # Fixed timestep
        
        # Update all systems
        for system in self.systems:
            system.update(dt)
            
        # Update world
        self.world.update(dt)
        
        # Request repaint
        self.update()
    
    def paintEvent(self, event):
        """Handle painting of the ecosystem"""
        # The rendering system will handle the actual drawing
        self.rendering_system.render(self)
    
    def mouseMoveEvent(self, event):
        """Handle mouse move events"""
        world_pos = self.screen_to_world(event.position().x(), event.position().y())
        self.world.set_mouse_pos(world_pos)
    
    def mousePressEvent(self, event):
        """Handle mouse press events"""
        if event.button() == Qt.MouseButton.LeftButton:
            # Convert screen coordinates to world coordinates
            world_pos = self.screen_to_world(event.position().x(), event.position().y())
            if self.world.handle_click(world_pos):
                self.update()  # Redraw if an entity was selected