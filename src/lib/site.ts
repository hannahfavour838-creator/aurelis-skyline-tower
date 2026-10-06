/**
 * Procedural site planning: terrain height field, survey geometry, construction
 * logistics, landscape and the distant context.
 */
import type { Piece } from "./pieces";
import { PIT, PODIUM, TIER_A } from "./tower";
import { fbm, rng, smoothstep } from "./math";

export const SITE_FLAT_RADIUS = 160;
export const PLAZA = { x0: -78, x1: 78, z0: -50, z1: 80 };

/** Centre line of the river that meanders across the valley behind the site. */
export const riverZ = (x: number) => -430 + Math.sin(x / 260) * 70 + Math.sin(x / 97 + 1.3) * 18;
export const RIVER_LEVEL = -1.6;

/** Terrain height. The development site is a graded, perfectly level plateau. */
export function terrainHeight(x: number, z: number): number {
  const r = Math.hypot(x, z - 10);
  const rolling = smoothstep(SITE_FLAT_RADIUS, 360, r);
  let h = rolling * (fbm(x * 0.0035, z * 0.0035, 4) * 34 + 7);
  // A gentle embankment that cradles the site from behind and to the left
  const ridge = smoothstep(500, 1300, r) * (fbm(x * 0.0012 + 7.1, z * 0.0012 - 3.4, 3) * 0.5 + 0.55);
  h += ridge * 60 * smoothstep(0.1, -0.9, z / (r + 1e-3));
  // Slight dip toward the open horizon at the front-right
  h -= smoothstep(400, 1100, r) * 10;
  // Carve a broad, shallow river valley
  const d = Math.abs(z - riverZ(x));
  const valley = 1 - smoothstep(26, 150, d);
  h = h * (1 - valley) + (RIVER_LEVEL - 1.8) * valley;
  return h;
}

export interface SurveyData {
  grid: Piece[];
  key: Piece[];
  stakes: Piece[];
}

export function buildSurvey(): SurveyData {
  const grid: Piece[] = [];
  const key: Piece[] = [];
  const stakes: Piece[] = [];
  const y = 0.03;
  const W = 0.18;

  // Setting-out grid over the excavation zone
  const gx0 = PIT.cx - PIT.w / 2;
  const gz0 = PIT.cz - PIT.d / 2;
  const step = 6;
  const nx = Math.round(PIT.w / step);
  const nz = Math.round(PIT.d / step);
  for (let i = 0; i <= nx; i++) {
    const x = gx0 + (PIT.w / nx) * i;
    grid.push({ x, y, z: PIT.cz, sx: W, sy: 0.02, sz: PIT.d, phase: "survey", start: 0.05 + (i / nx) * 0.35, dur: 0.25, anim: "stretchZ" });
  }
  for (let j = 0; j <= nz; j++) {
    const z = gz0 + (PIT.d / nz) * j;
    grid.push({ x: PIT.cx, y, z, sx: PIT.w, sy: 0.02, sz: W, phase: "survey", start: 0.1 + (j / nz) * 0.35, dur: 0.25, anim: "stretchX" });
  }

  // Key outlines: tower footprint (champagne) and podium
  const outline = (f: { w: number; d: number; cx: number; cz: number }, width: number, start: number) => {
    const x0 = f.cx - f.w / 2;
    const x1 = f.cx + f.w / 2;
    const z0 = f.cz - f.d / 2;
    const z1 = f.cz + f.d / 2;
    key.push({ x: f.cx, y: y + 0.01, z: z1, sx: f.w + width, sy: 0.02, sz: width, phase: "survey", start, dur: 0.18, anim: "stretchX" });
    key.push({ x: x1, y: y + 0.01, z: f.cz, sx: width, sy: 0.02, sz: f.d, phase: "survey", start: start + 0.05, dur: 0.18, anim: "stretchZ" });
    key.push({ x: f.cx, y: y + 0.01, z: z0, sx: f.w + width, sy: 0.02, sz: width, phase: "survey", start: start + 0.1, dur: 0.18, anim: "stretchX" });
    key.push({ x: x0, y: y + 0.01, z: f.cz, sx: width, sy: 0.02, sz: f.d, phase: "survey", start: start + 0.15, dur: 0.18, anim: "stretchZ" });
    [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([sx, sz], i) =>
      stakes.push({ x: sx, y: 0.7, z: sz, sx: 0.22, sy: 1.4, sz: 0.22, phase: "survey", start: start + 0.2 + i * 0.03, dur: 0.15, anim: "pop" }),
    );
  };
  outline(TIER_A, 0.55, 0.42);
  outline(PODIUM, 0.32, 0.5);

  // Long dashed setting-out axes (interrupted across the excavation)
  const dash = 3.2;
  const gap = 3;
  for (let a = -190; a <= 190; a += dash + gap) {
    const inPitX = a > PIT.cx - PIT.w / 2 - 2 && a < PIT.cx + PIT.w / 2 + 2;
    const inPitZ = a + PIT.cz > PIT.cz - PIT.d / 2 - 2 && a + PIT.cz < PIT.cz + PIT.d / 2 + 2;
    const s = 0.3 + (Math.abs(a) / 190) * 0.5;
    if (!inPitX) grid.push({ x: a, y, z: PIT.cz, sx: dash, sy: 0.02, sz: W * 1.3, phase: "survey", start: s, dur: 0.12, anim: "stretchX" });
    if (!inPitZ) grid.push({ x: 0, y, z: a + PIT.cz, sx: W * 1.3, sy: 0.02, sz: dash, phase: "survey", start: s, dur: 0.12, anim: "stretchZ" });
  }
  return { grid, key, stakes };
}

export interface LogisticsData {
  fence: Piece[];
  cabins: Piece[];
}

export function buildLogistics(): LogisticsData {
  const fence: Piece[] = [];
  const cabins: Piece[] = [];
  const W = 124;
  const D = 104;
  const cz = 6;
  const seg = 4;
  const out = { phase: "landscape" as const, start: 0, dur: 0.14 };
  const add = (x: number, z: number, alongX: boolean, order: number) =>
    fence.push({
      x,
      y: 1.3,
      z,
      sx: alongX ? seg - 0.08 : 0.12,
      sy: 2.6,
      sz: alongX ? 0.12 : seg - 0.08,
      phase: "foundation",
      start: order * 0.22,
      dur: 0.08,
      anim: "grow",
      out,
    });
  const nX = Math.floor(W / seg);
  const nZ = Math.floor(D / seg);
  for (let i = 0; i < nX; i++) {
    const x = -W / 2 + seg * (i + 0.5);
    if (Math.abs(x) > 9) add(x, cz + D / 2, true, i / nX);
    add(x, cz - D / 2, true, i / nX);
  }
  for (let j = 0; j < nZ; j++) {
    const z = cz - D / 2 + seg * (j + 0.5);
    add(-W / 2, z, false, j / nZ);
    add(W / 2, z, false, j / nZ);
  }

  // Site cabins, stacked two-high
  const cab = [
    { x: -50, y: 1.4, z: 44 },
    { x: -50, y: 1.4, z: 47.4 },
    { x: -50, y: 4.25, z: 44 },
    { x: 49, y: 1.4, z: -34 },
  ];
  cab.forEach((c, i) =>
    cabins.push({ ...c, sx: 9, sy: 2.8, sz: 3, phase: "foundation", start: 0.05 + i * 0.06, dur: 0.12, anim: "drop", amt: 6, out: { phase: "landscape", start: 0.02, dur: 0.12 } }),
  );
  return { fence, cabins };
}

export interface Tree {
  x: number;
  y: number;
  z: number;
  /** crown radius */
  r: number;
  /** crown height */
  h: number;
  trunk: number;
  start: number;
  shade: number;
}

export interface LandscapeData {
  trees: Tree[];
  lamps: { x: number; z: number; start: number }[];
  paths: { points: [number, number][]; width: number; start: number }[];
  lawns: { x: number; z: number; w: number; d: number; r: number }[];
  pool: { x: number; z: number; w: number; d: number };
}

const POOL = { x: 0, z: 52, w: 9, d: 38 };

export function buildLandscape(): LandscapeData {
  const rand = rng(77);
  const trees: Tree[] = [];
  const distStart = (x: number, z: number) => 0.24 + Math.min(1, Math.hypot(x, z - 10) / 260) * 0.6;

  // Columnar avenue framing the reflecting pool
  for (let i = 0; i < 7; i++) {
    const z = 32 + i * 7;
    [-12.5, 12.5].forEach((x) =>
      trees.push({ x, y: 0.2, z, r: 1.5, h: 9 + rand() * 1.5, trunk: 1.4, start: 0.3 + i * 0.03, shade: 0.85 + rand() * 0.1 }),
    );
  }

  const scatter = (
    count: number,
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    base: number,
    groundY: number,
    existing = false,
  ) => {
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 40) {
      const x = x0 + rand() * (x1 - x0);
      const z = z0 + rand() * (z1 - z0);
      // keep clear of the building, the avenue and other trees
      if (x > PODIUM.cx - PODIUM.w / 2 - 6 && x < PODIUM.cx + PODIUM.w / 2 + 6 && z > PODIUM.cz - PODIUM.d / 2 - 6 && z < PODIUM.cz + PODIUM.d / 2 + 6) continue;
      if (Math.abs(x) < 19 && z > 20) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + 4)) continue;
      const r = base * (0.75 + rand() * 0.55);
      trees.push({
        x,
        y: groundY >= 0 ? groundY : terrainHeight(x, z),
        z,
        r,
        h: r * (1.5 + rand() * 0.5),
        trunk: r * 0.7,
        // Existing meadow trees are present from the very first frame.
        start: existing ? -1 : distStart(x, z),
        shade: 0.75 + rand() * 0.3,
      });
      placed++;
    }
  };
  // Lawn groves on the plaza
  scatter(16, -74, -40, -44, 74, 3.4, 0.2);
  scatter(12, 40, 74, -44, 74, 3.2, 0.2);
  scatter(6, -38, 38, -48, -30, 3.0, 0.2);
  // Sparse clusters in the surrounding meadow
  for (let c = 0; c < 16; c++) {
    const a = rand() * Math.PI * 2;
    const rr = 160 + rand() * 300;
    const cx = Math.cos(a) * rr;
    const cz = Math.sin(a) * rr + 10;
    scatter(3 + Math.floor(rand() * 5), cx - 24, cx + 24, cz - 24, cz + 24, 4.4, -1, true);
  }

  // Lamp posts along the avenue
  const lamps: LandscapeData["lamps"] = [];
  for (let i = 0; i < 8; i++) {
    const z = 30 + i * 6.4;
    lamps.push({ x: -7.2, z, start: 0.55 + i * 0.03 }, { x: 7.2, z, start: 0.55 + i * 0.03 });
  }

  const paths: LandscapeData["paths"] = [
    { points: [[0, 80], [0, 110], [14, 160], [44, 230], [70, 330]], width: 8, start: 0.08 },
    { points: [[-78, 20], [-110, 26], [-160, 50], [-230, 60], [-300, 90]], width: 3.2, start: 0.18 },
    { points: [[78, -10], [110, -18], [160, -50], [230, -70], [310, -60]], width: 3.2, start: 0.22 },
    { points: [[-40, -50], [-48, -90], [-80, -150], [-100, -230]], width: 3.2, start: 0.26 },
  ];

  const lawns: LandscapeData["lawns"] = [
    { x: -57, z: 15, w: 34, d: 112, r: 6 },
    { x: 57, z: 15, w: 34, d: 112, r: 6 },
    { x: 0, z: -40, w: 70, d: 14, r: 5 },
    { x: -17, z: 52, w: 4, d: 40, r: 1.5 },
    { x: 17, z: 52, w: 4, d: 40, r: 1.5 },
  ];

  return { trees, lamps, paths, lawns, pool: POOL };
}

/** Podium roof garden trees (smaller, on the 4th-level terrace). */
export function buildRoofTrees(): Tree[] {
  const rand = rng(5);
  const trees: Tree[] = [];
  const y = PODIUM_TOP + 0.6;
  const spots: [number, number][] = [
    [-24, 20], [-16, 20], [16, 20], [24, 20], [-25, 8], [25, 8], [-25, -6], [25, -6], [-25, -14], [25, -14],
  ];
  spots.forEach(([x, z], i) =>
    trees.push({ x, y, z, r: 1.8 + rand() * 0.6, h: 3.6 + rand(), trunk: 1.2, start: 0.5 + i * 0.025, shade: 0.8 + rand() * 0.2 }),
  );
  return trees;
}
const PODIUM_TOP = 20.8;

export interface CityBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export function buildDistantCity(count: number): CityBlock[] {
  const rand = rng(301);
  const blocks: CityBlock[] = [];
  for (let i = 0; i < count; i++) {
    // Cluster behind and to the left of the site, leaving the right horizon open
    const a = -Math.PI / 2 - 0.15 - (rand() - 0.25) * 1.3;
    const r = 1850 + rand() * 500;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const centre = Math.exp(-Math.pow((a + Math.PI / 2 + 0.2) / 0.35, 2));
    const h = 10 + rand() * 26 + centre * (30 + rand() * 120);
    const w = 14 + rand() * 22;
    blocks.push({ x, z, w, d: w * (0.6 + rand() * 0.8), h });
  }
  return blocks;
}
