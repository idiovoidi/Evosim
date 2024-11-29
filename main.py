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
from human_system import Human, Building, BuildingType
from sounds import SoundManager

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
        self.pos += self.vel
        self.alpha = max(0, self.alpha - 255/self.duration)
        return self.alpha > 0

class EcosystemWidget(QWidget):
    def __init__(self, log_panel):
        super().__init__()
        self.bounds = (0, 1200)
        self.organisms = []
        self.log_panel = log_panel
        
        # Try to load predefined map
        self.world_map = WorldMap.load_map("predefined_map.json")
        if self.world_map is None:
            self.log_panel.log("Failed to load predefined map, generating new map")
            self.world_map = WorldMap(width=30, height=30, tile_size=40)
        else:
            self.log_panel.log("Successfully loaded predefined map")
        
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
        
        self.humans = []
        self.buildings = []
        
        # Conway-like rules settings
        self.OVERPOPULATION_THRESHOLD = 4    # Too many neighbors causes death
        self.UNDERPOPULATION_THRESHOLD = 1   # Too few neighbors causes death
        self.REPRODUCTION_NEIGHBORS = 3       # Ideal number for reproduction
        self.NEIGHBOR_RADIUS = 100           # Radius to check for neighbors
        
        # Add generation counter
        self.generation = 0
        
        # Add humans to initialization
        self.init_ecosystem()
        self.log_panel.log("Ecosystem initialized")
        self.update_population_stats()
        
        self.sound_manager = SoundManager()
        self.event_indicators = []
    
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
        
        # Initialize humans
        for _ in range(5):
            x = random.uniform(*self.bounds)
            y = random.uniform(*self.bounds)
            human = Human(np.array([x, y]))
            self.humans.append(human)
            self.log_panel.log("👤 Human spawned")
        
        # Initialize fish in water tiles
        for y in range(self.world_map.height):
            for x in range(self.world_map.width):
                tile = self.world_map.tiles[y][x]
                if tile.terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                    if random.random() < 0.3:  # 30% chance for each water tile
                        pos_x = x * self.world_map.tile_size + self.world_map.tile_size/2
                        pos_y = y * self.world_map.tile_size + self.world_map.tile_size/2
                        fish = Species('🐟', pos_x, pos_y, 'fish')
                        self.organisms.append(fish)
                        self.log_panel.log("🐟 Fish spawned in water")
    
    def update_population_stats(self):
        self.stats['plants'] = len([o for o in self.organisms if o.species_type == 'plant'])
        self.stats['herbivores'] = len([o for o in self.organisms if o.species_type == 'herbivore'])
        self.stats['predators'] = len([o for o in self.organisms if o.species_type == 'predator'])
        self.stats['fish'] = len([o for o in self.organisms if o.species_type == 'fish'])
        
        self.log_panel.log(
            f"Population: 🌿:{self.stats['plants']} "
            f"🐰:{self.stats['herbivores']} "
            f"🦊:{self.stats['predators']} "
            f"🐟:{self.stats['fish']}"
        )
    
    def spawn_organism(self, species_type, char):
        # Keep trying until we find a valid spawn location
        for _ in range(10):  # Maximum attempts
            x = random.uniform(*self.bounds)
            y = random.uniform(*self.bounds)
            tile = self.world_map.get_tile_at_position(x, y)
            
            # Don't spawn in water (either deep or shallow)
            if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                organism = Species(char, x, y, species_type)
                self.organisms.append(organism)
                return organism
        return None
    
    def find_nearest(self, organism, target_type):
        nearest = None
        min_dist = float('inf')
        
        for other in self.organisms:
            if other != organism and other.species_type == target_type:
                dist = np.linalg.norm(other.pos - organism.pos)
                if dist < min_dist and dist < organism.traits['sense_radius'] * 50:  # Changed from sense_radius to traits['sense_radius']
                    min_dist = dist
                    nearest = other
        
        return nearest
    
    def move_towards(self, organism, target, flee=False):
        if target is None:
            # Random movement if no target
            angle = random.uniform(0, 2 * math.pi)
            organism.vel = organism.traits['speed'] * 5 * np.array([math.cos(angle), math.sin(angle)])  # Changed from speed to traits['speed']
        else:
            direction = target.pos - organism.pos
            if flee:
                direction = -direction
            
            if np.linalg.norm(direction) > 0:
                direction = direction / np.linalg.norm(direction)
                organism.vel = direction * organism.traits['speed'] * 5  # Changed from speed to traits['speed']
    
    def count_neighbors(self, pos, species_type, radius):
        """Count neighbors of the same species within radius"""
        count = 0
        for organism in self.organisms:
            if organism.species_type == species_type:
                distance = np.linalg.norm(organism.pos - pos)
                if 0 < distance < radius:  # Don't count self
                    count += 1
        return count
    
    def apply_conway_rules(self):
        """Apply Conway-like rules to the ecosystem"""
        # Track organisms to add/remove
        to_remove = []
        to_add = []
        
        # Check each organism
        for organism in self.organisms:
            if organism.species_type == 'plant':
                neighbors = self.count_neighbors(organism.pos, 'plant', self.NEIGHBOR_RADIUS)
                
                # Death rules
                if neighbors >= self.OVERPOPULATION_THRESHOLD:
                    to_remove.append(organism)
                    self.log_panel.log(f"🌿 died from overcrowding ({neighbors} neighbors)")
                elif neighbors <= self.UNDERPOPULATION_THRESHOLD:
                    to_remove.append(organism)
                    self.log_panel.log(f"🌿 died from isolation ({neighbors} neighbors)")
                
                # Reproduction rules
                elif neighbors == self.REPRODUCTION_NEIGHBORS:
                    # Find a valid spawn position near the parent
                    for _ in range(5):  # Try 5 times to find a spot
                        angle = random.uniform(0, 2 * math.pi)
                        distance = random.uniform(30, 60)
                        new_pos = organism.pos + np.array([
                            math.cos(angle) * distance,
                            math.sin(angle) * distance
                        ])
                        
                        # Check if the position is valid (not in water)
                        tile = self.world_map.get_tile_at_position(new_pos[0], new_pos[1])
                        if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                            new_organism = Species('🌿', new_pos[0], new_pos[1], 'plant')
                            to_add.append(new_organism)
                            self.log_panel.log(f"🌿 reproduced ({neighbors} neighbors)")
                            break
        
        # Apply changes
        for organism in to_remove:
            if organism in self.organisms:
                self.organisms.remove(organism)
        
        self.organisms.extend(to_add)
        
        # Increment generation counter
        self.generation += 1
        if self.generation % 100 == 0:
            self.log_panel.log(f"Generation {self.generation}")
    
    def update_simulation(self):
        # Update event indicators
        self.event_indicators = [ind for ind in self.event_indicators if ind.update()]
        
        # Apply Conway rules every few frames
        if self.generation % 5 == 0:  # Adjust frequency as needed
            self.apply_conway_rules()
        
        self.world_map.update()
        
        for organism in self.organisms[:]:
            # Update organism status
            if hasattr(organism, 'update_status'):
                organism.update_status()
                organism.age += 1
            
            tile = self.world_map.get_tile_at_position(organism.pos[0], organism.pos[1])
            
            # Apply movement penalties based on terrain
            if organism.species_type != 'plant':
                speed_modifier = 1.0
                if hasattr(organism, 'is_tired') and organism.is_tired:
                    speed_modifier *= 0.5
                organism.vel *= (1.0 / tile.properties.movement_cost) * speed_modifier
            
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
                target = None
                if hasattr(organism, 'is_hungry') and organism.is_hungry:
                    # Check remembered food spots first if intelligent enough
                    if random.random() < organism.traits['intelligence']:
                        target_pos = organism.get_best_memory_spot('food')
                        if target_pos is not None:
                            target = type('obj', (), {'pos': target_pos})
                
                if target is None:
                    target = self.find_nearest(organism, 'plant')
                
                predator = self.find_nearest(organism, 'predator')
                
                # Flee based on aggression trait
                if predator and np.linalg.norm(predator.pos - organism.pos) < 100:
                    if random.random() > organism.traits['aggression']:
                        self.move_towards(organism, predator, flee=True)
                        if hasattr(organism, 'remember_location'):
                            organism.remember_location(predator.pos, 'danger')
                else:
                    self.move_towards(organism, target)
            
            elif organism.species_type == 'predator':
                target = self.find_nearest(organism, 'herbivore')
                self.move_towards(organism, target)
                
                # Eating with increased energy transfer for predators
                if target and np.linalg.norm(target.pos - organism.pos) < 20:
                    organism.energy += self.ENERGY_TRANSFER * 2  # Double energy gain
                    self.organisms.remove(target)
                    self.log_panel.log(f"🦊 caught a 🐰 (Energy: {organism.energy:.1f})")
                    self.sound_manager.play_sound('eat')
                    self.add_event_indicator(
                        organism.pos,
                        "Eaten!",
                        QColor(255, 0, 0)
                    )
                
                # Reduced energy consumption when not moving
                if np.linalg.norm(organism.vel) < 0.1:
                    organism.energy -= organism.traits['metabolism'] * 0.5  # Half metabolism when stationary
                else:
                    organism.energy -= organism.traits['metabolism']
                
                # Death check with more lenient energy threshold for predators
                if organism.energy <= -20:  # Give them a bit more time before dying
                    if organism in self.organisms:
                        self.organisms.remove(organism)
                        self.stats['deaths']['starvation'] += 1
                        self.log_panel.log(f"🦊 died of starvation")
        
        # Spawn new plants occasionally
        if random.random() < 0.02:
            self.spawn_organism('plant', '🌿')
        
        # Update humans
        for human in self.humans[:]:
            human.update(self.world_map, self.buildings)
            
            # Check for death conditions
            if human.health <= 0 or human.energy <= 0:
                self.humans.remove(human)
                self.log_panel.log("👤 Human died")
            
            # Try to build if conditions are right
            if (human.inventory['materials'] >= 30 and 
                random.random() < human.skills['building'] * 0.1):
                building = human.build(
                    random.choice(list(BuildingType))
                )
                if building:
                    self.buildings.append(building)
                    self.log_panel.log(f"👤 Built {building.type.name}")
        
        # Log significant population changes
        self.update_population_stats()
        
        # Handle reproduction for animals
        for organism in self.organisms[:]:
            if organism.species_type in ['herbivore', 'predator']:
                if organism.can_reproduce():
                    # Create offspring with possible mutations
                    offspring_pos = organism.pos + np.array([
                        random.uniform(-20, 20),
                        random.uniform(-20, 20)
                    ])
                    
                    # Check if spawn position is valid
                    tile = self.world_map.get_tile_at_position(
                        offspring_pos[0], offspring_pos[1]
                    )
                    if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                        offspring = Species(
                            organism.char,
                            offspring_pos[0],
                            offspring_pos[1],
                            organism.species_type
                        )
                        # Inherit traits with mutation
                        offspring.traits = organism.mutate()
                        self.organisms.append(offspring)
                        
                        # Set reproduction cooldown and heart display
                        organism.reproduction_cooldown = 100
                        organism.showing_heart = 20  # Show heart for 20 frames
                        offspring.showing_heart = 20
                        
                        self.log_panel.log(
                            f"{organism.char} reproduced! "
                            f"(Energy: {organism.energy:.1f})"
                        )
                        self.sound_manager.play_sound('birth')
                        self.add_event_indicator(
                            organism.pos,
                            "Born!",
                            QColor(0, 255, 0)
                        )
            
            # Update reproduction cooldown and heart display
            if organism.reproduction_cooldown > 0:
                organism.reproduction_cooldown -= 1
            if organism.showing_heart > 0:
                organism.showing_heart -= 1
        
        # Add fish-specific behavior
        for organism in self.organisms[:]:
            if organism.species_type == 'fish':
                # Fish only move in water
                tile = self.world_map.get_tile_at_position(organism.pos[0], organism.pos[1])
                if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                    # Try to find nearby water
                    water_pos = self.find_nearest_water(organism.pos)
                    if water_pos is not None:
                        direction = water_pos - organism.pos
                        if np.linalg.norm(direction) > 0:
                            direction = direction / np.linalg.norm(direction)
                            organism.vel = direction * organism.traits['speed'] * 5
                    else:
                        # Fish dies if can't find water
                        self.organisms.remove(organism)
                        self.log_panel.log("🐟 Fish died out of water")
                        continue
                
                # Random movement in water
                if random.random() < 0.05:
                    angle = random.uniform(0, 2 * math.pi)
                    organism.vel = organism.traits['speed'] * 2 * np.array([
                        math.cos(angle),
                        math.sin(angle)
                    ])
    
    def find_nearest_water(self, pos):
        """Find nearest water tile center"""
        center_x = int(pos[0] / self.world_map.tile_size)
        center_y = int(pos[1] / self.world_map.tile_size)
        
        min_dist = float('inf')
        nearest_pos = None
        
        for dy in range(-3, 4):  # Search in 3 tile radius
            for dx in range(-3, 4):
                x = center_x + dx
                y = center_y + dy
                if (0 <= x < self.world_map.width and 
                    0 <= y < self.world_map.height):
                    if self.world_map.tiles[y][x].terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                        water_pos = np.array([
                            x * self.world_map.tile_size + self.world_map.tile_size/2,
                            y * self.world_map.tile_size + self.world_map.tile_size/2
                        ])
                        dist = np.linalg.norm(water_pos - pos)
                        if dist < min_dist:
                            min_dist = dist
                            nearest_pos = water_pos
        
        return nearest_pos
    
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Draw the map tiles
        for y in range(self.world_map.height):
            for x in range(self.world_map.width):
                tile = self.world_map.tiles[y][x]
                rect = QRect(
                    x * self.world_map.tile_size,
                    y * self.world_map.tile_size,
                    self.world_map.tile_size,
                    self.world_map.tile_size
                )
                
                # Fill with base color
                painter.fillRect(rect, QBrush(tile.properties.color))
                
                # Draw tile character
                painter.setPen(QColor(0, 0, 0, 100))  # Semi-transparent black
                painter.setFont(QFont('Segoe UI Emoji', 14))
                painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, tile.properties.char)
                
                # Draw food overlay only on non-water tiles
                if tile.terrain_type not in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                    food_alpha = min(100, int(tile.current_food))  # Use current_food instead of food_value
                    food_color = QColor(0, 255, 0, food_alpha)
                    painter.fillRect(rect, QBrush(food_color))
        
        # Draw organisms with hearts during reproduction
        for organism in self.organisms:
            # Draw organism
            painter.setPen(organism.color)
            size = 20
            if hasattr(organism, 'traits'):
                size *= organism.traits['size']
            painter.setFont(QFont('Segoe UI Emoji', int(size)))
            
            # Create QPoint for organism position
            pos = QPoint(
                int(organism.pos[0] - size/2),
                int(organism.pos[1] + size/2)
            )
            painter.drawText(pos, organism.char)
            
            # Draw heart if reproducing
            if hasattr(organism, 'showing_heart') and organism.showing_heart > 0:
                heart_size = int(size * 0.8)
                painter.setFont(QFont('Segoe UI Emoji', heart_size))
                painter.setPen(QColor(255, 0, 0))
                
                # Create QPoint for heart position
                heart_pos = QPoint(
                    int(organism.pos[0] - size/2),
                    int(organism.pos[1] - size/2)
                )
                painter.drawText(heart_pos, '❤️')
        
        # Draw buildings with shadows
        for building in self.buildings:
            # Draw shadow
            shadow_color = QColor(0, 0, 0, 50)
            painter.setPen(shadow_color)
            painter.setFont(QFont('Segoe UI Emoji', 22))
            shadow_pos = QPoint(
                int(building.pos[0] + 2),
                int(building.pos[1] + 2)
            )
            painter.drawText(shadow_pos, building.properties['char'])
            
            # Draw building
            painter.setPen(building.properties['color'])
            painter.setFont(QFont('Segoe UI Emoji', 20))
            building_pos = QPoint(
                int(building.pos[0]),
                int(building.pos[1])
            )
            painter.drawText(building_pos, building.properties['char'])
        
        # Draw humans with shadows
        for human in self.humans:
            # Draw shadow
            shadow_color = QColor(0, 0, 0, 50)
            painter.setPen(shadow_color)
            painter.setFont(QFont('Segoe UI Emoji', 22))
            shadow_pos = QPoint(
                int(human.pos[0] + 2),
                int(human.pos[1] + 2)
            )
            painter.drawText(shadow_pos, human.char)
            
            # Draw human
            painter.setPen(human.color)
            painter.setFont(QFont('Segoe UI Emoji', 20))
            human_pos = QPoint(
                int(human.pos[0]),
                int(human.pos[1])
            )
            painter.drawText(human_pos, human.char)
        
        # Draw event indicators
        for indicator in self.event_indicators:
            painter.setPen(QColor(
                indicator.color.red(),
                indicator.color.green(),
                indicator.color.blue(),
                indicator.alpha
            ))
            painter.setFont(QFont('Arial', 12))
            painter.drawText(
                int(indicator.pos[0]),
                int(indicator.pos[1]),
                indicator.text
            )
    
    def count_water_neighbors(self, pos, radius):
        """Count water tiles within radius"""
        count = 0
        center_x = int(pos[0] / self.world_map.tile_size)
        center_y = int(pos[1] / self.world_map.tile_size)
        radius_tiles = int(radius / self.world_map.tile_size)
        
        for dy in range(-radius_tiles, radius_tiles + 1):
            for dx in range(-radius_tiles, radius_tiles + 1):
                x = center_x + dx
                y = center_y + dy
                if (0 <= x < self.world_map.width and 
                    0 <= y < self.world_map.height):
                    if self.world_map.tiles[y][x].terrain_type in [TerrainType.DEEP_WATER, TerrainType.SHALLOW_WATER]:
                        count += 1
        return count
    
    def add_event_indicator(self, pos, text, color):
        self.event_indicators.append(EventIndicator(pos, text, color))

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Ecosystem Simulation")
        
        # Calculate window size based on map size and tile size
        map_width = 30 * 40  # tiles * tile_size
        map_height = 30 * 40
        log_width = 300  # Width for log panel
        
        total_width = map_width + log_width + 50  # Add padding
        total_height = map_height + 50
        
        self.setGeometry(50, 50, total_width, total_height)
        self.setFixedSize(total_width, total_height)  # Lock window size
        
        # Create main widget and layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        
        # Create splitter for ecosystem and log
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Create and add log panel
        self.log_panel = LogPanel()
        
        # Create and add ecosystem
        self.ecosystem = EcosystemWidget(self.log_panel)
        
        # Add widgets to splitter
        splitter.addWidget(self.ecosystem)
        splitter.addWidget(self.log_panel)
        
        # Set initial sizes (70% ecosystem, 30% log)
        splitter.setSizes([840, 360])
        
        layout.addWidget(splitter)

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
