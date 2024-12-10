from PyQt6.QtGui import QColor
import numpy as np
import math

class EventEffect:
    def __init__(self, position, char, color, duration=60, velocity=np.array([0, -1]), fade=True):
        self.position = position.copy()
        self.char = char
        self.color = color
        self.duration = duration
        self.lifetime = duration
        self.velocity = velocity
        self.fade = fade
        self.scale = 1.0
    
    def update(self, dt):
        """Update effect position and lifetime"""
        self.position += self.velocity * dt
        self.lifetime -= dt
        
        # Add floating/bobbing motion
        self.position[0] += math.sin(self.lifetime * 0.1) * 0.5
        
        # Scale effect over time
        if self.fade:
            self.scale = max(0.5, self.lifetime / self.duration)
        
        return self.lifetime > 0

class EventEffectSystem:
    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        self.effects = []
    
    def update(self, dt):
        """Update all active effects"""
        self.effects = [effect for effect in self.effects if effect.update(dt)]
    
    def add_eat_effect(self, position):
        """Add eating animation effect"""
        # Add multiple particles for eating effect
        base_pos = np.array(position)
        for _ in range(3):
            velocity = np.array([
                np.random.uniform(-1, 1),
                np.random.uniform(-2, -1)
            ])
            pos = base_pos + np.random.uniform(-10, 10, 2)
            self.effects.append(EventEffect(
                pos, '💥',
                QColor(255, 100, 100),
                duration=30,
                velocity=velocity
            ))
    
    def add_heart_effect(self, position):
        """Add floating heart effect for breeding"""
        base_pos = np.array(position)
        for _ in range(2):
            pos = base_pos + np.random.uniform(-5, 5, 2)
            self.effects.append(EventEffect(
                pos, '❤️',
                QColor(255, 105, 180),
                duration=45,
                velocity=np.array([0, -1])
            )) 