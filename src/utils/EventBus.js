/** Minimal synchronous pub/sub used to decouple the simulation from presentation. */
export class EventBus {
    constructor() {
        this.handlers = new Map();
    }

    on(type, handler) {
        if (!this.handlers.has(type)) this.handlers.set(type, new Set());
        this.handlers.get(type).add(handler);
        return () => this.handlers.get(type)?.delete(handler);
    }

    emit(type, payload) {
        const set = this.handlers.get(type);
        if (!set) return;
        for (const handler of set) handler(payload);
    }

    clear() {
        this.handlers.clear();
    }
}
