/**
 * Comprehensive polyfills for Hermes engine (Expo SDK 54 / React Native 0.76)
 * Covers all commonly missing browser globals in the RN environment.
 * Import this as the FIRST line in index.js.
 */

// ─── DOMException ────────────────────────────────────────────────────────────
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message = '', name = 'DOMException') {
      super(message);
      this.name = name;
      this.code = 0;
    }
  };
}

// ─── DOMRect ─────────────────────────────────────────────────────────────────
if (typeof global.DOMRect === 'undefined') {
  global.DOMRect = class DOMRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    get top() { return this.y; }
    get left() { return this.x; }
    get bottom() { return this.y + this.height; }
    get right() { return this.x + this.width; }
    static fromRect(other = {}) {
      return new DOMRect(other.x, other.y, other.width, other.height);
    }
    toJSON() {
      return {
        x: this.x, y: this.y,
        width: this.width, height: this.height,
        top: this.top, left: this.left,
        bottom: this.bottom, right: this.right,
      };
    }
  };
}

// ─── DOMRectReadOnly ─────────────────────────────────────────────────────────
if (typeof global.DOMRectReadOnly === 'undefined') {
  global.DOMRectReadOnly = global.DOMRect;
}

// ─── DOMPoint ────────────────────────────────────────────────────────────────
if (typeof global.DOMPoint === 'undefined') {
  global.DOMPoint = class DOMPoint {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
    static fromPoint(other = {}) {
      return new DOMPoint(other.x, other.y, other.z, other.w);
    }
  };
}

// ─── DOMMatrix ───────────────────────────────────────────────────────────────
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1;
      this.e = 0; this.f = 0;
      this.is2D = true;
      this.isIdentity = true;
    }
  };
}

// ─── AbortController / AbortSignal ───────────────────────────────────────────
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        reason: undefined,
        onabort: null,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {},
        throwIfAborted() {},
      };
    }
    abort(reason) {
      this.signal.aborted = true;
      this.signal.reason = reason;
      if (typeof this.signal.onabort === 'function') this.signal.onabort();
    }
  };
}

// ─── Event / CustomEvent ─────────────────────────────────────────────────────
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = options.bubbles || false;
      this.cancelable = options.cancelable || false;
      this.defaultPrevented = false;
    }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() {}
    stopImmediatePropagation() {}
  };
}

if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends global.Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail || null;
    }
  };
}

// ─── MutationObserver (stub) ──────────────────────────────────────────────────
if (typeof global.MutationObserver === 'undefined') {
  global.MutationObserver = class MutationObserver {
    constructor(callback) { this._callback = callback; }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

// ─── ResizeObserver (stub) ────────────────────────────────────────────────────
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) { this._callback = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ─── IntersectionObserver (stub) ─────────────────────────────────────────────
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) { this._callback = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

// ─── requestAnimationFrame / cancelAnimationFrame ────────────────────────────
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

// ─── queueMicrotask ──────────────────────────────────────────────────────────
if (typeof global.queueMicrotask === 'undefined') {
  global.queueMicrotask = (callback) => Promise.resolve().then(callback);
}

// ─── structuredClone ─────────────────────────────────────────────────────────
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
