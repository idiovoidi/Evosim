import { $, h } from './dom.js';

/** Single-slot modal host. Content builders return a DOM node. */
export class Modal {
    constructor() {
        this.root = $('modal-root');
        this.current = null;
        this.onClose = null;
    }

    get isOpen() {
        return this.current !== null;
    }

    open(content, { onClose } = {}) {
        this.close();
        this.onClose = onClose ?? null;
        const modal = h('div.modal.glass', { onclick: (e) => e.stopPropagation() }, content);
        this.current = h('div.modal-backdrop', { onclick: () => this.close() }, modal);
        this.root.append(this.current);
        modal.querySelector('input, button')?.focus();
    }

    close() {
        if (!this.current) return;
        this.current.remove();
        this.current = null;
        const cb = this.onClose;
        this.onClose = null;
        cb?.();
    }
}
