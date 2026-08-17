/**
 * TEMPORARY scaffold-verification surface — DELETE IN TICKET 3.
 *
 * Exists only so Ticket 1's acceptance criteria can actually be checked in a
 * browser: design tokens resolve, both themes swap, type scale renders in the
 * right families, and Lenis smooth scroll is observable over real scroll
 * distance. All text below is placeholder — no real copy, name, or headline.
 *
 * To check light mode before Ticket 11 ships the toggle: in devtools, add the
 * `light` class to the <html> element.
 */

import { PlaceholderScene } from "@/components/hero/PlaceholderScene";

const SWATCHES = [
  { label: "base", cssVar: "var(--color-base)" },
  { label: "fg", cssVar: "var(--color-fg)" },
  { label: "accent-working", cssVar: "var(--color-accent-working)" },
  // No `bg-accent-hero` utility exists by design — this token lives outside the
  // --color-* namespace so it cannot leak into Tier 2/3. Read via var() only.
  { label: "accent-hero", cssVar: "var(--accent-hero)" },
];

export default function Page() {
  return (
    <main className="px-md py-2xl">
      <section className="min-h-screen">
        <p className="text-caption font-mono uppercase text-accent-working">
          placeholder / section one
        </p>

        <div className="mt-lg flex flex-wrap gap-md">
          {SWATCHES.map((swatch) => (
            <div key={swatch.label} className="flex flex-col gap-2xs">
              <div
                className="size-2xl border border-accent-working/20"
                style={{ backgroundColor: swatch.cssVar }}
              />
              <span className="text-caption font-mono">{swatch.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-2xl flex flex-col gap-md">
          <h1 className="text-h1">Placeholder h1 — Space Grotesk</h1>
          <h2 className="text-h2">Placeholder h2 — Space Grotesk</h2>
          <h3 className="text-h3">Placeholder h3 — Space Grotesk</h3>
          <h4 className="text-h4">Placeholder h4 — Space Grotesk</h4>
          <p className="text-body max-w-prose">
            TODO(ticket-3): this scaffold page is deleted when the hero lands.
            Real copy for every section is owned by its own ticket — do not
            write it here. Runs long on purpose so body measure, line-height and
            max-w-prose can be judged against more than one line of text.
          </p>
          <p className="text-caption font-mono uppercase">
            Placeholder caption — JetBrains Mono
          </p>
        </div>
      </section>

      {/* R3F pipeline check — deleted in Ticket 3 along with PlaceholderScene.
          The wrapper's explicit height is load-bearing: R3F measures its parent
          and skips creating the WebGL root at 0px. */}
      <section className="min-h-screen border-t border-accent-working/20 pt-xl">
        <p className="text-caption font-mono uppercase text-accent-working">
          placeholder / section two — r3f canvas (accent-hero, tier 1 only)
        </p>
        <div className="mt-lg h-[60vh] w-full">
          <PlaceholderScene />
        </div>
      </section>

      <section className="min-h-screen border-t border-accent-working/20 pt-xl">
        <p className="text-caption font-mono uppercase text-accent-working">
          placeholder / section three — scroll to feel Lenis easing
        </p>
      </section>

      <section className="min-h-screen border-t border-accent-working/20 pt-xl">
        <p className="text-caption font-mono uppercase text-accent-working">
          placeholder / section four
        </p>
      </section>

      <section className="min-h-screen border-t border-accent-working/20 pt-xl">
        <p className="text-caption font-mono uppercase text-accent-working">
          placeholder / section five
        </p>
      </section>
    </main>
  );
}
