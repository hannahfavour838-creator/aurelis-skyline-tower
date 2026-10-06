"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { experience } from "@/lib/experience";
import { clamp } from "@/lib/math";

/**
 * Cinematic camera path.
 * Each key = [t, px, py, pz, tx, ty, tz, fov, shift]. The path is interpolated with a
 * time-parameterised cubic Hermite spline (Catmull-Rom tangents), so the camera never
 * stops-and-starts at a keyframe and never changes direction abruptly.
 * `shift` offsets the composition sideways on wide screens to leave room for copy.
 */
type Key = [number, number, number, number, number, number, number, number, number];

const PATH: Key[] = [
  // 0 · Establishing — empty land, a lot of sky
  // Contre-jour: the low sun sits just off the left edge of frame
  [0.0, 240, 86, 430, -120, 4, -60, 34, 0.0],
  [0.09, 170, 80, 330, -14, 6, -10, 34, 0.08],
  // 1 · Survey — rise to read the setting-out geometry
  [0.19, 84, 78, 158, 0, 0, 8, 36, 0.12],
  // 2 · Foundation — low, close, looking into the excavation
  [0.29, 82, 46, 118, 2, -4, 4, 38, 0.12],
  // 3 · Core — slow orbit to the lit west elevation
  [0.39, -58, 52, 150, 0, 14, 0, 38, 0.12],
  // 4 · Structure — climb with the frame
  [0.5, -112, 72, 178, 0, 50, 0, 36, 0.13],
  [0.585, -165, 95, 235, 0, 72, 0, 35, 0.13],
  // 5 · Façade close-up — the curtain wall assembling
  [0.66, -62, 62, 64, -9, 72, 0, 32, 0.1],
  // 6 · Upper levels, terraces and balconies (front elevation)
  [0.75, -72, 118, 150, -2, 128, 0, 34, 0.12],
  // 7 · Crown
  [0.845, -96, 210, 112, -6, 180, -2, 34, 0.12],
  // 8 · Pull back — the reveal
  [0.925, -104, 70, 300, 0, 96, 0, 37, 0.12],
  [1.0, -162, 30, 304, -2, 98, 0, 40, 0.11],
];

/** Calmer alternative for prefers-reduced-motion: three gentle compositions. */
const PATH_REDUCED: Key[] = [
  [0.0, 240, 86, 430, -120, 4, -60, 34, 0.0],
  [0.5, -60, 70, 380, 0, 70, 0, 34, 0.12],
  [1.0, -162, 30, 304, -2, 98, 0, 40, 0.11],
];

function tangents(keys: Key[]) {
  return keys.map((k, i) => {
    const prev = keys[i - 1];
    const next = keys[i + 1];
    const m = new Array(8).fill(0);
    if (prev && next) {
      const dt = next[0] - prev[0];
      for (let c = 0; c < 8; c++) m[c] = (next[c + 1] - prev[c + 1]) / dt;
    }
    return m as number[];
  });
}

function samplePath(keys: Key[], tans: number[][], t: number, out: number[]) {
  const tt = clamp(t, 0, 1);
  let i = 0;
  while (i < keys.length - 2 && tt > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const h = b[0] - a[0];
  const s = h > 0 ? (tt - a[0]) / h : 0;
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  for (let c = 0; c < 8; c++) {
    out[c] = h00 * a[c + 1] + h10 * h * tans[i][c] + h01 * b[c + 1] + h11 * h * tans[i + 1][c];
  }
  return out;
}

const _pos = new Vector3();
const _target = new Vector3();
const _offset = new Vector3();
const _right = new Vector3();
const _up = new Vector3(0, 1, 0);

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const tans = useMemo(() => tangents(PATH), []);
  const tansReduced = useMemo(() => tangents(PATH_REDUCED), []);
  const sample = useRef<number[]>(new Array(8).fill(0));
  const parallax = useRef({ x: 0, y: 0 });

  useFrame(({ clock }, delta) => {
    const reduced = experience.reducedMotion;
    const v = reduced
      ? samplePath(PATH_REDUCED, tansReduced, experience.progress, sample.current)
      : samplePath(PATH, tans, experience.progress, sample.current);

    _pos.set(v[0], v[1], v[2]);
    _target.set(v[3], v[4], v[5]);
    let fov = v[6];
    const aspect = size.width / Math.max(size.height, 1);

    // Portrait / narrow framing: widen the lens a little, then dolly out until the
    // horizontal coverage roughly matches the desktop composition.
    if (aspect < 1.25) {
      const widen = MathUtils.lerp(1.45, 1.0, clamp((aspect - 0.45) / 0.8, 0, 1));
      fov = Math.min(fov * widen, 56);
      const desired = Math.tan(MathUtils.degToRad(v[6] / 2)) * 1.6 * 0.62;
      const actual = Math.tan(MathUtils.degToRad(fov / 2)) * aspect;
      const dolly = clamp(desired / actual, 1, 2.1);
      _offset.copy(_pos).sub(_target);
      const rise = _offset.y;
      _offset.multiplyScalar(dolly);
      // Never dolly a low, upward-looking shot below its original height
      if (rise < 0) _offset.y = rise;
      _pos.copy(_target).add(_offset);
      // Lift the aim slightly so tall compositions keep the tower in frame
      _target.y += (dolly - 1) * 14;
    }

    // Subtle life: breathing + damped pointer parallax (never in reduced motion)
    if (!reduced) {
      const k = 1 - Math.exp(-delta * 2.2);
      parallax.current.x += (experience.pointer.x - parallax.current.x) * k;
      parallax.current.y += (experience.pointer.y - parallax.current.y) * k;
      _right.subVectors(_target, _pos).cross(_up).normalize();
      const dist = _pos.distanceTo(_target);
      const amp = dist * 0.012;
      _pos.addScaledVector(_right, parallax.current.x * amp);
      _pos.y += parallax.current.y * amp * 0.6 + Math.sin(clock.elapsedTime * 0.22) * dist * 0.0025;
    }

    _pos.y = Math.max(_pos.y, 6);
    camera.position.copy(_pos);
    camera.lookAt(_target);

    // Portrait: lift the subject into the upper part of the frame, above the copy.
    // In the finale the copy frames the tower top and bottom, so let it settle lower.
    const settle = MathUtils.smoothstep(experience.progress, 0.9, 1);
    const lift = aspect < 0.85 ? 0.14 - 0.2 * settle : 0;
    const view = camera.view;
    if (lift !== 0) {
      if (!view || !view.enabled || Math.abs(view.offsetY - size.height * lift) > 0.5 || view.fullWidth !== size.width || view.fullHeight !== size.height) {
        camera.setViewOffset(size.width, size.height, 0, size.height * lift, size.width, size.height);
      }
    } else if (view?.enabled) {
      camera.clearViewOffset();
    }

    const shift = aspect > 1.1 ? v[7] : 0;
    const filmOffset = -shift * 2 * Math.tan(MathUtils.degToRad(fov / 2)) * aspect * camera.getFilmWidth();
    if (Math.abs(camera.fov - fov) > 1e-3 || Math.abs(camera.filmOffset - filmOffset) > 1e-3) {
      camera.fov = fov;
      camera.filmOffset = filmOffset;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
