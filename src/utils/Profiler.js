/** Exponentially smoothed timings (ms) keyed by section name. */
export class Profiler {
    constructor(smoothing = 0.1) {
        this.smoothing = smoothing;
        this.timings = new Map();
    }

    record(key, ms) {
        const prev = this.timings.get(key);
        this.timings.set(key, prev === undefined ? ms : prev + (ms - prev) * this.smoothing);
    }

    get(key) {
        return this.timings.get(key) ?? 0;
    }
}
