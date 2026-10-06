import { Matrix4, Quaternion, Vector3 } from "three";
import type { PhaseKey, Phases } from "./experience";
import { ease, segment } from "./math";

/**
 * A "piece" is one physical architectural element (a slab, a column, a glass panel…).
 * Every piece knows its final transform and the window of a construction phase during
 * which it assembles. The renderer turns pieces into instanced matrices each time the
 * construction state changes.
 */
export type PieceAnim =
  | "rise" // emerges from below and settles with a slight overshoot
  | "drop" // is lowered into place from above (as if by crane)
  | "grow" // extrudes upward from its base
  | "slide" // glides in along a direction while unfolding vertically
  | "pop" // scales up from its base (trees, planters)
  | "stretchX" // draws along X from its min edge
  | "stretchZ"; // draws along Z from its min edge

export interface PieceWindow {
  phase: PhaseKey;
  start: number;
  dur: number;
}

export interface Piece extends PieceWindow {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rotY?: number;
  anim: PieceAnim;
  /** Travel distance for rise/drop/slide. */
  amt?: number;
  /** Direction for slide (unit vector). */
  dir?: [number, number, number];
  /** Optional removal window: the piece sinks / retracts away. */
  out?: PieceWindow;
  /** Optional per-instance colour (linear RGB multipliers). */
  color?: [number, number, number];
}

const _pos = new Vector3();
const _scl = new Vector3();
const _quat = new Quaternion();
const _axis = new Vector3(0, 1, 0);
export const ZERO_MATRIX = new Matrix4().makeScale(0, 0, 0);

/** Writes the animated matrix of `p` into `target`. Returns false if invisible. */
export function evaluatePiece(p: Piece, phases: Phases, target: Matrix4): boolean {
  const t = segment(phases[p.phase], p.start, p.dur);
  if (t <= 0) {
    target.copy(ZERO_MATRIX);
    return false;
  }

  let x = p.x;
  let y = p.y;
  let z = p.z;
  let sx = p.sx;
  let sy = p.sy;
  let sz = p.sz;

  switch (p.anim) {
    case "rise": {
      const e = ease.outBack(t, 0.6);
      y -= (p.amt ?? sy * 1.4) * (1 - e);
      break;
    }
    case "drop": {
      const e = ease.outCubic(t);
      y += (p.amt ?? 8) * (1 - e);
      break;
    }
    case "grow": {
      const e = ease.outCubic(t);
      const base = p.y - p.sy / 2;
      sy = Math.max(p.sy * e, 1e-4);
      y = base + sy / 2;
      break;
    }
    case "slide": {
      const e = ease.outQuart(t);
      const d = p.dir ?? [0, 0, 1];
      const k = (p.amt ?? 1.2) * (1 - e);
      x += d[0] * k;
      y += d[1] * k;
      z += d[2] * k;
      sy = Math.max(p.sy * ease.outCubic(Math.min(1, t * 1.4)), 1e-4);
      break;
    }
    case "pop": {
      const e = ease.outBack(t, 1.2);
      const base = p.y - p.sy / 2;
      sx *= e;
      sz *= e;
      sy = Math.max(p.sy * e, 1e-4);
      y = base + sy / 2;
      break;
    }
    case "stretchX": {
      const e = ease.inOutCubic(t);
      const min = p.x - p.sx / 2;
      sx = Math.max(p.sx * e, 1e-4);
      x = min + sx / 2;
      break;
    }
    case "stretchZ": {
      const e = ease.inOutCubic(t);
      const min = p.z - p.sz / 2;
      sz = Math.max(p.sz * e, 1e-4);
      z = min + sz / 2;
      break;
    }
  }

  if (p.out) {
    const u = segment(phases[p.out.phase], p.out.start, p.out.dur);
    if (u >= 1) {
      target.copy(ZERO_MATRIX);
      return false;
    }
    if (u > 0) {
      const e = ease.inOutCubic(u);
      const base = y - sy / 2;
      sy = Math.max(sy * (1 - e), 1e-4);
      y = base + sy / 2;
    }
  }

  _pos.set(x, y, z);
  _scl.set(sx, sy, sz);
  _quat.setFromAxisAngle(_axis, p.rotY ?? 0);
  target.compose(_pos, _quat, _scl);
  return true;
}
