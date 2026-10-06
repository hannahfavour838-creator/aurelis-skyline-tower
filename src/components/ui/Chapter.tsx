import type { ChapterId } from "@/lib/experience";
import { CHAPTER_COPY } from "@/lib/content";
import { SectionLabel } from "./SectionLabel";

interface ChapterProps {
  id: ChapterId;
  index: string;
  title: string;
}

/** An editorial chapter that lives inside the cinematic stage (no cards, no boxes). */
export function Chapter({ id, index, title }: ChapterProps) {
  const copy = CHAPTER_COPY[id];
  const [first, ...rest] = title.split(" ");
  return (
    <article
      id={id}
      data-chapter={id}
      aria-labelledby={`${id}-title`}
      className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-[max(4.5rem,8vh)] isolate md:inset-x-auto md:bottom-auto md:left-[var(--gutter)] md:top-1/2 md:w-[min(31rem,40vw)] md:-translate-y-1/2"
    >
      <div data-reveal className="veil" aria-hidden />
      <div data-reveal>
        <SectionLabel index={index} />
      </div>
      <h2 id={`${id}-title`} data-reveal className="display mt-5 text-[clamp(2.5rem,4.6vw,5rem)] md:mt-7">
        <span className="block text-graphite">{first}</span>
        <span className="block">{rest.join(" ")}</span>
      </h2>
      <p data-reveal className="mt-5 max-w-[26rem] text-[0.95rem] font-light leading-relaxed text-ink/80 md:mt-7">
        {copy.body}
      </p>
      <dl data-reveal className="mt-6 grid max-w-[26rem] grid-cols-2 gap-6 border-t border-ink/15 pt-4 md:mt-9">
        {copy.specs.map(([k, v]) => (
          <div key={k}>
            <dt className="eyebrow text-[0.625rem] text-graphite">{k}</dt>
            <dd className="mt-1.5 text-lg font-light tracking-tight">{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
