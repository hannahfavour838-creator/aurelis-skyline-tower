"use client";

import type { TowerData } from "@/lib/tower";
import { PieceInstances } from "./PieceInstances";
import type { ArchitectureMaterials } from "./materials";

interface RooftopProps {
  data: TowerData["roof"];
  materials: ArchitectureMaterials;
}

/** Lift overrun, rooftop plant and the sculpted crown of extended fins. */
export function Rooftop({ data, materials }: RooftopProps) {
  return (
    <group name="rooftop">
      <PieceInstances name="roof-parapet" pieces={data.parapet} material={materials.slab} />
      <PieceInstances name="roof-core" pieces={data.core} material={materials.core} />
      <PieceInstances name="roof-plant" pieces={data.metal} material={materials.metal} />
      <PieceInstances name="crown" pieces={data.frames} material={materials.frame} />
    </group>
  );
}
