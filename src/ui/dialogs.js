import { DEFAULTS } from '../config/defaults.js';
import { SPECIES, SPECIES_IDS } from '../config/species.js';
import { h } from './dom.js';

const SLIDERS = [
    ...SPECIES_IDS.map((id) => ({
        path: ['population', id],
        label: `Starting ${SPECIES[id].name.toLowerCase()}`,
        min: 0,
        max: DEFAULTS.population[id] * 3,
        step: 1,
    })),
    { path: ['evolution', 'mutationChance'], label: 'Mutation chance', min: 0, max: 1, step: 0.05, format: pct },
    { path: ['evolution', 'mutationScale'], label: 'Mutation size', min: 0.2, max: 3, step: 0.1, format: times },
    { path: ['vegetation', 'growthScale'], label: 'Plant growth', min: 0.1, max: 1.2, step: 0.05, format: times },
    { path: ['clock', 'dayLength'], label: 'Day length', min: 40, max: 400, step: 10, format: (v) => `${v}s` },
];

function pct(v) {
    return `${Math.round(v * 100)}%`;
}

function times(v) {
    return `${Number(v).toFixed(2)}×`;
}

const read = (obj, path) => path.reduce((o, k) => o?.[k], obj);

function write(obj, path, value) {
    let o = obj;
    for (const k of path.slice(0, -1)) o = o[k] ??= {};
    o[path.at(-1)] = value;
}

export function randomSeed() {
    return Math.random().toString(36).slice(2, 8);
}

/**
 * New-world form. Calls `onSubmit({ seed, overrides })` with only the
 * values that differ from the defaults.
 */
export function buildNewWorldDialog({ seed, overrides = {}, onSubmit, onCancel }) {
    const current = (path) => read(overrides, path) ?? read(DEFAULTS, path);
    const seedInput = h('input', { type: 'text', value: seed, spellcheck: 'false' });
    const values = new Map();

    const fields = SLIDERS.map((s) => {
        const value = current(s.path);
        values.set(s, value);
        const output = h('output', {}, (s.format ?? String)(value));
        const input = h('input', {
            type: 'range', min: s.min, max: s.max, step: s.step, value,
            oninput: (e) => {
                const v = Number(e.target.value);
                values.set(s, v);
                output.textContent = (s.format ?? String)(v);
            },
        });
        return h('div.field', {}, h('label', {}, h('span', {}, s.label), output), input);
    });

    let immigration = current(['immigration', 'enabled']);
    const sw = h(`span.switch${immigration ? '.on' : ''}`);
    const immigrationRow = h('div.toggle-row.field.full', {
        onclick: () => {
            immigration = !immigration;
            sw.classList.toggle('on', immigration);
        },
    }, h('span', {}, 'Immigration rescues species near extinction'), sw);

    const submit = () => {
        const result = {};
        for (const [s, v] of values) if (v !== read(DEFAULTS, s.path)) write(result, s.path, v);
        if (immigration !== DEFAULTS.immigration.enabled) write(result, ['immigration', 'enabled'], immigration);
        onSubmit({ seed: seedInput.value.trim() || randomSeed(), overrides: result });
    };

    return h('form', { onsubmit: (e) => { e.preventDefault(); submit(); } },
        h('h2', {}, 'New world'),
        h('p.lead', {}, 'Every seed grows a different continent. Tune the starting conditions, then let evolution take over.'),
        h('div.form-grid', {},
            h('div.field.full', {},
                h('label', {}, h('span', {}, 'World seed')),
                h('div', { style: { display: 'flex', gap: '8px' } },
                    seedInput,
                    h('button.btn', { type: 'button', style: { flex: '0 0 auto' }, onclick: () => { seedInput.value = randomSeed(); } }, 'Shuffle'))),
            ...fields,
            immigrationRow),
        h('div.modal-actions', {},
            h('button.btn', { type: 'button', onclick: onCancel }, 'Cancel'),
            h('button.btn.primary', { type: 'submit' }, 'Create world')));
}

const SHORTCUTS = [
    ['Space', 'Pause / resume'],
    ['1 – 6', 'Simulation speed'],
    ['Drag · WASD', 'Pan the camera'],
    ['Wheel · + / −', 'Zoom'],
    ['Click', 'Inspect a creature'],
    ['Double-click · F', 'Follow the selected creature'],
    ['Esc', 'Deselect / close'],
    ['N', 'New world'],
    ['Ctrl+S · Ctrl+O', 'Save / load'],
    ['V', 'View options'],
    ['L · G · T · R', 'Lighting · vegetation · trails · rings'],
];

export function buildHelpDialog({ onClose }) {
    return h('div', {},
        h('h2', {}, 'How Evosim works'),
        h('div.help-text', {},
            h('p', {}, 'Four species share a procedurally generated continent. Grazers eat vegetation, Hunters stalk grazers, Fish feed on algae and Raptors dive for fish and scavenge carrion.'),
            h('p', {}, 'Every creature carries genes for size, speed, senses, endurance, litter size, boldness and sociality. Each gene has a cost: big bodies need more food, fast legs burn energy and keen senses tax the brain. Offspring inherit a mix of both parents with small mutations, so the traits that survive slowly shift the population.'),
            h('p', {}, 'Seasons change plant growth, nights hide prey and favour nocturnal hunters, and corpses fertilise the soil. Open the Evolution tab to watch the average genes drift.')),
        h('div.section-title', {}, 'Controls'),
        h('div.help-grid', {}, ...SHORTCUTS.flatMap(([k, d]) => [h('kbd', {}, k), h('span', {}, d)])),
        h('div.modal-actions', {}, h('button.btn.primary', { type: 'button', onclick: onClose }, 'Got it')));
}
