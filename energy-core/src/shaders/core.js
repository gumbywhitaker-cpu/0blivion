import { simplex3, fbm } from "./noise.js";

// The plasma shell: an icosphere whose surface is continuously displaced by
// layered noise (bulges / dents / energy waves), shaded with a white -> pale
// yellow -> gold -> orange -> deep orange ramp driven by that same noise,
// plus a second, faster noise field thresholded into branching "cracks".
export const coreVertexShader = /* glsl */ `
  ${simplex3}
  ${fbm(4)}

  uniform float uTime;
  uniform float uEnergy;
  uniform float uSurge;

  varying vec3 vNormalSmooth;
  varying vec3 vViewDir;
  varying float vDisp;
  varying vec3 vObjectPos;

  void main() {
    vec3 p = position;

    // Medium-speed procedural bulge/dent field (Layer 3).
    float n1 = fbm(p * 1.35 + vec3(0.0, 0.0, uTime * 0.14));
    // Faster, smaller-scale energy-wave ripple layered on top.
    float n2 = fbm(p * 3.2 + vec3(0.0, uTime * 0.33, uTime * -0.21));

    float disp = n1 * 0.55 + n2 * 0.22;
    float amp = 0.16 + uEnergy * 0.12 + uSurge * 0.10;

    vec3 displaced = p + normal * disp * amp;

    vDisp = n1;
    vObjectPos = displaced;

    // The rim/fresnel term reads the mathematically smooth base-sphere
    // normal rather than a displaced one: a per-triangle perturbed normal
    // is only piecewise-linear, and fresnel's steep grazing-angle falloff
    // turns that into visible faceting right at the silhouette. The base
    // normal keeps the limb glow perfectly round while vDisp still drives
    // all of the bulge/crack surface detail.
    vNormalSmooth = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const coreFragmentShader = /* glsl */ `
  ${simplex3}
  ${fbm(3)}

  uniform float uTime;
  uniform float uEnergy;
  uniform float uSurge;

  varying vec3 vNormalSmooth;
  varying vec3 vViewDir;
  varying float vDisp;
  varying vec3 vObjectPos;

  vec3 rampColor(float t) {
    vec3 white   = vec3(1.0, 0.98, 0.92);
    vec3 paleY   = vec3(1.0, 0.86, 0.55);
    vec3 gold    = vec3(1.0, 0.66, 0.18);
    vec3 orange  = vec3(0.95, 0.38, 0.06);
    vec3 deepOr  = vec3(0.55, 0.14, 0.02);

    float a = smoothstep(0.15, 0.75, t);
    float b = smoothstep(-0.15, 0.35, t);
    float c = smoothstep(-0.55, -0.05, t);

    vec3 col = mix(deepOr, orange, c);
    col = mix(col, gold, b);
    col = mix(col, paleY, a);
    col = mix(col, white, smoothstep(0.55, 1.0, t));
    return col;
  }

  void main() {
    vec3 N = normalize(vNormalSmooth);
    vec3 V = normalize(vViewDir);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

    // Base plasma colour from the displacement field, biased hotter by fresnel
    // (limb brightening, like looking at the rim of a star).
    float t = vDisp * 1.4 + fresnel * 0.6;
    vec3 base = rampColor(t);

    // Electrical / molten cracks: a fast, independent ridged-noise field
    // thresholded into thin branching bright lines (Layer 4).
    float crackField = fbm(vObjectPos * 5.5 + vec3(uTime * 0.55, -uTime * 0.42, uTime * 0.31));
    float ridge = 1.0 - abs(crackField);
    float crackSharp = 26.0 - uSurge * 10.0;
    float crack = pow(clamp(ridge, 0.0, 1.0), max(crackSharp, 6.0));

    float crackFast = fbm(vObjectPos * 9.0 + vec3(uTime * 1.6, uTime * -1.3, uTime * 0.9));
    float ridgeFast = 1.0 - abs(crackFast);
    float crackFastSharp = pow(clamp(ridgeFast, 0.0, 1.0), 22.0);

    float crackMix = clamp(crack * 1.4 + crackFastSharp * 0.6, 0.0, 1.6);
    float crackColorPick = fbm(vObjectPos * 2.0 - uTime * 0.1);
    vec3 crackColor = mix(vec3(1.0, 0.55, 0.12), vec3(1.0, 0.96, 0.78), smoothstep(-0.2, 0.4, crackColorPick));

    vec3 color = base + crackColor * crackMix * (0.55 + uEnergy * 0.4 + uSurge * 0.9);

    // Slow breathing pulse plus a very fast, subtle instability flicker.
    float flicker = 0.94 + 0.06 * sin(uTime * 9.0 + vDisp * 12.0);
    float brightness = (0.55 + uEnergy * 0.4 + uSurge * 0.4) * flicker;

    color *= brightness;
    color += base * fresnel * (0.3 + uSurge * 0.4);

    gl_FragColor = vec4(color, 1.0);
  }
`;
