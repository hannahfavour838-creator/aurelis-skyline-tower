"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, BoxGeometry, Color, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { experience } from "@/lib/experience";
import { ease, segment } from "@/lib/math";
import type { Piece } from "@/lib/pieces";
import { PIT, PIT_DEPTH } from "@/lib/tower";
import { SITE_GROUND_COLOR, SITE_NOISE } from "@/components/scene/palette";
import { PieceInstances } from "./PieceInstances";
import { withSurfaceVariation, type ArchitectureMaterials } from "./materials";

interface FoundationProps {
  data: { raft: Piece[]; walls: Piece[] };
  materials: ArchitectureMaterials;
}

/**
 * Excavation + raft foundation. The graded ground plate sinks to become the pit floor
 * (the excavation), retaining walls line the cut and raft pads emerge from below.
 */
export function Foundation({ data, materials }: FoundationProps) {
  const lid = useRef<Mesh>(null);
  const pit = useRef<Mesh>(null);

  const { pitGeo, lidGeo, pitMat, lidMat } = useMemo(() => {
    const pitGeo = new BoxGeometry(PIT.w, PIT_DEPTH + 0.1, PIT.d);
    const lidGeo = new PlaneGeometry(PIT.w, PIT.d);
    lidGeo.rotateX(-Math.PI / 2);
    const pitMat = withSurfaceVariation(
      new MeshStandardMaterial({ color: new Color("#c2b7a4"), roughness: 1, side: BackSide }),
      0.22,
      0.6,
    );
    const lidMat = withSurfaceVariation(
      new MeshStandardMaterial({ color: SITE_GROUND_COLOR.clone(), roughness: 1 }),
      SITE_NOISE.strength,
      SITE_NOISE.scale,
    );
    return { pitGeo, lidGeo, pitMat, lidMat };
  }, []);

  useEffect(
    () => () => {
      pitGeo.dispose();
      lidGeo.dispose();
      pitMat.dispose();
      lidMat.dispose();
    },
    [pitGeo, lidGeo, pitMat, lidMat],
  );

  const earth = useMemo(() => new Color("#b9ad98"), []);
  const last = useRef(-1);

  useFrame(() => {
    if (last.current === experience.version || !lid.current || !pit.current) return;
    last.current = experience.version;
    const { foundation, core } = experience.phases;
    const dig = ease.inOutCubic(segment(foundation, 0.04, 0.26));
    lid.current.position.y = -dig * PIT_DEPTH + 0.002;
    lidMat.color.copy(SITE_GROUND_COLOR).lerp(earth, dig);
    // Once the ground deck has fully closed the pit, stop drawing the excavation.
    const closed = core >= 0.53;
    pit.current.visible = dig > 0 && !closed;
    lid.current.visible = !closed;
  });

  return (
    <group name="foundation">
      <mesh ref={pit} geometry={pitGeo} material={pitMat} position={[PIT.cx, -PIT_DEPTH / 2 - 0.05, PIT.cz]} receiveShadow />
      <mesh ref={lid} geometry={lidGeo} material={lidMat} position={[PIT.cx, 0, PIT.cz]} receiveShadow />
      <PieceInstances name="retaining-walls" pieces={data.walls} material={materials.concrete} />
      <PieceInstances name="raft" pieces={data.raft} material={materials.raft} />
    </group>
  );
}
