export const TAU = Math.PI * 2;

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
};
export const inverseLerp = (a, b, v) => (v - a) / (b - a);

export const length = (x, y) => Math.sqrt(x * x + y * y);
export const distSq = (ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
};

/** Shortest signed difference between two angles. */
export function angleDelta(from, to) {
    let d = (to - from) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
}

/** Mutable 2D vector used for steering accumulation to avoid allocations. */
export class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(x, y, scale = 1) {
        this.x += x * scale;
        this.y += y * scale;
        return this;
    }

    scale(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    limit(max) {
        const lenSq = this.x * this.x + this.y * this.y;
        if (lenSq > max * max) {
            const s = max / Math.sqrt(lenSq);
            this.x *= s;
            this.y *= s;
        }
        return this;
    }

    normalize() {
        const len = this.length();
        if (len > 1e-9) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }
}
