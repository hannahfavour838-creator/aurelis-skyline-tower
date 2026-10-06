"use client";

import { useEffect, useMemo } from "react";
import { buildTower } from "@/lib/tower";
import { createArchitectureMaterials, disposeMaterials } from "./materials";
import { Foundation } from "./Foundation";
import { Structure } from "./Structure";
import { GlassFacade } from "./GlassFacade";
import { Balconies } from "./Balconies";
import { Rooftop } from "./Rooftop";
import { Crane } from "./Crane";

/**
 * AURELIS — Skyline Tower.
 * Procedural, fully modular tower whose individual elements are assembled by the
 * construction timeline. Each sub-component maps to a real construction package.
 */
export function Skyscraper() {
  const tower = useMemo(() => buildTower(), []);
  const materials = useMemo(() => createArchitectureMaterials(), []);

  useEffect(() => () => disposeMaterials({ ...materials }), [materials]);

  return (
    <group name="skyline-tower">
      <Foundation data={tower.foundation} materials={materials} />
      <Structure tower={tower} materials={materials} />
      <GlassFacade tower={tower} materials={materials} />
      <Balconies data={tower.balconies} materials={materials} />
      <Rooftop data={tower.roof} materials={materials} />
      <Crane materials={materials} />
    </group>
  );
}
