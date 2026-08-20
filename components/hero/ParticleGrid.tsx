"use client";

/**
 * The constellation mesh — a Canvas2D field of drifting nodes joined by
 * hairline links, torn open by the cursor and permanently torn open behind the
 * SAAD wordmark.
 *
 * DISPLACEMENT, NOT BRIGHTENING. Nothing in this file lights a particle up
 * near the pointer, and nothing should be added that does. The cursor shoves
 * nodes outward from their resting positions; the links break on their own
 * because their endpoints exceed `LINK_RADIUS`, not because any code
 * suppresses them. That emergent break is the whole trick — a separate
 * "hide links near the cursor" pass would produce a clean circular cut instead
 * of the ragged, stretched edge this produces.
 *
 * TWO VOIDS, ONE MATH. The cursor void and the permanent wordmark void run
 * through the identical displacement function; the only difference is what
 * position feeds it. The wordmark void is fed a set of anchors sampled across
 * the measured glyph box rather than a single centre point, because a name is
 * a wide rectangle and one circular void either fails to clear the ends or
 * blows a hole far taller than the text.
 *
 * DISPLACEMENT DOES NOT STACK. Where the cursor void overlaps the wordmark
 * void, the LARGER of the two offsets wins rather than their sum. Summing
 * flings nodes roughly twice as far in the overlap band, which reads as a
 * glitch precisely where the visitor is most likely to be looking.
 *
 * ALL MATH RUNS IN ONE rAF TICK. The listeners below only ever write scalars
 * into refs. Doing the transform work inside the event handlers is the classic
 * way to get compounding offsets — two mousemoves in one frame apply the delta
 * twice — and it is also unbounded work on a hostile input device.
 */

import { useEffect, useRef } from "react";

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
 * 1440x820 -> 131 nodes, inside the 100-140 the acceptance criteria name.
 */
const AREA_PER_NODE = 9_000;

/**
 * Hard ceiling, independent of viewport. The link pass is O(n²) and the brief
 * explicitly says not to reach for spatial hashing below ~150 nodes — so the
 * honest move is to cap at the number that keeps that promise true rather than
 * to let an ultrawide monitor quietly walk into 400 nodes and 80,000 distance
 * checks a frame.
 */
const MAX_NODES = 150;
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
 * wordmark void still renders; it does not depend on input.
 */
const INTERACTIVE_MIN_WIDTH = 768;

/** Resize debounce, ms. */
const RESIZE_DEBOUNCE_MS = 150;

/**
 * How many anchors to spread across the wordmark box. Enough that the sampled
 * circles overlap into a capsule at `VOID_RADIUS`, few enough to stay cheap:
 * the displacement pass is O(nodes x anchors).
 */
const WORDMARK_ANCHORS: number = 5;

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

export type VoidRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ParticleGridProps = {
  /**
   * The wordmark's box in CONTAINER coordinates, or null before it has been
   * measured. Measured at runtime by the caller and passed down rather than
   * hardcoded here — the brief's own acceptance criteria reject pixel
   * positions that cannot survive a font or viewport change, and this box is
   * what guarantees the permanent void actually sits under the glyphs.
   */
  voidRect: VoidRect | null;
};

export function ParticleGrid({ voidRect }: ParticleGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  /* Live input state. Written by listeners, read by the rAF tick. Never read
     during render — none of this belongs in React state, and putting it there
     would re-render the tree at pointer rate. */
  const pointer = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  /* The measured wordmark box, mirrored into a ref so the animation effect
     does not have to re-run (and reallocate the whole field) every time the
     caller re-measures it. */
  const voidRectRef = useRef<VoidRect | null>(voidRect);
  useEffect(() => {
    voidRectRef.current = voidRect;
  }, [voidRect]);

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

    /** Read once per rebuild — cheap, and it lets a themed accent flow through
     *  without this file hardcoding a hex. */
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
    };

    /**
     * The displacement kernel, shared by both voids exactly as the brief
     * requires. Measures from the node's HOME position, not its current one:
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
    ): { x: number; y: number; mag: number } => {
      const dx = node.homeX - cx;
      const dy = node.homeY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist >= VOID_RADIUS) return { x: 0, y: 0, mag: 0 };

      const strength = (VOID_RADIUS - dist) / VOID_RADIUS;
      // Guard the exact-centre case: a node whose home is precisely the anchor
      // has no direction to be pushed in, and dividing by zero would put NaN
      // into its position permanently.
      const ux = dist === 0 ? 1 : dx / dist;
      const uy = dist === 0 ? 0 : dy / dist;
      const mag = strength * VOID_RADIUS;
      return { x: ux * mag, y: uy * mag, mag };
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, width, height);

      const interactive =
        !reducedMotion &&
        width >= INTERACTIVE_MIN_WIDTH &&
        pointer.current.active;

      // Sample anchors across the wordmark box, so a wide name gets a capsule
      // rather than one circle centred on its middle.
      const box = voidRectRef.current;
      const anchors: Array<[number, number]> = [];
      if (box) {
        const cy = box.y + box.height / 2;
        for (let i = 0; i < WORDMARK_ANCHORS; i++) {
          // Annotated `number` above, not left to infer the literal `5`, so
          // this divide-by-zero guard is not compiled away as unreachable —
          // it is the thing that keeps a future edit to 1 from producing NaN.
          const t =
            WORDMARK_ANCHORS < 2 ? 0.5 : i / (WORDMARK_ANCHORS - 1);
          anchors.push([box.x + box.width * t, cy]);
        }
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
          const p = pushFrom(node, pointer.current.x, pointer.current.y);
          if (p.mag > best.mag) best = p;
        }
        for (const [ax, ay] of anchors) {
          const p = pushFrom(node, ax, ay);
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
    };

    /* --- listeners: they only write scalars --------------------------- */
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.current.x = event.clientX - rect.left;
      pointer.current.y = event.clientY - rect.top;
      pointer.current.active = true;
    };
    const onPointerLeave = () => {
      // The void closes because `active` goes false, so the nodes lerp home
      // through the same path they lerped out along. Nothing snaps.
      pointer.current.active = false;
    };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, RESIZE_DEBOUNCE_MS);
    };

    build();
    raf = requestAnimationFrame(frame);

    // `pointermove` rather than `mousemove`: one event for mouse and pen, and
    // a touch drag reports as a pointer too — harmless here because the
    // interaction is width-gated off on the viewports where that happens.
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    return () => {
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
