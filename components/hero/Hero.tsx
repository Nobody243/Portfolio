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
 *     the ARRIVAL below, and it is not the hero's own: it is the second half of
 *     the Intro's zoom-in, continued on this side of the hand-off.
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
 * The arrival. Must be LONGER than the Intro's zoom-in (0.95s) — the incoming
 * half of a hand-off that finishes first turns the seam back into a cut.
 */
const ARRIVAL_S = 1.6;
/**
 * Where the hero starts. It is the far end of the Intro's zoom: the mark flies
 * past the viewport while this is still slightly too big and slightly too
 * transparent, and the two moves overlap for their whole duration.
 */
const ARRIVAL_SCALE = 1.12;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [introDone, setIntroDone] = useState(false);
  /** Flipped by the Intro's zoom-in, not by its completion. */
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
     THE ARRIVAL — the hero's half of the hand-off.

     The Intro does not fade out and reveal a static hero; the hero is already
     moving when the plate dissolves. The mark accelerates OUT through the
     viewport (`power2.in`) while this decelerates INTO place, and the overlap
     is what makes one continuous camera move out of two components that cannot
     see each other. Sampled on the running timeline: at the moment the plate is
     38% opaque the hero is still at scale 1.032 and opacity 0.73, and the last
     of the settle happens after the plate has gone entirely.

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
      { scale: ARRIVAL_SCALE, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: ARRIVAL_S,
        // `power2.out`, NOT `GSAP_EASE.hero`, and this is the mirror of the
        // exception the Intro's zoom-in makes — the two are the same decision
        // seen from opposite ends.
        //
        // MEASURED, NOT ASSUMED. The first cut used the shared hero curve, and
        // sampling the running timeline every 250ms showed the hero at scale
        // 1.005 and opacity 0.96 while the Intro's plate was still 74% opaque:
        // by the time anyone could SEE the arrival, it had already happened.
        // `GSAP_EASE.hero` is easeOutExpo — 80% of its travel is spent in the
        // first quarter of its duration, which is exactly right for something
        // arriving into a layout the visitor is already looking at, and exactly
        // wrong for the far half of a camera move that is revealed part-way
        // through. A gentler quadratic keeps the last third of the settle
        // happening in front of the visitor instead of behind a plate.
        ease: "power2.out",
        // CLEARED, NOT LEFT AT scale(1). A transform on this wrapper — even an
        // identity one — puts everything inside it in a different coordinate
        // space from `sectionRef`. That mattered acutely when the void rect was
        // measured across that boundary; it still matters, because anything
        // added here later that reaches for a `getBoundingClientRect` would hit
        // the same 1.6s window. Removing the property closes it rather than
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

          `onHandoff` fires as the zoom-in STARTS and `onDone` when the plate is
          gone; the gap between them is the overlap the arrival above depends
          on. Collapsing them into one callback would make the hand-off a cut
          again. */}
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
