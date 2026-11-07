import { $ } from './dom.js';

/**
 * Cursor tooltip. Shows `data-tip` text for UI elements, or a description of
 * whatever is under the cursor in the world.
 */
export class Tooltip {
    constructor() {
        this.el = $('tooltip');
        this.uiTip = null;
        document.addEventListener('pointerover', (e) => {
            this.uiTip = e.target.closest?.('[data-tip]')?.dataset.tip ?? null;
        });
    }

    update({ x, y, overCanvas, sim, renderer, dragging }) {
        let html = null;
        if (this.uiTip) {
            html = this.uiTip;
        } else if (overCanvas && sim && !dragging) {
            const c = renderer.hovered;
            if (c) {
                html = `<b>${c.species.singular} #${c.id}</b> · ${c.mind.label}`;
            } else {
                const p = renderer.camera.screenToWorld(x, y);
                const { terrain, vegetation } = sim.world;
                if (terrain.inBounds(p.x, p.y)) {
                    const biome = terrain.biomeAt(p.x, p.y);
                    const idx = terrain.cellIndex(p.x, p.y);
                    const fertility = vegetation.fertility[idx];
                    const cover = fertility > 0 ? Math.round((vegetation.biomass[idx] / fertility) * 100) : 0;
                    html = `<b>${biome.name}</b>${fertility > 0 ? ` · ${terrain.water[idx] ? 'algae' : 'plants'} ${cover}%` : ''}`;
                }
            }
        }
        if (!html) {
            this.el.classList.add('hidden');
            return;
        }
        if (this.el.innerHTML !== html) this.el.innerHTML = html;
        this.el.classList.remove('hidden');
        const pad = 14;
        const w = this.el.offsetWidth;
        const hgt = this.el.offsetHeight;
        const left = x + pad + w > window.innerWidth ? x - w - pad : x + pad;
        const top = y + pad + hgt > window.innerHeight ? y - hgt - pad : y + pad;
        this.el.style.transform = `translate(${left}px, ${top}px)`;
    }
}
