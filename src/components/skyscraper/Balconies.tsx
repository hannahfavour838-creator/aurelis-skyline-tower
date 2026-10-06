"use client";

import type { TowerData } from "@/lib/tower";
import { PieceInstances } from "./PieceInstances";
import type { ArchitectureMaterials } from "./materials";

interface BalconiesProps {
  data: TowerData["balconies"];
  materials: ArchitectureMaterials;
}

/** Staggered cantilevered balconies that extrude from the façade. */
export function Balconies({ data, materials }: BalconiesProps) {
  return (
    <group name="balconies">
      <PieceInstances name="balcony-slabs" pieces={data.slabs} material={materials.slab} />
      <PieceInstances name="balcony-rails" pieces={data.rails} material={materials.frame} />
      <PieceInstances
        name="balcony-glass"
        pieces={data.glass}
        material={materials.balustrade}
        castShadow={false}
        renderOrder={2}
      />
    </group>
  );
}
