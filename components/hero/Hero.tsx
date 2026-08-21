"use client";

/**
 * The hero. Two layers, back to front: one 2D canvas carrying both the
 * constellation mesh and the command sphere that floats in front of it, and the
 * DOM text over the top.
 *
 * IT USED TO BE THREE. The middle layer was `SaadGlass`, an SVG rendering of
 * the name as glass. It is gone, and nothing replaces it as a visible wordmark:
 * the Intro delivers "Muhammad Saad" at full size and contracts it into the
 * navbar's MS mark, so the name arrives as a MOVE that the chrome then carries.
 * A static wordmark sitting here would restate what the Intro just spent its
 * whole duration saying, and the sphere is the thing this surface is for.
 *
 * NO WEBGL ANYWHERE. This replaced an R3F scene — extruded `Text3D`, a
 * GPU particle field, a camera pull-back and three separate WebGL failure
 * paths — with a single Canvas2D context. The consequences are worth stating,
 * because
 * a future reader will find the removed machinery in the history and wonder:
 *
 *   - There is no `webglSupported` check, no context-loss handler and no
 *     scene-init failure path, because none of those failures can occur. The
 *     old file carried three of them and a DOM fallback mode; the fallback is
 *     now simply what always renders.
 *   - There is no typeface download. The hero uses the webfont the rest of the
 *     page already loads, which is why `AssetLoader` tracks fonts and nothing
 *     else — see its header for the full list of what is and is not gated.
 *   - There is no camera in the scene. The only camera move on this surface is
 *     the EXPANSION below, and it is not the hero's own: it is the second half
 *     of the Intro's handoff, continued on this side of the seam. The Intro
 *     contracts its mark to a point and this opens out of that point.
 *
 * THE VOID IS STILL MEASURED, NOT AGREED — and this component no longer has any
 * part in it. The invariant used to be enforced here: `SaadGlass` measured its
 * glyph box, this file held it in state, and `ParticleGrid` received it as a
 * prop, because the number had to travel between two elements in two coordinate
 * spaces. The subject is now drawn by the canvas itself, so its centre and
 * radius never leave that closure and there is nothing left that could drift.
 * The guarantee got stronger, not weaker; the plumbing that used to carry it
 * was deleted rather than kept as ceremony. Do not reintroduce a `voidRect`
 * prop — its return would mean something is measuring the sphere from outside
 * the only place that knows where it is.
 *
 * THERE IS NO THEME TOGGLE HERE ANY MORE. It used to be this surface's single
 * instance, anchored to the top-right inset of the shared container — which is
 * now the exact rectangle the fixed navbar occupies. The two cannot both have
 * it. `docs/06_INTRO_AND_CHROME.md` §5 records the placement decision and its
 * consequence in full; the short version is that the navbar spec removes the
 * toggle from the desktop chrome deliberately, and it survives in the mobile
 * menu and on every Tier 3 surface.
 */

import { useEffect, useRef, useState } from "react";

import { HERO_SECTION_ID } from "@/components/hero/heroContent";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { ParticleGrid } from "@/components/hero/ParticleGrid";
import { IntroGate } from "@/components/intro/IntroGate";
import { ScrollTrigger, gsap } from "@/lib/animation/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * THE EXPANSION — and it is now exactly as long as the Intro's phase E, not
 * longer.
 *
 * This used to be 1.6s against a 0.95s zoom-in, on the rule that the incoming
 * half of a handoff must outlast the outgoing one or the seam becomes a cut.
 * That rule belonged to a CAMERA move: the mark accelerated out through the
 * viewport while the hero settled in behind it, and the settle had to still be
 * happening when the mark left. There is no camera any more. `docs/07` §3
 * step 5 replaces the zoom entirely with an expansion from one defined point,
 * and step 6 puts the navbar's entrance on the same beat — which
 * `.claude/handoff/intro-timing-design.md` §5 makes literal: same start, same
 * duration, for both. A hero still expanding 1.15s after the plate has gone
 * would be the third thing happening in a beat that has two.
 *
 * The shared value lives in `lib/animation/handoff.ts` because it is one joint
 * between three components, and a duration written down twice is a duration
 * until someone retunes one copy.
 */
const ARRIVAL_S = 1.6;
/**
 * IT EXPANDS FROM A POINT, AND THE POINT IS DEFINED RATHER THAN IMPLIED.
 *
 * The Intro contracts its mark to `(296, 288)` in the mark's viewBox and
 * positions that coordinate — not the mark's bounding box — at dead viewport
 * centre. The hero section is `h-dvh`, sits at the top of the document, and the
 * page is at scroll 0 for the whole sequence, so the section's own centre IS
 * that pixel and a `50% 50%` origin lands on it exactly. THAT IDENTITY IS WHY
 * THERE IS NO COORDINATE HERE TO KEEP IN SYNC — but it is also the thing that
 * would break silently if the hero ever stopped being full-viewport at scroll
 * 0, so it is written down rather than assumed.
 *
 * IT SETTLES OUT OF AN OVER-SCALE. IT DOES NOT GROW FROM A POINT.
 *
 * Both values below restore `f640107` verbatim, because the Intro's camera is
 * back and the camera is what they exist for.
 *
 * `scale: 0` over 0.45s was correct for the merge-to-point Intro, where the
 * mark contracted to a dot and the hero genuinely bloomed out of that pixel.
 * Under a zoom-in both are wrong, and wrong in a way that is easy to miss
 * because nothing looks broken: the hero simply finishes early and the camera
 * then flies over a surface that has already arrived.
 *
 * THE RULE, restated because it was removed once already: the incoming half of
 * a handoff must OUTLAST the outgoing one, or the seam becomes a cut. The mark
 * accelerates out through the viewport over `ZOOM_IN_S` (0.95s) while the hero
 * settles in behind it, and the settle has to still be happening when the mark
 * leaves. 1.6s against 0.95s is that margin.
 *
 * 1.12 rather than 0 for the same reason. A camera moving forward hands off to
 * a surface that is slightly too close and eases back to rest; that continuity
 * is the whole illusion. Growing from a dot reads as a separate event that
 * happens to begin where the last one ended.
 */
const ARRIVAL_SCALE = 1.12;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [introDone, setIntroDone] = useState(false);
  /** Flipped when the Intro's EXPANSION starts, not when the Intro finishes. */
  const [arriving, setArriving] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

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

  /* -----------------------------------------------------------------------
     THE EXPANSION — the hero's half of the hand-off.

     The Intro does not fade out and reveal a static hero. Its mark contracts to
     a single dot at dead centre, holds there for 60ms, and the site opens out
     of that dot: this runs from the same instant, for the same duration, as the
     navbar's slide, and the plate finishes dissolving before either of them is
     done. Two components that cannot see each other, one beat, held together by
     one shared constant and one shared origin.

     UNDER REDUCED MOTION THIS DOES NOT RUN AT ALL. `IntroGate` still fires the
     hand-off on that path, deliberately, so a consumer never has to ask "did
     the intro play" — but the correct arrival for someone who asked for less
     motion is to already be here.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (!arriving || reducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    const tween = gsap.fromTo(
      stage,
      { scale: ARRIVAL_SCALE, opacity: 0, transformOrigin: "50% 50%" },
      {
        scale: 1,
        opacity: 1,
        duration: ARRIVAL_S,
        // `power2.out`, NOT `GSAP_EASE.hero`, and the reasoning survived the
        // rewrite even though the move it applied to did not.
        //
        // MEASURED, NOT ASSUMED. The first cut used the shared hero curve, and
        // sampling the running timeline every 250ms showed the hero at scale
        // 1.005 and opacity 0.96 while the Intro's plate was still 74% opaque:
        // by the time anyone could SEE the arrival, it had already happened.
        // `GSAP_EASE.hero` is easeOutExpo — 80% of its travel is spent in the
        // first quarter of its duration, which is exactly right for something
        // arriving into a layout the visitor is already looking at, and exactly
        // wrong for a move that is revealed part-way through. The plate is
        // still ~60% opaque a third of the way in, so a quadratic is what keeps
        // the visible part of the expansion in front of the visitor.
        ease: "power2.out",
        // CLEARED, NOT LEFT AT scale(1). A transform on this wrapper — even an
        // identity one — puts everything inside it in a different coordinate
        // space from `sectionRef`. That mattered acutely when the void rect was
        // measured across that boundary; it still matters, because anything
        // added here later that reaches for a `getBoundingClientRect` would hit
        // the same window. Removing the property closes it rather than
        // leaving it open forever, which is cheaper than remembering the rule.
        //
        // `ParticleGrid` sizes itself from its own canvas's untransformed CSS
        // width and height and never reads a rect through this wrapper, which
        // is deliberate and should stay that way.
        onComplete: () => gsap.set(stage, { clearProps: "transform,opacity" }),
      },
    );

    return () => {
      tween.kill();
      gsap.set(stage, { clearProps: "transform,opacity" });
    };
  }, [arriving, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id={HERO_SECTION_ID}
      // 100dvh, not 100vh: the hero/About boundary is a hard colour edge, and a
      // URL-bar-induced overflow would put a visible sliver of the hero surface
      // under the fold on mobile.
      //
      // `bg-hero-surface` is a CSS background on this wrapper, so the hero is
      // legible before a single pixel of canvas or SVG has painted — and so the
      // arrival's opening frame, where the stage inside is at opacity 0, is the
      // hero's own ground rather than a hole through to the page.
      className="relative h-dvh w-full overflow-hidden bg-hero-surface"
    >
      <div ref={stageRef} className="absolute inset-0">
        {/* Layer 1 — the mesh AND the command sphere, on one canvas. Full-bleed,
            pointer-events-none; the pointer listener lives on this section,
            which is why the canvas must not intercept. It takes no props: the
            sphere it draws is the subject the permanent void is cut for, so
            both numbers live inside it. */}
        <ParticleGrid />

        {/* Layer 2 — the DOM text. `fallback` stays FALSE. It is tempting to
            flip it now that no wordmark renders — the fallback layout makes the
            <h1> visible — but it also moves this whole block from
            bottom-anchored to vertically centred, and the tagline's position is
            not this change's to move. The name is delivered by the Intro and
            carried by the navbar's mark; see this file's header. */}
        <HeroHeadline
          revealed={introDone}
          fallback={false}
          cueActive={inView && tabVisible}
        />
      </div>

      {/* Layer 4 — the entry gate: real loader, then the Intro. Fixed and above
          everything, rendered last so it wins the paint order even before
          z-index is consulted.

          `onHandoff` fires as the EXPANSION STARTS and `onDone` when the plate
          is gone; the gap between them is the overlap the expansion above
          depends on. Collapsing them into one callback would make the hand-off
          a cut again. */}
      {!introDone ? (
        <IntroGate
          onHandoff={() => setArriving(true)}
          onDone={() => setIntroDone(true)}
        />
      ) : null}
    </section>
  );
}

export default Hero;
