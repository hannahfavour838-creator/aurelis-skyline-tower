"use client";

import { FINAL } from "@/lib/content";
import { scrollToSection } from "@/components/experience/ScrollController";

/** The climax overlay — the completed tower, the line, two quiet actions. */
export function FinalCTA() {
  return (
    <div
      data-final
      className="pointer-events-none absolute inset-0 flex flex-col justify-between px-[var(--gutter)] pb-[max(3.5rem,8vh)] pt-[max(7.5rem,16vh)]"
    >
      <div>
        <p data-reveal className="eyebrow text-graphite">
          Completion — MMXXIX
        </p>
        <h2 data-reveal className="display mt-6 text-[clamp(3rem,8.4vw,8.8rem)] sm:mt-8">
          {FINAL.headline.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h2>
      </div>
      <div data-reveal className="flex flex-col gap-6 sm:gap-8">
        <p className="eyebrow text-ink">{FINAL.name}</p>
        <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row">
          <a
            href="#project"
            className="btn-arch justify-between bg-ivory/40 backdrop-blur-[2px]"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("project");
            }}
          >
            Explore the project <span className="arrow" aria-hidden />
          </a>
          <a
            href="#contact"
            className="btn-arch btn-arch--solid justify-between"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contact");
            }}
          >
            Start a conversation <span className="arrow" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
