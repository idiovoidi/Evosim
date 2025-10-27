"""Utility functions for the ecosystem simulation"""
import numpy as np
from typing import Tuple


def distance(pos1: np.ndarray, pos2: np.ndarray) -> float:
    """Calculate Euclidean distance between two positions"""
    return np.linalg.norm(pos2 - pos1)


def normalize(vector: np.ndarray) -> np.ndarray:
    """Normalize a vector to unit length"""
    magnitude = np.linalg.norm(vector)
    if magnitude > 0:
        return vector / magnitude
    return vector


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max"""
    return max(min_val, min(max_val, value))


def random_position_in_circle(center: np.ndarray, radius: float) -> np.ndarray:
    """Generate a random position within a circle"""
    angle = np.random.uniform(0, 2 * np.pi)
    r = radius * np.sqrt(np.random.uniform(0, 1))
    offset = np.array([r * np.cos(angle), r * np.sin(angle)])
    return center + offset


def lerp(a: float, b: float, t: float) -> float:
    """Linear interpolation between a and b"""
    return a + (b - a) * t


def in_bounds(pos: np.ndarray, width: float, height: float) -> bool:
    """Check if position is within bounds"""
    return 0 <= pos[0] <= width and 0 <= pos[1] <= height
