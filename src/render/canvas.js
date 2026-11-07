import { RenderError } from '../errors/EvosimError.js';

export function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));
    return canvas;
}

export function context2d(canvas, options) {
    const ctx = canvas.getContext('2d', options);
    if (!ctx) throw new RenderError('Canvas 2D context unavailable');
    return ctx;
}

export const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
