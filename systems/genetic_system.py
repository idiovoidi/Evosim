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
                'body_length': (0.8, 1.2),
                'body_width': (0.8, 1.2),
                'neck_length': (0.8, 1.1),
                'head_size': (0.9, 1.1),
                'ear_length': (0.7, 1.3),  # More variation in rabbit ears
                'ear_width': (0.8, 1.2),
                'color_brightness': (0.9, 1.1),  # Subtle variation in white/gray
                'pattern_intensity': (0.0, 0.3)  # Light patterning
            },
            'predator': {
                'body_length': (0.9, 1.1),
                'body_width': (0.8, 1.2),
                'neck_length': (0.9, 1.1),
                'head_size': (0.8, 1.2),
                'snout_length': (0.8, 1.2),
                'ear_length': (0.8, 1.2),
                'ear_width': (0.7, 1.3),
                'tail_length': (0.8, 1.2),
                'tail_thickness': (0.8, 1.2),
                'color_brightness': (0.8, 1.2),
                'pattern_intensity': (0.3, 0.7)  # More distinct patterns for predators
            }
        }
        
        # Generate random genes within species-specific ranges
        genes = {}
        if species_type in gene_ranges:
            for gene, (min_val, max_val) in gene_ranges[species_type].items():
                genes[gene] = random.uniform(min_val, max_val)
        
        return Genetics(genes)
    
    def mix_parent_genes(self, parent1, parent2, mutation_rate=0.1):
        """Create offspring genetics by mixing parents' genes"""
        if not (parent1.has_component(ComponentType.GENETICS) and 
                parent2.has_component(ComponentType.GENETICS)):
            return None
            
        parent1_genes = parent1.get_component(ComponentType.GENETICS)
        parent2_genes = parent2.get_component(ComponentType.GENETICS)
        
        # Mix genes from both parents
        mixed_genes = {}
        for gene in parent1_genes.genes:
            # Randomly select from either parent
            if random.random() < 0.5:
                mixed_genes[gene] = parent1_genes.genes[gene]
            else:
                mixed_genes[gene] = parent2_genes.genes[gene]
            
            # Apply possible mutation
            if random.random() < mutation_rate:
                mutation = random.uniform(0.9, 1.1)
                mixed_genes[gene] *= mutation
        
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
``` 