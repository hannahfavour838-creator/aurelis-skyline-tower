"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, BufferGeometry, Color, InstancedMesh, Material, Matrix4 } from "three";
import { experience } from "@/lib/experience";
import { evaluatePiece, type Piece } from "@/lib/pieces";

/** One unit cube shared by every architectural element (scaled per instance). */
export const UNIT_BOX = new BoxGeometry(1, 1, 1);

interface PieceInstancesProps {
  pieces: Piece[];
  material: Material;
  geometry?: BufferGeometry;
  castShadow?: boolean;
  receiveShadow?: boolean;
  renderOrder?: number;
  name?: string;
}

const _m = new Matrix4();

/**
 * Renders a family of construction pieces as a single InstancedMesh (one draw call).
 * Matrices are recomputed only when the construction state actually changes.
 */
export function PieceInstances({
  pieces,
  material,
  geometry = UNIT_BOX,
  castShadow = true,
  receiveShadow = true,
  renderOrder,
  name,
}: PieceInstancesProps) {
  const ref = useRef<InstancedMesh>(null);
  const lastVersion = useRef(-1);
  const hasColor = useMemo(() => pieces.some((p) => p.color), [pieces]);

  const update = (mesh: InstancedMesh) => {
    let any = false;
    const phases = experience.phases;
    for (let i = 0; i < pieces.length; i++) {
      if (evaluatePiece(pieces[i], phases, _m)) any = true;
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = any;
    lastVersion.current = experience.version;
  };

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    if (hasColor) {
      const c = new Color();
      pieces.forEach((p, i) => {
        const col = p.color ?? [1, 1, 1];
        c.setRGB(col[0], col[1], col[2]);
        mesh.setColorAt(i, c);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    update(mesh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, hasColor]);

  useFrame(() => {
    const mesh = ref.current;
    if (mesh && lastVersion.current !== experience.version) update(mesh);
  });

  return (
    <instancedMesh
      ref={ref}
      name={name}
      args={[geometry, material, pieces.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}
