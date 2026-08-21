// Picks an initial quality tier from coarse device signals, then keeps
// watching real frame times and demotes the tier if the device can't keep up.
// Systems read `tier` / `settings` once at construction and again whenever
// `onChange` fires (a demotion rebuilds particle counts, not per-frame cost).

const TIERS = {
  high: {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    coronaCount: 9000,
    sparkCount: 1400,
    starCount: 6000,
    coreDetail: 22,
    bloom: true,
    bloomRes: 1,
  },
  medium: {
    dpr: Math.min(window.devicePixelRatio || 1, 1.6),
    coronaCount: 4500,
    sparkCount: 800,
    starCount: 3200,
    coreDetail: 16,
    bloom: true,
    bloomRes: 0.6,
  },
  low: {
    dpr: 1,
    coronaCount: 1800,
    sparkCount: 350,
    starCount: 1500,
    coreDetail: 13,
    bloom: false,
    bloomRes: 0.5,
  },
};

function detectInitialTier() {
  const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;

  if (!isMobile && cores >= 8 && mem >= 6) return "high";
  if (isMobile && (cores <= 4 || mem <= 3)) return "low";
  if (isMobile) return "medium";
  if (cores <= 4) return "medium";
  return "high";
}

export class PerformanceManager {
  constructor(onChange) {
    this.onChange = onChange;
    this.tierName = detectInitialTier();
    this.settings = TIERS[this.tierName];

    this._frameTimes = [];
    this._sinceStart = 0;
    this._settled = false;
    this._demotions = 0;
  }

  get dpr() {
    return this.settings.dpr;
  }

  sample(dt, elapsed) {
    this._sinceStart = elapsed;
    // Ignore the first couple seconds: shader compiles + texture warm-up
    // spike frame time and shouldn't count against the device.
    if (elapsed < 2.5) return;

    this._frameTimes.push(dt);
    if (this._frameTimes.length > 90) this._frameTimes.shift();
    if (this._frameTimes.length < 60) return;

    const avg = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
    const avgFps = 1 / avg;

    if (avgFps < 40 && this._demotions < 2) {
      this._demote();
      this._frameTimes.length = 0;
    }
  }

  _demote() {
    const order = ["high", "medium", "low"];
    const idx = order.indexOf(this.tierName);
    if (idx < order.length - 1) {
      this.tierName = order[idx + 1];
      this.settings = TIERS[this.tierName];
      this._demotions++;
      this.onChange && this.onChange(this.tierName, this.settings);
    }
  }
}
