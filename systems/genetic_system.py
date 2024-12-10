import random
import numpy as np
from components import ComponentType, Genetics

class GeneticSystem:
    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        
    def create_initial_genetics(self, species_type):
        """Create initial genetics for a new organism"""
        # Base gene ranges for different species
        gene_ranges = {
            'herbivore': {
                'body_length': (0.7, 1.3),     # More variation in body shape
                'body_width': (0.7, 1.3),
                'neck_length': (0.8, 1.2),
                'head_size': (0.8, 1.2),
                'ear_length': (0.6, 1.4),      # Big variation in ear length
                'ear_width': (0.7, 1.3),
                'color_brightness': (0.85, 1.15),  # Subtle variation in white/gray
                'pattern_intensity': (0.0, 0.4),   # Some might have spots
                'fluffiness': (0.7, 1.3),      # New trait for fur appearance
                'leg_length': (0.8, 1.2),      # Affects overall height
                'face_shape': (0.8, 1.2)       # Affects head roundness
            },
            'predator': {
                'body_length': (0.8, 1.2),
                'body_width': (0.7, 1.3),
                'neck_length': (0.8, 1.2),
                'head_size': (0.8, 1.2),
                'snout_length': (0.7, 1.3),    # More variation in fox faces
                'ear_length': (0.7, 1.3),
                'ear_width': (0.6, 1.4),
                'tail_length': (0.7, 1.3),
                'tail_thickness': (0.7, 1.3),
                'color_brightness': (0.7, 1.3), # More color variation
                'pattern_intensity': (0.2, 0.8),# Some might have stronger markings
                'mane_size': (0.6, 1.4),       # New trait for neck fur
                'eye_shape': (0.8, 1.2),       # Affects eye appearance
                'muscle_definition': (0.8, 1.2) # Affects body shape
            }
        }
        
        # Generate random genes with more variation
        genes = {}
        if species_type in gene_ranges:
            for gene, (min_val, max_val) in gene_ranges[species_type].items():
                # Use triangular distribution for more natural variation
                mode = (min_val + max_val) / 2
                genes[gene] = random.triangular(min_val, max_val, mode)
                
                # Occasionally create extreme variations
                if random.random() < 0.1:  # 10% chance
                    genes[gene] = random.uniform(min_val * 0.8, max_val * 1.2)
        
        return Genetics(genes)
    
    def mix_parent_genes(self, parent1, parent2, mutation_rate=0.15):
        """Create offspring genetics by mixing parents' genes with more mutation"""
        if not (parent1.has_component(ComponentType.GENETICS) and 
                parent2.has_component(ComponentType.GENETICS)):
            return None
            
        parent1_genes = parent1.get_component(ComponentType.GENETICS)
        parent2_genes = parent2.get_component(ComponentType.GENETICS)
        
        # Mix genes with more complex inheritance
        mixed_genes = {}
        for gene in parent1_genes.genes:
            if random.random() < 0.7:  # 70% dominant inheritance
                # Take more genes from the fitter parent
                fitter_parent = parent1_genes if random.random() < 0.6 else parent2_genes
                mixed_genes[gene] = fitter_parent.genes[gene]
            else:
                # Blend genes from both parents
                mixed_genes[gene] = (parent1_genes.genes[gene] + parent2_genes.genes[gene]) / 2
            
            # Apply mutations with varying intensity
            if random.random() < mutation_rate:
                mutation_strength = random.uniform(0.8, 1.2)
                if random.random() < 0.2:  # 20% chance of larger mutation
                    mutation_strength = random.uniform(0.6, 1.4)
                mixed_genes[gene] *= mutation_strength
                
                # Ensure values stay within reasonable bounds
                mixed_genes[gene] = max(0.5, min(1.5, mixed_genes[gene]))
        
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
