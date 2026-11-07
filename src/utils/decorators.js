import { EvosimError, ConfigError } from '../errors/EvosimError.js';

/**
 * Universal error-checking decorators.
 *
 * Plain browser ES modules can't use `@decorator` syntax without a transpile
 * step, so these are method-wrapping functions applied with `decorate()`:
 *
 *   decorate(Renderer, { render: [guarded(RenderError)] });
 */

let reporter = (error) => console.error(error);
const lastReported = new Map();
const REPORT_COOLDOWN_MS = 5000;

export function setErrorReporter(fn) {
    reporter = fn;
}

function report(error) {
    const key = `${error.name}:${error.message}`;
    const now = Date.now();
    if (now - (lastReported.get(key) ?? 0) < REPORT_COOLDOWN_MS) return;
    lastReported.set(key, now);
    reporter(error);
}

function wrapError(ErrorClass, error, label) {
    if (error instanceof EvosimError) return error;
    return new ErrorClass(`${label}: ${error?.message ?? error}`, { cause: error });
}

/**
 * Apply decorators to prototype methods. Decorators listed first wrap outermost.
 * @param {Function} Class
 * @param {Record<string, Function[]>} spec
 */
export function decorate(Class, spec) {
    for (const [name, decorators] of Object.entries(spec)) {
        const original = Class.prototype[name];
        if (typeof original !== 'function') {
            throw new ConfigError(`Cannot decorate ${Class.name}.${name}: not a method`);
        }
        let wrapped = original;
        for (let i = decorators.length - 1; i >= 0; i--) {
            wrapped = decorators[i](wrapped, `${Class.name}.${name}`);
        }
        Class.prototype[name] = wrapped;
    }
    return Class;
}

/**
 * Catch errors, convert them to `ErrorClass`, report them (rate limited) and
 * either rethrow or return a fallback value so the main loop keeps running.
 */
export function guarded(ErrorClass = EvosimError, { fallback, rethrow = false } = {}) {
    return (fn, label) => function guardedMethod(...args) {
        try {
            const result = fn.apply(this, args);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    const wrapped = wrapError(ErrorClass, error, label);
                    report(wrapped);
                    if (rethrow) throw wrapped;
                    return typeof fallback === 'function' ? fallback.apply(this, args) : fallback;
                });
            }
            return result;
        } catch (error) {
            const wrapped = wrapError(ErrorClass, error, label);
            report(wrapped);
            if (rethrow) throw wrapped;
            return typeof fallback === 'function' ? fallback.apply(this, args) : fallback;
        }
    };
}

/**
 * Validate arguments before invoking the method. Each validator receives the
 * argument at the same index and returns `true` or an error message.
 */
export function validated(ErrorClass, ...validators) {
    return (fn, label) => function validatedMethod(...args) {
        validators.forEach((check, i) => {
            if (!check) return;
            const verdict = check(args[i]);
            if (verdict !== true) {
                throw new ErrorClass(`${label} argument ${i}: ${verdict}`, { context: { value: args[i] } });
            }
        });
        return fn.apply(this, args);
    };
}

/** Accumulate execution time into `this.profiler` (if present) under `key`. */
export function timed(key) {
    return (fn) => function timedMethod(...args) {
        const profiler = this.profiler;
        if (!profiler) return fn.apply(this, args);
        const start = performance.now();
        try {
            return fn.apply(this, args);
        } finally {
            profiler.record(key, performance.now() - start);
        }
    };
}

export const is = {
    finite: (v) => Number.isFinite(v) || `expected finite number, got ${v}`,
    positive: (v) => (Number.isFinite(v) && v > 0) || `expected positive number, got ${v}`,
    nonNegative: (v) => (Number.isFinite(v) && v >= 0) || `expected non-negative number, got ${v}`,
    oneOf: (options) => (v) => options.includes(v) || `expected one of [${options.join(', ')}], got ${v}`,
    object: (v) => (v !== null && typeof v === 'object') || `expected object, got ${v}`,
};
