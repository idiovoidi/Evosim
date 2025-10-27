"""Main ecosystem widget for rendering and updating the simulation"""
from PyQt6.QtWidgets import QWidget
from PyQt6.QtCore import QTimer

from systems.movement_system import MovementSystem
from systems.health_system import HealthSystem
from graphics.rendering_system import RenderingSystem
from systems.ui_system import UISystem
from systems.behavior_system import BehaviorSystem
from systems.plant_system import PlantSystem
from systems.world import World
from constants import BASE_TIMER_INTERVAL, BASE_FRAME_TIME


class EcosystemWidget(QWidget):
    """Main widget for the ecosystem simulation"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Create world
        self.world = World(width=100, height=100)
        
        # Initialize systems in update order
        self.systems = [
            BehaviorSystem(self.world),
            MovementSystem(self.world),
            HealthSystem(self.world),
            PlantSystem(self.world),
            UISystem(self.world),
            RenderingSystem(self.world)
        ]
        
        # Keep references to specific systems for external access
        self.rendering_system = self.systems[-1]
        self.ui_system = self.systems[-2]
        
        # Setup update timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_simulation)
        self.timer.start(BASE_TIMER_INTERVAL)
        
        # Spawn initial entities
        self.world.spawn_initial_entities()
    
    def update_simulation(self):
        """Update all simulation systems"""
        dt = BASE_FRAME_TIME
        
        # Update all systems in order
        for system in self.systems:
            try:
                system.update(dt)
            except Exception as e:
                print(f"Error updating system {system.__class__.__name__}: {e}")
        
        # Update world state
        self.world.update(dt)
        
        # Request repaint
        self.update()
    
    def paintEvent(self, event):
        """Handle painting of the ecosystem"""
        self.rendering_system.render(self)
    
    def mouseMoveEvent(self, event):
        """Handle mouse move events"""
        self.world.set_mouse_pos((event.position().x(), event.position().y()))