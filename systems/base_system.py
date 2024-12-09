class BaseSystem:
    def __init__(self, world):
        self.world = world
    
    def update(self, dt: float):
        """Base update method to be overridden by child systems"""
        pass 