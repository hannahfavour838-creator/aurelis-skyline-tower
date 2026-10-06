"use client";

import type { TowerData } from "@/lib/tower";
import { PieceInstances } from "./PieceInstances";
import type { ArchitectureMaterials } from "./materials";

interface StructureProps {
  tower: TowerData;
  materials: ArchitectureMaterials;
}

/** Concrete core, columns, beams and floor plates — the structural frame. */
export function Structure({ tower, materials }: StructureProps) {
  return (
    <group name="structure">
      <PieceInstances name="core" pieces={tower.core} material={materials.core} />
      <PieceInstances name="columns-beams" pieces={tower.concrete} material={materials.concrete} />
      <PieceInstances name="floor-plates" pieces={tower.slabs} material={materials.slab} />
    </group>
  );
}
