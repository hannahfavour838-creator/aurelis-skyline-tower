"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { ACESFilmicToneMapping } from "three";
import type { Quality } from "@/lib/experience";
import { FOG_COLOR } from "@/lib/sun";
import { Skyscraper } from "@/components/skyscraper/Skyscraper";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { SceneEnvironment } from "./Environment";
import { Landscape } from "./Landscape";
import { SceneReady } from "./SceneReady";
import { Site } from "./Site";
import { SkyDome } from "./SkyDome";
import { StaticFallback } from "./StaticFallback";
import { Sunlight } from "./Sunlight";
import { Terrain } from "./Terrain";

interface ArchitecturalSceneProps {
  quality: Quality;
  /** Pause rendering entirely while the stage is off-screen. */
  active: boolean;
}

/**
 * The 3D world. Everything inside is driven by the shared experience state that the
 * GSAP master timeline scrubs — React never re-renders during scroll.
 */
export default function ArchitecturalScene({ quality, active }: ArchitecturalSceneProps) {
  const high = quality === "high";
  const maxDpr = high ? 1.75 : 1.5;
  const [dpr, setDpr] = useState(maxDpr);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, dpr]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !high, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 34, near: 1, far: 12000, position: [70, 34, 440] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      fallback={<StaticFallback />}
      aria-hidden
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.00036]} />
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(maxDpr)}
        onFallback={() => setDpr(1)}
      />
      <Suspense fallback={null}>
        <SceneEnvironment resolution={high ? 256 : 128} />
        <SkyDome />
        <Sunlight shadowSize={high ? 4096 : 2048} />
        <Terrain segments={high ? 260 : 150} />
        <Site cityBlocks={high ? 90 : 50} />
        <Skyscraper />
        <Landscape density={high ? 1 : 0.5} />
        <Atmosphere dust={high ? 260 : 80} beams={high ? 1 : 0.7} />
        <CameraRig />
        <SceneReady />
        {high && <Effects />}
      </Suspense>
    </Canvas>
  );
}
