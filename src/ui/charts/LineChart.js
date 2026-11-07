import { fitCanvas } from '../dom.js';

/**
 * Canvas line chart with soft area fills, auto-scaled y axis and a hover
 * readout. Series: [{ label, color, values: number[] }] sharing one x axis.
 */
export class LineChart {
    constructor(canvas, { fill = true, yFormat = (v) => Math.round(v), xFormat = null } = {}) {
        this.canvas = canvas;
        this.fill = fill;
        this.yFormat = yFormat;
        this.xFormat = xFormat;
        this.series = [];
        this.xs = [];
        this.hoverX = null;
        this.fixedRange = null;
        canvas.addEventListener('pointermove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.hoverX = (e.clientX - rect.left) / rect.width;
            this.draw();
        });
        canvas.addEventListener('pointerleave', () => {
            this.hoverX = null;
            this.draw();
        });
    }

    setData(xs, series, range = null) {
        this.xs = xs;
        this.series = series;
        this.fixedRange = range;
        this.draw();
    }

    draw() {
        const { ctx, width, height } = fitCanvas(this.canvas);
        ctx.clearRect(0, 0, width, height);
        const pad = { l: 30, r: 6, t: 8, b: 16 };
        const w = width - pad.l - pad.r;
        const h = height - pad.t - pad.b;
        const n = this.xs.length;

        let max = -Infinity;
        let min = Infinity;
        for (const s of this.series) {
            for (const v of s.values) {
                if (v === null || v === undefined) continue;
                if (v > max) max = v;
                if (v < min) min = v;
            }
        }
        if (this.fixedRange) [min, max] = this.fixedRange;
        if (!Number.isFinite(max)) {
            max = 1;
            min = 0;
        }
        if (!this.fixedRange) {
            min = Math.min(0, min);
            max = niceCeil(max * 1.08);
        }
        if (max - min < 1e-6) max = min + 1;

        ctx.font = '10px Inter, Segoe UI, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const v = min + ((max - min) * i) / 4;
            const y = pad.t + h - (h * i) / 4;
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.moveTo(pad.l, y);
            ctx.lineTo(pad.l + w, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,225,0.55)';
            ctx.fillText(this.yFormat(v), pad.l - 5, y);
        }
        if (n < 2) return;

        const xAt = (i) => pad.l + (w * i) / (n - 1);
        const yAt = (v) => pad.t + h - ((v - min) / (max - min)) * h;

        for (const s of this.series) {
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < n; i++) {
                const v = s.values[i];
                if (v === null || v === undefined) {
                    started = false;
                    continue;
                }
                if (!started) {
                    ctx.moveTo(xAt(i), yAt(v));
                    started = true;
                } else ctx.lineTo(xAt(i), yAt(v));
            }
            if (this.fill) {
                ctx.save();
                ctx.lineTo(xAt(n - 1), pad.t + h);
                ctx.lineTo(xAt(0), pad.t + h);
                ctx.closePath();
                const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
                g.addColorStop(0, withAlpha(s.color, 0.22));
                g.addColorStop(1, withAlpha(s.color, 0));
                ctx.fillStyle = g;
                ctx.fill();
                ctx.restore();
                ctx.beginPath();
                started = false;
                for (let i = 0; i < n; i++) {
                    const v = s.values[i];
                    if (v === null || v === undefined) {
                        started = false;
                        continue;
                    }
                    if (!started) {
                        ctx.moveTo(xAt(i), yAt(v));
                        started = true;
                    } else ctx.lineTo(xAt(i), yAt(v));
                }
            }
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 1.6;
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        if (this.hoverX !== null) {
            const i = Math.round(((this.hoverX * width - pad.l) / w) * (n - 1));
            if (i >= 0 && i < n) {
                const x = xAt(i);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(x, pad.t);
                ctx.lineTo(x, pad.t + h);
                ctx.stroke();
                const lines = this.series
                    .filter((s) => s.values[i] !== null && s.values[i] !== undefined)
                    .map((s) => ({ color: s.color, text: `${s.label}: ${this.yFormat(s.values[i])}` }));
                if (this.xFormat) lines.unshift({ color: '#fff', text: this.xFormat(this.xs[i]) });
                const boxW = Math.max(...lines.map((l) => ctx.measureText(l.text).width)) + 22;
                const boxH = lines.length * 14 + 8;
                const bx = x + boxW + 8 > width ? x - boxW - 8 : x + 8;
                ctx.fillStyle = 'rgba(6,14,24,0.92)';
                roundRect(ctx, bx, pad.t, boxW, boxH, 6);
                ctx.fill();
                ctx.textAlign = 'left';
                lines.forEach((l, k) => {
                    ctx.fillStyle = l.color;
                    ctx.fillRect(bx + 7, pad.t + 9 + k * 14, 6, 6);
                    ctx.fillStyle = '#e8eef5';
                    ctx.fillText(l.text, bx + 17, pad.t + 12 + k * 14);
                });
            }
        }
    }
}

export function drawSparkline(canvas, values, color) {
    const { ctx, width, height } = fitCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    if (values.length < 2) return;
    const max = Math.max(1, ...values);
    ctx.beginPath();
    values.forEach((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - 2 - (v / max) * (height - 4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = withAlpha(color, 0.14);
    ctx.fill();
}

function withAlpha(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function niceCeil(v) {
    if (v <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / exp;
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nice * exp;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
