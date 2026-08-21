// Escaping particles: each one loops through a full spawn -> shoot outward
// -> decelerate/curve -> fade -> respawn cycle driven entirely by
// `fract(time * speed + seed)`, so thousands of independent lifetimes run
// on the GPU with no per-particle JS bookkeeping.
export const sparkVertexShader = /* glsl */ `
  attribute vec3 aDir;
  attribute vec3 aCurlAxis;
  attribute float aSeed;
  attribute float aLifeSpeed;
  attribute float aType; // 0 = dust, 0.5 = spark, 1 = plasma ball
  attribute float aSize;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uSurge;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vType;
  varying float vLife;

  vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    float speed = aLifeSpeed * (0.7 + uEnergy * 0.5 + uSurge * 1.1);
    float life = fract(uTime * speed + aSeed);
    vLife = life;

    // Dust barely leaves the surface; sparks travel far and fast; plasma
    // balls travel a middle distance, slower and bigger.
    float isSpark = smoothstep(0.25, 0.55, aType);
    float isBall = smoothstep(0.75, 1.0, aType);
    float maxDist = mix(mix(0.35, 1.5, isSpark), 1.0, isBall);
    maxDist *= 0.7 + uSurge * 1.3;

    float ease = 1.0 - pow(1.0 - life, 3.0);
    float radius = 1.12 + maxDist * ease;

    float curlAmount = mix(2.4, 0.6, isSpark) * (life * life);
    vec3 dir = normalize(aDir);
    vec3 pos = rotateAxis(dir, normalize(aCurlAxis), curlAmount) * radius;

    vAlpha = smoothstep(0.0, 0.05, life) * (1.0 - smoothstep(0.6, 1.0, life));
    vType = aType;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float twinkle = 1.0 + isSpark * 0.5 * sin(uTime * 24.0 + aSeed * 40.0);
    float sizeMul = (1.0 + uSurge * 0.8) * twinkle;
    float dist = max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(aSize * uPixelRatio * sizeMul * (22.0 / dist), 1.0, 70.0);
  }
`;

export const sparkFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vType;
  varying float vLife;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);

    vec3 dust = vec3(0.55, 0.32, 0.18);
    vec3 spark = vec3(1.0, 0.95, 0.8);
    vec3 ball = vec3(1.0, 0.55, 0.15);

    float isSpark = smoothstep(0.25, 0.55, vType);
    float isBall = smoothstep(0.75, 1.0, vType);
    vec3 color = mix(mix(dust, spark, isSpark), ball, isBall);

    float glow = pow(core, mix(2.2, 1.1, isSpark));
    gl_FragColor = vec4(color * (0.7 + glow), glow * vAlpha);
  }
`;
