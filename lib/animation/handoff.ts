/**
 * THE SEAM between the Intro and the page it opens into.
 *
 * Three components have to agree about one beat: `Intro.tsx` ends its
 * contraction on a single dot at dead viewport centre, `Hero.tsx` expands out
 * of that pixel, and `Navbar.tsx` slides down from above the viewport. `docs/07`
 * §3 step 6 and §1 both require the last two to be SIMULTANEOUS — "one beat" —
 * and `.claude/handoff/intro-timing-design.md` §5 pins that to a shared start
 * time and a shared duration.
 *
 * A shared duration expressed as two constants in two files is a shared
 * duration until someone retunes one of them, at which point the seam becomes a
 * stagger nobody meant. It lives here instead, with the DOM contract it travels
 * with.
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
 * 0.45s is `EXPAND_S` from the timing brief's §7 table. Setup (A+B+C) is 1.40s
 * and the handoff (D+E) is 0.95s, which holds the old `ZOOM_IN_S`'s weight to
 * the millisecond while the total falls from ~3.24s to 2.35s.
 */
export const HANDOFF_S = 0.45;

/**
 * The navbar's entrance element, addressed by attribute because the Intro and
 * the navbar are SIBLINGS — `Navbar` renders before `<main>`, and the Intro is
 * mounted several levels inside it by `Hero` → `IntroGate`. There is no shared
 * React ancestor between them that is not the page itself.
 *
 * WHY AN ATTRIBUTE AND NOT A CALLBACK OR A CONTEXT. The requirement is one
 * timeline with two tweens, not two calls that happen to be adjacent: anything
 * that hands the navbar a signal and lets it start its own animation
 * reintroduces exactly the drift the shared duration above exists to prevent.
 * A GSAP timeline can only tween an element it has, so it has to be able to
 * find one.
 *
 * IT IS ON THE BAR'S INNER CONTAINER, NOT ON `<header>`. The header's own
 * `transform` is written directly by the hide-on-scroll handler on every scroll
 * frame; a second author on the same property would fight it the first time
 * anyone scrolled during the entrance. Two elements, two transforms, no
 * arbitration needed.
 */
export const NAV_ENTRANCE_ATTR = "data-nav-entrance";
