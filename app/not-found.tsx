import type { Metadata } from "next";
import Link from "next/link";

import { BACK_LINK_LABEL } from "@/components/sections/projectDetailContent";
import { STANDALONE_NAV } from "@/components/ui/standaloneNav";
import {
  THEME_TOGGLE_ON_BASE,
  ThemeToggle,
} from "@/components/ui/ThemeToggle";

/**
 * The site's 404 — Ticket 18, Tier 3.
 *
 * A SERVER COMPONENT, and it must stay one. Next renders this file INSIDE the
 * root layout, so it already has `<html>`, `<body>`, both font variables, the
 * theme class and the `<noscript>` net. Re-declaring `<html>` or `<body>` here
 * would nest a second document; only `app/global-error.tsx` renders those, and
 * that file deliberately does not exist (see `app/error.tsx`).
 *
 * WHAT REACHES THIS FILE. `notFound()` in
 * `app/(site)/projects/[slug]/page.tsx` — the live case, since any typo'd or
 * stale `/projects/<slug>` URL lands here — plus every unmatched path on the
 * site. Route groups do not create a boundary, so `(site)` has no closer
 * `not-found.tsx` and this one serves it.
 *
 * THE TWO PATHS RENDER DIFFERENTLY, AND THAT IS NEXT'S BEHAVIOUR, NOT THIS
 * FILE'S. Measured against `next start`, both return HTTP 404:
 *   - An unmatched path (`/nope`) is served from the prerendered `/_not-found`
 *     and arrives as COMPLETE SERVER-RENDERED HTML — layout, theme class,
 *     fonts, stylesheet, `<title>Page not found — Saad</title>`.
 *   - A runtime `notFound()` on the dynamic `/projects/[slug]` route arrives as
 *     Next's `<html id="__next_error__">` shell with an empty `<body>` and this
 *     page in the flight payload, so it paints on hydration. The title is still
 *     correct in that HTML. VERIFIED PRE-EXISTING: the same request returned
 *     the same empty shell with Next's own default 404 before this file
 *     existed, so it is not a regression introduced here.
 * `export const dynamicParams = false` on the slug route makes that second case
 * server-render identically to the first — measured, it does. It is NOT applied
 * here: that route's header records rejecting it for a stated reason, and
 * reversing another ticket's documented decision is Saad's call, not this
 * file's. Raised in `.claude/handoff/ticket-18-implementation.md`.
 *
 * THE ATTEMPTED URL IS DELIBERATELY NOT ECHOED. It is not reliably available
 * to this component in the first place, and rendering user-controlled path
 * text back into the page is reflected content for no benefit — a visitor who
 * mistyped a URL can read their own address bar.
 *
 * COPY REGISTER: plain and specific, matching every other surface on the site.
 * NO APOLOGY COPY — no "Oops", no "we're sorry", no exclamation mark, no
 * invented error code, no support address. The ticket forbids it by name, and
 * a 404 does not need to route to the Contact section, which already exists
 * one link away at the bottom of `/`.
 *
 * NO `Reveal` AND NO MOTION ANYWHERE ON THIS PAGE. Every other section on the
 * site fades in; this one must not. The two links are the page's only purpose
 * and its only exits, and an exit that fades in is worse than one that is
 * simply there — the same reasoning that keeps the detail page's back links
 * outside a `Reveal`.
 */

/**
 * Composes through the root layout's `template: "%s — Saad"` to
 * "Page not found — Saad". VERIFIED in the built HTML of a 404 response
 * (`npm run start`, `/projects/does-not-exist`), not assumed: `template`
 * applies to descendant titles only, and `not-found.tsx` is a special file
 * rather than an ordinary page.
 *
 * NO `description`, no `openGraph`. A 404 is not a shareable surface, and
 * `og:image` is site-wide missing under its own ticket.
 */
export const metadata: Metadata = {
  title: "Page not found",
};

/** Saad's copy, verbatim. Two strings for one route is fixed-arity chrome, not
 *  a collection, so it stays in the file that renders it — the same reasoning
 *  `projectDetailContent.ts` states for its six labels. Do not paraphrase
 *  either string to fit a layout. */
const HEADING = "Page not found";
const BODY = "That URL doesn't match anything on this site.";

/**
 * `All work` is IMPORTED, not retyped. Importing the label means this page
 * cannot become the file that gets missed when it changes. The module is pure
 * strings with no "use client" and no dependencies, so the import costs
 * nothing.
 *
 * `Home` is local because no constant for it exists anywhere on the site —
 * this is the only surface that has ever needed to name `/` in prose. (The
 * navbar names it as an icon, not a word.)
 */
const HOME_LINK_LABEL = "Home";

/**
 * `/work` — the archive route, NOT `/#work` on Home.
 *
 * THE TWIN OF `BACK_HREF` in `app/(site)/projects/[slug]/page.tsx`, and it
 * must stay the twin: both are the "All work" affordance and both must land on
 * the page that holds all five projects. Since Phase 3, `/#work` is Home's
 * FEATURED THREE — CCN and SNA are archive-only — so a link labelled "All
 * work" pointing there sends the visitor to a gallery that provably does not
 * contain two of them.
 *
 * This constant read `/#work` until 2026-08-22, and the comment above it
 * justified the wrong value: it said the destination "is derived from
 * `PROJECTS_HEADING`" in `projectsContent.ts` and that renaming "Work" is a
 * multi-file commit. That was true of the one-page site. The href is a ROUTE
 * now, not an id, so renaming the heading no longer touches it at all — the
 * label is still imported, but for the reason stated above rather than that
 * one. The detail page had already been corrected; this file was the copy that
 * got missed, which is precisely what that comment claimed to prevent.
 */
const WORK_HREF = "/work";
const HOME_HREF = "/";

/** Rule S-1's spine, byte-identical to `app/(site)/projects/[slug]/page.tsx`,
 *  `Contact` and the five shipped sections: 21 / 55 / 89px inside a 1440px
 *  centred container. NOTHING HERE IS CENTRED. A centred hero-style block is
 *  the obvious move on an error page and it would be the site's first centred
 *  content column, which Rule S-1 forbids outright. */
const CONTAINER = "mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl";

/**
 * NOW EXTRACTED, AND THIS FILE IS WHERE THE TRIGGER WAS WRITTEN. The local
 * `LINK` copy that used to sit here said "Extract it the moment a fourth
 * consumer appears". Ticket 6b's overlay close button is the fourth consumer,
 * so the atom moved to `components/ui/standaloneNav.ts` and the three shipped
 * copies (here, the detail route, `app/error.tsx`) now import it. The computed
 * class string is unchanged — all three copies were verified byte-identical to
 * the shared constant before any of them was deleted, so this page renders
 * exactly as it did.
 */

export default function NotFound() {
  return (
    // `pt-2xl pb-2xl` — Rule S-2's standard 89px, with no hard colour edge
    // above or below to pay for. There is no `min-h` and there must not be
    // one: `<body>` already carries `bg-base`, so a short page leaves the
    // correct colour below it in both themes, and stretching this to the
    // viewport would make an empty column the point of the page.
    <main className="w-full bg-base pt-2xl pb-2xl">
      <div className={CONTAINER}>
        {/* `text-h2`, never `text-h1` — the h1 step is the hero's alone. The
            element is still an `<h1>` because this is the page's only heading;
            the size class and the level are independent decisions. Weight is
            left at the inherited 400, as in every shipped section. */}
        {/* THE THEME CONTROL, on the same row as the heading rather than
            above it. Ticket 11's placement rule is one in-flow instance per
            route, right edge mirroring the left spine — and these two pages
            are route shapes it could not reach when it shipped, because both
            files were being created by Ticket 18 in the same working tree at
            the time. Wired 2026-08-19.

            THIS PAGE THEMES, so the token is THEME_TOGGLE_ON_BASE. Using the
            _ON_HERO constant here would put hero-accent teal on `bg-base`,
            which is the §11.4 inversion the two constants exist to prevent.

            An error or 404 page is exactly where a visitor might be reading in
            the wrong theme and unable to fix it, so leaving the control off
            these two routes would strand them on the one page with no other
            way out. */}
        <div className="flex items-start justify-between gap-lg">
          <h1 className="text-h2 text-fg">{HEADING}</h1>
          <ThemeToggle className={THEME_TOGGLE_ON_BASE} />
        </div>

        {/* Full opacity: this is the page's primary content, not metadata, so
            the `/70` floor never comes into it. `34rem` is the site's reading
            measure. */}
        <p className="mt-lg max-w-[34rem] text-body text-fg">{BODY}</p>

        {/* Two exits, side by side, wrapping rather than overflowing at 360px
            — 318px of usable width there against two short mono words. The
            gap is 34px, the same value that separates Contact's link blocks.
            Work first: a visitor who reached a dead `/projects/<slug>` was
            looking for the gallery, not the top of the page. */}
        <div className="mt-xl flex flex-wrap gap-lg">
          <Link href={WORK_HREF} className={STANDALONE_NAV}>
            {BACK_LINK_LABEL}
          </Link>
          <Link href={HOME_HREF} className={STANDALONE_NAV}>
            {HOME_LINK_LABEL}
          </Link>
        </div>
      </div>
    </main>
  );
}
