"use client";

/**
 * The SAAD wordmark as glass: a stroked outline that is always present, and —
 * only while hovered — liquid moving inside the letterforms.
 *
 * SVG MASK, NOT `background-clip: text`. The containment is the point. A mask
 * whose content is the glyphs themselves means the turbulence, the gradient
 * and the goo blobs CANNOT render outside the letters, at any viewport width,
 * regardless of how the fill content is animated. `background-clip: text`
 * would serve a gradient fine but cannot compose with `feTurbulence` /
 * `feDisplacementMap`, which have to operate on real SVG content — and mixing
 * the two would put the containment guarantee on the weaker of the two
 * mechanisms.
 *
 * TWO FILL LAYERS, BOTH INSIDE THE MASK:
 *   - the AMBIENT layer is a gradient rect pushed through turbulence, with its
 *     `baseFrequency` swept continuously. This is what keeps the liquid moving
 *     when the cursor is holding still. Without it the effect is a blob
 *     chasing a pointer, which is a different and much cheaper-looking idea.
 *   - the BLOB layer is three goo-filtered circles lerping toward the cursor
 *     at three different rates, so they trail instead of moving as one rigid
 *     body. Three is the brief's ceiling and it is correct — past three it
 *     reads as noise rather than as liquid.
 *
 * NEITHER LAYER EXISTS WHEN NOT HOVERED. They are unmounted, not hidden:
 * `feTurbulence` is one of the most expensive primitives in SVG and a hidden
 * filter still costs a composite. The rAF ticker is likewise never started.
 *
 * NO ENTRANCE ANIMATION, deliberately. This block is simply present when the
 * hero is. Its "entrance" is the loader leaving.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { HERO_WORDMARK } from "@/components/hero/heroContent";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/* -------------------------------------------------------------------------
   The SVG's own coordinate space. Every number in this file that is not a
   ratio is in these units, and the element is scaled by CSS — so the effect
   is resolution-independent and the 375px case is the same geometry as the
   1600px case, just smaller. That is what makes the containment claim
   testable once rather than per breakpoint.
------------------------------------------------------------------------- */
const VB_W = 1000;
const VB_H = 320;
/** Fills the box for a four-glyph word without relying on measured metrics. */
const FONT_SIZE = 260;

/** Tilt ceiling in degrees. Brief: +/-6-8. */
const TILT_MAX_DEG = 7;
/** Damping toward the tilt target. Brief: ~0.08. */
const TILT_LERP = 0.08;

/** Per-blob chase rates. Staggered so they trail rather than move as one. */
const BLOB_LERP = [0.22, 0.18, 0.15] as const;
const BLOB_RADIUS = [86, 62, 44] as const;

/** Turbulence sweep bounds. Brief: baseFrequency ~0.01-0.02. */
const TURB_MIN = 0.012;
const TURB_MAX = 0.02;
/** Radians per ms for the sweep — one full cycle every ~7s. */
const TURB_SPEED = 0.0009;

type SaadGlassProps = {
  /**
   * The hero section. Tilt is driven from pointer movement anywhere in it —
   * the brief asks for the tilt to reset "when the cursor leaves the hero
   * entirely", not when it leaves the glyph box — while the tilt ANGLE is
   * computed against this element's own rect.
   */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Called with the wordmark's box in container coordinates whenever it
   * changes. The particle grid uses it to place the permanent void, which is
   * why it is measured rather than agreed on as a constant: a font swap, a
   * viewport change or a text change would silently desynchronise a shared
   * number, and the resulting bug — a void slightly off the letters — looks
   * like a design choice rather than a defect.
   */
  onMeasure?: (rect: DOMRect) => void;
};

export function SaadGlass({ containerRef, onMeasure }: SaadGlassProps) {
  const reducedMotion = useReducedMotion();
  /**
   * True while the pointer is anywhere in the HERO — not only over the glyphs.
   *
   * It was glyph-gated first, which meant the liquid only existed once you
   * were already on the letters. The ask is liquid that FOLLOWS the cursor and
   * flows through the glass, so it has to be alive while the cursor is
   * approaching, with the mask clipping it to the letterforms. The visible
   * result is liquid welling toward whichever edge of the word the cursor is
   * nearest, which is the behaviour glyph-gating made impossible.
   */
  const [hovered, setHovered] = useState(false);

  const plateRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);
  const blobRefs = useRef<Array<SVGCircleElement | null>>([null, null, null]);
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);

  /**
   * `useId` is namespaced per instance, so two of these could coexist without
   * their filters colliding. Sanitised because React's ids contain ':' and a
   * bare colon inside `url(#...)` is a parse hazard in some engines.
   */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const maskId = `saad-mask-${uid}`;
  const gooId = `saad-goo-${uid}`;
  const flowId = `saad-flow-${uid}`;
  const inkId = `saad-ink-${uid}`;
  const blobId = `saad-blob-${uid}`;
  const glassId = `saad-glass-${uid}`;

  /* Live input, written by listeners and read by the tick. Never state. */
  const tilt = useRef({ tx: 0, ty: 0, cx: 0, cy: 0 });
  /** Cursor in viewBox units, and each blob's current position. */
  const blobTarget = useRef({ x: VB_W / 2, y: VB_H / 2 });
  const blobPos = useRef(
    BLOB_LERP.map(() => ({ x: VB_W / 2, y: VB_H / 2 })),
  );

  /* -----------------------------------------------------------------------
     Measurement. Reported in CONTAINER coordinates, because that is the space
     the canvas draws in.
  ----------------------------------------------------------------------- */
  const measure = useCallback(() => {
    const text = textRef.current;
    const container = containerRef.current;
    if (!text || !container || !onMeasure) return;
    const t = text.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    onMeasure(
      new DOMRect(t.x - c.x, t.y - c.y, t.width, t.height),
    );
  }, [containerRef, onMeasure]);

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    // Fonts land after first paint and change the glyph box. Without this the
    // void is placed against fallback metrics and never corrected.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  /* -----------------------------------------------------------------------
     Tilt. One rAF loop, always running while motion is allowed, because it
     also has to animate the RETURN to flat after the pointer leaves.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;

    const onMove = (event: PointerEvent) => {
      const plate = plateRef.current;
      if (!plate) return;
      const r = plate.getBoundingClientRect();
      // Relative to the PLATE's own centre, normalised to -1..1 — so the tilt
      // is about this element, not about where it happens to sit in the hero.
      const nx = (event.clientX - (r.x + r.width / 2)) / (r.width / 2);
      const ny = (event.clientY - (r.y + r.height / 2)) / (r.height / 2);
      tilt.current.tx = Math.max(-1, Math.min(1, nx));
      tilt.current.ty = Math.max(-1, Math.min(1, ny));
    };
    const onLeave = () => {
      tilt.current.tx = 0;
      tilt.current.ty = 0;
      setHovered(false);
    };
    const onEnter = () => setHovered(true);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = tilt.current;
      t.cx += (t.tx - t.cx) * TILT_LERP;
      t.cy += (t.ty - t.cy) * TILT_LERP;
      const plate = plateRef.current;
      if (plate) {
        // rotateX is driven by the VERTICAL offset and negated: cursor below
        // centre should tip the far edge away, which is the sign that reads as
        // "following the cursor" rather than "recoiling from it".
        plate.style.transform = `rotateX(${(-t.cy * TILT_MAX_DEG).toFixed(3)}deg) rotateY(${(t.cx * TILT_MAX_DEG).toFixed(3)}deg)`;
      }
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [containerRef, reducedMotion]);

  /* -----------------------------------------------------------------------
     Liquid. Started ONLY while hovered — this is the expensive half.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (!hovered || reducedMotion) return;
    const plate = plateRef.current;
    if (!plate) return;

    let raf = 0;
    let start = 0;

    const onMove = (event: PointerEvent) => {
      const svgRect = plate.getBoundingClientRect();
      if (!svgRect.width || !svgRect.height) return;
      // NOT clamped to the plate. A cursor to the left of the word maps to a
      // negative viewBox x, the blobs chase it out past the S, and the mask
      // keeps only the part still inside a letter — which is what reads as
      // liquid draining toward the edge the cursor is on.
      // Client -> viewBox. The SVG scales uniformly, so this is a plain ratio
      // rather than a full CTM inverse.
      blobTarget.current.x =
        ((event.clientX - svgRect.x) / svgRect.width) * VB_W;
      blobTarget.current.y =
        ((event.clientY - svgRect.y) / svgRect.height) * VB_H;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!start) start = now;
      const elapsed = now - start;

      // Ambient churn: sweep baseFrequency so the displacement field keeps
      // reorganising even with the pointer parked.
      const turb = turbRef.current;
      if (turb) {
        const s = (Math.sin(elapsed * TURB_SPEED) + 1) / 2;
        const f = TURB_MIN + (TURB_MAX - TURB_MIN) * s;
        turb.setAttribute("baseFrequency", `${f.toFixed(5)} ${(f * 1.6).toFixed(5)}`);
      }

      BLOB_LERP.forEach((rate, i) => {
        const p = blobPos.current[i];
        p.x += (blobTarget.current.x - p.x) * rate;
        p.y += (blobTarget.current.y - p.y) * rate;
        const el = blobRefs.current[i];
        if (el) {
          el.setAttribute("cx", p.x.toFixed(2));
          el.setAttribute("cy", p.y.toFixed(2));
        }
      });
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [hovered, reducedMotion]);

  return (
    // The perspective lives on the wrapper, the 3D on the plate — the standard
    // split, and the reason the tilt reads as depth rather than as skew.
    <div
      className="pointer-events-none absolute inset-0 flex items-center"
      style={{ perspective: "1200px" }}
    >
      {/*
        RIGHT OF CENTRE, per the brief: the block starts past the midpoint and
        runs toward the right edge, leaving the hero's left third to the DOM
        text. Not dead centre, not edge-anchored.
      */}
      <div className="ml-[42%] w-[54%] max-w-[900px]">
        <div
          ref={plateRef}
          className="pointer-events-auto"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="block h-auto w-full overflow-visible"
            role="img"
            aria-label={HERO_WORDMARK}
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse">
                {/* Black ground, white glyphs: white passes, black blocks.
                    Everything inside the masked group is therefore clipped to
                    the letterforms with no per-effect containment logic. */}
                <rect x="0" y="0" width={VB_W} height={VB_H} fill="black" />
                <text
                  x={VB_W / 2}
                  y={VB_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={FONT_SIZE}
                  fontWeight={500}
                  letterSpacing="-0.03em"
                  fill="white"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {HERO_WORDMARK}
                </text>
              </mask>

              {/*
                BOTH FILTERS ARE GATED ON HOVER, not just the shapes that use
                them. Leaving them permanently in <defs> is nearly free — an
                unreferenced filter is inert — but "nearly" is not what the
                acceptance criteria ask for, and a filter element sitting in
                the document is something a later edit can accidentally
                reference. Gating them makes the claim structural: when the
                pointer is elsewhere, no turbulence primitive exists at all.
              */}
              {hovered && !reducedMotion && (
                <>
              {/* The classic goo: blur the shapes together, then crush the
                  alpha ramp so the blurred fringes snap back to a hard edge —
                  which is what fuses overlapping circles into one body. */}
              <filter id={gooId}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
                <feColorMatrix
                  in="b"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                />
              </filter>

              {/* Ambient flow. `baseFrequency` is swept from the rAF tick. */}
              <filter id={flowId}>
                <feTurbulence
                  ref={turbRef}
                  type="fractalNoise"
                  baseFrequency="0.014 0.022"
                  numOctaves={3}
                  seed={7}
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={20}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
                </>
              )}

              <linearGradient id={inkId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent-hero)" stopOpacity="0.55" />
                <stop offset="55%" stopColor="#7fe9ff" stopOpacity="0.30" />
                <stop offset="100%" stopColor="var(--accent-hero)" stopOpacity="0.60" />
              </linearGradient>

              {/* Radial, not flat — the brief is explicit, and it is what
                  sells the blobs as a material rather than as shapes. */}
              {/*
                THE GLASS BODY. Always present, unlike everything else in the
                mask — this is what makes the wordmark read as a pane rather
                than as an outline that fills in on hover.

                It is a TRANSLUCENT fill, so the particle field genuinely shows
                through the letters; it is not a blurred sample of the backdrop,
                because SVG has no way to read what is behind an element
                (`BackgroundImage` was never implemented anywhere). Over a dark
                field the translucent-pane-plus-bright-rim reading is what sells
                Apple's glass, and the field showing through is the part that
                would otherwise be faked.

                Top-lit: brightest at the top edge, falling to a cool accent
                floor. That vertical gradient is doing the work of an
                environment reflection.
              */}
              <linearGradient id={glassId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
                <stop offset="42%" stopColor="#bfeeff" stopOpacity="0.11" />
                <stop offset="100%" stopColor="var(--accent-hero)" stopOpacity="0.16" />
              </linearGradient>

              <radialGradient id={blobId}>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#bfeeff" stopOpacity="0.75" />
                <stop offset="100%" stopColor="var(--accent-hero)" stopOpacity="0.35" />
              </radialGradient>
            </defs>

            {/* The pane itself. Under the liquid and under the rim. */}
            <g mask={`url(#${maskId})`}>
              <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${glassId})`} />
            </g>

            {hovered && !reducedMotion && (
              <g mask={`url(#${maskId})`}>
                <rect
                  x={-VB_W * 0.2}
                  y={-VB_H * 0.5}
                  width={VB_W * 1.4}
                  height={VB_H * 2}
                  fill={`url(#${inkId})`}
                  filter={`url(#${flowId})`}
                />
                <g filter={`url(#${gooId})`}>
                  {BLOB_RADIUS.map((r, i) => (
                    <circle
                      key={i}
                      ref={(el) => {
                        blobRefs.current[i] = el;
                      }}
                      r={r}
                      cx={VB_W / 2}
                      cy={VB_H / 2}
                      fill={`url(#${blobId})`}
                    />
                  ))}
                </g>
              </g>
            )}

            {/* ALWAYS VISIBLE. The letterforms must read with no cursor
                anywhere near them; the liquid is an enhancement, never the
                thing that defines the shapes.

                RENDERED LAST, above the liquid. It was above the glass body
                but below the liquid first, and the masked liquid then painted
                over the inner half of the stroke wherever it welled up — the
                letterforms lost their edge exactly when the effect was most
                active. The rim has to be the topmost thing in the wordmark.

                The rim is deliberately brighter and heavier than an outline
                would need to be: on glass the edge is where refraction
                concentrates, and a thin faint stroke reads as a wireframe
                instead. */}
            <text
              ref={textRef}
              x={VB_W / 2}
              y={VB_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={FONT_SIZE}
              fontWeight={500}
              letterSpacing="-0.03em"
              fill="none"
              stroke="var(--accent-hero)"
              strokeOpacity="0.9"
              strokeWidth="2.25"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {HERO_WORDMARK}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default SaadGlass;
