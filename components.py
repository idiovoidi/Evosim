from dataclasses import dataclass
from enum import Enum, auto
import numpy as np
from PyQt6.QtGui import QColor
from typing import Dict, List, Optional
import random

class ComponentType(Enum):
    POSITION = auto()
    VELOCITY = auto()
    APPEARANCE = auto()
    STATS = auto()
    MEMORY = auto()
    STATUS = auto()
    TRAITS = auto()
    INVENTORY = auto()
    SKILLS = auto()
    AI = auto()
    COLLISION = auto()
    GENETICS = auto()

class Position:
    def __init__(self, value):
        """Initialize position with a numpy array or x,y coordinates"""
        if isinstance(value, np.ndarray):
            self.value = value
        else:
            self.value = np.array([value[0], value[1]], dtype=float)
        self.previous = self.value.copy()  # For interpolation/collision detection

class Velocity:
    def __init__(self, value):
        """Initialize velocity with a numpy array or dx,dy values"""
        if isinstance(value, np.ndarray):
            self.value = value
        else:
            self.value = np.array([value[0], value[1]], dtype=float)
        self.max_speed = 5.0
    
    def clamp_velocity(self):
        """Limit velocity to max speed"""
        speed = np.linalg.norm(self.value)
        if speed > self.max_speed:
            self.value = (self.value / speed) * self.max_speed

class Appearance:
    def __init__(self, char, color, size=1.0, visible=True, layer=0):
        self.char = char
        self.color = color
        self.size = size
        self.visible = visible
        self.layer = layer

class Stats:
    def __init__(self, energy, max_energy=None, species_type='plant', 
                 health=100.0, max_health=None, age=0, 
                 reproduction_cooldown=0, showing_heart=0):
        self.energy = energy
        self.max_energy = max_energy or energy * 1.5
        self.species_type = species_type
        self.health = health
        self.max_health = max_health or health
        self.age = age  # Track age in frames
        self.reproduction_cooldown = reproduction_cooldown
        self.showing_heart = showing_heart

class Memory:
    def __init__(self, spots=None, capacity=10):
        """Initialize memory with optional spots dictionary and capacity"""
        self.spots = spots if spots is not None else {
            'food': [],
            'danger': [],
            'water': []
        }
        self.capacity = capacity
    
    def remember(self, category, pos, value=1.0):
        """Remember a location in a specific category"""
        if category not in self.spots:
            return
        
        self.spots[category].append({
            'pos': pos.copy() if hasattr(pos, 'copy') else pos,
            'time': 0,
            'value': value
        })
        
        # Maintain capacity limit
        if len(self.spots[category]) > self.capacity:
            self.spots[category].pop(0)

class Status:
    def __init__(self, is_hungry=False, is_thirsty=False, is_tired=False, 
                 is_mating=False, last_reproduction=0, state='idle', 
                 status_effects=None):
        self.is_hungry = is_hungry
        self.is_thirsty = is_thirsty
        self.is_tired = is_tired
        self.is_mating = is_mating
        self.last_reproduction = last_reproduction
        self.state = state
        self.status_effects = status_effects or []
        self.showing_heart = 0  # Add this attribute to track heart effect duration

class Traits:
    def __init__(self):
        self.metabolism = 1.0
        self.speed = 1.0
        self.sense_radius = 1.0
        self.attack_strength = 1.0  # For predators

class Inventory:
    def __init__(self, capacity, items=None):
        self.capacity = capacity
        self.items = items or {}

class Skills:
    def __init__(self):
        self.values = {}
        self.experience = {}
    
    def improve(self, skill, amount):
        if skill not in self.values:
            self.values[skill] = 0.0
            self.experience[skill] = 0.0
        
        self.experience[skill] += amount
        while self.experience[skill] >= 1.0:
            self.experience[skill] -= 1.0
            self.values[skill] += 0.1

class AI:
    def __init__(self, behavior_tree=None, current_task=None, target=None):
        self.behavior_tree = behavior_tree or {}
        self.current_task = current_task
        self.target = target

class Collision:
    def __init__(self, radius, mask=1, is_trigger=False):
        self.radius = radius
        self.mask = mask
        self.is_trigger = is_trigger

class Genetics:
    def __init__(self, genes=None):
        # Initialize with random genes if none provided
        self.genes = genes or {
            # Body proportions
            'body_length': random.uniform(0.8, 1.2),    # Affects body length
            'body_width': random.uniform(0.8, 1.2),     # Affects body width
            'neck_length': random.uniform(0.8, 1.2),    # Affects distance between head and body
            
            # Head features
            'head_size': random.uniform(0.8, 1.2),      # Affects overall head size
            'snout_length': random.uniform(0.8, 1.2),   # Affects snout/nose length
            'ear_length': random.uniform(0.8, 1.2),     # Affects ear length
            'ear_width': random.uniform(0.8, 1.2),      # Affects ear width
            
            # Tail features
            'tail_length': random.uniform(0.8, 1.2),    # Affects tail length
            'tail_thickness': random.uniform(0.8, 1.2), # Affects tail thickness
            
            # Color variations
            'color_brightness': random.uniform(0.8, 1.2),  # Affects base color brightness
            'pattern_intensity': random.uniform(0.0, 1.0), # Affects markings/patterns
        }
    
    def mix_genes(self, other_genes, mutation_rate=0.1):
        """Create new genes by mixing two parents' genes with possible mutations"""
        new_genes = {}
        for gene, value in self.genes.items():
            # Randomly choose between parents' genes
            parent_value = value if random.random() < 0.5 else other_genes.genes[gene]
            
            # Apply possible mutation
            if random.random() < mutation_rate:
                mutation = random.uniform(0.9, 1.1)
                parent_value *= mutation
            
            new_genes[gene] = parent_value
        
        return Genetics(new_genes)

# Define other component classes as needed