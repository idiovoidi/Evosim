/** Tiny DOM builder: h('div.card', { onclick }, child, 'text') */
export function h(selector, props = {}, ...children) {
    const [tag, ...classes] = selector.split('.');
    const el = document.createElement(tag || 'div');
    if (classes.length) el.className = classes.join(' ');
    for (const [key, value] of Object.entries(props ?? {})) {
        if (value === undefined || value === null) continue;
        if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
        else if (key === 'html') el.innerHTML = value;
        else if (key === 'style') Object.assign(el.style, value);
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else el.setAttribute(key, value);
    }
    for (const child of children.flat()) {
        if (child === null || child === undefined || child === false) continue;
        el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
}

export function $(id) {
    return document.getElementById(id);
}

/** Size a canvas's backing store to its CSS box at device pixel ratio; returns the 2D context. */
export function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: canvas.clientWidth, height: canvas.clientHeight };
}

export function formatDuration(seconds) {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    if (m < 1) return `${s}s`;
    if (m < 60) return `${m}m ${s % 60}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatNumber(n) {
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    return String(Math.round(n));
}
