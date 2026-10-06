import type { ChapterId } from "./experience";

export const HERO = {
  eyebrow: "AURELIS — Skyline Tower",
  headline: ["Built for", "what’s next."],
  support: "An architectural vision shaped by light, space and precision.",
  meta: ["Residential tower", "204 m · 48 levels", "Completion 2029"],
};

export const CHAPTER_COPY: Record<ChapterId, { body: string; specs: [string, string][] }> = {
  vision: {
    body: "Every landmark begins as a line drawn on open land. Eighteen thousand square metres of graded ground are set out to the millimetre — an idea, given coordinates.",
    specs: [
      ["Site area", "18,400 m²"],
      ["Setting-out tolerance", "±2 mm"],
    ],
  },
  foundation: {
    body: "Eight metres below the surface, a reinforced raft spreads the weight of the tower evenly into the ground. Permanence, engineered long before it is ever seen.",
    specs: [
      ["Excavation", "8 m"],
      ["Raft pours", "48"],
    ],
  },
  structure: {
    body: "A cast-in-place core leads the frame skyward, one floor plate at a time. Forty-four levels rise above a four-storey podium, stepping back as they climb.",
    specs: [
      ["Levels", "48"],
      ["Height", "204 m"],
    ],
  },
  experience: {
    body: "A unitised curtain wall of low-iron glass and ivory aluminium fins draws daylight deep into every residence. Cantilevered terraces and two sky gardens open the tower to the air.",
    specs: [
      ["Sky gardens", "Levels 16 & 34"],
      ["Ceiling height", "3.25 m"],
    ],
  },
  future: {
    body: "Crowned by a sculpted screen of fins and set within a landscaped plaza, the tower completes the skyline it was designed to anticipate.",
    specs: [
      ["Landscape", "2.1 ha"],
      ["Completion", "2029"],
    ],
  },
};

export const FINAL = {
  headline: ["The future", "takes form."],
  name: "AURELIS Skyline Tower",
};

export const PROJECT_FACTS: [string, string, string][] = [
  ["Height", "204", "m"],
  ["Levels", "48", ""],
  ["Residences", "212", ""],
  ["Sky gardens", "02", ""],
  ["Gross floor area", "96,400", "m²"],
  ["Completion", "2029", ""],
];

export const PRINCIPLES = [
  {
    title: "Light",
    body: "Every residence is oriented to the afternoon sun. Deep fins temper the glare while low-iron glass keeps the view crystalline.",
  },
  {
    title: "Space",
    body: "Three stepped volumes free the upper floors into terraces, and two recessed sky gardens bring landscape into the height of the tower.",
  },
  {
    title: "Precision",
    body: "A single 3-metre façade module governs structure, glazing and interiors — an order that reads from the plaza to the crown.",
  },
];
