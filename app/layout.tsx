import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/ui/LenisProvider";
import { MotionProvider } from "@/components/ui/MotionProvider";

// Both are variable fonts. `weight` is intentionally omitted so next/font loads
// the full variable axis — Space Grotesk's natural range is exactly 300-700.
//
// `/public/fonts` NOW EXISTS, and this comment used to say it never would.
// next/font/google self-hosts both faces below at build time, so no webfont
// file is served from there — but Ticket 3 needed Space Grotesk as a three.js
// TYPEFACE JSON for the extruded hero wordmark, which is a geometry source
// rather than a font the browser loads. That asset, and its required OFL
// notice, live in /public/fonts. See public/fonts/README.md for provenance and
// how to regenerate it.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // TITLE TEMPLATE — adopted in Ticket 7 (gate G6).
  //
  // `default` IS BYTE-IDENTICAL to the plain string this field held before,
  // and must stay that way: it is what every page without its own title still
  // renders, including the one-pager at `/`. Only the shape changed.
  //
  // `template` exists so a page can return the bare thing it is about —
  // `title: project.title` on /projects/[slug] — and get "FOLIO — Saad"
  // composed for it. Without it every page would have to hand-write the
  // suffix, which is how one page eventually ships without it. Next applies a
  // template only to DESCENDANT titles, never to `default` itself, so the
  // site title is not doubled into "Saad — Engineer & Builder — Saad".
  title: {
    default: "Saad — Engineer & Builder",
    template: "%s — Saad",
  },
  // The phrase "full-stack developer" is deliberately ABSENT and must not be
  // reintroduced. An earlier draft used it here and filed the conflict with
  // CLAUDE.md's positioning rule as acceptable because a meta description is a
  // "search-keyword surface". That reasoning was rejected: this is the line
  // that appears beneath the site in every search result and link preview,
  // which makes it one of the most load-bearing positioning surfaces there is,
  // not a technical field. Both strings stay forward-looking ("heading into"),
  // claiming no expertise Saad does not yet have.
  description:
    "Portfolio of Muhammad Saad — software builder and IT undergraduate heading into cybersecurity and cloud infrastructure.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme class is ALWAYS explicit — "dark" here, swapped for "light" by
    // the Ticket 11 toggle. Token values would flip correctly without it (they
    // key off `:root` and `html.light`), but Tailwind's `dark:` variant matches
    // on a literal `.dark` class: leave it off and every `dark:` utility in the
    // codebase silently never applies. Failing loudly beats failing quietly.
    //
    // suppressHydrationWarning is set so Ticket 11's pre-hydration theme script
    // (which rewrites this class before React attaches) drops in without rework.
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          NO-JS NET for every <Reveal> on the site, present and future.

          Framer Motion writes `initial` styles into the SERVER-RENDERED markup
          — that is how it avoids a flash of unstyled content — so
          `opacity: 0` genuinely ships in the HTML. If JS is blocked or
          hydration fails, that opacity is PERMANENT and every revealed section
          is a blank page.

          It is a sighted-no-JS failure specifically: the text stays in the DOM
          and in the accessibility tree, so screen readers and crawlers are
          unaffected and an audit would not catch it.

          One rule covers every consumer, costs nothing at runtime, and is
          keyed to the `data-reveal` attribute Reveal sets on its root. Rename
          that attribute and this must change in the same commit.
        */}
        <noscript
          // A static literal, so there is no injection surface — and this form
          // is deliberate rather than lazy. React special-cases <noscript> in
          // `shouldSetTextContent`, so its children are treated as TEXT and are
          // never reconciled on the client; the element form therefore also
          // works, but only by relying on that internal. Passing the CSS as a
          // string states the intent directly and removes any question of a
          // hydration mismatch between a server-rendered <style> element and a
          // client that parses noscript content as raw text.
          //
          // Verified present, verbatim, in the built HTML — not assumed.
          dangerouslySetInnerHTML={{
            __html:
              "<style>[data-reveal]{opacity:1!important;transform:none!important}</style>",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
          <LenisProvider>{children}</LenisProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
