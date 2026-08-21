import * as THREE from "three";

import { RendererManager } from "./core/RendererManager.js";
import { SceneManager } from "./core/SceneManager.js";
import { CameraRig } from "./core/CameraRig.js";
import { PostProcessing } from "./core/PostProcessing.js";
import { PerformanceManager } from "./core/PerformanceManager.js";
import { IntensityManager } from "./core/IntensityManager.js";
import { InteractionManager } from "./core/InteractionManager.js";

import { Starfield } from "./systems/Starfield.js";
import { EnergyCore } from "./systems/EnergyCore.js";
import { ParticleCorona } from "./systems/ParticleCorona.js";
import { Sparks } from "./systems/Sparks.js";

export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    this.performance = new PerformanceManager((tier, settings) => this._rebuild(settings));
    const settings = this.performance.settings;

    this.sceneManager = new SceneManager();
    this.rendererManager = new RendererManager(canvas, settings.dpr);
    this.cameraRig = new CameraRig(window.innerWidth / window.innerHeight);
    this.intensity = new IntensityManager();

    this.starfield = new Starfield(settings.starCount);
    this.energyCore = new EnergyCore(settings.coreDetail);
    this.corona = new ParticleCorona(settings.coronaCount);
    this.sparks = new Sparks(settings.sparkCount);

    // Generously sized raycast target so tapping "near" the core (not just
    // its exact deformed surface) still registers as a hit. `visible = false`
    // makes three.js skip it entirely at render time while Raycaster still
    // tests it — a clean way to keep it out of the picture, unlike a
    // zero-opacity material (which still passes through the render pipeline).
    this.tapProxy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12));
    this.tapProxy.visible = false;

    this.sceneManager.add(
      this.starfield.group,
      this.energyCore.group,
      this.corona.points,
      this.sparks.points,
      this.tapProxy
    );

    this.postProcessing = new PostProcessing(
      this.rendererManager.renderer,
      this.sceneManager.scene,
      this.cameraRig.camera,
      settings
    );

    this.raycaster = new THREE.Raycaster();
    this.interaction = new InteractionManager(canvas, {
      onTap: (nx, ny) => this._handleTap(nx, ny),
    });

    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);
    window.addEventListener("orientationchange", this._onResize);

    this._animate = this._animate.bind(this);
  }

  _handleTap(nx, ny) {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.cameraRig.camera);
    const hits = this.raycaster.intersectObject(this.tapProxy, false);
    if (hits.length > 0) {
      this.intensity.triggerSurge(1);
    }
  }

  _rebuild(settings) {
    this.rendererManager.setPixelRatio(settings.dpr);
    this.starfield.setPixelRatio(settings.dpr);
    this.corona.setPixelRatio(settings.dpr);
    this.sparks.setPixelRatio(settings.dpr);
    this.postProcessing.applySettings(settings);

    // Particle counts and core tessellation are baked into buffer sizes at
    // construction time, so a tier demotion swaps the whole system rather
    // than mutating it in place.
    this.sceneManager.scene.remove(this.corona.points, this.sparks.points, this.energyCore.group);
    this.corona.dispose();
    this.sparks.dispose();
    this.energyCore.dispose();

    this.corona = new ParticleCorona(settings.coronaCount);
    this.sparks = new Sparks(settings.sparkCount);
    this.energyCore = new EnergyCore(settings.coreDetail);

    this.sceneManager.add(this.corona.points, this.sparks.points, this.energyCore.group);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.rendererManager.resize(w, h);
    this.cameraRig.resize(w / h);
    this.postProcessing.resize(w, h);
    this.postProcessing.setResolutionScale(this.performance.settings.bloomRes);
  }

  start() {
    this._animate();
  }

  _animate() {
    requestAnimationFrame(this._animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.elapsedTime;

    this.performance.sample(dt, elapsed);
    this.intensity.update(dt, elapsed);

    this.cameraRig.setPointer(this.interaction.ndc.x, this.interaction.ndc.y);
    this.cameraRig.addZoom(this.interaction.consumeZoom());
    this.cameraRig.update(dt, elapsed, this.intensity.shake);

    this.starfield.update(dt, elapsed);
    this.energyCore.update(dt, elapsed, this.intensity.value, this.intensity.surge);
    this.corona.update(dt, elapsed, this.intensity.value, this.intensity.surge, this.interaction.ndc);
    this.sparks.update(dt, elapsed, this.intensity.value, this.intensity.surge);

    if (this.postProcessing.enabled) {
      this.postProcessing.update(elapsed, this.intensity.value);
      this.postProcessing.render();
    } else {
      this.rendererManager.renderer.render(this.sceneManager.scene, this.cameraRig.camera);
    }
  }
}
