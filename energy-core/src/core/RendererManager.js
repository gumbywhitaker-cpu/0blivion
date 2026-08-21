import * as THREE from "three";

export class RendererManager {
  constructor(canvas, dpr) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });

    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  setPixelRatio(dpr) {
    this.renderer.setPixelRatio(dpr);
  }

  resize(width, height) {
    this.renderer.setSize(width, height, false);
  }

  get domElement() {
    return this.renderer.domElement;
  }
}
