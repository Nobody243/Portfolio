"use client";

/**
 * The hero's canvas. Two effects, one context, one rAF tick: the constellation
 * mesh — a field of drifting nodes joined by hairline links, torn open by the
 * cursor and permanently torn open behind the subject — and the command sphere
 * that floats in front of it.
 *
 * IT IS NO LONGER HERO-ONLY, and the file stays here anyway. `/about` renders
 * the same mesh at `QUIET_FIELD` density with `sphere={false}`, which is the
 * single-artifact rule `docs/07_SITE_RESTRUCTURE.md` applies to the MS mark
 * read across to the background: one canvas, two dressings, never a second
 * hand-matched implementation. Moving it to `components/ui/` was considered and
 * refused — the sphere half is genuinely hero content (`lib/hero/commandSphere`,
 * `heroContent`), and a move would be a rename touching every import for no
 * behavioural gain.
 *
 * ONE CANVAS, SO "IN FRONT" IS DRAW ORDER RATHER THAN z-index. The sphere is
 * painted after the mesh's node pass, in the same frame, from state the same
 * closure owns. A second stacked canvas would make the compositing depend on
 * `z-index`, `position` and stacking context, and would split the frame budget
 * across two callbacks that cannot see each other's cost — which is exactly the
 * measurement this file's density was tuned by.
 *
 * THE TWO EFFECTS STAY SEPARABLE. The sphere's geometry lives in
 * `lib/hero/commandSphere.ts` with no React, no DOM and no canvas calls in it,
 * and its draw pass is `drawCommandSphere` below — one function, not
 * interleaved with the mesh loop. Sharing a tick is a performance decision; it
 * is not licence to entangle them.
 *
 * THE PALETTE IS THE SAME VARIABLE, NOT A MATCHED ONE. The active field's ink
 * property is parsed to channels into `ink`, and the sphere reads that same
 * local. Two `getPropertyValue` calls can disagree after a theme change; one
 * cannot.
 *
 * WHICH PROPERTY IT READS IS THE PRESET'S DECISION, NOT THIS FILE'S. The hero
 * names `--accent-hero`; `/about`'s `QUIET_FIELD` names `--field-ink`. Until
 * 2026-08-22 the property was hardcoded here, which is precisely how a Tier 1
 * accent came to paint a full-viewport field on a Tier 2 page when this
 * component was generalised from hero-only: nothing at either call site
 * mentioned a colour, so nothing at either call site could be reviewed for one.
 * `--accent-hero` still has exactly two code paths site-wide — this read and
 * the reveal footer's 34x3px bar — but it now has TWO render sites in ONE tier
 * instead of three across two, which is the count that actually mattered and
 * the one `grep -rn "accent-hero" components/` could never have caught.
 * Audit `grep -rn "ParticleGrid" components/` alongside it.
 *
 * IT USED TO SAY "once per rebuild", AND THAT WAS THE OTHER HALF OF THE BUG.
 * `readInk` (then `readAccent`) ran only inside `build()`, and `build()` runs
 * on mount and on a debounced `resize` — neither of which fires when the theme
 * flips. The effect's deps (`reducedMotion`, `field`, `withSphere`) cannot
 * observe a theme change either. That was harmless for exactly one reason:
 * `--accent-hero` is deliberately not overridden in `html.light`
 * (`app/globals.css`, ACCENT POLICY), so there was never a second value to
 * re-read. `--field-ink` has one, so the `MutationObserver` below is what keeps
 * the canvas from painting the previous theme's colour until a resize.
 *
 * DISPLACEMENT, NOT BRIGHTENING. Nothing in this file lights a particle up
 * near the pointer, and nothing should be added that does. The cursor shoves
 * nodes outward from their resting positions; the links break on their own
 * because their endpoints exceed `LINK_RADIUS`, not because any code
 * suppresses them. That emergent break is the whole trick — a separate
 * "hide links near the cursor" pass would produce a clean circular cut instead
 * of the ragged, stretched edge this produces.
 *
 * TWO VOIDS, ONE MATH. The cursor void and the permanent subject void run
 * through the identical displacement function; the only difference is what
 * position and what radius feed it. The radius is a PARAMETER rather than a
 * module constant because the two voids are no longer the same size: the
 * cursor's is a fixed 145px, the sphere's is its own projected radius plus a
 * margin, which changes with the viewport.
 *
 * ONE ANCHOR NOW, NOT FIVE. The wordmark got five sampled across its measured
 * glyph box because a name is a wide rectangle and one circular void either
 * failed to clear the ends or blew a hole far taller than the text. A sphere is
 * radially symmetric, so a single circle at its projected centre is that same
 * reasoning applied to the opposite shape — not an abandonment of it.
 *
 * THE VOID IS STILL MEASURED, NOT AGREED, and it is now measured more directly
 * than before. It used to be a rect produced by a sibling SVG component,
 * lifted into React state and passed back down as a prop, because the number
 * had to travel between two elements in two coordinate spaces. The sphere is
 * drawn by this canvas, in this canvas's coordinates, in this frame, from this
 * closure's own state object. There is nothing left that could desync, so the
 * prop path was deleted rather than kept as ceremony.
 *
 * DISPLACEMENT DOES NOT STACK. Where the cursor void overlaps the sphere's
 * void, the LARGER of the two offsets wins rather than their sum. Summing
 * flings nodes roughly twice as far in the overlap band, which reads as a
 * glitch precisely where the visitor is most likely to be looking.
 *
 * ALL MATH RUNS IN ONE rAF TICK. The listeners below only ever write scalars
 * into refs. Doing the transform work inside the event handlers is the classic
 * way to get compounding offsets — two mousemoves in one frame apply the delta
 * twice — and it is also unbounded work on a hostile input device.
 *
 * THE TICK IS SCHEDULED ONLY WHILE SOMETHING IS STILL MOVING, and that is ONE
 * rule now rather than a reduced-motion special case standing beside a loop
 * that otherwise ran forever. At the END of every frame — after the node loop,
 * because restlessness is not knowable before it — the tick asks whether the
 * next frame COULD DIFFER from the one just drawn: is the ambient drift on, is
 * there a sphere turning under its own timeline, is any node still easing
 * toward a target it has not reached. Another frame is queued only if the
 * answer is yes. Otherwise the loop parks itself — `raf = 0`, `lastFrame = 0`
 * — and nothing runs at all until `wake()` is called by a build, a resize, a
 * theme flip, a resolved webfont or a pointer event.
 *
 * "COULD THE NEXT FRAME DIFFER" IS NOT "IS ANYTHING DISPLACED", and the
 * distinction is the difference between this working and this doing nothing.
 * A cursor resting anywhere over a full-viewport field holds a tear open
 * indefinitely; the nodes are far from home, but they have ARRIVED, and no
 * further frame can differ. Asking about displacement keeps that loop running
 * for the whole visit. Asking whether any node is still chasing its target
 * parks it. See the `chasing` test in the node loop.
 *
 * UNDER REDUCED MOTION THE TICK IS STILL NOT SCHEDULED AT ALL. Not slowed —
 * stopped. That has not changed; what changed is that it is no longer its own
 * code path. `!reducedMotion` gates the WHOLE predicate, so that path draws
 * one frame per build and declines to queue a second, which is exactly the
 * behaviour a parallel `drawOnce()` branch used to produce from five scattered
 * `if (reducedMotion)` sites. Two paths that had to agree became one path and
 * a value in a boolean. `!reducedMotion` must keep gating the whole test and
 * must never become one more disjunct: the hero has a sphere under reduced
 * motion too, and a predicate that OR'd `sphere !== null` in would start a loop
 * there that is currently, correctly, never scheduled.
 *
 * `/about` REACHES THE SAME PARKED STATE WITHOUT THE PREFERENCE. It passes
 * `ambient="settled"` and no sphere, so the field is still until the cursor
 * touches it, tears open, holds torn open — parked, costing nothing — for as
 * long as the cursor rests, then eases shut over ~1.05s and stops. Because the
 * drift is off, `node.x === node.homeX + node.ox` exactly, so the settle
 * terminates in the same image the mount frame drew. See
 * `ParticleGridProps.ambient`.
 */

import { useEffect, useRef } from "react";

import {
  HERO_COMMAND_FEATURED,
  HERO_COMMAND_FRAGMENTS,
} from "@/components/hero/heroContent";
import {
  clampFrameMs,
  dampingFactor,
  frameScale,
} from "@/lib/animation/frameRate";
import {
  createCommandSphere,
  startCommandSphereBurst,
  placeCommandSphere,
  projectCommandSphere,
  stepCommandSphere,
  commandSphereVoid,
  SPHERE_SCALE_MIN,
  SPHERE_SCALE_MAX,
  type CommandSphere,
} from "@/lib/hero/commandSphere";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
// The class on <html> is the site's single source of truth for the applied
// theme (`lib/theme.ts`). Importing the reader rather than writing
// `classList.contains("dark")` here keeps it that way — a second spelling of
// the same test is how the two drift apart when the class names change.
import { readAppliedTheme } from "@/lib/theme";

/* -------------------------------------------------------------------------
   Field constants. CSS pixels throughout — the DPR scale is applied to the
   context once, so nothing below ever has to think about it.
------------------------------------------------------------------------- */

/**
 * THE NUMBERS A CALLER MAY RETUNE, AND ONLY THESE.
 *
 * Everything else in this file is fixed for every instance: `LINK_RADIUS`,
 * `VOID_RADIUS`, `LERP`, `DRIFT_CLAMP` and the node radii are what make the
 * field read as *this* field, and a caller that changed them would be building
 * a second effect rather than dimming this one.
 *
 * ONE OBJECT, NOT LOOSE PROPS. Density and ink are a single perceptual
 * decision, and a call site that passed some of them would be an unnoticed
 * half-tuning. Presets below; nobody constructs one of these inline.
 *
 * IT USED TO SAY "THE FOUR NUMBERS", with `nodeAlpha` and `linkPeakAlpha` flat
 * alongside the two density numbers and no colour in the type at all — the ink
 * was a hardcoded `--accent-hero` read in the draw pass. That is how a Tier 1
 * accent ended up painting a full-viewport field on a Tier 2 page: the ink was
 * not a value anyone could see at the call site, so generalising this component
 * from hero-only carried the cyan across without anyone editing a line that
 * said `accent-hero`. Density stays flat because it does not theme; everything
 * ink-side moved into a per-theme `FieldInk` pair so the Tier boundary is a
 * value you can grep rather than a comment you have to trust.
 */
export type FieldInk = {
  /**
   * The CSS custom property to read, BY NAME.
   *
   * A property name and not a hex, because `app/globals.css` is the source of
   * truth for every colour value on this site and a literal here would be a
   * second one. A property name and not a boolean flag, because the flag would
   * have to be translated back into a name somewhere in the draw path, and
   * that translation is the thing that goes stale.
   */
  ink: string;
  /** Node alpha. Slightly above the links so the dots read as the structure. */
  nodeAlpha: number;
  /** Peak link alpha, at zero separation. Brief: 12-18% for the hero. */
  linkPeakAlpha: number;
  /**
   * Exponent on the link's distance falloff. 1 = linear, i.e. the shipped
   * curve. Below 1 the curve lifts in the middle, which extends the distance
   * at which a link is still dark enough to read as a continuous line.
   *
   * IT IS NOT A TASTE KNOB. It exists because the two grounds have different
   * thresholds for "this line has broken into dashes": ~ΔL* 1.0 on near-black,
   * where a faint light line still blooms into something continuous, against
   * ~ΔL* 1.5 on near-white, where a 1px line below that aliases into dots.
   * Ported linearly, About's light field would hold links only to d ≈ 80px of
   * the 120px `LINK_RADIUS` against dark's 102px — losing the longest third of
   * every link, and the long links are exactly the ones that triangulate the
   * mesh. At gamma 0.6 the light threshold moves to d ≈ 101px. The number
   * equalises the mesh's effective connectivity across the two themes; it is
   * the same perceptual-weight argument as the alphas, applied to structure.
   *
   * The link still reaches exactly zero at `LINK_RADIUS` in both themes, which
   * is load-bearing — see this file's header on the ragged break at the void's
   * edge. A floored alpha would make links pop in and out instead of fraying.
   */
  linkFalloff: number;
};

export type ParticleFieldTuning = {
  /**
   * One node per this many square pixels.
   *
   * THE DENSE END OF THE BRIEF'S 9,000-14,000 BAND, and that is a correction
   * rather than a preference. 11,000 was tried first and the field did not read
   * as the "loose triangulated mesh" the brief describes — it read as scattered
   * dots with the occasional link. The arithmetic says why: at 11,000 the mean
   * nearest-neighbour distance on a 1440x820 hero is ~105px, which was exactly
   * `LINK_RADIUS`, so the average node sat right on the threshold and most
   * pairs failed it. At 9,000 the spacing drops to ~95px against a 120px radius
   * and each node finds two to four neighbours, which is what makes triangles.
   *
   * DENSER AGAIN on request. 9,000 gave 131 nodes on a 1440x820 hero, which
   * triangulated but still read as sparse. 5,200 gives ~227 there — a properly
   * woven field rather than a scattering with links.
   *
   * The link pass is O(n²), so this is the number that had to be re-measured
   * rather than assumed: see the fps figure in the commit. The cheap
   * axis-aligned reject before the sqrt is what keeps it affordable at this
   * count, and it is not optional any more.
   */
  areaPerNode: number;
  /**
   * Hard ceiling, independent of viewport, so an ultrawide monitor cannot walk
   * the O(n²) link pass into six figures of distance checks a frame. Raised
   * with the density; still a real cap.
   */
  maxNodes: number;
  /**
   * The ink, per theme. Selected by the class on <html> at draw time, which is
   * `lib/theme.ts`'s documented single source of truth.
   *
   * DENSITY IS NOT IN HERE, and that is the counter-intuitive half. The
   * instinct is to thin the field in light mode, since dark specks on white are
   * the more salient. Doing so walks straight into the measured failure
   * recorded on `areaPerNode` above: raising it pushes the mean node spacing
   * toward `LINK_RADIUS`, most pairs fail the threshold, and the mesh degrades
   * into scattered dots — which is the noise reading the ink is being retuned
   * to avoid, arrived at by a different route. Density and connectivity are one
   * decision and both themes get the same one; the whole correction lives in
   * the ink.
   */
  dark: FieldInk;
  light: FieldInk;
};

/** The hero's field, and the default: unchanged from before this file took a
 *  prop at all. Every number is the one the hero was tuned to.
 *
 *  THE TWO HALVES ARE BYTE-IDENTICAL ON PURPOSE, and that is the point of
 *  writing them out. `--color-hero-surface` is pinned dark in both themes (see
 *  `app/globals.css`, the HERO TOKENS block), so the field that sits on it must
 *  not theme either — and `--accent-hero` is itself theme-exempt, so even the
 *  ink name would be the same. Expressing that as two identical objects makes
 *  the pinning visible AT THE VALUE, the same way `globals.css` declares the
 *  three hero tokens as one block with one rationale. It is not redundancy to
 *  collapse: collapsing it is how the hero silently acquires a light mode. */
export const HERO_FIELD: ParticleFieldTuning = {
  areaPerNode: 5_200,
  maxNodes: 300,
  dark: {
    ink: "--accent-hero",
    nodeAlpha: 0.5,
    linkPeakAlpha: 0.16,
    linkFalloff: 1,
  },
  light: {
    ink: "--accent-hero",
    nodeAlpha: 0.5,
    linkPeakAlpha: 0.16,
    linkFalloff: 1,
  },
};

/**
 * The About page's field — the same mesh, thinner, and in a different ink.
 *
 * WHY NOT `opacity` ON THE CANVAS, which is the one-line version of this. The
 * canvas composites over `bg-base`, which flips between themes. A blanket
 * `opacity: 0.5` scales links and nodes by the SAME factor and leaves the
 * field's STRUCTURE at full strength — and the structure, ~227 nodes woven
 * into triangles, is what actually reads as busy behind a paragraph. Dropping
 * the count and the alphas independently thins the mesh instead of veiling it.
 *
 * DENSITY AND INK BOTH ROSE ON 2026-08-23, AND THEY ARE THE ONLY TWO LEVERS ON
 * THE TABLE. Saad asked for the field to be more present, in both themes.
 *
 *   areaPerNode  8,500 -> 7,000      maxNodes  160 -> 200
 *   dark   nodeAlpha 0.30 -> 0.36    linkPeakAlpha 0.09 -> 0.105
 *   light  nodeAlpha 0.17 -> 0.19    linkPeakAlpha 0.07 -> 0.08
 *   light  ink #33474C -> #223F49    (in `app/globals.css`; hue held at ~195deg,
 *                                     HSL saturation 0.197 -> 0.364)
 *   linkFalloff, both themes: UNCHANGED (1.0 dark / 0.6 light)
 *
 * DENSITY IS THE FREE LEVER — it has no contrast cost at all. 152 -> 185 nodes
 * at 1440x900, mean spacing 92.3px -> 83.7px against a 120px `LINK_RADIUS`, so
 * each node finds more neighbours and the mesh triangulates harder. That is what
 * "presence" actually is here, and it moves TOWARD `HERO_FIELD`'s proven
 * 5,200/300 rather than toward the documented failure at 11,000 (~105px spacing,
 * where the mesh collapses to scattered dots). Density stays identical across
 * themes; that rule is untouched.
 *
 * COST: the O(n^2) link pass runs 1.48x the pair checks. `/about` passes
 * `ambient="settled"` and paints one frame then parks, so that cost is only paid
 * during a pointer settle (~60 frames). The hero already runs 300 nodes.
 *
 * BOTH THEMES ROSE TOGETHER, AND THAT IS NOT A COURTESY TO DARK. Raising light
 * alone is precisely the "correct the per-node ratio upward" move `docs/03`
 * forbids by name on bloom grounds. Multiplying both preserves the ratio:
 * dark x1.1931, light x1.1778, the two within 1.28% of each other.
 * `app/globals.css` carries the full composite arithmetic for both.
 *
 * `RADIUS_MIN` / `RADIUS_MAX` ARE STILL OFF THE TABLE. Bigger dots is the
 * obvious way to make a field "more present" and it is the one lever this file
 * refuses by name below. Density and ink are the two that are on it.
 *
 * THE PRIOR VALUES, kept rather than deleted: the density came from
 * `.claude/handoff/about-design.md` §5 as ~39% fewer nodes than the hero, with a
 * 160 cap so a large viewport could not walk it back up. The cap survives as a
 * mechanism; only its value moved.
 *
 * THE INK IS NO LONGER THE HERO'S, AND THAT IS THE WHOLE POINT OF THIS PRESET
 * HAVING ONE. It used to inherit the draw pass's hardcoded `--accent-hero`,
 * described here as "roughly 55% of the hero's ink on both passes" — true of
 * the alphas and quietly false about the colour, because `--accent-hero` is
 * Tier 1 and `/about` is Tier 2/3. `--field-ink` is the dedicated low-chroma
 * ink; `app/globals.css` carries the full arithmetic for both values. In
 * summary: the dark field's hue moved off the Tier 1 cyan without moving its
 * weight, and light sits at ~44% of dark's delta, because a dark mark on
 * near-white does not bloom the way a light mark on near-black does. As of
 * 2026-08-23 the pair is ΔL* +29.62 dark / −12.96 light, raised from
 * +24.82 / −11.00 with the ratio held.
 *
 * THE CONNECTION TO THE HERO IS STRUCTURE, NOT HUE, and it always was: same
 * canvas, same mesh, same `LINK_RADIUS`, same displacement kernel, same cursor
 * void. That is this file's single-artifact rule applied to the background. The
 * hero keeps the cyan and therefore keeps meaning something.
 *
 * THE TWO ALPHAS ARE NOT A DIMMED PAIR OF THE DARK ONES. In dark the nodes
 * glow and carry the effect on their own, so the links sit at 27% of the node
 * weight. In light nothing glows, so the DRAWN LINES have to carry the
 * structure and they rise to 41% of it — even though 0.07 is the lower absolute
 * alpha. Structure is precisely what stops a field of dark specks on white
 * reading as dust. See `linkFalloff` for the other half of that.
 *
 * CURSOR DISPLACEMENT IS NOT DIMMED and must not be — it is the field's one
 * interaction, and About is meant to be quiet, not dead. It now carries that
 * whole claim ON ITS OWN. About passes `ambient="settled"`, so once the four
 * entrance units finish at 1.00s the tear is the only motion left anywhere on
 * the page. Dimming it would not make the field quieter; it would make it a
 * still image with a canvas element's cost.
 */
export const QUIET_FIELD: ParticleFieldTuning = {
  areaPerNode: 7_000,
  maxNodes: 200,
  dark: {
    ink: "--field-ink",
    nodeAlpha: 0.36,
    linkPeakAlpha: 0.105,
    linkFalloff: 1,
  },
  light: {
    ink: "--field-ink",
    nodeAlpha: 0.19,
    linkPeakAlpha: 0.08,
    linkFalloff: 0.6,
  },
};

const MIN_NODES = 24;

/** Radius of the torn void, CSS px. Mid-point of the brief's 130-160. */
const VOID_RADIUS = 145;
/** Nodes closer than this to each other get a link drawn. Brief: 90-120, and
 *  the top of it for the reason given on `areaPerNode` — this value and that
 *  one set the mesh's connectivity together and must be retuned together. */
const LINK_RADIUS = 120;

/**
 * How fast a node eases toward its target offset. Brief: ~0.12.
 *
 * PER 60Hz FRAME, AND NO LONGER APPLIED AS ONE. It used to be multiplied in
 * directly, which closed a fixed 12% of the gap every frame no matter how long
 * the frame took — so the void opened and closed at the display's refresh rate
 * rather than in a fixed number of milliseconds, and a 144Hz panel ran the
 * whole interaction 2.4x fast. It now goes through `dampingFactor`, which
 * returns exactly 0.12 at 16.667ms, so 60Hz is unchanged to the bit. Retune it
 * by eye on a 60Hz display exactly as before.
 */
const LERP = 0.12;
/** Ambient wander is bounded to this radius around home, CSS px. Read only on
 *  the `ambient: "drift"` path, which today is `HERO_FIELD`'s.
 *
 *  `vx`/`vy` ARE PER 60Hz FRAME TOO, and are scaled by `frameScale` rather than
 *  by `dampingFactor`: a velocity integrates linearly, so twice the elapsed
 *  time is exactly twice the distance. Measured before that scaling existed,
 *  the mesh moved 0.056px per frame at both 60fps and 34fps — i.e. 3.37px/s
 *  against 1.91px/s for the same code on the same machine. */
const DRIFT_CLAMP = 15;

/**
 * A node whose remaining displacement is under this, on both axes, counts as
 * home — CSS px.
 *
 * IT IS A STOPPING THRESHOLD, NOT A TUNING KNOB. `LERP` is an exponential ease
 * and never reaches zero, so a settling field needs a floor at which the loop
 * is allowed to park. 0.05px is sub-pixel at DPR 1 and at the capped DPR 2, so
 * the frame at which the tick stops is not a frame the visitor can see: the
 * node's rounded device pixel has already been its final one for several
 * frames by then.
 *
 * It also sets how long the settle runs, which is a number the verification
 * checks against: from a full 145px `VOID_RADIUS` offset, `0.88^n = 0.05/145`
 * gives n ≈ 62 frames, or ~1.05s at 60Hz. Lower it and the tail gets longer for
 * no visible gain; raise it far enough and the node visibly snaps the last
 * fraction of a pixel.
 *
 * THE ~1.05s IS NOW THE INVARIANT AND THE 62 FRAMES IS THE 60Hz COROLLARY,
 * which is the reverse of how it read when `LERP` was applied per frame. Both
 * sentences above were true only at 60Hz then: a 144Hz visitor got the same 62
 * frames in 0.43s. With `LERP` dt-scaled the duration holds and the frame count
 * is whatever the display supplies — 151 frames at 144Hz, still ~1.05s.
 */
const SETTLE_EPSILON = 0.05;

/** Node radius range, CSS px. */
const RADIUS_MIN = 1;
const RADIUS_MAX = 2;

/**
 * Below this width the pointer interaction is disabled outright and the field
 * only drifts. A touch visitor has no hover, so the cursor void would either
 * never appear or — worse, if driven from touchmove — fight the scroll gesture
 * for the main thread on the device least able to spare it. The permanent
 * sphere void still renders; it does not depend on input.
 *
 * IT IS ALSO THE SPHERE'S ONLY BREAKPOINT — its tilt, its fragment count, its
 * type size and its glow all key off this one number rather than a second
 * constant that happens to equal it today. "This is a touch-sized viewport" is
 * one rule on this site, not two that agree until someone edits one of them.
 */
const INTERACTIVE_MIN_WIDTH = 768;

/** Resize debounce, ms. */
const RESIZE_DEBOUNCE_MS = 150;

/* -------------------------------------------------------------------------
   Command sphere — the DRAW side only. Everything geometric lives in
   `lib/hero/commandSphere.ts`; what is left here is what a 2D context needs.
------------------------------------------------------------------------- */

/**
 * Fragment counts.
 *
 * DELIBERATELY SPARSER THAN THE FIELD. At the 1440px radius this is roughly one
 * fragment per 10,000px² of projected area against the mesh's `areaPerNode` of
 * 5,200, so the sphere never reads as denser than the atmosphere it floats in
 * front of. The compact count is not a performance concession — a ~232px sphere
 * cannot legibly hold ninety command strings at any readable size.
 *
 * IT WAS 90, AND 90 WAS TOO MANY BY A WIDE MARGIN — a legibility defect, not a
 * taste call, and it was measured before it was changed. On a 432px-diameter
 * sphere at 1440x900, hooking every `fillText` for five seconds of idle
 * rotation gave 61.7 pairs of OVERLAPPING labels per frame, with 74.9% of
 * everything drawn colliding with at least one neighbour. The premise of the
 * whole effect is that these are legible commands; three quarters of them were
 * sitting on top of another one.
 *
 * 58, AND THE NUMBER CAME OFF THE OVERLAP CURVE RATHER THAN OFF FEEL. Below 58
 * the curve has already flattened — 58 gives 11.0 overlapping pairs a frame and
 * 55 gives 10.3 — while each step down costs another real command out of a set
 * whose register mix is the point of it (see the note in `heroContent.ts` on
 * why the `git`, `docker` and `curl` lines are in there). Most of the reduction
 * is done by the render floor below, not by this number.
 *
 * THE SAMPLER GUARANTEES THE FEATURED FOUR SURVIVE ANY VALUE HERE, structurally
 * rather than arithmetically — `sample()` in `lib/hero/commandSphere.ts`
 * reserves them before it strides. Verified at 58: all four present, 34 of the
 * previous 90 dropped, none of them featured, two entries newly included that
 * the 90-sample had strided past. The last time this count changed without that
 * guarantee the stride silently dropped `docker ps -a`.
 *
 * `heroContent.ts` currently ships 95 fragments and the sphere draws 60 of
 * them, sampled by stride.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 58 -> 60 ON 2026-08-23, AND TWO IS THE RIGHT ANSWER RATHER THAN A TIMID ONE.
 *
 * The sphere grew (R 216 -> 273.6, `D_FRACTION` 0.30 -> 0.38) and the type grew
 * with it (`SPHERE_FONT_PX` 13 -> 16). The obvious inference is that the count
 * should scale with the surface, r-squared, to ~93. IT IS THE WRONG MEASURE,
 * because surface density is blind to the font.
 *
 * COLLISIONS SCALE AS `N² x (label area) / (disc area)`. Label area scales with
 * the SQUARE of the font size and disc area with the SQUARE of the radius, so
 * with radius scaled by `k` and font by `m` the collision-neutral count scales
 * by `k / m` — NOT by `k²`. Here `k = 1.267` and `m = 1.231`, so `k/m = 1.029`,
 * and 58 x 1.029 = 59.7 -> 60.
 *
 * The r-squared half of the reasoning is correct FOR A FIXED FONT SIZE. The
 * conclusion inverts because the same request also asked for bigger type, and
 * the font bump consumes almost exactly the surface the radius bump creates.
 *
 * AND THE PERCEIVED-SIZE FIX IS THE FONT, NOT THE COUNT. A 432px disc built out
 * of 13px type reads as "a lot of small writing"; a 547px disc built out of
 * 16px type reads as an object. Twenty more 13px commands would have made it
 * read SMALLER — more, finer texture. Which is also why this is the density cut
 * HOLDING rather than being partially reversed: 90 measured 74.9% of labels
 * colliding, and 60 on the new geometry predicts 38.1% against 58's recorded
 * 38.8% on the old one.
 *
 * THE CEILING, RECORDED SO IT IS NOT DRIFTED PAST: 66. At N=66 the collision
 * figure is +22.3% against today, which spends more than a quarter of the 78%
 * reduction the density cut bought, and past that the change stops being
 * "scaling the count to match a larger surface" and becomes a partial reversal
 * of a measured fix wearing that phrase as cover. An argument past 66 has to be
 * a MEASUREMENT showing the collision rate there is under 14.1 overlapping
 * labels per frame, not a preference for a rounder number.
 */
const SPHERE_COUNT = 60;
const SPHERE_COUNT_COMPACT = 44;

/**
 * Base type size at the near pole, CSS px. Everything else is this times the
 * fragment's depth scale.
 *
 * 13 -> 16 ON 2026-08-23, AND THIS IS THE CONSTANT THAT ACTUALLY MAKES THE
 * SPHERE READ LARGER — see `SPHERE_COUNT` for why the count barely moved.
 *
 * 16px IS `text-body`, the site's base reading size. At 16 the near face is
 * exactly as legible as the page's own body copy, which is the strongest
 * available statement that these are COMMANDS rather than texture, and the
 * mid-depth buckets (11.14 / 12.35 / 13.57) land in and just above the
 * `text-caption` band. The whole ramp is inside the site's type vocabulary
 * instead of beside it; 13 sat between two tokens and belonged to neither.
 *
 * 18 IS THE CEILING AND IT IS REFUSED. At 18 the clip guard's clean band moves
 * to vw >= 1163, which puts 1280-wide laptops into the clipping regime, and the
 * canvas would assert a LARGER type size than the DOM's reading size — which
 * inverts the split `HeroHeadline` states, that the canvas is the spectacle and
 * the DOM is the content. 15 is the documented fallback if the collision
 * prediction is refuted: it buys the collision-neutral count up to 64.
 *
 * ONE RENDER FLOOR STOPS FIRING ON DESKTOP AND THAT IS ARITHMETIC, NOT A BUG.
 * Rendered size is `base x (0.62 + (step/5) x 0.38)`, so at 16 the smallest
 * bucket is 9.92px — above `SPHERE_MIN_FONT_PX`. At 13 it was 8.06 and the
 * floor cut step 0. The 9px floor DOES NOT MOVE: it is a claim about what a
 * human can read, not about this sphere, and nothing about a larger sphere
 * makes 8px type readable. What replaces the font floor's share of the cull is
 * the ALPHA floor, which is unchanged and does the majority of it either way.
 *
 * `SPHERE_FONT_PX_COMPACT` STAYS AT 11 for the same reason the compact diameter
 * does: raising it would re-admit the collisions the render floor removed on the
 * one breakpoint that has no room to absorb them.
 */
const SPHERE_FONT_PX = 16;
const SPHERE_FONT_PX_COMPACT = 11;

/** Tracking. `em`-relative, so it follows the per-bucket font size for free. */
const SPHERE_LETTER_SPACING = "0.04em";

/**
 * Estimated horizontal advance per character, as a fraction of font size, used
 * ONLY by the clip guard in `drawCommandSphere`.
 *
 * 0.60 is the monospace advance for JetBrains Mono and every fallback in the
 * stack; 0.04 is `SPHERE_LETTER_SPACING` above, which the canvas adds per
 * character. Rounded UP to 0.66 rather than the exact 0.64, because this feeds
 * a one-directional test: over-estimating drops a fragment that would have
 * just fitted, under-estimating clips one. The first is invisible, the second
 * is the bug this guard exists for.
 *
 * NOT a substitute for `measureText` anywhere else — it is only valid for mono.
 */
const SPHERE_ADVANCE_ESTIMATE = 0.66;

/**
 * THE RENDER FLOOR. A fragment below EITHER of these is DROPPED, and it stays
 * dropped — it is not shrunk to fit and it is not left on screen at a lower
 * alpha. Unreadable mono is noise, not depth, and the premise of the whole
 * effect is that these are legible commands rather than decoration that happens
 * to be letter-shaped.
 *
 * IT DROPS OVER 175ms RATHER THAN IN ONE FRAME, AND THAT IS NOT A SOFTENING OF
 * THE RULE. Removing the standing haze and popping the labels out were two
 * separate things, and only the first was ever the goal: the floors landed as
 * hard cuts and introduced a pop of 3.75 labels per 5s at 1440 where there had
 * been none, which is an artifact of the fix rather than a property of it. The
 * exit now runs through the same `SPHERE_FADE_MS` ramp and the same
 * `state.fade` slot as the clip guard, because all three gates are one
 * question. A fragment mid-exit is also PINNED to the lowest legible bucket
 * (see `floorStep`), so it fades at a readable size instead of shrinking into
 * the mush on its way out.
 *
 * THE NUMBER THAT DECIDES WHETHER THAT IS HONEST is the share of drawn labels
 * still under 0.25 alpha. A standing layer is what was measured and deleted; a
 * bounded 175ms transit is not the same thing, but only measurement can settle
 * it. Over 20s per condition:
 *
 *     no floors at all        38.6%     the haze this whole thing removed
 *     floors as hard cuts      0%       and 3.75 pops per 5s at 1440
 *     floors faded (now)       0.7%     1440 idle
 *                              0.6%     375 idle
 *                              2.7%     1440 under a continuous cursor sweep
 *
 * The cursor figure is the adversarial one and is the one to watch: the tilt
 * drags fragments across the boundary several times faster than the idle spin,
 * so more of them are in transit at once. At 2.7% it is still fourteen times
 * below the standing haze, and every one of those fragments is on its way out
 * rather than parked.
 *
 * THAT IS THE TRIPWIRE, AND IT IS A MEASUREMENT RATHER THAN A JUDGEMENT CALL.
 * If a future edit pushes this into double digits at any viewport, the haze has
 * come back and the fade — or `SPHERE_FADE_MS`, or the count — is wrong. The
 * companion figure is the sub-9px share, which must stay at 0%: it is held
 * there by the `floorStep` pin and not by luck.
 *
 * IT USED TO BE 7px DESKTOP / 6px COMPACT, CHOSEN SO IT WOULD NEVER FIRE. The
 * comment here said so outright — "at the shipped values it never fires — the
 * far pole lands at 13 x 0.62 = 8.1px desktop and 11 x 0.62 = 6.8px compact"
 * — and described itself as a guard against some future retune. That is
 * precisely why it was not doing the job the effect needed. Measured over 20s
 * of idle rotation: 38.6% of every label drawn was under 0.25 alpha and 9.8%
 * was under 9px at 1440, rising to 50.7% under 9px at 375. Half the compact
 * sphere was mush.
 *
 * ONE FONT FLOOR FOR BOTH BREAKPOINTS NOW, NOT A PAIR. 9px is a claim about
 * what a human can read, and a phone is not the place that gets to be laxer
 * about it. The pair existed only because the two base sizes differ and the
 * guard was designed never to fire; once it is meant to fire, two numbers that
 * have to agree is the shape this repo has repeatedly had to unpick. It costs
 * the compact sphere roughly half its drawn labels — 44 built, ~22 painted —
 * and that is the correction rather than a side effect of it: at 375 the
 * compact sphere measured 78.6% of labels colliding, the worst of any viewport.
 *
 * ALPHA IS THE OTHER HALF, AND NEITHER FLOOR SUBSUMES THE OTHER. At the 13px
 * desktop base the 9px floor only cuts below t = 0.19, which the alpha floor
 * has already removed, so alpha binds; at the 11px compact base the font floor
 * cuts below t = 0.52 and is the stricter of the two. Both breakpoints need
 * both numbers.
 *
 * THE ALPHA FLOOR IS A PARTIAL BACK-HEMISPHERE CULL, AND `projectCommandSphere`
 * WARNS AGAINST EXACTLY THAT. The warning is not wrong and has not been
 * deleted; it now carries this exception recorded against it. Read it there
 * before raising 0.25 any further. Its specific objection — that culling makes
 * fragments POP at the silhouette — is the thing the fade above answers, and
 * that half of the exception has been withdrawn there rather than left
 * standing.
 */
const SPHERE_MIN_FONT_PX = 9;
const SPHERE_MIN_ALPHA = 0.25;

/**
 * How many discrete type sizes the depth ramp is quantised to.
 *
 * `ctx.font` assignment is a font-shorthand PARSE, not a field write, and it is
 * the most expensive thing in the draw loop after the glow. Six steps across a
 * 0.62–1.00 range is a ≤1px difference between neighbouring buckets at 13px —
 * invisible — in exchange for six parses a frame instead of one per fragment.
 *
 * Bucketing rather than `ctx.setTransform`: a transform would also scale the
 * letter-spacing and the shadow blur, and it would make the minimum-size rule
 * above impossible to reason about.
 *
 * "SIX PARSES A FRAME" RESTED ON THE BUCKET BEING MONOTONE ALONG THE DRAW
 * ORDER, and `SPHERE_BUCKET_HYSTERESIS` below breaks that monotonicity: two
 * adjacent fragments can now hold different buckets on the same side of a
 * boundary depending on which way each last crossed it, so the font can be
 * reassigned more than once per bucket.
 *
 * THAT COST WAS MEASURED RATHER THAN ARGUED, AND IT IS NOT NOTHING — it
 * roughly doubles. Counting `ctx.font` assignments per frame on a production
 * build, hysteresis off then on: 4.00 -> 8.35 at 1440x900 idle, 4.00 -> 7.01
 * at 1440x900 under a continuous 0.5Hz cursor sweep, 3.00 -> 5.28 at 375x812,
 * 3.00 -> 5.19 at 320x568.
 *
 * IT IS STILL WELL INSIDE THE BUDGET THIS CONSTANT EXISTS TO DEFEND, which is
 * what makes doubling acceptable rather than alarming. The number that matters
 * is the ceiling: one parse per DRAWN fragment, which is 36 at 1440 and 22 at
 * 375. 8.35 against 36 is the same order of saving the original "six against
 * ninety" bought. If a future change pushes this past roughly half the drawn
 * count, the trade has stopped being worth it — measure it, do not assume it.
 */
const SPHERE_SCALE_BUCKETS = 6;

/**
 * Bucket hysteresis, as a fraction of one bucket's width.
 *
 * WITHOUT IT A LABEL SWITCHES THE INSTANT IT RECROSSES A BOUNDARY, and the
 * switch is not subtle: one bucket is ~8% of the type size, so a 24-character
 * label changes width by ~3.3px at each end in a single frame. `Math.round` on
 * a continuously varying depth has no memory, so a label sitting near a
 * boundary while the depth wobbles pops back and forth.
 *
 * IDLE ROTATION DOES NOT PRODUCE THAT WOBBLE, AND SAYING SO IS THE POINT OF
 * THIS PARAGRAPH. Measured over 20s of idle rotation at 1440x900: 19.25 bucket
 * switches per 5s and ZERO of them reversed within 20 frames. Idle, each
 * label's depth moves smoothly in one direction at 6 deg/s, so a boundary is
 * crossed once and the crossing is a real depth change rather than dither. The
 * condition that produces dither is the CURSOR: the tilt swings +-18 deg about
 * Y at whatever rate the hand moves, several times the idle rate AND reversing.
 * Under a 0.5Hz pointer sweep the same 20s measured 65.5 switches per 5s with
 * 3.25 of them reversals. That is what this constant is for. Anyone re-deriving
 * it from an idle capture will measure nothing and conclude it is dead code.
 *
 * 0.18 — inside the 15-20% the review asked for and not at either edge. A
 * label that switched at a boundary must travel 18% of a bucket back PAST that
 * boundary before it switches again, so a wobble smaller than that is absorbed
 * entirely. Raising it much further starts to visibly delay honest depth
 * changes at the far pole, where the buckets are narrowest in `t`.
 */
const SPHERE_BUCKET_HYSTERESIS = 0.18;

/**
 * How long a fragment takes to fade out, or back in, ms.
 *
 * ONE FADE FOR EVERY WAY A FRAGMENT CAN STOP BEING DRAWN, AND THAT IS THE
 * POINT OF THE CONSTANT RATHER THAN AN ECONOMY. There are three gates — the
 * alpha floor, the font-size floor and the clip guard — and every one of them
 * means "this fragment should no longer be on screen". Giving the clip guard a
 * fade and leaving the two floors popping would have been one boundary easing
 * out beside two others snapping, in the same frame, on the same sphere. The
 * gates compose into a single `hidden` boolean and share one ramp and one
 * `state.fade` slot; there is deliberately no second duration to keep in sync.
 *
 * THE GUARD USED TO BE A HARD `continue`, so a rim label crossing the viewport
 * edge vanished between one frame and the next at full alpha. So did a label
 * crossing either floor: adding those floors removed a measured haze but
 * created a pop of its own — 3.75 labels per 5s at 1440 idle, 15.25 per 5s
 * under a cursor sweep, 2.75 per 5s at 375, all from a baseline of exactly 0,
 * because before the floors nothing was ever dropped at all. That pop and the
 * clip guard's are the same artifact and now take the same exit.
 *
 * A BOUNDED EXIT IS NOT THE HAZE COMING BACK, and that distinction is the whole
 * justification for fading a floor whose entire purpose is to delete dim text.
 * What was measured and removed was a STANDING population: 38.6% of every label
 * drawn, on every frame, below 0.25 alpha, contributing nothing but grey. What
 * this re-admits is a few fragments in transit for 175ms each — at the measured
 * crossing rates, well under one fragment on screen at any instant. The test is
 * the sub-0.25-alpha percentage and it is recorded on `SPHERE_MIN_ALPHA`.
 *
 * IT ALSO ALMOST NEVER FIRED, WHICH IS WHY THIS IS 175ms AND NOT A BIGGER
 * CHANGE. The clip test is purely static geometry — a sphere's silhouette is
 * invariant under rotation, so neither the spin nor the cursor tilt can move a
 * fragment outside the projected disc, and whether a rim label hangs off the
 * viewport depends only on the viewport size. Enumerated across every width
 * from 320 to 2560: at 1440x900 the disc spans x 777.6-1209.6 against a widest
 * label of ~103px half-width, so the guard CANNOT fire there, and measurement
 * agrees — 0 cuts in 20s, with a flat 90 labels drawn every frame. It fires on
 * compact viewports only, and rarely: 0.17 cuts per 5s at 320x568 before the
 * render floor existed.
 *
 * THE RENDER FLOOR MADE IT MATTER MORE, and that is the reason to fix it now
 * rather than to leave it. Dropping everything under 9px removed exactly the
 * small rim labels that used to fit, so what is left at the rim is bigger: the
 * same measurement at 375x812 went from 0 cuts per 5s to 1.17.
 *
 * TIME-BASED, NOT DISTANCE-BASED. A ramp over the last N pixels of travel would
 * be simpler and needs no state, but its duration would then depend on how fast
 * the label happens to be crossing, which is a different number at every
 * viewport size — and it would not carry to the two floors at all, which are
 * crossed in DEPTH rather than in screen space. 175ms is 175ms, on all three
 * gates and at every viewport.
 *
 * LINEAR RATHER THAN EASED, deliberately: an exponential ease never reaches
 * zero, so "the fade is done" would need a threshold, and the whole point of
 * the constant is that the duration is exactly what it says.
 */
const SPHERE_FADE_MS = 175;

/**
 * The near band's tint, as rgb channels.
 *
 * NOT A NEW COLOUR. It is the cool white the deleted glass wordmark used for
 * its top-lit highlight, so the sphere's front face is lit the same way its
 * predecessor was. The palette on this surface is cyan plus luminance — one
 * hue. `hero-accent` teal must never appear here: it is the affordance colour,
 * and the two token names are near-anagrams whose swap renders something
 * plausible on a dark panel rather than erroring.
 */
const SPHERE_NEAR_TINT = "191, 238, 255";

/**
 * Glow. There is no postprocessing on a 2D context, so this is `shadowBlur` —
 * by a wide margin the most expensive call in this file, which is why it is
 * capped to the front third rather than applied to every fragment.
 *
 * Rejection criterion: if the sphere's marginal cost exceeds 6ms, drop this
 * entirely in favour of a double-draw — the same fragment at alpha x 0.35 with
 * no shadow, painted first. Cheaper, and at this size visually close.
 */
const SPHERE_GLOW_BLUR = 6;
const SPHERE_GLOW_ALPHA = 0.45;

/**
 * A pointer parked motionless inside the hero stops steering the sphere after
 * this long.
 *
 * Without it a visitor who simply stops moving leaves the sphere permanently
 * tilted, which reads as STUCK rather than as attentive. It deliberately does
 * not apply to the mesh's cursor void: that void tracks a position, and a
 * position parked over the field is still a cursor sitting there.
 */
const SPHERE_POINTER_IDLE_MS = 2_500;

/** Fallback stack if `--font-jetbrains-mono` cannot be read. */
const SPHERE_FONT_FALLBACK = 'ui-monospace, "JetBrains Mono", monospace';

/**
 * PER-FRAGMENT DRAW STATE — the two things the draw pass has to remember
 * between frames, and the only two.
 *
 * IT LIVES HERE AND NOT ON `ProjectedFragment`, WHICH WOULD HAVE BEEN THE
 * SHORTER EDIT. `lib/hero/commandSphere.ts` is geometry only; the note on
 * `SPHERE_SCALE_MIN` there says exporting the scale endpoints was preferred
 * over exporting a bucketing function precisely so that a rendering concern
 * would not end up in a module whose whole point is not having any. Which
 * bucket a fragment was last DRAWN in, and how far a fade toward the viewport
 * edge has got, are both rendering concerns of the most literal kind.
 *
 * TYPED ARRAYS, ALLOCATED ONCE PER SPHERE BUILD, for the reason the geometry
 * module states in its header: this runs inside the same rAF tick as an O(n²)
 * link pass, and a per-frame allocation here shows up as GC sawtooth across the
 * whole hero rather than as one slow function.
 *
 * BOTH USE -1 AS "NOT YET SET", AND THAT SENTINEL IS LOAD-BEARING FOR REDUCED
 * MOTION. That path draws exactly one frame and never draws another. A fade
 * initialised to 0 would render nothing at all on it; a fade initialised to 1
 * would render a fragment a gate means to hide. -1 means "adopt the target
 * immediately, do not animate toward it", so the first frame — the only frame
 * a reduced-motion visitor sees — is the correct still image. It matters more
 * now than when only the clip guard faded: the alpha floor hides ~38% of the
 * set, so a wrong sentinel would be wrong about a third of the sphere rather
 * than about a couple of rim labels. Verified rather than assumed — 36 / 22 /
 * 22 labels at 1440 / 375 / 320 under reduced motion, four of four featured
 * commands visible at each.
 */
type SphereDrawState = {
  /** The GEOMETRIC bucket each fragment was last assigned, for the hysteresis.
   *  -1 = never assigned. Deliberately the UNCLAMPED one: a fragment pinned to
   *  the legibility floor while it fades has to resume from where its depth
   *  actually is, not from the floor it was held at. */
  bucket: Int8Array;
  /** Visibility, 0..1, across all three gates. -1 = never evaluated. */
  fade: Float32Array;
};

function createSphereDrawState(count: number): SphereDrawState {
  const state = {
    bucket: new Int8Array(count),
    fade: new Float32Array(count),
  };
  state.bucket.fill(-1);
  state.fade.fill(-1);
  return state;
}

/**
 * The sphere's entire draw pass. Deliberately ONE function and deliberately NOT
 * interleaved with the mesh loop below — the two effects share a frame, which
 * is a performance decision, and nothing about it requires them to share code.
 *
 * It reads `sphere.projected` and the far-to-near `order` that
 * `projectCommandSphere` just wrote. It computes no geometry of its own.
 *
 * THE ORDER'S MONOTONICITY IS WHAT MAKES THIS CHEAP. `t` only increases along
 * it, so the scale bucket, the colour stop and the glow flag each change at
 * most a handful of times across the whole set instead of once per fragment.
 * That turns the three expensive pieces of context state — the font parse, the
 * fill style and `shadowBlur` — into a near-constant number of assignments.
 *
 * ALPHA GOES THROUGH `globalAlpha`, NOT THROUGH THE FILL STRING. Per-fragment
 * `rgba(...)` would allocate one string per fragment per frame for a value that
 * a context field already carries, and it would defeat the two-stop colour scheme by
 * making every fragment its own style.
 */
function drawCommandSphere(
  ctx: CanvasRenderingContext2D,
  sphere: CommandSphere,
  order: readonly number[],
  state: SphereDrawState,
  dtMs: number,
  accent: string,
  fontStack: string,
  compact: boolean,
  viewportWidth: number,
): void {
  const basePx = compact ? SPHERE_FONT_PX_COMPACT : SPHERE_FONT_PX;
  const span = SPHERE_SCALE_MAX - SPHERE_SCALE_MIN;
  const steps = SPHERE_SCALE_BUCKETS - 1;

  // THE SMALLEST BUCKET THAT STILL CLEARS THE FONT FLOOR. At most six
  // iterations, once per frame, never per fragment.
  //
  // IT EXISTS SO THAT A FADING FRAGMENT FADES AT A LEGIBLE SIZE. The font floor
  // is a claim about what a human can read; a fragment left to keep shrinking
  // while it faded would spend its whole 175ms exit being exactly the illegible
  // mush the floor was added to delete, and it would put the sub-9px share —
  // one of the two numbers this whole change is judged on — back above zero.
  //
  // PINNED TO THE LOWEST LEGAL BUCKET, NOT TO `SPHERE_MIN_FONT_PX` ITSELF. The
  // floor is 9px and the buckets near it are 8.492 and 9.328 at the compact
  // base; pinning to 9 would introduce a seventh font size that exists only
  // during fades, and would visibly step the glyph down at the moment the fade
  // starts. Pinning to the bucket means the fragment simply stops shrinking and
  // then fades, and adds no new `ctx.font` value at all.
  //
  // The `< steps` guard bounds the loop if a future `basePx` were ever smaller
  // than the floor — in which case nothing is legible and everything fades out.
  // Degenerate, but bounded, and visibly wrong rather than silently wrong.
  let floorStep = 0;
  while (
    floorStep < steps &&
    basePx * (SPHERE_SCALE_MIN + (floorStep / steps) * span) <
      SPHERE_MIN_FONT_PX
  ) {
    floorStep++;
  }

  const prevAlpha = ctx.globalAlpha;
  ctx.textAlign = "center";
  // `middle`, so a fragment's anchor is the optical centre of its line rather
  // than its baseline. The navbar clearance in `placeCommandSphere` is computed
  // against the sphere's disc; a baseline anchor would push the topmost
  // fragment's cap height above that disc and eat the clearance the cap exists
  // to guarantee.
  ctx.textBaseline = "middle";
  ctx.letterSpacing = SPHERE_LETTER_SPACING;

  let bucket = -1;
  let tinted = false;
  let glowing = false;
  ctx.fillStyle = `rgb(${accent})`;

  for (let i = 0; i < order.length; i++) {
    const index = order[i];
    const f = sphere.projected[index];

    // THE BUCKET, WITH HYSTERESIS. `q` is the unquantised bucket position;
    // `Math.round(q)` is what this used to be and is still what a fragment gets
    // the first time it is drawn. After that the fragment KEEPS its previous
    // bucket until `q` leaves that bucket's nominal half-width by
    // `SPHERE_BUCKET_HYSTERESIS`, so a label that switched at a boundary has to
    // travel 18% of a bucket back past that boundary to switch again.
    const q = ((f.scale - SPHERE_SCALE_MIN) / span) * steps;
    const held = state.bucket[index];
    const step =
      held < 0 || Math.abs(q - held) > 0.5 + SPHERE_BUCKET_HYSTERESIS
        ? Math.round(q)
        : held;
    state.bucket[index] = step;

    // THE DRAWN BUCKET, PINNED UP TO THE LEGIBILITY FLOOR. `step` stays the
    // geometric answer and is what the hysteresis remembers; `drawStep` is what
    // is painted. The two differ only while a fragment is fading out below the
    // font floor — see `floorStep` above for why the pin is to a bucket rather
    // than to the floor value itself.
    const legible = step >= floorStep;
    const drawStep = legible ? step : floorStep;
    const px = basePx * (SPHERE_SCALE_MIN + (drawStep / steps) * span);


    // HORIZONTAL CLIP GUARD. `textAlign` is `center`, so a rim fragment extends
    // half its width past its anchor — and on a narrow viewport the rim IS the
    // viewport edge. The design spec sized the compact sphere without counting
    // text width, which clipped rim fragments by ~78px at 360px; centring the
    // compact sphere fixed the disc, this fixes the glyphs that hang off it.
    //
    // Estimated, not measured: `measureText` per fragment per frame is a real
    // cost for a guard that fires on a handful of them, and mono advance is
    // knowable — 0.6em plus the letter-spacing already set above. The estimate
    // runs slightly WIDE on purpose, so a marginal fragment is dropped rather
    // than clipped. Cheap and one-directional.
    const halfWidth = f.text.length * px * SPHERE_ADVANCE_ESTIMATE * 0.5;
    const clipped = f.x - halfWidth < 0 || f.x + halfWidth > viewportWidth;

    // THE THREE GATES, AS ONE ANSWER. Font floor, alpha floor, clip guard —
    // each of them means "this fragment should not be on screen", so they
    // compose with `||` and share one ramp. Every one of them used to be its
    // own hard `continue`, and the two floors were added in the commit before
    // this one, which is where their pop came from.
    const hidden = !legible || f.alpha < SPHERE_MIN_ALPHA || clipped;

    // A LINEAR RAMP DRIVEN BY REAL `dtMs`, so the duration is the same on any
    // display — the same correction the rest of this file took. `-1` means the
    // fragment has not been evaluated yet and adopts its target outright, which
    // is what keeps the single reduced-motion frame correct: there is no frame
    // before it to have faded from. `dtMs <= 0` holds the previous value rather
    // than advancing, which is the first frame after a mount or after a wake.
    const prev = state.fade[index];
    const target = hidden ? 0 : 1;
    let fade: number;
    if (prev < 0 || dtMs <= 0) {
      fade = prev < 0 ? target : prev;
    } else {
      const amount = dtMs / SPHERE_FADE_MS;
      fade =
        target > prev
          ? Math.min(target, prev + amount)
          : Math.max(target, prev - amount);
    }
    state.fade[index] = fade;

    // THE EARLY-OUT IS STILL ABOVE `ctx.font`, WHICH IS WHY THE GATES MOVED
    // DOWN HERE RATHER THAN THE FADE MOVING UP. A fragment that has finished
    // fading out costs one comparison and nothing else — no font parse, no fill
    // style, no shadow — so the ~38% of the set that is hidden at any moment is
    // exactly as cheap as it was when the floor was a hard `continue`. Only
    // fragments actually in transit pay for any of this.
    if (fade <= 0) continue;

    // THE PREFIX PROPERTY IS GONE, AND IT DID NOT MATTER. `order` is far-to-near
    // and both `alpha` and `scale` are monotone along it, so while the gates
    // were hard cuts everything they dropped formed a clean prefix of this loop
    // — which is what kept `tinted` and `glowing` from being skipped past.
    // Fading breaks that: a fragment mid-exit is drawn out among fragments that
    // are not.
    //
    // It is safe for a reason worth stating rather than re-deriving. Those two
    // locals are corrected by every drawn fragment — `f.near !== tinted` flips
    // whenever they disagree — so they are self-healing per fragment and can
    // only cost an extra assignment, never desync. And there is no extra cost to
    // pay: every fragment any gate can hide sits below `GLOW_T` 0.6 and
    // `NEAR_TINT_T` 0.75, so it is `near: false, glow: false`, which is the
    // state those locals already hold.
    if (drawStep !== bucket) {
      bucket = drawStep;
      ctx.font = `${px}px ${fontStack}`;
    }

    if (f.near !== tinted) {
      tinted = f.near;
      ctx.fillStyle = tinted ? `rgb(${SPHERE_NEAR_TINT})` : `rgb(${accent})`;
    }
    // Skipped entirely on compact viewports: `shadowBlur` is the one call here
    // that a mid-range phone cannot absorb, and it is the cue that reads least
    // at a 223px sphere.
    if (!compact && f.glow !== glowing) {
      glowing = f.glow;
      ctx.shadowColor = glowing ? `rgba(${accent}, ${SPHERE_GLOW_ALPHA})` : "";
      ctx.shadowBlur = glowing ? SPHERE_GLOW_BLUR : 0;
    }

    ctx.globalAlpha = f.alpha * fade;
    ctx.fillText(f.text, f.x, f.y);
  }

  // Context state is global and survives the frame boundary. Leaving a shadow
  // or a tracking value set would silently apply it to the mesh's next pass.
  ctx.globalAlpha = prevAlpha;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "";
  ctx.letterSpacing = "0px";
}

type Node = {
  homeX: number;
  homeY: number;
  /** Rendered position. Home + drift + displacement. */
  x: number;
  y: number;
  /** Ambient drift offset from home, and its velocity. */
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  /** Current displacement offset, lerped toward the target each frame. */
  ox: number;
  oy: number;
  radius: number;
};

type ParticleGridProps = {
  /**
   * Density and ink. One of the two module presets — `HERO_FIELD` (the
   * default) or `QUIET_FIELD`. Both are module constants, which is what keeps
   * this out of the effect's dependency churn: the identity is stable for the
   * life of the process, so naming it in the deps array below re-runs nothing.
   * DO NOT construct one inline at a call site; that would rebuild the whole
   * field on every render.
   */
  field?: ParticleFieldTuning;
  /**
   * Whether the command sphere is drawn. `docs/07_SITE_RESTRUCTURE.md` §6 makes
   * the sphere HOME-ONLY, so About passes `false`.
   *
   * A SEPARATE PROP FROM `field`, ON PURPOSE. The sphere is a second effect
   * sharing this canvas's tick — `lib/hero/commandSphere.ts` owns all of its
   * geometry and this file owns only its draw pass. Folding a boolean into an
   * object named for density and alpha would be the naming lie this project has
   * had to correct several times: "is the sphere here" is not an intensity.
   */
  sphere?: boolean;
  /**
   * Whether the nodes wander when nothing is touching them.
   *
   * `"drift"` (the default, and the hero's) is the shipped behaviour: every
   * node is seeded a `vx`/`vy` in `build()` and wanders forever inside a
   * `DRIFT_CLAMP` ball around its home. The clamp REFLECTS rather than damps,
   * deliberately, so the field has no resting state and structurally cannot
   * reach one — which means the tick can never stop.
   *
   * `"settled"` removes that and only that. The cursor void, the displacement
   * kernel, the ragged link break and the eased return home are all unchanged;
   * what goes is the idle shimmer, and with it the loop. `/about` passes it
   * because `docs/07_SITE_RESTRUCTURE.md` §6 makes that page the one fully
   * quiet page, and a full-viewport canvas repainting sixty times a second
   * behind 65 words was the last thing contradicting it. (That sentence read
   * "65 words that cannot scroll" until 2026-08-23; `/about` scrolls below
   * `lg` now, and the argument never depended on the scroll — a page that
   * repaints forever behind static copy is the same defect either way. What the
   * split DID change is the canvas's size on phones: the page box is taller
   * than the viewport there, so this preset covers more area and seeds more
   * nodes. It still paints once and parks — MEASURED, 0 frames in 5s idle at
   * 375x667 and 1440x900.)
   * The hero keeps `"drift"`: Tier 1 is where the spectacle budget is spent,
   * and the hero is a section a visitor scrolls past rather than a terminal
   * page they sit on.
   *
   * A THIRD PROP, FOR THE REASON `sphere` IS THE SECOND. This is not a field on
   * `ParticleFieldTuning` — that object is density and ink, "one perceptual
   * decision", and "does the field wander" is not an intensity any more than
   * "is the sphere here" was. Same naming lie, same answer.
   *
   * NOR IS IT INFERRED FROM `sphere === false`. The two happen to agree on both
   * of today's call sites and are unrelated properties; coupling them because
   * one page sets both would be that same lie in a shape that is harder to see.
   *
   * A TWO-VALUE UNION RATHER THAN A BOOLEAN, so the call site reads as what it
   * is. `ambient="settled"` says something; `drift={false}` says it backwards.
   */
  ambient?: "drift" | "settled";
  /**
   * The hand-off's arrival burst, delivered as a REF HOLDING A COUNTER rather
   * than as a value, and every word of that is load-bearing.
   *
   * WHY A REF AND NOT A PROP VALUE. The tick below lives in one effect whose
   * deps are `[reducedMotion, field, withSphere, ambient]`. A changing prop
   * there would tear down and rebuild the canvas, the field and the sphere ON
   * THE HAND-OFF FRAME — the sphere would restart at its rest angle in the
   * middle of the arrival. A ref's identity never changes, so naming it in
   * those deps re-runs nothing, exactly as `field` does.
   *
   * WHY A COUNTER AND NOT A BOOLEAN. The burst is an EVENT. `IntroProvider`
   * seeds `arriving` true on a client navigation, so a boolean would either
   * fire on every mount or never fire at all — `IntroEntrance.tsx`'s
   * `waitedForHandoff` exists for the same reason. The tick remembers the last
   * value it acted on and arms a burst only when it changes, which also makes
   * the request survive being made before the sphere exists.
   *
   * UNDEFINED IS THE HONEST DEFAULT: `/about` renders this canvas with
   * `sphere={false}` and there is nothing to burst.
   */
  arrivalBurst?: { current: number };
};

/**
 * IT TAKES PROPS AGAIN, AND THEY ARE NOT THE OLD ONES. This component used to
 * take the wordmark's measured box so it could place the permanent void under
 * it; the subject is drawn by this canvas now, so that plumbing is gone for
 * good and must not come back (see the header's "STILL MEASURED, NOT AGREED").
 * What it takes instead is a per-page dressing — how thick the field is, and
 * whether the sphere rides on it — because the About page renders the same
 * canvas quieter. Neither prop is measured from the DOM and neither changes
 * after mount.
 *
 * ALL THREE DEFAULT TO THE HERO'S BEHAVIOUR, so Home's call site stays a bare
 * `<ParticleGrid />` and every one of these changes is invisible there.
 */
export function ParticleGrid({
  field = HERO_FIELD,
  sphere: withSphere = true,
  ambient = "drift",
  arrivalBurst,
}: ParticleGridProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  /* Live input state. Written by listeners, read by the rAF tick. Never read
     during render — none of this belongs in React state, and putting it there
     would re-render the tree at pointer rate. */
  const pointer = useRef<{
    x: number;
    y: number;
    active: boolean;
    /** rAF-clock timestamp of the last real move, for the sphere's idle return. */
    lastMove: number;
  }>({
    x: 0,
    y: 0,
    active: false,
    lastMove: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let resizeTimer = 0;
    let disposed = false;

    /** The sphere. Rebuilt only when its fragment count changes; otherwise the
     *  same object is re-placed, so a resize never resets its rotation. */
    let sphere: CommandSphere | null = null;
    /** Index-parallel to `sphere.fragments`, and allocated and discarded with
     *  it — a stale array against a rebuilt sphere would carry one fragment's
     *  bucket and fade onto a different fragment. */
    let sphereDraw: SphereDrawState | null = null;
    /** The last `arrivalBurst.current` this tick acted on.
     *
     *  SEEDED FROM THE REF, NOT FROM 0. This effect re-runs when `reducedMotion`
     *  changes, and a resize rebuilds the sphere without re-running it. Seeding
     *  0 would mean any later re-run saw `current` 1 against a remembered 0 and
     *  replayed the arrival burst minutes after the arrival. Seeding from the
     *  ref makes a burst deliverable exactly once per increment. */
    let burstSeen = arrivalBurst?.current ?? 0;
    let compact = false;
    /** rAF timestamp of the previous tick, for real elapsed `dt`. */
    let lastFrame = 0;

    /**
     * The active theme's ink, as canvas channels, plus the alphas and falloff
     * that go with it. Read on every rebuild AND on every theme flip — cheap,
     * and it lets a themed ink flow through without this file hardcoding a hex.
     * THE SPHERE READS THIS SAME LOCAL; a second `getPropertyValue` could
     * disagree with it after a theme flip.
     *
     * THERE IS NO LITERAL FALLBACK COLOUR ANY MORE. It used to initialise to
     * `"0, 229, 255"` — the hero cyan, spelled out here as a second source of
     * truth for a value `app/globals.css` owns, and on a code path `/about`
     * also runs. Before any successful read `inkRead` is false and the
     * ink-consuming passes below are skipped, so a stylesheet that never
     * applied gives an unpainted canvas rather than a Tier 1 accent appearing
     * somewhere by default.
     *
     * A FAILED READ IS ATOMIC: NOTHING MOVES. `paint`, `ink` and `inkRead` are
     * written together, after the guard, or not at all — so the field always
     * draws one theme's ink with that same theme's alphas and falloff.
     *
     * THIS BLOCK USED TO DESCRIBE BEHAVIOUR THE CODE DID NOT HAVE, in two ways
     * that only became reachable when the `MutationObserver` started calling
     * this outside `build()`:
     *
     *   1. `paint = field[readAppliedTheme()]` ran BEFORE the `hex.length`
     *      guard. A failed read therefore adopted the NEW theme's `nodeAlpha`,
     *      `linkPeakAlpha` and `linkFalloff` while keeping the OLD theme's ink
     *      channels — the one combination neither theme was ever tuned for.
     *   2. It claimed a failed read leaves "`inkRead` false". `inkRead` is only
     *      ever assigned `true`, so after one success it can never go back.
     *
     * (2) IS NOW THE INTENDED SEMANTICS RATHER THAN A BUG, and it is a one-way
     * latch on purpose. Once a read has succeeded, a later failure means a
     * theme flip whose custom property did not resolve; the last good pair is a
     * complete, coherent field for the other theme, and drawing it is strictly
     * better than blanking the canvas mid-session. The never-painted case is
     * the one worth degrading to nothing, and it is the one the latch still
     * covers.
     */
    let ink = "";
    let inkRead = false;
    let paint: FieldInk = field.dark;
    const readInk = () => {
      // LOCAL, NOT `paint`. This is the whole of fix (1) above: the candidate
      // theme is not published until its ink has been parsed.
      const next = field[readAppliedTheme()];
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(next.ink)
        .trim();
      // #00e5ff -> "0, 229, 255". Canvas needs channels for rgba().
      const hex = raw.replace("#", "");
      if (hex.length !== 6) return;
      const n = parseInt(hex, 16);
      // The three writes are together and last, so there is no interleaving to
      // reason about. Do not hoist any of them above the guard.
      paint = next;
      ink = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      inkRead = true;
    };

    /**
     * The mono stack for `ctx.font`, READ FROM THE CUSTOM PROPERTY RATHER THAN
     * WRITTEN AS A LITERAL.
     *
     * `next/font` generates a hashed family name — `__JetBrains_Mono_a1b2c3` —
     * that changes whenever the font config does. A literal `"JetBrains Mono"`
     * would be wrong on the next build and wrong SILENTLY: canvas falls back to
     * a system mono, nothing throws, `tsc` and `next build` both stay green,
     * and the only symptom is a sphere set in the wrong typeface. The generic
     * tail is kept behind it so a failed read still lands on a monospace.
     */
    let fontStack = SPHERE_FONT_FALLBACK;
    const readFont = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-jetbrains-mono")
        .trim();
      fontStack = raw ? `${raw}, ui-monospace, monospace` : SPHERE_FONT_FALLBACK;
    };

    const build = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      // DPR scaling: back the canvas with real device pixels, then scale the
      // context once so every coordinate below stays in CSS px.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(
        MIN_NODES,
        Math.min(field.maxNodes, Math.round((width * height) / field.areaPerNode)),
      );

      nodes = Array.from({ length: count }, () => {
        const homeX = Math.random() * width;
        const homeY = Math.random() * height;
        return {
          homeX,
          homeY,
          x: homeX,
          y: homeY,
          dx: 0,
          dy: 0,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          ox: 0,
          oy: 0,
          radius: RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN),
        };
      });

      readInk();
      readFont();

      // The sphere is rebuilt only when the fragment count actually changes —
      // i.e. when a resize crosses the 768px gate. Re-placing preserves the
      // rotation state, so dragging a window edge does not snap the sphere back
      // to its rest orientation on every debounced rebuild.
      compact = width < INTERACTIVE_MIN_WIDTH;
      // NOT BUILT AT ALL WHEN THE PAGE DOES NOT WANT IT, rather than built and
      // skipped at draw time. `sphere` stays null, so the void anchor it feeds
      // the mesh is null too and About's field has no permanent tear in it —
      // which is the point: there is no subject there to tear a hole behind.
      // The fragments, the per-frame sort and every `fillText` call all go with
      // it.
      if (!withSphere) {
        sphere = null;
        sphereDraw = null;
      } else {
        const fragments = compact ? SPHERE_COUNT_COMPACT : SPHERE_COUNT;
        if (!sphere || sphere.fragments.length !== fragments) {
          sphere = createCommandSphere(
            HERO_COMMAND_FRAGMENTS,
            fragments,
            HERO_COMMAND_FEATURED,
          );
          // REALLOCATED WITH THE SPHERE AND ONLY WITH IT. A plain resize
          // re-places the same sphere and must keep both arrays, or every
          // fragment would re-adopt its bucket and fade from scratch on each
          // debounced rebuild — which is a visible flash of the whole rim at
          // the end of a window drag.
          sphereDraw = createSphereDrawState(fragments);
        }
        // Fed the canvas's OWN untransformed CSS size, never a rect measured
        // off anything inside the hero's stage wrapper. That wrapper carries a
        // live GSAP transform for the arrival's 1.6s, and a rect read through
        // it would be in a different coordinate space than everything drawn
        // here.
        placeCommandSphere(sphere, width, height, compact);
      }
    };

    /**
     * The displacement kernel, shared by both voids exactly as the brief
     * requires. The RADIUS is a parameter now, and that is the only thing that
     * differs between the two callers: the cursor passes `VOID_RADIUS`, the
     * sphere passes its own projected radius plus a margin. One kernel, two
     * sizes — not two kernels.
     *
     * Measures from the node's HOME position, not its current one:
     * measuring from the displaced position is a feedback loop — a node pushed
     * out of the radius stops being pushed, springs back in, is pushed again,
     * and visibly buzzes at the void's edge.
     *
     * Returns the offset it would apply, for the caller to compare against
     * other anchors. It never writes.
     */
    const pushFrom = (
      node: Node,
      cx: number,
      cy: number,
      radius: number,
    ): { x: number; y: number; mag: number } => {
      const dx = node.homeX - cx;
      const dy = node.homeY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist >= radius) return { x: 0, y: 0, mag: 0 };

      const strength = (radius - dist) / radius;
      // Guard the exact-centre case: a node whose home is precisely the anchor
      // has no direction to be pushed in, and dividing by zero would put NaN
      // into its position permanently.
      const ux = dist === 0 ? 1 : dx / dist;
      const uy = dist === 0 ? 0 : dy / dist;
      const mag = strength * radius;
      return { x: ux * mag, y: uy * mag, mag };
    };

    /**
     * CAN THE POINTER MOVE THIS FIELD AT ALL? Read by the tick, to decide
     * whether a live pointer opens a void, AND by both pointer listeners, to
     * decide whether an event is worth waking a parked loop for.
     *
     * ONE DEFINITION WITH TWO READERS, and that is the whole reason it exists
     * as a function. The tick's test used to be written inline; once the
     * listeners also had to ask the question, a second inline copy would have
     * been two spellings of one rule, and the failure mode is silent — the
     * listener would wake a frame that the tick then declines to act on,
     * repainting an identical image once per `pointermove`. Measured before
     * this existed: a 16-step touch drag at 375px drew 17 frames instead of 1,
     * and a desktop sweep under reduced motion drew 21 instead of 0. Neither
     * changed a pixel.
     *
     * `width` IS READ LIVE, NOT CAPTURED. It is reassigned by `build()`, so a
     * resize across `INTERACTIVE_MIN_WIDTH` flips this without a rebind.
     */
    const canInteract = () =>
      !reducedMotion && width >= INTERACTIVE_MIN_WIDTH;

    const frame = (now: number) => {
      // THE NEXT FRAME IS SCHEDULED AT THE BOTTOM OF THIS ONE, not here. It
      // used to be queued on the first line, before any work, which was fine
      // while the only question was `reducedMotion` — a value known before the
      // frame ran. "Is anything still moving" is not: it depends on the node
      // loop below having run. See the `restless` block after it.
      ctx.clearRect(0, 0, width, height);

      // CLAMPED, WHICH IT DID NOT USED TO BE. While every step below was a
      // fixed amount per frame, an enormous `dt` was harmless here because
      // nothing read it — only `stepCommandSphere` did, and it clamps its own
      // argument. Now that the drift and the lerp are both dt-scaled, the first
      // frame back from a background tab would carry the entire hidden interval
      // and jump the whole mesh in one frame. `clampFrameMs` is the same 50ms
      // ceiling the sphere already used, shared rather than restated — see
      // `lib/animation/frameRate.ts` on why one number and not two.
      const dt = lastFrame === 0 ? 0 : clampFrameMs(now - lastFrame);
      lastFrame = now;

      // Hoisted out of the node loop: one multiplier and one coefficient for
      // every node in this frame. Recomputing them per node would be up to 300
      // `Math.pow` calls a frame for a value that cannot vary within one.
      //
      // BOTH ARE 1.0 / `LERP` AT EXACTLY 60Hz, which is what makes this a fix
      // and not a retune. `frameScale(16.667) === 1` and
      // `dampingFactor(0.12, 16.667) === 0.12`.
      const driftScale = frameScale(dt);
      const lerpK = dampingFactor(LERP, dt);

      const interactive = canInteract() && pointer.current.active;

      /* --- the sphere's geometry, before the mesh needs its void --------- */
      let sphereOrder: readonly number[] = [];
      let voidAnchor: { cx: number; cy: number; radius: number } | null = null;
      if (sphere) {
        if (!reducedMotion) {
          /* THE ARRIVAL BURST, CONSUMED AS AN EDGE. Read here rather than in an
             effect so that a request made before the sphere existed is still
             honoured on the first frame it does — and so that nothing about it
             can reach the dependency array above. Inside `!reducedMotion`
             because a visitor who asked for less motion gets the frozen sphere,
             not a faster one. */
          if (arrivalBurst && arrivalBurst.current !== burstSeen) {
            burstSeen = arrivalBurst.current;
            startCommandSphereBurst(sphere);
          }

          // The sphere's tilt gates on the SAME `interactive` flag as the
          // cursor void, plus an inactivity window on top: a pointer parked
          // motionless still counts as a position for the field's void, but it
          // stops steering the sphere, which would otherwise sit permanently
          // tilted and read as stuck.
          const steering =
            interactive && now - pointer.current.lastMove < SPHERE_POINTER_IDLE_MS;
          stepCommandSphere(
            sphere,
            dt,
            width,
            height,
            steering ? pointer.current : null,
          );
        }
        sphereOrder = projectCommandSphere(sphere);
        voidAnchor = commandSphereVoid(sphere);
      }

      /** Set by the node loop below if ANY node is not yet at its target — the
       *  tear opening, closing, or following a moving cursor. Read by
       *  `restless`. A tear held open by a motionless cursor does NOT set it. */
      let chasing = false;

      for (const node of nodes) {
        /* --- ambient drift, bounded ------------------------------------- */
        // `ambient === "settled"` leaves `dx`/`dy` at 0 for the life of the
        // node, so `node.x = node.homeX + node.ox` below still holds exactly —
        // nothing else in this loop needs to know the drift is off.
        if (!reducedMotion && ambient === "drift") {
          node.dx += node.vx * driftScale;
          node.dy += node.vy * driftScale;
          const drift = Math.hypot(node.dx, node.dy);
          if (drift > DRIFT_CLAMP) {
            // Reflect rather than clamp: a hard clamp parks the node on the
            // boundary and it stops looking alive.
            node.vx = -node.vx;
            node.vy = -node.vy;
            node.dx = (node.dx / drift) * DRIFT_CLAMP;
            node.dy = (node.dy / drift) * DRIFT_CLAMP;
          }
        }

        /* --- displacement: largest single anchor wins, never the sum ---- */
        let best = { x: 0, y: 0, mag: 0 };
        if (interactive) {
          const p = pushFrom(
            node,
            pointer.current.x,
            pointer.current.y,
            VOID_RADIUS,
          );
          if (p.mag > best.mag) best = p;
        }
        if (voidAnchor) {
          const p = pushFrom(
            node,
            voidAnchor.cx,
            voidAnchor.cy,
            voidAnchor.radius,
          );
          if (p.mag > best.mag) best = p;
        }

        node.ox += (best.x - node.ox) * lerpK;
        node.oy += (best.y - node.oy) * lerpK;

        // THE LAST SUB-PIXEL OF THE RETURN IS SNAPPED, and only when nothing is
        // pulling. `LERP` is exponential and never reaches zero, so a field
        // allowed to park keeps whatever residual offset it held at the frame
        // the loop stopped — up to `SETTLE_EPSILON` per axis, frozen there for
        // as long as the visitor reads the page.
        //
        // IT IS NOT A COSMETIC TIDY-UP. Without it the resting image is NOT the
        // mount image: measured at 1440x900 DPR 2, 2,090 of 15,552,000 channel
        // bytes differed, max delta 4/255 and 92% of them 1/255 — invisible,
        // but it is antialiasing coverage on a node edge that has no business
        // depending on where a pointer happened to leave. The snap makes
        // `node.x === node.homeX` hold exactly at rest, which is what makes the
        // settled frame a deterministic picture rather than one of many.
        //
        // THE SNAP AND THE PARK TEST ARE THE SAME TEST, which is what stops
        // them disagreeing about which frame is the settled one. `best.mag`
        // being 0 means `best.x` and `best.y` are both 0, so the condition
        // below is literally `chasing`'s |target - offset| <= EPSILON with the
        // target at 0. The snap therefore fires only on a frame the park test
        // already calls settled, and setting the offset to exactly 0 keeps it
        // settled — there is no frame on which one of them moves the node and
        // the other then sees a change.
        if (
          best.mag === 0 &&
          Math.abs(node.ox) <= SETTLE_EPSILON &&
          Math.abs(node.oy) <= SETTLE_EPSILON
        ) {
          node.ox = 0;
          node.oy = 0;
        }

        // IS THIS NODE STILL CHASING ITS TARGET? Measured against `best` — the
        // displacement it is easing TOWARD — and never against zero.
        //
        // THAT IS THE WHOLE DIFFERENCE BETWEEN "SOMETHING IS DISPLACED" AND
        // "SOMETHING IS CHANGING", and it decides whether this page can idle at
        // all. A held tear is displaced BY CONSTRUCTION: every node inside
        // `VOID_RADIUS` sits far from home for as long as the cursor rests
        // there, so a test against zero stays true forever. The field is
        // full-viewport on `/about` and `pointerleave` only fires at the window
        // edge, so "the cursor is resting somewhere on the page" is not an edge
        // case — it is a visitor who moved the mouse once and is now reading.
        // Against zero, that visitor pays 60fps for the entire visit, which is
        // precisely the cost this whole mechanism exists to remove.
        //
        // Against `best` it is right in every phase, for one reason: while the
        // pointer MOVES, `best` moves with it and the node cannot converge;
        // while the pointer is HELD, `best` is constant, the node converges to
        // within a sub-pixel of it, and no further frame can differ from this
        // one. Parking there is not an approximation of stillness — the field
        // has genuinely finished, and the held tear stays exactly as drawn.
        //
        // NO PREVIOUS-FRAME STATE, DELIBERATELY. A frame-to-frame delta would
        // need each node's prior offset, and the first frame after a `wake()`
        // has no prior offset to compare against — it would have to be
        // special-cased as "changed" or the loop could park before it moved.
        // This form is stateless: it asks where the node is relative to where
        // it is going, which one frame can answer on its own.
        //
        // `!chasing &&` short-circuits the scan. Once any node is chasing, the
        // rest of the pass costs one boolean each, which is what keeps this off
        // the hero's hot loop — there `ambient === "drift"` makes the answer
        // moot before it is ever read.
        if (
          !chasing &&
          (Math.abs(best.x - node.ox) > SETTLE_EPSILON ||
            Math.abs(best.y - node.oy) > SETTLE_EPSILON)
        ) {
          chasing = true;
        }

        node.x = node.homeX + node.dx + node.ox;
        node.y = node.homeY + node.dy + node.oy;
      }

      /* --- schedule, or park -------------------------------------------
         IS ANYTHING STILL MOVING? Only knowable here, after the node loop.

         THIS BLOCK MUST STAY ABOVE THE `inkRead` GUARD BELOW. That guard
         returns early on a stylesheet that has not applied yet; below it, a
         failed read would park the loop permanently and the canvas could never
         self-heal on the next successful one — which the guard's own comment
         explicitly requires it to do.

         `!reducedMotion` GATES THE WHOLE TEST and must never be demoted to one
         more disjunct: `sphere !== null` is true on the hero under reduced
         motion, so OR-ing it in would start a loop there that is currently,
         correctly, never scheduled at all.

         THE QUESTION IS "DID ANYTHING CHANGE", NOT "IS ANYTHING DISPLACED", and
         getting that wrong is how this mechanism silently does nothing. An
         earlier version of this predicate asked the second, as
         `interactive || nodes.some(n => |n.ox| > EPSILON)`. BOTH of those
         disjuncts hold a loop open forever under a resting cursor — the first
         because a motionless pointer still counts as active, the second because
         a held tear is displaced by definition — so removing either ALONE would
         have changed nothing measurable. `chasing` replaces both at once. See
         its test in the node loop for why it is measured against `best` rather
         than against zero. */
      const restless =
        !reducedMotion &&
        // Cheapest first, and the ordering matters: the hero satisfies the
        // first disjunct, so `chasing` is computed but never consulted.
        (ambient === "drift" ||
          // The sphere turns on its own timeline whether or not anything is
          // touching it.
          sphere !== null ||
          chasing);

      if (restless) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        // A PARKED LOOP MAKES `lastFrame` STALE, and `dt` feeds
        // `stepCommandSphere`. Waking after an idle minute would hand it a
        // 60,000ms step. It cannot bite today — the only caller that parks is
        // `/about`, where `sphere` is null — but it is a live trap for whoever
        // next combines `ambient="settled"` with a sphere, and clearing it here
        // makes the first frame after a wake behave exactly like the first
        // frame after mount.
        //
        // IT CAN BITE TODAY NOW, AND ON THE PARKING CALLER ITSELF. `dt` no
        // longer feeds only the sphere: `driftScale` and `lerpK` above read it
        // too, so a stale `lastFrame` would hand `/about`'s cursor void a
        // multi-second step and snap the whole tear open in one frame. This
        // line and `clampFrameMs` are now two independent guards against the
        // same thing, which is the correct number of guards for it.
        //
        // THE COST IS ONE STATIONARY FRAME PER WAKE, and it is deliberate.
        // `lastFrame === 0` gives `dt = 0`, so `driftScale` and `lerpK` are
        // both 0 and that frame moves nothing. It does not strand the settle:
        // `chasing` is measured against `best` rather than against the previous
        // frame, so it is still true on a frame that did not move, and the loop
        // queues the next one — which carries a real delta. The visible effect
        // is that the void's ~1.05s close starts one frame (~16ms) later.
        lastFrame = 0;
      }

      // NOTHING BELOW PAINTS UNTIL THE INK HAS BEEN READ ONCE. The geometry
      // above still runs, so the field keeps living and the first successful
      // read — the next rebuild or the next theme flip — self-heals into a
      // moving field rather than a frozen one.
      if (!inkRead) return;

      /* --- links, from DISPLACED positions ----------------------------- */
      ctx.lineWidth = 1;
      // Hoisted out of an O(n²) loop, and `linear` is not premature: at
      // `HERO_FIELD`'s 300 nodes this branch is taken ~45,000 times a frame,
      // and the hero's falloff is 1 in both themes, so it keeps the hero's
      // link pass on the exact arithmetic it shipped with — no `Math.pow`, no
      // change to a single painted pixel.
      const peak = paint.linkPeakAlpha;
      const gamma = paint.linkFalloff;
      const linear = gamma === 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          // Cheap reject before the sqrt — this is the inner loop of an O(n²)
          // pass and hypot() on every pair is most of its cost.
          if (Math.abs(dx) > LINK_RADIUS || Math.abs(dy) > LINK_RADIUS) continue;
          const dist = Math.hypot(dx, dy);
          if (dist >= LINK_RADIUS) continue;
          const t = 1 - dist / LINK_RADIUS;
          ctx.strokeStyle = `rgba(${ink}, ${
            (linear ? t : Math.pow(t, gamma)) * peak
          })`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      /* --- nodes -------------------------------------------------------- */
      ctx.fillStyle = `rgba(${ink}, ${paint.nodeAlpha})`;
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      /* --- the sphere, LAST, so it composites in front of the mesh ------- */
      if (sphere && sphereDraw) {
        // `ink` is `--accent-hero` here and only here: the sphere is built only
        // when `withSphere`, which is the hero's call site, whose preset names
        // that property in both of its identical theme halves.
        drawCommandSphere(
          ctx,
          sphere,
          sphereOrder,
          sphereDraw,
          dt,
          ink,
          fontStack,
          compact,
          width,
        );
      }
    };

    /* --- listeners: they only write scalars --------------------------- */
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.current.x = event.clientX - rect.left;
      pointer.current.y = event.clientY - rect.top;
      pointer.current.active = true;
      // Same clock the tick reads. `performance.now()` and the rAF timestamp
      // share an origin, so comparing them is safe and no second clock is
      // introduced.
      pointer.current.lastMove = performance.now();
      // GATED ON THE SAME PREDICATE THE TICK USES. Below
      // `INTERACTIVE_MIN_WIDTH`, and under reduced motion, this pointer cannot
      // move a single node, so waking a parked loop for it would repaint a
      // byte-identical frame at pointer rate. Measured without this guard: a
      // 16-step drag at 375x667 drew 17 frames instead of 1, and a desktop
      // sweep under reduced motion drew 21 instead of 0.
      if (canInteract()) wake();
    };
    const onPointerLeave = () => {
      // The void closes because `active` goes false, so the nodes lerp home
      // through the same path they lerped out along. Nothing snaps.
      pointer.current.active = false;
      // AND THIS `wake()` IS THE WHOLE REASON THE SHAPE IS A STOPPABLE LOOP
      // RATHER THAN "DRAW ON POINTERMOVE". `pointerleave` fires ONCE. A version
      // that painted a frame in the handler would leave the field permanently
      // torn open in whatever shape the pointer abandoned it, with the nodes
      // 12% of the way home — `LERP` is one frame's worth of easing, not a
      // transition. The void has to be ANIMATED shut along the path it opened
      // along, which is what the comment above is protecting, and that needs
      // the ~62 frames `SETTLE_EPSILON` allows.
      //
      // Same gate as `onPointerMove`, and it is safe for the identical reason:
      // if the pointer could not interact, it left nothing displaced to close.
      // The one case where the field IS displaced while `canInteract()` is
      // false is a resize that crossed the breakpoint mid-tear, and `onResize`
      // has already woken the loop to settle it.
      if (canInteract()) wake();
    };
    /**
     * RESTART THE TICK IF IT HAS PARKED. The single entry point into the loop:
     * mount, resize, theme flip, resolved webfont and both pointer events all
     * go through this one function, and it replaces the `drawOnce()` helper and
     * the five scattered `if (reducedMotion)` branches that used to sit beside
     * those call sites as a parallel render path.
     *
     * IT SCHEDULES UNCONDITIONALLY, AND THAT IS NOT A REGRESSION FOR REDUCED
     * MOTION. It queues one frame; `restless` then declines to queue a second.
     * One drawn frame per event is exactly what `drawOnce()` produced, arrived
     * at through the same code the animated path runs rather than through a
     * second one that had to agree with it.
     *
     * `raf === 0` IS A SAFE "PARKED" SENTINEL: `requestAnimationFrame` is
     * specified to return a non-zero id, so no live handle can be mistaken for
     * an absent one. When the loop is already running this is a no-op, which is
     * why the hero — whose loop never parks — gets nothing new from any of the
     * call sites below.
     *
     * IT DRAWS ON THE NEXT FRAME RATHER THAN SYNCHRONOUSLY, unlike the
     * `drawOnce()` it replaces. That is deliberate on the pointer path: rAF
     * coalesces, and `pointermove` fires at pointer rate, which exceeds 60Hz on
     * a 120Hz display or a high-poll mouse. The same argument the header makes
     * for the transform math applies unchanged to the draw.
     */
    const wake = () => {
      if (raf === 0 && !disposed) raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        wake();
      }, RESIZE_DEBOUNCE_MS);
    };

    /**
     * THE THEME FLIP, WHICH NOTHING ELSE HERE CAN SEE.
     *
     * `lib/theme.ts`'s `applyTheme` is the single writer of the class on
     * <html> — the pre-paint script, the toggle, and the cross-tab `storage`
     * listener all go through it — so observing that one attribute catches
     * every way the theme can change, with no new shared API and no change to
     * a module the root layout imports. A bespoke `themechange` event was the
     * alternative and was refused for exactly that: it would add a second
     * source of truth alongside a class that is already documented as the
     * only one.
     *
     * IT RE-READS THE PALETTE, NOT THE FIELD. Calling `build()` here would
     * reseed every node's random home position, so toggling the theme would
     * visibly scramble the mesh — a layout change to announce a colour change.
     * The animated path picks the new channels up on the very next rAF for
     * free, because `frame()` reads `ink` fresh every tick; only the
     * reduced-motion path, which draws once and never again, has to be told to
     * repaint.
     *
     * ADDED UNCONDITIONALLY, not gated on `field` or `withSphere`, so the hero
     * and About run the identical code path. The observer fires only on a
     * theme flip, so the cost of carrying it on a surface whose ink happens to
     * be theme-exempt is nil — and gating it is how the two paths drift apart.
     *
     * THE `wake()` USED TO BE `if (reducedMotion) drawOnce()`, AND ITS SCOPE
     * JUST WIDENED. The sentence above — "the animated path picks the new
     * channels up on the very next rAF for free" — assumed there is always a
     * next rAF. Under `ambient="settled"` there is not: `/about` idles with the
     * loop parked, so without this the field would keep painting the previous
     * theme's ink until something else happened to wake it. It is one frame,
     * and it repaints in the new colour.
     */
    const themeObserver = new MutationObserver(() => {
      readInk();
      wake();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    build();
    wake();
    // A CONTINUOUS LOOP SELF-HEALS A LATE WEBFONT — it redraws sixty times a
    // second and picks the real family up the moment it resolves. A loop that
    // parks does not, so if its one frame lands before the font does, the
    // sphere is set in a system mono forever. `AssetLoader` awaits
    // `fonts.ready` before the hero is revealed, but its 8s stall hand-off can
    // put the hero on screen without it.
    //
    // NO LONGER GATED ON `reducedMotion`, because that is no longer the only
    // way this loop can park — `ambient="settled"` is the other, and the two
    // now share one repaint path instead of one of them carrying a private fix.
    // It costs the hero nothing: `wake()` is a no-op while a frame is queued.
    if (document.fonts?.ready) void document.fonts.ready.then(wake);

    // `pointermove` rather than `mousemove`: one event for mouse and pen, and
    // a touch drag reports as a pointer too — harmless here because the
    // interaction is width-gated off on the viewports where that happens.
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
    };
    // `field`, `withSphere` and `ambient` are constants at every call site — a
    // module preset and two literals — so naming them here re-runs nothing. It
    // just stops them from silently going stale if a future caller ever does
    // swap one. `arrivalBurst` is a REF, so its identity is stable for the same
    // reason and for a sharper one: a rebuild here on the hand-off frame would
    // restart the sphere at its rest angle mid-arrival.
  }, [reducedMotion, field, withSphere, ambient, arrivalBurst]);

  return (
    // `pointer-events-none` is load-bearing: the pointer listener is on the
    // CONTAINER, so the canvas must never intercept anything aimed at the
    // content above it.
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

export default ParticleGrid;
