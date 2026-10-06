"use client";

import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { type RefObject } from "react";
import { CHAPTERS, experience, JOURNEY_LENGTH } from "@/lib/experience";
import { clamp, segment } from "@/lib/math";
import { createMasterTimeline } from "./ConstructionTimeline";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

/* ------------------------------------------------------------------ */
/* Navigation helpers (used by nav + CTAs)                             */
/* ------------------------------------------------------------------ */

let journey: ScrollTrigger | null = null;

const isReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function scrollToY(y: number) {
  const distance = Math.abs(window.scrollY - y);
  if (isReduced()) {
    window.scrollTo(0, y);
    return;
  }
  gsap.to(window, {
    scrollTo: { y, autoKill: true },
    duration: clamp(distance / 2600, 0.9, 2.6),
    ease: "power2.inOut",
    overwrite: true,
  });
}

/** Scroll to a point of the construction journey (0 → 1). */
export function scrollToProgress(p: number) {
  if (!journey) return;
  scrollToY(journey.start + (journey.end - journey.start) * clamp(p, 0, 1));
}

/** Scroll to a regular section after the journey. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  scrollToY(el.getBoundingClientRect().top + window.scrollY);
}

export function scrollToTop() {
  scrollToY(0);
}

/* ------------------------------------------------------------------ */
/* Controller                                                          */
/* ------------------------------------------------------------------ */

interface ScrollControllerOptions {
  journeyRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  headerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onStageActive: (active: boolean) => void;
}

/**
 * Pins the 3D stage and binds the master construction timeline to scroll.
 * All triggers are created inside `useGSAP` / `gsap.matchMedia`, so React strict-mode
 * double effects, HMR and breakpoint changes revert them cleanly — no duplicates.
 */
export function useScrollController({ journeyRef, stageRef, headerRef, enabled, onStageActive }: ScrollControllerOptions) {
  useGSAP(
    () => {
      const journeyEl = journeyRef.current;
      const stage = stageRef.current;
      if (!enabled || !journeyEl || !stage) return;

      ScrollTrigger.config({ ignoreMobileResize: true });
      // Automated visual QA runs on a software renderer (~1 fps); without this, GSAP's
      // lag smoothing would stretch every scrub. Never active for real visitors.
      if (new URLSearchParams(window.location.search).has("qa")) gsap.ticker.lagSmoothing(0);

      const hud = {
        percent: stage.querySelector<HTMLElement>("[data-hud-percent]"),
        level: stage.querySelector<HTMLElement>("[data-hud-level]"),
        bar: stage.querySelector<HTMLElement>("[data-hud-bar]"),
        phase: stage.querySelector<HTMLElement>("[data-hud-phase]"),
        rail: Array.from(stage.querySelectorAll<HTMLElement>("[data-rail-item]")),
      };
      let lastPercent = -1;
      let lastLevel = -1;
      let lastChapter = -2;

      const updateHud = () => {
        const p = experience.progress;
        const percent = Math.round(p * 100);
        if (percent !== lastPercent && hud.percent) {
          hud.percent.textContent = String(percent).padStart(3, "0");
          lastPercent = percent;
        }
        if (hud.bar) hud.bar.style.transform = `scaleX(${p})`;
        const { core, structure } = experience.phases;
        const level = Math.round(segment(core, 0.35, 0.6) * 4) + Math.floor(clamp(structure / 0.93, 0, 1) * 44);
        if (level !== lastLevel && hud.level) {
          hud.level.textContent = String(level).padStart(2, "0");
          lastLevel = level;
        }
        const t = p * 100;
        let active = -1;
        CHAPTERS.forEach((c, i) => {
          if (t >= c.enter - 1) active = i;
        });
        if (active !== lastChapter) {
          lastChapter = active;
          hud.rail.forEach((el, i) => {
            el.dataset.state = i === active ? "active" : i < active ? "done" : "idle";
            if (i === active) el.setAttribute("aria-current", "step");
            else el.removeAttribute("aria-current");
          });
          if (hud.phase) hud.phase.textContent = active >= 0 ? CHAPTERS[active].title : "The Site";
        }
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          motion: "(prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px)",
        },
        (ctx) => {
          const { reduce, mobile } = ctx.conditions as { reduce: boolean; motion: boolean; mobile: boolean };
          experience.reducedMotion = reduce;

          const tl = createMasterTimeline(stage, {
            reduced: reduce,
            onUpdate: () => {
              experience.version++;
              updateHud();
            },
          });

          const length = mobile ? JOURNEY_LENGTH.mobile : JOURNEY_LENGTH.desktop;
          journey = ScrollTrigger.create({
            trigger: journeyEl,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * length)}`,
            pin: stage,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: reduce ? true : mobile ? 0.9 : 1.35,
            animation: tl,
            invalidateOnRefresh: true,
            // Refresh first: every trigger below the pinned journey depends on its spacer.
            refreshPriority: 10,
          });

          updateHud();

          return () => {
            journey = null;
          };
        },
      );

      // Pause rendering when the stage has fully left the viewport.
      const after = ScrollTrigger.create({
        trigger: "#project",
        start: "top top",
        onEnter: () => onStageActive(false),
        onLeaveBack: () => onStageActive(true),
      });

      // Navigation switches to light text over the dark contact section.
      const header = headerRef.current;
      const solid = header
        ? ScrollTrigger.create({
            trigger: "#project",
            start: "top 80px",
            endTrigger: "#contact",
            end: "top 48px",
            toggleClass: { targets: header, className: "is-solid" },
          })
        : null;
      const theme = header
        ? ScrollTrigger.create({
            trigger: "#contact",
            start: "top 48px",
            end: "bottom 48px",
            toggleClass: { targets: header, className: "is-dark" },
          })
        : null;

      // Pointer parallax (fine pointers only)
      const fine = window.matchMedia("(pointer: fine)").matches;
      const onPointer = (e: PointerEvent) => {
        experience.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        experience.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

      // Fonts and late layout shifts: make sure positions are exact.
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh).catch(() => undefined);
      const id = window.setTimeout(refresh, 400);

      return () => {
        window.clearTimeout(id);
        window.removeEventListener("pointermove", onPointer);
        after.kill();
        theme?.kill();
        solid?.kill();
        mm.revert();
      };
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );
}
