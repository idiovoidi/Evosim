from typing import Dict, Any
import random
import numpy as np
from components import ComponentType, Genetics
from .base_system import BaseSystem

class GeneticSystem(BaseSystem):
    def update(self, dt: float) -> Dict[str, Any]:
        mutations = []
        
        for entity in self.world.get_entities_by_type(ComponentType.GENETICS):
            if not entity.active:
                continue
            
            genetics = entity.get_component(ComponentType.GENETICS)
            
            # Check for random mutations
            if random.random() < 0.01:  # 1% chance per update
                trait = random.choice(list(genetics.genes.keys()))
                mutation = random.uniform(0.9, 1.1)
                genetics.genes[trait] *= mutation
                
                mutations.append({
                    'entity_id': entity.id,
                    'trait': trait,
                    'value': genetics.genes[trait]
                })
        
        return {'mutations': mutations}
