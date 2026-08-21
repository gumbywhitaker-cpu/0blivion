// Central "power level" of the reactor. Every visual system reads `value`
// (and the finer-grained fields) instead of computing its own brightness —
// this is the single hook a future audio-reactive layer would drive too.
export class IntensityManager {
  constructor() {
    this.idle = 0.5;      // slow breathing component, 0..1
    this.surge = 0;       // transient spike from interaction, 0..1+
    this.value = 0.5;     // idle + surge, clamped, what everyone reads
    this.shake = 0;       // camera-shake amplitude driven by surge attacks
    this._surgeVelocity = 0;
  }

  triggerSurge(strength = 1) {
    this.surge = Math.min(this.surge + strength, 2.2);
    this.shake = Math.min(this.shake + strength * 0.6, 1);
  }

  update(dt, elapsed) {
    this.idle = 0.5 + Math.sin(elapsed * 0.35) * 0.14 + Math.sin(elapsed * 0.9 + 1.7) * 0.05;

    // Fast attack already happened at trigger time; here we just decay.
    const decay = Math.exp(-dt * 1.6);
    this.surge *= decay;
    this.shake *= Math.exp(-dt * 3.2);

    this.value = this.idle + this.surge;
  }
}
