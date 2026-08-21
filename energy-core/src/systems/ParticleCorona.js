import * as THREE from "three";
import { coronaVertexShader, coronaFragmentShader } from "../shaders/corona.js";

export class ParticleCorona {
  constructor(count) {
    this.count = count;
    this._build(count);
  }

  _build(count) {
    const basePos = new Float32Array(count * 3);
    const axis = new Float32Array(count * 3);
    const orbitSpeed = new Float32Array(count);
    const seed = new Float32Array(count);
    const burstSpeed = new Float32Array(count);
    const size = new Float32Array(count);
    const colorT = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Flattened, irregular shell (corona-like) rather than a perfect
      // uniform sphere: bias sample density toward the "equator".
      const flat = 0.55;
      let cosPhi = THREE.MathUtils.lerp(-1, 1, Math.random());
      cosPhi = Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), 1 + flat * 2);
      const phi = Math.acos(THREE.MathUtils.clamp(cosPhi, -1, 1));
      const theta = Math.random() * Math.PI * 2;
      const r = 1.3 + Math.pow(Math.random(), 0.6) * 1.5;

      const i3 = i * 3;
      basePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      basePos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      basePos[i3 + 2] = r * Math.cos(phi);

      const a = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      axis[i3] = a.x;
      axis[i3 + 1] = a.y;
      axis[i3 + 2] = a.z;

      orbitSpeed[i] = (Math.random() < 0.5 ? -1 : 1) * (0.06 + Math.random() * 0.22);
      seed[i] = Math.random();
      burstSpeed[i] = 0.02 + Math.random() * 0.07;
      size[i] = Math.random() * Math.random() * 2.4 + 0.6;
      colorT[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("aBasePos", new THREE.BufferAttribute(basePos, 3));
    geometry.setAttribute("aAxis", new THREE.BufferAttribute(axis, 3));
    geometry.setAttribute("aOrbitSpeed", new THREE.BufferAttribute(orbitSpeed, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geometry.setAttribute("aBurstSpeed", new THREE.BufferAttribute(burstSpeed, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("aColorT", new THREE.BufferAttribute(colorT, 1));
    // Position is required by BufferGeometry/THREE.Points but unused by the
    // shader (aBasePos drives everything) — reuse basePos to satisfy it.
    geometry.setAttribute("position", new THREE.BufferAttribute(basePos.slice(), 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0.5 },
        uSurge: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  update(dt, elapsed, energy, surge, mouseNdc) {
    const u = this.material.uniforms;
    u.uTime.value = elapsed;
    u.uEnergy.value = energy;
    u.uSurge.value = surge;
    u.uMouse.value.set(mouseNdc.x, mouseNdc.y);
  }

  setPixelRatio(dpr) {
    this.material.uniforms.uPixelRatio.value = dpr;
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
