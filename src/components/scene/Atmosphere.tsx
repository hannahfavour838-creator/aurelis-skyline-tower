"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { experience } from "@/lib/experience";
import { rng } from "@/lib/math";
import { SUN_DIRECTION } from "@/lib/sun";

/* ------------------------------------------------------------------ */
/* Volumetric-looking sun shafts                                       */
/* ------------------------------------------------------------------ */

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }

  void main() {
    float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
    float body = pow(across, 2.4);
    // striations running along the shaft
    float streak = noise(vec2(vUv.x * 9.0 + uSeed, vUv.y * 0.8 - uTime * 0.012));
    streak = 0.55 + 0.45 * smoothstep(0.15, 0.85, streak);
    float along = smoothstep(0.0, 0.32, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
    float ground = smoothstep(1.0, 34.0, vWorld.y) * (1.0 - smoothstep(55.0, 175.0, vWorld.y));
    float near = smoothstep(35.0, 170.0, distance(vWorld, cameraPosition));
    float a = body * streak * along * ground * near * uIntensity;
    gl_FragColor = vec4(uColor * a, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface BeamSpec {
  /** Point where the shaft meets the ground plane region */
  foot: [number, number, number];
  width: number;
  length: number;
  intensity: number;
}

const BEAMS: BeamSpec[] = [
  // The hero shaft grazes the plaza in front of the tower; the rest are whispers.
  { foot: [40, 0, 78], width: 40, length: 420, intensity: 0.08 },
  { foot: [-18, 0, 130], width: 22, length: 380, intensity: 0.045 },
  { foot: [120, 0, 46], width: 52, length: 440, intensity: 0.035 },
  { foot: [78, 0, 170], width: 16, length: 360, intensity: 0.04 },
  { foot: [175, 0, 130], width: 30, length: 400, intensity: 0.03 },
  { foot: [-64, 0, 44], width: 28, length: 380, intensity: 0.03 },
];

const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _c = new Vector3();
const _toCam = new Vector3();

function SunBeams({ strength = 1 }: { strength?: number }) {
  const meshes = useRef<(Mesh | null)[]>([]);
  const { geometry, materials, centers } = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1, 1, 1);
    const color = new Color("#fff0d8");
    const materials = BEAMS.map(
      (b, i) =>
        new ShaderMaterial({
          vertexShader: beamVertex,
          fragmentShader: beamFragment,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          side: DoubleSide,
          fog: false,
          uniforms: {
            uColor: { value: color },
            uIntensity: { value: b.intensity },
            uTime: { value: 0 },
            uSeed: { value: i * 13.7 },
          },
        }),
    );
    const centers = BEAMS.map((b) => new Vector3(...b.foot).addScaledVector(SUN_DIRECTION, b.length * 0.5));
    return { geometry, materials, centers };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    },
    [geometry, materials],
  );

  const mat = useMemo(() => new Matrix4(), []);

  useFrame(({ camera, clock }) => {
    const { final, landscape } = experience.phases;
    const p = experience.progress;
    // Strongest in the empty opening and the final reveal; calmer mid-construction.
    const envelope = (0.75 + 1.65 * Math.max(1 - p * 4, 0) + 0.45 * final + 0.1 * landscape) * strength;
    BEAMS.forEach((b, i) => {
      const m = meshes.current[i];
      if (!m) return;
      // Cylindrical billboard around the sun direction
      _y.copy(SUN_DIRECTION);
      _c.copy(centers[i]);
      _toCam.copy(camera.position).sub(_c);
      _x.crossVectors(_y, _toCam).normalize();
      _z.crossVectors(_x, _y).normalize();
      mat.makeBasis(_x.multiplyScalar(b.width), _y.multiplyScalar(b.length), _z);
      mat.setPosition(_c);
      m.matrix.copy(mat);
      m.matrixWorldNeedsUpdate = true;
      const u = materials[i].uniforms;
      u.uTime.value = experience.reducedMotion ? 0 : clock.elapsedTime;
      u.uIntensity.value = b.intensity * envelope;
    });
  });

  return (
    <group name="sun-shafts">
      {BEAMS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={geometry}
          material={materials[i]}
          matrixAutoUpdate={false}
          frustumCulled={false}
          renderOrder={5}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Dust motes drifting through the light                               */
/* ------------------------------------------------------------------ */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.15 + aSeed * 0.2);
    p.x += sin(t + aSeed * 40.0) * 2.5 + uTime * 0.6;
    p.y += sin(t * 0.7 + aSeed * 12.0) * 1.6;
    p.z += cos(t * 0.8 + aSeed * 23.0) * 2.0;
    p.x = mod(p.x + 120.0, 240.0) - 120.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.5 + aSeed) * 26.0 * uPixelRatio / -mv.z;
    float d = -mv.z;
    vAlpha = smoothstep(4.0, 22.0, d) * (1.0 - smoothstep(90.0, 220.0, d));
  }
`;

const dustFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r) * vAlpha * uOpacity;
    gl_FragColor = vec4(vec3(1.0, 0.96, 0.88) * a, 1.0);
  }
`;

function Dust({ count }: { count: number }) {
  const points = useRef<Points>(null);
  const { geometry, material } = useMemo(() => {
    const rand = rng(11);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 240;
      pos[i * 3 + 1] = 2 + Math.pow(rand(), 1.6) * 110;
      pos[i * 3 + 2] = -40 + rand() * 200;
      seed[i] = rand();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const material = new ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0.32 } },
    });
    return { geometry, material };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = experience.reducedMotion ? 0 : clock.elapsedTime;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={6} />;
}

export function Atmosphere({ dust = 260, beams = 1 }: { dust?: number; beams?: number }) {
  return (
    <>
      <SunBeams strength={beams} />
      {dust > 0 && <Dust count={dust} />}
    </>
  );
}
