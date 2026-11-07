import { clamp } from './math.js';

export function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToCss([r, g, b], a = 1) {
    return a >= 1
        ? `rgb(${r | 0},${g | 0},${b | 0})`
        : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}

export function mixRgb(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function scaleRgb(c, s) {
    return [clamp(c[0] * s, 0, 255), clamp(c[1] * s, 0, 255), clamp(c[2] * s, 0, 255)];
}

export function hsl(h, s, l, a = 1) {
    return a >= 1 ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`;
}
