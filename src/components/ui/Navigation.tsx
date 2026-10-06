"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type Ref } from "react";
import { CHAPTERS } from "@/lib/experience";
import { scrollToProgress, scrollToSection, scrollToTop } from "@/components/experience/ScrollController";

type NavItem = { label: string; href: string; go: () => void };

const visionAt = CHAPTERS.find((c) => c.id === "vision")!.at;
const structureAt = CHAPTERS.find((c) => c.id === "structure")!.at;

const ITEMS: NavItem[] = [
  { label: "Project", href: "#project", go: () => scrollToSection("project") },
  { label: "Vision", href: "#vision", go: () => scrollToProgress(visionAt) },
  { label: "Architecture", href: "#structure", go: () => scrollToProgress(structureAt) },
  { label: "Contact", href: "#contact", go: () => scrollToSection("contact") },
];

/** Quiet, minimal navigation. Collapses to a full-screen index on small screens. */
export function Navigation({ ref }: { ref?: Ref<HTMLElement> }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  const handle = useCallback((item: NavItem) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(false);
    item.go();
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      ref={ref}
      className="group/nav pointer-events-none fixed inset-x-0 top-0 z-50 text-ink transition-[color,background-color] duration-700 [&.is-dark]:bg-ink/85 [&.is-dark]:text-ivory [&.is-solid]:bg-ivory/85 [&.is-solid]:backdrop-blur-md"
    >
      <a
        href="#main"
        className="sr-only-focusable pointer-events-auto absolute left-4 top-4 bg-ink px-4 py-2 text-xs text-ivory"
      >
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className="flex items-center justify-between px-[var(--gutter)] pb-4 pt-5 sm:pb-5 sm:pt-7"
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            scrollToTop();
          }}
          className="pointer-events-auto text-[0.95rem] font-normal tracking-[0.42em]"
          aria-label="AURELIS — back to top"
        >
          AURELIS
        </a>

        <ul className="pointer-events-auto hidden items-center gap-10 md:flex">
          {ITEMS.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={handle(item)} className="nav-link eyebrow">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          ref={toggle}
          type="button"
          className={`eyebrow pointer-events-auto relative z-[60] flex items-center gap-3 py-2 md:hidden ${open ? "text-ink" : ""}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? "Close" : "Menu"}</span>
          <span aria-hidden className="relative block h-2.5 w-5">
            <span
              className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500 ${open ? "translate-y-[5px] rotate-45" : ""}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500 ${open ? "-translate-y-[4px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`pointer-events-auto fixed inset-0 z-[55] flex flex-col justify-end bg-ivory px-[var(--gutter)] pb-10 text-ink transition-[clip-path] duration-700 ease-[var(--ease-architect)] md:hidden ${
          open ? "[clip-path:inset(0_0_0_0)]" : "invisible [clip-path:inset(0_0_100%_0)]"
        }`}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-3">
          {ITEMS.map((item, i) => (
            <li key={item.label} className="border-t border-stone pt-3">
              <a
                ref={i === 0 ? firstLink : undefined}
                href={item.href}
                onClick={handle(item)}
                tabIndex={open ? 0 : -1}
                className="flex items-baseline justify-between text-[2.6rem] font-extralight uppercase leading-none tracking-[-0.03em]"
              >
                {item.label}
                <span className="eyebrow text-silver">0{i + 1}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="eyebrow mt-10 text-graphite">AURELIS — Skyline Tower</p>
      </div>
    </header>
  );
}
