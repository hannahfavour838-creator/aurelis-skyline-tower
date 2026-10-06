"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { loading } from "@/lib/experience";

/** Reports real readiness milestones to the loader: shaders compiled, first frames drawn. */
export function SceneReady() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const frames = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loading.mark("scene");
    const compile = async () => {
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        // Some drivers do not support parallel compile; rendering compiles lazily instead.
      }
      if (!cancelled) loading.mark("shaders");
    };
    compile();
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    frames.current++;
    if (frames.current === 3) loading.mark("frame");
  });

  return null;
}
