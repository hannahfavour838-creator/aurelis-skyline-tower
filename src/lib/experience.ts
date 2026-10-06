/**
 * Shared, non-reactive experience state.
 *
 * GSAP's master timeline writes into these plain objects while scrubbing, and the
 * React Three Fiber scene reads them inside `useFrame`. Nothing here triggers React
 * renders — the whole construction runs outside the React reconciler.
 */

export type PhaseKey =
  | "survey"
  | "foundation"
  | "core"
  | "structure"
  | "facade"
  | "balconies"
  | "roof"
  | "landscape"
  | "craneIn"
  | "craneOut"
  | "final";

export type Phases = Record<PhaseKey, number>;

export const createPhases = (): Phases => ({
  survey: 0,
  foundation: 0,
  core: 0,
  structure: 0,
  facade: 0,
  balconies: 0,
  roof: 0,
  landscape: 0,
  craneIn: 0,
  craneOut: 0,
  final: 0,
});

export type Quality = "high" | "low";

export interface ExperienceState {
  /** Master scroll progress, 0 → 1 (linear). */
  progress: number;
  /** Per-phase construction progress, 0 → 1. */
  phases: Phases;
  /** Incremented whenever the construction changes, so the scene can skip idle work. */
  version: number;
  reducedMotion: boolean;
  /** Normalised pointer position (-1 → 1) for subtle camera parallax. */
  pointer: { x: number; y: number };
  /** Whether the pinned stage is currently on screen. */
  stageVisible: boolean;
}

export const experience: ExperienceState = {
  progress: 0,
  phases: createPhases(),
  version: 0,
  reducedMotion: false,
  pointer: { x: 0, y: 0 },
  stageVisible: true,
};

export const resetExperience = () => {
  experience.progress = 0;
  experience.phases = Object.assign(experience.phases, createPhases());
  experience.version++;
};

/* ------------------------------------------------------------------ */
/* Loading state (observable, small)                                   */
/* ------------------------------------------------------------------ */

type Listener = (value: number) => void;

const loadSteps = { dom: 0, fonts: 0, scene: 0, shaders: 0, frame: 0 };
type LoadStep = keyof typeof loadSteps;
const weights: Record<LoadStep, number> = { dom: 0.15, fonts: 0.2, scene: 0.25, shaders: 0.3, frame: 0.1 };
const listeners = new Set<Listener>();

export const loading = {
  mark(step: LoadStep) {
    if (loadSteps[step]) return;
    loadSteps[step] = 1;
    const value = loading.value();
    listeners.forEach((l) => l(value));
  },
  value() {
    return (Object.keys(loadSteps) as LoadStep[]).reduce((acc, k) => acc + loadSteps[k] * weights[k], 0);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(loading.value());
    return () => {
      listeners.delete(listener);
    };
  },
};

/* ------------------------------------------------------------------ */
/* Chapter map — shared by the timeline, navigation and HUD            */
/* ------------------------------------------------------------------ */

export const CHAPTERS = [
  { id: "vision", index: "01", title: "The Vision", at: 0.155, enter: 10, exit: 20 },
  { id: "foundation", index: "02", title: "The Foundation", at: 0.31, enter: 23, exit: 37 },
  { id: "structure", index: "03", title: "The Structure", at: 0.5, enter: 42, exit: 57 },
  { id: "experience", index: "04", title: "The Experience", at: 0.71, enter: 61, exit: 80 },
  { id: "future", index: "05", title: "The Future", at: 0.885, enter: 84, exit: 92 },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** Scroll length of the pinned journey, in viewport heights. */
export const JOURNEY_LENGTH = { desktop: 9, mobile: 8 };
