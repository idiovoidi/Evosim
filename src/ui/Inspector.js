import { GENES, TRACKED_TRAITS } from '../config/genes.js';
import { SPECIES_COLORS } from '../render/layers/CreatureArtist.js';
import { $, h, formatDuration } from './dom.js';
import { ICONS } from './icons.js';
import { drawPortrait } from './speciesIcon.js';

const VITALS = [
    { key: 'energy', label: 'Energy', color: '#ffd27a', value: (c) => c.needs.energy / c.traits.energyCapacity },
    { key: 'hydration', label: 'Hydration', color: '#6cc4ff', value: (c) => c.needs.hydration },
    { key: 'health', label: 'Health', color: '#ff7b7b', value: (c) => c.needs.health / c.traits.maxHealth },
    { key: 'stamina', label: 'Stamina', color: '#7ee0b0', value: (c) => c.needs.stamina },
    { key: 'age', label: 'Age', color: '#c7a6ff', value: (c) => c.life.age / c.lifespan },
];

const CAUSES = {
    starvation: 'Starved',
    dehydration: 'Died of thirst',
    'old age': 'Died of old age',
    predation: 'Killed by a predator',
};

/** Right panel describing the selected creature. Rebuilt on selection, refreshed in place. */
export class Inspector {
    constructor({ artist, onSelectId, onToggleFollow, onClose }) {
        this.artist = artist;
        this.onSelectId = onSelectId;
        this.onToggleFollow = onToggleFollow;
        this.onClose = onClose;
        this.root = $('inspector');
        this.creature = null;
        this.lastRefresh = 0;
    }

    show(creature) {
        this.creature = creature;
        if (!creature) {
            this.root.classList.add('hidden');
            return;
        }
        this.build(creature);
        this.root.classList.remove('hidden');
        this.lastRefresh = 0;
    }

    build(c) {
        this.portrait = h('canvas');
        this.status = h('span.status-pill');
        this.subtitle = h('div.subtitle');
        this.vitals = VITALS.map((v) => {
            const fill = h('div.bar-fill', { style: { background: v.color } });
            const val = h('span.val');
            return { ...v, fill, val, row: h('div.vital', {}, h('span', {}, v.label), h('div.bar', {}, fill), val) };
        });
        this.genes = TRACKED_TRAITS.map(({ key, label }) => {
            const fill = h('div.gene-fill', { style: { background: SPECIES_COLORS[c.speciesId] } });
            const mean = h('div.gene-mean');
            const val = h('span.val');
            return { key, fill, mean, val, row: h('div.gene', {}, h('span', {}, label), h('div.gene-track', {}, fill, mean), val) };
        });
        this.facts = h('div.facts');
        this.lineage = h('div.help-text');
        this.followBtn = h('button.btn.primary', { onclick: () => this.onToggleFollow() });

        this.root.replaceChildren(
            h('div.inspector-head', {},
                this.portrait,
                h('div', {}, h('div.title', {}, `${c.species.singular} #${c.id}`), this.subtitle, this.status),
                h('button.icon-btn.small.close', { html: ICONS.close, onclick: () => this.onClose(), 'data-tip': 'Close (Esc)' })),
            h('div.section-title', {}, 'Vitals'),
            ...this.vitals.map((v) => v.row),
            h('div.section-title', {}, 'Genes', h('span.muted.small', {}, '  │ = species mean')),
            ...this.genes.map((g) => g.row),
            h('div.section-title', {}, 'Life'),
            this.facts,
            this.lineage,
            h('div.inspector-actions', {}, this.followBtn),
        );
    }

    update(sim, camera, now) {
        const c = this.creature;
        if (!c || now - this.lastRefresh < 200) return;
        this.lastRefresh = now;
        drawPortrait(this.portrait, this.artist, c, now / 1000);

        this.status.className = `status-pill${c.alive ? '' : ' dead'}`;
        this.status.textContent = c.alive ? c.mind.label : CAUSES[c.life.causeOfDeath] ?? 'Dead';
        this.subtitle.textContent = `Generation ${c.life.generation} · ${c.isMature ? 'adult' : 'juvenile'}`;

        for (const v of this.vitals) {
            const value = Math.max(0, Math.min(1, v.value(c)));
            v.fill.style.width = `${value * 100}%`;
            v.val.textContent = v.key === 'age' ? formatDuration(c.life.age) : `${Math.round(value * 100)}%`;
        }

        const means = sim.stats.latest?.traits[c.speciesId];
        for (const g of this.genes) {
            const spec = GENES[g.key];
            const value = c.genome.get(g.key);
            const norm = (x) => `${((x - spec.min) / (spec.max - spec.min)) * 100}%`;
            g.fill.style.width = norm(value);
            g.val.textContent = value.toFixed(2);
            if (means) {
                g.mean.style.left = norm(means[g.key]);
                g.mean.style.display = '';
            } else {
                g.mean.style.display = 'none';
            }
        }

        const r = c.record;
        const grazer = c.species.eats.includes('vegetation') || c.species.eats.includes('algae');
        this.facts.replaceChildren(
            ...[
                ['Offspring', r.offspring],
                grazer ? ['Food eaten', Math.round(r.eaten)] : ['Kills', r.kills],
                ['Travelled', `${(r.distance / 1000).toFixed(1)} km`],
                ['Top speed', `${Math.round(c.traits.maxSpeed)} u/s`],
                ['Sense', `${Math.round(c.traits.sense)} u`],
                ['Mass', c.traits.mass.toFixed(2)],
            ].map(([k, v]) => h('div.fact', {}, h('div.k', {}, k), h('div.v', {}, String(v)))),
        );

        const parents = c.life.parents;
        if (parents?.length) {
            const links = parents.map((id) => {
                const p = sim.world.findById(id);
                return p
                    ? h('span.link', { onclick: () => this.onSelectId(id) }, `#${id}`)
                    : h('span.muted', {}, `#${id}`);
            });
            this.lineage.replaceChildren(h('span', {}, 'Parents: '), links[0], h('span', {}, ' & '), links[1] ?? '');
        } else {
            this.lineage.replaceChildren(h('span.muted', {}, 'First-generation settler or immigrant.'));
        }

        const following = camera.follow === c;
        this.followBtn.innerHTML = `${following ? 'Stop following' : 'Follow'} <span class="kbd">F</span>`;
        this.followBtn.disabled = !c.alive;
    }
}
