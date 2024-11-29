from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QTextEdit, 
                            QSplitter, QVBoxLayout)
from PyQt6.QtCore import QTimer, Qt
from PyQt6.QtGui import QPainter, QFont, QColor, QBrush
import sys
import numpy as np
import math
import random
from datetime import datetime

class LogPanel(QTextEdit):
    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setFont(QFont('Courier', 10))
        self.setMaximumBlockCount(100)  # Limit number of lines for performance
    
    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.append(f"[{timestamp}] {message}")
        # Auto-scroll to bottom
        self.verticalScrollBar().setValue(self.verticalScrollBar().maximum())

class Species:
    def __init__(self, char, x, y, species_type):
        self.char = char
        self.pos = np.array([x, y], dtype=float)
        self.vel = np.array([0.0, 0.0], dtype=float)
        self.energy = 100.0
        self.species_type = species_type
        
        # Species-specific traits
        self.speed = random.uniform(0.05, 0.15)
        self.sense_radius = random.uniform(3.0, 7.0)
        self.metabolism = random.uniform(0.1, 0.3)
        
        # Set color based on species type
        self.color = {
            'plant': QColor(50, 205, 50),     # Green for plants
            'herbivore': QColor(30, 144, 255), # Blue for herbivores
            'predator': QColor(220, 20, 60)    # Red for predators
        }[species_type]

class EcosystemWidget(QWidget):
    def __init__(self, log_panel):
        super().__init__()
        self.bounds = (0, 800)
        self.organisms = []
        self.log_panel = log_panel
        
        # Add counters for statistics
        self.stats = {
            'plants': 0,
            'herbivores': 0,
            'predators': 0,
            'deaths': {'starvation': 0}
        }
        
        # Simulation settings
        self.PLANT_GROWTH_RATE = 0.01
        self.ENERGY_TRANSFER = 50
        self.REPRODUCTION_THRESHOLD = 150
        
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_simulation)
        self.timer.start(16)
        
        self.init_ecosystem()
        self.log_panel.log("Ecosystem initialized")
        self.update_population_stats()
    
    def update_population_stats(self):
        self.stats['plants'] = len([o for o in self.organisms if o.species_type == 'plant'])
        self.stats['herbivores'] = len([o for o in self.organisms if o.species_type == 'herbivore'])
        self.stats['predators'] = len([o for o in self.organisms if o.species_type == 'predator'])
        
        self.log_panel.log(
            f"Population: 🌿:{self.stats['plants']} "
            f"🐰:{self.stats['herbivores']} "
            f"🦊:{self.stats['predators']}"
        )
    
    def spawn_organism(self, species_type, char):
        x = random.uniform(*self.bounds)
        y = random.uniform(*self.bounds)
        organism = Species(char, x, y, species_type)
        self.organisms.append(organism)
        return organism
    
    def find_nearest(self, organism, target_type):
        nearest = None
        min_dist = float('inf')
        
        for other in self.organisms:
            if other != organism and other.species_type == target_type:
                dist = np.linalg.norm(other.pos - organism.pos)
                if dist < min_dist and dist < organism.sense_radius * 50:  # Scaled for pixels
                    min_dist = dist
                    nearest = other
        
        return nearest
    
    def move_towards(self, organism, target, flee=False):
        if target is None:
            # Random movement if no target
            angle = random.uniform(0, 2 * math.pi)
            organism.vel = organism.speed * 5 * np.array([math.cos(angle), math.sin(angle)])
        else:
            direction = target.pos - organism.pos
            if flee:
                direction = -direction
            
            if np.linalg.norm(direction) > 0:
                direction = direction / np.linalg.norm(direction)
                organism.vel = direction * organism.speed * 5
    
    def update_simulation(self):
        initial_counts = {
            'plants': self.stats['plants'],
            'herbivores': self.stats['herbivores'],
            'predators': self.stats['predators']
        }
        
        # Update all organisms
        for organism in self.organisms[:]:
            # Update position
            organism.pos += organism.vel
            
            # Boundary checking
            for i in range(2):
                if organism.pos[i] < 0:
                    organism.pos[i] = 0
                    organism.vel[i] *= -1
                elif organism.pos[i] > self.bounds[1]:
                    organism.pos[i] = self.bounds[1]
                    organism.vel[i] *= -1
            
            # Species-specific behavior
            if organism.species_type == 'herbivore':
                target = self.find_nearest(organism, 'plant')
                predator = self.find_nearest(organism, 'predator')
                
                if predator and np.linalg.norm(predator.pos - organism.pos) < 100:
                    self.move_towards(organism, predator, flee=True)
                else:
                    self.move_towards(organism, target)
                
                # Eating
                if target and np.linalg.norm(target.pos - organism.pos) < 20:
                    organism.energy += self.ENERGY_TRANSFER
                    self.organisms.remove(target)
                    self.log_panel.log(f"🐰 ate a 🌿 (Energy: {organism.energy:.1f})")
            
            elif organism.species_type == 'predator':
                target = self.find_nearest(organism, 'herbivore')
                self.move_towards(organism, target)
                
                # Eating
                if target and np.linalg.norm(target.pos - organism.pos) < 20:
                    organism.energy += self.ENERGY_TRANSFER
                    self.organisms.remove(target)
                    self.log_panel.log(f"🦊 ate a 🐰 (Energy: {organism.energy:.1f})")
            
            # Energy consumption
        