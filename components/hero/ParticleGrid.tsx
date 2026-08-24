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
 * DELIBERATELY SPARSER THAN THE FIELD, AND THE ARITHMETIC THAT SAID SO WAS
 * NEVER LIKE-FOR-LIKE. It read: "At the 1440px radius this is roughly one
 * fragment per 10,000px² of projected area against the mesh's `areaPerNode` of
 * 5,200, so the sphere never reads as denser than the atmosphere it floats in
 * front of." 10,000 is `4πR²/N` at the RETIRED R = 216 / N = 58 — a SURFACE
 * area, compared against a projected one. At today's R = 273.6 and N = 80 the
 * two readings are **11,759px² per fragment by surface** and **2,940px² by
 * projection**, so by the metric actually named in that sentence the sphere is
 * now the DENSER of the two, not the sparser. (Those figures were quoted for
 * N = 65 for part of the same day, which is the exact failure this paragraph
 * exists to record, committed by the paragraph itself.)
 *
 * THE CONCLUSION IS NOT RESCUED BY PICKING THE FLATTERING NUMBER. Command
 * strings and 2px nodes are not comparable objects and no ratio of areas makes
 * them so; what keeps the sphere from reading as denser than the field is that
 * `commandSphereVoid` tears the mesh out from behind it entirely. That is the
 * real mechanism and it is unaffected by any count. This paragraph is kept,
 * corrected, rather than deleted, because the number in it has been quoted.
 *
 * The compact count is not a performance concession — a ~232px sphere cannot
 * legibly hold ninety command strings at any readable size.
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
 * `heroContent.ts` currently ships 95 fragments and the sphere samples **80**
 * of them by stride. (It said 60, then 65, each time ninety lines above the
 * block that changed it, and each time the parenthetical mocking the previous
 * stale value was itself stale. Verified by counting
 * `HERO_COMMAND_FRAGMENTS`, not by trusting this sentence.)
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
 * EVERY COLLISION FIGURE IN THIS BLOCK IS ANCHORED TO THE RETIRED LINEAR RAMP
 * AND READS LOW AGAINST TODAY'S CODE — 2026-08-24. The perspective ramp shrinks
 * the mean drawn label, so at an unchanged N=60 the measured collision rate at
 * 1440x900 fell **49.6% -> 43.5% idle and 50.9% -> 44.9% under the cursor**,
 * with `pairs/frame` 12.04 -> 9.65. The count did not move and did not need to;
 * this is recorded so nobody reads "predicts 38.1%" as a live figure, and so
 * the ceiling below is understood against the right baseline.
 *
 * THE CEILING, RECORDED SO IT IS NOT DRIFTED PAST: 66. IT DOES NOT MOVE JUST
 * BECAUSE COLLISIONS GOT CHEAPER ON 2026-08-24. The ramp change bought roughly
 * a 19% reduction in mean label area, so N=66 would now land near the
 * PRE-CHANGE absolute collision rate rather than 22.3% above today's — which is
 * exactly the "partial reversal of a measured fix wearing that phrase as cover"
 * this paragraph was written to refuse. The escape clause is unchanged and is
 * still the only one: a MEASUREMENT under 14.1 overlapping labels per frame.
 * At N=66 the collision
 * figure is +22.3% against the pre-2026-08-24 baseline, which spends more than a quarter of the 78%
 * reduction the density cut bought, and past that the change stops being
 * "scaling the count to match a larger surface" and becomes a partial reversal
 * of a measured fix wearing that phrase as cover. An argument past 66 has to be
 * a MEASUREMENT showing the collision rate there is under 14.1 overlapping
 * labels per frame, not a preference for a rounder number.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 60 -> 65 ON 2026-08-24, AND IT IS THE FIRST TIME THIS COUNT HAS GONE UP
 * WITHOUT COSTING ANYTHING, BECAUSE IT WAS PAID FOR FIRST.
 *
 * Saad asked for more depth and added "if that requires increase in the
 * commands rotating increase them as well". It did not require it — but
 * `PERSPECTIVE` 2.5 -> 2.0 and the font floor 9 -> 6 shrink every label behind
 * the near face, and the `k / m` rule above says what that is worth: radius
 * unchanged (k = 1), mean label size down to m = 0.861 of what it was, so the
 * collision-neutral count scales by 1 / 0.861 = 1.162 and 60 x 1.162 = 69.7.
 *
 * `m` IS MODELLED, NOT MEASURED, and this file does not get to blur that. It is
 * `sqrt(mean px^2 after / mean px^2 before)` integrated in closed form over `z`
 * uniform on [-1, 1] with the alpha cull applied — 121.2 against 163.6 of mean
 * label area. Everything BELOW this paragraph is a browser measurement.
 *
 * THE RULE PREDICTED 70 AND THE MEASUREMENT REFUSED IT, WHICH IS WHY THE COUNT
 * IS 65. Built and measured at 1440x900 idle, 20s each, rather than derived:
 *
 *              drawn/frame   collision   pairs/frame
 *   60, before      37.70       43.5%          9.65    (f 2.5, floor 9)
 *   60, after       37.36       40.2%          8.67    the depth change alone
 *   65, SHIPPED     39.71       40.2%          9.50
 *   70              43.55       46.8%         12.52    predicted by k/m
 *
 * So the depth change bought 3.3 points at a fixed count, and 65 spends
 * exactly that and no more: five more commands on screen at a collision rate
 * BELOW the one it is replacing, and `pairs/frame` still under the 14.1
 * ceiling. `k / m` over-predicted by five because mean AREA is not the whole
 * story once labels are also redistributed toward the rim by a stronger
 * perspective; the rule stays useful as a first estimate and stays exactly as
 * unreliable as it was always documented to be.
 *
 * THE CEILING OF 66 IS NOT TOUCHED, AND ITS ESCAPE CLAUSE WOULD HAVE ADMITTED
 * 70 — WHICH IS A PROBLEM WITH THE CLAUSE, RECORDED HERE RATHER THAN QUIETLY
 * STEPPED AROUND. The clause is stated twice above as "a MEASUREMENT showing
 * the collision rate there is under 14.1 overlapping labels per frame".
 * **N=70 measures 12.52 pairs/frame. It passes.** So the gate as written does
 * not refuse 70 and this block must not pretend it did.
 *
 * 70 WAS REFUSED ON A STRICTER TEST, NAMED HERE SO THE NEXT PERSON APPLIES THE
 * SAME ONE: no regression in COLLISION RATE against the state being replaced.
 * 70 is 46.8% against 43.5% shipped; 65 is 40.2%. `pairs/frame` is an absolute
 * count and rises with anything that puts more labels on screen, so it bounds
 * the worst case but cannot detect a density regression — which is precisely
 * what 70 is. THE 14.1 CEILING SHOULD BE READ AS A HARD CAP AND NOT AS A
 * SUFFICIENT CONDITION, and anyone raising this count past 66 owes both
 * numbers, not one.
 *
 * (The ceiling's own arithmetic — "+22.3% against the pre-2026-08-24 baseline",
 * "roughly a 19% reduction in mean label area" — is anchored one generation
 * back and does not account for this change's further reduction to m = 0.861.
 * Left as-is deliberately: re-deriving a refusal to make it stricter is fine,
 * re-deriving it while raising the number it guards is how a ceiling erodes.)
 *
 * VERIFIED AT 65 rather than assumed, the check this constant's own history
 * demands: all four featured commands present at 1440 idle and under the cursor
 * sweep, and on the frozen reduced-motion frame. Adversarial condition too —
 * 1440 under a continuous cursor sweep is 41.5% and 9.75 pairs, both BELOW the
 * 44.9% / 10.4 that shipped the day before.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 65 -> 80 ON 2026-08-24. IT IS A REGRESSION ON EVERY COLLISION MEASURE THIS
 * FILE HAS, IT BREAKS TWO GUARDS WRITTEN ABOVE, AND IT SHIPS ANYWAY BECAUSE
 * SAAD ASKED FOR MORE COMMANDS TWICE. READ THE NUMBERS BEFORE MOVING IT AGAIN.
 *
 * WHAT IT COSTS. Measured at 1440x900, 20s per condition. `FRONT` counts only
 * pairs where BOTH labels are at or above 0.5 alpha — `t = 0.71`, the front
 * third that `GLOW_T` already treats as the near face — because with a 2x size
 * range an overlap between two 7.7px specks at 0.28 alpha and an overlap
 * between two 16px labels are not the same event:
 *
 *          drawn  pairs  collision │ FRONT drawn  pairs  collision
 *    60*    37.47  13.37    53.6%  │      17.52   1.55     17.3%
 *    65     39.70   9.50    40.2%  │      19.46   1.59     16.3%
 *    80     48.81  14.98    50.2%  │      23.82   2.83     22.3%   SHIPPED
 *    95     59.06  22.74    55.1%  │      28.32   4.63     29.7%   REFUSED
 *
 *   * 60 is the pre-depth-ramp build of two days earlier, rebuilt from
 *     `95ec7fa` and measured with the same rig, for a real baseline.
 *
 * BOTH GUARDS ABOVE SAY NO, AND NEITHER IS BEING REINTERPRETED:
 *
 *   - The 14.1 pairs/frame ceiling's escape clause asks for a measurement
 *     UNDER 14.1. This is 14.98. It fails.
 *   - The stricter test this file invented six paragraphs up to refuse 70 —
 *     "no regression in COLLISION RATE against the state being replaced" —
 *     fails far worse: 50.2% against 65's 40.2% is a TEN-point regression,
 *     three times the 3.3-point one that got 70 refused.
 *
 * SO IT IS AN OVERRIDE, NOT AN ARGUMENT. The person whose site this is asked
 * for more commands in two consecutive tickets and was shown these numbers.
 * That is the whole justification and it is a sufficient one; what would not
 * be sufficient is dressing it as a pass.
 *
 * >> THE FIRST DRAFT OF THIS BLOCK DID EXACTLY THAT AND IT IS WORTH KEEPING ON
 * >> THE RECORD. It claimed: "two days ago this sphere shipped 60 fragments at
 * >> 49.6% collision with almost no size range, so ESSENTIALLY ALL of that was
 * >> front-face collision. 80 fragments at 22.6% front-face collision is more
 * >> commands AND less tangling of the ones anyone reads." Front-face is
 * >> defined by ALPHA, and neither alpha constant has moved through any of
 * >> these changes, so the front-face share was never going to be a function of
 * >> the size range. The 60-fragment build was rebuilt and MEASURED at **17.3%
 * >> front-face collision** — better than the 22.3% being shipped, not worse.
 * >> The inference was wrong, it was the load-bearing sentence, and it was
 * >> caught in review rather than by the build.
 *
 * WHAT IS ACTUALLY BETTER THAN THE 60-FRAGMENT BASELINE: overall collision
 * (50.2% against 53.6%), on a third more commands. What is worse: front-face,
 * 22.3% against 17.3%. Both are true; neither on its own is the story.
 *
 * 95 IS THE WHOLE POOL AND IT WAS BUILT AND LOOKED AT rather than reasoned
 * about, which is why it is here as a REFUSED row instead of as an option.
 * `iptables -A INPUT` sits on `ping -c 4`, two different `openssl` invocations
 * stack on each other, `ansible-playbook -i` runs through `kubectl exec -it` —
 * all at full size and full alpha. That is where this stops.
 *
 * THE NUMBER TO WATCH IF THIS MOVES AGAIN is front-face collision, because it
 * is the one that tracks what a reader experiences: 17.3 -> 16.3 -> 22.3 ->
 * 29.7 across the four rows. There is no threshold recorded here, deliberately
 * — inventing one that the shipped value happens to pass is the mistake the
 * `>>` block above records.
 *
 * COMPACT DOES NOT MOVE AND IT WAS TESTED, NOT ASSUMED. 44 measured 32.4%
 * front-face collision at 375 and 41.1% at 320 against 40's 28.7% and 35.3%.
 * There was never any room there and there still is not.
 *
 * THE FEATURED FOUR SURVIVE 80 — 1440 idle, 1440 cursor, and the frozen
 * reduced-motion frame. The pool is 95, so the stride is now thin: 80 of 95.
 */
const SPHERE_COUNT = 80;

/**
 * 44 -> 38 ON 2026-08-24, AND IT IS THE `k / m` RULE ABOVE APPLIED TO A CHANGE
 * IN WHAT GETS DRAWN RATHER THAN IN WHAT GETS SAMPLED.
 *
 * WHAT MOVED. The depth ramp became the perspective divide and the render
 * floor's cull went with it — see the remap in `drawCommandSphere`. At base 11
 * the OLD arithmetic made `floorStep` 3 of 5, which culled everything with
 * `t < 0.6`: a font-size test doing a density job, by accident rather than by
 * design. Removing it restored the alpha floor as the only cull, exactly as
 * `SPHERE_FONT_PX`'s note says it should be — and admitted the labels the
 * accident had been removing. MEASURED at 375x667, count still 44: drawn per
 * frame 22.35 -> 26.13 and collision 60.4% -> 63.4%.
 *
 * THAT IS A REGRESSION ON THE ONE BREAKPOINT WITH NO ROOM, so the density came
 * off the count, which is the lever this file already documents, instead of off
 * a cull nobody designed. 38 was MEASURED rather than derived — the drawn count
 * is what collides, and it is not linear in the sampled count once the alpha
 * floor is doing the cutting.
 *
 * MEASURED AT 38, and it beats the state it is restoring on both numbers:
 *
 *              drawn/frame   collision   pairs/frame
 *   44, before      22.35       60.4%          8.20
 *   44, after       26.13       63.4%         12.59
 *   38, shipped     23.20       58.0%         10.86
 *
 * So 5.5% MORE labels are on screen than before the change at a LOWER collision
 * rate, and `pairs/frame` stays under the 14.1 ceiling this file records. 320
 * moved the same way: 70.0% -> 68.6%.
 *
 * THE FEATURED FOUR SURVIVE 38, verified rather than assumed — the last time
 * this count changed without checking, the stride silently dropped
 * `docker ps -a`. All four present at 375 and at 320, idle and cursor, and on
 * the frozen reduced-motion frame at both.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 38 -> 40 ON 2026-08-24. TWO COMMANDS, WHICH IS ALL COMPACT HAD ROOM FOR, AND
 * THE ONLY REASON IT HAD ANY IS THAT `SPHERE_MIN_FONT_PX` STOPPED PINNING IT.
 *
 * The compact ramp was the flattest thing on the sphere — 9.50..11.00px, a
 * 1.16x range, because an 11px base against a 9px floor cannot express more
 * than 11/9 and the block below said so in as many words. Dropping the floor to
 * 6 is what unlocked it: 6.91..11.00px, **1.59x**. It read "ten painted sizes
 * where there were seven" for an hour; the buckets are gone as of the same day
 * and the count of painted sizes is now just the count of drawn labels — 24 at
 * 375, every one of them a different size.
 *
 * MEASURED, 20s per condition, against the 38 it replaces:
 *
 *      375x667      drawn/frame   collision   pairs/frame
 *   38, before          23.20       58.0%         10.86
 *   40, SHIPPED         24.89       55.2%          9.28
 *   45                  27.80       60.9%         12.02
 *
 *      320x568      drawn/frame   collision   pairs/frame
 *   38, before             —        68.6%            —
 *   40, SHIPPED         24.89       66.0%         12.36
 *   45                  27.80       68.2%         15.23
 *
 * 40 IS BETTER THAN 38 ON EVERY NUMBER AT BOTH COMPACT WIDTHS, which is the
 * only reason it moved at all. 45 is what the `k / m` rule predicted (38 /
 * 0.841 = 45.2, modelled the same way as desktop's) and it is refused by the
 * same measurement that refused 70 on
 * desktop: it puts 320 at 15.23 pairs, OVER the 14.1 ceiling this file records,
 * on the one breakpoint that has never had room.
 *
 * THE `drawn/frame` COLUMN IS IDENTICAL AT 375 AND 320 AND THAT IS NOT A
 * COPY-PASTE — flagged in review, and worth pinning down because it looks like
 * one to four significant figures. Which fragments get drawn is decided by
 * DEPTH (`SPHERE_MIN_ALPHA`) and not by disc size; the sphere is deterministic,
 * both runs start from the same rest angle and last the same 20s; and the clip
 * guard, the one gate that IS positional, measured 0 cuts at both. So the two
 * runs necessarily draw the same set. What differs is where those labels land
 * — the disc is 232.5px at 375 and 200px at 320 — which is why the collision
 * and `pairs/frame` columns diverge and the drawn column cannot. The parse
 * figures are identical for the same reason, and so are the tripwires derived
 * from them.
 *
 * THE FEATURED FOUR SURVIVE 40 — checked at 375 and 320, idle and under the
 * frozen reduced-motion frame, four of four at each.
 */
const SPHERE_COUNT_COMPACT = 40;

/**
 * Base type size at the near pole, CSS px. Everything else is this times the
 * fragment's depth scale.
 *
 * 13 -> 16 ON 2026-08-23, AND THIS IS THE CONSTANT THAT ACTUALLY MAKES THE
 * SPHERE READ LARGER — see `SPHERE_COUNT` for why the count barely moved.
 *
 * 16px IS `text-body`, the site's base reading size. At 16 the near face is
 * exactly as legible as the page's own body copy, which is the strongest
 * available statement that these are COMMANDS rather than texture. THAT IS THE
 * LOAD-BEARING HALF AND IT IS UNTOUCHED.
 *
 * THE OTHER HALF USED TO SAY the mid-depth buckets "land in and just above the
 * `text-caption` band" and conclude that "the whole ramp is inside the site's
 * type vocabulary instead of beside it". THAT WAS TRUE WHILE THE SMALLEST
 * PAINTED SIZE WAS 12.35px, just above `--text-caption` (0.75rem = 12px). It is
 * not true as shipped: the painted range is **7.7-16.00px on desktop and
 * 6.9-11.00px on compact**, so the far end of the ramp is well BELOW the
 * smallest type token on the site. (It was 10.75 / 9.50 for the few hours
 * between the ramp change and the depth change; both numbers are recorded here
 * because the direction of travel is the point. The bottom of the range is
 * quoted loosely now because it is no longer a fixed value: with the buckets
 * retired every label has its own size, so the smallest one painted depends on
 * where the spiral happens to be.)
 *
 * THAT IS ACCEPTED DELIBERATELY RATHER THAN OVERLOOKED, AND ON 2026-08-24 IT
 * WAS ACCEPTED A SECOND TIME, FURTHER DOWN, ON SAAD'S EXPLICIT INSTRUCTION. The
 * far end of this ramp is DEPTH CUEING, not type — a label at 7.82px and 0.29
 * alpha is not asking to be read at a glance, it is telling you it is at the
 * back of a sphere. What keeps it honest is no longer the FLOOR, which moved to
 * 6 for exactly this reason; it is that size and alpha fall together, so
 * nothing is ever small and bright. The type vocabulary claim survives where it
 * matters and only where it matters: the near face is `text-body` exactly. Do
 * not "fix" this by raising the floor back to 12px — that would delete the back
 * half of the sphere, which is the half Saad asked to be able to see receding.
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
 * >> THAT PARAGRAPH IS OBSOLETE AS OF 2026-08-24 AND IS KEPT BECAUSE ITS LAST
 * >> THREE SENTENCES ARE NOT. The sizing formula it quotes no longer exists:
 * >> the depth ramp is the projection's perspective divide now
 * >> (`commandSphere.ts`, `SCALE_NORM`), rendered size is
 * >> `base x (0.4286 + (step/8) x 0.5714)`, and at base 16 the bottom two steps
 * >> are 6.86px and 8.00px.
 * >>
 * >> THE PARAGRAPH ABOVE HELD FOR ABOUT AN HOUR AND IS CORRECTED HERE RATHER
 * >> THAN REWRITTEN, because the sequence is the lesson. It went on to say
 * >> "THE RENDER FLOOR FIRES ON DESKTOP AGAIN, `floorStep` is 2, and the
 * >> smallest drawn size is 9.14px" — true of the ramp change ALONE, and false
 * >> as shipped. Letting the geometric range reach the renderer unmapped did
 * >> not merely pin those buckets, it CULLED them (`legible` feeds `hidden`),
 * >> and at base 11 that cost 72% of the labels on a phone: 22.35 drawn per
 * >> frame down to 6.29, measured. The remap in `drawCommandSphere` is the fix.
 * >>
 * >> AS SHIPPED, THE RENDER FLOOR FIRES NOWHERE. `floorStep` is 0 at both
 * >> breakpoints, `legible` is always true, and the minimum rendered size is
 * >> `basePx * lowScale` = exactly 9.00px by remap rather than by pin. The 9px
 * >> floor is untouched and still does not move; what moved is that the ramp
 * >> now REACHES it instead of stopping 0.9px above it. `SPHERE_FONT_PX` is
 * >> unchanged at 16 and the 18px refusal above still stands.
 * >>
 * >> "THE 9px FLOOR IS UNTOUCHED AND STILL DOES NOT MOVE" LASTED ONE DAY. It
 * >> is 6 as of 2026-08-24, moved by Saad, and its own block carries the
 * >> reversal. The rest of that paragraph survives the move verbatim: the
 * >> render floor still fires nowhere, `floorStep` is still 0 at both
 * >> breakpoints, `legible` is still always true, and the minimum rendered
 * >> size is still `basePx * lowScale` exactly — 6.00px now rather than 9.00.
 * >> `SPHERE_FONT_PX` is STILL 16 and the 18px refusal above STILL stands: the
 * >> depth Saad asked for was bought at the FAR end of the ramp, not by
 * >> inflating the near face, which is the only end the DOM's reading size has
 * >> an opinion about.
 *
 * `SPHERE_FONT_PX_COMPACT` STAYS AT 11 for the same reason the compact diameter
 * does: raising it would re-admit the collisions the render floor removed on the
 * one breakpoint that has no room to absorb them.
 */
const SPHERE_FONT_PX = 16;
const SPHERE_FONT_PX_COMPACT = 11;

/**
 * Tracking. `em`-relative, so it follows each fragment's size for free — under
 * the per-fragment transform, 0.04em of the base font scaled by `drawK` is
 * exactly 0.04em of the drawn size. (It said "the per-bucket font size" until
 * the buckets were retired on 2026-08-24.)
 *
 * IT IS ASSIGNED BEFORE `ctx.font` IN `drawCommandSphere`, WHICH IS SAFE AND
 * WAS CHECKED RATHER THAN ASSUMED — an `em` length set against the context's
 * default `10px sans-serif` and then left there while the font changes would
 * make the first frame's tracking wrong, and under `prefers-reduced-motion`
 * the first frame is the ONLY frame. Measured in a bare canvas: setting
 * `letterSpacing` then `font` and setting `font` then `letterSpacing` both
 * measure 94.36874 for ten `m`s at 16px mono, against 87.96875 with no
 * tracking. Blink re-resolves the `em` on the font assignment. No reorder
 * needed.
 */
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
 * question. A fragment mid-exit fades at a readable size instead of shrinking
 * into the mush on its way out — that was `floorStep`'s pin when this was
 * written and it is the remap in `drawCommandSphere` now: the render range
 * BOTTOMS OUT at `SPHERE_MIN_FONT_PX` (9.00px when this was written, 6.00px
 * since 2026-08-24), so a fragment keeps shrinking honestly as it recedes and
 * simply cannot go under the floor. Same outcome, and it no longer depends
 * on a gate that also decides visibility.
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
 * RE-TAKEN ON 2026-08-24, because the ramp under those numbers is retired and a
 * measured figure may not be re-quoted against code that did not produce it.
 * The alpha boundary itself did not move, so the transit rate should not have,
 * and it did not: **0.7% at 1440 idle, 2.8% at 1440 cursor, 0.9% at 375, 1.1%
 * at 320** — the same order, and the two that moved at all moved by 0.2-0.4pt
 * because slightly more labels are drawn. The tripwire below is unchanged and
 * still nowhere near.
 *
 * The cursor figure is the adversarial one and is the one to watch: the tilt
 * drags fragments across the boundary several times faster than the idle spin,
 * so more of them are in transit at once. At 2.7% it is still fourteen times
 * below the standing haze, and every one of those fragments is on its way out
 * rather than parked.
 *
 * THAT IS THE TRIPWIRE, AND IT IS A MEASUREMENT RATHER THAN A JUDGEMENT CALL.
 * If a future edit pushes this into double digits at any viewport, the haze has
 * come back and the fade — or `SPHERE_FADE_MS`, or the count — is wrong.
 *
 * RE-TAKEN AGAIN ON 2026-08-24 AFTER THE DEPTH CHANGE, and it is the number
 * that licensed that change: neither alpha constant moved, so this boundary is
 * unchanged, and it reads **0.6% at 1440 idle, 2.3% at 1440 cursor, 0.6% at
 * 375 and 0.6% at 320** — flat or slightly better than the run before it.
 *
 * >> "The companion figure is the sub-9px share, which must stay at 0%: it is
 * >> held there by the `floorStep` pin and not by luck." THAT COMPANION IS
 * >> RETIRED, deliberately and by Saad — the floor is 6 now and the sub-9px
 * >> share is 31.8% on desktop by design. The block at `SPHERE_MIN_FONT_PX`
 * >> carries why it stopped being a defect metric and what replaces it. THIS
 * >> tripwire, the sub-0.25-alpha one, is untouched and is now the only one.
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
 * ONE FONT FLOOR FOR BOTH BREAKPOINTS NOW, NOT A PAIR. 9px was a claim about
 * what a human can read, and a phone is not the place that gets to be laxer
 * about it. The pair existed only because the two base sizes differ and the
 * guard was designed never to fire; once it is meant to fire, two numbers that
 * have to agree is the shape this repo has repeatedly had to unpick.
 *
 * IT USED TO COST THE COMPACT SPHERE ROUGHLY HALF ITS DRAWN LABELS — "44 built,
 * ~22 painted" — AND AS OF 2026-08-24 IT COSTS NOTHING AT ALL. The remap in
 * `drawCommandSphere` starts the render range at the floor, so no fragment is
 * ever sized under it and none is ever hidden for being small. The density that
 * cull was silently providing came off `SPHERE_COUNT_COMPACT` instead (44 ->
 * 38), which is the lever this file documents; the numbers are there.
 *
 * ALPHA IS THE OTHER HALF, AND IT SUBSUMES THE FONT FLOOR ENTIRELY NOW. This
 * read "NEITHER FLOOR SUBSUMES THE OTHER... at the 11px compact base the font
 * floor cuts below t = 0.52 and is the stricter of the two. Both breakpoints
 * need both numbers." The first half was true of the retired linear ramp. As
 * shipped, `SPHERE_MIN_ALPHA` cuts at t = 0.382 at BOTH breakpoints and the
 * font floor cuts nothing — which is what `SPHERE_FONT_PX`'s own note always
 * said should happen ("What replaces the font floor's share of the cull is the
 * ALPHA floor"). THE 9px NUMBER IS STILL LOAD-BEARING: it is what the render
 * range is anchored to, so deleting it would not remove a cull, it would let
 * the type run to 6.86px.
 *
 * >> WRONG ON BOTH HALVES AS OF 2026-08-24, AND MISSED BY THE `9 -> 6` BLOCK
 * >> BELOW, WHICH NAMED ONLY THE SENTENCE FOUR LINES ABOVE IT. The number is
 * >> **6**, not 9. And 6.86px is `16 x 0.4286`, the floorless minimum at
 * >> `PERSPECTIVE` 2.5; at 2.0 it is `16/3` = **5.33px**. The load-bearing
 * >> CLAIM survives the corrections — the floor is still what the render range
 * >> is anchored to and deleting it still removes no cull — which is why this
 * >> is annotated rather than rewritten.
 *
 * THE ALPHA FLOOR IS A PARTIAL BACK-HEMISPHERE CULL, AND `projectCommandSphere`
 * WARNS AGAINST EXACTLY THAT. The warning is not wrong and has not been
 * deleted; it now carries this exception recorded against it. Read it there
 * before raising 0.25 any further. Its specific objection — that culling makes
 * fragments POP at the silhouette — is the thing the fade above answers, and
 * that half of the exception has been withdrawn there rather than left
 * standing.
 */
/**
 * A 0.057-DEGREE ROTATION APPLIED TO EVERY GLYPH, WHOSE ONLY PURPOSE IS TO
 * STOP THE RASTERISER FROM QUANTISING WHERE THE TEXT IS.
 *
 * THIS LOOKS LIKE A HACK AND IS ONE. It is here because the alternative was to
 * leave a measured, visible defect in the one thing on this page that is
 * supposed to move.
 *
 * THE DEFECT. Saad asked for "better smoothness in rotation of the commands".
 * The rotation is exactly smooth — MEASURED, the anchors the draw pass asks
 * for advance by 0.369 / 0.369 / 0.367 / 0.369 px per frame, dead constant.
 * What reaches the screen does not. Canvas2D caches rasterised glyphs by
 * subpixel phase, and for horizontally-aligned text it quantises the vertical
 * origin to a WHOLE PIXEL. Isolated from this site entirely — a bare canvas, a
 * bare `fillText`, no sphere — moving a string down by 0.1px ten times moves
 * the painted ink by:
 *
 *      0  0  0  0  0  0  1  0  0  0        (device px)
 *
 * Six frames frozen, then a full pixel. At `IDLE_RATE_Y` the sphere asks for
 * about 0.37px of travel per frame, so that is the granularity a viewer
 * actually sees: the labels do not glide, they sit still and jump. At dpr 2 it
 * halves to a 0.5 CSS px jump and is still the dominant artifact.
 *
 * WHY A ROTATION FIXES IT. The quantisation is an optimisation for
 * axis-aligned text, and a matrix that is not axis-aligned takes a different
 * path. Measured with the same isolated rig, asking for 0.05px per step, 20
 * steps, counting steps where NOTHING moved:
 *
 *                          dead frames    max single step    evenness (CoV)
 *   plain (axis-aligned)      19/20            1.000px            4.36
 *   anisotropic scale         19/20            1.000px            4.36
 *   rotate 5e-4                4/20            0.167px            0.94
 *   rotate 1e-3   SHIPPED      0/20            0.091px            0.44
 *   rotate 2e-3                0/20            0.073px            0.30
 *   rotate 5e-3                0/20            0.074px            0.24
 *
 * ANISOTROPIC SCALE IS IN THAT TABLE BECAUSE IT WAS THE FIRST IDEA AND IT DOES
 * NOTHING. `setTransform(k * 1.0002, 0, 0, k, ...)` still leaves rectangles as
 * rectangles, so the fast path is still taken. It has to be a rotation or a
 * shear.
 *
 * WHY 1e-3 AND NOT 5e-3, WHICH MEASURES BETTER. Because the rotation is real
 * and the text really is tilted. Across the longest fragment in the set —
 * `gcloud compute instances list`, 29 characters, 306px wide at the near face
 * — the total corner-to-corner displacement is `306 * tilt`:
 *
 *   1e-3  ->  0.31px      2e-3  ->  0.61px      5e-3  ->  1.53px
 *
 * SPLIT EVENLY EITHER SIDE OF THE ANCHOR, because `textAlign` is `center`: the
 * extremes are at +/-153px, so each end moves half of the figure above. And
 * canvas `y` grows DOWNWARD, so the right-hand end DESCENDS and the left-hand
 * end rises. (This paragraph said "the far end rises by `306 * tilt`" until
 * review — wrong sign, and 2x overstated per end. The total span, which is the
 * number the conclusion rests on, was right.)
 *
 * 1e-3 is the smallest value that takes dead frames to ZERO, and a third of a
 * pixel of rise across a 306px string is below the antialiasing. 5e-3 would be
 * a pixel and a half, which is a visible slant on a site with no other tilted
 * type anywhere. The residual unevenness at 1e-3 — steps varying around a
 * 0.05px mean — is sub-pixel jitter no eye resolves; the 1px freeze-and-jump
 * was the thing anyone could see, and it is gone.
 *
 * WHAT IT COSTS, AND IT IS THE MOST EXPENSIVE THING IN THIS CHANGE. Measured
 * as delivered frame rate at 1440x900 — see `SPHERE_SIZE_QUANTUM` for the full
 * table and for why milliseconds were the wrong instrument — the tilt takes
 * **32.2fps to 23.8 at 4x CPU throttle and 20.0 to 13.2 at 6x**, i.e. about
 * 30%. Unthrottled it is 60.1fps either way, and compact is 60.0fps at 6x
 * either way, so what pays is a wide viewport on a heavily throttled CPU.
 *
 * THAT TRADE IS SAAD'S TO REVERSE AND IT IS ONE LINE: `SPHERE_GLYPH_TILT = 0`
 * restores the frame rate and restores the 1px vertical snapping with it.
 * Everything else in the change — the continuous-feeling size ramp, the
 * quantum, the count — is independent of it.
 *
 * APPLYING IT ONLY TO THE FRONT THIRD WAS TRIED AND ABANDONED: gating on
 * `f.glow` recovered 22.5 -> 24.3fps of the 32.2 available, because the
 * glowing labels are also the ones carrying `shadowBlur`, so restricting the
 * tilt to them put it exactly where it is most expensive. Not worth the
 * discontinuity at the threshold.
 *
 * WHAT IT IS NOT: a fix for the underlying quantisation, which is Chrome's and
 * is not going anywhere. THE OBVIOUS-LOOKING FIX IS AN OFFSCREEN GLYPH ATLAS —
 * rasterise each label once and `drawImage` it at fractional coordinates, which
 * resamples to a fractional destination instead of snapping a glyph origin.
 *
 * >> IT WAS BUILT, SHIPPED, MEASURED PROPERLY, AND REVERTED — 2026-08-24,
 * >> commit reverted in the same session. DO NOT TRY IT AGAIN WITHOUT READING
 * >> THIS, because the bench that justified it was measured at the wrong speed
 * >> and gave the opposite answer to the truth.
 * >>
 * >> THE ERROR. The bench moved a label in 0.05px steps. The sphere moves its
 * >> labels ~0.37px per frame — eight times faster. `drawImage`'s resampling
 * >> error is PERIODIC IN THE DESTINATION OFFSET with a period of one pixel,
 * >> so at a step that is a clean fraction of a pixel consecutive frames land
 * >> on the same phase and the error is constant; at an incommensurate step it
 * >> walks, and the frame-to-frame centroid jitter is worst. Ink-centroid
 * >> jitter sd, drift removed, against travel per frame:
 * >>
 * >>      travel/frame     native fillText     bitmap blit
 * >>          0.05px            0.091             0.097     <- the bad bench
 * >>          0.20px            0.228             0.391
 * >>          0.37px            0.289             0.558     <- THE SPHERE
 * >>          0.50px            0.206             0.138
 * >>          1.00px            0.071             0.058
 * >>
 * >> At the speed this sphere actually turns the blit is **1.9x worse than
 * >> native text**. It only wins where the travel divides evenly into a pixel,
 * >> and no single rotation rate can arrange that for every label, because
 * >> travel varies from zero at the disc centre to maximum at the rim.
 * >>
 * >> CONFIRMED ON THE PAGE, not just on the bench: same label, mesh and every
 * >> other label suppressed, geometric drift high-passed out — the atlas
 * >> measured 0.635px of x jitter against this renderer's 0.515px, repeatable
 * >> to +/-0.008 over three runs.
 * >>
 * >> WHAT WAS RIGHT ABOUT IT, so the record is fair: the sharpness objection
 * >> that had kept it out was WRONG — a supersampled sheet blitted down is
 * >> indistinguishable from native text at 4x zoom and measures 111-118% of
 * >> native edge energy. The atlas also gave a genuinely continuous size ramp
 * >> and a better 6x-throttle frame rate. None of that was the thing being
 * >> asked for, and none of it was worth the axis it made worse.
 *
 * IT IS A ROTATION, SO IT SCALES THE GLYPH TOO, AND THE AMOUNT IS NOTHING.
 * The matrix is `(gk, gs, -gs, gk)` with `gs = gk * TILT`, whose determinant
 * gives an effective scale of `gk * sqrt(1 + TILT^2)` rather than `gk`. That is
 * an inflation of **5e-7**, i.e. 8e-6 px on a 16px glyph — five orders of
 * magnitude under a device pixel. It is not compensated for, deliberately:
 * dividing it out would put a `sqrt` in the per-fragment path to correct
 * something no display can express. (The determinant is `gk^2 (1 + TILT^2)`;
 * the SCALE is its square root. Both the wording and "twelve orders of
 * magnitude" were wrong in the first draft.)
 *
 * MEASURED END TO END on the real page, per real frame, comparing the anchors
 * asked for against the ink painted in the same frame: the painted step's
 * coefficient of variation went **1.132 -> 0.635**, and the worst single step
 * went 3.82px -> 1.34px. Zero dead frames either way at the page level, which
 * is why the isolated rig above is the one that shows the defect: on the real
 * sphere ~40 labels at independent subpixel phases mean SOMETHING moves every
 * frame even when most things are frozen.
 */
/**
 * THE SIZE GRID, IN CSS PIXELS. Every glyph is drawn at a multiple of this.
 *
 * 0.25px IS FORTY LEVELS ACROSS THE DESKTOP RANGE (6..16px) AND TWENTY ACROSS
 * COMPACT (6..11px), against the twelve the retired `SPHERE_SCALE_BUCKETS`
 * gave. One step is **1.6% of the type size at the near face and 3.2% at the
 * smallest painted size** — against the ~10% this file records as the point a
 * size change is noticeable at a glance, and against the 5.7%/17.2% the
 * twelve-bucket grid was delivering. Saad's complaint was that the size change
 * read as "sudden ... not smooth"; this is the number that answers it.
 *
 * IT EXISTS BECAUSE FULLY CONTINUOUS WAS BUILT FIRST AND MEASURED TOO SLOW.
 * The first version of this change quantised nothing: `drawK` went straight
 * into `setTransform`, so every drawn label had its own scale — 49 distinct
 * scales a frame at 1440, every one a separate entry in Chrome's glyph cache
 * and therefore a miss. DELIVERED FRAME RATE at 1440x900, counted from
 * distinct rAF timestamps over 15s:
 *
 *                                          1x      4x CPU    6x CPU
 *   HEAD (65 fragments, 12 buckets)      60.1      35.4      21.7
 *   80, continuous, no tilt              60.1      22.9      13.5
 *   80, continuous + tilt                60.1      18.6      11.2
 *   80, 0.25px grid, no tilt             60.1      32.2      20.0
 *   80, 0.25px grid + tilt   SHIPPED     60.1      23.8      13.2
 *
 * READ THAT TABLE TWICE, BECAUSE IT SAYS TWO DIFFERENT THINGS. The grid is
 * nearly free — 32.2 against HEAD's 35.4 while carrying 23% MORE fragments and
 * 27 painted sizes instead of 10. `SPHERE_GLYPH_TILT` is what costs, and its
 * own block owns that trade.
 *
 * THE COST WAS INVISIBLE TO THE OBVIOUS MEASUREMENT, which is why the table is
 * frame rate and not milliseconds. Timing the rAF callback showed the
 * continuous build at 0.642ms mean against HEAD's 0.686 — i.e. FASTER — while
 * delivering 18.6fps against 35.4. Canvas2D glyph rasterisation does not happen
 * inside the `fillText` call; it happens on the raster thread afterwards. Any
 * future performance claim about this draw pass has to be a frame-rate
 * measurement.
 *
 * COMPACT IS UNAFFECTED AT EVERY VARIANT — 60.0fps at 375x667 under 6x
 * throttling, because the compact sphere is 40 fragments with no glow. The
 * regression is confined to a WIDE viewport on a heavily throttled CPU.
 *
 * IF THIS EVER NEEDS TO GET CHEAPER, raise it before touching anything else:
 * 0.5px would halve the cache entries and still be 3.1%/6.3% per step, under
 * the 10% threshold. Lowering it below 0.25 buys nothing a viewer can see and
 * walks back toward the continuous build's frame rate.
 */
const SPHERE_SIZE_QUANTUM = 0.25;

/**
 * Hysteresis on the size grid, as a fraction of one level.
 *
 * DIRECT DESCENDANT OF `SPHERE_BUCKET_HYSTERESIS` (0.18), renamed and retuned
 * when the grid got 3.6x finer. The full derivation, the reason an idle capture
 * cannot see the flicker this suppresses, and the measured retune table are in
 * that constant's block above — which is kept in place rather than moved,
 * because its method is the part worth reading.
 *
 * 0.45: measured 12.75 reversals per 5s under the rig's cursor sweep against
 * 31.25 at 0.18 and 60.00 with no hysteresis at all, for a delay to honest
 * size changes of at most `(0.5 + 0.45) * 0.25` = 0.24px and no measurable
 * frame-rate cost. Idle is 0.5 per 5s at every viewport.
 */
const SPHERE_SIZE_HYSTERESIS = 0.45;

const SPHERE_GLYPH_TILT = 1e-3;

const SPHERE_MIN_FONT_PX = 6;
const SPHERE_MIN_ALPHA = 0.25;

/*
 * THIS BLOCK SITS BELOW THE DECLARATIONS RATHER THAN ABOVE THEM, and that is
 * not a style choice — a second block comment between the JSDoc and the
 * `const` would detach the tooltip from both constants.
 * `SPHERE_SCALE_BUCKETS` already carries its history the same way, for the
 * same reason.
 *
 * 9 -> 6 ON 2026-08-24, ON SAAD'S INSTRUCTION, AND IT REVERSES THE SENTENCE
 * DIRECTLY ABOVE IT. That sentence — "9px is a claim about what a human can
 * read, and a phone is not the place that gets to be laxer about it" — is left
 * standing rather than deleted, because the reversal is not a discovery that it
 * was wrong. It is a decision that this number had stopped being the claim it
 * says it is.
 *
 * THE ASK. "increase the depth that the commands go like behind and then
 * appearance from a tiny level so it gives a proper depth sphere vibe".
 *
 * WHY THE FLOOR WAS THE THING IN THE WAY, MEASURED BEFORE IT WAS TOUCHED. The
 * remap in `drawCommandSphere` anchors the rendered range AT this value, so on
 * desktop the whole nine-bucket ramp was being compressed into 9.00..16.00px —
 * and what a viewer actually saw, after the alpha cull removed the bottom of
 * it, was **10.75..16.00px, a 1.49x span**. Lowering `PERSPECTIVE` alone could
 * not fix that: it widens the GEOMETRIC range and the floor then squeezes the
 * result straight back down. The two had to move together, and of the two this
 * is the one that was doing the flattening.
 *
 * WHAT 6 IS, AND WHY NOT 7 OR 5 — AND THE FIRST VERSION OF THIS PARAGRAPH WAS
 * FALSE, WHICH IS WORTH THE SPACE BECAUSE IT WAS FALSE IN THE FLATTERING
 * DIRECTION. It claimed 6 "is the largest whole pixel at which the remap
 * becomes a NO-OP on desktop", on the grounds that `6/16 = 0.375` is "at or
 * below `SPHERE_SCALE_MIN` = 0.3333". 0.375 is ABOVE 0.3333. The inequality was
 * backwards, the remap is NOT a no-op at 6, and the claim that "below 6 nothing
 * further is gained" was wrong too.
 *
 * THE ACTUAL ARITHMETIC, evaluated across the candidates:
 *
 *              lowScale   bucket 0   smallest PAINTED   painted range
 *   floor 7     0.4375      7.00px        8.64px            1.85x
 *   floor 6     0.3750      6.00px        7.82px            2.05x   SHIPPED
 *   floor 5     0.3333      5.33px        7.27px            2.20x   true no-op
 *
 * SO 5 IS THE NO-OP POINT, NOT 6, AND IT IS WORTH 0.55px OF DESKTOP RANGE AND
 * 0.8px OF COMPACT RANGE (6.91 -> 6.09px). It is not taken, and the reason is
 * the honest one rather than the arithmetic one that was invented for it: the
 * smallest label a viewer ever sees is set by the ALPHA cull, which lands on
 * bucket 2 either way, so the whole difference between 5 and 6 is that one
 * bucket lower — under a pixel, on labels already at 0.29 alpha — bought by
 * pushing the sub-9px share further up. 6 is one whole step down from 9, it
 * delivers 2.05x against the 1.49x that prompted the ticket, and 5 remains
 * available and now documented if Saad wants the last half-pixel.
 *
 * SO THE FLOOR NO LONGER CULLS ANYTHING AND STILL IS NOT DEAD CODE. It is what
 * the rendered range is anchored to, exactly as before, and it is what a
 * fragment mid-fade is pinned to if a future base size ever breaks the property
 * above. `floorStep` is 0 at both breakpoints and is kept as the assertion of
 * that — including the float check the block in `drawCommandSphere` demands of
 * any new base: `11 * (6/11)` is exactly 6.0, verified, not assumed.
 *
 * WHAT IT COSTS, STATED PLAINLY BECAUSE IT IS THE HALF THAT IS EASY TO HIDE.
 * A THIRD OF THE DESKTOP SPHERE IS NOW UNDER 9px — 31.8% of drawn labels at
 * 1440 idle, 67.9% at 375 — against a measured 0% the day before, and the old
 * comment called that share one of "the two numbers this whole change is judged
 * on". It is no longer a defect metric, and it should not be quietly kept as
 * one: the number it was standing in for was ILLEGIBLE MUSH, which meant text
 * too small to read while still bright enough to demand reading. That
 * combination cannot occur here. Size and alpha are both monotone in `z`, so a
 * 7.82px label is a 0.29-alpha label, by construction, and the ones under 9px
 * are the ones a viewer is being told to read as DISTANCE.
 *
 * THE METRIC THAT REPLACES IT IS `SPHERE_MIN_ALPHA`'s, WHICH DID NOT MOVE AND
 * WAS NOT ALLOWED TO. Both alpha constants are untouched by this change —
 * neither the cull at 0.25 nor `ALPHA_EXPONENT` — so the standing-haze
 * tripwire is measured against exactly the boundary it was defined at, and it
 * still reads **0.6% at 1440 idle, 2.3% under the cursor, 0.6% at 375 and
 * 320**: transit only, nothing parked. Lowering the alpha cull WAS modelled as
 * a way to reach smaller labels still and was refused for precisely this
 * reason — it buys one more bucket and puts 13.5% of the sphere permanently
 * under 0.25 alpha, which is the haze coming back wearing the depth ticket as
 * cover.
 *
 * IF THIS EVER NEEDS RAISING AGAIN, the honest test is not the sub-9px share.
 * It is whether any label is small AND bright at the same time — i.e. whether
 * size and alpha have been decoupled — and the frame capture in `SCALE_NORM`
 * (`lib/hero/commandSphere.ts`) is the shape of the check.
 */

/*
 * ══ RETIRED 2026-08-24, AND REPLACED BY A 0.25px GRID. ═════════════════════
 *
 * `SPHERE_SCALE_BUCKETS` was 6, then 9, then 12, and is GONE. Size is set by a
 * `setTransform` off the fragment's depth now, not by a font string, and the
 * granularity is `SPHERE_SIZE_QUANTUM` — 0.25px, which is **forty levels
 * across the desktop range where this constant's last value gave twelve**.
 *
 * SO QUANTISATION SURVIVES AND ONLY THE MECHANISM DIED, and the first draft of
 * this banner said "there is nothing left to quantise", which was true of the
 * code for about an hour and is a good example of why a triumphant retirement
 * note is a bad idea. What killed the fully-continuous version was frame rate,
 * not taste: measured, it cost 30% of the throttled desktop frame rate against
 * this 0.25px grid, because every distinct glyph scale is a separate entry in
 * Chrome's glyph cache and 49 unique scales a frame is 49 misses.
 * `SPHERE_SIZE_QUANTUM` carries that table.
 *
 * WHY, IN ONE SENTENCE FROM SAAD: "the commands increase and decrease in size
 * is not smooth its just like sudden it should give off a sense that its
 * moving back not decreasing in size". THAT IS A DESCRIPTION OF QUANTISATION,
 * and the whole apparatus below is the quantiser — twelve buckets over
 * 6..16px is a 0.909px step, which on a 24-character label is a ~7.2px jump in
 * width, in one frame, for a depth change of nothing in particular. Three
 * rounds of this file made those steps SMALLER (six -> nine -> twelve) while
 * treating the step count as the thing to tune. The step count was never the
 * thing. The steps were.
 *
 * WHAT THE TRADE ACTUALLY WAS, now that it can be stated from the other side:
 * a font-shorthand parse per distinct size per frame, bought with a visible
 * artifact. The replacement pays neither — a transform is one matrix write,
 * no parse and no allocation, so the parse count went from 12.85 a frame to
 * exactly ONE and the artifact went to zero at the same time. The block below
 * is kept in full because its measurements are the reason the constant kept
 * growing and the reason growing it was never going to be enough.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *
 * How many discrete type sizes the depth ramp was quantised to.
 *
 * `ctx.font` assignment is a font-shorthand PARSE, not a field write, and it is
 * the most expensive thing in the draw loop after the glow. The trade is a
 * sub-perceptual difference between neighbouring buckets in exchange for a
 * handful of parses a frame instead of one per fragment. AS SHIPPED that is
 * twelve BUCKETS — eleven steps, which is what the local named `steps` in
 * `drawCommandSphere` holds — across `SPHERE_SCALE_MIN`..1, 0.909px between
 * neighbours at
 * base 16, measured at 12.85 parses against 39.7 drawn — the last measurement
 * this constant ever produced. (It read "nine steps...
 * 0.875px... 11.68 parses against 37.7 drawn" for one day, and before that "Six
 * steps across a 0.62–1.00 range is a <=1px difference at 13px" when the base
 * was 13 and the ramp was linear. Base, ramp, range and count have all moved;
 * the trade this paragraph describes has not.)
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
 * THOSE FOUR PAIRS ARE THE SIX-BUCKET, LINEAR-RAMP ERA AND ARE HISTORICAL, not
 * a second present-tense reading of the same thing the paragraph above just
 * measured at 12.85. They are kept because the RATIO is what the paragraph is
 * about — hysteresis roughly doubles the parse count — and that ratio is the
 * part which has held across all three generations. Nobody has re-run the
 * hysteresis-off arm since; if the doubling is ever the thing in question, it
 * has to be re-measured rather than read off here.
 *
 * IT IS STILL WELL INSIDE THE BUDGET THIS CONSTANT EXISTS TO DEFEND, which is
 * what makes doubling acceptable rather than alarming. The number that matters
 * is the ceiling: one parse per DRAWN fragment, which is 40 at 1440 and 25 at
 * 375 as shipped (36 and 22 when this was written). 8.35 against 36 is the
 * same order of saving the original "six against
 * ninety" bought. If a future change pushes this past roughly half the drawn
 * count, the trade has stopped being worth it — measure it, do not assume it.
 */

/*
 * ══ HISTORY OF A CONSTANT THAT NO LONGER EXISTS. ═══════════════════════════
 * This is the continuation of `SPHERE_SCALE_BUCKETS`'s docblock and it attaches
 * to no declaration. Read every present-tense sentence below as past tense —
 * including its closing instruction to "re-measure before anyone adds a
 * thirteenth bucket", which cannot be acted on. The live constant is
 * `SPHERE_SIZE_QUANTUM`.
 *
 * SIX UNTIL 2026-08-24. It went to NINE in the same change that replaced the
 * linear depth ramp with the projection's own perspective divide
 * (`commandSphere.ts`, `SCALE_NORM`), and the two halves are one decision:
 * widening the size range without adding steps would have made the STEPS
 * visible, which is the "stepped, not continuous" reading Saad asked to remove.
 *
 * NINE IS DERIVED FROM THE STEP SIZE A VIEWER CAN SEE, not chosen for
 * roundness. After the remap the drawn sizes at base 16 are
 * 10.75 / 11.63 / 12.50 / 13.38 / 14.25 / 15.13 / 16.00 px steady-state, with
 * 9.875 and 9.00 reached only by fragments already fading out — SEVEN painted
 * sizes where FOUR were painted before, and MEASURED as exactly that set in a
 * single captured frame. One step is 0.875px, i.e. **5.5% of the type size at
 * the near face and never more than 8.1% anywhere in the painted range**, which
 * is under the ~10% at which a size change is noticeable at a glance on moving
 * text.
 *
 * (The pre-remap arithmetic put the step at 1.14px on a 9.14px base — 12.5%,
 * ABOVE that threshold. The remap made this argument true as well as making
 * the phone work; it was not quite true when it was first written.)
 *
 * THE PARSE BUDGET IS THE THING THIS TRADES AGAINST AND IT WAS MEASURED, NOT
 * ASSUMED, exactly as the block above requires. `ctx.font` assignments per
 * frame on a production build, six buckets -> nine, against the tripwire of
 * roughly half the drawn count:
 *
 *     1440x900 idle      7.57 -> 11.68     tripwire ~18.9  (37.7 drawn)
 *     1440x900 cursor    6.83 -> 10.41     tripwire ~18.9
 *     375x667            5.19 ->  8.61     tripwire ~11.6  (23.2 drawn)
 *     320x568            5.40 ->  8.48     tripwire ~11.2  (22.3 drawn)
 *
 * COMPACT IS THE TIGHT ONE AND IT WAS WORTH CHECKING RATHER THAN ASSUMING: the
 * review of this change predicted ~12.3 at 375 against a ~11.7 tripwire, i.e. a
 * fail, by scaling the recorded hysteresis multiplier off the bucket count. It
 * measured 8.61. The estimate was high because distinct buckets among DRAWN
 * fragments is not the bucket count — the alpha cull removes the bottom two
 * everywhere, so seven are painted, not nine.
 *
 * THE RENDER FLOOR NOW FIRES NOWHERE, WHICH IS A SHARPER VERSION OF THE CLAIM
 * AT `SPHERE_FONT_PX` RATHER THAN A REVERSAL OF IT. That block reads "ONE
 * RENDER FLOOR STOPS FIRING ON DESKTOP AND THAT IS ARITHMETIC, NOT A BUG"; as
 * shipped it stops firing on BOTH breakpoints, because `drawCommandSphere`
 * remaps the buckets onto the size range each breakpoint can legibly draw
 * instead of letting the geometric range reach the renderer raw. `floorStep` is
 * 0 everywhere and nothing is pinned. NOTHING ABOUT THE 9px FLOOR MOVED — it is
 * still the same claim about what a human can read, and the sub-9px share is
 * still required to measure 0%, which it does BY REMAP now rather than by pin.
 *
 * >> THAT LAST SENTENCE IS FALSE AS OF LATER THE SAME DAY AND IS THE THIRD
 * >> PLACE IN THIS FILE THAT SAID IT. The floor is 6, moved by Saad; the
 * >> sub-9px share is 31.8% at 1440 and 67.9% at 375 BY DESIGN, and it is no
 * >> longer a defect metric at all. `SPHERE_MIN_FONT_PX`'s own block carries
 * >> what replaces it. Everything before that sentence — `floorStep` 0 at both
 * >> breakpoints, nothing pinned, nothing culled by size — is still exactly
 * >> true, which is why this is corrected in place.
 *
 * (An intermediate version of this change did put `floorStep` at 2 on desktop
 * and 6 on compact, and the second of those culled 72% of the labels at 375.
 * The `>>` block at `SPHERE_FONT_PX` carries that measurement. It is recorded
 * because "the floor pins" and "the floor culls" look identical in this file
 * until you read `legible` into `hidden`.)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NINE -> TWELVE ON 2026-08-24, AND IT IS THE SAME DECISION AS LAST TIME MADE
 * FOR THE SAME REASON: THE RANGE WIDENED AGAIN, SO THE STEPS HAD TO GET
 * SMALLER OR THEY WOULD BECOME VISIBLE.
 *
 * `PERSPECTIVE` 2.5 -> 2.0 and the font floor 9 -> 6 took the desktop render
 * range from 9.00..16.00px to 6.00..16.00px. At nine buckets that is a 1.25px
 * step: 7.8% of the type size at the near face, but **17.2% at the smallest
 * PAINTED size (7.25px)** — well past the ~10% this block records as the point
 * a size change is noticeable at a glance. Twelve buckets puts the step at
 * 0.909px, which is 5.7% near and 11.6% far.
 *
 * THE ~10% CRITERION IS NOT FULLY MET AT THE FAR END AND SAYING SO IS THE POINT
 * OF THIS PARAGRAPH. It holds from 9.1px up — the top ~two thirds of the
 * painted range — and the two smallest buckets exceed it. They are also the two
 * dimmest: measured in a captured frame, 7.82px sits at 0.291 alpha and 8.73px
 * at 0.348. A step is noticeable in proportion to the contrast it steps across,
 * and buying those two buckets down under 10% costs fifteen buckets and a parse
 * budget this file will not pay. Judged in a 1440x900 frame capture at review
 * time rather than argued: the recession reads as continuous, with no visible
 * banding at any depth. (No file is named here on purpose — the capture lives
 * in a session scratchpad, not in the repo, and a comment that cites an
 * artifact nobody else can open is worse than one that cites none.)
 *
 * WHAT IS ACTUALLY PAINTED — the number this block cares about, since parses
 * scale with DRAWN buckets and not with the constant. Measured in a single
 * captured frame at 1440x900: **ten distinct sizes**, 7.82 / 8.73 / 9.64 /
 * 10.55 / 11.45 / 12.36 / 13.27 / 14.18 / 15.09 / 16.00px. Compact paints ten
 * as well: 6.91 through 11.00 in 0.4545px steps. Seven and seven before.
 *
 * (Both figures are historical. With the buckets retired the same capture
 * shows FORTY-NINE distinct sizes at 1440 and twenty-four at 375 — one per
 * drawn label, which is what "continuous" means and what this constant spent
 * three generations approximating.)
 *
 * THE PARSE BUDGET, MEASURED, against a tripwire of roughly half the drawn
 * count as this block defines it:
 *
 *     1440x900 idle      11.68 -> 12.85     tripwire ~19.9  (39.7 drawn)
 *     1440x900 cursor    10.41 -> 12.74     tripwire ~20.2  (40.4 drawn)
 *     375x667             8.61 -> 10.28     tripwire ~12.4  (24.9 drawn)
 *     320x568             8.48 -> 10.28     tripwire ~12.4
 *
 * THREE BUCKETS COST ROUGHLY ONE PARSE A FRAME, not three, and the reason is
 * the one this file learned the hard way the previous day: distinct buckets
 * among DRAWN fragments is not the bucket count. Compact is still the tight
 * one — 10.28 against 12.4 is the least headroom on the sphere — and it is the
 * number to re-measure before anyone adds a thirteenth bucket.
 */

/*
 * ══ RENAMED AND RETUNED 2026-08-24, NOT RETIRED. ═══════════════════════════
 *
 * `SPHERE_BUCKET_HYSTERESIS` is now `SPHERE_SIZE_HYSTERESIS`, 0.18 -> 0.45,
 * and it damps boundaries on the 0.25px size grid instead of on a 12-step
 * bucket grid. `state.bucket` became `state.level`.
 *
 * THIS BLOCK WAS BRIEFLY HEADED "RETIRED, WITH THE BUCKETS IT EXISTED FOR" and
 * said "with a continuous scale there are no boundaries, so the dither it
 * damped cannot occur". THE PREMISE DIED WITHIN THE HOUR — a fully continuous
 * scale turned out to cost 30% of the throttled desktop frame rate, the fix
 * was a 0.25px grid, and a grid has boundaries. The last sentence of the
 * retirement note was the accurate one: "Anything that reintroduces discrete
 * sizes here has to reintroduce this as well", and something did, immediately.
 *
 * WHAT THE RETUNE COST AND BOUGHT, measured at 1440x900 under the rig's 0.5Hz
 * cursor sweep, which is the only condition that produces dither at all:
 *
 *                              switches/5s   reversals/5s   amplitude
 *   12 buckets, h 0.18            139.26          0.25        0.909px
 *   0.25px grid, no hysteresis    950.53         60.00        0.25px
 *   0.25px grid, h 0.18           861.28         31.25        0.25px
 *   0.25px grid, h 0.45  SHIPPED  723.28         12.75        0.25px
 *
 * 12.75 IS HIGHER THAN 0.25 AND THE COMPARISON THAT MATTERS IS THE PRODUCT.
 * A reversal is a size change that undoes itself, so what a viewer could see
 * is `reversals x amplitude`: **0.64px of size churn per second, against 2.15
 * for the 3.25-per-5s figure this file recorded as ACCEPTABLE** when the
 * constant was introduced, and against 0.23 for the 12-bucket state. It is
 * three times the immediately preceding state and three times better than the
 * documented acceptable bound. Idle is 0.5 per 5s, effectively zero.
 *
 * 0.45 RATHER THAN 0.18 BECAUSE THE DEADBAND IS NEARLY FREE AT THIS GRAIN. It
 * delays an honest size change by at most `(0.5 + h) * 0.25` = 0.24px, which
 * is under a fifth of what one 12-bucket step used to be. 0.18 measured 31.25
 * reversals; going to 0.45 more than halved that for no visible lag and no
 * measurable frame-rate cost (23.8 fps against 24.8 at 4x throttle, inside the
 * run-to-run spread).
 *
 * THE BLOCK BELOW IS THE ORIGINAL RECORD and is kept because its method is
 * what matters: how the flicker was found, why an idle capture cannot see it,
 * and why the cursor sweep is the condition to measure. Its figures are all
 * from the bucket era; read them as history, not as the current state.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Bucket hysteresis, as a fraction of one bucket's width.
 *
 * WITHOUT IT A LABEL SWITCHES THE INSTANT IT RECROSSES A BOUNDARY, and the
 * switch is not subtle: one bucket is 0.909px, so a 24-character label changes
 * width by ~7.2px at each end in a single frame. (It read "~8% of the type
 * size... ~3.3px" at six buckets on the retired ramp. The per-step SIZE change
 * got smaller with nine buckets; the per-step WIDTH change got bigger, because
 * the range it spans roughly doubled.) `Math.round` on
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
 * entirely.
 *
 * THE LAST SENTENCE USED TO READ "Raising it much further starts to visibly
 * delay honest depth changes AT THE FAR POLE, where the buckets are narrowest
 * in `t`." THAT IS NOW EXACTLY BACKWARDS AND ACTING ON IT WOULD MISLEAD. The
 * buckets were uniform in `t` under the retired linear ramp. Under the
 * perspective divide `dscale/dz = (f-1)/(f-z)^2`, so a bucket spans 0.545
 * z-units at the FAR pole and 0.061 at the NEAR pole — a **9.0x** spread,
 * narrowest at the front. The cost of raising this constant now lands on the
 * big, legible near-face labels, which is a worse place for it to land than
 * the back. (It was 0.583 / 0.107 and 5.4x at `PERSPECTIVE` 2.5; lowering `f`
 * to 2.0 for depth widened the spread, so the sentence is MORE true than when
 * it was written, not less.)
 *
 * THE CONSTANT DID NOT NEED TO SCALE WITH THE BUCKET COUNT — it is expressed as
 * a fraction of a bucket, so "18% of a bucket" means the same thing at twelve
 * as at nine as at six, and a bucket's width in SCALE units has barely moved
 * across all three (0.0760 -> 0.0714 -> 0.0606). What changed is that the
 * deadband it buys in DEPTH near the front face keeps shrinking.
 *
 * MEASURED AFTER EACH CHANGE rather than reasoned about, because that is what
 * this constant's own history demands. At 1440x900 under the rig's cursor
 * sweep, across the three generations:
 *
 *                        switches/5s   reversals/5s
 *   linear ramp, 6 buckets     33.24          0
 *   perspective, 9 buckets    103.05          0.83
 *   f 2.0, 12 buckets         139.26          0.25
 *
 * ALL THREE ROWS ARE HYSTERESIS-ON. The 65.5 switches / 3.25 reversals quoted
 * further up is the hysteresis-OFF baseline for the first of them, which is
 * what makes 33.24 / 0 in the same conditions the measure of what this constant
 * bought. Reading the two as one series is the obvious mistake and it was made
 * in review, so it is spelled out here.
 *
 * THE REVERSAL COLUMN IS AT THE NOISE FLOOR AND MUST NOT BE READ AS A TREND.
 * Over 20s, 0.83 and 0.25 per 5s are roughly THREE events and ONE. The
 * mechanism says the opposite should have happened — the deadband is 0.18 of a
 * bucket, so in `z` at the near pole it went from 0.0193 to 0.0109, a 43%
 * reduction, exactly where this block says the cost lands. The honest reading
 * is "no evidence of a regression at three events per twenty seconds", not
 * "reversals fell". NO CHANGE TO 0.18 IS WARRANTED ON THIS EVIDENCE, and if a
 * future change needs a real answer it needs a longer capture, not this one.
 * Idle is 0 reversals at every viewport in every generation, which is the one
 * unambiguous row. If it ever needs revisiting, the near face is where to look.
 */

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
 * from 320 to 2560: at 1440x900 the disc spans **x 720.0-1267.2** (centre
 * 993.6, R 273.6) against a worst-case label of ~144px half-width — a 29-char
 * string at the 15.09px size the twelve-bucket grid then produced — so the
 * guard CANNOT fire there, and
 * measurement agrees: 0 cuts in 20s. It fires on compact viewports only, and
 * rarely: 0.17 cuts per 5s at 320x568 before the render floor existed.
 *
 * (Those figures read "777.6-1209.6", "~103px half-width" and "a flat 90 labels
 * drawn every frame" until 2026-08-24. The span was the retired
 * `D_FRACTION` 0.30 geometry and 90 has not been the count since the 58 cut.
 * The CONCLUSION was re-derived from scratch at today's numbers and survives at
 * both 1440 and 1280 — it was right for the wrong reasons for three
 * generations, which is the failure mode this file exists to make visible.)
 *
 * >> "THE RENDER FLOOR MADE IT MATTER MORE, and that is the reason to fix it
 * >> now rather than to leave it. Dropping everything under 9px removed exactly
 * >> the small rim labels that used to fit, so what is left at the rim is
 * >> bigger: the same measurement at 375x812 went from 0 cuts per 5s to 1.17."
 * >> THAT IS NOW THE INVERSE OF THE TRUTH, twice over. The render floor drops
 * >> nothing — the remap starts the range AT it — and the depth change makes
 * >> every label behind the near face SMALLER, so the rim is smaller and the
 * >> guard fires LESS. Measured: 0 clip cuts per 5s at 1440, 375 and 320. The
 * >> fade this constant exists for is still correct and still earns its place;
 * >> the argument that it had become urgent has expired.
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
 * between frames, and the only two. (They were `bucket` and `fade`; they are
 * `level` and `fade` since 2026-08-24, when the font-string bucket grid became
 * a `setTransform` on a 0.25px size grid. Same two questions, finer grain.)
 *
 * IT LIVES HERE AND NOT ON `ProjectedFragment`, WHICH WOULD HAVE BEEN THE
 * SHORTER EDIT. `lib/hero/commandSphere.ts` is geometry only; the note on
 * `SPHERE_SCALE_MIN` there says exporting the scale endpoints was preferred
 * over exporting a bucketing function precisely so that a rendering concern
 * would not end up in a module whose whole point is not having any. Which
 * size level a fragment was last DRAWN at, and how far a fade toward the
 * viewport edge has got, are both rendering concerns of the most literal
 * kind.
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
 * than about a couple of rim labels. Verified rather than assumed, and
 * re-verified on 2026-08-24 rather than left at the counts the old geometry
 * produced — **50 / 24 / 24 labels at 1440 / 375 / 320** under reduced motion
 * (36 / 22 / 22 two changes ago, 40 / 24 / 24 one change ago), four of four
 * featured commands visible at each, and the frozen frame carries **24
 * distinct sizes at 1440 and 12 at compact** where it carried four. A
 * reduced-motion visitor sees one frame of this effect forever; that frame is
 * where a fine depth ramp pays off most, because it is the only cue of depth
 * they get.
 */
type SphereDrawState = {
  /** Visibility, 0..1, across all three gates. -1 = never evaluated. */
  fade: Float32Array;
  /** The quantised size LEVEL each fragment was last drawn at, in units of
   *  `SPHERE_SIZE_QUANTUM`. -1 = never assigned. Int16 because the level runs
   *  to `SPHERE_FONT_PX / SPHERE_SIZE_QUANTUM` = 64, past an Int8's range once
   *  a future base or quantum moves. */
  level: Int16Array;
};

/*
 * THIS NOTE SAID THE SECOND ARRAY WAS GONE. IT CAME BACK THE SAME DAY, AND THE
 * ROUND TRIP IS THE POINT.
 *
 * The array was `bucket: Int8Array` — "the GEOMETRIC bucket each fragment was
 * last assigned, for the hysteresis" — and it was deleted alongside
 * `SPHERE_BUCKET_HYSTERESIS` when the size ramp went fully continuous, on the
 * reasoning that "there are no boundaries any more... nothing to remember and
 * nothing to dither about. A whole class of flicker went from SUPPRESSED to
 * STRUCTURALLY IMPOSSIBLE."
 *
 * THAT WAS TRUE OF THE CODE AND WRONG ABOUT THE PROBLEM. A fully continuous
 * glyph scale means a distinct entry in Chrome's glyph cache per label per
 * frame; measured, it cost 30% of the throttled desktop frame rate. The fix is
 * `SPHERE_SIZE_QUANTUM`, a 0.25px grid — forty levels where the retired bucket
 * constant had twelve — and a grid has boundaries, so the hysteresis and its
 * array are both back. `Int16Array` rather than `Int8Array` because the level
 * index now runs to 64.
 *
 * WHAT ACTUALLY IMPROVED, stated without the triumph: the boundary a label can
 * dither across is 0.25px instead of 0.909px, so the same class of flicker is
 * 3.6x smaller in amplitude. It was never made impossible.
 */
function createSphereDrawState(count: number): SphereDrawState {
  const state = { fade: new Float32Array(count), level: new Int16Array(count) };
  state.fade.fill(-1);
  state.level.fill(-1);
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
 * it, so the colour stop and the glow flag each change at most a handful of
 * times across the whole set instead of once per fragment. That turns two of
 * the three expensive pieces of context state — the fill style and
 * `shadowBlur` — into a near-constant number of assignments.
 *
 * THE THIRD USED TO BE THE FONT PARSE AND IS NOT ANY MORE. `ctx.font` is
 * assigned exactly ONCE per frame now, before the loop, and size comes from a
 * per-fragment `setTransform`. Monotonicity no longer buys anything there —
 * but it still buys the other two, and the painter's order needs it regardless.
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
  /**
   * The canvas's device-pixel-ratio scale, i.e. the transform `build()` leaves
   * on the context. PASSED IN RATHER THAN READ BACK OFF `ctx.getTransform()`,
   * which would allocate a `DOMMatrix` every frame in a function whose module
   * header promises zero per-frame allocation. It is needed because the glyph
   * scale below REPLACES the context transform rather than composing onto it.
   */
  dpr: number,
): void {
  const basePx = compact ? SPHERE_FONT_PX_COMPACT : SPHERE_FONT_PX;
  const span = SPHERE_SCALE_MAX - SPHERE_SCALE_MIN;

  /*
   * THE GEOMETRIC RANGE AND THE RENDERED RANGE ARE NOT THE SAME RANGE, AND
   * CONFLATING THEM COST 72% OF THE LABELS ON A PHONE. Added 2026-08-24, with
   * the measurement that forced it.
   *
   * `span` above is GEOMETRY: `SPHERE_SCALE_MIN..1`, which since the ramp
   * became the perspective divide is 0.3333..1 at `PERSPECTIVE` 2.0, a 3.00x
   * range. That is the right range to MAP depth from — it is what the sphere
   * actually does. (It said "QUANTISE" until the buckets were retired on
   * 2026-08-24; the mapping is continuous now, and the rest of this block is
   * written in terms of buckets because that is what it was diagnosing. The
   * hazard it records survives the rewrite exactly: `legible` still feeds
   * `hidden`, so a floor that fails to clear still CULLS rather than pins.) Whether it is also the right range to RENDER into
   * depends entirely on the floor, and as of 2026-08-24 it very nearly is:
   * `basePx * 0.3333` is 5.33px at base 16 and 3.67px at base 11, against a
   * `SPHERE_MIN_FONT_PX` of 6.
   *
   * WHAT HAPPENED WHEN THEY WERE THE SAME RANGE. `floorStep` below marks every
   * bucket whose rendered size is under the floor as NOT LEGIBLE, and
   * `legible` feeds `hidden`, so those fragments do not merely pin — THEY FADE
   * OUT. At base 11 with nine buckets `floorStep` came out at 6 of 8, which
   * culls everything with `z < 0.75`: the front cap of the sphere and nothing
   * else. MEASURED at 375x667 before this remap: **6.29 drawn per frame
   * against 22.35 before the ramp change.** Desktop was untouched (37.67) only
   * because the alpha floor already cut above where the font floor landed.
   *
   * THE FIX IS TO REMAP, NOT TO CULL. The nine buckets still span the full
   * geometric depth — `q` below is unchanged and still uses `span` — but they
   * are DRAWN across `lowScale..1`, the range this breakpoint can actually put
   * on screen. Nothing is hidden for being small any more; the ALPHA floor
   * does the culling, which is what `SPHERE_FONT_PX`'s own note always said
   * should happen ("What replaces the font floor's share of the cull is the
   * ALPHA floor, which is unchanged and does the majority of it either way").
   *
   * `floorStep` THEREFORE EVALUATES TO 0 AT BOTH BREAKPOINTS NOW, BY
   * CONSTRUCTION, and the loop below is kept rather than deleted for exactly
   * that reason: it is the assertion that this is true. If a future `basePx`
   * or floor makes it non-zero again, the pin-and-fade behaviour it documents
   * is still correct and still there.
   *
   * WHAT IT COSTS AT EACH BREAKPOINT, and the honest half is the second one:
   *
   *   base 16 (desktop)  lowScale 0.3750  ->  6.00 .. 16.00px, 2.67x
   *   base 11 (compact)  lowScale 0.5455  ->  6.00 .. 11.00px, 1.83x
   *
   * >> THOSE TWO LINES READ `0.5625 -> 9.00..16.00, 1.78x` AND
   * >> `0.8182 -> 9.00..11.00, 1.22x` UNTIL 2026-08-24, and the paragraph under
   * >> them said: "1.22x IS ALL A PHONE CAN HAVE AND IT IS ARITHMETIC, NOT A
   * >> COMPROMISE ANYONE CHOSE. An 11px base against a 9px floor cannot express
   * >> more range than 11/9... The two ways to buy more are both refused
   * >> elsewhere in this file: raising `SPHERE_FONT_PX_COMPACT` re-admits
   * >> collisions on the one breakpoint with no room for them, and lowering the
   * >> 9px floor is 'a claim about what a human can read', not a tuning knob."
   * >>
   * >> THE ARITHMETIC WAS RIGHT AND THE SECOND REFUSAL WAS NOT MINE TO MAKE.
   * >> Saad lowered the floor to 6 the next day, which is the one door that was
   * >> being held shut, and the compact range went 1.22x -> 1.83x on that
   * >> change alone. `SPHERE_FONT_PX_COMPACT` is still 11 and that refusal
   * >> stands unchanged. The lesson is narrow and worth keeping: "X is all a
   * >> phone can have" was true GIVEN a constant that was itself a decision,
   * >> and stating the constraint without naming the decision inside it made
   * >> the constraint look like a law.
   *
   * ON DESKTOP THE REMAP IS NOW VERY NEARLY A NO-OP, which is the point.
   * `SPHERE_MIN_FONT_PX / SPHERE_FONT_PX` is 0.375 against a
   * `SPHERE_SCALE_MIN` of 0.3333, so what is rendered is within a whisker of
   * the geometry's own range instead of a compressed copy of it. Compact still
   * compresses, and still must: 6/11 is 0.5455 and there is no floor low
   * enough to change that without going under 6px.
   */
  const lowScale = Math.max(SPHERE_SCALE_MIN, SPHERE_MIN_FONT_PX / basePx);
  const renderSpan = SPHERE_SCALE_MAX - lowScale;

  // ══ THE BLOCK BELOW DESCRIBES A LOOP THAT NO LONGER EXISTS ══════════════
  //
  // `floorStep` walked the bucket grid to find the first step clearing the
  // font floor. There is no bucket grid; the floor is one comparison against
  // `floorPx`, twenty lines down. EVERYTHING FROM HERE TO THAT COMPARISON IS
  // HISTORY, kept for two things that are still live: the IEEE754 note, which
  // is why the epsilon exists, and the pin-versus-cull distinction, which is
  // still the difference between a fragment fading at a readable size and 72%
  // of the labels vanishing on a phone.
  //
  // THE SMALLEST BUCKET THAT STILL CLEARS THE FONT FLOOR. At most `steps`
  // iterations (8), once per frame, never per fragment.
  //
  // IT EVALUATES TO 0 AT BOTH SHIPPED BREAKPOINTS AND IS KEPT AS AN ASSERTION.
  // The remap above starts the render range AT the floor, so bucket 0 is
  // exactly `SPHERE_MIN_FONT_PX` — 6.00px since 2026-08-24 — and the loop
  // cannot advance. Everything below is therefore
  // describing a path that is currently unreachable — deliberately, because it
  // is the path that runs if a future `basePx` or floor breaks that property,
  // and because `legible` feeding `hidden` means the difference between "pins"
  // and "culls" here is 72% of the labels on a phone.
  //
  // "BY CONSTRUCTION" IS TOO STRONG AND THE REVIEW WAS RIGHT TO SAY SO.
  // `basePx * (SPHERE_MIN_FONT_PX / basePx) >= SPHERE_MIN_FONT_PX` is not an
  // IEEE754 theorem. It holds for both shipped bases and it was RE-CHECKED
  // when the floor moved 9 -> 6 on 2026-08-24, which is what that block asked
  // for: `16 * fl(6/16)` is 6 exactly (6/16 is a dyadic rational) and
  // `11 * fl(6/11)` also evaluates to exactly 6.0, run rather than argued. The
  // measurement agrees — the drawn count at 375 is 24.9, which it could not be
  // if this had come out 1.
  //
  // BUT THE COMPACT CASE HOLDS BY A TIE-BREAK, NOT BY A MARGIN, and that is
  // why the comparison below now carries an epsilon instead of an instruction
  // to future readers to remember one. 6/11 is binary `0.(1000101110)`
  // repeating with period 10; rounding to 53 bits discards a tail worth exactly
  // 4/11 of the last place, so `11 * fl(6/11)` is exactly `6 - 2^-51` before
  // rounding — and `2^-51` is PRECISELY half an ulp at 6. It comes out 6.0 only
  // because round-half-to-even prefers 6.0's even mantissa. Zero margin. The
  // previous version of this note said "by half-ulp luck" and then told the
  // next person to "re-check it or take an epsilon"; taking the epsilon is
  // strictly better than asking, so it is taken.
  //
  // IT EXISTS SO THAT A FADING FRAGMENT FADES AT A LEGIBLE SIZE. The font floor
  // is a claim about what a human can read; a fragment left to keep shrinking
  // while it faded would spend its whole 175ms exit being exactly the illegible
  // mush the floor was added to delete, and it would put the sub-9px share —
  // one of the two numbers this whole change is judged on — back above zero.
  //
  // PINNED TO THE LOWEST LEGAL BUCKET, NOT TO `SPHERE_MIN_FONT_PX` ITSELF —
  // and after the remap those are the same thing, which is why this no longer
  // fires. The reasoning is kept for the unreachable path: pinning to a raw 9px
  // would introduce a font size that exists only during fades and would step
  // the glyph at the moment the fade starts, where pinning to a BUCKET adds no
  // new `ctx.font` value at all. (The figures this paragraph used to quote —
  // "the buckets near it are 8.492 and 9.328 at the compact base" — were the
  // retired linear ramp's. Compact buckets are 6.00 / 6.45 / 6.91 ... now, none
  // below the floor.)
  //
  // The `< steps` guard bounds the loop if a future `basePx` were ever smaller
  // than the floor — in which case nothing is legible and everything fades out.
  // Degenerate, but bounded, and visibly wrong rather than silently wrong.
  // THE FLOOR, AS A SIZE RATHER THAN AS A BUCKET INDEX. It used to be a loop
  // walking up the bucket grid to find the first step that cleared
  // `SPHERE_MIN_FONT_PX`; with a continuous scale there is no grid to walk and
  // the question collapses to a single comparison per fragment.
  //
  // THE EPSILON SURVIVES THE REWRITE AND SO DOES ITS REASON. `basePx *
  // lowScale` is meant to be EXACTLY the floor, and whether the arithmetic
  // lands there is a float question rather than an algebraic one — the compact
  // base reaches it on a round-half-to-even tie with zero margin, worked
  // through in the note above. A hair under would make every label at the back
  // of the sphere test as illegible, and `legible` feeds `hidden`, so they
  // would FADE OUT rather than pin. Half a thousandth of a pixel is far below
  // anything the renderer can express and far above any rounding error a
  // base/floor pair can produce.
  const floorPx = SPHERE_MIN_FONT_PX - 5e-4;

  const prevAlpha = ctx.globalAlpha;
  ctx.textAlign = "center";
  // `middle`, so a fragment's anchor is the optical centre of its line rather
  // than its baseline. The navbar clearance in `placeCommandSphere` is computed
  // against the sphere's disc; a baseline anchor would push the topmost
  // fragment's cap height above that disc and eat the clearance the cap exists
  // to guarantee.
  ctx.textBaseline = "middle";
  ctx.letterSpacing = SPHERE_LETTER_SPACING;

  // ONE FONT ASSIGNMENT FOR THE WHOLE PASS, at the base size. Every fragment's
  // size comes from the transform below instead, so the string is parsed once
  // per frame rather than once per distinct size — see the block at
  // `SPHERE_FONT_PX` for what that replaced.
  ctx.font = `${basePx}px ${fontStack}`;

  let tinted = false;
  let glowing = false;
  ctx.fillStyle = `rgb(${accent})`;

  for (let i = 0; i < order.length; i++) {
    const index = order[i];
    const f = sphere.projected[index];

    // THE SCALE, CONTINUOUS. `f.scale` is the perspective divide normalised to
    // the near pole; this remaps it off the geometric range onto the range this
    // breakpoint can legibly draw, and that is the whole calculation. No
    // quantisation, no hysteresis, no remembered state.
    const k = lowScale + ((f.scale - SPHERE_SCALE_MIN) / span) * renderSpan;
    const px = basePx * k;

    // PINNED UP TO THE LEGIBILITY FLOOR WHILE IT FADES. `lowScale` starts the
    // range AT the floor, so this cannot fire at either shipped breakpoint and
    // is the assertion of that; if a future base broke it, a fragment on its
    // way out would fade at a readable size instead of shrinking into mush.
    const legible = px >= floorPx;
    const rawPx = legible ? px : SPHERE_MIN_FONT_PX;

    // THE SIZE LEVEL, WITH HYSTERESIS. `q` is the unrounded level; a fragment
    // keeps the level it was last drawn at until `q` leaves it by more than
    // half a level plus `SPHERE_SIZE_HYSTERESIS`, so a label whose depth
    // wobbles across a boundary does not switch back and forth.
    const q = rawPx / SPHERE_SIZE_QUANTUM;
    const held = state.level[index];
    const level =
      held < 0 || Math.abs(q - held) > 0.5 + SPHERE_SIZE_HYSTERESIS
        ? Math.round(q)
        : held;
    state.level[index] = level;
    const drawK = (level * SPHERE_SIZE_QUANTUM) / basePx;

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
    // OFF `drawK`, NOT OFF `px`. `px` is the fragment's unpinned, unquantised
    // size; the glyph is drawn at `basePx * drawK`. They differ whenever the
    // floor pins or the grid rounds, and on the pinned path they differ in the
    // direction this guard's own docblock forbids — the drawn label would be
    // WIDER than the estimate, so the guard would UNDER-estimate and clip
    // rather than drop. Caught in review; unreachable at the shipped values,
    // which is exactly why it would have survived.
    const halfWidth =
      f.text.length * basePx * drawK * SPHERE_ADVANCE_ESTIMATE * 0.5;
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
    // only cost an extra assignment, never desync. THAT IS THE WHOLE
    // GUARANTEE, and it does not depend on anything about which fragments the
    // gates hide.
    //
    // IT USED TO SAY MORE THAN THAT AND THE MORE WAS FALSE: "there is no extra
    // cost to pay: every fragment any gate can hide sits below `GLOW_T` 0.6 and
    // `NEAR_TINT_T` 0.75, so it is `near: false, glow: false`." True of the
    // alpha floor, which cuts at t = 0.382, and vacuous for the font floor,
    // which cuts nothing — but FALSE for the clip guard, which hides RIM
    // fragments, and the rim is the bulge ring at `z = 1/f`, i.e. `t = 0.75`,
    // which is `glow: true`. It is harmless today only because the clip guard
    // fires on compact viewports and the glow pass is skipped on them, which is
    // two unrelated facts propping up a stated invariant. Corrected 2026-08-24:
    // the self-healing property above is the reason, and it is sufficient.
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

    // THE GLYPH IS SCALED BY THE TRANSFORM, NOT BY THE FONT SIZE, and that
    // swap is what makes the recession continuous. `setTransform` REPLACES the
    // matrix rather than composing, so the DPR scale is folded in here — which
    // is why `dpr` is a parameter — and the anchor moves into the matrix so
    // the text is drawn at the local origin. `textAlign: center` and
    // `textBaseline: middle` still centre it there.
    //
    // WHY NOT JUST ASSIGN A CONTINUOUS `ctx.font`. It would be the shorter
    // edit and it costs a string BUILD plus a font-shorthand PARSE per
    // fragment per frame — up to 49 of each at 1440, against the 12.85 parses
    // the bucket grid was holding it to, and 49 fresh strings a frame in a
    // module whose header promises zero per-frame allocation. A matrix write
    // is neither.
    //
    // LETTER-SPACING COMES OUT RIGHT FOR FREE. It is set once, in `em`, so it
    // is already relative to the font size; under the transform it scales with
    // the glyphs exactly as it did when the size was being reassigned. The old
    // comment at `SPHERE_SCALE_BUCKETS` refused a transform partly because it
    // "would also scale the letter-spacing" — which is the behaviour that was
    // wanted, and always was.
    const gk = dpr * drawK;
    const gs = gk * SPHERE_GLYPH_TILT;
    ctx.setTransform(gk, gs, -gs, gk, dpr * f.x, dpr * f.y);
    ctx.fillText(f.text, 0, 0);
  }

  // THE TRANSFORM IS GLOBAL AND SURVIVES THE FRAME, exactly like the shadow and
  // the tracking below. Leaving the last fragment's scale on the context would
  // draw the next frame's entire mesh at ~0.4x, in the corner.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
    /** The context's standing DPR scale. Written by `build()`, read by the
     *  sphere's draw pass, which replaces the transform per fragment. */
    let dpr = 1;
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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
          // re-places the same sphere and must keep both arrays (`fade` and
          // `level`), or every
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
          dpr,
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
