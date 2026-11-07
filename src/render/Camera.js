import { clamp, lerp } from '../utils/math.js';

/** 2D camera: world-space centre plus zoom, with smooth follow and zoom easing. */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.viewWidth = 1;
        this.viewHeight = 1;
        this.worldWidth = 1;
        this.worldHeight = 1;
        this.minZoom = 0.2;
        this.maxZoom = 5;
        this.follow = null;
        this.zoomAnchor = null;
    }

    setViewport(width, height) {
        this.viewWidth = width;
        this.viewHeight = height;
        this.minZoom = Math.min(width / this.worldWidth, height / this.worldHeight) * 0.9;
    }

    setWorld(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        this.setViewport(this.viewWidth, this.viewHeight);
    }

    fitWorld() {
        this.x = this.worldWidth / 2;
        this.y = this.worldHeight / 2;
        this.zoom = this.targetZoom = Math.min(this.viewWidth / this.worldWidth, this.viewHeight / this.worldHeight) * 1.05;
        this.clampPosition();
    }

    screenToWorld(sx, sy, out = {}) {
        out.x = (sx - this.viewWidth / 2) / this.zoom + this.x;
        out.y = (sy - this.viewHeight / 2) / this.zoom + this.y;
        return out;
    }

    worldToScreen(wx, wy, out = {}) {
        out.x = (wx - this.x) * this.zoom + this.viewWidth / 2;
        out.y = (wy - this.y) * this.zoom + this.viewHeight / 2;
        return out;
    }

    /** Visible world rectangle, padded by `margin` world units. */
    bounds(margin = 0) {
        const hw = this.viewWidth / 2 / this.zoom + margin;
        const hh = this.viewHeight / 2 / this.zoom + margin;
        return { left: this.x - hw, top: this.y - hh, right: this.x + hw, bottom: this.y + hh };
    }

    panBy(dxScreen, dyScreen) {
        this.follow = null;
        this.x -= dxScreen / this.zoom;
        this.y -= dyScreen / this.zoom;
        this.clampPosition();
    }

    /** Zoom by `factor`, keeping the world point under the screen anchor fixed. */
    zoomAt(factor, sx, sy) {
        this.targetZoom = clamp(this.targetZoom * factor, this.minZoom, this.maxZoom);
        this.zoomAnchor = { sx, sy };
    }

    update(dt) {
        if (this.follow) {
            if (!this.follow.alive) {
                this.follow = null;
            } else {
                const k = 1 - Math.exp(-dt * 6);
                this.x = lerp(this.x, this.follow.x, k);
                this.y = lerp(this.y, this.follow.y, k);
            }
        }
        if (Math.abs(this.targetZoom - this.zoom) > 1e-4) {
            const anchor = this.zoomAnchor ?? { sx: this.viewWidth / 2, sy: this.viewHeight / 2 };
            const before = this.screenToWorld(anchor.sx, anchor.sy);
            this.zoom = lerp(this.zoom, this.targetZoom, 1 - Math.exp(-dt * 14));
            if (!this.follow) {
                const after = this.screenToWorld(anchor.sx, anchor.sy);
                this.x += before.x - after.x;
                this.y += before.y - after.y;
            }
        } else {
            this.zoomAnchor = null;
        }
        this.clampPosition();
    }

    clampPosition() {
        const hw = this.viewWidth / 2 / this.zoom;
        const hh = this.viewHeight / 2 / this.zoom;
        const pad = 80;
        this.x = this.worldWidth + pad * 2 < hw * 2 ? this.worldWidth / 2 : clamp(this.x, hw - pad, this.worldWidth - hw + pad);
        this.y = this.worldHeight + pad * 2 < hh * 2 ? this.worldHeight / 2 : clamp(this.y, hh - pad, this.worldHeight - hh + pad);
    }

    /** Apply the world transform to a 2D context (with device pixel ratio). */
    apply(ctx, dpr) {
        const s = this.zoom * dpr;
        ctx.setTransform(s, 0, 0, s, (this.viewWidth / 2 - this.x * this.zoom) * dpr, (this.viewHeight / 2 - this.y * this.zoom) * dpr);
    }
}
