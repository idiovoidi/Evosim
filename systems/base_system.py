from typing import Dict, Any

class BaseSystem:
    def __init__(self, world):
        self.world = world
    
    def update(self, dt: float) -> Dict[str, Any]:
        """
        Update the system state and return serializable data
        Returns dict of changes that need to be sent to client
        """
        return {}
    
    def handle_client_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle messages from client and return response"""
        return {}