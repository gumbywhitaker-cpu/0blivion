import * as THREE from "three";
import { sparkVertexShader, sparkFragmentShader } from "../shaders/sparks.js";

export class Sparks {
  constructor(count) {
    this._build(count);
  }

  _build(count) {
    const dir = new Float32Array(count * 3);
    const curlAxis = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const lifeSpeed = new Float32Array(count);
    const type = new Float32Array(count);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const d = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      const i3 = i * 3;
      dir[i3] = d.x;
      dir[i3 + 1] = d.y;
      dir[i3 + 2] = d.z;

      const axis = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      curlAxis[i3] = axis.x;
      curlAxis[i3 + 1] = axis.y;
      curlAxis[i3 + 2] = axis.z;

      seed[i] = Math.random();

      // Roughly: 45% dust, 40% sparks, 15% bright plasma balls.
      const roll = Math.random();
      const t = roll < 0.45 ? Math.random() * 0.2 : roll < 0.85 ? 0.3 + Math.random() * 0.35 : 0.8 + Math.random() * 0.2;
      type[i] = t;

      lifeSpeed[i] = t > 0.75 ? 0.09 + Math.random() * 0.06 : t > 0.25 ? 0.16 + Math.random() * 0.14 : 0.06 + Math.random() * 0.05;
      size[i] = t > 0.75 ? 4.5 + Math.random() * 3.5 : t > 0.25 ? 1.6 + Math.random() * 2.4 : 0.8 + Math.random() * 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    geometry.setAttribute("aCurlAxis", new THREE.BufferAttribute(curlAxis, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geometry.setAttribute("aLifeSpeed", new THREE.BufferAttribute(lifeSpeed, 1));
    geometry.setAttribute("aType", new THREE.BufferAttribute(type, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("position", new THREE.BufferAttribute(dir.slice(), 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: sparkVertexShader,
      fragmentShader: sparkFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0.5 },
        uSurge: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  update(dt, elapsed, energy, surge) {
    const u = this.material.uniforms;
    u.uTime.value = elapsed;
    u.uEnergy.value = energy;
    u.uSurge.value = surge;
  }

  setPixelRatio(dpr) {
    this.material.uniforms.uPixelRatio.value = dpr;
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
