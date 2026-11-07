import { SPECIES, SPECIES_IDS } from '../config/species.js';
import { SPECIES_COLORS } from '../render/layers/CreatureArtist.js';
import { $, h } from './dom.js';
import { TopBar } from './TopBar.js';
import { PopulationPanel } from './PopulationPanel.js';
import { Inspector } from './Inspector.js';
import { Toasts } from './Toasts.js';
import { Tooltip } from './Tooltip.js';
import { Modal } from './Modal.js';

/**
 * Owns every DOM widget. The App injects callbacks; the HUD only reads
 * simulation state and never mutates it directly.
 */
export class HUD {
    constructor({ artist, actions }) {
        this.topBar = new TopBar(actions);
        this.population = new PopulationPanel({ artist, onSpeciesClick: actions.focusSpecies });
        this.inspector = new Inspector({
            artist,
            onSelectId: actions.selectById,
            onToggleFollow: actions.toggleFollow,
            onClose: () => actions.select(null),
        });
        this.toasts = new Toasts();
        this.tooltip = new Tooltip();
        this.modal = new Modal();
        this.statusbar = $('statusbar');
        this.loading = $('loading');
        this.loadingBar = $('loading-bar');
        this.loadingStatus = $('loading-status');
        this.lastStatus = 0;

        $('minimap-legend').replaceChildren(
            ...SPECIES_IDS.map((id) => h('span', {}, h('i', { style: { background: SPECIES_COLORS[id] } }), SPECIES[id].name)),
        );
    }

    bind(sim) {
        this.toasts.bind(sim.events);
        this.population.reset();
    }

    showLoading(text, progress = 0) {
        this.loading.classList.remove('done');
        this.loadingStatus.textContent = text;
        this.loadingBar.style.width = `${Math.round(progress * 100)}%`;
    }

    hideLoading() {
        this.loading.classList.add('done');
    }

    update({ sim, state, camera, now, pointer, renderer, profiler, fps }) {
        this.topBar.update(sim, state);
        this.population.update(sim, now);
        if (sim) this.inspector.update(sim, camera, now);
        this.tooltip.update({ ...pointer, sim, renderer });

        if (now - this.lastStatus > 500 && sim) {
            this.lastStatus = now;
            const alive = sim.world.creatures.length;
            this.statusbar.classList.toggle('paused', state.paused);
            this.statusbar.textContent =
                `${Math.round(fps)} fps · ${alive} creatures · sim ${profiler.get('sim').toFixed(1)} ms · draw ${profiler.get('render').toFixed(1)} ms · seed ${sim.seed}`;
        }
    }
}
