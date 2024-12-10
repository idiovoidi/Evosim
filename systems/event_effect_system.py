from PyQt6.QtGui import QColor
import numpy as np
import math
import random

class EventEffect:
    def __init__(self, position, char, color, duration=60, velocity=np.array([0, -1]), fade=True, scale=1.0):
        self.position = position.copy()
        self.char = char
        self.color = color
        self.duration = duration
        self.lifetime = duration
        self.velocity = velocity
        self.fade = fade
        self.scale = scale
        self.effect_type = char  # Track effect type by character
        
    def update(self, dt):
        """Update effect position and lifetime"""
        self.position += self.velocity * dt
        self.lifetime -= dt
        
        if self.effect_type == '💀':  # Bones
            # Bones fade more slowly and get smaller
            if self.lifetime < self.duration * 0.3:
                self.scale = max(0.3, self.lifetime / self.duration)
            # Add slight settling movement at start
            if self.lifetime > self.duration * 0.8:
                self.position += np.random.normal(0, 0.2, 2)
        elif self.effect_type == '❤️':  # Hearts
            # Hearts float up and bob side to side
            self.position[0] += math.sin(self.lifetime * 0.1) * 0.8
            self.scale = 1.0 + math.sin(self.lifetime * 0.2) * 0.1  # Pulse effect
        else:  # Other effects
            if self.fade:
                self.scale = max(0.5, self.lifetime / self.duration)
            self.position[0] += math.sin(self.lifetime * 0.1) * 0.5
        
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
        for _ in range(3):  # More hearts
            pos = base_pos + np.random.uniform(-10, 10, 2)
            self.effects.append(EventEffect(
                pos, '❤️',
                QColor(255, 20, 147),  # Deep pink
                duration=90,  # Longer duration
                velocity=np.array([0, -0.8]),  # Slower rise
                fade=True,
                scale=random.uniform(0.8, 1.2)  # Size variation
            ))
    
    def add_bones_effect(self, position):
        """Add decaying bones effect"""
        self.effects.append(EventEffect(
            position=position,
            char='💀',
            color=QColor(220, 220, 220),  # Light gray
            duration=180,  # 3 seconds at 60 fps
            velocity=np.array([0, 0]),  # Stationary
            fade=True,
            scale=0.9
        ))
        
        # Add some smaller bone fragments
        for _ in range(2):
            offset = np.random.uniform(-15, 15, 2)
            self.effects.append(EventEffect(
                position=position + offset,
                char='🦴',
                color=QColor(200, 200, 200),
                duration=120,
                velocity=np.array([0, 0]),
                fade=True,
                scale=0.6
            )) 