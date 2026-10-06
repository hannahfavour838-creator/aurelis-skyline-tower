"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Quality } from "@/lib/experience";

const ArchitecturalScene = dynamic(() => import("@/components/scene/ArchitecturalScene"), {
  ssr: false,
  loading: () => null,
});

function detectQuality(): Quality {
  if (typeof window === "undefined") return "low";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "high" || forced === "low") return forced;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth < 900;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || small || memory < 4 || cores < 4 ? "low" : "high";
}

/** Client-only mount for the WebGL scene with a one-time device quality tier. */
export function SceneMount({ active }: { active: boolean }) {
  const [quality] = useState<Quality>(detectQuality);
  return <ArchitecturalScene quality={quality} active={active} />;
}
