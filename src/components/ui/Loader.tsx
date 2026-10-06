"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useEffect, useRef } from "react";
import { loading } from "@/lib/experience";

gsap.registerPlugin(useGSAP);

const MIN_DURATION = 1.8; // seconds — long enough to feel deliberate, never longer
const FAILSAFE = 9000; // ms — never trap the visitor behind the loader

/**
 * Real loading progress (DOM → fonts → scene → shaders → first frame), displayed as an
 * eased counter. Exits with an architectural wipe, then hands over to the hero.
 */
export function Loader({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const done = useRef(onComplete);

  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    loading.mark("dom");
    if (document.fonts) document.fonts.ready.then(() => loading.mark("fonts")).catch(() => loading.mark("fonts"));
    else loading.mark("fonts");
  }, []);

  useGSAP(
    () => {
      const state = { shown: 0, target: 0 };
      const start = performance.now();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let exiting = false;

      const render = () => {
        if (counter.current) counter.current.textContent = String(Math.round(state.shown * 100)).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${state.shown})`;
      };

      const exit = () => {
        if (exiting) return;
        exiting = true;
        const tl = gsap.timeline({
          onComplete: () => {
            if (root.current) root.current.style.display = "none";
            done.current();
          },
        });
        if (reduced) {
          tl.to(root.current, { opacity: 0, duration: 0.5 });
          return;
        }
        tl.to("[data-loader-fade]", { opacity: 0, y: -12, duration: 0.6, stagger: 0.05, ease: "power2.in" })
          .to(root.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.25, ease: "expo.inOut" }, "-=0.15");
      };

      const unsubscribe = loading.subscribe((v) => {
        state.target = v;
      });

      let last = performance.now();
      const tick = () => {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.5);
        last = now;
        const elapsed = (now - start) / 1000;
        // Pace the counter: it may never outrun real progress nor the minimum duration.
        // Frame-rate independent easing keeps the count smooth on slow devices too.
        const cap = Math.min(state.target, elapsed / MIN_DURATION);
        state.shown += (cap - state.shown) * (1 - Math.exp(-dt * 5));
        if (cap >= 0.999 && state.shown > 0.995) state.shown = 1;
        render();
        if (state.shown >= 1 && !exiting) exit();
      };
      gsap.ticker.add(tick);

      const failsafe = window.setTimeout(() => {
        state.target = 1;
      }, FAILSAFE);

      return () => {
        gsap.ticker.remove(tick);
        unsubscribe();
        window.clearTimeout(failsafe);
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      data-loader
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-ivory px-[var(--gutter)] py-8 text-ink"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      role="status"
      aria-live="polite"
      aria-label="Loading the architectural experience"
    >
      <div data-loader-fade className="flex items-start justify-between">
        <span className="eyebrow text-graphite">Architectural experience</span>
        <span className="eyebrow hidden text-graphite sm:block">Skyline Tower — MMXXIX</span>
      </div>

      <div data-loader-fade className="flex flex-col items-center gap-5 text-center">
        <span className="text-[clamp(2.4rem,7vw,5.5rem)] font-extralight tracking-[0.42em] [margin-right:-0.42em]">
          AURELIS
        </span>
        <span className="eyebrow text-graphite">Loading</span>
      </div>

      <div data-loader-fade className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <span className="eyebrow text-graphite">Preparing site</span>
          <span className="font-mono text-sm tabular-nums tracking-[0.2em]">
            <span ref={counter}>000</span>
            <span className="text-silver"> / 100</span>
          </span>
        </div>
        <div className="relative h-px w-full overflow-hidden bg-stone">
          <div ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-ink" />
        </div>
      </div>
    </div>
  );
}
