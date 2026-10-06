/**
 * Procedural architecture for AURELIS — SKYLINE TOWER.
 *
 * The tower is described as data: a podium, three stepped tower tiers, recessed sky
 * gardens and a sculpted crown. Every structural / façade element becomes a `Piece`
 * so the construction timeline can assemble it individually. Swapping in a real GLB
 * later only requires replacing the components that consume these arrays.
 *
 * Units are metres. +Y is up, +Z faces the main approach, the sun arrives from -X.
 */
import type { Piece } from "./pieces";
import { rng } from "./math";

export const FLOOR_H = 3.7;
export const SLAB_T = 0.45;
export const PODIUM_LEVEL_H = 5.2;
export const PODIUM_LEVELS = 4;
export const TOWER_BASE = PODIUM_LEVEL_H * PODIUM_LEVELS; // 20.8
export const TOWER_FLOORS = 44;
export const SKY_GARDENS = new Set([12, 30]);

export interface Footprint {
  w: number;
  d: number;
  cx: number;
  cz: number;
}

export const TIER_A: Footprint = { w: 36, d: 26, cx: 0, cz: 0 };
export const TIER_B: Footprint = { w: 30, d: 23, cx: -3, cz: -1.5 };
export const TIER_C: Footprint = { w: 24, d: 20, cx: -6, cz: -3 };
export const PODIUM: Footprint = { w: 58, d: 42, cx: 0, cz: 3 };
export const PIT: Footprint = { w: 70, d: 54, cx: 0, cz: 3 };
export const PIT_DEPTH = 8;
export const CORE = { w: 11, d: 8.5, cx: -4, cz: -2 };

export const tierOf = (k: number): Footprint => (k < 24 ? TIER_A : k < 36 ? TIER_B : TIER_C);
export const floorY = (k: number) => TOWER_BASE + k * FLOOR_H;
export const ROOF_Y = floorY(TOWER_FLOORS);
export const CROWN_TOP = ROOF_Y + 20;

/** Structure timing: when floor k begins to assemble (phase value 0 → 1). */
const structureStart = (k: number) => (k / TOWER_FLOORS) * 0.91;
/** Façade timing: floors clad a few levels behind the structure. */
const facadeStart = (k: number) => (k / TOWER_FLOORS) * 0.9;

type Side = {
  /** unit outward normal (x or z) */
  nx: number;
  nz: number;
  /** façade plane coordinate along the normal axis */
  plane: number;
  /** start / length along the tangent axis */
  from: number;
  len: number;
  /** tangent is x when the side faces ±z */
  tangentX: boolean;
  /** is it a long face (front / back)? */
  primary: boolean;
};

/** Sides in perimeter order: front → right → back → left. */
export function sidesOf(f: Footprint): Side[] {
  const x0 = f.cx - f.w / 2;
  const x1 = f.cx + f.w / 2;
  const z0 = f.cz - f.d / 2;
  const z1 = f.cz + f.d / 2;
  return [
    { nx: 0, nz: 1, plane: z1, from: x0, len: f.w, tangentX: true, primary: true },
    { nx: 1, nz: 0, plane: x1, from: z1, len: -f.d, tangentX: false, primary: false },
    { nx: 0, nz: -1, plane: z0, from: x1, len: -f.w, tangentX: true, primary: true },
    { nx: -1, nz: 0, plane: x0, from: z0, len: f.d, tangentX: false, primary: false },
  ];
}

export const modulesOf = (len: number, target = 3) => Math.max(2, Math.round(Math.abs(len) / target));

export interface TowerData {
  foundation: { raft: Piece[]; walls: Piece[] };
  concrete: Piece[]; // columns, beams, basement columns
  core: Piece[];
  slabs: Piece[];
  glass: Piece[];
  frames: Piece[]; // fins, louvres, rails, crown
  balustrades: Piece[];
  planters: Piece[];
  balconies: { slabs: Piece[]; glass: Piece[]; rails: Piece[] };
  roof: { core: Piece[]; frames: Piece[]; metal: Piece[]; parapet: Piece[] };
  stats: { floors: number; height: number; glassPanels: number };
}

export function buildTower(): TowerData {
  const rand = rng(1984);
  const raft: Piece[] = [];
  const walls: Piece[] = [];
  const concrete: Piece[] = [];
  const core: Piece[] = [];
  const slabs: Piece[] = [];
  const glass: Piece[] = [];
  const frames: Piece[] = [];
  const balustrades: Piece[] = [];
  const planters: Piece[] = [];
  const metal: Piece[] = [];
  const balconySlabs: Piece[] = [];
  const balconyGlass: Piece[] = [];
  const balconyRails: Piece[] = [];
  const roofCore: Piece[] = [];
  const roofFrames: Piece[] = [];
  const parapet: Piece[] = [];

  /* ---------------------------------------------------------------- */
  /* Foundation: raft pads inside the excavation                       */
  /* ---------------------------------------------------------------- */
  const padsX = 8;
  const padsZ = 6;
  const padW = (PIT.w - 6) / padsX;
  const padD = (PIT.d - 6) / padsZ;
  const raftTop = -PIT_DEPTH + 1.6;
  for (let i = 0; i < padsX; i++) {
    for (let j = 0; j < padsZ; j++) {
      const x = PIT.cx - PIT.w / 2 + 3 + padW * (i + 0.5);
      const z = PIT.cz - PIT.d / 2 + 3 + padD * (j + 0.5);
      const dist = Math.hypot(x - PIT.cx, z - PIT.cz) / Math.hypot(PIT.w / 2, PIT.d / 2);
      raft.push({
        x,
        y: raftTop - 0.8,
        z,
        sx: padW - 0.35,
        sy: 1.6,
        sz: padD - 0.35,
        phase: "foundation",
        start: 0.32 + dist * 0.42,
        dur: 0.2,
        anim: "rise",
        amt: 4,
      });
    }
  }

  /* Basement retaining walls (lining the pit) */
  const wallT = 0.8;
  const wallH = PIT_DEPTH - 0.6;
  const wy = -PIT_DEPTH + 0.6 + wallH / 2 - 0.3;
  const pw = [
    { x: PIT.cx, z: PIT.cz + PIT.d / 2 - wallT / 2, sx: PIT.w, sz: wallT },
    { x: PIT.cx, z: PIT.cz - PIT.d / 2 + wallT / 2, sx: PIT.w, sz: wallT },
    { x: PIT.cx - PIT.w / 2 + wallT / 2, z: PIT.cz, sx: wallT, sz: PIT.d },
    { x: PIT.cx + PIT.w / 2 - wallT / 2, z: PIT.cz, sx: wallT, sz: PIT.d },
  ];
  pw.forEach((w, i) =>
    walls.push({ ...w, y: wy, sy: wallH, phase: "foundation", start: 0.18 + i * 0.04, dur: 0.18, anim: "grow" }),
  );

  /* ---------------------------------------------------------------- */
  /* Core phase: basement columns, ground deck, podium frame           */
  /* ---------------------------------------------------------------- */
  const bCols = { nx: 7, nz: 5 };
  for (let i = 0; i < bCols.nx; i++) {
    for (let j = 0; j < bCols.nz; j++) {
      const x = PIT.cx - PIT.w / 2 + 6 + ((PIT.w - 12) / (bCols.nx - 1)) * i;
      const z = PIT.cz - PIT.d / 2 + 6 + ((PIT.d - 12) / (bCols.nz - 1)) * j;
      const h = -raftTop - 0.6;
      concrete.push({
        x,
        y: raftTop + h / 2,
        z,
        sx: 0.9,
        sy: h,
        sz: 0.9,
        phase: "core",
        start: ((i + j) / (bCols.nx + bCols.nz)) * 0.18,
        dur: 0.14,
        anim: "grow",
      });
    }
  }

  // Ground deck: closes the excavation as a sequence of strips.
  const strips = 8;
  for (let i = 0; i < strips; i++) {
    const sw = PIT.w / strips;
    slabs.push({
      x: PIT.cx - PIT.w / 2 + sw * (i + 0.5),
      y: -0.3,
      z: PIT.cz,
      sx: sw - 0.04,
      sy: 0.6,
      sz: PIT.d,
      phase: "core",
      start: 0.2 + i * 0.025,
      dur: 0.14,
      anim: "rise",
      amt: 6,
    });
  }

  // Podium columns + slabs
  for (let l = 0; l < PODIUM_LEVELS; l++) {
    const y0 = l * PODIUM_LEVEL_H;
    const h = PODIUM_LEVEL_H - 0.6;
    const cols = perimeterPoints(PODIUM, 1.6, 8.2);
    cols.forEach(([x, z], ci) =>
      concrete.push({
        x,
        y: y0 + h / 2,
        z,
        sx: 1.0,
        sy: h,
        sz: 1.0,
        phase: "core",
        start: 0.4 + l * 0.13 + (ci / cols.length) * 0.05,
        dur: 0.1,
        anim: "grow",
      }),
    );
    slabs.push({
      x: PODIUM.cx,
      y: y0 + PODIUM_LEVEL_H - 0.3,
      z: PODIUM.cz,
      sx: PODIUM.w + 0.8,
      sy: 0.6,
      sz: PODIUM.d + 0.8,
      phase: "core",
      start: 0.46 + l * 0.13,
      dur: 0.1,
      anim: "drop",
      amt: 6,
    });
  }

  /* ---------------------------------------------------------------- */
  /* Core: rises through the podium and leads the tower structure      */
  /* ---------------------------------------------------------------- */
  for (let l = 0; l < PODIUM_LEVELS; l++) {
    core.push({
      x: CORE.cx,
      y: l * PODIUM_LEVEL_H + PODIUM_LEVEL_H / 2,
      z: CORE.cz,
      sx: CORE.w,
      sy: PODIUM_LEVEL_H,
      sz: CORE.d,
      phase: "core",
      start: 0.34 + l * 0.12,
      dur: 0.12,
      anim: "grow",
    });
  }
  for (let k = 0; k < TOWER_FLOORS; k++) {
    const lead = 4;
    core.push({
      x: CORE.cx,
      y: floorY(k) + FLOOR_H / 2,
      z: CORE.cz,
      sx: CORE.w,
      sy: FLOOR_H,
      sz: CORE.d,
      phase: "structure",
      start: Math.max(0, structureStart(k - lead)),
      dur: 0.05,
      anim: "grow",
    });
  }

  /* ---------------------------------------------------------------- */
  /* Tower structure: slabs, beams, columns                            */
  /* ---------------------------------------------------------------- */
  for (let k = 1; k <= TOWER_FLOORS; k++) {
    const f = tierOf(Math.min(k - 1, TOWER_FLOORS - 1));
    const s = structureStart(k - 1) + 0.03;
    slabs.push({
      x: f.cx,
      y: floorY(k) - SLAB_T / 2,
      z: f.cz,
      sx: f.w + 0.36,
      sy: SLAB_T,
      sz: f.d + 0.36,
      phase: "structure",
      start: s,
      dur: 0.05,
      anim: "drop",
      amt: 9,
    });
    // Perimeter edge beams just below the slab
    const by = floorY(k) - SLAB_T - 0.3;
    const beams = [
      { x: f.cx, z: f.cz + f.d / 2 - 0.9, sx: f.w - 1.2, sz: 0.5 },
      { x: f.cx, z: f.cz - f.d / 2 + 0.9, sx: f.w - 1.2, sz: 0.5 },
      { x: f.cx + f.w / 2 - 0.9, z: f.cz, sx: 0.5, sz: f.d - 1.2 },
      { x: f.cx - f.w / 2 + 0.9, z: f.cz, sx: 0.5, sz: f.d - 1.2 },
    ];
    beams.forEach((b, i) =>
      concrete.push({
        ...b,
        y: by,
        sy: 0.6,
        phase: "structure",
        start: s - 0.012 + i * 0.003,
        dur: 0.04,
        anim: i < 2 ? "stretchX" : "stretchZ",
      }),
    );
  }

  for (let k = 0; k < TOWER_FLOORS; k++) {
    const f = tierOf(k);
    const h = FLOOR_H - SLAB_T;
    const pts = perimeterPoints(f, 1.3, 7.5);
    pts.forEach(([x, z], ci) =>
      concrete.push({
        x,
        y: floorY(k) + h / 2,
        z,
        sx: 0.85,
        sy: h,
        sz: 0.85,
        phase: "structure",
        start: structureStart(k) + (ci / pts.length) * 0.02,
        dur: 0.035,
        anim: "grow",
      }),
    );
  }

  /* ---------------------------------------------------------------- */
  /* Podium façade: double-height lobby glass + horizontal louvres     */
  /* ---------------------------------------------------------------- */
  sidesOf(PODIUM).forEach((side, si) => {
    const n = modulesOf(side.len, 4.2);
    const mod = side.len / n;
    for (let l = 0; l < PODIUM_LEVELS; l++) {
      const y0 = l * PODIUM_LEVEL_H;
      const gh = PODIUM_LEVEL_H - 0.6;
      for (let i = 0; i < n; i++) {
        const along = side.from + mod * (i + 0.5);
        const order = (si * n + i) / (4 * n);
        glass.push(
          panel(side, along, Math.abs(mod) - 0.3, y0 + gh / 2, gh, 0, {
            phase: "facade",
            start: 0.005 + l * 0.012 + order * 0.03,
            dur: 0.03,
          }, rand),
        );
        // mullions
        const ma = side.from + mod * i;
        frames.push(
          fin(side, ma, y0 + PODIUM_LEVEL_H / 2 - 0.3, PODIUM_LEVEL_H, 0.25, 0.5, {
            phase: "facade",
            start: l * 0.012 + order * 0.03,
            dur: 0.03,
          }),
        );
      }
      // Horizontal louvres on the upper podium levels
      if (l > 0) {
        for (let b = 0; b < 3; b++) {
          const y = y0 + 1.3 + b * 1.25;
          const mid = side.from + side.len / 2;
          const long = Math.abs(side.len) + 1.2;
          const off = 0.75;
          frames.push({
            x: side.tangentX ? mid : side.plane + side.nx * off,
            y,
            z: side.tangentX ? side.plane + side.nz * off : mid,
            sx: side.tangentX ? long : 0.5,
            sy: 0.16,
            sz: side.tangentX ? 0.5 : long,
            phase: "facade",
            start: 0.03 + l * 0.012 + b * 0.004 + si * 0.003,
            dur: 0.04,
            anim: side.tangentX ? "stretchX" : "stretchZ",
          });
        }
      }
    }
  });

  /* ---------------------------------------------------------------- */
  /* Tower façade: glass, fins, sky gardens, balconies                 */
  /* ---------------------------------------------------------------- */
  let glassCount = 0;
  for (let k = 0; k < TOWER_FLOORS; k++) {
    const f = tierOf(k);
    const sides = sidesOf(f);
    const isSky = SKY_GARDENS.has(k);
    const gh = FLOOR_H - SLAB_T - 0.06;
    const gy = floorY(k) + gh / 2 + 0.03;
    const totalModules = sides.reduce((acc, s) => acc + modulesOf(s.len), 0);
    let j = 0;
    const fs = facadeStart(k);

    sides.forEach((side) => {
      const n = modulesOf(side.len);
      const mod = side.len / n;
      for (let i = 0; i < n; i++) {
        const order = j / totalModules;
        const along = side.from + mod * (i + 0.5);
        glass.push(
          panel(side, along, Math.abs(mod) - 0.26, gy, gh, isSky ? 2.6 : 0, {
            phase: "facade",
            start: fs + 0.01 + order * 0.05,
            dur: 0.022,
          }, rand),
        );
        glassCount++;
        // vertical fin at the module boundary
        const depth = side.primary ? (i % 3 === 0 ? 1.55 : 0.85) : i === 0 ? 1.0 : 0.6;
        frames.push(
          fin(side, side.from + mod * i, floorY(k) - SLAB_T + FLOOR_H / 2, FLOOR_H, 0.24, depth, {
            phase: "facade",
            start: fs + order * 0.05,
            dur: 0.03,
          }),
        );
        j++;
      }

      // Sky garden planters (inside the recessed glass line)
      if (isSky) {
        const mid = side.from + side.len / 2;
        const len = Math.abs(side.len) - 3;
        planters.push({
          x: side.tangentX ? mid : side.plane - side.nx * 1.3,
          y: floorY(k) + 0.45,
          z: side.tangentX ? side.plane - side.nz * 1.3 : mid,
          sx: side.tangentX ? len : 1.1,
          sy: 0.9,
          sz: side.tangentX ? 1.1 : len,
          phase: "balconies",
          start: k / TOWER_FLOORS * 0.8,
          dur: 0.1,
          anim: "pop",
        });
      }
    });

    // Balconies: staggered two-bay cantilevers on the front elevation
    if (k >= 2 && k < 36 && !isSky && k !== 23 && k !== 35) {
      const front = sides[0];
      const n = modulesOf(front.len);
      const mod = front.len / n;
      const offset = (k % 2) * 2;
      for (let i = 0; i < n - 1; i++) {
        if ((i + offset) % 4 !== 0) continue;
        const cx = front.from + mod * (i + 1);
        const bw = mod * 2 - 0.35;
        const depth = 2.4;
        const z = front.plane + depth / 2;
        const start = (k / 36) * 0.86 + (i / n) * 0.04;
        const win = { phase: "balconies" as const, start, dur: 0.07 };
        balconySlabs.push({ x: cx, y: floorY(k) - 0.15, z, sx: bw, sy: 0.3, sz: depth, ...win, anim: "slide", dir: [0, 0, -1], amt: depth });
        balconyGlass.push({
          x: cx,
          y: floorY(k) + 0.55,
          z: front.plane + depth - 0.05,
          sx: bw,
          sy: 1.1,
          sz: 0.05,
          ...win,
          start: start + 0.02,
          anim: "slide",
          dir: [0, 0, -1],
          amt: depth,
        });
        balconyRails.push({
          x: cx,
          y: floorY(k) + 1.12,
          z: front.plane + depth - 0.05,
          sx: bw,
          sy: 0.06,
          sz: 0.14,
          ...win,
          start: start + 0.03,
          anim: "slide",
          dir: [0, 0, -1],
          amt: depth,
        });
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Setback terraces (roofs of tier A and tier B)                     */
  /* ---------------------------------------------------------------- */
  const terraces = [
    { lower: TIER_A, upper: TIER_B, k: 24, start: 0.72 },
    { lower: TIER_B, upper: TIER_C, k: 36, start: 0.86 },
  ];
  terraces.forEach(({ lower, upper, k, start }) => {
    const y = floorY(k);
    const frontDepth = lower.cz + lower.d / 2 - (upper.cz + upper.d / 2);
    // Front edge planter + glass balustrade
    const fz = lower.cz + lower.d / 2;
    const rx = lower.cx + lower.w / 2;
    planters.push({
      x: lower.cx, y: y + 0.4, z: fz - 0.8, sx: lower.w - 1.5, sy: 0.8, sz: 1.2,
      phase: "balconies", start, dur: 0.1, anim: "pop",
    });
    planters.push({
      x: rx - 0.8, y: y + 0.4, z: lower.cz - frontDepth / 2, sx: 1.2, sy: 0.8, sz: lower.d - frontDepth - 1.5,
      phase: "balconies", start: start + 0.03, dur: 0.1, anim: "pop",
    });
    balustrades.push({
      x: lower.cx, y: y + 0.6, z: fz + 0.35, sx: lower.w + 0.6, sy: 1.2, sz: 0.05,
      phase: "balconies", start: start + 0.04, dur: 0.08, anim: "stretchX",
    });
    balustrades.push({
      x: rx + 0.35, y: y + 0.6, z: lower.cz, sx: 0.05, sy: 1.2, sz: lower.d + 0.6,
      phase: "balconies", start: start + 0.05, dur: 0.08, anim: "stretchZ",
    });
  });

  /* ---------------------------------------------------------------- */
  /* Rooftop: core overrun, plant, sculpted crown                      */
  /* ---------------------------------------------------------------- */
  roofCore.push({
    x: CORE.cx, y: ROOF_Y + 3.5, z: CORE.cz, sx: CORE.w, sy: 7, sz: CORE.d,
    phase: "roof", start: 0, dur: 0.25, anim: "grow",
  });
  const mech = [
    { x: CORE.cx + 9, z: CORE.cz - 5, sx: 6, sy: 3.2, sz: 4.5 },
    { x: CORE.cx + 9, z: CORE.cz + 2, sx: 6, sy: 2.6, sz: 4.5 },
    { x: CORE.cx - 8.5, z: CORE.cz + 4.5, sx: 4, sy: 2.4, sz: 7 },
  ];
  mech.forEach((m, i) =>
    metal.push({ ...m, y: ROOF_Y + m.sy / 2, phase: "roof", start: 0.1 + i * 0.06, dur: 0.2, anim: "rise", amt: 4 }),
  );

  // Crown fins continue the façade rhythm and rise toward the front-left corner.
  const crownSides = sidesOf(TIER_C);
  const crownModule = 1.5;
  const crownTotal = crownSides.reduce((a, s) => a + modulesOf(s.len, crownModule), 0);
  let cj = 0;
  crownSides.forEach((side) => {
    const n = modulesOf(side.len, crownModule);
    const mod = side.len / n;
    for (let i = 0; i < n; i++) {
      const along = side.from + mod * i;
      const px = side.tangentX ? along : side.plane;
      const pz = side.tangentX ? side.plane : along;
      // distance to the front-left corner drives height → sculpted silhouette
      const cornerX = TIER_C.cx - TIER_C.w / 2;
      const cornerZ = TIER_C.cz + TIER_C.d / 2;
      const dn = Math.hypot(px - cornerX, pz - cornerZ) / Math.hypot(TIER_C.w, TIER_C.d);
      const h = 9 + (1 - Math.min(1, dn)) * 11;
      roofFrames.push(
        fin(side, along, ROOF_Y - SLAB_T + h / 2, h, 0.42, side.primary ? 1.4 : 1.1, {
          phase: "roof",
          start: 0.25 + (cj / crownTotal) * 0.45,
          dur: 0.18,
        }),
      );
      cj++;
    }
  });
  // Crown bands tying the fins together
  const bandY = ROOF_Y + 7.2;
  const c = TIER_C;
  const bands = [
    { x: c.cx, z: c.cz + c.d / 2 + 0.5, sx: c.w + 1.4, sz: 0.35, a: "stretchX" as const },
    { x: c.cx, z: c.cz - c.d / 2 - 0.5, sx: c.w + 1.4, sz: 0.35, a: "stretchX" as const },
    { x: c.cx + c.w / 2 + 0.5, z: c.cz, sx: 0.35, sz: c.d + 1.4, a: "stretchZ" as const },
    { x: c.cx - c.w / 2 - 0.5, z: c.cz, sx: 0.35, sz: c.d + 1.4, a: "stretchZ" as const },
  ];
  bands.forEach((b, i) =>
    roofFrames.push({ x: b.x, y: bandY, z: b.z, sx: b.sx, sy: 0.5, sz: b.sz, phase: "roof", start: 0.72 + i * 0.05, dur: 0.15, anim: b.a }),
  );
  // Parapet / roof edge
  parapet.push({
    x: c.cx, y: ROOF_Y + 0.6, z: c.cz, sx: c.w + 0.6, sy: 1.2, sz: c.d + 0.6,
    phase: "roof", start: 0.0, dur: 0.12, anim: "grow",
  });

  return {
    foundation: { raft, walls },
    concrete,
    core,
    slabs,
    glass,
    frames,
    balustrades,
    planters,
    balconies: { slabs: balconySlabs, glass: balconyGlass, rails: balconyRails },
    roof: { core: roofCore, frames: roofFrames, metal, parapet },
    stats: { floors: TOWER_FLOORS + PODIUM_LEVELS, height: CROWN_TOP, glassPanels: glassCount },
  };
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function perimeterPoints(f: Footprint, inset: number, spacing: number): [number, number][] {
  const x0 = f.cx - f.w / 2 + inset;
  const x1 = f.cx + f.w / 2 - inset;
  const z0 = f.cz - f.d / 2 + inset;
  const z1 = f.cz + f.d / 2 - inset;
  const nx = Math.max(1, Math.round((x1 - x0) / spacing));
  const nz = Math.max(1, Math.round((z1 - z0) / spacing));
  const pts: [number, number][] = [];
  for (let i = 0; i < nx; i++) pts.push([x0 + ((x1 - x0) / nx) * i, z1]);
  for (let i = 0; i < nz; i++) pts.push([x1, z1 - ((z1 - z0) / nz) * i]);
  for (let i = 0; i < nx; i++) pts.push([x1 - ((x1 - x0) / nx) * i, z0]);
  for (let i = 0; i < nz; i++) pts.push([x0, z0 + ((z1 - z0) / nz) * i]);
  return pts;
}

function panel(
  side: Side,
  along: number,
  width: number,
  y: number,
  h: number,
  inset: number,
  win: { phase: Piece["phase"]; start: number; dur: number },
  rand: () => number,
): Piece {
  const t = 0.08;
  const off = -inset - t / 2 - 0.02;
  // Panels vary subtly (as real IGUs do); a few read lighter where blinds are drawn.
  const blind = rand() < 0.035 ? 0.12 : 0;
  const tone = 0.93 + rand() * 0.11 + blind;
  const tint = rand() * 0.05;
  return {
    x: side.tangentX ? along : side.plane + side.nx * off,
    y,
    z: side.tangentX ? side.plane + side.nz * off : along,
    sx: side.tangentX ? width : t,
    sy: h,
    sz: side.tangentX ? t : width,
    ...win,
    anim: "slide",
    dir: [side.nx, 0, side.nz],
    amt: 1.6,
    color: [tone - tint, tone, tone + tint * 0.6],
  };
}

function fin(
  side: Side,
  along: number,
  y: number,
  h: number,
  thickness: number,
  depth: number,
  win: { phase: Piece["phase"]; start: number; dur: number },
): Piece {
  const off = depth / 2 - 0.15;
  return {
    x: side.tangentX ? along : side.plane + side.nx * off,
    y,
    z: side.tangentX ? side.plane + side.nz * off : along,
    sx: side.tangentX ? thickness : depth,
    sy: h,
    sz: side.tangentX ? depth : thickness,
    ...win,
    anim: "grow",
  };
}
