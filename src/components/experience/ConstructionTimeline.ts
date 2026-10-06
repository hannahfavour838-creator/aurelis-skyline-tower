import gsap from "gsap";
import { CHAPTERS, experience, type PhaseKey } from "@/lib/experience";

/**
 * The master construction timeline.
 *
 * Its total duration is 100 units, so every position reads directly as a percentage
 * of the scroll journey. The same timeline drives both the 3D construction state and
 * the editorial overlays, which guarantees they can never drift apart. ScrollTrigger
 * scrubs it — scrolling up simply plays it backwards.
 */
export function createMasterTimeline(root: HTMLElement, opts: { reduced: boolean; onUpdate: () => void }) {
  const { reduced, onUpdate } = opts;
  const P = experience.phases;
  const q = gsap.utils.selector(root);

  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" }, onUpdate });

  // Master progress (linear) — the camera path is sampled from this value.
  tl.fromTo(experience, { progress: 0 }, { progress: 1, duration: 100 }, 0);

  const phase = (key: PhaseKey, from: number, to: number, at: number, dur: number, ease = "none") =>
    tl.fromTo(P, { [key]: from }, { [key]: to, duration: dur, ease, immediateRender: from === 0 }, at);

  /* ---------------------------------------------------------------- */
  /* Construction choreography                                         */
  /* ---------------------------------------------------------------- */
  phase("survey", 0, 1, 10, 10); //            10 – 20  setting out
  phase("foundation", 0, 1, 20, 10); //        20 – 30  excavation + raft
  phase("craneIn", 0, 1, 28, 8, "power1.out"); // crane erected
  phase("core", 0, 1, 30, 10); //              30 – 40  basement, deck, podium, core
  phase("structure", 0, 0.64, 40, 15); //      40 – 55  lower tower frame
  phase("facade", 0, 0.62, 55, 15); //         55 – 70  curtain wall (lower)
  phase("balconies", 0, 1, 67, 17); //         67 – 84  balconies + terraces
  phase("structure", 0.64, 1, 70, 12); //      70 – 82  upper levels
  phase("facade", 0.62, 1, 72, 14); //         72 – 86  curtain wall (upper)
  phase("roof", 0, 1, 82, 10); //              82 – 92  crown + rooftop
  phase("craneOut", 0, 1, 86, 6, "power1.in"); // crane dismantled
  phase("landscape", 0, 1, 84, 14); //         84 – 98  plaza, paths, trees
  phase("final", 0, 1, 92, 8, "power1.inOut"); // 92 – 100 reveal

  /* ---------------------------------------------------------------- */
  /* Editorial overlays                                                */
  /* ---------------------------------------------------------------- */
  const drift = reduced ? 0 : 1;

  const hero = q("[data-hero]");
  const heroCue = q("[data-hero-cue]");
  tl.to(heroCue, { opacity: 0, duration: 2 }, 1.2);
  tl.to(hero, { opacity: 0, y: -70 * drift, duration: 5, ease: "power1.in" }, 2.5);

  const hud = q("[data-hud]");
  tl.fromTo(hud, { opacity: 0 }, { opacity: 1, duration: 3 }, 5);
  tl.to(hud, { opacity: 0, duration: 2.5, immediateRender: false }, 90.5);

  CHAPTERS.forEach((c) => {
    const items = q(`[data-chapter="${c.id}"] [data-reveal]`);
    if (!items.length) return;
    tl.fromTo(
      items,
      { opacity: 0, y: 34 * drift },
      { opacity: 1, y: 0, duration: 3, stagger: 0.45, ease: "power2.out" },
      c.enter,
    );
    tl.to(items, { opacity: 0, y: -26 * drift, duration: 2.4, stagger: 0.18, ease: "power1.in", immediateRender: false }, c.exit);
  });

  const finalItems = q("[data-final] [data-reveal]");
  tl.fromTo(
    finalItems,
    { autoAlpha: 0, y: 40 * drift },
    { autoAlpha: 1, y: 0, duration: 3.2, stagger: 0.5, ease: "power2.out" },
    93.5,
  );

  return tl;
}
