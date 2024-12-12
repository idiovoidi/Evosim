from deap import base, creator, tools
import random
import numpy as np
from components import ComponentType, Genetics
from typing import Dict, List, Tuple

# Create fitness class and individual type for DEAP
creator.create("FitnessMax", base.Fitness, weights=(1.0,))
creator.create("Individual", list, fitness=creator.FitnessMax)

class EnhancedGeneticSystem:
    TRAIT_DEFINITIONS = {
        'herbivore': {
            # Physical Traits
            'body_length': {
                'range': (0.85, 1.15),
                'gene_index': 0
            },
            'body_width': {
                'range': (0.9, 1.1),
                'gene_index': 1
            },
            'head_size': {
                'range': (0.9, 1.1),
                'gene_index': 2
            },
            'face_shape': {
                'range': (0.9, 1.1),
                'gene_index': 3
            },
            'snout_length': {
                'range': (0.8, 1.2),
                'gene_index': 4
            },
            'ear_length': {
                'range': (0.8, 1.2),
                'gene_index': 5
            },
            'ear_width': {
                'range': (0.9, 1.1),
                'gene_index': 6
            },
            'leg_length': {
                'range': (0.9, 1.1),
                'gene_index': 7
            },
            'fluffiness': {
                'range': (0.8, 1.2),
                'gene_index': 8
            },
            'tail_length': {
                'range': (0.8, 1.2),
                'gene_index': 9
            },
            # Survival Traits
            'speed': {
                'range': (0.7, 1.3),
                'gene_index': 10
            },
            'sense_radius': {
                'range': (0.8, 1.2),
                'gene_index': 11
            },
            'metabolism': {
                'range': (0.9, 1.1),
                'gene_index': 12
            },
            # Appearance Traits
            'color_brightness': {
                'range': (0.9, 1.1),
                'gene_index': 13
            },
            'pattern_intensity': {
                'range': (0.0, 0.3),
                'gene_index': 14
            }
        },
        'predator': {
            # Physical Traits
            'body_length': {
                'range': (0.9, 1.1),
                'gene_index': 0
            },
            'body_width': {
                'range': (0.9, 1.1),
                'gene_index': 1
            },
            'head_size': {
                'range': (0.9, 1.1),
                'gene_index': 2
            },
            'face_shape': {
                'range': (0.9, 1.1),
                'gene_index': 3
            },
            'snout_length': {
                'range': (0.8, 1.2),
                'gene_index': 4
            },
            'ear_length': {
                'range': (0.8, 1.2),
                'gene_index': 5
            },
            'ear_width': {
                'range': (0.9, 1.1),
                'gene_index': 6
            },
            'tail_length': {
                'range': (0.8, 1.2),
                'gene_index': 7
            },
            # Survival Traits
            'speed': {
                'range': (0.8, 1.4),
                'gene_index': 8
            },
            'sense_radius': {
                'range': (0.9, 1.3),
                'gene_index': 9
            },
            'metabolism': {
                'range': (0.8, 1.2),
                'gene_index': 10
            },
            'attack_strength': {
                'range': (0.8, 1.2),
                'gene_index': 11
            }
        }
    }

    def __init__(self, ecosystem):
        self.ecosystem = ecosystem
        self.toolbox = base.Toolbox()
        self._setup_genetics()

    def _setup_genetics(self):
        """Setup DEAP genetic operators"""
        # Register gene initialization
        self.toolbox.register("attr_float", random.uniform, 0.5, 1.5)
        # Update number of genes to match total traits (15 for herbivores, 12 for predators)
        self.toolbox.register("individual", tools.initRepeat, creator.Individual,
                            self.toolbox.attr_float, n=15)  # Use max number of genes
        
        # Register genetic operators from DEAP
        self.toolbox.register("mate", tools.cxTwoPoint)
        self.toolbox.register("mutate", tools.mutGaussian, mu=0, sigma=0.1, indpb=0.2)
        self.toolbox.register("select", tools.selTournament, tournsize=3)
        self.toolbox.register("evaluate", self._evaluate_fitness)

    def create_initial_genetics(self, species_type: str) -> Genetics:
        """Create initial genetics using DEAP"""
        # Generate a new individual using DEAP
        individual = self.toolbox.individual()
        
        # Ensure traits are within species-specific ranges
        self._clamp_traits(individual, species_type)
        
        # Convert to genetics component
        return self._create_genetics_component(individual, species_type)

    def mix_parent_genes(self, parent1, parent2) -> Genetics:
        """Mix genes using DEAP operators"""
        if not (parent1.has_component(ComponentType.GENETICS) and 
                parent2.has_component(ComponentType.GENETICS)):
            return None

        # Get parent genetics
        p1_genes = parent1.get_component(ComponentType.GENETICS)
        p2_genes = parent2.get_component(ComponentType.GENETICS)
        species_type = parent1.get_component(ComponentType.STATS).species_type

        # Convert to DEAP individuals
        ind1 = self._genes_to_individual(p1_genes.genes)
        ind2 = self._genes_to_individual(p2_genes.genes)

        # Apply DEAP crossover
        child1, child2 = self.toolbox.mate(ind1, ind2)
        
        # Apply DEAP mutation
        child1, = self.toolbox.mutate(child1)
        
        # Ensure traits are within valid ranges
        self._clamp_traits(child1, species_type)
        
        # Convert back to genetics component
        return self._create_genetics_component(child1, species_type)

    def _evaluate_fitness(self, individual):
        """Fitness function for DEAP"""
        # Basic fitness based on trait values
        return sum(individual),

    def _clamp_traits(self, individual, species_type: str):
        """Ensure traits stay within species-specific ranges"""
        trait_defs = self.TRAIT_DEFINITIONS.get(species_type, {})
        for trait_name, trait_info in trait_defs.items():
            min_val, max_val = trait_info['range']
            index = trait_info['gene_index']
            individual[index] = np.clip(individual[index], min_val, max_val)

    def _genes_to_individual(self, genes: Dict[str, float]) -> creator.Individual:
        """Convert genetics component to DEAP individual"""
        individual = creator.Individual([1.0] * 15)  # Use max number of genes
        for trait_name, value in genes.items():
            for species_traits in self.TRAIT_DEFINITIONS.values():
                if trait_name in species_traits:
                    index = species_traits[trait_name]['gene_index']
                    individual[index] = value
        return individual

    def _create_genetics_component(self, individual: creator.Individual, 
                                 species_type: str) -> Genetics:
        """Convert DEAP individual to genetics component"""
        genes = {}
        trait_defs = self.TRAIT_DEFINITIONS.get(species_type, {})
        
        for trait_name, trait_info in trait_defs.items():
            index = trait_info['gene_index']
            genes[trait_name] = individual[index]
            
        return Genetics(genes)
