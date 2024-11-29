from enum import Enum, auto
from dataclasses import dataclass
from typing import Dict, Any
import random
from PyQt6.QtGui import QColor
import noise
import os
import json

class TerrainType(Enum):
    DEEP_WATER = auto()
    SHALLOW_WATER = auto()
    BEACH = auto()
    GRASSLAND = auto()
    DENSE_GRASS = auto()
    FOREST = auto()
    DENSE_FOREST = auto()
    DESERT = auto()
    DESERT_DUNES = auto()
    MOUNTAIN = auto()
    MOUNTAIN_PEAK = auto()
    SNOW = auto()
    SWAMP = auto()
    VOLCANIC = auto()
    CAVE = auto()

@dataclass
class TileProperties:
    char: str
    color: QColor
    movement_cost: float
    food_value: float
    food_growth_rate: float
    passable: bool
    fertility: float
    humidity: float
    temperature: float
    elevation: float
    resources: Dict[str, float]

class TerrainTile:
    TERRAIN_PROPERTIES = {
        TerrainType.DEEP_WATER: TileProperties(
            char='🌊',
            color=QColor(0, 105, 148),
            movement_cost=10.0,
            food_value=50.0,
            food_growth_rate=0.2,
            passable=False,
            fertility=0.0,
            humidity=1.0,
            temperature=0.3,
            elevation=0.0,
            resources={'fish': 100.0, 'water': 100.0}
        ),
        TerrainType.SHALLOW_WATER: TileProperties(
            char='💧',
            color=QColor(51, 153, 255),
            movement_cost=5.0,
            food_value=30.0,
            food_growth_rate=0.3,
            passable=True,
            fertility=0.2,
            humidity=0.9,
            temperature=0.4,
            elevation=0.1,
            resources={'fish': 50.0, 'water': 100.0}
        ),
        TerrainType.BEACH: TileProperties(
            char='🏖️',
            color=QColor(238, 214, 175),
            movement_cost=1.2,
            food_value=10.0,
            food_growth_rate=0.1,
            passable=True,
            fertility=0.3,
            humidity=0.7,
            temperature=0.7,
            elevation=0.2,
            resources={'sand': 100.0, 'shells': 30.0}
        ),
        TerrainType.GRASSLAND: TileProperties(
            char='🌿',
            color=QColor(95, 189, 51),
            movement_cost=1.0,
            food_value=100.0,
            food_growth_rate=1.0,
            passable=True,
            fertility=0.8,
            humidity=0.6,
            temperature=0.5,
            elevation=0.3,
            resources={'herbs': 50.0, 'grass': 100.0}
        ),
        TerrainType.DENSE_GRASS: TileProperties(
            char='🌾',
            color=QColor(34, 139, 34),
            movement_cost=1.2,
            food_value=150.0,
            food_growth_rate=1.2,
            passable=True,
            fertility=0.9,
            humidity=0.7,
            temperature=0.5,
            elevation=0.3,
            resources={'herbs': 80.0, 'grass': 150.0}
        ),
        TerrainType.FOREST: TileProperties(
            char='🌲',
            color=QColor(0, 100, 0),
            movement_cost=1.5,
            food_value=80.0,
            food_growth_rate=0.8,
            passable=True,
            fertility=0.7,
            humidity=0.8,
            temperature=0.4,
            elevation=0.4,
            resources={'wood': 100.0, 'berries': 50.0}
        ),
        TerrainType.DENSE_FOREST: TileProperties(
            char='🌳',
            color=QColor(0, 75, 0),
            movement_cost=2.0,
            food_value=100.0,
            food_growth_rate=0.6,
            passable=True,
            fertility=0.6,
            humidity=0.9,
            temperature=0.3,
            elevation=0.4,
            resources={'wood': 150.0, 'berries': 80.0}
        ),
        TerrainType.DESERT: TileProperties(
            char='🏜️',
            color=QColor(255, 223, 186),
            movement_cost=1.5,
            food_value=20.0,
            food_growth_rate=0.2,
            passable=True,
            fertility=0.2,
            humidity=0.1,
            temperature=0.9,
            elevation=0.3,
            resources={'sand': 100.0, 'cactus': 20.0}
        ),
        TerrainType.DESERT_DUNES: TileProperties(
            char='🏜️',
            color=QColor(255, 201, 102),
            movement_cost=2.0,
            food_value=10.0,
            food_growth_rate=0.1,
            passable=True,
            fertility=0.1,
            humidity=0.0,
            temperature=1.0,
            elevation=0.4,
            resources={'sand': 150.0}
        ),
        TerrainType.MOUNTAIN: TileProperties(
            char='⛰️',
            color=QColor(128, 128, 128),
            movement_cost=3.0,
            food_value=30.0,
            food_growth_rate=0.3,
            passable=True,
            fertility=0.3,
            humidity=0.4,
            temperature=0.3,
            elevation=0.7,
            resources={'stone': 100.0, 'ore': 50.0}
        ),
        TerrainType.MOUNTAIN_PEAK: TileProperties(
            char='🗻',
            color=QColor(169, 169, 169),
            movement_cost=4.0,
            food_value=10.0,
            food_growth_rate=0.1,
            passable=False,
            fertility=0.1,
            humidity=0.3,
            temperature=0.1,
            elevation=0.9,
            resources={'stone': 150.0, 'ore': 100.0}
        ),
        TerrainType.SNOW: TileProperties(
            char='❄️',
            color=QColor(255, 250, 250),
            movement_cost=2.0,
            food_value=20.0,
            food_growth_rate=0.2,
            passable=True,
            fertility=0.2,
            humidity=0.4,
            temperature=0.0,
            elevation=0.8,
            resources={'ice': 100.0}
        ),
        TerrainType.SWAMP: TileProperties(
            char='🥀',
            color=QColor(85, 107, 47),
            movement_cost=2.5,
            food_value=60.0,
            food_growth_rate=0.7,
            passable=True,
            fertility=0.5,
            humidity=1.0,
            temperature=0.6,
            elevation=0.2,
            resources={'herbs': 70.0, 'mushrooms': 50.0}
        ),
        TerrainType.VOLCANIC: TileProperties(
            char='🌋',
            color=QColor(139, 0, 0),
            movement_cost=5.0,
            food_value=0.0,
            food_growth_rate=0.0,
            passable=False,
            fertility=0.0,
            humidity=0.1,
            temperature=1.0,
            elevation=0.9,
            resources={'obsidian': 100.0, 'sulfur': 50.0}
        ),
        TerrainType.CAVE: TileProperties(
            char='🕳️',
            color=QColor(47, 47, 47),
            movement_cost=2.0,
            food_value=20.0,
            food_growth_rate=0.2,
            passable=True,
            fertility=0.2,
            humidity=0.6,
            temperature=0.4,
            elevation=0.3,
            resources={'stone': 80.0, 'crystals': 30.0}
        )
    }

    def __init__(self, terrain_type: TerrainType, position: tuple):
        self.terrain_type = terrain_type
        self.position = position
        self.properties = self.TERRAIN_PROPERTIES[terrain_type]
        self.current_resources = self.properties.resources.copy()
        
        # Dynamic properties that can change
        self.current_food = self.properties.food_value
        self.is_occupied = False
        self.occupant = None
        self.structure = None
        
        # Environmental effects
        self.is_burning = False
        self.is_flooded = False
        self.pollution_level = 0.0
        
    def update(self):
        # Regrow food
        if self.current_food < self.properties.food_value:
            self.current_food += self.properties.food_growth_rate
        
        # Regenerate resources
        for resource, amount in self.current_resources.items():
            max_amount = self.properties.resources[resource]
            if amount < max_amount:
                self.current_resources[resource] += max_amount * 0.01
        
        # Handle environmental effects
        if self.is_burning:
            self.current_food *= 0.9
            self.pollution_level += 0.1
        
        if self.is_flooded:
            self.properties.movement_cost *= 1.5
            self.humidity = min(1.0, self.properties.humidity + 0.1)

class WorldMap:
    def __init__(self, width, height, tile_size=40):
        self.width = width
        self.height = height
        self.tile_size = tile_size
        self.tiles = []
        self.generate_map()
    
    def generate_map(self):
        # Generate noise maps for different features
        elevation = self._generate_noise_map(scale=50.0)
        moisture = self._generate_noise_map(scale=25.0, offset=1000)
        temperature = self._generate_noise_map(scale=75.0, offset=2000)
        
        self.tiles = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                terrain_type = self._determine_biome(
                    elevation[y][x],
                    moisture[y][x],
                    temperature[y][x]
                )
                tile = TerrainTile(
                    terrain_type=terrain_type,
                    position=(x, y)
                )
                row.append(tile)
            self.tiles.append(row)
    
    def _generate_noise_map(self, scale=50.0, offset=0):
        noise_map = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                # Base terrain
                base = noise.pnoise2(
                    x/scale + offset, 
                    y/scale + offset,
                    octaves=6,
                    persistence=0.7,
                    lacunarity=2.2,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=42
                )
                
                # River generation
                river = noise.pnoise2(
                    x/(scale/3) + offset,
                    y/(scale/3) + offset,
                    octaves=1,
                    persistence=0.5,
                    lacunarity=2.0,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=44
                )
                
                value = (base * 0.7 + river * 0.3)
                row.append((value + 1) / 2)
            noise_map.append(row)
        return noise_map
    
    def get_tile_at_position(self, x, y):
        """Convert world coordinates to tile coordinates and return tile"""
        tile_x = int(x / self.tile_size)
        tile_y = int(y / self.tile_size)
        
        # Ensure coordinates are within bounds
        tile_x = max(0, min(tile_x, self.width - 1))
        tile_y = max(0, min(tile_y, self.height - 1))
        
        return self.tiles[tile_y][tile_x]
    
    def update(self):
        """Update all tiles"""
        for row in self.tiles:
            for tile in row:
                tile.update()
    
    @classmethod
    def load_map(cls, filename="map_save.json"):
        """Load a map from a JSON file"""
        if not os.path.exists(filename):
            return None
            
        with open(filename, 'r') as f:
            map_data = json.load(f)
        
        world_map = cls(
            width=map_data['width'],
            height=map_data['height'],
            tile_size=map_data['tile_size']
        )
        
        return world_map
    
    def _determine_biome(self, elevation, moisture, temperature=None):
        """Enhanced biome determination with temperature consideration"""
        if temperature is None:
            temperature = (1 - elevation) * 0.7 + random.random() * 0.3
        
        if elevation < 0.2:
            return TerrainType.DEEP_WATER
        elif elevation < 0.3:
            return TerrainType.SHALLOW_WATER
        elif elevation < 0.33:
            return TerrainType.BEACH
        elif elevation > 0.8:
            if temperature < 0.2:
                return TerrainType.SNOW
            elif temperature > 0.7:
                return TerrainType.VOLCANIC
            else:
                return TerrainType.MOUNTAIN_PEAK
        elif elevation > 0.6:
            return TerrainType.MOUNTAIN
        
        if moisture < 0.2:
            if temperature > 0.7:
                return TerrainType.DESERT_DUNES
            return TerrainType.DESERT
        elif moisture > 0.8:
            if temperature < 0.4:
                return TerrainType.DENSE_FOREST
            return TerrainType.SWAMP
        elif moisture > 0.6:
            return TerrainType.FOREST
        elif moisture > 0.4:
            return TerrainType.DENSE_GRASS
        
        return TerrainType.GRASSLAND