"use client";

import { Bloom, EffectComposer, N8AO, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

/**
 * Restrained post-processing for the desktop experience: ambient occlusion to seat the
 * architecture, a whisper of bloom on sun-lit glass, filmic tone mapping and grain.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO halfRes aoRadius={4.5} distanceFalloff={1.2} intensity={1.6} color="#2c2822" quality="medium" />
      <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.15} intensity={0.22} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.38} darkness={0.22} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.06} />
      <SMAA />
    </EffectComposer>
  );
}
