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
  title: "Saad — Engineer & Builder",
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
      <body className="flex min-h-full flex-col">
        <MotionProvider>
          <LenisProvider>{children}</LenisProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
