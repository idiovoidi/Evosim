import random
import numpy as np
from components import ComponentType, Genetics

class GeneticSystem:
    # Define trait ranges and their impact on appearance
    TRAIT_DEFINITIONS = {
        'herbivore': {
            'body_length': {
                'range': (0.85, 1.15),    # More conservative range
                'mutation_step': 0.05,     # Small steps for gradual change
                'description': 'Controls overall body length'
            },
            'body_width': {
                'range': (0.9, 1.1),
                'mutation_step': 0.04,
                'description': 'Controls body width'
            },
            'head_size': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls head size'
            },
            'face_shape': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls face roundness'
            },
            'ear_length': {
                'range': (0.8, 1.2),      # Wider range for distinctive feature
                'mutation_step': 0.05,
                'description': 'Controls ear length'
            },
            'ear_width': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls ear width'
            },
            'leg_length': {
                'range': (0.9, 1.1),
                'mutation_step': 0.04,
                'description': 'Controls leg height'
            },
            'fluffiness': {
                'range': (0.8, 1.2),
                'mutation_step': 0.05,
                'description': 'Controls fur appearance'
            },
            'color_brightness': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls color brightness'
            },
            'pattern_intensity': {
                'range': (0.0, 0.3),
                'mutation_step': 0.02,
                'description': 'Controls pattern visibility'
            }
        },
        'predator': {
            'body_length': {
                'range': (0.9, 1.1),
                'mutation_step': 0.04,
                'description': 'Controls body length'
            },
            'body_width': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls body width'
            },
            'head_size': {
                'range': (0.95, 1.05),    # More consistent head size
                'mutation_step': 0.02,
                'description': 'Controls head size'
            },
            'snout_length': {
                'range': (0.85, 1.15),
                'mutation_step': 0.04,
                'description': 'Controls snout length'
            },
            'ear_length': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls ear length'
            },
            'ear_width': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls ear width'
            },
            'tail_length': {
                'range': (0.8, 1.2),
                'mutation_step': 0.05,
                'description': 'Controls tail length'
            },
            'tail_thickness': {
                'range': (0.9, 1.1),
                'mutation_step': 0.03,
                'description': 'Controls tail thickness'
            },
            'color_brightness': {
                'range': (0.8, 1.2),
                'mutation_step': 0.04,
                'description': 'Controls color brightness'
            },
            'pattern_intensity': {
                'range': (0.2, 0.8),
                'mutation_step': 0.05,
                'description': 'Controls pattern visibility'
            }
        }
    }

    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        
    def create_initial_genetics(self, species_type):
        """Create initial genetics with controlled variation"""
        genes = {}
        if species_type in self.TRAIT_DEFINITIONS:
            traits = self.TRAIT_DEFINITIONS[species_type]
            for trait_name, trait_info in traits.items():
                min_val, max_val = trait_info['range']
                # Use triangular distribution for more natural variation
                mode = 1.0  # Center point is normal proportions
                genes[trait_name] = random.triangular(min_val, max_val, mode)
        
        return Genetics(genes)
    
    def mix_parent_genes(self, parent1, parent2, mutation_rate=0.1):
        """Mix genes with controlled mutations"""
        if not (parent1.has_component(ComponentType.GENETICS) and 
                parent2.has_component(ComponentType.GENETICS)):
            return None

        parent1_genes = parent1.get_component(ComponentType.GENETICS)
        parent2_genes = parent2.get_component(ComponentType.GENETICS)
        
        # Determine species type from parent
        stats = parent1.get_component(ComponentType.STATS)
        species_type = stats.species_type
        traits = self.TRAIT_DEFINITIONS.get(species_type, {})

        mixed_genes = {}
        for gene in parent1_genes.genes:
            # Get trait definition
            trait_info = traits.get(gene, {})
            mutation_step = trait_info.get('mutation_step', 0.05)
            min_val, max_val = trait_info.get('range', (0.8, 1.2))

            # Mix genes
            if random.random() < 0.7:  # 70% dominant inheritance
                mixed_genes[gene] = parent1_genes.genes[gene]
            else:
                mixed_genes[gene] = parent2_genes.genes[gene]

            # Apply controlled mutation
            if random.random() < mutation_rate:
                # Use mutation step for controlled changes
                mutation = random.choice([-1, 1]) * mutation_step
                mixed_genes[gene] += mutation
                # Clamp to valid range
                mixed_genes[gene] = max(min_val, min(max_val, mixed_genes[gene]))

        return Genetics(mixed_genes)
    
    def calculate_trait_compatibility(self, entity1, entity2):
        """Calculate genetic compatibility between two entities"""
        if not (entity1.has_component(ComponentType.GENETICS) and 
                entity2.has_component(ComponentType.GENETICS)):
            return 0.0
            
        genes1 = entity1.get_component(ComponentType.GENETICS).genes
        genes2 = entity2.get_component(ComponentType.GENETICS).genes
        
        # Calculate similarity score
        total_diff = 0
        num_genes = len(genes1)
        
        for gene in genes1:
            if gene in genes2:
                diff = abs(genes1[gene] - genes2[gene])
                total_diff += diff
        
        # Convert to compatibility score (0 to 1)
        avg_diff = total_diff / num_genes
        compatibility = 1.0 - min(1.0, avg_diff)
        
        return compatibility
    
    def mutate_genes(self, genetics, mutation_rate=0.1, mutation_range=0.1):
        """Apply random mutations to genes"""
        mutated_genes = genetics.genes.copy()
        
        for gene in mutated_genes:
            if random.random() < mutation_rate:
                # Apply random mutation within range
                mutation = random.uniform(1 - mutation_range, 1 + mutation_range)
                mutated_genes[gene] *= mutation
                
                # Ensure values stay within reasonable bounds
                mutated_genes[gene] = max(0.5, min(1.5, mutated_genes[gene]))
        
        return Genetics(mutated_genes)
