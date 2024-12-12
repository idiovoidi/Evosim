class BaseSystem:
    def __init__(self, world):
        self.world = world  # Store world directly instead of ecosystem
    
    def update(self, dt: float):
        """Update the system state"""
        pass