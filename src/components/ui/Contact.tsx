"use client";

import { scrollToTop } from "@/components/experience/ScrollController";

/** Closing contact section and footer — the only dark surface on the site. */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="on-dark relative z-10 bg-ink px-[var(--gutter)] pb-10 pt-28 text-ivory sm:pt-40"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col">
        <div className="flex items-center gap-4">
          <span className="eyebrow">07</span>
          <span className="h-px w-12 bg-ivory/40" aria-hidden />
          <span className="eyebrow text-silver">Contact</span>
        </div>
        <h2 id="contact-title" className="display mt-8 text-[clamp(2.8rem,9vw,9.5rem)]">
          <span className="block text-silver">Start a</span>
          <span className="block">conversation.</span>
        </h2>

        <div className="mt-16 grid gap-12 border-t border-ivory/15 pt-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="max-w-[26rem] text-[1.05rem] font-light leading-relaxed text-ivory/70">
              Private presentations of Skyline Tower are held by appointment at the AURELIS studio. Share a
              few details and our team will be in touch.
            </p>
            <a href="mailto:studio@aurelis.example" className="btn-arch mt-10">
              studio@aurelis.example <span className="arrow" aria-hidden />
            </a>
          </div>
          <dl className="grid grid-cols-2 gap-10 md:col-span-6 md:col-start-7">
            <div>
              <dt className="eyebrow text-[0.625rem] text-silver">Studio</dt>
              <dd className="mt-3 font-light leading-relaxed text-ivory/80">
                AURELIS Development
                <br />
                Gallery Level, Pavilion One
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.625rem] text-silver">Hours</dt>
              <dd className="mt-3 font-light leading-relaxed text-ivory/80">
                Monday — Saturday
                <br />
                By appointment
              </dd>
            </div>
          </dl>
        </div>

        <footer className="mt-28 flex flex-col gap-6 border-t border-ivory/15 pt-8 sm:mt-40 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.95rem] tracking-[0.42em]">AURELIS</p>
          <p className="eyebrow max-w-[34rem] text-[0.625rem] leading-relaxed text-silver">
            A fictional architectural concept created for a frontend portfolio. All names, figures and imagery are illustrative.
          </p>
          <button type="button" onClick={scrollToTop} className="nav-link eyebrow self-start text-ivory sm:self-auto">
            Back to top ↑
          </button>
        </footer>
      </div>
    </section>
  );
}
