import { SPECIES, SPECIES_IDS } from '../config/species.js';
import { TRACKED_TRAITS } from '../config/genes.js';
import { SPECIES_COLORS } from '../render/layers/CreatureArtist.js';
import { $, h, formatDuration, formatNumber } from './dom.js';
import { ICONS } from './icons.js';
import { LineChart, drawSparkline } from './charts/LineChart.js';
import { drawPortrait } from './speciesIcon.js';

const TRAIT_COLORS = ['#ff9f6b', '#7cc4ff', '#c7a6ff', '#7ee0b0', '#ffd27a', '#ff6f91', '#9be37a'];
const SPARK_POINTS = 60;
const REFRESH_MS = 500;

/** Left panel: species cards, resource bars, population and evolution charts. */
export class PopulationPanel {
    constructor({ artist, onSpeciesClick }) {
        this.artist = artist;
        this.root = $('eco-panel');
        this.cards = new Map();
        this.tab = 'population';
        this.evoSpecies = 'herbivore';
        this.traits = new Set(['size', 'speed', 'sense', 'endurance']);
        this.lastRefresh = 0;
        this.peakVegetation = 1;
        this.peakAlgae = 1;

        const container = $('species-cards');
        for (const id of SPECIES_IDS) {
            const icon = h('canvas.icon');
            const count = h('span.count', {}, '0');
            const trend = h('span.trend');
            const meta = h('div.meta');
            const spark = h('canvas.spark');
            const card = h('div.species-card', { onclick: () => onSpeciesClick(id), 'data-tip': `Click to follow a ${SPECIES[id].singular.toLowerCase()}` },
                h('div.top', {}, icon, h('div', {}, h('div.name', {}, SPECIES[id].name), h('div', {}, count, trend))),
                spark, meta);
            container.append(card);
            this.cards.set(id, { icon, count, trend, meta, spark });
        }
        requestAnimationFrame(() => this.cards.forEach((c, id) => drawPortrait(c.icon, artist, id)));

        this.chart = new LineChart($('main-chart'), { xFormat: (t) => formatDuration(t) });
        this.evoControls = $('evolution-controls');
        this.traitControls = $('trait-controls');
        this.buildEvolutionControls();

        $('chart-tabs').addEventListener('click', (e) => {
            const tab = e.target.closest('button')?.dataset.tab;
            if (!tab) return;
            this.tab = tab;
            for (const b of $('chart-tabs').children) b.classList.toggle('active', b.dataset.tab === tab);
            this.evoControls.classList.toggle('hidden', tab !== 'evolution');
            this.traitControls.classList.toggle('hidden', tab !== 'evolution');
            this.lastRefresh = 0;
        });

        const collapse = $('btn-collapse');
        collapse.innerHTML = ICONS.collapse;
        collapse.addEventListener('click', () => {
            const collapsed = this.root.classList.toggle('collapsed');
            collapse.innerHTML = collapsed ? ICONS.expand : ICONS.collapse;
        });
        this.totals = $('totals');
    }

    buildEvolutionControls() {
        this.evoChips = SPECIES_IDS.map((id) => {
            const chip = h('button.chip', { onclick: () => { this.evoSpecies = id; this.syncChips(); } },
                h('span.dot', { style: { background: SPECIES_COLORS[id] } }), SPECIES[id].name);
            this.evoControls.append(chip);
            return { id, chip };
        });
        this.traitChips = TRACKED_TRAITS.map(({ key, label }, i) => {
            const chip = h('button.chip', {
                onclick: () => {
                    if (this.traits.has(key)) this.traits.delete(key);
                    else this.traits.add(key);
                    this.syncChips();
                },
            }, h('span.dot', { style: { background: TRAIT_COLORS[i] } }), label);
            this.traitControls.append(chip);
            return { key, chip };
        });
        this.syncChips();
    }

    syncChips() {
        for (const { id, chip } of this.evoChips) chip.classList.toggle('active', id === this.evoSpecies);
        for (const { key, chip } of this.traitChips) chip.classList.toggle('active', this.traits.has(key));
        this.lastRefresh = 0;
    }

    update(sim, now) {
        if (!sim || now - this.lastRefresh < REFRESH_MS) return;
        this.lastRefresh = now;
        const world = sim.world;
        const history = sim.stats.history;
        const recent = history.slice(-SPARK_POINTS);
        const past = history.at(-11);

        for (const id of SPECIES_IDS) {
            const card = this.cards.get(id);
            const n = world.counts[id];
            card.count.textContent = n;
            const before = past?.counts[id];
            if (before !== undefined && before !== n) {
                const delta = n - before;
                card.trend.textContent = `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`;
                card.trend.className = `trend ${delta > 0 ? 'up' : 'down'}`;
            } else {
                card.trend.textContent = '';
            }
            card.meta.textContent = `Max generation ${history.at(-1)?.generations[id] ?? 1}`;
            drawSparkline(card.spark, recent.map((s) => s.counts[id]), SPECIES_COLORS[id]);
        }

        const veg = world.vegetation.totals;
        this.peakVegetation = Math.max(this.peakVegetation, veg.land);
        this.peakAlgae = Math.max(this.peakAlgae, veg.water);
        $('veg-bar').style.width = `${(veg.land / this.peakVegetation) * 100}%`;
        $('algae-bar').style.width = `${(veg.water / this.peakAlgae) * 100}%`;
        $('veg-value').textContent = `${Math.round((veg.land / this.peakVegetation) * 100)}%`;
        $('algae-value').textContent = `${Math.round((veg.water / this.peakAlgae) * 100)}%`;

        const xs = history.map((s) => s.time);
        if (this.tab === 'population') {
            this.chart.fill = true;
            this.chart.yFormat = formatNumber;
            this.chart.setData(xs, SPECIES_IDS.map((id) => ({
                label: SPECIES[id].name,
                color: SPECIES_COLORS[id],
                values: history.map((s) => s.counts[id]),
            })));
        } else {
            const id = this.evoSpecies;
            const series = TRACKED_TRAITS
                .map((t, i) => ({ ...t, color: TRAIT_COLORS[i] }))
                .filter((t) => this.traits.has(t.key))
                .map((t) => {
                    const base = history.find((s) => s.traits[id])?.traits[id][t.key];
                    return {
                        label: t.label,
                        color: t.color,
                        values: history.map((s) => {
                            const v = s.traits[id]?.[t.key];
                            return v === undefined || !base ? null : (v / base - 1) * 100;
                        }),
                    };
                });
            let extent = 5;
            for (const s of series) for (const v of s.values) if (v !== null) extent = Math.max(extent, Math.abs(v));
            extent = Math.ceil(extent / 5) * 5;
            this.chart.fill = false;
            this.chart.yFormat = (v) => `${v > 0 ? '+' : ''}${Math.round(v)}%`;
            this.chart.setData(xs, series, [-extent, extent]);
        }

        const t = world.totals;
        this.totals.replaceChildren(
            ...[['Births', t.births], ['Deaths', t.deaths], ['Kills', t.kills], ['Max gen', t.maxGeneration]]
                .map(([k, v]) => h('div.total', {}, h('div.v', {}, formatNumber(v)), h('div.k', {}, k))),
        );
    }

    reset() {
        this.peakVegetation = 1;
        this.peakAlgae = 1;
        this.lastRefresh = 0;
    }
}
