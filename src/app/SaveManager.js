import { SaveError, LoadError } from '../errors/EvosimError.js';
import { decorate, guarded } from '../utils/decorators.js';
import { safeToSnapshot, safeFromSnapshot } from '../sim/persistence/Snapshot.js';

const KEY = 'evosim.save.v2';

/** localStorage persistence for simulation snapshots. */
export class SaveManager {
    constructor(storage = window.localStorage) {
        this.storage = storage;
    }

    hasSave() {
        return this.storage.getItem(KEY) !== null;
    }

    info() {
        const raw = this.storage.getItem(KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return { savedAt: new Date(data.savedAt), creatures: data.creatures.length, time: data.clock.time };
    }

    save(sim) {
        const json = JSON.stringify(safeToSnapshot(sim));
        try {
            this.storage.setItem(KEY, json);
        } catch (error) {
            throw new SaveError('Browser storage is full or unavailable', { cause: error });
        }
        return json.length;
    }

    load(deps) {
        const raw = this.storage.getItem(KEY);
        if (!raw) throw new LoadError('No saved world found');
        return safeFromSnapshot(JSON.parse(raw), deps);
    }

    clear() {
        this.storage.removeItem(KEY);
    }
}

decorate(SaveManager, {
    save: [guarded(SaveError, { rethrow: true })],
    load: [guarded(LoadError, { rethrow: true })],
    info: [guarded(LoadError, { fallback: null })],
});
