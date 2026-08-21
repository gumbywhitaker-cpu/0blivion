import * as THREE from "three";
import { coreVertexShader, coreFragmentShader } from "../shaders/core.js";
import { glowVertexShader, glowFragmentShader } from "../shaders/coreGlow.js";

export class EnergyCore {
  constructor(detail) {
    this.group = new THREE.Group();
    this._buildPlasma(detail);
    this._buildGlow();
  }

  _buildPlasma(detail) {
    const geometry = new THREE.IcosahedronGeometry(1.05, detail);

    this.plasmaMaterial = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0.5 },
        uSurge: { value: 0 },
      },
    });

    this.plasmaMesh = new THREE.Mesh(geometry, this.plasmaMaterial);
    this.group.add(this.plasmaMesh);
  }

  _buildGlow() {
    const geometry = new THREE.SphereGeometry(0.72, 48, 32);

    this.glowMaterial = new THREE.ShaderMaterial({
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0.5 },
        uSurge: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.glowMesh = new THREE.Mesh(geometry, this.glowMaterial);
    this.group.add(this.glowMesh);
  }

  update(dt, elapsed, energy, surge) {
    this.plasmaMaterial.uniforms.uTime.value = elapsed;
    this.plasmaMaterial.uniforms.uEnergy.value = energy;
    this.plasmaMaterial.uniforms.uSurge.value = surge;

    this.glowMaterial.uniforms.uTime.value = elapsed;
    this.glowMaterial.uniforms.uEnergy.value = energy;
    this.glowMaterial.uniforms.uSurge.value = surge;

    const pulse = 1 + Math.sin(elapsed * 0.6) * 0.02 + surge * 0.06;
    this.group.scale.setScalar(pulse);

    // Slow independent tumble so the same noise field doesn't read as static
    // from a fixed camera angle.
    this.group.rotation.y += dt * 0.03;
    this.group.rotation.x += dt * 0.011;
  }

  dispose() {
    this.plasmaMesh.geometry.dispose();
    this.plasmaMaterial.dispose();
    this.glowMesh.geometry.dispose();
    this.glowMaterial.dispose();
  }
}
