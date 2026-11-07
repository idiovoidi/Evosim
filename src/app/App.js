import { Simulation } from '../sim/Simulation.js';
import { Renderer } from '../render/Renderer.js';
import { Minimap } from '../render/Minimap.js';
import { nextFrame } from '../render/canvas.js';
import { HUD } from '../ui/HUD.js';
import { buildNewWorldDialog, buildHelpDialog, randomSeed } from '../ui/dialogs.js';
import { InputController } from '../input/InputController.js';
import { SaveManager } from './SaveManager.js';
import { EventBus } from '../utils/EventBus.js';
import { Profiler } from '../utils/Profiler.js';
import { setErrorReporter } from '../utils/decorators.js';
import { EvosimError, SimulationError } from '../errors/EvosimError.js';
import { $ } from '../ui/dom.js';

const SPEEDS = [0.5, 1, 2, 4, 8, 16];

/**
 * Composition root for the browser app: owns the current simulation and
 * wires renderer, HUD, input and persistence together through callbacks.
 */
export class App {
    constructor() {
        this.state = {
            paused: false,
            speed: 1,
            options: { lighting: true, vegetation: true, trails: true, senses: true },
        };
        this.sim = null;
        this.busy = false;
        this.profiler = new Profiler();
        this.saves = new SaveManager();
        this.fps = 60;
        this.lastFrame = performance.now();
        this.speciesCursor = new Map();

        this.canvas = $('world');
        this.renderer = new Renderer(this.canvas, { profiler: this.profiler, options: this.state.options });
        this.minimap = new Minimap($('minimap'), this.renderer);

        const actions = this.actions;
        this.hud = new HUD({ artist: this.renderer.artist, actions });
        this.input = new InputController(this.canvas, () => this.renderer.camera, actions, () => this.hud.modal.isOpen);

        setErrorReporter((error) => {
            console.error(error);
            this.hud.toasts.push(error.message, 'danger');
        });

        window.addEventListener('resize', () => this.renderer.resize());
        this.renderer.resize();
        this.frame = this.frame.bind(this);
    }

    buildActions() {
        return {
            speeds: SPEEDS,
            togglePause: () => { this.state.paused = !this.state.paused; },
            setSpeed: (s) => {
                this.state.speed = s;
                this.state.paused = false;
            },
            setSpeedIndex: (i) => SPEEDS[i] !== undefined && this.actions.setSpeed(SPEEDS[i]),
            toggleOption: (key) => { this.state.options[key] = !this.state.options[key]; },
            toggleViewMenu: () => this.hud.topBar.toggleViewMenu(),
            openNewWorld: () => this.openNewWorld(),
            openHelp: () => this.openHelp(),
            save: () => this.save(),
            load: () => this.load(),
            select: (c) => this.select(c),
            selectById: (id) => this.select(this.sim?.world.findById(id) ?? null),
            selectAt: (x, y) => this.select(this.renderer.pick(x, y)),
            hoverAt: (x, y) => { this.renderer.hovered = this.renderer.pick(x, y); },
            followAt: (x, y) => {
                const c = this.renderer.pick(x, y);
                if (!c) return;
                this.select(c);
                this.renderer.camera.follow = c;
            },
            toggleFollow: () => {
                const cam = this.renderer.camera;
                const sel = this.renderer.selected;
                cam.follow = cam.follow || !sel?.alive ? null : sel;
            },
            focusSpecies: (id) => this.focusSpecies(id),
            escape: () => {
                if (this.hud.modal.isOpen) this.hud.modal.close();
                else if (!$('view-menu').classList.contains('hidden')) this.hud.topBar.toggleViewMenu();
                else {
                    this.renderer.camera.follow = null;
                    this.select(null);
                }
            },
        };
    }

    get actions() {
        return this._actions ??= this.buildActions();
    }

    async start() {
        requestAnimationFrame(this.frame);
        const info = this.saves.info();
        if (info) {
            this.hud.showLoading('Restoring your saved world…', 0.05);
            await nextFrame();
            if (await this.load({ quiet: true })) return;
        }
        await this.newWorld({ seed: randomSeed() });
        if (!info) this.openHelp();
    }

    /** Replace the running simulation; `create` builds it synchronously. */
    async swap(create, label) {
        if (this.busy) return false;
        this.busy = true;
        this.hud.showLoading(label, 0.05);
        await nextFrame();
        await nextFrame();
        try {
            const sim = create(new EventBus());
            this.hud.showLoading('Painting terrain…', 0.3);
            await this.renderer.attach(sim, (p) => this.hud.showLoading('Painting terrain…', 0.3 + p * 0.7));
            this.sim?.dispose();
            this.sim = sim;
            this.hud.bind(sim);
            this.select(null);
            this.speciesCursor.clear();
            this.state.paused = false;
            return true;
        } catch (error) {
            if (!(error instanceof EvosimError)) this.hud.toasts.push(`Could not create world: ${error.message}`, 'danger');
            console.error(error);
            if (this.sim && this.renderer.sim !== this.sim) await this.renderer.attach(this.sim).catch(() => {});
            return false;
        } finally {
            this.busy = false;
            this.hud.hideLoading();
        }
    }

    newWorld({ seed, overrides = {} }) {
        return this.swap(
            (events) => new Simulation({ seed, overrides, events, profiler: this.profiler }).populate(),
            `Generating world “${seed}”…`,
        );
    }

    openNewWorld() {
        this.hud.modal.open(buildNewWorldDialog({
            seed: randomSeed(),
            overrides: this.sim?.overrides,
            onSubmit: ({ seed, overrides }) => {
                this.hud.modal.close();
                this.newWorld({ seed, overrides });
            },
            onCancel: () => this.hud.modal.close(),
        }));
    }

    openHelp() {
        this.hud.modal.open(buildHelpDialog({ onClose: () => this.hud.modal.close() }));
    }

    save() {
        if (!this.sim || this.busy) return;
        try {
            const bytes = this.saves.save(this.sim);
            this.hud.toasts.push(`World saved (${Math.round(bytes / 1024)} KB)`, 'success');
        } catch {
            // Reported by the SaveManager's guard.
        }
    }

    async load({ quiet = false } = {}) {
        if (!this.saves.hasSave()) {
            if (!quiet) this.hud.toasts.push('No saved world yet — press Ctrl+S to save one', 'warning');
            return false;
        }
        const ok = await this.swap(
            (events) => this.saves.load({ events, profiler: this.profiler }),
            'Restoring your saved world…',
        );
        if (ok) this.hud.toasts.push('Saved world restored', 'success');
        return ok;
    }

    select(c) {
        this.renderer.selected = c;
        if (!c && this.renderer.camera.follow) this.renderer.camera.follow = null;
        this.hud.inspector.show(c);
    }

    /** Cycle through the most evolved living members of a species. */
    focusSpecies(id) {
        if (!this.sim) return;
        const members = this.sim.world.creatures
            .filter((c) => c.alive && c.speciesId === id)
            .sort((a, b) => b.life.generation - a.life.generation || a.id - b.id);
        if (!members.length) {
            this.hud.toasts.push('None left alive', 'warning');
            return;
        }
        const i = (this.speciesCursor.get(id) ?? -1) + 1;
        this.speciesCursor.set(id, i % members.length);
        const c = members[i % members.length];
        this.select(c);
        const cam = this.renderer.camera;
        cam.follow = c;
        if (cam.targetZoom < 1.4) cam.zoomAt(1.4 / cam.targetZoom, cam.viewWidth / 2, cam.viewHeight / 2);
    }

    frame(now) {
        requestAnimationFrame(this.frame);
        const dt = Math.min((now - this.lastFrame) / 1000, 0.1);
        this.lastFrame = now;
        if (dt > 0) this.fps += (1 / dt - this.fps) * 0.05;

        this.input.update(dt);
        const sim = this.busy ? null : this.sim;
        if (sim && !this.state.paused) {
            try {
                sim.advance(dt, this.state.speed);
            } catch (error) {
                this.state.paused = true;
                if (!(error instanceof SimulationError)) this.hud.toasts.push(error.message, 'danger');
                this.hud.toasts.push('Simulation paused after an error', 'warning');
            }
        }
        if (sim) {
            this.renderer.render(dt, now);
            this.minimap.draw(now);
        }
        this.hud.update({
            sim,
            state: this.state,
            camera: this.renderer.camera,
            now,
            pointer: this.input.pointer,
            renderer: this.renderer,
            profiler: this.profiler,
            fps: this.fps,
        });
    }
}
