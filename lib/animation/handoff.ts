/**
 * THE SEAM between the Intro and the page it opens into.
 *
 * Three components have to agree about one beat: `Intro.tsx` drives a camera
 * that accelerates THROUGH the mark's anchor pixel at dead viewport centre,
 * `Hero.tsx` settles in behind it out of that same pixel, and `Navbar.tsx`
 * slides down from above the viewport. `docs/07` §3 step 6 and §1 both require
 * the last two to be SIMULTANEOUS — "one beat".
 *
 * SIMULTANEITY HERE MEANS ONE START INSTANT, NOT ONE DURATION. See
 * `HANDOFF_S`'s note below and `Hero.tsx`'s `ARRIVAL_S`, which state the same
 * fact from their two sides.
 *
 * THIS BLOCK USED TO DESCRIBE A DIFFERENT INTRO, and it is worth knowing which
 * one: it said the Intro "ends its contraction on a single dot" and that
 * `Hero.tsx` "expands out of that pixel", then cited
 * `.claude/handoff/intro-timing-design.md` §5 as pinning the beat to "a shared
 * start time AND a shared duration". That was the merge-to-a-point Intro,
 * built, found broken and reverted in `1145a00`; the shared-duration half was
 * then reversed by `7b3b5d2` in `HANDOFF_S`'s own note twenty lines below,
 * leaving this header arguing against the constant it introduces. The anchor
 * pixel `(296, 288)` survived both rewrites and is still the one thing the two
 * sides share geometrically.
 *
 * The slide's duration still lives here rather than in `Intro.tsx` because it
 * travels with the DOM contract below: whoever moves the attribute has to see
 * the timing that depends on it.
 *
 * WHY NOT `lib/animation/easing.ts`. That module is the site's motion
 * VOCABULARY — curves and cadences reused across tiers, deliberately
 * dependency-free and deliberately small. These two are not vocabulary; they
 * are one specific joint between three specific components. `DURATION.hero`
 * was the cautionary case: a tuned-sounding constant with a confident docstring
 * in the shared module, no callers, and two comments still describing it as
 * live. It has been removed, and its note in `easing.ts` points here.
 *
 * Framework-agnostic data, no imports, safe on the server.
 */

/**
 * The navbar's slide. WHAT THE THREE COMPONENTS SHARE IS THE START INSTANT,
 * NOT THE DURATION - and that changed when the Intro's zoom-in was restored.
 *
 * `Hero.tsx` used to import this too. It no longer does: under a camera move
 * the hero must still be settling when the mark leaves the viewport, so its
 * arrival runs 1.6s against the zoom-in's 0.95s while the bar slides in 0.45s.
 * Both still BEGIN on the same frame, which is what `docs/07` S3 step 6 and S1
 * actually require - "one coordinated beat" is simultaneity of onset, not of
 * length. Measured after the restore: hero 2205ms, navbar 2205ms.
 *
 * Do not re-share them. A bar taking 1.6s to descend is a different bug from
 * the one this module was written to prevent.
 *
 * 0.45s is `EXPAND_S` from the timing brief's §7 table, and it is the only
 * number in that table this file still stands behind.
 *
 * THE SENTENCE THAT FOLLOWED IT IS RETIRED. It read: "Setup (A+B+C) is 1.40s
 * and the handoff (D+E) is 0.95s, which holds the old `ZOOM_IN_S`'s weight to
 * the millisecond while the total falls from ~3.24s to 2.35s." Those are the
 * FIVE-PHASE merge timings, and that sequence was reverted in `1145a00`. The
 * shipped Intro is SEVEN phases totalling **3.165s** — `INTRO_TOTAL_S` in
 * `components/intro/Intro.tsx`, which computes it from its own phase constants
 * rather than restating it. Do not reason about the seam from the numbers that
 * used to be here.
 */
export const HANDOFF_S = 0.45;

/**
 * The navbar's entrance element, addressed by attribute rather than by a ref
 * handed down a tree.
 *
 * THE PREMISE THAT USED TO BE HERE IS FALSE SINCE 2026-08-22, AND THE
 * CONCLUSION IS UNAFFECTED. It read: the two are SIBLINGS, "`Navbar` renders
 * before `<main>`, and the Intro is mounted several levels inside it by
 * `Hero` → `IntroGate`. There is no shared React ancestor between them that is
 * not the page itself." The gate moved out of `Hero` and into the `(chrome)`
 * layout: `IntroProvider.tsx` now renders `{children}` (which is `<Navbar />`
 * plus the page) and `<IntroGate>` as DIRECT siblings, so a shared ancestor
 * does exist — `IntroProvider`, mounted by `app/(site)/(chrome)/layout.tsx`.
 * Passing a ref down from there is therefore mechanically possible now, where
 * before it was not.
 *
 * IT IS STILL AN ATTRIBUTE, because the reason below never depended on the
 * tree shape — only on what a GSAP timeline needs. Do not "simplify" this into
 * a ref on the strength of the ancestor now existing; read the next paragraph
 * first.
 *
 * WHY AN ATTRIBUTE AND NOT A CALLBACK OR A CONTEXT. The requirement is one
 * timeline with two tweens, not two calls that happen to be adjacent: anything
 * that hands the navbar a signal and lets it start its own animation
 * reintroduces exactly the drift this single-timeline arrangement prevents.
 * A GSAP timeline can only tween an element it has, so it has to be able to
 * find one.
 *
 * IT IS ON THE BAR'S INNER CONTAINER, NOT ON `<header>`, AND THE ORIGINAL
 * REASON IS VOID. It was that the header's `transform` was already taken —
 * hide-on-scroll wrote it on every scroll frame, so a second author on the same
 * property would have fought it the first time anyone scrolled during the
 * entrance. **Hide-on-scroll was deleted in `3b3fab6`** (the bar gained an
 * active-route indicator, which a retracting bar hides exactly when it is
 * useful), so `<header>`'s `transform` is free.
 *
 * IT STAYS ON THE INNER CONTAINER ANYWAY: moving a working entrance onto a
 * different element is risk with no gain, `<header>` is `fixed` and
 * `pointer-events-none` and this layer is neither, and the Intro's timeline
 * finds it by this attribute. `Navbar.tsx`'s own comment on the same element
 * already recorded the reason as void; this file kept asserting it as live, so
 * the two files stated opposite things about the same property.
 */
export const NAV_ENTRANCE_ATTR = "data-nav-entrance";
