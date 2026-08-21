// Unifies mouse, touch and pen input on top of Pointer Events.
//
// - Pointer position (relative to viewport center) drives camera parallax
//   and feeds a uMouse uniform into the particle systems, for both mouse
//   hover (desktop) and finger drag (touch) — one code path for both.
// - Wheel (desktop) and two-finger pinch (touch) drive zoom.
// - A short, low-movement press/click is treated as a "tap" and reported
//   separately so the caller can raycast it against the core for a surge.
const TAP_MAX_MOVE = 14; // px
const TAP_MAX_MS = 500;

export class InteractionManager {
  constructor(domElement, { onTap } = {}) {
    this.dom = domElement;
    this.onTap = onTap || (() => {});

    this.ndc = { x: 0, y: 0 };      // smoothed-by-consumer target, [-1, 1]
    this.zoomDelta = 0;             // accumulated per frame, consumed then reset

    this._pointers = new Map();
    this._pinchDist = null;
    this._downInfo = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onWheel = this._onWheel.bind(this);

    domElement.addEventListener("pointerdown", this._onPointerDown, { passive: true });
    window.addEventListener("pointermove", this._onPointerMove, { passive: true });
    window.addEventListener("pointerup", this._onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this._onPointerUp, { passive: true });
    domElement.addEventListener("wheel", this._onWheel, { passive: true });
  }

  _updateNdcFromClient(x, y) {
    this.ndc.x = (x / window.innerWidth) * 2 - 1;
    this.ndc.y = -((y / window.innerHeight) * 2 - 1);
  }

  _onPointerDown(e) {
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this._pointers.size === 1) {
      this._downInfo = { x: e.clientX, y: e.clientY, t: performance.now() };
    } else {
      this._downInfo = null; // multi-touch: no longer a tap candidate
    }

    if (this._pointers.size === 2) {
      this._pinchDist = this._currentPinchDistance();
    }
  }

  _onPointerMove(e) {
    if (this._pointers.has(e.pointerId)) {
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (this._pointers.size === 2) {
      const d = this._currentPinchDistance();
      if (this._pinchDist != null) {
        this.zoomDelta += (this._pinchDist - d) * 0.012;
      }
      this._pinchDist = d;
      return;
    }

    this._updateNdcFromClient(e.clientX, e.clientY);
  }

  _onPointerUp(e) {
    if (this._downInfo && this._pointers.size === 1) {
      const dx = e.clientX - this._downInfo.x;
      const dy = e.clientY - this._downInfo.y;
      const dist = Math.hypot(dx, dy);
      const dt = performance.now() - this._downInfo.t;

      if (dist < TAP_MAX_MOVE && dt < TAP_MAX_MS) {
        this._updateNdcFromClient(e.clientX, e.clientY);
        this.onTap(this.ndc.x, this.ndc.y);
      }
    }

    this._pointers.delete(e.pointerId);
    if (this._pointers.size < 2) this._pinchDist = null;
    if (this._pointers.size === 0) this._downInfo = null;
  }

  _onWheel(e) {
    this.zoomDelta += e.deltaY * 0.0022;
  }

  _currentPinchDistance() {
    const pts = [...this._pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  // Called once per frame by the app; returns and clears the accumulated zoom.
  consumeZoom() {
    const z = this.zoomDelta;
    this.zoomDelta = 0;
    return z;
  }

  dispose() {
    this.dom.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("pointercancel", this._onPointerUp);
    this.dom.removeEventListener("wheel", this._onWheel);
  }
}
