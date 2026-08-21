import type { Metadata } from "next";

import { AboutScreen } from "@/components/about/AboutScreen";

/**
 * `/about` — the third and last route on the site.
 *
 * WHAT THIS PAGE IS FOR, per `docs/07_SITE_RESTRUCTURE.md` §6: one first-person
 * paragraph, a static MS mark, and three controls — View CV, GitHub, LinkedIn.
 * A single screen that does not scroll. Everything about the composition lives
 * in `components/about/AboutScreen.tsx`, including the four things this page
 * deliberately does NOT have; read that header before adding anything here.
 *
 * IT COMPLETES THE NAVBAR. Until this file existed, `NAV_ITEMS[0]` pointed at
 * `/#trajectory` — an anchor into Home — because a nav entry aimed at a route
 * that 404s is worse than a half-routed bar. That entry becomes `/about` in the
 * same commit as this page, and `navContent.ts`'s header changes with it. The
 * bar is now two routes and no anchors.
 *
 * INSIDE `(chrome)`, so it gets the navbar. Route groups contribute no URL
 * segment, so the path is `/about` and the `@modal` intercept at segment level
 * `/` is untouched.
 *
 * A SERVER COMPONENT WITH NO PROPS AND NO STATE, like `/work`. The two client
 * boundaries below it — the particle canvas and the CV control — carry their
 * own directives.
 *
 * NO `<Contact />` AND NO FOOTER OF ANY KIND. This is the one page with no
 * `contentinfo` landmark, and that is §6's decision rather than an oversight:
 * the reveal footer Phase 5 builds is Home and Work only. The three contact
 * affordances a visitor needs here are the action row itself, plus the bar's
 * click-to-copy email and LinkedIn icon.
 */

/**
 * NO `description` — the root layout's `SITE_DESCRIPTION` is inherited and is
 * still accurate for this page, exactly as `/work` reasons. A second one would
 * be new copy, and copy on this site comes from Saad.
 *
 * The title is the bare word; the root layout's `%s — Saad` template composes
 * the rest. It is a literal rather than a read of `NAV_ITEMS[0].label`: a nav
 * label is scanned and a page title is read, and `navContent.ts` already
 * records that those two jobs are allowed to diverge.
 */
export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <AboutScreen />
    </main>
  );
}
