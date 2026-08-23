import type { Metadata } from "next";

import { AboutScreen } from "@/components/about/AboutScreen";
import { PageStack } from "@/components/ui/PageStack";

/**
 * `/about` — the third and last route on the site.
 *
 * WHAT THIS PAGE IS FOR, per `docs/07_SITE_RESTRUCTURE.md` §6: one first-person
 * paragraph, a static MS mark, and three controls — View CV, GitHub, LinkedIn.
 * ONE SCREEN THAT DOES NOT SCROLL AT `lg` (1024px) AND UP; A SCROLLING PAGE
 * BELOW IT. That line read "a single screen that does not scroll" without
 * qualification until 2026-08-23, when Saad took the portrait to its full
 * measure as a square — which does not fit a phone screen that may not scroll,
 * short by a MEASURED 252.7px at 375x667. `docs/07` §5-6 carries the split.
 * Everything about the composition lives in `components/about/AboutScreen.tsx`,
 * including the four things this page deliberately does NOT have; read that
 * header before adding anything here.
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
 * NO `<RevealFooter />` AND NO FOOTER OF ANY KIND. This is the one page with
 * no `contentinfo` landmark, and that is §6's decision rather than an
 * oversight: the reveal footer Phase 5 shipped is Home and Work only. The three
 * contact affordances a visitor needs here are the action row itself, plus the
 * bar's click-to-copy email and LinkedIn icon.
 *
 * NO PAGE-STACK CLASSES ON `<main>` EITHER, and that is not an omission. Rule
 * S-6's `bg-base relative z-10` exists to OCCLUDE the pinned plate; there is no
 * plate on this route, so there is nothing to occlude. Adding them here would
 * be cargo cult. Adding a reveal footer here without them would not be.
 *
 * That is why this route passes `PageStack` an EMPTY class string. The prop is
 * required and has no default precisely so this stays a decision made here,
 * where the reason above is written down, rather than inherited from a
 * component that does not know which route it is on.
 *
 * IT TAKES THE ENTRANCE AND NOT THE ROUTE FADE — `fade={false}` below — AND
 * THAT REVERSES A DECISION THIS FILE USED TO ARGUE THE OTHER WAY.
 *
 * What it said, and it is still true as a measurement: the two are not
 * redundant, because `AboutScreen`'s four-unit entrance deliberately excludes
 * the particle canvas and the page ground. Where the two DO overlap the opacity
 * legs multiply, and that cost was measured rather than modelled — **0.70
 * composited against 0.74 for the page alone at ~165ms**, four percentage
 * points, because `EASE.reveal` is already at 0.94 by then. That number stands.
 * It is the record of why the overlap was never the problem.
 *
 * THE PROBLEM WAS THE NUMBER OF AUTHORS, NOT THE MULTIPLICATION. This page runs
 * three things at once on arrival — the entrance, the route fade, and a canvas
 * that draws continuously — on the one route whose entire brief
 * (`docs/07_SITE_RESTRUCTURE.md` §6) is that it is the fully quiet page. The
 * fade is the least essential of the three and it is the one that goes.
 *
 * THE HARD CUT THE OLD ARGUMENT PREDICTED IS REAL AND IS NOT SOLVED. On a
 * client navigation the canvas now appears in a single frame. That is the
 * accepted cost of one restrained author instead of three, recorded here rather
 * than implied away. If it is ever judged unacceptable, the fix is to bring the
 * canvas INTO the entrance — not to bring the route fade back.
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
    <PageStack className="" fade={false}>
      <AboutScreen />
    </PageStack>
  );
}
