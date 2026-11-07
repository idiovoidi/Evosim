import { RenderError } from '../errors/EvosimError.js';
import { decorate, guarded, timed } from '../utils/decorators.js';
import { Random } from '../utils/random.js';
import { context2d } from './canvas.js';
import { Camera } from './Camera.js';
import { TerrainPainter } from './terrain/TerrainPainter.js';
import { VegetationLayer } from './layers/VegetationLayer.js';
import { CreatureArtist, SPECIES_COLORS } from './layers/CreatureArtist.js';
import { ParticleLayer } from './layers/ParticleLayer.js';
import { LightingLayer } from './layers/LightingLayer.js';
import { OverlayLayer } from './layers/OverlayLayer.js';

const DOT_ZOOM = 0.42;

/**
 * Draws the world in layers:
 *   ground > vegetation > fish > water shimmer > corpses > walkers > canopy >
 *   flyer shadows > flyers > particles > eye-shine > overlays > atmosphere
 */
export class Renderer {
    constructor(canvas, { profiler = null, options } = {}) {
        this.canvas = canvas;
        this.ctx = context2d(canvas, { alpha: false });
        this.profiler = profiler;
        this.camera = new Camera();
        this.artist = new CreatureArtist();
        this.lighting = new LightingLayer();
        this.overlay = new OverlayLayer();
        this.options = options;
        this.sim = null;
        this.layers = null;
        this.time = 0;
        this.selected = null;
        this.hovered = null;
        this.dpr = 1;
        this.buckets = { water: [], land: [], air: [] };
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.dpr = dpr;
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.camera.setViewport(w, h);
        this.lighting.resize(w, h);
    }

    /** Bake art for a new simulation; resolves when ready to draw. */
    async attach(sim, onProgress) {
        this.detach();
        const world = sim.world;
        const painter = new TerrainPainter(world.terrain, sim.seed);
        const baked = await painter.bake(onProgress);
        this.sim = sim;
        this.layers = {
            baked,
            vegetation: new VegetationLayer(world),
            particles: new ParticleLayer(sim.events, new Random(`${sim.seed}:fx`)),
        };
        this.layers.vegetation.refresh(Infinity);
        this.camera.setWorld(world.width, world.height);
        this.camera.fitWorld();
        this.selected = null;
        this.hovered = null;
    }

    detach() {
        this.layers?.particles.dispose();
        this.layers = null;
        this.sim = null;
    }

    get thumbnail() {
        return this.layers?.baked.thumbnail ?? null;
    }

    render(realDt, now) {
        if (!this.sim) return;
        const { ctx, camera, layers, options } = this;
        const world = this.sim.world;
        this.time += realDt;
        camera.update(realDt);
        layers.vegetation.refresh(now);
        layers.particles.update(realDt);
        this.overlay.update(realDt, this.selected);

        const w = camera.viewWidth;
        const h = camera.viewHeight;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.fillStyle = '#06121f';
        ctx.fillRect(0, 0, w, h);

        camera.apply(ctx, this.dpr);
        const bounds = camera.bounds(40);
        const { baked } = layers;
        const ww = world.terrain.cols * world.terrain.cellSize;
        const wh = world.terrain.rows * world.terrain.cellSize;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(baked.ground, 0, 0, baked.ground.width / baked.scale, baked.ground.height / baked.scale);
        if (options.vegetation) layers.vegetation.draw(ctx);

        this.bucketCreatures(world.creatures, bounds);
        const dots = camera.zoom < DOT_ZOOM;

        this.drawCreatures(this.buckets.water, dots);
        this.drawShimmer(ctx, baked, ww, wh, options.lighting ? world.clock.daylight : 1);

        for (const corpse of world.corpses) {
            if (corpse.x < bounds.left || corpse.x > bounds.right || corpse.y < bounds.top || corpse.y > bounds.bottom) continue;
            this.artist.drawCorpse(ctx, corpse);
        }
        this.drawCreatures(this.buckets.land, dots);
        ctx.drawImage(baked.canopy, 0, 0, baked.canopy.width / baked.scale, baked.canopy.height / baked.scale);

        if (!dots) for (const c of this.buckets.air) this.artist.drawAirShadow(ctx, c);
        this.drawCreatures(this.buckets.air, dots);

        layers.particles.emitAmbient(this.buckets.land, realDt, bounds);
        layers.particles.emitAmbient(this.buckets.water, realDt, bounds);
        layers.particles.draw(ctx);

        const daylight = options.lighting ? world.clock.daylight : 1;
        this.lighting.drawEyeShine(ctx, this.buckets.land, daylight, bounds);

        this.overlay.draw(ctx, {
            selected: this.selected,
            hovered: this.hovered,
            zoom: camera.zoom,
            time: this.time,
            options,
            senseOf: (c) => this.sim.brain.perception.senseRadius(c),
        });

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        if (options.lighting) this.lighting.drawAtmosphere(ctx, w, h, daylight);
    }

    bucketCreatures(creatures, bounds) {
        const b = this.buckets;
        b.water.length = 0;
        b.land.length = 0;
        b.air.length = 0;
        for (const c of creatures) {
            if (!c.alive || c.x < bounds.left || c.x > bounds.right || c.y < bounds.top || c.y > bounds.bottom) continue;
            b[c.species.habitat].push(c);
        }
    }

    drawCreatures(list, dots) {
        const ctx = this.ctx;
        if (dots) {
            const size = 2.6 / this.camera.zoom;
            for (const c of list) {
                ctx.fillStyle = SPECIES_COLORS[c.speciesId];
                ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size);
            }
            return;
        }
        for (const c of list) this.artist.draw(ctx, c, this.time);
    }

    drawShimmer(ctx, baked, ww, wh, daylight) {
        const [a, b] = baked.shimmer;
        const t = this.time;
        const drift = Math.sin(t * 0.3) * 6;
        const strength = 0.3 + 0.7 * daylight;
        ctx.globalAlpha = (0.45 + 0.45 * Math.sin(t * 0.9)) * strength;
        ctx.drawImage(a, drift, drift * 0.4, ww, wh);
        ctx.globalAlpha = (0.45 + 0.45 * Math.sin(t * 0.9 + Math.PI)) * strength;
        ctx.drawImage(b, -drift * 0.6, drift, ww, wh);
        ctx.globalAlpha = 1;
    }

    /** Creature nearest to a screen point (within a generous pick radius). */
    pick(sx, sy) {
        if (!this.sim) return null;
        const p = this.camera.screenToWorld(sx, sy);
        const radius = Math.max(14, 16 / this.camera.zoom);
        let best = null;
        let bestD2 = radius * radius;
        for (const c of this.sim.world.creatures) {
            if (!c.alive) continue;
            const dx = c.x - p.x;
            const dy = c.y - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) {
                best = c;
                bestD2 = d2;
            }
        }
        return best;
    }
}

decorate(Renderer, {
    render: [timed('render'), guarded(RenderError)],
    attach: [guarded(RenderError, { rethrow: true })],
});
