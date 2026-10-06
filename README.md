# AURELIS — Skyline Tower

A cinematic, scroll-driven architectural experience. An empty piece of land becomes a
complete luxury skyscraper as you scroll — the 3D scene *is* the story.

> Fictional brand and project, created for a frontend portfolio.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (TypeScript + lint-clean)
npm run start
```

Optional URL flags: `?quality=high` / `?quality=low` force a rendering tier.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Three.js r186 ·
@react-three/fiber 9 · @react-three/drei 10 · @react-three/postprocessing 3 · GSAP 3 + ScrollTrigger.

## How it works

```
GSAP master timeline (100 units = 100 % of the journey)
  ├─ experience.progress  → CameraRig (Hermite spline through cinematic keyframes)
  ├─ experience.phases.*  → every construction element (instanced, recomputed only on change)
  └─ DOM overlays         → hero, chapters 01–05, finale, HUD
ScrollTrigger pins the stage and scrubs that one timeline → scrolling up reverses it.
```

- **No React renders while scrolling.** GSAP writes into a plain mutable store
  (`src/lib/experience.ts`); the scene reads it in `useFrame`.
- **Procedural architecture as data.** `src/lib/tower.ts` describes the podium, three stepped
  tiers, sky gardens, balconies and crown as ~5,000 individual “pieces”, each with its own
  assembly window. They render as a handful of `InstancedMesh` draw calls.
- **The elevation drawing** in the project section is generated from the same data as the 3D model.
- **Lighting:** custom sky shader (warm horizon, sun glow, cirrus), IBL captured from that sky
  (no external HDRI), a low west sun with soft shadows (shadow map re-renders only when the
  construction changes), billboarded volumetric-looking sun shafts, restrained dust.

## Structure

```
src/
  app/                    layout (self-hosted fonts), page, global styles
  lib/                    experience store, tower + site generators, math, content, sun
  components/
    scene/                ArchitecturalScene, SkyDome, Environment, Sunlight, Terrain (+river),
                          Site (survey, hoarding, distant city), Landscape, Atmosphere,
                          CameraRig, Effects, SceneReady, StaticFallback
    skyscraper/           Skyscraper, Foundation, Structure, GlassFacade, Balconies, Rooftop,
                          Crane, PieceInstances, materials
    experience/           Experience, ScrollController, ConstructionTimeline, SceneMount
    ui/                   Loader, Navigation, HeroCopy, Chapter, SectionLabel, ScrollIndicator,
                          FinalCTA, ProjectDetails, ElevationDrawing, Contact
```

## Replacing the procedural tower with a GLB

Keep `PieceInstances` and the phase names. Either split the GLB into the same packages
(core, slabs, glass, fins, balconies, roof) and drive each node's visibility/transform from
`experience.phases`, or replace the `Skyscraper` children while leaving the timeline,
camera and UI untouched.

## Performance

Device tiering (pointer, viewport, memory, cores), adaptive DPR via `PerformanceMonitor`,
instancing everywhere, shadow map updates on demand, half-res N8AO on desktop only, the canvas
pauses (`frameloop="never"`) once the stage scrolls away, and every geometry/material is disposed.

## Accessibility

Semantic landmarks and headings, skip link, keyboard-reachable navigation and CTAs with visible
focus, Escape closes the mobile menu, chapter copy remains in the DOM for screen readers, and
`prefers-reduced-motion` switches to a calmer three-shot camera, no drift, no parallax and
direct (un-smoothed) scrubbing. Without WebGL a drawn elevation replaces the scene.

## Notes

- The only console message in development is a `THREE.Clock` deprecation notice emitted
  from inside @react-three/fiber itself; it is harmless.
- Fonts: Inter Tight and IBM Plex Mono, self-hosted under the SIL Open Font License
  (see `src/app/fonts`).
