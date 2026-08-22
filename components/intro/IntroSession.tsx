"use client";

/**
 * WHEN THE INTRO IS ALLOWED TO PLAY — three module-scope booleans and one
 * predicate, in one file, so the rule has a single site.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS AT ALL. `IntroGate` used to own the whole question with one
 * boolean, `played`, and that was correct while the gate could only ever be
 * mounted by `Hero` — i.e. while the only route that could play an Intro was
 * `/`. It is not correct once the gate is mounted by the `(chrome)` layout,
 * because the flag was written ONLY by an Intro that actually ran, and the only
 * thing that could run one was Home.
 *
 * MEASURED on a production build before the move, and both rows are the SAME
 * defect seen from opposite sides:
 *
 *   hard load /about  ->  no Intro                     (the route never
 *                                                       mounted a gate)
 *   then click HOME   ->  the Intro PLAYS on a CLIENT
 *                         NAVIGATION                   (`played` is still
 *                                                       false, so the freshly
 *                                                       mounted gate plays)
 *
 * `docs/07_SITE_RESTRUCTURE.md` §3 forbids the second row outright. Fixing the
 * mount point alone would leave it standing, because a layout-mounted gate on a
 * document that entered through `/projects/<slug>` reaches `(chrome)` for the
 * first time on a CLIENT navigation and finds every flag false — the same bug,
 * one level out. That is the hole these three flags close.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ONE WRITER EACH, AND ALL THREE ARE MONOTONIC — set once, never cleared. No
 * cleanup resets any of them and none may ever grow one: React StrictMode
 * mounts, unmounts and remounts every effect in development, and a cleanup that
 * reset a flag here would make the second mount disagree with the first.
 * Precedent, with the same reasoning written out: `PageStack.tsx`'s `arrived`.
 *
 * NO STORAGE OF ANY KIND, ON PURPOSE. `sessionStorage` answers "has this TAB
 * seen the Intro", which suppresses it across refreshes — the opposite of what
 * §3 asks for. `IntroGate.tsx` records the full removal of exactly that
 * (`intro-played` through `useSyncExternalStore`) and why no version of it can
 * also replay on refresh. Module scope is the whole mechanism: a hard load or
 * refresh instantiates a fresh module graph and every flag is false again; a
 * client navigation reuses this module and they are not.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ORDERING GUARANTEE THIS DEPENDS ON, AND WHAT WOULD BREAK IT.
 *
 * `shouldPlayIntro()` is read IN RENDER (a lazy `useState` initialiser); every
 * write below happens in an EFFECT. React runs every render in a commit before
 * any effect in that commit, so on a hard load of `/about` the marker (root
 * layout) and `IntroProvider` (`(chrome)` layout) are in the SAME commit and
 * the provider's read correctly sees `documentEntered === false`.
 *
 * A Suspense boundary between `app/layout.tsx` and
 * `app/(site)/(chrome)/layout.tsx` would split that commit. Verified at the
 * time of writing: zero `Suspense`, zero `loading.tsx` and zero `dynamic(` in
 * the repo. IF ONE IS EVER ADDED BETWEEN THOSE TWO FILES — a `loading.tsx`, a
 * `<Suspense>`, or a `next/dynamic` import — THIS ORDERING MUST BE RE-VERIFIED.
 *
 * HYDRATION. The server has its own module graph, every writer here is an
 * effect, and the server runs no effects — so all three flags are false for the
 * whole prerender AND on the client's hydration render. Server markup and first
 * client render therefore agree and this produces no mismatch. Same argument
 * `IntroGate` already made for `played`.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from "react";

/**
 * "A route has already committed in this document." NOT "an Intro has run" —
 * that distinction is the entire point, and it is only true if something mounts
 * on EVERY route, including the ones that never show an Intro.
 */
let documentEntered = false;

/**
 * "This document's provider decided to play." Written when the sequence STARTS.
 *
 * It is what distinguishes a provider torn down mid-sequence (an error
 * boundary, Fast Refresh, a future non-intercepted exit from `(chrome)`) from a
 * cold client-navigation arrival. Without it `!documentEntered` would swallow
 * the whole predicate and an interrupted Intro could never resume.
 */
let introStarted = false;

/**
 * "The sequence finished." Written AT FINISH, not at start, and that property
 * is preserved verbatim from `IntroGate`'s `played`: a run that is interrupted
 * half-way leaves this false, so the next arrival gets the whole thing rather
 * than a gate that silently disappeared mid-beat.
 */
let introSettled = false;

export function markDocumentEntered() {
  documentEntered = true;
}

export function markIntroStarted() {
  introStarted = true;
}

export function markIntroSettled() {
  introSettled = true;
}

/** Exported for verification and for anything that needs to ask without
 *  deciding. `shouldPlayIntro()` is the only thing that should DECIDE. */
export function hasDocumentEntered() {
  return documentEntered;
}

/**
 * The one rule, in one place.
 *
 *   - Hard load of a `(chrome)` route: nothing has committed yet, so
 *     `documentEntered` is false. PLAYS.
 *   - Client navigation between the three: the provider never remounts (the
 *     layout persists), so this is never re-read. Structurally cannot replay.
 *   - Hard load of `/projects/<slug>` then a click through to `/work` or `/`:
 *     the marker fired on the detail route, so `documentEntered` is true and
 *     `introStarted` is false. DOES NOT PLAY. (This is the hole; it is
 *     invisible from `/` alone.)
 *   - Provider remounted inside one document after starting but not finishing:
 *     `introStarted` is true, so it PLAYS the rest.
 *
 * READ EXACTLY ONCE PER PROVIDER INSTANCE, IN A LAZY `useState` INITIALISER —
 * the same idiom, and the same reasoning, as `PageStack`'s `firstAppearance`.
 * A bare read in the render body would be re-evaluated on every re-render and
 * the Intro would vanish mid-hand-off the instant a flag flipped.
 *
 * NO FLAG MAY EVER BE WRITTEN DURING RENDER. That is what would make
 * StrictMode's second render pass disagree with the first, and it is why
 * "claim the load during render" is not the shape used here.
 */
export function shouldPlayIntro() {
  return !introSettled && (!documentEntered || introStarted);
}

/**
 * Renders `null`, holds no state, has one effect and no cleanup.
 *
 * IT LIVES IN `app/layout.tsx` AND NOWHERE ELSE. `documentEntered` has to mean
 * "a route has committed in this document", which is only true if it is written
 * on EVERY route — including `/projects/<slug>`, `not-found` and `error`, none
 * of which ever mount a gate. The root layout is the only thing that mounts
 * once per document on all of them and persists across every client navigation.
 *
 * REJECTED: Navigation Timing (`performance.getEntriesByType("navigation")`).
 * It describes the DOCUMENT, not the route change, so it reports `"navigate"`
 * for the whole document including every subsequent client navigation. It
 * cannot answer "is this the first route to commit here", which is the only
 * question that matters.
 */
export function IntroSessionMarker() {
  useEffect(() => {
    markDocumentEntered();
  }, []);

  return null;
}

export default IntroSessionMarker;
