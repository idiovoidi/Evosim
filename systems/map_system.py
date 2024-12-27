from enum import Enum
from dataclasses import dataclass
from typing import Dict, List
import noise
import numpy as np

class TerrainType(Enum):
    DEEP_WATER = "deep_water"
    SHALLOW_WATER = "shallow_water"
    BEACH = "beach"
    GRASSLAND = "grassland"
    FOREST = "forest"
    MOUNTAIN = "mountain"
    SNOW = "snow"
    DESERT = "desert"

@dataclass
class TerrainProperties:
    base_height: float
    color: Dict[str, float]  # RGB values 0-1
    movement_cost: float
    passable: bool
    fertility: float
    humidity: float
    temperature: float
    resources: Dict[str, float]

class TerrainData:
    PROPERTIES = {
        TerrainType.DEEP_WATER: TerrainProperties(
            base_height=-2.0,
            color={'r': 0.0, 'g': 0.4, 'b': 0.6},
            movement_cost=3.0,
            passable=False,
            fertility=0.1,
            humidity=1.0,
            temperature=0.3,
            resources={"fish": 100.0}
        ),
        TerrainType.SHALLOW_WATER: TerrainProperties(
            base_height=-0.5,
            color={'r': 0.2, 'g': 0.6, 'b': 0.8},
            movement_cost=2.0,
            passable=True,
            fertility=0.3,
            humidity=0.9,
            temperature=0.4,
            resources={"fish": 50.0}
        ),
        TerrainType.BEACH: TerrainProperties(
            base_height=0.0,
            color={'r': 0.94, 'g': 0.84, 'b': 0.69},
            movement_cost=1.2,
            passable=True,
            fertility=0.2,
            humidity=0.6,
            temperature=0.6,
            resources={"sand": 100.0}
        ),
        TerrainType.GRASSLAND: TerrainProperties(
            base_height=0.2,
            color={'r': 0.4, 'g': 0.8, 'b': 0.3},
            movement_cost=1.0,
            passable=True,
            fertility=0.8,
            humidity=0.5,
            temperature=0.5,
            resources={"grass": 100.0}
        ),
        TerrainType.FOREST: TerrainProperties(
            base_height=0.4,
            color={'r': 0.13, 'g': 0.55, 'b': 0.13},
            movement_cost=1.5,
            passable=True,
            fertility=0.7,
            humidity=0.7,
            temperature=0.5,
            resources={"wood": 100.0}
        ),
        TerrainType.MOUNTAIN: TerrainProperties(
            base_height=1.5,
            color={'r': 0.55, 'g': 0.55, 'b': 0.55},
            movement_cost=2.5,
            passable=True,
            fertility=0.2,
            humidity=0.4,
            temperature=0.3,
            resources={"stone": 100.0}
        ),
        TerrainType.SNOW: TerrainProperties(
            base_height=2.0,
            color={'r': 0.95, 'g': 0.95, 'b': 0.95},
            movement_cost=2.0,
            passable=True,
            fertility=0.1,
            humidity=0.4,
            temperature=0.1,
            resources={"ice": 100.0}
        ),
        TerrainType.DESERT: TerrainProperties(
            base_height=0.1,
            color={'r': 0.93, 'g': 0.91, 'b': 0.67},
            movement_cost=1.3,
            passable=True,
            fertility=0.1,
            humidity=0.1,
            temperature=0.9,
            resources={"sand": 100.0}
        )
    }

class WorldMap:
    def __init__(self, width: int = 50, height: int = 40):
        self.width = width
        self.height = height
        self.tile_size = 4  # Size in world units
        
        # Generate base terrain data
        self.heightmap = self._generate_heightmap()
        self.moisture = self._generate_noise_map(50.0)
        self.temperature = self._generate_noise_map(75.0)
        
        # Generate terrain types based on height, moisture, and temperature
        self.terrain_types = self._generate_terrain_types()
        
        # Store additional tile data
        self.tile_data = self._initialize_tile_data()
    
    def _generate_heightmap(self) -> np.ndarray:
        """Generate heightmap using multiple octaves of noise"""
        print("Generating heightmap...")  # Debug logging
        heightmap = np.zeros((self.height, self.width))
        
        scales = [(100.0, 1.0), (50.0, 0.5), (25.0, 0.25)]
        for scale, weight in scales:
            for y in range(self.height):
                for x in range(self.width):
                    heightmap[y, x] += noise.pnoise2(
                        x/scale, y/scale,
                        octaves=6,
                        persistence=0.5,
                        lacunarity=2.0,
                        repeatx=self.width,
                        repeaty=self.height,
                        base=42
                    ) * weight
        
        # Normalize to 0-1 range
        heightmap = (heightmap - heightmap.min()) / (heightmap.max() - heightmap.min())
        print(f"Heightmap generated with shape {heightmap.shape}")  # Debug logging
        return heightmap
    
    def _generate_noise_map(self, scale: float) -> np.ndarray:
        """Generate a generic noise map for moisture/temperature"""
        noise_map = np.zeros((self.height, self.width))
        
        for y in range(self.height):
            for x in range(self.width):
                noise_map[y, x] = noise.pnoise2(
                    x/scale, y/scale,
                    octaves=4,
                    persistence=0.5,
                    lacunarity=2.0,
                    repeatx=self.width,
                    repeaty=self.height,
                    base=42
                )
        
        noise_map = (noise_map - noise_map.min()) / (noise_map.max() - noise_map.min())
        return noise_map
    
    def _generate_terrain_types(self) -> List[List[TerrainType]]:
        """Determine terrain type for each tile based on height, moisture, and temperature"""
        terrain = [[TerrainType.GRASSLAND for x in range(self.width)] 
                  for y in range(self.height)]
        
        for y in range(self.height):
            for x in range(self.width):
                height = self.heightmap[y, x]
                moisture = self.moisture[y, x]
                temperature = self.temperature[y, x]
                
                # Determine terrain type based on height first
                if height < 0.2:
                    terrain[y][x] = TerrainType.DEEP_WATER
                elif height < 0.3:
                    terrain[y][x] = TerrainType.SHALLOW_WATER
                elif height < 0.35:
                    terrain[y][x] = TerrainType.BEACH
                elif height > 0.8:
                    if temperature < 0.2:
                        terrain[y][x] = TerrainType.SNOW
                    else:
                        terrain[y][x] = TerrainType.MOUNTAIN
                else:
                    # Use moisture and temperature for middle heights
                    if moisture > 0.6:
                        terrain[y][x] = TerrainType.FOREST
                    elif moisture < 0.2 and temperature > 0.7:
                        terrain[y][x] = TerrainType.DESERT
                    else:
                        terrain[y][x] = TerrainType.GRASSLAND
        
        return terrain
    
    def _initialize_tile_data(self) -> List[Dict]:
        """Initialize additional data for each tile"""
        tile_data = []
        
        for y in range(self.height):
            for x in range(self.width):
                terrain_type = self.terrain_types[y][x]
                properties = TerrainData.PROPERTIES[terrain_type]
                
                # Calculate actual height using base height and noise
                actual_height = (self.heightmap[y, x] * 10) + properties.base_height
                
                tile_data.append({
                    'x': x,
                    'z': y,
                    'height': float(actual_height),
                    'type': terrain_type.value,
                    'properties': {
                        'color': properties.color,
                        'movement_cost': properties.movement_cost,
                        'passable': properties.passable,
                        'resources': properties.resources.copy()
                    }
                })
        
        return tile_data
    
    def get_serializable_data(self) -> Dict:
        """Get map data in a format suitable for network transmission"""
        print("Preparing map data for serialization...")  # Debug logging
        data = {
            'dimensions': {
                'width': self.width,
                'height': self.height,
                'tileSize': self.tile_size
            },
            'tiles': self.tile_data
        }
        print(f"Map data prepared with {len(self.tile_data)} tiles")  # Debug logging
        return data