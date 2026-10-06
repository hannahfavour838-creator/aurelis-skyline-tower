import { HERO } from "@/lib/content";

/** Opening title sequence. Lines are revealed by the intro timeline once loading ends. */
export function HeroCopy() {
  return (
    <>
      <div data-hero className="pointer-events-none absolute inset-0 flex flex-col justify-between px-[var(--gutter)] pb-[max(4.5rem,9vh)] pt-[max(7.5rem,17vh)]">
        <ul
          data-intro-fade
          className="eyebrow absolute right-[var(--gutter)] top-[max(7.5rem,17vh)] hidden flex-col items-end gap-2 text-[0.625rem] text-graphite lg:flex"
          aria-label="Project summary"
        >
          {HERO.meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <div>
          <p className="eyebrow text-graphite">
            <span className="line-mask">
              <span data-intro-line>{HERO.eyebrow}</span>
            </span>
          </p>
          <h1 className="display mt-6 text-[clamp(3.3rem,11.2vw,11.5rem)] text-ink sm:mt-8">
            {HERO.headline.map((line) => (
              <span key={line} className="line-mask">
                <span data-intro-line>{line}</span>
              </span>
            ))}
          </h1>
        </div>
        <div className="flex items-end justify-between gap-10">
          <p data-intro-fade className="max-w-[21rem] text-[0.95rem] font-light leading-relaxed text-ink/75">
            {HERO.support}
          </p>
        </div>
      </div>
      <div
        data-hero-cue
        className="pointer-events-none absolute bottom-6 right-[var(--gutter)] flex flex-col items-center gap-3 sm:bottom-8 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        aria-hidden
      >
        <span data-intro-fade className="eyebrow hidden text-[0.625rem] text-graphite sm:block">Scroll to explore</span>
        <span data-intro-fade className="relative block h-10 w-px overflow-hidden bg-ink/10">
          <span className="scroll-cue-line absolute inset-0 bg-ink" />
        </span>
      </div>
    </>
  );
}
