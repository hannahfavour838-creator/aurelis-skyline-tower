import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Self-hosted (SIL OFL) — no runtime dependency on a third-party font CDN. */
const interTight = localFont({
  src: "./fonts/InterTight-Variable.woff2",
  variable: "--font-inter-tight",
  weight: "100 900",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURELIS — Skyline Tower",
  description:
    "An architectural vision shaped by light, space and precision. A cinematic, scroll-driven construction of the AURELIS Skyline Tower. Fictional portfolio project.",
  openGraph: {
    title: "AURELIS — Skyline Tower",
    description: "Built for what's next. An architectural vision shaped by light, space and precision.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} ${plexMono.variable} is-loading`} suppressHydrationWarning>
      <head>
        <noscript>
          <style>{`html.is-loading,html.is-loading body{overflow:auto!important}[data-loader]{display:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
