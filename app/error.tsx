"use client";

import Link from "next/link";
import { STANDALONE_NAV } from "@/components/ui/standaloneNav";
import {
  THEME_TOGGLE_ON_BASE,
  ThemeToggle,
} from "@/components/ui/ThemeToggle";

/**
 * The site's runtime error boundary — Ticket 18, Tier 3.
 *
 * ------------------------------------------------------------------------
 * "use client" IS MANDATORY HERE, NOT A STYLE CHOICE.
 * ------------------------------------------------------------------------
 * Next requires every `error.tsx` to be a Client Component: the boundary has
 * to attach on the client and `reset` is a function passed across it. Removing
 * the directive is a build error, not a silent regression.
 *
 * IT IS ALSO THE SITE'S SECOND CLIENT BOUNDARY, after `Reveal`. NOTHING
 * SERVER-ONLY MAY BE IMPORTED INTO THIS FILE — no `content/*` reader that
 * touches the filesystem, no `next/headers`, no server action. The copy below
 * is local string constants precisely so this file's dependency surface stays
 * small, and the rule this header has always stated — "if a future edit needs
 * a shared label here, import it only from a pure-string module" — is what
 * governs the imports it does have.
 *
 * THE IMPORTS ARE `next/link`, `ThemeToggle` and `standaloneNav` (Ticket 6b).
 * This used to read "the only import is `next/link`"; `ThemeToggle` was wired
 * in later, and `standaloneNav` arrived when the nav atom was extracted to one
 * home. `standaloneNav.ts` is exactly the pure-string module the rule above
 * names: no "use client", no React, no imports of its own.
 *
 * ------------------------------------------------------------------------
 * WHAT THIS FILE CATCHES, AND WHAT IT DOES NOT.
 * ------------------------------------------------------------------------
 * It catches errors thrown while rendering any route segment below the root
 * layout — in practice the hero's client subtree, `Reveal`, or a detail page.
 * It does NOT catch an error thrown by `app/layout.tsx` ITSELF, because this
 * component renders INSIDE that layout. Only `app/global-error.tsx` catches
 * those.
 *
 * `app/global-error.tsx` IS DELIBERATELY NOT ADDED, and this is the record of
 * that decision. It replaces the root layout wholesale, so it must render its
 * own `<html>` and `<body>` and can inherit NEITHER font variable, NOR the
 * theme class, NOR Ticket 11's pre-hydration theme script. Every token this
 * site owns is delivered through that layout, so a global-error page could
 * only be themed by hardcoding hex values into inline styles — a second,
 * divergent copy of the colour system living in the one file nobody ever
 * renders, and a direct violation of "app/globals.css is the source of truth
 * for every token value". Ticket 18 names two files, and the root layout it
 * would guard renders two providers and no data. Next's own default screen
 * covers that case. REVISIT IF: the root layout ever gains data fetching, or a
 * layout-level crash is actually observed in production.
 *
 * ------------------------------------------------------------------------
 * COPY AND MOTION.
 * ------------------------------------------------------------------------
 * Saad's copy, verbatim, in the site's plain register. NO APOLOGY COPY — no
 * "Oops", no "we're sorry", no "something went wrong on our end", no
 * exclamation mark. The ticket forbids it by name. No invented error code, no
 * support address, and no "contact me" line: the Contact section exists at the
 * bottom of `/`, one link away.
 *
 * NO `Reveal` AND NO MOTION. `Reveal` is a `motion/react` consumer, and
 * fading in the one control that recovers the page — inside the boundary that
 * exists because rendering already failed once — is exactly the wrong place to
 * spend a dependency. An error page that appears is better than one that
 * animates.
 */

/** Saad's copy, verbatim. Fixed-arity chrome for one surface, so it lives in
 *  the file that renders it rather than in a content module — the same
 *  reasoning `projectDetailContent.ts` states for its six labels. */
const HEADING = "Something broke";
const BODY =
  "An error stopped this page from rendering. Trying again may be enough; if not, the sections below it are unaffected.";
const RESET_LABEL = "Try again";
const HOME_LINK_LABEL = "Home";
const HOME_HREF = "/";

/** Rule S-1's spine, byte-identical to `app/not-found.tsx`,
 *  `app/(site)/projects/[slug]/page.tsx`, `Contact` and the five shipped
 *  sections. Left-anchored; nothing on this site is ever a centred content
 *  column, least of all the page a visitor sees at its least forgiving moment.
 */
const CONTAINER = "mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl";

/**
 * The standalone-nav atom is now `STANDALONE_NAV`, imported above rather than
 * copied here. The local `ACTION` constant it replaces was byte-identical to
 * the shared string — verified by comparison before deletion — so this page
 * renders exactly as it did.
 *
 * It is still shared by the button and the link below, so the two read as one
 * row of peers; only `cursor-pointer` differs, and it is appended at the button
 * call site because `<a href>` gets the pointer cursor from the UA for free.
 */

export default function Error({
  reset,
}: {
  /**
   * DECLARED AND DELIBERATELY NOT RENDERED. Next always passes it, and the
   * prop type is written out so the contract is visible, but nothing about it
   * reaches the page: a raw message can carry internal detail, and `digest` is
   * an opaque hash that would read to a visitor exactly like the invented
   * error code this ticket's copy rules forbid. Next already logs the server
   * side of it. There is no error-reporting sink on this site to send it to —
   * analytics is its own unbuilt ticket — so a `useEffect` that
   * `console.error`s it would add a hook and a hydration-time side effect to
   * duplicate what the browser console already shows.
   */
  error: Error & { digest?: string };
  /** Re-renders the failed segment. Wired to the only control on this page. */
  reset: () => void;
}) {
  return (
    // `pt-2xl pb-2xl` — Rule S-2's standard 89px, with no hard colour edge to
    // pay for on either side. No `min-h`: `<body>` carries `bg-base`, so a
    // short page still ends in the right colour in both themes.
    <main className="w-full bg-base pt-2xl pb-2xl">
      <div className={CONTAINER}>
        {/* `text-h2`, never `text-h1` — the h1 step is the hero's alone. */}
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

        {/* Primary content at full opacity, on the site's 34rem measure. */}
        <p className="mt-lg max-w-[34rem] text-body text-fg">{BODY}</p>

        <div className="mt-xl flex flex-wrap gap-lg">
          {/*
            A REAL `<button type="button">`, styled as a link. It performs an
            action rather than navigating, so an `<a href="#">` would be a lie
            to a screen reader and would break under middle-click.

            NOT A FILLED CONTROL. This site ships no radius token and no button
            vocabulary at all; inventing one here — a padded, filled, rounded
            pill — would make the error page the only surface with a design
            language of its own. `type="button"` is explicit because the UA
            default inside any future form is `submit`. `cursor-pointer` is the
            one addition over the link atom, matching the hero's scroll cue,
            because buttons do not get the pointer cursor for free.

            Tailwind's preflight already strips the UA background, border,
            padding and font from `<button>`, so this renders as text with no
            reset classes needed. Verified in the built stylesheet, not assumed.
          */}
          <button
            type="button"
            onClick={() => reset()}
            className={`${STANDALONE_NAV} cursor-pointer`}
          >
            {RESET_LABEL}
          </button>

          {/* The escape hatch for when `reset` fails twice. `next/link`, not
              `ExternalLink` — this is an in-app route, and `ExternalLink`
              would wrongly add `target="_blank"` and announce a new tab. */}
          <Link href={HOME_HREF} className={STANDALONE_NAV}>
            {HOME_LINK_LABEL}
          </Link>
        </div>
      </div>
    </main>
  );
}
