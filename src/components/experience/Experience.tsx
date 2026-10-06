"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/lib/experience";
import { Loader } from "@/components/ui/Loader";
import { Navigation } from "@/components/ui/Navigation";
import { HeroCopy } from "@/components/ui/HeroCopy";
import { Chapter } from "@/components/ui/Chapter";
import { FinalCTA } from "@/components/ui/FinalCTA";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { ProjectDetails } from "@/components/ui/ProjectDetails";
import { Contact } from "@/components/ui/Contact";
import { SceneMount } from "./SceneMount";
import { useScrollController } from "./ScrollController";

gsap.registerPlugin(useGSAP);

/**
 * Page orchestration: loader → hero intro → pinned cinematic journey → project sheet →
 * contact. The 3D stage stays pinned while the master timeline is scrubbed.
 */
export function Experience() {
  const journeyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [stageActive, setStageActive] = useState(true);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only gate for scroll setup
    setMounted(true);
  }, []);

  useScrollController({
    journeyRef,
    stageRef,
    headerRef,
    enabled: mounted,
    onStageActive: setStageActive,
  });

  const onLoaded = useCallback(() => {
    document.documentElement.classList.remove("is-loading");
    setLoaded(true);
  }, []);

  // Title sequence once the loader has left.
  useGSAP(
    () => {
      if (!loaded) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set("[data-intro-line], [data-intro-fade]", { clearProps: "all" });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-intro-line]", { yPercent: 110, duration: 1.6, stagger: 0.12 })
        .from("[data-intro-fade]", { opacity: 0, y: 14, duration: 1.4, stagger: 0.08 }, "-=1.1")
        // clearProps: a lingering transform would turn the header into the containing
        // block for the fixed mobile menu.
        .from(headerRef.current, { opacity: 0, y: -10, duration: 1.2, clearProps: "transform,opacity" }, "<");
    },
    { dependencies: [loaded], scope: stageRef },
  );

  return (
    <>
      {!loaded && <Loader onComplete={onLoaded} />}
      <Navigation ref={headerRef} />

      <main id="main">
        <span id="top" className="absolute top-0" aria-hidden />
        <section
          ref={journeyRef}
          aria-label="The construction of Skyline Tower"
          className="relative"
        >
          <div ref={stageRef} className="relative h-[100svh] w-full overflow-hidden bg-ivory">
            <div className="absolute inset-0">
              {mounted && <SceneMount active={stageActive} />}
            </div>
            <HeroCopy />
            {CHAPTERS.map((c) => (
              <Chapter key={c.id} id={c.id} index={c.index} title={c.title} />
            ))}
            <FinalCTA />
            <ScrollIndicator />
          </div>
        </section>

        <ProjectDetails />
        <Contact />
      </main>
    </>
  );
}
