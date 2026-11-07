import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpatialHash } from '../src/sim/SpatialHash.js';
import { EventBus } from '../src/utils/EventBus.js';
import { decorate, guarded, validated, is, setErrorReporter } from '../src/utils/decorators.js';
import { ConfigError, RenderError, EvosimError } from '../src/errors/EvosimError.js';
import { buildConfig, DEFAULTS } from '../src/config/defaults.js';
import { Random } from '../src/utils/random.js';

test('spatial hash queries match brute force', () => {
    const random = new Random('hash');
    const items = Array.from({ length: 400 }, () => ({ x: random.float(0, 1000), y: random.float(0, 800), alive: true }));
    const hash = new SpatialHash(1000, 800, 64);
    hash.rebuild(items);
    for (let n = 0; n < 30; n++) {
        const x = random.float(0, 1000);
        const y = random.float(0, 800);
        const r = random.float(10, 200);
        const found = new Set();
        hash.query(x, y, r, (item) => { found.add(item); });
        const expected = items.filter((i) => (i.x - x) ** 2 + (i.y - y) ** 2 <= r * r);
        assert.equal(found.size, expected.length);
        for (const e of expected) assert.ok(found.has(e));
    }
});

test('event bus unsubscribe stops delivery', () => {
    const bus = new EventBus();
    let calls = 0;
    const off = bus.on('ping', () => calls++);
    bus.emit('ping');
    off();
    bus.emit('ping');
    assert.equal(calls, 1);
});

test('guarded converts, reports and falls back', () => {
    const reported = [];
    setErrorReporter((e) => reported.push(e));
    class Thing {
        explode() {
            throw new Error('kaboom-unique-1');
        }
    }
    decorate(Thing, { explode: [guarded(RenderError, { fallback: 42 })] });
    assert.equal(new Thing().explode(), 42);
    assert.equal(reported.length, 1);
    assert.ok(reported[0] instanceof RenderError);
    assert.ok(reported[0] instanceof EvosimError);
    assert.equal(reported[0].cause.message, 'kaboom-unique-1');
    setErrorReporter(() => {});
});

test('guarded handles rejected promises', async () => {
    setErrorReporter(() => {});
    class Thing {
        async explode() {
            throw new Error('async-kaboom');
        }
    }
    decorate(Thing, { explode: [guarded(RenderError, { rethrow: true })] });
    await assert.rejects(new Thing().explode(), RenderError);
});

test('validated rejects bad arguments', () => {
    class Thing {
        scale(v) {
            return v * 2;
        }
    }
    decorate(Thing, { scale: [validated(ConfigError, is.positive)] });
    assert.equal(new Thing().scale(2), 4);
    assert.throws(() => new Thing().scale(-1), ConfigError);
});

test('decorate refuses unknown methods', () => {
    assert.throws(() => decorate(class {}, { missing: [] }), ConfigError);
});

test('buildConfig deep-merges overrides without touching defaults', () => {
    const config = buildConfig({ population: { herbivore: 5 }, evolution: { mutationChance: 0.9 } });
    assert.equal(config.population.herbivore, 5);
    assert.equal(config.population.predator, DEFAULTS.population.predator);
    assert.equal(config.evolution.mutationChance, 0.9);
    assert.equal(DEFAULTS.population.herbivore, 80);
});
