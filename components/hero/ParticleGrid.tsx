"use client";

/**
 * The hero's canvas. Two effects, one context, one rAF tick: the constellation
 * mesh — a field of drifting nodes joined by hairline links, torn open by the
 * cursor and permanently torn open behind the subject — and the command sphere
 * that floats in front of it.
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
 * THE PALETTE IS THE SAME VARIABLE, NOT A MATCHED ONE. `--accent-hero` is
 * parsed to channels once per rebuild into `accent`, and the sphere reads that
 * same local. Two `getPropertyValue` calls can disagree after a theme change;
 * one cannot.
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
 * UNDER REDUCED MOTION THE TICK IS NOT SCHEDULED AT ALL. Not slowed — stopped.
 * This file used to clear and redraw an identical frame forever on that path,
 * which was already waste and became real cost once the sphere added ninety
 * `fillText` calls and a sort to it. One frame is drawn after each build, and
 * one more once the webfont resolves. Nothing else runs.
 */

import { useEffect, useRef } from "react";

import {
  HERO_COMMAND_FEATURED,
  HERO_COMMAND_FRAGMENTS,
} from "@/components/hero/heroContent";
import {
  createCommandSphere,
  placeCommandSphere,
  projectCommandSphere,
  stepCommandSphere,
  commandSphereVoid,
  SPHERE_SCALE_MIN,
  SPHERE_SCALE_MAX,
  type CommandSphere,
} from "@/lib/hero/commandSphere";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/* -------------------------------------------------------------------------
   Field constants. CSS pixels throughout — the DPR scale is applied to the
   context once, so nothing below ever has to think about it.
------------------------------------------------------------------------- */

/**
 * One node per this many square pixels.
 *
 * THE DENSE END OF THE BRIEF'S 9,000-14,000 BAND, and that is a correction
 * rather than a preference. 11,000 was tried first and the field did not read
 * as the "loose triangulated mesh" the brief describes — it read as scattered
 * dots with the occasional link. The arithmetic says why: at 11,000 the mean
 * nearest-neighbour distance on a 1440x820 hero is ~105px, which was exactly
 * `LINK_RADIUS`, so the average node sat right on the threshold and most pairs
 * failed it. At 9,000 the spacing drops to ~95px against a 120px radius and
 * each node finds two to four neighbours, which is what makes triangles.
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
const AREA_PER_NODE = 5_200;

/**
 * Hard ceiling, independent of viewport, so an ultrawide monitor cannot walk
 * the O(n²) link pass into six figures of distance checks a frame. Raised with
 * the density; still a real cap.
 */
const MAX_NODES = 300;
const MIN_NODES = 24;

/** Radius of the torn void, CSS px. Mid-point of the brief's 130-160. */
const VOID_RADIUS = 145;
/** Nodes closer than this to each other get a link drawn. Brief: 90-120, and
 *  the top of it for the reason given on AREA_PER_NODE — this value and that
 *  one set the mesh's connectivity together and must be retuned together. */
const LINK_RADIUS = 120;
/** Peak link alpha, at zero separation. Brief: 12-18%. */
const LINK_PEAK_ALPHA = 0.16;
/** Node alpha. Slightly above the links so the dots read as the structure. */
const NODE_ALPHA = 0.5;

/** How fast a node eases toward its target offset. Brief: ~0.12. */
const LERP = 0.12;
/** Ambient wander is bounded to this radius around home, CSS px. */
const DRIFT_CLAMP = 15;

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
 * fragment per 6,500px² of projected area against the mesh's `AREA_PER_NODE` of
 * 5,200, so the sphere never reads as denser than the atmosphere it floats in
 * front of. The compact count is not a performance concession — a ~223px sphere
 * cannot legibly hold ninety command strings at any readable size.
 *
 * `heroContent.ts` currently ships 95 fragments and the sphere draws 90 of
 * them, sampled by stride. Raising this to 95 is a one-word edit if all of them
 * should appear.
 */
const SPHERE_COUNT = 90;
const SPHERE_COUNT_COMPACT = 44;

/**
 * Base type size at the near pole, CSS px. Everything else is this times the
 * fragment's depth scale.
 */
const SPHERE_FONT_PX = 13;
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
 * A fragment rendering below this size is DROPPED, not shrunk. Unreadable 6px
 * mono is noise, not depth, and the premise of the whole effect is that these
 * are legible commands rather than decoration that happens to be letter-shaped.
 *
 * At the shipped values it never fires — the far pole lands at 13 x 0.62 =
 * 8.1px desktop and 11 x 0.62 = 6.8px compact. It is the guard that keeps a
 * future retune of the depth ramp from quietly producing a haze.
 */
const SPHERE_MIN_FONT_PX = 7;
const SPHERE_MIN_FONT_PX_COMPACT = 6;

/**
 * How many discrete type sizes the depth ramp is quantised to.
 *
 * `ctx.font` assignment is a font-shorthand PARSE, not a field write, and it is
 * the most expensive thing in the draw loop after the glow. Six steps across a
 * 0.62–1.00 range is a ≤1px difference between neighbouring buckets at 13px —
 * invisible — in exchange for six parses a frame instead of ninety.
 *
 * Bucketing rather than `ctx.setTransform`: a transform would also scale the
 * letter-spacing and the shadow blur, and it would make the minimum-size rule
 * above impossible to reason about.
 */
const SPHERE_SCALE_BUCKETS = 6;

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
 * The sphere's entire draw pass. Deliberately ONE function and deliberately NOT
 * interleaved with the mesh loop below — the two effects share a frame, which
 * is a performance decision, and nothing about it requires them to share code.
 *
 * It reads `sphere.projected` and the far-to-near `order` that
 * `projectCommandSphere` just wrote. It computes no geometry of its own.
 *
 * THE ORDER'S MONOTONICITY IS WHAT MAKES THIS CHEAP. `t` only increases along
 * it, so the scale bucket, the colour stop and the glow flag each change at
 * most a handful of times across ninety fragments instead of once per fragment.
 * That turns the three expensive pieces of context state — the font parse, the
 * fill style and `shadowBlur` — into a near-constant number of assignments.
 *
 * ALPHA GOES THROUGH `globalAlpha`, NOT THROUGH THE FILL STRING. Per-fragment
 * `rgba(...)` would allocate ninety strings a frame for a value that a context
 * field already carries, and it would defeat the two-stop colour scheme by
 * making every fragment its own style.
 */
function drawCommandSphere(
  ctx: CanvasRenderingContext2D,
  sphere: CommandSphere,
  order: readonly number[],
  accent: string,
  fontStack: string,
  compact: boolean,
  viewportWidth: number,
): void {
  const basePx = compact ? SPHERE_FONT_PX_COMPACT : SPHERE_FONT_PX;
  const minPx = compact ? SPHERE_MIN_FONT_PX_COMPACT : SPHERE_MIN_FONT_PX;
  const span = SPHERE_SCALE_MAX - SPHERE_SCALE_MIN;
  const steps = SPHERE_SCALE_BUCKETS - 1;

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
    const f = sphere.projected[order[i]];

    const step = Math.round(((f.scale - SPHERE_SCALE_MIN) / span) * steps);
    if (step !== bucket) {
      bucket = step;
      const px = basePx * (SPHERE_SCALE_MIN + (step / steps) * span);
      ctx.font = `${px}px ${fontStack}`;
    }
    // Measured against the BUCKETED size, because that is what actually
    // renders. Testing the unquantised scale would drop a fragment that was
    // about to be drawn a bucket larger.
    if (basePx * (SPHERE_SCALE_MIN + (bucket / steps) * span) < minPx) continue;

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
    const px = basePx * (SPHERE_SCALE_MIN + (bucket / steps) * span);
    const halfWidth = f.text.length * px * SPHERE_ADVANCE_ESTIMATE * 0.5;
    if (f.x - halfWidth < 0 || f.x + halfWidth > viewportWidth) continue;

    ctx.globalAlpha = f.alpha;
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

/**
 * NO PROPS, DELIBERATELY. This component used to take the wordmark's measured
 * box so it could place the permanent void under it. The subject is now drawn
 * by this canvas, so the number never leaves this closure and there is nothing
 * for a parent to forward. See the header's "STILL MEASURED, NOT AGREED".
 */
export function ParticleGrid() {
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
    let compact = false;
    /** rAF timestamp of the previous tick, for real elapsed `dt`. */
    let lastFrame = 0;

    /** Read once per rebuild — cheap, and it lets a themed accent flow through
     *  without this file hardcoding a hex. THE SPHERE READS THIS SAME LOCAL;
     *  a second `getPropertyValue` could disagree with it after a theme flip. */
    let accent = "0, 229, 255";
    const readAccent = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-hero")
        .trim();
      // #00e5ff -> "0, 229, 255". Canvas needs channels for rgba().
      const hex = raw.replace("#", "");
      if (hex.length === 6) {
        const n = parseInt(hex, 16);
        accent = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      }
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
        Math.min(MAX_NODES, Math.round((width * height) / AREA_PER_NODE)),
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

      readAccent();
      readFont();

      // The sphere is rebuilt only when the fragment count actually changes —
      // i.e. when a resize crosses the 768px gate. Re-placing preserves the
      // rotation state, so dragging a window edge does not snap the sphere back
      // to its rest orientation on every debounced rebuild.
      compact = width < INTERACTIVE_MIN_WIDTH;
      const fragments = compact ? SPHERE_COUNT_COMPACT : SPHERE_COUNT;
      if (!sphere || sphere.fragments.length !== fragments) {
        sphere = createCommandSphere(
          HERO_COMMAND_FRAGMENTS,
          fragments,
          HERO_COMMAND_FEATURED,
        );
      }
      // Fed the canvas's OWN untransformed CSS size, never a rect measured off
      // anything inside the hero's stage wrapper. That wrapper carries a live
      // GSAP transform for the arrival's 1.6s, and a rect read through it would
      // be in a different coordinate space than everything drawn here.
      placeCommandSphere(sphere, width, height, compact);
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

    const frame = (now: number) => {
      // SCHEDULED ONLY WHEN THERE IS SOMETHING TO ANIMATE. Under reduced motion
      // nothing in this frame can differ from the last one — the field does not
      // drift, the sphere does not rotate and the cursor drives neither — so
      // the loop is not queued at all. It used to redraw an identical frame
      // every ~16ms forever, which the sphere would have turned into ninety
      // wasted `fillText` calls a frame for the one visitor who asked for less.
      if (!reducedMotion) raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, width, height);

      const dt = lastFrame === 0 ? 0 : now - lastFrame;
      lastFrame = now;

      const interactive =
        !reducedMotion &&
        width >= INTERACTIVE_MIN_WIDTH &&
        pointer.current.active;

      /* --- the sphere's geometry, before the mesh needs its void --------- */
      let sphereOrder: readonly number[] = [];
      let voidAnchor: { cx: number; cy: number; radius: number } | null = null;
      if (sphere) {
        if (!reducedMotion) {
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

      for (const node of nodes) {
        /* --- ambient drift, bounded ------------------------------------- */
        if (!reducedMotion) {
          node.dx += node.vx;
          node.dy += node.vy;
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

        node.ox += (best.x - node.ox) * LERP;
        node.oy += (best.y - node.oy) * LERP;

        node.x = node.homeX + node.dx + node.ox;
        node.y = node.homeY + node.dy + node.oy;
      }

      /* --- links, from DISPLACED positions ----------------------------- */
      ctx.lineWidth = 1;
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
          ctx.strokeStyle = `rgba(${accent}, ${
            (1 - dist / LINK_RADIUS) * LINK_PEAK_ALPHA
          })`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      /* --- nodes -------------------------------------------------------- */
      ctx.fillStyle = `rgba(${accent}, ${NODE_ALPHA})`;
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      /* --- the sphere, LAST, so it composites in front of the mesh ------- */
      if (sphere) {
        drawCommandSphere(
          ctx,
          sphere,
          sphereOrder,
          accent,
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
    };
    const onPointerLeave = () => {
      // The void closes because `active` goes false, so the nodes lerp home
      // through the same path they lerped out along. Nothing snaps.
      pointer.current.active = false;
    };
    /**
     * One frame, drawn synchronously. The reduced-motion path's ENTIRE render
     * loop: there is no rAF to carry a rebuild onto the next tick, so a resize
     * has to repaint itself.
     */
    const drawOnce = () => {
      if (disposed) return;
      frame(performance.now());
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        if (reducedMotion) drawOnce();
      }, RESIZE_DEBOUNCE_MS);
    };

    build();
    if (reducedMotion) {
      drawOnce();
      // The animated path self-heals a late webfont — it redraws sixty times a
      // second and picks the real family up the moment it resolves. The static
      // path draws once and never again, so if that one frame lands before the
      // font does, the sphere is set in a system mono forever. `AssetLoader`
      // awaits `fonts.ready` before the hero is revealed, but its 8s stall
      // hand-off can put the hero on screen without it.
      if (document.fonts?.ready) void document.fonts.ready.then(drawOnce);
    } else {
      raf = requestAnimationFrame(frame);
    }

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
    };
  }, [reducedMotion]);

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
