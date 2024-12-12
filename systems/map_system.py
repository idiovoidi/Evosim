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
    # Water bodies
    DEEP_WATER = auto()
    SHALLOW_WATER = auto()
    BEACH = auto()
    
    # Plains and grasslands
    GRASSLAND = auto()
    DENSE_GRASS = auto()
    SAVANNA = auto()
    
    # Forests
    FOREST = auto()
    DENSE_FOREST = auto()
    RAINFOREST = auto()
    
    # Arid regions
    DESERT = auto()
    DESERT_DUNES = auto()
    
    # Mountains and hills
    HILLS = auto()
    MOUNTAIN = auto()
    MOUNTAIN_PEAK = auto()
    SNOW = auto()
    
    # Special biomes
    SWAMP = auto()
    MARSH = auto()
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
            char="~", color=QColor(0, 105, 148),
            movement_cost=3.0, food_value=20.0, food_growth_rate=0.5,
            passable=False, fertility=0.1, humidity=1.0,
            temperature=0.3, elevation=0.0,
            resources={"fish": 100.0}
        ),
        TerrainType.SHALLOW_WATER: TileProperties(
            char="≈", color=QColor(64, 164, 223),
            movement_cost=2.0, food_value=15.0, food_growth_rate=0.7,
            passable=True, fertility=0.3, humidity=0.9,
            temperature=0.4, elevation=0.1,
            resources={"fish": 50.0, "reeds": 20.0}
        ),
        TerrainType.BEACH: TileProperties(
            char=".", color=QColor(238, 214, 175),
            movement_cost=1.2, food_value=5.0, food_growth_rate=0.3,
            passable=True, fertility=0.2, humidity=0.6,
            temperature=0.6, elevation=0.2,
            resources={"shells": 30.0}
        ),
        TerrainType.GRASSLAND: TileProperties(
            char="\"", color=QColor(126, 200, 80),
            movement_cost=1.0, food_value=30.0, food_growth_rate=1.0,
            passable=True, fertility=0.8, humidity=0.5,
            temperature=0.5, elevation=0.3,
            resources={"herbs": 40.0}
        ),
        TerrainType.DENSE_GRASS: TileProperties(
            char="\"\"", color=QColor(106, 180, 60),
            movement_cost=1.2, food_value=40.0, food_growth_rate=1.2,
            passable=True, fertility=0.9, humidity=0.6,
            temperature=0.5, elevation=0.3,
            resources={"herbs": 60.0}
        ),
        TerrainType.SAVANNA: TileProperties(
            char=",", color=QColor(200, 180, 100),
            movement_cost=1.0, food_value=25.0, food_growth_rate=0.8,
            passable=True, fertility=0.6, humidity=0.3,
            temperature=0.8, elevation=0.4,
            resources={"grass": 40.0}
        ),
        TerrainType.FOREST: TileProperties(
            char="♣", color=QColor(34, 139, 34),
            movement_cost=1.5, food_value=35.0, food_growth_rate=0.9,
            passable=True, fertility=0.7, humidity=0.7,
            temperature=0.5, elevation=0.4,
            resources={"wood": 80.0, "berries": 40.0}
        ),
        TerrainType.DENSE_FOREST: TileProperties(
            char="♣♣", color=QColor(24, 129, 24),
            movement_cost=2.0, food_value=40.0, food_growth_rate=0.8,
            passable=True, fertility=0.8, humidity=0.8,
            temperature=0.4, elevation=0.4,
            resources={"wood": 100.0, "berries": 60.0}
        ),
        TerrainType.RAINFOREST: TileProperties(
            char="♠", color=QColor(20, 110, 20),
            movement_cost=2.5, food_value=50.0, food_growth_rate=1.5,
            passable=True, fertility=1.0, humidity=0.9,
            temperature=0.7, elevation=0.4,
            resources={"wood": 120.0, "fruits": 80.0}
        ),
        TerrainType.DESERT: TileProperties(
            char="·", color=QColor(238, 232, 170),
            movement_cost=1.3, food_value=5.0, food_growth_rate=0.2,
            passable=True, fertility=0.1, humidity=0.1,
            temperature=0.9, elevation=0.3,
            resources={"sand": 100.0}
        ),
        TerrainType.DESERT_DUNES: TileProperties(
            char="∩", color=QColor(218, 212, 150),
            movement_cost=1.6, food_value=3.0, food_growth_rate=0.1,
            passable=True, fertility=0.05, humidity=0.05,
            temperature=1.0, elevation=0.4,
            resources={"sand": 120.0}
        ),
        TerrainType.HILLS: TileProperties(
            char="⌂", color=QColor(160, 160, 160),
            movement_cost=1.8, food_value=20.0, food_growth_rate=0.6,
            passable=True, fertility=0.5, humidity=0.5,
            temperature=0.4, elevation=0.6,
            resources={"stone": 60.0}
        ),
        TerrainType.MOUNTAIN: TileProperties(
            char="▲", color=QColor(140, 140, 140),
            movement_cost=2.5, food_value=10.0, food_growth_rate=0.3,
            passable=True, fertility=0.2, humidity=0.4,
            temperature=0.3, elevation=0.7,
            resources={"stone": 100.0}
        ),
        TerrainType.MOUNTAIN_PEAK: TileProperties(
            char="▲▲", color=QColor(120, 120, 120),
            movement_cost=3.0, food_value=5.0, food_growth_rate=0.2,
            passable=True, fertility=0.1, humidity=0.3,
            temperature=0.2, elevation=0.8,
            resources={"stone": 120.0}
        ),
        TerrainType.SNOW: TileProperties(
            char="*", color=QColor(250, 250, 250),
            movement_cost=2.0, food_value=5.0, food_growth_rate=0.1,
            passable=True, fertility=0.1, humidity=0.4,
            temperature=0.1, elevation=0.7,
            resources={"ice": 100.0}
        ),
        TerrainType.SWAMP: TileProperties(
            char="≋", color=QColor(80, 110, 70),
            movement_cost=2.5, food_value=25.0, food_growth_rate=0.7,
            passable=True, fertility=0.6, humidity=0.9,
            temperature=0.6, elevation=0.2,
            resources={"reeds": 60.0}
        ),
        TerrainType.MARSH: TileProperties(
            char="≋", color=QColor(100, 130, 90),
            movement_cost=2.0, food_value=20.0, food_growth_rate=0.6,
            passable=True, fertility=0.5, humidity=0.8,
            temperature=0.5, elevation=0.2,
            resources={"reeds": 40.0}
        ),
        TerrainType.VOLCANIC: TileProperties(
            char="△", color=QColor(100, 40, 40),
            movement_cost=3.0, food_value=0.0, food_growth_rate=0.0,
            passable=False, fertility=0.0, humidity=0.1,
            temperature=1.0, elevation=0.9,
            resources={"obsidian": 100.0}
        ),
        TerrainType.CAVE: TileProperties(
            char="○", color=QColor(80, 80, 80),
            movement_cost=1.5, food_value=10.0, food_growth_rate=0.3,
            passable=True, fertility=0.2, humidity=0.6,
            temperature=0.4, elevation=0.5,
            resources={"stone": 80.0}
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
    def __init__(self, width=50, height=40, tile_size=40):
        self.width = width  # Number of tiles wide
        self.height = height  # Number of tiles high
        self.tile_size = tile_size  # Size of each tile in pixels
        
        print(f"Initializing map with {width}x{height} tiles, each {tile_size}px")
        
        # Initialize with default grassland tiles
        self.tiles = [[TerrainTile(TerrainType.GRASSLAND, (x, y)) 
                      for x in range(width)] 
                      for y in range(height)]
        self.generate_terrain()
    
    def generate_terrain(self):
        """Generate the world map with both noise-based and predefined features"""
        # First generate the base terrain using noise
        elevation = self._generate_noise_map(scale=100.0)
        moisture = self._generate_noise_map(scale=50.0, offset=1000)
        temperature = self._generate_noise_map(scale=150.0, offset=2000)
        
        # Initialize tiles based on noise
        for y in range(self.height):
            for x in range(self.width):
                terrain_type = self._determine_biome(
                    elevation[y][x],
                    moisture[y][x],
                    temperature[y][x]
                )
                self.tiles[y][x] = TerrainTile(
                    terrain_type=terrain_type,
                    position=(x, y)
                )
        
        # Apply predefined features on top of the generated terrain
        self.create_predefined_features()
    
    def _generate_noise_map(self, scale=100.0, offset=0):
        """Generate a more detailed noise map with multiple layers"""
        def combine_noise_layers(x, y, scales):
            value = 0
            weight_sum = 0
            for scale, weight in scales:
                noise_val = noise.pnoise2(
                    x/scale + offset,
                    y/scale + offset,
                    octaves=6,
                    persistence=0.5,
                    lacunarity=2.0,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=42 + int(scale)
                )
                value += noise_val * weight
                weight_sum += weight
            return (value / weight_sum + 1) / 2

        noise_map = []
        scales = [(scale, 1.0), (scale/2, 0.5), (scale/4, 0.25)]
        
        for y in range(self.height):
            row = []
            for x in range(self.width):
                value = combine_noise_layers(x, y, scales)
                row.append(value)
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
    
    def _determine_biome(self, elevation, moisture, temperature):
        """Enhanced biome determination based on elevation, moisture, and temperature"""
        # Water bodies
        if elevation < 0.2:  # Reduced water coverage
            if moisture > 0.7:
                return TerrainType.DEEP_WATER
            return TerrainType.SHALLOW_WATER
        elif elevation < 0.25:
            return TerrainType.BEACH

        # Mountain regions
        if elevation > 0.85:  # Reduced mountain coverage
            if temperature < 0.2:
                return TerrainType.SNOW
            return TerrainType.MOUNTAIN_PEAK
        elif elevation > 0.8:
            return TerrainType.MOUNTAIN
        elif elevation > 0.75:
            return TerrainType.HILLS

        # More common biomes
        if moisture > 0.7:
            if temperature > 0.7:
                return TerrainType.RAINFOREST
            return TerrainType.FOREST
        elif moisture > 0.5:
            if temperature > 0.6:
                return TerrainType.DENSE_GRASS
            return TerrainType.GRASSLAND
        elif moisture > 0.3:
            if temperature > 0.7:
                return TerrainType.SAVANNA
            return TerrainType.GRASSLAND
        
        # Desert regions
        if temperature > 0.8:
            return TerrainType.DESERT
        
        # Default to grassland
        return TerrainType.GRASSLAND
    
    def get_tile_at_position(self, x: float, y: float) -> TerrainTile:
        """Convert world coordinates to tile coordinates"""
        # Convert world coordinates to tile coordinates
        tile_x = int(x // self.tile_size)
        tile_y = int(y // self.tile_size)
        
        # Check bounds
        if 0 <= tile_x < self.width and 0 <= tile_y < self.height:
            return self.tiles[tile_y][tile_x]
        return None
    
    def update(self):
        """Update all tiles"""
        for row in self.tiles:
            for tile in row:
                tile.update()