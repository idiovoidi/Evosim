/**
 * Exception hierarchy for the simulation.
 *
 *   EvosimError
 *   ├── ConfigError
 *   ├── SimulationError
 *   │   ├── TerrainError
 *   │   ├── SpawnError
 *   │   └── GeneticsError
 *   ├── RenderError
 *   └── PersistenceError
 *       ├── SaveError
 *       └── LoadError
 */
export class EvosimError extends Error {
    constructor(message, { cause, context } = {}) {
        super(message, cause ? { cause } : undefined);
        this.name = new.target.name;
        this.context = context ?? null;
    }
}

export class ConfigError extends EvosimError {}

export class SimulationError extends EvosimError {}
export class TerrainError extends SimulationError {}
export class SpawnError extends SimulationError {}
export class GeneticsError extends SimulationError {}

export class RenderError extends EvosimError {}

export class PersistenceError extends EvosimError {}
export class SaveError extends PersistenceError {}
export class LoadError extends PersistenceError {}
