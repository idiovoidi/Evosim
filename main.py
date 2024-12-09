from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QTextEdit, 
                            QSplitter, QVBoxLayout)
from PyQt6.QtCore import QTimer, Qt, QRect, QPoint
from PyQt6.QtGui import QPainter, QFont, QColor, QBrush
import sys
import numpy as np
import math
import random
from datetime import datetime
from map_system import WorldMap, TerrainType
from systems.human_system import Human, Building, BuildingType
from sounds import SoundManager
from components import ComponentType, Position, Velocity, Stats, Status, Appearance, Memory, Traits, Collision
from entity import Entity
import os
import json
from animal_logic.herbivore import Herbivore
from animal_logic.predator import Predator
from animal_logic.fish import Fish
from systems.movement_system import MovementSystem
from systems.health_system import HealthSystem
from systems.rendering_system import RenderingSystem
from systems.ui_system import UISystem

# Create saves directory if it doesn't exist
SAVES_DIR = "saves"
if not os.path.exists(SAVES_DIR):
    os.makedirs(SAVES_DIR)

class LogPanel(QTextEdit):
    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setFont(QFont('Courier', 10))
        self.document().setMaximumBlockCount(100)
    
    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.append(f"[{timestamp}] {message}")
        # Auto-scroll to bottom
        self.verticalScrollBar().setValue(self.verticalScrollBar().maximum())

def create_species(char: str, x: float, y: float, species_type: str) -> Entity:
    entity = Entity()
    
    # Position component
    entity.add_component(ComponentType.POSITION, 
                        Position(np.array([x, y], dtype=float)))
    
    # Velocity component
    entity.add_component(ComponentType.VELOCITY, 
                        Velocity(np.array([0.0, 0.0], dtype=float)))
    
    # Stats component
    base_energy = 200.0 if species_type == 'predator' else 100.0
    entity.add_component(ComponentType.STATS, 
                        Stats(energy=base_energy, species_type=species_type))
    
    # Appearance component
    base_colors = {
        'plant': QColor(50, 205, 50),     # Green for plants
        'herbivore': QColor(30, 144, 255), # Blue for herbivores
        'predator': QColor(220, 20, 60)    # Red for predators
    }
    entity.add_component(ComponentType.APPEARANCE, 
                        Appearance(char=char, color=base_colors[species_type]))
    
    return entity

class Species:
    def __init__(self, char, x, y, species_type):
        self.char = char
        self.pos = np.array([x, y], dtype=float)
        self.vel = np.array([0.0, 0.0], dtype=float)
        
        # Adjust initial energy based on species type
        self.energy = 200.0 if species_type == 'predator' else 100.0  # Double energy for predators
        self.species_type = species_type
        self.age = 0
        
        # Advanced traits that can evolve
        base_metabolism = 0.05 if species_type == 'predator' else 0.1  # Lower metabolism for predators
        self.traits = {
            'speed': random.uniform(0.05, 0.15),
            'sense_radius': random.uniform(3.0, 7.0),
            'metabolism': random.uniform(base_metabolism, base_metabolism * 2),
            'size': random.uniform(0.8, 1.2),
            'aggression': random.uniform(0.0, 1.0),
            'intelligence': random.uniform(0.0, 1.0),
            'memory': random.uniform(0.0, 1.0),
        }
        
        # Memory of good/bad locations
        self.memory_spots = {
            'food': [],      # Remember good feeding spots
            'danger': [],    # Remember dangerous areas
            'water': []      # Remember water locations
        }
        
        # Status effects
        self.is_hungry = False
        self.is_thirsty = False
        self.is_tired = False
        self.last_reproduction = 0
        
        # Set color based on species type and traits
        base_color = {
            'plant': (50, 205, 50),     # Green for plants
            'herbivore': (30, 144, 255), # Blue for herbivores
            'predator': (220, 20, 60)    # Red for predators
        }[species_type]
        
        # Modify color based on traits
        r, g, b = base_color
        r = min(255, int(r * (1 + self.traits['aggression'] * 0.3)))
        g = min(255, int(g * (1 + self.traits['intelligence'] * 0.3)))
        b = min(255, int(b * (1 + self.traits['speed'] * 0.3)))
        self.color = QColor(r, g, b)
        
        self.reproduction_cooldown = 0  # Add reproduction cooldown
        self.showing_heart = 0  # Counter for showing heart during reproduction
        
        # Adjust reproduction settings based on species
        self.reproduction_settings = {
            'plant': {'cooldown': 200, 'chance': 0.02, 'energy_threshold': 100},
            'herbivore': {'cooldown': 300, 'chance': 0.05, 'energy_threshold': 150},
            'predator': {'cooldown': 400, 'chance': 0.03, 'energy_threshold': 200},
            'fish': {'cooldown': 250, 'chance': 0.04, 'energy_threshold': 120}
        }.get(species_type, {'cooldown': 300, 'chance': 0.05, 'energy_threshold': 150})
    
    def remember_location(self, pos, type_key):
        """Remember a location for future reference"""
        self.memory_spots[type_key].append({
            'pos': pos.copy(),
            'time': 0,
            'value': 1.0
        })
        # Limit memory size
        if len(self.memory_spots[type_key]) > 5:
            self.memory_spots[type_key].pop(0)
    
    def get_best_memory_spot(self, type_key):
        """Get the best remembered spot of a given type"""
        if not self.memory_spots[type_key]:
            return None
        return max(self.memory_spots[type_key], key=lambda x: x['value'])['pos']
    
    def update_status(self):
        """Update organism's status based on conditions"""
        self.is_hungry = self.energy < 50
        self.is_thirsty = random.random() < 0.001  # Random thirst
        self.is_tired = self.age % 1000 > 800  # Get tired periodically
    
    def mutate(self):
        """Return a mutated copy of traits for offspring"""
        new_traits = self.traits.copy()
        for trait in new_traits:
            if random.random() < 0.1:  # 10% mutation chance
                new_traits[trait] *= random.uniform(0.8, 1.2)
        return new_traits
    
    def can_reproduce(self):
        settings = self.reproduction_settings
        return (self.energy > settings['energy_threshold'] and 
                self.reproduction_cooldown <= 0 and 
                random.random() < settings['chance'])

class EventIndicator:
    def __init__(self, pos, text, color, duration=60):
        self.pos = pos.copy()
        self.text = text
        self.color = color
        self.duration = duration
        self.alpha = 255
        self.vel = np.array([0, -1])  # Move upward
    
    def update(self):
        """Update indicator position and alpha. Returns False when expired."""
        self.pos += self.vel
        self.alpha = max(0, self.alpha - 255/self.duration)
        return self.alpha > 0

class EcosystemWidget(QWidget):
    def __init__(self, log_panel):
        super().__init__()
        self.bounds = (0, 2000)
        self.entities = []
        self.log_panel = log_panel
        self.stats = {}
        
        # Initialize systems
        self.movement_system = MovementSystem(self)
        self.health_system = HealthSystem(self)
        self.rendering_system = RenderingSystem(self)
        self.ui_system = UISystem(self)
        
        self.systems = [
            self.movement_system,
            self.health_system,
            self.ui_system,
            self.rendering_system
        ]
        
        # Generate new map
        self.world_map = WorldMap(width=40, height=40, tile_size=50)
        self.log_panel.log("Generated new map")
        
        # Add counters for statistics
        self.stats = {
            'plants': 0,
            'herbivores': 0,
            'predators': 0,
            'deaths': {'starvation': 0}
        }
        
        # Initialize ecosystem with entities
        self.init_ecosystem()
        self.log_panel.log("Ecosystem initialized")
        self.update_population_stats()
        
        self.sound_manager = SoundManager()
        self.event_indicators = []
        
        # Setup update timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_simulation)
        self.timer.start(16)
    
    def create_entity(self, char: str, x: float, y: float, species_type: str) -> Entity:
        """Create a new entity with components"""
        entity = Entity()
        
        # Position component
        entity.add_component(ComponentType.POSITION, 
                        Position(np.array([x, y])))
        
        # Velocity component
        entity.add_component(ComponentType.VELOCITY, 
                        Velocity(np.array([0.0, 0.0])))
        
        # Stats component with proper energy values
        base_energy = {
            'predator': 200.0,
            'herbivore': 150.0,
            'plant': 100.0,
            'fish': 120.0  # Add fish base energy
        }.get(species_type, 100.0)
        
        entity.add_component(ComponentType.STATS, 
                        Stats(energy=base_energy, 
                             max_energy=base_energy * 1.5,
                             species_type=species_type))
        
        # Appearance component
        base_colors = {
            'plant': QColor(50, 205, 50),      # Green for plants
            'herbivore': QColor(30, 144, 255), # Blue for herbivores
            'predator': QColor(220, 20, 60),   # Red for predators
            'fish': QColor(70, 130, 180)       # Steel blue for fish
        }
        
        # Use a default color if species_type not found
        color = base_colors.get(species_type, QColor(128, 128, 128))  # Gray as default
        entity.add_component(ComponentType.APPEARANCE, 
                        Appearance(char=char, color=color))
        
        # Add components for animals (including fish)
        if species_type != 'plant':
            # Memory component
            entity.add_component(ComponentType.MEMORY, Memory(capacity=10))
            
            # Traits with balanced values
            base_metabolism = {
                'predator': 0.02,
                'herbivore': 0.03,
                'fish': 0.025  # Add fish metabolism
            }.get(species_type, 0.03)
            
            entity.add_component(ComponentType.TRAITS, 
                           Traits(speed=random.uniform(0.05, 0.15),
                                sense_radius=random.uniform(3.0, 7.0),
                                metabolism=random.uniform(base_metabolism, base_metabolism * 1.5),
                                size=random.uniform(0.8, 1.2),
                                aggression=random.uniform(0.0, 1.0),
                                intelligence=random.uniform(0.0, 1.0),
                                memory=random.uniform(0.0, 1.0)))
            
            # Status component
            entity.add_component(ComponentType.STATUS, 
                           Status(is_hungry=False,
                                is_thirsty=False,
                                is_tired=False))
            
            # Collision component
            entity.add_component(ComponentType.COLLISION, 
                           Collision(radius=10.0))
        
        return entity
    
    def init_ecosystem(self):
        # Initialize plants
        for _ in range(20):
            self.spawn_organism('plant', '🌿')
        
        # Initialize herbivores
        for _ in range(10):
            self.spawn_organism('herbivore', '🐰')
        
        # Initialize predators
        for _ in range(5):
            self.spawn_organism('predator', '🦊')
        
        # Initialize fish in water tiles
        self.spawn_fish()
    
    def spawn_organism(self, species_type, char):
        """Spawn a new organism in a valid location"""
        for _ in range(10):  # Maximum attempts
            x = random.uniform(*self.bounds)
            y = random.uniform(*self.bounds)
            tile = self.world_map.get_tile_at_position(x, y)
            
            # Don't spawn in water
            if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                entity = self.create_entity(char, x, y, species_type)
                self.entities.append(entity)
                self.log_panel.log(f"Spawned {species_type} at ({int(x)}, {int(y)})")
                return entity
        
        self.log_panel.log(f"Failed to spawn {species_type}")
        return None
    
    def paintEvent(self, event):
        """Handle paint event using the rendering system"""
        if hasattr(self, 'rendering_system'):
            self.rendering_system.render(self)
    
    def update_population_stats(self):
        """Update population statistics based on entities"""
        stats = {
            'plants': 0,
            'herbivores': 0,
            'predators': 0,
            'fish': 0
        }
        
        for entity in self.entities:
            if not entity.active or not entity.has_component(ComponentType.STATS):
                continue
                
            stats_component = entity.get_component(ComponentType.STATS)
            species_type = stats_component.species_type
            if species_type in stats:
                stats[species_type] += 1
        
        self.stats = {
            **stats,
            'deaths': self.stats.get('deaths', {'starvation': 0})
        }
    
    def update_simulation(self):
        dt = 1/60  # Fixed time step
        
        # Update all systems except rendering
        for system in self.systems:
            if system is not self.rendering_system:  # Use 'is' for identity comparison
                system.update(dt)
        
        # Update statistics (but don't log them)
        if random.random() < 0.01:
            self.update_population_stats()
        
        # Trigger repaint
        self.update()
    
    def save_state(self):
        """Save current ecosystem state"""
        try:
            state_data = {
                'entities': [
                    {
                        'type': e.get_component(ComponentType.STATS).species_type,
                        'position': e.get_component(ComponentType.POSITION).value.tolist(),
                        'energy': e.get_component(ComponentType.STATS).energy
                    }
                    for e in self.entities if e.active
                ],
                'stats': self.stats
            }
            
            filepath = os.path.join(SAVES_DIR, 'ecosystem_state.json')
            with open(filepath, 'w') as f:
                json.dump(state_data, f, indent=2)
            
            self.log_panel.log("Ecosystem state saved successfully")
            return True
            
        except Exception as e:
            self.log_panel.log(f"Error saving ecosystem state: {e}")
            return False
    
    def spawn_fish(self):
        """Spawn fish in water tiles"""
        for y in range(self.world_map.height):
            for x in range(self.world_map.width):
                tile = self.world_map.tiles[y][x]
                if tile.terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                    if random.random() < 0.3:  # 30% chance for each water tile
                        pos_x = x * self.world_map.tile_size + self.world_map.tile_size/2
                        pos_y = y * self.world_map.tile_size + self.world_map.tile_size/2
                        entity = self.create_entity('🐟', pos_x, pos_y, 'fish')
                        self.entities.append(entity)
                        self.log_panel.log(f"Spawned fish at ({int(pos_x)}, {int(pos_y)})")
    
    def should_entity_die(self, entity):
        """Check if entity should die"""
        if not entity.has_component(ComponentType.STATS):
            return False
        
        stats = entity.get_component(ComponentType.STATS)
        return stats.energy <= -20  # More lenient death threshold
    
    def kill_entity(self, entity):
        """Handle entity death"""
        if not entity.has_component(ComponentType.STATS):
            return
        
        stats = entity.get_component(ComponentType.STATS)
        self.stats['deaths']['starvation'] += 1
        
        # Log death with more information
        self.log_panel.log(
            f"{stats.species_type} died (Energy: {stats.energy:.1f}, "
            f"Health: {stats.health:.1f})"
        )
        
        entity.destroy()
        self.entities.remove(entity)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Ecosystem Simulation")
        
        # Increase map size and tile size for better visibility
        map_width = 40 * 50  # 40 tiles * 50 pixels
        map_height = 40 * 50
        log_width = 400  # Wider log panel
        
        total_width = map_width + log_width + 50
        total_height = map_height + 50
        
        self.setGeometry(50, 50, total_width, total_height)
        self.setFixedSize(total_width, total_height)
        
        # Create main widget and layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        
        # Create splitter for ecosystem and log
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Create and add log panel
        self.log_panel = LogPanel()
        self.log_panel.setFont(QFont('Courier', 11))  # Larger font
        
        # Create and add ecosystem with larger dimensions
        self.ecosystem = EcosystemWidget(self.log_panel)
        
        # Add widgets to splitter
        splitter.addWidget(self.ecosystem)
        splitter.addWidget(self.log_panel)
        
        # Set initial sizes (75% ecosystem, 25% log)
        splitter.setSizes([map_width, log_width])
        
        layout.addWidget(splitter)

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
