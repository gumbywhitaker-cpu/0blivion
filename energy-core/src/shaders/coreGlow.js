// Small inner sphere: the overexposed white-hot heart of the reactor,
// glimpsed through gaps in the outer plasma shell and bleeding into bloom.
export const glowVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const glowFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uSurge;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float facing = pow(max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 3.2);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.1);

    vec3 hot = vec3(1.0, 0.97, 0.9);
    vec3 warm = vec3(1.0, 0.72, 0.35);
    vec3 color = mix(warm, hot, facing);

    float intensity = facing * (0.55 + uEnergy * 0.45 + uSurge * 0.6) * pulse;
    gl_FragColor = vec4(color * intensity, intensity);
  }
`;
