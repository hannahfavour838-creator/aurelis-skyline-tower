"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
  CylinderGeometry,
  BoxGeometry,
} from "three";
import { experience } from "@/lib/experience";
import { ease, fbm, rng, segment } from "@/lib/math";
import type { Piece } from "@/lib/pieces";
import { buildLandscape, buildRoofTrees, PLAZA, terrainHeight, type Tree } from "@/lib/site";
import { PODIUM, PODIUM_LEVEL_H, PODIUM_LEVELS, TIER_A } from "@/lib/tower";
import { PieceInstances } from "@/components/skyscraper/PieceInstances";
import { withSurfaceVariation } from "@/components/skyscraper/materials";

const CENTER = { x: 0, z: 12 };

/** Adds a radial "unrolling" reveal to a standard material. */
function withRadialReveal<T extends MeshStandardMaterial>(material: T, key: string) {
  const uniform = { value: 0 };
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uReveal = uniform;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRevealPos;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvRevealPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRevealPos;\nuniform float uReveal;")
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        if (length(vRevealPos.xz - vec2(${CENTER.x.toFixed(1)}, ${CENTER.z.toFixed(1)})) > uReveal) discard;`,
      );
  };
  const prevKey = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => `${prevKey()}-reveal-${key}`;
  return { material, uniform };
}

function pavingTexture(maxAnisotropy: number) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(9);
  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile * 2) {
      const v = 232 + Math.floor(rand() * 8);
      ctx.fillStyle = `rgb(${v},${v - 3},${v - 9})`;
      const off = (y / tile) % 2 === 0 ? 0 : tile;
      ctx.fillRect((x + off) % size, y, tile * 2, tile);
      if ((x + off) % size + tile * 2 > size) ctx.fillRect(0, y, ((x + off) % size + tile * 2) - size, tile);
    }
  }
  ctx.strokeStyle = "rgba(160,152,138,0.55)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= size; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    const off = (y / tile) % 2 === 0 ? 0 : tile;
    for (let x = off; x <= size; x += tile * 2) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + tile);
      ctx.stroke();
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

function roundedRect(w: number, d: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function ribbon(points: [number, number][], width: number) {
  const curve = new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)), false, "centripetal");
  const samples = Math.max(40, Math.round(curve.getLength() / 2));
  const pos: number[] = [];
  const idx: number[] = [];
  const tangent = new Vector3();
  const side = new Vector3();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tangent);
    side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
    const l = p.clone().add(side);
    const r = p.clone().sub(side);
    pos.push(l.x, terrainHeight(l.x, l.z) + 0.14, l.z, r.x, terrainHeight(r.x, r.z) + 0.14, r.z);
    if (i < samples) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function crownGeometry() {
  const g = new IcosahedronGeometry(0.5, 3);
  const p = g.attributes.position as BufferAttribute;
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 5 + 3, v.z * 5 + v.y * 4, 3);
    v.multiplyScalar(1 + n * 0.22);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function treePieces(trees: Tree[]) {
  const crowns: Piece[] = [];
  const trunks: Piece[] = [];
  const base = new Color("#8a957c");
  const c = new Color();
  trees.forEach((t) => {
    c.copy(base).multiplyScalar(t.shade);
    crowns.push({
      x: t.x, y: t.y + t.trunk + t.h / 2, z: t.z, sx: t.r * 2, sy: t.h, sz: t.r * 2,
      phase: "landscape", start: t.start + 0.03, dur: 0.12, anim: "pop", color: [c.r / base.r, c.g / base.g, c.b / base.b],
    });
    trunks.push({
      x: t.x, y: t.y + (t.trunk + t.h * 0.3) / 2, z: t.z, sx: 0.32, sy: t.trunk + t.h * 0.3, sz: 0.32,
      phase: "landscape", start: t.start, dur: 0.08, anim: "grow",
    });
  });
  return { crowns, trunks };
}

interface LandscapeProps {
  /** Fraction of meadow trees to keep (mobile uses fewer). */
  density?: number;
}

export function Landscape({ density = 1 }: LandscapeProps) {
  const gl = useThree((s) => s.gl);
  const data = useMemo(() => buildLandscape(), []);

  const built = useMemo(() => {
    const trees = data.trees.filter((t, i) => density >= 1 || t.y < 0.5 || i % Math.round(1 / density) === 0);
    const { crowns, trunks } = treePieces([...trees, ...buildRoofTrees()]);

    const paving = pavingTexture(gl.capabilities.getMaxAnisotropy());
    const pw = PLAZA.x1 - PLAZA.x0;
    const pd = PLAZA.z1 - PLAZA.z0;
    paving.repeat.set(pw / 22, pd / 22);
    const plaza = withRadialReveal(
      new MeshStandardMaterial({ map: paving, color: new Color("#f3f1ec"), roughness: 0.82 }),
      "plaza",
    );
    const lawn = withRadialReveal(
      withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#a9af95"), roughness: 1 }), 0.28, 0.9),
      "lawn",
    );
    const path = new MeshStandardMaterial({ color: new Color("#e4dfd4"), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4 });
    const water = new MeshPhysicalMaterial({ color: new Color("#76888f"), metalness: 0.25, roughness: 0.03, envMapIntensity: 1.5, clearcoat: 1 });
    const stone = new MeshStandardMaterial({ color: new Color("#e7e3da"), roughness: 0.75 });
    const crown = withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#8a957c"), roughness: 0.95 }), 0.3, 2.2);
    const bark = new MeshStandardMaterial({ color: new Color("#8b8277"), roughness: 1 });
    const white = new MeshStandardMaterial({ color: new Color("#f4f2ec"), roughness: 0.45, metalness: 0.1 });
    const lampHead = new MeshStandardMaterial({ color: new Color("#fbf6ea"), emissive: new Color("#ffe6bf"), emissiveIntensity: 0, roughness: 0.4 });

    const plazaGeo = new BoxGeometry(pw, 0.3, pd);
    const lawnGeos = data.lawns.map((l) => {
      const g = new ShapeGeometry(roundedRect(l.w, l.d, l.r), 6);
      g.rotateX(-Math.PI / 2);
      return g;
    });
    const pathGeos = data.paths.map((p) => ribbon(p.points, p.width));
    const crownGeo = crownGeometry();
    const trunkGeo = new CylinderGeometry(0.5, 0.5, 1, 6);

    // Lamps along the avenue
    const posts: Piece[] = data.lamps.map((l) => ({
      x: l.x, y: 2.1, z: l.z, sx: 0.14, sy: 4.2, sz: 0.14, phase: "landscape", start: l.start, dur: 0.08, anim: "grow",
    }));
    const heads: Piece[] = data.lamps.map((l) => ({
      x: l.x, y: 4.3, z: l.z, sx: 0.5, sy: 0.18, sz: 0.5, phase: "landscape", start: l.start + 0.05, dur: 0.06, anim: "pop",
    }));

    // Entrance canopy on the front of the podium
    const canopyZ = PODIUM.cz + PODIUM.d / 2;
    const canopy: Piece[] = [
      { x: 0, y: 6.4, z: canopyZ + 4.6, sx: 24, sy: 0.45, sz: 9.2, phase: "landscape", start: 0.04, dur: 0.12, anim: "slide", dir: [0, 0, -1], amt: 9 },
    ];
    const canopyCols: Piece[] = [-10.5, 10.5].map((x) => ({
      x, y: 3.1, z: canopyZ + 8.4, sx: 0.35, sy: 6.2, sz: 0.35, phase: "landscape", start: 0.12, dur: 0.08, anim: "grow",
    }));

    // Podium roof garden beds around the tower
    const roofY = PODIUM_LEVEL_H * PODIUM_LEVELS;
    const beds: Piece[] = [
      { x: 0, y: roofY + 0.35, z: PODIUM.cz + PODIUM.d / 2 - 3.2, sx: PODIUM.w - 6, sy: 0.7, sz: 4, phase: "landscape", start: 0.4, dur: 0.1, anim: "pop" },
      { x: PODIUM.cx - PODIUM.w / 2 + 3.2, y: roofY + 0.35, z: PODIUM.cz, sx: 4, sy: 0.7, sz: PODIUM.d - 12, phase: "landscape", start: 0.43, dur: 0.1, anim: "pop" },
      { x: PODIUM.cx + PODIUM.w / 2 - 3.2, y: roofY + 0.35, z: PODIUM.cz, sx: 4, sy: 0.7, sz: PODIUM.d - 12, phase: "landscape", start: 0.46, dur: 0.1, anim: "pop" },
      { x: 0, y: roofY + 0.35, z: TIER_A.cz - TIER_A.d / 2 - 2.6, sx: PODIUM.w - 14, sy: 0.7, sz: 2.4, phase: "landscape", start: 0.49, dur: 0.1, anim: "pop" },
    ];

    return {
      crowns, trunks, posts, heads, canopy, canopyCols, beds,
      plaza, lawn, path, water, stone, crown, bark, white, lampHead,
      plazaGeo, lawnGeos, pathGeos, crownGeo, trunkGeo, paving,
    };
  }, [data, density, gl]);

  useEffect(
    () => () => {
      const b = built;
      [b.plaza.material, b.lawn.material, b.path, b.water, b.stone, b.crown, b.bark, b.white, b.lampHead].forEach((m) => m.dispose());
      [b.plazaGeo, ...b.lawnGeos, ...b.pathGeos, b.crownGeo, b.trunkGeo].forEach((g) => g.dispose());
      b.paving.dispose();
    },
    [built],
  );

  const pool = useRef<Mesh>(null);
  const poolRim = useRef<Mesh>(null);
  const plazaMesh = useRef<Mesh>(null);
  const pathMeshes = useRef<(Mesh | null)[]>([]);
  const last = useRef(-1);

  useFrame(() => {
    if (last.current === experience.version) return;
    last.current = experience.version;
    const { landscape, final } = experience.phases;
    const plazaT = ease.inOutCubic(segment(landscape, 0, 0.36));
    built.plaza.uniform.value = plazaT * 135;
    if (plazaMesh.current) plazaMesh.current.visible = plazaT > 0;
    built.lawn.uniform.value = ease.inOutCubic(segment(landscape, 0.14, 0.4)) * 135;

    const poolT = ease.outCubic(segment(landscape, 0.3, 0.22));
    if (pool.current && poolRim.current) {
      pool.current.visible = poolRim.current.visible = poolT > 0;
      const k = Math.max(poolT, 1e-3);
      pool.current.scale.set(1, 1, k);
      poolRim.current.scale.set(1, 1, k);
      pool.current.position.z = poolRim.current.position.z = (data.pool.d * k) / 2;
    }

    data.paths.forEach((p, i) => {
      const m = pathMeshes.current[i];
      if (!m) return;
      const t = ease.inOutCubic(segment(landscape, p.start, 0.5));
      const count = m.geometry.index?.count ?? 0;
      m.geometry.setDrawRange(0, Math.floor((t * count) / 6) * 6);
      m.visible = t > 0;
    });

    built.lampHead.emissiveIntensity = 0.15 + final * 1.4;
  });

  const plazaCx = (PLAZA.x0 + PLAZA.x1) / 2;
  const plazaCz = (PLAZA.z0 + PLAZA.z1) / 2;
  const poolLen = data.pool.d;
  const poolStartZ = data.pool.z - poolLen / 2;

  return (
    <group name="landscape">
      <mesh ref={plazaMesh} geometry={built.plazaGeo} material={built.plaza.material} position={[plazaCx, 0, plazaCz]} receiveShadow visible={false} />
      {data.lawns.map((l, i) => (
        <mesh key={i} geometry={built.lawnGeos[i]} material={built.lawn.material} position={[l.x, 0.17, l.z]} receiveShadow />
      ))}
      {data.paths.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            pathMeshes.current[i] = el;
          }}
          geometry={built.pathGeos[i]}
          material={built.path}
          receiveShadow
          visible={false}
        />
      ))}
      {/* Reflecting pool — grows along the entrance axis */}
      <group position={[data.pool.x, 0, poolStartZ]}>
        <mesh ref={poolRim} material={built.stone} position={[0, 0.22, poolLen / 2]} receiveShadow visible={false}>
          <boxGeometry args={[data.pool.w + 1.6, 0.16, poolLen + 1.6]} />
        </mesh>
        <mesh ref={pool} material={built.water} position={[0, 0.31, poolLen / 2]} visible={false}>
          <boxGeometry args={[data.pool.w, 0.04, poolLen]} />
        </mesh>
      </group>
      <PieceInstances name="tree-trunks" pieces={built.trunks} material={built.bark} geometry={built.trunkGeo} />
      <PieceInstances name="tree-crowns" pieces={built.crowns} material={built.crown} geometry={built.crownGeo} />
      <PieceInstances name="lamp-posts" pieces={built.posts} material={built.white} />
      <PieceInstances name="lamp-heads" pieces={built.heads} material={built.lampHead} castShadow={false} />
      <PieceInstances name="canopy" pieces={built.canopy} material={built.white} />
      <PieceInstances name="canopy-columns" pieces={built.canopyCols} material={built.white} />
      <PieceInstances name="roof-garden" pieces={built.beds} material={built.lawn.material} />
    </group>
  );
}
