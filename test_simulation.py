"""Quick test to verify simulation can initialize without GUI"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

def test_imports():
    """Test that all core modules can be imported"""
    try:
        from components import ComponentType
        from constants import INITIAL_HERBIVORES, INITIAL_PREDATORS, INITIAL_PLANTS
        from entities.entity import Entity
        from systems.world import World
        print("✓ All core imports successful")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_world_creation():
    """Test that world can be created"""
    try:
        from systems.world import World
        from components import ComponentType
        world = World()
        world.spawn_initial_entities()
        world.update_stats()
        
        print(f"✓ World created successfully")
        print(f"  - Total entities: {world.stats.get('total_entities', 0)}")
        print(f"  - Active entities: {world.stats.get('active_entities', 0)}")
        print(f"  - Herbivores: {world.stats.get('herbivores', 0)}")
        print(f"  - Predators: {world.stats.get('predators', 0)}")
        print(f"  - Plants: {world.stats.get('plants', 0)}")
        print(f"  - Map size: {world.map_width}x{world.map_height} pixels")
        return True
    except Exception as e:
        print(f"✗ World creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Ecosystem Simulation - Quick Test")
    print("=" * 50)
    
    success = True
    success = test_imports() and success
    success = test_world_creation() and success
    
    print("=" * 50)
    if success:
        print("✓ All tests passed! Simulation is ready to run.")
        print("\nTo start the simulation:")
        print("  python main.py")
        print("\nOr use VS Code debugger:")
        print("  Press F5 or Run > Start Debugging")
    else:
        print("✗ Some tests failed. Check errors above.")
    print("=" * 50)
