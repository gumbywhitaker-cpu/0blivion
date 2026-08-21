import * as THREE from "three";

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aPhase;
  attribute float aTwinkleSpeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vBrightness;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float twinkle = 0.65 + 0.35 * sin(uTime * aTwinkleSpeed + aPhase);
    vBrightness = aBrightness * twinkle;

    gl_Position = projectionMatrix * mvPosition;
    float dist = max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(aSize * uPixelRatio * (300.0 / dist), 0.3, 24.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vBrightness;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.0, d) * 0.6;
    float alpha = pow(core, 1.6) + glow * 0.15;

    vec3 color = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.98, 0.92), vBrightness);
    gl_FragColor = vec4(color, alpha * vBrightness);
  }
`;

export class Starfield {
  constructor(count) {
    this.group = new THREE.Group();
    this._build(count);
  }

  _build(count) {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    const phase = new Float32Array(count);
    const twinkleSpeed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute on a large shell so stars never visibly parallax past
      // the core, with slight radius jitter to avoid a flat-sphere look.
      const r = 45 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.lerp(-1, 1, Math.random()));

      const i3 = i * 3;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      sizes[i] = Math.random() * Math.random() * 2.4 + 0.35;
      brightness[i] = 0.35 + Math.random() * 0.65;
      phase[i] = Math.random() * Math.PI * 2;
      twinkleSpeed[i] = 0.15 + Math.random() * 0.9;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute("aTwinkleSpeed", new THREE.BufferAttribute(twinkleSpeed, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.group.add(this.points);
  }

  update(dt, elapsed) {
    this.material.uniforms.uTime.value = elapsed;
    // Extremely slow drift, as if the whole field is very gently rotating.
    this.group.rotation.y += dt * 0.0025;
    this.group.rotation.x += dt * 0.0009;
  }

  setPixelRatio(dpr) {
    this.material.uniforms.uPixelRatio.value = dpr;
  }
}
