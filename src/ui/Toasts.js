import { $, h } from './dom.js';

const MAX_VISIBLE = 4;
const LIFETIME_MS = 5200;

/** Transient notifications fed by the simulation's 'notice' events and app messages. */
export class Toasts {
    constructor() {
        this.root = $('toasts');
        this.unsubscribe = null;
    }

    bind(events) {
        this.unsubscribe?.();
        this.unsubscribe = events.on('notice', (n) => this.push(n.text, n.level));
    }

    push(text, level = 'info') {
        const el = h(`div.toast.${level}`, {}, h('span.pip'), h('span', {}, text));
        this.root.prepend(el);
        while (this.root.children.length > MAX_VISIBLE) this.root.lastElementChild.remove();
        setTimeout(() => {
            el.classList.add('leaving');
            el.addEventListener('animationend', () => el.remove(), { once: true });
        }, LIFETIME_MS);
    }

    dispose() {
        this.unsubscribe?.();
    }
}
