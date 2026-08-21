import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

// Cheap final pass: vignette to pull the eye toward the core, and a whisper
// of film grain so the deep blacks of space don't band. Both are subtle by
// design — the brief for this piece is "the glow comes from the rendered
// energy layers", not a slapped-on filter.
const finalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.32 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      vec2 c = vUv - 0.5;
      float vig = 1.0 - dot(c, c) * uVignette;
      color.rgb *= clamp(vig, 0.0, 1.0);

      float grain = (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 97.13) - 0.5) * 0.018;
      color.rgb += grain;

      gl_FragColor = color;
    }
  `,
};

export class PostProcessing {
  constructor(renderer, scene, camera, settings) {
    this.renderer = renderer;
    this.enabled = settings.bloom;

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.75,  // strength (modulated per-frame)
      0.65,  // radius
      0.45   // threshold
    );
    this.bloomPass.enabled = this.enabled;
    this.composer.addPass(this.bloomPass);

    this.finalPass = new ShaderPass(finalShader);
    this.finalPass.renderToScreen = true;
    this.composer.addPass(this.finalPass);

    this.setResolutionScale(settings.bloomRes);
  }

  setResolutionScale(scale) {
    const w = Math.max(1, Math.floor(window.innerWidth * scale));
    const h = Math.max(1, Math.floor(window.innerHeight * scale));
    this.bloomPass.resolution.set(w, h);
  }

  applySettings(settings) {
    this.enabled = settings.bloom;
    this.bloomPass.enabled = this.enabled;
    this.setResolutionScale(settings.bloomRes);
  }

  update(elapsed, energy) {
    this.bloomPass.strength = 0.55 + energy * 0.55;
    this.finalPass.uniforms.uTime.value = elapsed;
  }

  resize(width, height) {
    this.composer.setSize(width, height);
  }

  render() {
    this.composer.render();
  }
}
