from enum import Enum
import numpy as np
import random
from PyQt6.QtGui import QColor
import math
from map_system import TerrainType

class BuildingType(Enum):
    HOUSE = 1
    FARM = 2
    WORKSHOP = 3
    STORAGE = 4
    WELL = 5

class Building:
    # Move properties to class level
    PROPERTIES = {
        BuildingType.HOUSE: {
            'capacity': 4,
            'char': '🏠',
            'color': QColor(139, 69, 19),  # Brown
            'build_cost': 50
        },
        BuildingType.FARM: {
            'food_production': 0.1,
            'char': '🌾',
            'color': QColor(205, 133, 63),  # Peru
            'build_cost': 30
        },
        BuildingType.WORKSHOP: {
            'production_rate': 0.05,
            'char': '🏭',
            'color': QColor(169, 169, 169),  # Dark gray
            'build_cost': 70
        },
        BuildingType.STORAGE: {
            'capacity': 1000,
            'char': '🏪',
            'color': QColor(160, 82, 45),  # Sienna
            'build_cost': 40
        },
        BuildingType.WELL: {
            'water_production': 0.1,
            'char': '⛲',
            'color': QColor(70, 130, 180),  # Steel blue
            'build_cost': 20
        }
    }

    def __init__(self, building_type, pos):
        self.type = building_type
        self.pos = np.array(pos, dtype=float)
        self.health = 100
        self.resources = 0
        self.occupants = []
        self.properties = self.PROPERTIES[building_type]

class Human:
    def __init__(self, pos):
        self.pos = np.array(pos, dtype=float)
        self.vel = np.array([0.0, 0.0], dtype=float)
        self.char = '👤'
        self.color = QColor(255, 218, 185)  # Peach
        
        # Basic needs
        self.health = 100
        self.energy = 100
        self.hunger = 0
        self.thirst = 0
        
        # Resources
        self.inventory = {
            'food': 0,
            'water': 0,
            'materials': 0
        }
        
        # Skills that improve with use
        self.skills = {
            'building': random.uniform(0.1, 0.5),
            'farming': random.uniform(0.1, 0.5),
            'crafting': random.uniform(0.1, 0.5),
            'gathering': random.uniform(0.1, 0.5)
        }
        
        # Current activity and home
        self.current_activity = None
        self.home = None
        self.workplace = None
        
        self.build_cooldown = 0
        self.showing_heart = 0
        self.target = None
        self.state = 'gathering'  # gathering, building, resting
    
    def update(self, world_map, buildings):
        # Update basic needs
        self.hunger += 0.1
        self.thirst += 0.15
        self.energy -= 0.05
        
        if self.build_cooldown > 0:
            self.build_cooldown -= 1
        
        if self.showing_heart > 0:
            self.showing_heart -= 1
        
        # State machine for behavior
        if self.state == 'gathering':
            # Gather resources from surroundings
            tile = world_map.get_tile_at_position(self.pos[0], self.pos[1])
            if tile.terrain_type == TerrainType.FOREST:
                self.inventory['materials'] += self.skills['gathering'] * 0.1
                self.skills['gathering'] += 0.001
            
            # Switch to building if enough materials
            if self.inventory['materials'] >= 50:
                self.state = 'building'
                self.target = self._find_build_location(world_map)
        
        elif self.state == 'building':
            if self.target is not None:
                # Move towards building location
                direction = self.target - self.pos
                if np.linalg.norm(direction) > 5:
                    direction = direction / np.linalg.norm(direction)
                    self.vel = direction * 0.5
                    self.pos += self.vel
                else:
                    # Try to build
                    if self.build_cooldown <= 0:
                        building_type = self._choose_building_type(buildings)
                        new_building = self.build(building_type)
                        if new_building:
                            self.showing_heart = 20  # Show heart when building
                            self.build_cooldown = 200
                            self.state = 'gathering'
                            self.target = None
                            return new_building
            else:
                self.state = 'gathering'
        
        elif self.state == 'resting':
            self.energy += 0.1
            if self.energy > 80:
                self.state = 'gathering'
        
        # Check if need to rest
        if self.energy < 20:
            self.state = 'resting'
        
        return None
    
    def _find_build_location(self, world_map):
        """Find a suitable location to build"""
        for _ in range(10):
            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(50, 150)
            new_pos = self.pos + np.array([
                math.cos(angle) * distance,
                math.sin(angle) * distance
            ])
            tile = world_map.get_tile_at_position(new_pos[0], new_pos[1])
            if tile.terrain_type not in [TerrainType.WATER, TerrainType.MOUNTAIN]:
                return new_pos
        return None
    
    def _choose_building_type(self, buildings):
        """Choose what type of building to construct based on needs"""
        existing_types = [b.type for b in buildings]
        
        if BuildingType.HOUSE not in existing_types:
            return BuildingType.HOUSE
        elif BuildingType.FARM not in existing_types:
            return BuildingType.FARM
        elif BuildingType.WELL not in existing_types:
            return BuildingType.WELL
        else:
            return random.choice([
                BuildingType.WORKSHOP,
                BuildingType.STORAGE,
                BuildingType.HOUSE
            ])
    
    def eat(self):
        if self.inventory['food'] > 0:
            self.inventory['food'] -= 1
            self.hunger = max(0, self.hunger - 30)
    
    def drink(self):
        if self.inventory['water'] > 0:
            self.inventory['water'] -= 1
            self.thirst = max(0, self.thirst - 30)
    
    def work(self, world_map, buildings):
        if not self.workplace:
            # Find or build a workplace
            self.find_or_build_workplace(buildings)
        elif self.workplace.type == BuildingType.FARM:
            # Farm work
            self.skills['farming'] += 0.001
            if random.random() < self.skills['farming'] * 0.1:
                self.inventory['food'] += 1
        elif self.workplace.type == BuildingType.WORKSHOP:
            # Craft items
            self.skills['crafting'] += 0.001
            if random.random() < self.skills['crafting'] * 0.1:
                self.inventory['materials'] += 1
    
    def find_or_build_workplace(self, buildings):
        # Look for existing buildings
        for building in buildings:
            if (building.type in [BuildingType.FARM, BuildingType.WORKSHOP] 
                and len(building.occupants) < building.properties['capacity']):
                self.workplace = building
                building.occupants.append(self)
                return
        
        # If no workplace found and has materials, build one
        if self.inventory['materials'] >= 30:
            self.build(BuildingType.FARM if random.random() < 0.5 else BuildingType.WORKSHOP)
    
    def build(self, building_type):
        # Get building properties from Building class
        building_properties = Building.PROPERTIES[building_type]
        
        if self.inventory['materials'] >= building_properties['build_cost']:
            self.inventory['materials'] -= building_properties['build_cost']
            new_building = Building(building_type, self.pos + np.random.uniform(-2, 2, 2))
            self.skills['building'] += 0.1
            return new_building
        return None
    
    def move_towards(self, target_pos):
        direction = target_pos - self.pos
        if np.linalg.norm(direction) > 0:
            direction = direction / np.linalg.norm(direction)
            self.vel = direction * 0.1
            self.pos += self.vel 