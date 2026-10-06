"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, Mesh, ShaderMaterial, SphereGeometry } from "three";
import { SKY, SUN_DIRECTION } from "@/lib/sun";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // keep on the far plane
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunGlow;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uClouds;
  varying vec3 vDir;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.07; a*=0.5; } return s; }

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    // Horizon warms toward the sun's azimuth and cools away from it
    vec2 flatDir = normalize(dir.xz + 1e-5);
    float toward = max(dot(flatDir, normalize(uSunDir.xz)), 0.0);
    vec3 horizon = mix(uHorizon * vec3(0.975, 0.985, 1.0), uHorizon * vec3(1.02, 0.995, 0.955), pow(toward, 1.6));
    vec3 col = mix(horizon, uUpper, smoothstep(0.0, 0.2, h));
    col = mix(col, uZenith, smoothstep(0.18, 0.95, h));
    col = mix(col, uGround, smoothstep(0.0, -0.08, h));

    // Dense, warm haze band hugging the horizon
    float haze = exp(-abs(h) * 14.0);
    col = mix(col, horizon * 1.015, haze * 0.55);

    // Sun: wide atmospheric glow + tight halo + disc
    float sd = max(dot(dir, normalize(uSunDir)), 0.0);
    col += uSunGlow * (pow(sd, 4.0) * 0.2 + pow(sd, 22.0) * 0.26 + pow(sd, 900.0) * 1.6);
    col += uSunGlow * smoothstep(0.99955, 0.9998, sd) * 6.0;

    // Very soft, high cirrus — barely there
    if (h > 0.0 && uClouds > 0.0) {
      vec2 uv = dir.xz / (h + 0.18) * 1.6;
      uv += vec2(uTime * 0.0035, uTime * 0.001);
      float c = fbm(uv * vec2(1.0, 2.6));
      float wisp = smoothstep(0.52, 0.86, c) * smoothstep(0.02, 0.22, h) * (1.0 - smoothstep(0.55, 0.95, h));
      col = mix(col, vec3(1.0, 0.995, 0.985) * (1.0 + sd * 0.15), wisp * 0.32 * uClouds);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface SkyDomeProps {
  /** Follow the active camera (main scene) or stay at the origin (environment capture). */
  follow?: boolean;
  clouds?: number;
  radius?: number;
}

/** Custom sky with layered ivory/grey gradient, horizon haze and a restrained sun. */
export function SkyDome({ follow = true, clouds = 1, radius = 5000 }: SkyDomeProps) {
  const mesh = useRef<Mesh>(null);
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(radius, 48, 24);
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: SKY.zenith },
        uUpper: { value: SKY.upper },
        uHorizon: { value: SKY.horizon },
        uGround: { value: SKY.ground },
        uSunGlow: { value: SKY.sunGlow },
        uSunDir: { value: SUN_DIRECTION },
        uTime: { value: 0 },
        uClouds: { value: clouds },
      },
    });
    return { geometry, material };
  }, [radius, clouds]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ camera, clock }) => {
    if (follow && mesh.current) mesh.current.position.copy(camera.position);
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={-1} frustumCulled={false} />;
}
