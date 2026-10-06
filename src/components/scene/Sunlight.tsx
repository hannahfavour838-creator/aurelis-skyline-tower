"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { DirectionalLight, Object3D } from "three";
import { experience } from "@/lib/experience";
import { SUN_COLOR, SUN_DIRECTION } from "@/lib/sun";

const TARGET = [40, 30, 50] as const;

/**
 * Sun + sky fill + ground bounce.
 * The shadow map only re-renders when construction actually changes, which keeps
 * a 4K cascade-free shadow affordable on every frame of the scroll.
 */
export function Sunlight({ shadowSize = 4096 }: { shadowSize?: number }) {
  const sun = useRef<DirectionalLight>(null);
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(...TARGET);
    return o;
  }, []);
  const lastVersion = useRef(-1);

  const position = useMemo(
    () => SUN_DIRECTION.clone().multiplyScalar(650).add(target.position).toArray(),
    [target],
  );

  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.target = target;
    target.updateMatrixWorld();
    const cam = light.shadow.camera;
    cam.left = -240;
    cam.right = 240;
    cam.top = 240;
    cam.bottom = -210;
    cam.near = 200;
    cam.far = 1150;
    cam.updateProjectionMatrix();
    light.shadow.bias = -0.00025;
    light.shadow.normalBias = 0.35;
    light.shadow.radius = 3;
    light.shadow.blurSamples = 12;
    light.shadow.autoUpdate = false;
    light.shadow.needsUpdate = true;
  }, [target]);

  useFrame(() => {
    const light = sun.current;
    if (!light) return;
    if (lastVersion.current !== experience.version) {
      lastVersion.current = experience.version;
      light.shadow.needsUpdate = true;
    }
  });

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={sun}
        position={position}
        color={SUN_COLOR}
        intensity={4.1}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
      />
      {/* Sky dome fill and warm ground bounce */}
      <hemisphereLight args={["#dce4ea", "#c9bea9", 0.45]} />
      <directionalLight position={[320, 90, -260]} color="#efe7da" intensity={0.35} />
    </>
  );
}
