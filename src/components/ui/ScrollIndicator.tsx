import { CHAPTERS } from "@/lib/experience";

/**
 * Construction HUD: a chapter rail, the current level and overall completion. Values
 * are written directly by the scroll controller (no React renders while scrolling).
 */
export function ScrollIndicator() {
  return (
    <div data-hud className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
      {/* Chapter rail */}
      <ol className="absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 flex-col gap-5 lg:flex">
        {CHAPTERS.map((c) => (
          <li
            key={c.id}
            data-rail-item
            data-state="idle"
            className="group flex items-center justify-end gap-4 text-ink/35 transition-colors duration-500 data-[state=active]:text-ink data-[state=done]:text-ink/55"
          >
            <span className="eyebrow translate-x-2 text-[0.625rem] opacity-0 transition-all duration-500 group-data-[state=active]:translate-x-0 group-data-[state=active]:opacity-100">
              {c.title}
            </span>
            <span className="eyebrow text-[0.625rem] tabular-nums">{c.index}</span>
            <span className="block h-px w-4 bg-current transition-all duration-500 group-data-[state=active]:w-10" />
          </li>
        ))}
      </ol>

      {/* Readouts */}
      <div className="absolute inset-x-[var(--gutter)] bottom-5 flex items-end justify-between gap-6 sm:bottom-7">
        <div className="hidden flex-col gap-1.5 md:flex">
          <span className="eyebrow text-[0.625rem] text-graphite" data-hud-phase>
            The Site
          </span>
          <span className="eyebrow text-[0.625rem]">
            Level <span data-hud-level className="tabular-nums">00</span>
            <span className="text-silver"> / 48</span>
          </span>
        </div>
        <div className="ml-auto flex w-full items-center gap-4 md:w-auto">
          <span className="eyebrow text-[0.625rem] text-graphite">Construction</span>
          <span className="relative block h-px flex-1 overflow-hidden bg-ink/15 md:w-36 md:flex-none">
            <span data-hud-bar className="absolute inset-0 origin-left scale-x-0 bg-ink" />
          </span>
          <span className="eyebrow text-[0.625rem] tabular-nums">
            <span data-hud-percent>000</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
