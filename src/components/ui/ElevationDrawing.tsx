import {
  FLOOR_H,
  floorY,
  modulesOf,
  PODIUM,
  PODIUM_LEVEL_H,
  PODIUM_LEVELS,
  ROOF_Y,
  SKY_GARDENS,
  TIER_A,
  TIER_B,
  TIER_C,
  TOWER_BASE,
  TOWER_FLOORS,
} from "@/lib/tower";

const TOP = 222;
const fy = (y: number) => TOP - y; // flip to SVG space

/**
 * Front elevation generated from the very same data that builds the 3D tower —
 * the drawing and the model can never disagree.
 */
export function ElevationDrawing({ className = "" }: { className?: string }) {
  const tiers = [
    { f: TIER_A, from: 0, to: 24 },
    { f: TIER_B, from: 24, to: 36 },
    { f: TIER_C, from: 36, to: TOWER_FLOORS },
  ];

  const lines: { x1: number; y1: number; x2: number; y2: number; w?: "strong" | "light" | "accent" }[] = [];

  // Ground
  lines.push({ x1: -105, y1: 0, x2: 105, y2: 0, w: "strong" });

  // Podium
  const px0 = PODIUM.cx - PODIUM.w / 2;
  const px1 = PODIUM.cx + PODIUM.w / 2;
  for (let l = 1; l <= PODIUM_LEVELS; l++) lines.push({ x1: px0, y1: l * PODIUM_LEVEL_H, x2: px1, y2: l * PODIUM_LEVEL_H, w: l === PODIUM_LEVELS ? "strong" : undefined });
  lines.push({ x1: px0, y1: 0, x2: px0, y2: TOWER_BASE, w: "strong" });
  lines.push({ x1: px1, y1: 0, x2: px1, y2: TOWER_BASE, w: "strong" });
  const pn = modulesOf(PODIUM.w, 4.2);
  for (let i = 1; i < pn; i++) {
    const x = px0 + (PODIUM.w / pn) * i;
    lines.push({ x1: x, y1: 0, x2: x, y2: PODIUM_LEVEL_H, w: "light" });
  }
  for (let l = 1; l < PODIUM_LEVELS; l++)
    for (let b = 0; b < 3; b++) {
      const y = l * PODIUM_LEVEL_H + 1.3 + b * 1.25;
      lines.push({ x1: px0, y1: y, x2: px1, y2: y, w: "light" });
    }

  // Tower tiers
  tiers.forEach(({ f, from, to }) => {
    const x0 = f.cx - f.w / 2;
    const x1 = f.cx + f.w / 2;
    const y0 = floorY(from);
    const y1 = floorY(to);
    lines.push({ x1: x0, y1: y0, x2: x0, y2: y1, w: "strong" });
    lines.push({ x1: x1, y1: y0, x2: x1, y2: y1, w: "strong" });
    lines.push({ x1: x0, y1: y1, x2: x1, y2: y1, w: "strong" });
    for (let k = from + 1; k < to; k++) lines.push({ x1: x0, y1: floorY(k), x2: x1, y2: floorY(k) });
    const n = modulesOf(f.w);
    for (let i = 1; i < n; i++) {
      const x = x0 + (f.w / n) * i;
      lines.push({ x1: x, y1: y0, x2: x, y2: y1, w: "light" });
    }
  });

  // Sky gardens
  const gardens = [...SKY_GARDENS].map((k) => ({ k, f: k < 24 ? TIER_A : TIER_B }));

  // Crown fins (front face of tier C)
  const c = TIER_C;
  const cn = modulesOf(c.w, 1.5);
  for (let i = 0; i <= cn; i++) {
    const x = c.cx - c.w / 2 + (c.w / cn) * i;
    const dn = Math.hypot(x - (c.cx - c.w / 2), 0) / Math.hypot(c.w, c.d);
    const h = 9 + (1 - Math.min(1, dn)) * 11;
    lines.push({ x1: x, y1: ROOF_Y, x2: x, y2: ROOF_Y + h, w: "strong" });
  }
  lines.push({ x1: c.cx - c.w / 2 - 0.5, y1: ROOF_Y + 7.2, x2: c.cx + c.w / 2 + 0.5, y2: ROOF_Y + 7.2 });

  const stroke = { strong: 0.9, light: 0.28, accent: 1 } as const;
  const dimX = 40;
  const top = ROOF_Y + 20;

  return (
    <svg
      viewBox={`-110 0 220 ${TOP + 14}`}
      className={className}
      role="img"
      aria-labelledby="elevation-title"
      fill="none"
    >
      <title id="elevation-title">South elevation of the AURELIS Skyline Tower, 1:1000</title>
      <g stroke="currentColor" vectorEffect="non-scaling-stroke">
        {gardens.map(({ k, f }) => (
          <rect
            key={k}
            x={f.cx - f.w / 2}
            y={fy(floorY(k + 1))}
            width={f.w}
            height={FLOOR_H}
            fill="currentColor"
            fillOpacity={0.08}
            stroke="none"
          />
        ))}
        {lines.map((l, i) => (
          <line
            key={i}
            data-draw
            pathLength={1}
            x1={l.x1}
            y1={fy(l.y1)}
            x2={l.x2}
            y2={fy(l.y2)}
            strokeWidth={l.w ? stroke[l.w] : 0.5}
            strokeOpacity={l.w === "light" ? 0.55 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* Dimension line */}
        <g className="text-champagne" stroke="currentColor">
          <line data-draw pathLength={1} x1={dimX} y1={fy(0)} x2={dimX} y2={fy(top)} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
          {[0, TOWER_BASE, floorY(12), floorY(30), ROOF_Y, top].map((y) => (
            <line key={y} x1={dimX - 1.6} y1={fy(y)} x2={dimX + 1.6} y2={fy(y)} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </g>
      <g fill="currentColor" className="font-mono" fontSize={4.2} letterSpacing={0.6}>
        <text x={dimX + 4} y={fy(top) + 1.2}>+204.0</text>
        <text x={dimX + 4} y={fy(ROOF_Y) + 1.2}>L48</text>
        <text x={dimX + 4} y={fy(floorY(30)) + 1.2}>L34 · SKY GARDEN</text>
        <text x={dimX + 4} y={fy(floorY(12)) + 1.2}>L16 · SKY GARDEN</text>
        <text x={dimX + 4} y={fy(TOWER_BASE) + 1.2}>L04 · PODIUM</text>
        <text x={dimX + 4} y={fy(0) + 1.2}>±0.00</text>
        <text x={-105} y={fy(0) + 8}>SOUTH ELEVATION — 1:1000</text>
      </g>
    </svg>
  );
}
