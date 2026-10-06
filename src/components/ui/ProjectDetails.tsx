"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { PRINCIPLES, PROJECT_FACTS } from "@/lib/content";
import { ElevationDrawing } from "./ElevationDrawing";
import { SectionLabel } from "./SectionLabel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Editorial project sheet that follows the cinematic journey. */
export function ProjectDetails() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-draw]",
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            stagger: { each: 0.004, from: "start" },
            scrollTrigger: { trigger: "[data-elevation]", start: "top 85%", end: "bottom 60%", scrub: 1 },
          },
        );
        gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
          gsap.from(el, {
            y: 48,
            opacity: 0,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="project"
      aria-labelledby="project-title"
      className="relative z-10 bg-ivory px-[var(--gutter)] pb-28 pt-28 sm:pb-40 sm:pt-40"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div data-rise>
              <SectionLabel index="06" label="The Project" />
            </div>
            <h2 id="project-title" data-rise className="display mt-8 text-[clamp(2.6rem,6vw,6.4rem)]">
              <span className="block text-graphite">A vertical</span>
              <span className="block">address shaped</span>
              <span className="block">by light.</span>
            </h2>
            <p data-rise className="mt-10 max-w-[30rem] text-[1.05rem] font-light leading-relaxed text-ink/75">
              Skyline Tower rises from a four-storey podium in three stepped volumes, each setback
              becoming a terrace. A single three-metre module orders the structure, the curtain wall and
              the interiors — a quiet discipline that lets the light do the rest.
            </p>

            <dl className="mt-16 grid grid-cols-2 border-t border-ink/15 sm:grid-cols-3">
              {PROJECT_FACTS.map(([label, value, unit]) => (
                <div key={label} data-rise className="border-b border-ink/15 py-7 pr-4">
                  <dt className="eyebrow text-[0.625rem] text-graphite">{label}</dt>
                  <dd className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[clamp(2rem,3.4vw,3.2rem)] font-extralight leading-none tracking-[-0.04em] tabular-nums">
                      {value}
                    </span>
                    {unit && <span className="eyebrow text-[0.625rem] text-graphite">{unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <figure data-elevation className="relative lg:col-span-5 lg:col-start-8">
            <div className="sticky top-24 text-ink">
              <ElevationDrawing className="h-auto max-h-[80vh] w-full" />
              <figcaption className="eyebrow mt-6 flex justify-between text-[0.625rem] text-graphite">
                <span>Drawing 01</span>
                <span>Generated from the 3D model</span>
              </figcaption>
            </div>
          </figure>
        </div>

        <div className="mt-28 grid gap-12 border-t border-ink/15 pt-12 sm:mt-40 md:grid-cols-3 md:gap-10">
          {PRINCIPLES.map((p, i) => (
            <article key={p.title} data-rise>
              <span className="eyebrow text-[0.625rem] text-champagne">0{i + 1}</span>
              <h3 className="mt-4 text-3xl font-extralight uppercase tracking-[-0.03em]">{p.title}</h3>
              <p className="mt-4 max-w-[24rem] text-[0.95rem] font-light leading-relaxed text-ink/70">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
