/**
 * Heritable genes. Each gene has a legal range and a mutation step (stdDev as a
 * fraction of the range). Species may override `init` ranges.
 *
 * Trade-offs are enforced by the phenotype/metabolism model, not here:
 *   size      bigger body, more energy storage and bite/attack, higher upkeep, slower
 *   speed     faster top speed, quadratic movement cost
 *   sense     larger perception radius, constant neural upkeep
 *   endurance longer sprints, slightly higher basal metabolism
 *   litter    more offspring per birth, each one born weaker
 *   boldness  tolerates threats closer before fleeing / attacks bigger prey
 *   sociality strength of herding / schooling / flocking
 *   hue       neutral marker; drifts freely and drives mate compatibility
 */
export const GENES = {
    size: { min: 0.55, max: 2.0, init: [0.9, 1.1], step: 0.05 },
    speed: { min: 0.5, max: 2.0, init: [0.9, 1.1], step: 0.05 },
    sense: { min: 0.5, max: 2.2, init: [0.9, 1.1], step: 0.05 },
    endurance: { min: 0.4, max: 2.2, init: [0.9, 1.1], step: 0.05 },
    litter: { min: 1, max: 6, init: [1.5, 2.5], step: 0.06 },
    boldness: { min: 0, max: 1, init: [0.3, 0.6], step: 0.06 },
    sociality: { min: 0, max: 1, init: [0.3, 0.7], step: 0.06 },
    hue: { min: 0, max: 1, init: [0.4, 0.6], step: 0.04 },
};

export const GENE_KEYS = Object.keys(GENES);

/** Genes shown in the inspector / evolution charts, with display labels. */
export const TRACKED_TRAITS = [
    { key: 'size', label: 'Size' },
    { key: 'speed', label: 'Speed' },
    { key: 'sense', label: 'Sense' },
    { key: 'endurance', label: 'Endurance' },
    { key: 'litter', label: 'Litter' },
    { key: 'boldness', label: 'Boldness' },
    { key: 'sociality', label: 'Sociality' },
];
