const DRAG_THRESHOLD = 4;
const PAN_SPEED = 700;
const ZOOM_STEP = 1.25;

/**
 * Translates raw pointer/keyboard input into camera moves and App actions.
 * Holds no simulation knowledge; everything goes through injected callbacks.
 */
export class InputController {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {() => import('../render/Camera.js').Camera} getCamera
     * @param {object} actions   App callbacks
     * @param {() => boolean} isBlocked  true while a modal owns the keyboard
     */
    constructor(canvas, getCamera, actions, isBlocked) {
        this.canvas = canvas;
        this.getCamera = getCamera;
        this.actions = actions;
        this.isBlocked = isBlocked;
        this.pointer = { x: -1, y: -1, overCanvas: false, dragging: false };
        this.drag = null;
        this.keys = new Set();
        this.listeners = [];

        this.listen(canvas, 'pointerdown', (e) => this.onPointerDown(e));
        this.listen(window, 'pointermove', (e) => this.onPointerMove(e));
        this.listen(window, 'pointerup', (e) => this.onPointerUp(e));
        this.listen(canvas, 'pointerenter', () => { this.pointer.overCanvas = true; });
        this.listen(canvas, 'pointerleave', () => { this.pointer.overCanvas = false; });
        this.listen(canvas, 'wheel', (e) => this.onWheel(e), { passive: false });
        this.listen(canvas, 'dblclick', (e) => actions.followAt(e.clientX, e.clientY));
        this.listen(canvas, 'contextmenu', (e) => e.preventDefault());
        this.listen(window, 'keydown', (e) => this.onKeyDown(e));
        this.listen(window, 'keyup', (e) => this.keys.delete(e.code));
        this.listen(window, 'blur', () => this.keys.clear());
    }

    listen(target, type, fn, options) {
        target.addEventListener(type, fn, options);
        this.listeners.push(() => target.removeEventListener(type, fn, options));
    }

    onPointerDown(e) {
        if (e.button !== 0 && e.button !== 1) return;
        this.drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
        this.canvas.setPointerCapture(e.pointerId);
    }

    onPointerMove(e) {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
        const d = this.drag;
        if (d) {
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
                d.moved = true;
                this.pointer.dragging = true;
                this.canvas.classList.add('dragging');
            }
            if (d.moved) {
                this.getCamera().panBy(dx, dy);
                d.x = e.clientX;
                d.y = e.clientY;
            }
        } else if (this.pointer.overCanvas) {
            this.actions.hoverAt(e.clientX, e.clientY);
        }
    }

    onPointerUp(e) {
        const d = this.drag;
        if (!d) return;
        this.drag = null;
        this.pointer.dragging = false;
        this.canvas.classList.remove('dragging');
        if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
        if (!d.moved) this.actions.selectAt(e.clientX, e.clientY);
    }

    onWheel(e) {
        e.preventDefault();
        const scale = e.deltaMode === 1 ? 16 : 1;
        const factor = Math.exp(-e.deltaY * scale * 0.0015);
        this.getCamera().zoomAt(factor, e.clientX, e.clientY);
    }

    onKeyDown(e) {
        const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
        if (e.key === 'Escape') {
            this.actions.escape();
            return;
        }
        if (typing || this.isBlocked()) return;
        const a = this.actions;
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.code === 'KeyS') {
            e.preventDefault();
            a.save();
            return;
        }
        if (ctrl && e.code === 'KeyO') {
            e.preventDefault();
            a.load();
            return;
        }
        if (ctrl || e.altKey) return;

        this.keys.add(e.code);
        const digit = /^Digit([1-9])$/.exec(e.code);
        if (digit) {
            a.setSpeedIndex(Number(digit[1]) - 1);
            return;
        }
        const handlers = {
            Space: a.togglePause,
            KeyF: a.toggleFollow,
            KeyN: a.openNewWorld,
            KeyV: a.toggleViewMenu,
            KeyL: () => a.toggleOption('lighting'),
            KeyG: () => a.toggleOption('vegetation'),
            KeyT: () => a.toggleOption('trails'),
            KeyR: () => a.toggleOption('senses'),
            Equal: () => this.zoomCentre(ZOOM_STEP),
            NumpadAdd: () => this.zoomCentre(ZOOM_STEP),
            Minus: () => this.zoomCentre(1 / ZOOM_STEP),
            NumpadSubtract: () => this.zoomCentre(1 / ZOOM_STEP),
        };
        if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
            a.openHelp();
            return;
        }
        const fn = handlers[e.code];
        if (fn) {
            e.preventDefault();
            fn();
        }
    }

    zoomCentre(factor) {
        const cam = this.getCamera();
        cam.zoomAt(factor, cam.viewWidth / 2, cam.viewHeight / 2);
    }

    /** Continuous keyboard panning; call once per frame. */
    update(dt) {
        if (this.isBlocked()) return;
        let dx = 0;
        let dy = 0;
        if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx += 1;
        if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx -= 1;
        if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy += 1;
        if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy -= 1;
        if (dx || dy) {
            const len = Math.hypot(dx, dy);
            this.getCamera().panBy((dx / len) * PAN_SPEED * dt, (dy / len) * PAN_SPEED * dt);
        }
    }

    dispose() {
        for (const off of this.listeners) off();
        this.listeners = [];
    }
}
