"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { SUN_DIRECTION } from "@/lib/sun";
import { SkyDome } from "./SkyDome";

const sunPos = SUN_DIRECTION.clone().multiplyScalar(80).toArray();

/**
 * Image-based lighting captured once from our own sky — no external HDRI.
 * Gives the glass a believable sky reflection and the whites a soft ambient bounce.
 */
export function SceneEnvironment({ resolution = 256 }: { resolution?: number }) {
  return (
    <Environment resolution={resolution} frames={1} environmentIntensity={0.5}>
      <SkyDome follow={false} clouds={0.6} radius={200} />
      {/* The sun as seen in reflections */}
      <Lightformer form="circle" color="#fff3e2" intensity={14} position={sunPos} scale={7} target={[0, 0, 0]} />
      {/* Soft cumulus-like panels: give the curtain wall something to reflect */}
      <Lightformer form="rect" color="#ffffff" intensity={1.6} position={[-60, 38, -120]} scale={[90, 26, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" color="#fffaf2" intensity={1.2} position={[110, 30, -60]} scale={[70, 18, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" color="#ffffff" intensity={1.0} position={[30, 46, 130]} scale={[120, 22, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" color="#f4f1ea" intensity={0.9} position={[-140, 22, 60]} scale={[60, 14, 1]} target={[0, 0, 0]} />
      {/* Darker ground plane below the horizon gives the glass a believable horizon line */}
      <Lightformer form="rect" color="#6f6a61" intensity={0.6} position={[0, -30, 0]} rotation-x={Math.PI / 2} scale={[400, 400, 1]} />
    </Environment>
  );
}
