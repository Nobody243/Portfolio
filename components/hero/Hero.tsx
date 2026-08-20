"use client";

/**
 * The hero. Three layers, back to front: the constellation mesh on a 2D
 * canvas, the SAAD glass wordmark, and the DOM text.
 *
 * NO WEBGL ANYWHERE. This replaced an R3F scene — extruded `Text3D`, a
 * GPU particle field, a camera pull-back and three separate WebGL failure
 * paths — with Canvas2D plus SVG. The consequences are worth stating, because
 * a future reader will find the removed machinery in the history and wonder:
 *
 *   - There is no `webglSupported` check, no context-loss handler and no
 *     scene-init failure path, because none of those failures can occur. The
 *     old file carried three of them and a DOM fallback mode; the fallback is
 *     now simply what always renders.
 *   - There is no typeface download. The old loader gated on fetching a
 *     Three.js typeface JSON, which is why it reported real progress; the SVG
 *     wordmark uses the webfont the rest of the page already loads. That is
 *     what makes the new loader's fixed timeline honest — see its header.
 *   - There is no camera, so there is no "revealing" phase. The hero is simply
 *     present once the loader leaves, and `revealed` is exactly that.
 *
 * THE VOID IS MEASURED, NOT AGREED. `SaadGlass` reports its glyph box and this
 * component forwards it to `ParticleGrid`, which tears a permanent hole in the
 * mesh there. Nothing shares a hardcoded rectangle: a font swap or a width
 * change moves the box and the void follows, which is the only version of this
 * that cannot silently drift out of alignment with the letters.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroLoader } from "@/components/hero/HeroLoader";
import { ParticleGrid, type VoidRect } from "@/components/hero/ParticleGrid";
import { SaadGlass } from "@/components/hero/SaadGlass";
import {
  THEME_TOGGLE_ON_HERO,
  ThemeToggle,
} from "@/components/ui/ThemeToggle";
import { ScrollTrigger } from "@/lib/animation/gsap";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  const [loaderRetired, setLoaderRetired] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [voidRect, setVoidRect] = useState<VoidRect | null>(null);

  /**
   * Stored only when it actually changes. `SaadGlass` re-measures on resize
   * and on `fonts.ready`, and setting state with an equal-but-new object on
   * every one of those would rerender the tree for nothing.
   */
  const handleMeasure = useCallback((rect: DOMRect) => {
    setVoidRect((prev) =>
      prev &&
      prev.x === rect.x &&
      prev.y === rect.y &&
      prev.width === rect.width &&
      prev.height === rect.height
        ? prev
        : { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    );
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // ScrollTrigger rather than a bare IntersectionObserver: it is already
    // bound to Lenis site-wide, and one scroll authority beats two.
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => setInView(true),
      onEnterBack: () => setInView(true),
      onLeave: () => setInView(false),
      onLeaveBack: () => setInView(false),
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <section
      ref={sectionRef}
      // 100dvh, not 100vh: the hero/About boundary is a hard colour edge, and a
      // URL-bar-induced overflow would put a visible sliver of the hero surface
      // under the fold on mobile.
      //
      // `bg-hero-surface` is a CSS background on this wrapper, so the hero is
      // legible before a single pixel of canvas or SVG has painted.
      className="relative h-dvh w-full overflow-hidden bg-hero-surface"
    >
      {/* Layer 1 — the mesh. Full-bleed, pointer-events-none; the pointer
          listener lives on this section, which is why the canvas must not
          intercept. */}
      <ParticleGrid voidRect={voidRect} />

      {/* Layer 2 — the wordmark, right of centre, physically over the
          permanent void it caused. */}
      <SaadGlass containerRef={sectionRef} onMeasure={handleMeasure} />

      {/* Layer 3 — the DOM text. `fallback` is false because there is now
          always a visible wordmark layer; the prop survives because
          HeroHeadline still uses it to decide whether its <h1> is the visible
          headline or the accessible-only one. */}
      <HeroHeadline
        revealed={loaderRetired}
        fallback={false}
        cueActive={inView && tabVisible}
      />

      {/*
        THE THEME TOGGLE — `/`'s single instance. Ticket 11.

        NOT GATED ON `revealed`, deliberately, and unlike the scroll cue. The
        cue is mount-gated because it animates from opacity 0 and a focusable
        element at opacity 0 puts keyboard focus on something invisible; this
        control never animates and is at full opacity from first paint.

        The loader plate is `fixed` at z-50, above this z-30 wrapper, so it
        covers the toggle while it is up and reveals it on fade-out.

        THE CONTAINER IS BYTE-IDENTICAL to About / Skills / Projects /
        Experience / Contact and to the detail route's CONTAINER, with
        `justify-end`. Rule S-1 reserves the negative space on the right for
        CONTENT; a control is not content, and anchoring it to the right inset
        of the same container is the spine measured from the other side.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-lg z-30 sm:top-xl">
        <div className="mx-auto flex w-full max-w-[1440px] justify-end px-md sm:px-xl lg:px-2xl">
          <ThemeToggle
            className={`${THEME_TOGGLE_ON_HERO} pointer-events-auto`}
          />
        </div>
      </div>

      {/* Layer 4 — the loader, fixed and above everything. Rendered last so it
          wins the paint order even before z-index is consulted. */}
      {!loaderRetired ? (
        <HeroLoader onExited={() => setLoaderRetired(true)} />
      ) : null}
    </section>
  );
}

export default Hero;
