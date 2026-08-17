import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/ui/LenisProvider";
import { MotionProvider } from "@/components/ui/MotionProvider";

// Both are variable fonts. `weight` is intentionally omitted so next/font loads
// the full variable axis — Space Grotesk's natural range is exactly 300-700.
//
// DEVIATION from the Technical Architecture Document's folder structure: there
// is no `/public/fonts`. next/font/google self-hosts these at build time, so a
// local font directory would sit empty forever. If a font ever ships that isn't
// on Google Fonts, add the directory then.
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
  // TODO(content): real title — owned by a later content ticket, do not invent copy.
  title: "TODO(content): site title",
  // TODO(content): real description — owned by a later content ticket, do not invent copy.
  description: "TODO(content): site description",
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
