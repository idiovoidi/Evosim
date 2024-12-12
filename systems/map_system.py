from enum import Enum, auto
from dataclasses import dataclass
from typing import Dict, Any, Tuple
import random
from PyQt6.QtGui import QColor
import noise
import os
import json
import numpy as np
import math
import deap

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
            color=QColor(28, 107, 160),
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
            char='🌊',
            color=QColor(65, 155, 249),
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
        TerrainType.GRASSLAND: TileProperties(
            char='🌿',
            color=QColor(126, 200, 80),
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
        TerrainType.FOREST: TileProperties(
            char='🌲',
            color=QColor(34, 139, 34),
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
        TerrainType.MOUNTAIN: TileProperties(
            char='⛰️',
            color=QColor(139, 137, 137),
            movement_cost=3.0,
            food_value=30.0,
            food_growth_rate=0.3,
            passable=True,
            fertility=0.3,
            humidity=0.4,
            temperature=0.3,
            elevation=0.7,
            resources={'stone': 100.0, 'ore': 50.0}
        )
    }

    def __init__(self, terrain_type: TerrainType, position: tuple):
        self.terrain_type = terrain_type
        self.position = position
        self.current_resources = self.TERRAIN_PROPERTIES[terrain_type].resources.copy()
        
        # Dynamic properties that can change
        self.current_food = self.TERRAIN_PROPERTIES[terrain_type].food_value
        self.is_occupied = False
        self.occupant = None
        self.structure = None
        
        # Environmental effects
        self.is_burning = False
        self.is_flooded = False
        self.pollution_level = 0.0
        
    def update(self):
        # Regrow food
        if self.current_food < self.TERRAIN_PROPERTIES[self.terrain_type].food_value:
            self.current_food += self.TERRAIN_PROPERTIES[self.terrain_type].food_growth_rate
        
        # Regenerate resources
        for resource, amount in self.current_resources.items():
            max_amount = self.TERRAIN_PROPERTIES[self.terrain_type].resources[resource]
            if amount < max_amount:
                self.current_resources[resource] += max_amount * 0.01
        
        # Handle environmental effects
        if self.is_burning:
            self.current_food *= 0.9
            self.pollution_level += 0.1
        
        if self.is_flooded:
            self.TERRAIN_PROPERTIES[self.terrain_type].movement_cost *= 1.5
            self.TERRAIN_PROPERTIES[self.terrain_type].humidity = min(1.0, self.TERRAIN_PROPERTIES[self.terrain_type].humidity + 0.1)

class WorldMap:
    def __init__(self, width, height, tile_size=40):
        self.width = width
        self.height = height
        self.tile_size = tile_size
        self.tiles = []
        self.generate_map()
    
    def generate_map(self):
        """Generate the world map with both noise-based and predefined features"""
        # First generate the base terrain using noise
        elevation = self._generate_noise_map(scale=100.0)
        moisture = self._generate_noise_map(scale=50.0, offset=1000)
        temperature = self._generate_noise_map(scale=150.0, offset=2000)
        
        # Initialize tiles based on noise
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
        
        # Apply predefined features on top of the generated terrain
        self.create_predefined_features()
    
    def _generate_noise_map(self, scale=100.0, offset=0):
        """Generate a noise map with more pronounced features"""
        noise_map = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                # Base terrain
                base = noise.pnoise2(
                    x/scale + offset, 
                    y/scale + offset,
                    octaves=8,
                    persistence=0.5,
                    lacunarity=2.0,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=42
                )
                
                # Additional noise layers for more detail
                detail_1 = noise.pnoise2(
                    x/(scale/2) + offset + 1000,
                    y/(scale/2) + offset + 1000,
                    octaves=4,
                    persistence=0.5,
                    lacunarity=2.0,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=43
                )
                
                detail_2 = noise.pnoise2(
                    x/(scale/4) + offset + 2000,
                    y/(scale/4) + offset + 2000,
                    octaves=2,
                    persistence=0.5,
                    lacunarity=2.0,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=44
                )
                
                # Combine noise layers
                value = (base * 0.6 + detail_1 * 0.3 + detail_2 * 0.1)
                row.append((value + 1) / 2)
            noise_map.append(row)
        return noise_map
    
    def create_predefined_features(self):
        """Create predefined map features like lakes, rivers, and biome clusters"""
        # Define large water bodies
        water_tiles = [
            # Large lake in the center
            (self.width // 2, self.height // 2),
            (self.width // 2 + 1, self.height // 2),
            (self.width // 2, self.height // 2 + 1),
            (self.width // 2 + 1, self.height // 2 + 1),
            # River running through the map
            (0, self.height // 4),
            (self.width // 4, self.height // 4),
            (self.width // 2, self.height // 4),
            (3 * self.width // 4, self.height // 4),
            (self.width - 1, self.height // 4),
        ]
        
        # Forest areas
        forest_tiles = [
            # Forest patches
            (self.width // 8, self.height // 8),
            (7 * self.width // 8, self.height // 8),
            (self.width // 8, 7 * self.height // 8),
            (7 * self.width // 8, 7 * self.height // 8),
        ]
        
        # Mountain ranges
        mountain_tiles = [
            # Central mountains
            (self.width // 2, self.height // 4),
            (self.width // 2 + 1, self.height // 4),
            (self.width // 2, self.height // 4 + 1),
            (self.width // 2 + 1, self.height // 4 + 1),
            # Corner peaks
            (0, 0),
            (self.width - 1, 0),
            (0, self.height - 1),
            (self.width - 1, self.height - 1),
        ]
        
        # Apply predefined features
        for x, y in water_tiles:
            self.tiles[y][x] = TerrainTile(TerrainType.DEEP_WATER, (x, y))
        
        for x, y in forest_tiles:
            self.tiles[y][x] = TerrainTile(TerrainType.FOREST, (x, y))
        
        for x, y in mountain_tiles:
            self.tiles[y][x] = TerrainTile(TerrainType.MOUNTAIN, (x, y))
    
    def _determine_biome(self, elevation, moisture, temperature=None):
        """Enhanced biome determination with more water"""
        if temperature is None:
            temperature = (1 - elevation) * 0.7 + random.random() * 0.3
        
        # More water generation
        if elevation < 0.4:  # Increased water threshold
            if moisture > 0.3:  # More lenient moisture requirement
                return TerrainType.DEEP_WATER if elevation < 0.3 else TerrainType.SHALLOW_WATER
        
        # Rest of the biome determination...
        if elevation > 0.75:
            return TerrainType.MOUNTAIN
        
        if moisture < 0.3:
            return TerrainType.GRASSLAND
        elif moisture > 0.6:
            return TerrainType.FOREST
        
        return TerrainType.GRASSLAND
    
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