"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Group, InstancedMesh, Matrix4, Mesh, Vector3, Quaternion } from "three";
import { experience } from "@/lib/experience";
import { clamp, ease, segment } from "@/lib/math";
import { FLOOR_H, PODIUM_LEVEL_H, TOWER_BASE, TOWER_FLOORS } from "@/lib/tower";
import { UNIT_BOX } from "./PieceInstances";
import type { ArchitectureMaterials } from "./materials";

const BASE = new Vector3(36, 0, -7);
const SEG = 6;
const MAST_W = 2.4;
const MAX_SEGMENTS = 38;
const JIB_LEN = 64;
const JIB_SEG = 3.2;
const JIB_COUNT = Math.round(JIB_LEN / JIB_SEG);
const CJ_COUNT = 5;

const _m = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();

/** Current height of the built structure, derived from the construction phases. */
export function builtHeight() {
  const { core, structure, roof } = experience.phases;
  const podium = segment(core, 0.35, 0.6) * PODIUM_LEVEL_H * 4;
  const floors = clamp(structure / 0.91, 0, 1) * TOWER_FLOORS;
  return Math.max(podium, structure > 0 ? TOWER_BASE + floors * FLOOR_H : 0) + roof * 20;
}

/**
 * Luffing tower crane that climbs with the building in 6 m jacking steps, slews
 * slowly while the structure rises and is dismantled before the reveal.
 */
export function Crane({ materials }: { materials: ArchitectureMaterials }) {
  const root = useRef<Group>(null);
  const top = useRef<Group>(null);
  const mast = useRef<InstancedMesh>(null);
  const jib = useRef<InstancedMesh>(null);
  const cable = useRef<Mesh>(null);
  const hook = useRef<Mesh>(null);
  const last = useRef(-1);

  useLayoutEffect(() => {
    const j = jib.current;
    if (!j) return;
    // Jib (toward the tower, -X) and counter-jib (+X)
    for (let i = 0; i < JIB_COUNT; i++) {
      _p.set(-(i + 0.5) * JIB_SEG - MAST_W / 2, 1, 0);
      _s.set(JIB_SEG, 1.8, 1.8);
      j.setMatrixAt(i, _m.compose(_p, _q.identity(), _s));
    }
    for (let i = 0; i < CJ_COUNT; i++) {
      _p.set((i + 0.5) * JIB_SEG + MAST_W / 2, 1, 0);
      _s.set(JIB_SEG, 1.6, 2.2);
      j.setMatrixAt(JIB_COUNT + i, _m.compose(_p, _q.identity(), _s));
    }
    // Apex
    _p.set(0, 5.5, 0);
    _s.set(MAST_W * 0.7, 9, MAST_W * 0.7);
    j.setMatrixAt(JIB_COUNT + CJ_COUNT, _m.compose(_p, _q.identity(), _s));
    j.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (last.current === experience.version) return;
    last.current = experience.version;
    const g = root.current;
    const m = mast.current;
    const t = top.current;
    if (!g || !m || !t || !cable.current || !hook.current) return;

    const { craneIn, craneOut } = experience.phases;
    const appear = ease.outCubic(craneIn);
    const leave = ease.inOutCubic(craneOut);
    g.visible = craneIn > 0 && craneOut < 1;
    if (!g.visible) return;

    const target = Math.min(Math.max(42, builtHeight() + 18), MAX_SEGMENTS * SEG);
    const height = target * appear * (1 - leave);
    const segments = Math.max(1, Math.ceil(height / SEG));
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      if (i < segments) {
        _p.set(0, i * SEG + SEG / 2, 0);
        _s.set(MAST_W, SEG, MAST_W);
      } else {
        _s.set(0, 0, 0);
      }
      m.setMatrixAt(i, _m.compose(_p, _q.identity(), _s));
    }
    m.instanceMatrix.needsUpdate = true;

    const topY = segments * SEG;
    t.position.set(0, topY, 0);
    // Slow slewing tied to scroll
    t.rotation.y = 0.18 + Math.sin(experience.progress * 14) * 0.42;
    t.scale.setScalar(Math.min(1, appear * 1.4) * (1 - leave * 0.999));

    // Trolley + hook hanging toward the working floor
    const trolley = -28 - Math.sin(experience.progress * 9) * 10;
    const hookY = Math.max(builtHeight() + 6, 8) - topY;
    const len = Math.max(0.5, -hookY);
    cable.current.position.set(trolley, -len / 2, 0);
    cable.current.scale.set(0.06, len, 0.06);
    hook.current.position.set(trolley, -len - 0.6, 0);
  });

  return (
    <group ref={root} position={BASE} name="tower-crane" visible={false}>
      <instancedMesh
        ref={mast}
        args={[UNIT_BOX, materials.crane, MAX_SEGMENTS]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      {/* Crane base */}
      <mesh geometry={UNIT_BOX} material={materials.craneSolid} position={[0, 0.6, 0]} scale={[6, 1.2, 6]} receiveShadow castShadow />
      <group ref={top}>
        <instancedMesh
          ref={jib}
          args={[UNIT_BOX, materials.crane, JIB_COUNT + CJ_COUNT + 1]}
          castShadow
          frustumCulled={false}
        />
        {/* Cab, counterweight, slewing ring */}
        <mesh geometry={UNIT_BOX} material={materials.craneSolid} position={[-MAST_W, -0.6, 1.9]} scale={[2.2, 2.4, 2]} castShadow />
        <mesh geometry={UNIT_BOX} material={materials.concrete} position={[CJ_COUNT * JIB_SEG - 2, -0.4, 0]} scale={[3.4, 3, 2.6]} castShadow />
        <mesh geometry={UNIT_BOX} material={materials.craneSolid} position={[0, -0.2, 0]} scale={[MAST_W * 1.3, 0.8, MAST_W * 1.3]} castShadow />
        <mesh ref={cable} geometry={UNIT_BOX} material={materials.metal} castShadow={false} />
        <mesh ref={hook} geometry={UNIT_BOX} material={materials.craneSolid} scale={[0.9, 1.2, 0.9]} castShadow />
      </group>
    </group>
  );
}
