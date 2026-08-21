import { simplex3 } from "./noise.js";

// GPU-simulated corona: every particle's orbit, drift, pulse and occasional
// outward burst is computed purely from time + per-particle attributes, so
// thousands of particles cost one matrix-free rotation and a couple of
// noise taps each — no CPU-side per-particle bookkeeping.
export const coronaVertexShader = /* glsl */ `
  ${simplex3}

  attribute vec3 aBasePos;
  attribute vec3 aAxis;
  attribute float aOrbitSpeed;
  attribute float aSeed;
  attribute float aBurstSpeed;
  attribute float aSize;
  attribute float aColorT;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uSurge;
  uniform float uPixelRatio;
  uniform vec2 uMouse;

  varying float vColorT;
  varying float vBurst;
  varying float vFade;

  vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    vec3 axis = normalize(aAxis);
    float speedMul = 0.55 + uEnergy * 0.85;
    float angle = uTime * aOrbitSpeed * speedMul + aSeed * 6.2831;

    vec3 rotated = rotateAxis(aBasePos, axis, angle);

    float driftN = snoise(rotated * 0.6 + vec3(uTime * 0.08));
    vec3 drift = vec3(driftN, snoise(rotated * 0.6 + 31.0 + uTime * 0.07), snoise(rotated * 0.6 + 71.0 + uTime * 0.09));
    drift *= 0.12 * (0.4 + uEnergy * 0.8);

    float cycle = uTime * aBurstSpeed + aSeed * 41.0;
    float phase = fract(cycle);
    float window = 0.16;
    float burst = 0.0;
    if (phase < window) {
      float k = phase / window;
      burst = sin(k * 3.14159265);
    }
    vBurst = burst;

    float radiusPulse = 1.0 + 0.07 * sin(uTime * 1.3 + aSeed * 6.2831) + uSurge * 0.18;
    vec3 dir = normalize(rotated);
    float rad = length(rotated) * radiusPulse + burst * (0.5 + uEnergy * 0.8);

    vec3 pos = dir * rad + drift * 0.6;

    // Extremely subtle response to pointer position: nudges the whole field
    // a little, like a magnetic field reacting to something nearby.
    pos.xy += uMouse * 0.18;

    vColorT = aColorT;
    vFade = clamp(1.0 - (rad - 2.6) / 2.2, 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float sizeBoost = 1.0 + burst * 1.4 + uSurge * 0.5;
    float dist = max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(aSize * uPixelRatio * sizeBoost * (11.0 / dist), 1.0, 22.0);
  }
`;

export const coronaFragmentShader = /* glsl */ `
  varying float vColorT;
  varying float vBurst;
  varying float vFade;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float alpha = pow(smoothstep(0.5, 0.0, d), 1.5);

    vec3 white = vec3(1.0, 0.95, 0.85);
    vec3 gold = vec3(1.0, 0.68, 0.25);
    vec3 orange = vec3(0.95, 0.35, 0.08);

    vec3 color = mix(orange, gold, smoothstep(0.0, 0.55, vColorT));
    color = mix(color, white, smoothstep(0.55, 1.0, vColorT));
    color = mix(color, white, vBurst * 0.8);

    float intensity = (0.42 + vBurst * 0.9) * vFade;
    gl_FragColor = vec4(color * intensity, alpha * vFade * (0.5 + vBurst * 0.5));
  }
`;
