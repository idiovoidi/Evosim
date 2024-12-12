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
        self.world.set_mouse_pos((event.position().x(), event.position().y()))