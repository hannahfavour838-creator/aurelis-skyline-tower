/** Chapter index label: 01 ——— Chapter */
export function SectionLabel({ index, label = "Chapter" }: { index: string; label?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="eyebrow text-ink">{index}</span>
      <span className="h-px w-12 bg-ink/40" aria-hidden />
      <span className="eyebrow text-graphite">{label}</span>
    </div>
  );
}
