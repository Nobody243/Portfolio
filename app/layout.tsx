import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/ui/LenisProvider";

// Both are variable fonts. `weight` is intentionally omitted so next/font loads
// the full variable axis — Space Grotesk's natural range is exactly 300-700.
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
    // Dark is the :root default, so no "dark" class is needed here — light mode
    // is opt-in via an `html.light` class added by the Ticket 11 toggle.
    // suppressHydrationWarning is set now so Ticket 11's pre-hydration theme
    // script (which mutates this element before React attaches) drops in
    // without rework.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
