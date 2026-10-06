"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  Vector3,
} from "three";
import { experience } from "@/lib/experience";
import { segment } from "@/lib/math";
import { buildDistantCity, buildLogistics, buildSurvey, terrainHeight } from "@/lib/site";
import { PieceInstances, UNIT_BOX } from "@/components/skyscraper/PieceInstances";
import { withSurfaceVariation } from "@/components/skyscraper/materials";

/**
 * Site story: setting-out survey, hoarding and cabins during construction, and the
 * far-away city that gives the horizon its sense of scale.
 */
export function Site({ cityBlocks = 140 }: { cityBlocks?: number }) {
  const survey = useMemo(() => buildSurvey(), []);
  const logistics = useMemo(() => buildLogistics(), []);

  const mats = useMemo(
    () => ({
      grid: new MeshBasicMaterial({ color: new Color("#3d3b36"), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      key: new MeshBasicMaterial({ color: new Color("#b89c5c"), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }),
      ring: new MeshBasicMaterial({ color: new Color("#b89c5c"), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      stake: new MeshStandardMaterial({ color: new Color("#c8b27a"), roughness: 0.5, metalness: 0.2 }),
      hoarding: withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#f1efe9"), roughness: 0.7 }), 0.04),
      cabin: new MeshStandardMaterial({ color: new Color("#e6e4dd"), roughness: 0.6, metalness: 0.1 }),
    }),
    [],
  );
  const ringGeo = useMemo(() => {
    const g = new RingGeometry(61.6, 62, 256, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
      ringGeo.dispose();
    },
    [mats, ringGeo],
  );

  const ring = useRef<Mesh>(null);
  const last = useRef(-1);
  const ringIndexCount = ringGeo.index?.count ?? 0;

  useFrame(() => {
    if (last.current === experience.version) return;
    last.current = experience.version;
    const { survey: s, foundation, landscape } = experience.phases;
    // Grid + footprint: drawn during survey, absorbed by the excavation
    const appear = segment(s, 0, 0.35);
    const dig = 1 - segment(foundation, 0.02, 0.14);
    mats.grid.opacity = 0.42 * appear * dig;
    mats.key.opacity = 0.95 * appear * dig;
    // Site ring + axes persist through construction, fade as landscape arrives
    const persist = 1 - segment(landscape, 0.0, 0.22);
    mats.ring.opacity = 0.75 * segment(s, 0.2, 0.4) * persist;
    if (ring.current) {
      const draw = Math.floor(segment(s, 0.2, 0.6) * (ringIndexCount / 3)) * 3;
      ring.current.geometry.setDrawRange(0, draw);
      ring.current.visible = draw > 0 && persist > 0;
    }
  });

  // Axis dashes live in the grid set but should persist longer; split them here.
  const { gridPieces, axisPieces } = useMemo(() => {
    const gridPieces = survey.grid.filter((p) => Math.abs(p.sx - p.sz) > 10 && (p.sx > 20 || p.sz > 20));
    const axisPieces = survey.grid.filter((p) => !gridPieces.includes(p));
    return { gridPieces, axisPieces };
  }, [survey]);

  const axisMat = useMemo(
    () => new MeshBasicMaterial({ color: new Color("#3d3b36"), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    [],
  );
  useEffect(() => () => axisMat.dispose(), [axisMat]);
  useFrame(() => {
    const { survey: s, landscape } = experience.phases;
    axisMat.opacity = 0.38 * segment(s, 0.25, 0.4) * (1 - segment(landscape, 0, 0.2));
  });

  return (
    <group name="site">
      <PieceInstances name="survey-grid" pieces={gridPieces} material={mats.grid} castShadow={false} receiveShadow={false} renderOrder={1} />
      <PieceInstances name="survey-axes" pieces={axisPieces} material={axisMat} castShadow={false} receiveShadow={false} renderOrder={1} />
      <PieceInstances name="survey-key" pieces={survey.key} material={mats.key} castShadow={false} receiveShadow={false} renderOrder={1} />
      <PieceInstances name="survey-stakes" pieces={survey.stakes} material={mats.stake} receiveShadow={false} />
      <mesh ref={ring} geometry={ringGeo} material={mats.ring} position={[0, 0.04, 3]} renderOrder={1} />
      <PieceInstances name="hoarding" pieces={logistics.fence} material={mats.hoarding} />
      <PieceInstances name="site-cabins" pieces={logistics.cabins} material={mats.cabin} />
      <DistantCity count={cityBlocks} />
    </group>
  );
}

function DistantCity({ count }: { count: number }) {
  const ref = useRef<InstancedMesh>(null);
  const blocks = useMemo(() => buildDistantCity(count), [count]);
  // Unlit silhouettes: at two kilometres, aerial perspective flattens buildings to tone.
  const material = useMemo(() => new MeshBasicMaterial({ color: new Color("#d9dad6") }), []);
  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const p = new Vector3();
    const s = new Vector3();
    blocks.forEach((b, i) => {
      const base = Math.min(terrainHeight(b.x, b.z), 18) - 3;
      p.set(b.x, base + b.h / 2, b.z);
      s.set(b.w, b.h, b.d);
      q.setFromAxisAngle(new Vector3(0, 1, 0), Math.atan2(b.x, b.z));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [blocks]);

  return <instancedMesh ref={ref} args={[UNIT_BOX, material, blocks.length]} name="distant-city" />;
}
