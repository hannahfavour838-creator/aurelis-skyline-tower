"use client";

import type { TowerData } from "@/lib/tower";
import { PieceInstances } from "./PieceInstances";
import type { ArchitectureMaterials } from "./materials";

interface GlassFacadeProps {
  tower: TowerData;
  materials: ArchitectureMaterials;
}

/**
 * Unitised curtain wall: floor-to-ceiling glass panels, white aluminium fins,
 * podium louvres, sky-garden planting and terrace balustrades.
 */
export function GlassFacade({ tower, materials }: GlassFacadeProps) {
  return (
    <group name="facade">
      <PieceInstances name="glass" pieces={tower.glass} material={materials.glass} />
      <PieceInstances name="fins" pieces={tower.frames} material={materials.frame} />
      <PieceInstances name="sky-garden-planting" pieces={tower.planters} material={materials.planter} />
      <PieceInstances
        name="terrace-balustrades"
        pieces={tower.balustrades}
        material={materials.balustrade}
        castShadow={false}
        renderOrder={2}
      />
    </group>
  );
}
