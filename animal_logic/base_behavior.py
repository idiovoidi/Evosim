class BaseBehavior:
    def __init__(self, entity, world):
        self.entity = entity
        self.world = world
    
    def update(self, dt):
        pass 