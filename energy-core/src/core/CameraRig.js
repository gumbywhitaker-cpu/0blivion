import * as THREE from "three";

const MIN_RADIUS = 4.5;
const MAX_RADIUS = 12;
const BASE_RADIUS = 7.2;
const MAX_YAW = 0.55;   // radians of user-driven parallax
const MAX_PITCH = 0.32;
const AUTO_SPEED = 0.045; // slow autonomous orbit

export class CameraRig {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);

    this.autoTheta = 0;
    this.pointerYaw = 0;   // -1..1 smoothed pointer input
    this.pointerPitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.radius = BASE_RADIUS;
    this.targetRadius = BASE_RADIUS;
    this._shakeSeed = Math.random() * 1000;

    this._tmp = new THREE.Vector3();
  }

  setPointer(nx, ny) {
    // nx, ny in [-1, 1]
    this.targetYaw = nx;
    this.targetPitch = ny;
  }

  addZoom(delta) {
    this.targetRadius = THREE.MathUtils.clamp(this.targetRadius + delta, MIN_RADIUS, MAX_RADIUS);
  }

  setZoomAbsolute(radiusFactor) {
    this.targetRadius = THREE.MathUtils.clamp(
      BASE_RADIUS * radiusFactor,
      MIN_RADIUS,
      MAX_RADIUS
    );
  }

  update(dt, elapsed, shakeAmount) {
    this.autoTheta += dt * AUTO_SPEED;

    this.pointerYaw += (this.targetYaw - this.pointerYaw) * Math.min(dt * 2.2, 1);
    this.pointerPitch += (this.targetPitch - this.pointerPitch) * Math.min(dt * 2.2, 1);
    this.radius += (this.targetRadius - this.radius) * Math.min(dt * 3, 1);

    const theta = this.autoTheta + this.pointerYaw * MAX_YAW;
    const phi = Math.PI / 2 - (this.pointerPitch * MAX_PITCH + Math.sin(elapsed * 0.11) * 0.05);

    this._tmp.setFromSphericalCoords(this.radius, phi, theta);

    if (shakeAmount > 0.0005) {
      const s = shakeAmount * 0.22;
      const t = elapsed * 37 + this._shakeSeed;
      this._tmp.x += Math.sin(t * 1.7) * s;
      this._tmp.y += Math.cos(t * 2.3) * s;
      this._tmp.z += Math.sin(t * 1.3 + 1.0) * s * 0.6;
    }

    this.camera.position.copy(this._tmp);
    this.camera.lookAt(0, 0, 0);
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
