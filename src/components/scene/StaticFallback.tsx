"use client";

import { useEffect } from "react";
import { loading } from "@/lib/experience";
import { ElevationDrawing } from "@/components/ui/ElevationDrawing";

/**
 * Shown only when WebGL is unavailable: the story and navigation keep working over a
 * calm, drawn elevation of the tower instead of the live scene.
 */
export function StaticFallback() {
  useEffect(() => {
    loading.mark("scene");
    loading.mark("shaders");
    loading.mark("frame");
  }, []);
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#d5dde1] via-[#efe9df] to-[#d9d3c6]">
      <ElevationDrawing className="absolute bottom-[6vh] right-[8vw] h-[78vh] w-auto text-ink/70" />
    </div>
  );
}
