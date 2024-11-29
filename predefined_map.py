from map_system import WorldMap, BiomeType, TerrainTile
import numpy as np

def create_predefined_map(width=20, height=20, tile_size=40):
    """Create a predefined map with diverse biomes and water features"""
    world_map = WorldMap(width, height, tile_size)
    
    # Define large water bodies
    water_tiles = [
        # Large lake in the center
        (9, 9), (9, 10), (10, 9), (10, 10), (8, 9), (9, 8), 
        (11, 10), (10, 11), (8, 10), (10, 8), (11, 9), (9, 11),
        
        # River running through the map
        (0, 5), (1, 5), (2, 5), (3, 6), (4, 6), (5, 7),
        (6, 7), (7, 8), (8, 9), (9, 9), (10, 10), (11, 11),
        (12, 12), (13, 13), (14, 14), (15, 15), (16, 15),
        (17, 15), (18, 15), (19, 15),
        
        # Small ponds
        (2, 2), (2, 3), (3, 2),  # Top-left pond
        (16, 3), (17, 3), (16, 4),  # Top-right pond
        (3, 16), (3, 17), (4, 16),  # Bottom-left pond
    ]
    
    # Dense forest areas
    forest_tiles = [
        # Forest around the lake
        (7, 8), (7, 9), (7, 10), (8, 7), (8, 8), (8, 11),
        (11, 8), (11, 11), (12, 9), (12, 10),
        
        # Forest along the river
        (1, 4), (1, 6), (2, 4), (2, 6), (3, 5), (3, 7),
        (4, 5), (4, 7), (5, 6), (5, 8), (6, 6), (6, 8),
        
        # Forest patches
        (1, 1), (1, 2), (2, 1),  # Top-left forest
        (17, 1), (18, 1), (18, 2),  # Top-right forest
        (1, 18), (2, 18), (2, 17),  # Bottom-left forest
    ]
    
    # Mountain ranges
    mountain_tiles = [
        # Central mountain range
        (14, 7), (15, 7), (16, 7), (15, 6), (15, 8),
        
        # Corner mountains
        (0, 0), (1, 0), (0, 1),  # Top-left
        (18, 0), (19, 0), (19, 1),  # Top-right
        (0, 18), (0, 19), (1, 19),  # Bottom-left
        (18, 19), (19, 18), (19, 19),  # Bottom-right
    ]
    
    # Desert regions
    desert_tiles = [
        # Large desert patch
        (14, 1), (15, 1), (16, 1), (14, 2), (15, 2), (16, 2),
        (14, 3), (15, 3), (16, 3), (14, 4), (15, 4), (16, 4),
        
        # Small desert patches
        (17, 5), (18, 5), (17, 6),
        (5, 17), (6, 17), (5, 18),
    ]
    
    # Create the base map (all grassland)
    world_map.tiles = []
    for y in range(height):
        row = []
        for x in range(width):
            # Default to grassland
            biome = BiomeType.GRASSLAND
            
            # Check for special tiles
            pos = (x, y)
            if pos in water_tiles:
                biome = BiomeType.WATER
            elif pos in forest_tiles:
                biome = BiomeType.FOREST
            elif pos in mountain_tiles:
                biome = BiomeType.MOUNTAIN
            elif pos in desert_tiles:
                biome = BiomeType.DESERT
            
            tile = TerrainTile(
                biome_type=biome,
                food_value=world_map._get_initial_food_value(biome),
                movement_cost=world_map._get_movement_cost(biome)
            )
            row.append(tile)
        world_map.tiles.append(row)
    
    return world_map

# Create and save the predefined map
if __name__ == "__main__":
    map = create_predefined_map()
    map.save_map("predefined_map.json") 