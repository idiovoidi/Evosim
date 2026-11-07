import { $, h, fitCanvas } from './dom.js';
import { ICONS } from './icons.js';
import { TAU } from '../utils/math.js';

export const VIEW_OPTIONS = [
    { key: 'lighting', label: 'Day / night lighting', key2: 'L' },
    { key: 'vegetation', label: 'Vegetation layer', key2: 'G' },
    { key: 'trails', label: 'Selected trail', key2: 'T' },
    { key: 'senses', label: 'Sense & territory rings', key2: 'R' },
];

/** Clock, transport (pause/speed) and global actions. */
export class TopBar {
    /**
     * @param {object} actions  callbacks supplied by the App
     */
    constructor(actions) {
        this.actions = actions;
        this.pauseBtn = $('btn-pause');
        this.speedGroup = $('speed-group');
        this.dial = $('clock-dial');
        this.primary = $('clock-primary');
        this.secondary = $('clock-secondary');
        this.viewMenu = $('view-menu');

        this.pauseBtn.addEventListener('click', () => actions.togglePause());
        this.speedButtons = actions.speeds.map((s) => {
            const btn = h('button', { onclick: () => actions.setSpeed(s) }, s < 1 ? '½×' : `${s}×`);
            this.speedGroup.append(btn);
            return { speed: s, btn };
        });

        const wire = (id, icon, fn) => {
            const el = $(id);
            el.innerHTML = ICONS[icon];
            el.addEventListener('click', fn);
        };
        wire('btn-new', 'globe', () => actions.openNewWorld());
        wire('btn-save', 'save', () => actions.save());
        wire('btn-load', 'folder', () => actions.load());
        wire('btn-view', 'eye', (e) => {
            e.stopPropagation();
            this.toggleViewMenu();
        });
        wire('btn-help', 'help', () => actions.openHelp());

        this.toggles = VIEW_OPTIONS.map((opt) => {
            const sw = h('span.switch');
            const row = h('div.toggle-row', { onclick: () => actions.toggleOption(opt.key) },
                h('span', {}, opt.label), h('span.kbd', {}, opt.key2), sw);
            this.viewMenu.append(row);
            return { key: opt.key, sw };
        });
        this.viewMenu.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => this.viewMenu.classList.add('hidden'));
        this.lastState = '';
    }

    toggleViewMenu() {
        this.viewMenu.classList.toggle('hidden');
    }

    update(sim, state) {
        const key = `${state.paused}|${state.speed}|${Object.values(state.options).join()}`;
        if (key !== this.lastState) {
            this.lastState = key;
            this.pauseBtn.innerHTML = state.paused ? ICONS.play : ICONS.pause;
            this.pauseBtn.classList.toggle('active', state.paused);
            for (const { speed, btn } of this.speedButtons) btn.classList.toggle('active', speed === state.speed);
            for (const { key: k, sw } of this.toggles) sw.classList.toggle('on', !!state.options[k]);
        }
        if (!sim) return;
        const clock = sim.world.clock;
        const minutes = Math.floor(clock.timeOfDay * 24 * 60);
        const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mm = String(minutes % 60).padStart(2, '0');
        this.primary.textContent = `Day ${clock.day} · ${clock.season}`;
        this.secondary.textContent = `Year ${clock.year} · ${hh}:${mm}`;
        this.drawDial(clock);
    }

    drawDial(clock) {
        const { ctx, width: w } = fitCanvas(this.dial);
        const c = w / 2;
        const r = c - 2;
        ctx.clearRect(0, 0, w, w);
        const sky = ctx.createLinearGradient(0, 0, 0, w);
        const day = clock.daylight;
        sky.addColorStop(0, `rgba(${40 + day * 80}, ${60 + day * 120}, ${110 + day * 120}, 1)`);
        sky.addColorStop(1, `rgba(${20 + day * 40}, ${30 + day * 60}, ${60 + day * 60}, 1)`);
        ctx.fillStyle = sky;
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
        ctx.fill();

        const angle = clock.timeOfDay * TAU + Math.PI / 2;
        const sx = c + Math.cos(angle) * r * 0.62;
        const sy = c + Math.sin(angle) * r * 0.62;
        const isDay = sy < c + r * 0.15;
        ctx.fillStyle = isDay ? '#ffd27a' : '#dfe6f5';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.24, 0, TAU);
        ctx.fill();
        if (!isDay) {
            ctx.fillStyle = `rgba(${20 + day * 40}, ${30 + day * 60}, ${60 + day * 60}, 1)`;
            ctx.beginPath();
            ctx.arc(sx + r * 0.1, sy - r * 0.08, r * 0.2, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(30, 60, 30, 0.85)';
        ctx.beginPath();
        ctx.rect(0, c + r * 0.25, w, w);
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = '#c7a6ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c, c, r + 0.5, -Math.PI / 2, -Math.PI / 2 + clock.yearProgress * TAU);
        ctx.stroke();
    }
}
