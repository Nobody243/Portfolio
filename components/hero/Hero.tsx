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
 *   - There is no camera in the scene, AND AS OF 2026-08-22 THERE IS NO
 *     CAMERA IN THE INTRO EITHER. The one move on this surface is the ARRIVAL
 *     below, and it is not the hero's own: it is the second half of the Intro's
 *     handoff, continued on this side of the seam. The Intro's plate now
 *     dissolves in place over 0.55s while this settles out of `ARRIVAL_SCALE`
 *     behind it. (This said "the Intro's camera accelerates THROUGH the mark's
 *     anchor pixel and this settles in behind it, out of that same pixel" until
 *     the ×17 zoom-in was retired — preserved on `intro-zoom-in-backup` — and
 *     before that "the Intro contracts its mark to a point and this opens out
 *     of that point", the merge-to-a-point sequence reverted in `1145a00`.
 *     Three accounts of one seam; only the first line above is current.)
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
 * THERE IS NO THEME TOGGLE IN THIS FILE, BUT THERE IS ONE OVER IT. It used to
 * be this surface's single instance, anchored to the top-right inset of the
 * shared container — which is the exact rectangle the fixed navbar now
 * occupies, and the two cannot both have it. It moved INTO the bar
 * (`Navbar.tsx`, `THEME_TOGGLE_IN_NAV`, `hidden md:block`), with
 * `NavMobileMenu` carrying it below `md`.
 *
 * THE SECOND HALF OF THIS PARAGRAPH WAS BACKWARDS UNTIL 2026-08-22. It said
 * "the navbar spec removes the toggle from the desktop chrome deliberately,
 * and it survives in the mobile menu and on every Tier 3 surface" — which was
 * the pre-Phase-0 decision, reversed by `docs/07` §1 and recorded in
 * `docs/06_INTRO_AND_CHROME.md` §5. The reversal's cause was concrete: with
 * the bar holding this rectangle but not the control, a desktop visitor on `/`
 * had no way to switch themes at all. Read §5 before moving it again; both
 * placements have been shipped and only one of them has a stated cost.
 */

import { useEffect, useRef, useState } from "react";

import { HERO_SECTION_ID } from "@/components/hero/heroContent";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { ParticleGrid } from "@/components/hero/ParticleGrid";
import { useIntroHandoff } from "@/components/intro/IntroContext";
import { ScrollTrigger, gsap } from "@/lib/animation/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * THE ARRIVAL — 1.30s, DELIBERATELY LONGER than the navbar's 0.45s slide and
 * than the Intro's 0.55s dissolve.
 *
 * THE RULE, unchanged: the incoming half of a handoff must OUTLAST the outgoing
 * one, or the seam becomes a cut. What changed on 2026-08-22 is the outgoing
 * half. The Intro's phase 7 was a ×17 camera over `ZOOM_IN_S` 0.95s and is now
 * `DISSOLVE_S` 0.55s on every route, so this value is re-derived rather than
 * kept: 1.30 / 0.55 is **2.36x**, where 1.60 / 0.95 was 1.68x. The rule is
 * honoured with a 40% wider margin than it had.
 *
 * BUT THE RATIO IS NOT THE INVARIANT, AND THAT IS THE WHOLE DERIVATION. The
 * test this repo actually uses is HOW MUCH OF THE INCOMING MOVE REMAINS AT THE
 * FRAME THE PLATE CROSSES 50% OPACITY. `power2.in` is CUBIC, so the plate is
 * half gone at `∛0.5 × 0.55` = **0.4365s** (the same figure `Intro.tsx`
 * derives). The arrival's own `power2.out` is `1 − (1 − τ/A)³`:
 *
 *   configuration                      plate-50%   arrival complete   remaining
 *   ---------------------------------  ----------  -----------------  ---------
 *   the retired 0.95s camera, A = 1.60   0.5425s        71.1%           28.9%
 *   the 0.55s fade, A left at 1.60       0.4365s        61.5%           38.5%
 *   the 0.55s fade, A = 1.30  ← THIS     0.4365s        70.7%           29.3%
 *   the 0.55s fade, A = 0.95             0.4365s        84.8%           15.2%
 *
 * Solving for today's 71.1% gives A = 1.287s. **1.30s reproduces the shipped
 * seam to within 0.4 percentage points.**
 *
 * AND IT CUTS THE TAIL, which is the half of the question the ratio hides. The
 * plate is fully gone at 0.550s rather than 0.950s, so at A = 1.60 the hero
 * would still have **1.05s** of visible settling left with nothing covering it
 * (against 0.65s before) and would sit **3.4% over-scale** at that frame — at
 * 1440 a point 700px from centre is 23.7px out of place, drifting home at
 * ~23px/s. That is visible. At 1.30s the tail is 0.75s and the residual scale
 * is 1.0077.
 *
 * **0.926s IS THE NUMBER SOMEONE WILL PROPOSE** — 1.6 × 0.55/0.95, holding the
 * ratio. It is recorded here so it can be refused with the arithmetic: it puts
 * 84.8% of the arrival behind an opaque plate, which is the "animates in
 * secret" failure the whole arrangement exists to repair.
 *
 * THIS BLOCK ARGUED FOR 0.45s AND FOR NO CAMERA UNTIL 2026-08-22 (the earlier
 * one), AND THE ARGUMENT WAS A LANDMINE. That text was true of the
 * merge-to-a-point Intro, which was built, found broken and reverted in
 * `1145a00`; the camera came back and the comment did not, so the file carried
 * two adjacent constants with contradictory justifications for one decision.
 * The camera has now gone again — but this is NOT a return to that state and
 * must not be edited back toward it: the seam is still one incoming move
 * outlasting one outgoing one, and 0.45s would break the plate-50% test in the
 * other direction.
 *
 * IT IS NOT IMPORTED FROM `handoff.ts` AND MUST NOT BE. That module records the
 * same fact from its side: what the three components share is the START
 * INSTANT, not the duration. The navbar slides in 0.45s, the hero settles over
 * 1.30s, and both begin on the same frame.
 */
const ARRIVAL_S = 1.3;
/**
 * IT SETTLES OUT OF AN OVER-SCALE. IT DOES NOT GROW FROM A POINT, AND IT IS NOT
 * A CROSSFADE.
 *
 * 1.12 → 1.04 on 2026-08-22, and the number lost its old justification outright
 * rather than being retuned by taste. That justification was: *"a camera moving
 * forward hands off to a surface that is slightly too close and eases back to
 * rest; that continuity is the whole illusion."* **There is no camera.** The
 * Intro's phase 7 now fades the plate in place at `ZOOM_OUT_SCALE`, so 12% was
 * an unexplained scale on a surface nothing is moving toward.
 *
 * TWO INDEPENDENT ARGUMENTS PUT IT AT 1.04, and they agree, which is why it is
 * 1.04 and not something between.
 *
 *   1. THE SITE'S TRAVEL BUDGET. `Intro.tsx` used to reject a scale arrival off
 *      Home in these words — *"12% IS SIX AND A HALF TIMES THE SITE'S TRAVEL
 *      BUDGET"* — because the timed reveal travels 13px and the scrub caps at
 *      21px. That block was scoped to routes whose page stack is content, and
 *      Home is a Tier 1 spectacle surface where the budget does not bind. But
 *      its PREMISE — that 12% was sized against a ×17 camera — now applies here
 *      too. At 1440, initial displacement is `d × (S − 1)`:
 *
 *        element                          d      S = 1.12    S = 1.04
 *        -------------------------------  -----  ----------  ---------
 *        viewport corner                  849px   101.9px      34.0px
 *        tagline leading edge (89px in)   631px    75.7px      25.2px
 *        the sphere's right rim          ~446px    53.5px      17.8px
 *
 *      25.2px at the tagline lands in the same amplitude family as the rest of
 *      the site instead of six times outside it — while REMAINING A SCALE,
 *      which is what keeps it a Tier 1 gesture rather than a `Reveal`.
 *
 *   2. THE TAGLINE REVEALS INSIDE THIS TWEEN'S TAIL, and the camera used to
 *      hide that. `introDone` fires on the Intro's `onComplete`, which is now
 *      0.550s after the hand-off rather than 0.950s. `HeroHeadline`'s tagline
 *      mask runs 0.70s + a 0.10s stagger from there, i.e. ENTIRELY inside this
 *      arrival's tail, on a stage that is still scaling. At `ARRIVAL_S 1.30`
 *      the arrival is 80.8% done at 0.550s, so the residual is 19.2%:
 *
 *        1.12 → residual scale 1.0230 → **14.5px** of sideways creep under a
 *               running mask reveal. Two moves on one element; it reads as a
 *               wobble.
 *        1.04 → residual scale 1.0077 → **4.85px**. Sub-perceptual.
 *
 *      >> ARGUMENT 2's PREMISE IS RETIRED AS OF THE TAGLINE BEAT, AND THE
 *      >> NUMBER IS NOT. The tagline no longer reveals inside this tween's
 *      >> tail: `TAGLINE_BEAT_S` moves it to 2.6s, where the arrival ended
 *      >> 1.3s earlier and the residual scale is exactly 1. There is no
 *      >> sideways creep under a running reveal any more, at 1.04 or at 1.12,
 *      >> so this argument neither supports nor opposes the value.
 *      >>
 *      >> ARGUMENT 1 IS UNTOUCHED AND STILL DECIDES IT — 25.2px of initial
 *      >> displacement at the tagline's leading edge against the site's 13px
 *      >> timed / 21px scrubbed travel budget. 1.04 stands on it alone. The
 *      >> arithmetic above is kept rather than deleted because it is the
 *      >> record of what the seam looked like when the two moves overlapped,
 *      >> and anything that moves the tagline back onto `introDone` makes it
 *      >> live again. `docs/06` and `docs/07` §3 carried the same claim and
 *      >> carry the same retraction.
 *
 * WHAT IS REJECTED, AND WHY IT IS WRITTEN DOWN: `ARRIVAL_SCALE = 1.0`. It makes
 * the arrival opacity-only, i.e. the plate fades out while the hero fades in —
 * **a crossfade is a cut with extra steps**, which is precisely what
 * `lib/animation/handoff.ts` exists to prevent. It would also leave
 * `power2.out`'s measured justification below with no move to shape. If the
 * entry ever reads as flat, the lever is this constant UPWARD (1.04 → 1.06),
 * never a new element, a new phase or a second fade.
 *
 * THE `50% 50%` ORIGIN IS NOW A SIMPLIFICATION, NOT A COUPLING — and the
 * difference matters enough to record. This block used to pin an identity
 * between the Intro's anchor pixel `(296, 288)`, its `50% 90%` camera origin
 * and this `50% 50%`, and warned that it "would break silently if the hero ever
 * stopped being full-viewport at scroll 0". With no camera there is no fixed
 * point to align to, so `50% 50%` means only "the hero settles about its own
 * centre" — true at any scroll position and on any section height. THE
 * FRAGILITY IS GONE. Do not preserve the old constraint for nothing.
 *
 * (`scale: 0` over 0.45s was correct for the merge-to-point Intro, where the
 * mark contracted to a dot and the hero genuinely bloomed out of that pixel.
 * That sequence was reverted in `1145a00`. Growing from a dot reads as a
 * separate event that happens to begin where the last one ended, and the
 * retirement of the camera is not a reason to go back to it.)
 */
const ARRIVAL_SCALE = 1.04;

/**
 * THE TAGLINE'S BEAT — 2.6s after `arriving`, which is 2.05s after `introDone`.
 *
 * The tagline used to reveal on `introDone`, i.e. at 0.55s, and it was the
 * FOURTH thing moving at that instant. Everything else on this seam starts on
 * the same frame by design, and the identity statement was quietly conscripted
 * into that pile-up:
 *
 *   from `arriving`   what is moving                       ends
 *   ----------------  -----------------------------------  --------
 *   0.00 → 0.45       the navbar slides down (`HANDOFF_S`)  0.45s
 *   0.00 → 0.55       the Intro's plate dissolves           0.55s
 *   0.00 → 1.30       this section settles (`ARRIVAL_S`)    1.30s
 *   0.00 → 3.20       the sphere's burst (`SPHERE_BURST_MS`) 3.20s
 *   0.55 → 1.35       ← THE TAGLINE, in the middle of all of it
 *
 * Saad's ticket: "land it slightly after those finish, so it reads as its own
 * distinct beat rather than one more thing happening simultaneously in an
 * already-busy moment."
 *
 * 2.6 IS THE BURST, NOT A ROUND NUMBER. The burst is the last of the four to
 * end and the only one whose nominal duration overstates how long it is
 * VISIBLE: `commandSphere.ts` decays it as `1 + (RATE − 1)·(1 − t/T)²`, so with
 * RATE 4 and T 3.2s the rotation is
 *
 *   t = 1.30s → 2.06×    t = 2.00s → 1.42×    t = 2.40s → 1.19×
 *   t = 2.60s → 1.11×    t = 2.79s → 1.05×    t = 3.20s → 1.00×
 *
 * Solving `3(1 − t/3.2)² = 0.10` gives **t = 2.616s**: the frame the sphere
 * comes within a tenth of its idle rate, which is where a burst stops reading
 * as a burst. 2.6s is that number. Waiting for the arithmetic zero at 3.2s buys
 * a 1.1% speed difference for 0.6s more of a hero with no sentence on it.
 *
 * THE COST IS STATED RATHER THAN HIDDEN: the hero carries no visible text for
 * about two seconds after the plate goes. That is deliberate — the sphere is
 * the subject of this surface and the tagline is the annotation — but it is the
 * one thing to look at if the entry ever reads as slow. THE LEVER IS THIS
 * CONSTANT AND NOTHING ELSE. The natural shorter stop is **1.5s**, just past
 * `ARRIVAL_S`, which trades the burst overlap (still ~1.8× there) for a hero
 * that speaks a second sooner. Do not instead shorten `SPHERE_BURST_MS` — that
 * constant is the answer to a different ticket and carries its own measurement.
 *
 * IT DOES NOT APPLY WHEN THERE WAS NO HAND-OFF. `waitedForHandoff` gates it for
 * the same reason it gates the burst: on a client navigation to `/` there is no
 * plate, no burst and no arrival to stay out of the way of, and
 * `IntroProvider`'s header records that seeding the phase from a synchronous
 * read is what reveals the headline in FRAME 1 on that path. A timer here would
 * throw that away, so the instant case is DERIVED rather than timed — see
 * `taglineBeat` below.
 */
const TAGLINE_BEAT_S = 2.6;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  /*
    A PURE CONSUMER NOW. `arriving` and `introDone` used to be local state fed
    by `IntroGate`'s two callbacks, which only worked while this component was
    the thing that mounted the gate. Nothing else about the arrival changed:
    same tween, same `ARRIVAL_S`, same `ARRIVAL_SCALE`, same `50% 50%` origin,
    same `revealed` prop.
  */
  const { arriving, introDone } = useIntroHandoff();
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  /*
    WAS THIS PAGE ACTUALLY WAITING FOR A HAND-OFF? Captured once, in a lazy
    initialiser, exactly as `IntroEntrance.tsx` does and for the identical
    reason: `IntroProvider` seeds `arriving` TRUE on a client navigation, so
    "burst when `arriving` is true" would fire on every arrival at `/` from the
    navbar, where there is no Intro and nothing to arrive out of. Only a Hero
    that mounted UNDER a plate gets the burst.

    It is a separate capture from the arrival tween below, which deliberately
    still runs on a client navigation — the stage settling in is the page
    appearing, and that happens either way. What does not happen either way is
    the Intro handing off, and that is what the sphere is answering.
  */
  const [waitedForHandoff] = useState(() => !arriving);

  /*
    THE REQUEST, AS A COUNTER IN A REF. `ParticleGrid`'s prop docblock has the
    two reasons — a value here would rebuild the canvas on the hand-off frame,
    and a boolean cannot express an event. Incremented from the arrival effect
    so the burst and the scale-in are armed by the same code on the same frame,
    rather than by two things that agree until one of them is retuned.
  */
  const arrivalBurst = useRef(0);

  /*
    THE TAGLINE'S BEAT. `TAGLINE_BEAT_S` carries the derivation; this is only
    the wiring, and its shape is load-bearing in two places.

    IT IS DERIVED WHEN THE DELAY IS ZERO, TIMED ONLY WHEN IT IS NOT. Writing
    `setTimeout(..., 0)` for the instant cases would cost a macrotask and hand
    back the frame-1 reveal that `IntroProvider` went out of its way to buy on
    the client-navigation path. Reading `introDone` directly costs nothing and
    is exactly right: where there is no hand-off to wait out, the beat IS the
    hand-off.

    REDUCED MOTION TAKES THE INSTANT PATH TOO, and it is not a special case —
    it is the same statement. There is no arrival tween, no burst and no
    scramble on that path, so there is nothing for the tagline to stand clear
    of. `EncryptedText` reads the preference itself and renders the finished
    string, so this only decides WHEN the line appears, never how.

    The flag is live, so a visitor who turns the preference on mid-delay falls
    back to `introDone` — already true by then — and the tagline appears at
    once rather than finishing a countdown for an effect that will not play.
  */
  const beatIsInstant = reducedMotion || !waitedForHandoff;
  const [beatTimerFired, setBeatTimerFired] = useState(false);
  const taglineBeat = beatIsInstant ? introDone : beatTimerFired;

  useEffect(() => {
    if (!arriving || beatIsInstant) return;
    const timer = window.setTimeout(
      () => setBeatTimerFired(true),
      TAGLINE_BEAT_S * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [arriving, beatIsInstant]);

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

     The Intro does not finish and then reveal a static hero. Its plate begins
     dissolving on the same frame this begins settling, and it is fully gone at
     0.550s while this is still running for another 0.750s: this runs from the
     SAME INSTANT as the navbar's slide — not for the same duration — and the
     plate finishes dissolving before the arrival is done. Two components that
     cannot see each other, one beat, held together by one shared start.

     "AND BY ONE SHARED ORIGIN" WAS THE OTHER HALF OF THAT SENTENCE UNTIL
     2026-08-22, and it is deleted rather than kept: the Intro's `50% 90%` and
     this `50% 50%` used to have to agree because a camera was flying through
     the pixel where they met. With the camera retired they are two independent
     pivots on two independent elements. See `ARRIVAL_SCALE`.

     THIS PARAGRAPH DESCRIBED THE REVERTED MERGE-TO-A-POINT INTRO BEFORE THAT.
     It said the mark "contracts to a single dot at dead centre, holds there for
     60ms", and that this runs "for the same duration as the navbar's slide".
     That sequence and its 60ms hold were reverted in `1145a00`; `ARRIVAL_S`'s
     own docblock above already said the opposite in capitals, including that
     the value is NOT imported from `handoff.ts`. One file, two contradictory
     accounts of the same beat — which is exactly the trap `ARRIVAL_S` was
     rewritten to close, and the reason this block is rewritten now rather than
     patched.

     UNDER REDUCED MOTION THIS DOES NOT RUN AT ALL. `IntroGate` still fires the
     hand-off on that path, deliberately, so a consumer never has to ask "did
     the intro play" — but the correct arrival for someone who asked for less
     motion is to already be here.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (!arriving || reducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    /* THE SPHERE'S HALF OF THE SAME BEAT. `lib/hero/commandSphere.ts`'s
       `SPHERE_BURST_RATE` carries the values (2.5x, easing to idle over 1.6s)
       and the derivation; this line only says WHEN. Guarded by
       `waitedForHandoff` so a client navigation to `/` — where `arriving` is
       seeded true and no plate ever existed — does not fire it, and inside the
       `reducedMotion` early return above so a visitor who asked for less motion
       gets neither the scale-in nor the burst. */
    if (waitedForHandoff) arrivalBurst.current += 1;

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
  }, [arriving, reducedMotion, waitedForHandoff]);

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
            which is why the canvas must not intercept.

            IT TOOK NO PROPS UNTIL 2026-08-22, and the reason it took none is
            unchanged: the sphere it draws is the subject the permanent void is
            cut for, so both numbers still live inside it. What it takes now is
            not a number — it is the hand-off, as a ref-held counter, because
            the sphere has to arrive on the same frame the stage above it does
            and nothing inside that canvas can see the Intro. Everything about
            WHAT is drawn is still decided in there. */}
        <ParticleGrid arrivalBurst={arrivalBurst} />

        {/* Layer 2 — the DOM text. `fallback` stays FALSE. It is tempting to
            flip it now that no wordmark renders — the fallback layout makes the
            <h1> visible — but it also moves this whole block from
            bottom-anchored to vertically centred, and the tagline's position is
            not this change's to move. The name is delivered by the Intro and
            carried by the navbar's mark; see this file's header. */}
        <HeroHeadline
          revealed={introDone}
          taglineBeat={taglineBeat}
          fallback={false}
          heroActive={inView && tabVisible}
        />
      </div>

      {/* LAYER 4 IS NOT IN HERE ANY MORE. The entry gate — real loader, then the
          Intro — used to be the last child of this section, and its two
          callbacks were this component's two `useState` setters. It is now
          rendered by `IntroProvider` in `app/(site)/(chrome)/layout.tsx` —
          one level above every page in the group, so it is no longer any page's
          child — and reaches this file through `useIntroHandoff()`. This
          section is a CONSUMER of the hand-off now, not its owner.

          The gap between `arriving` and `introDone` is unchanged and is still
          the overlap the arrival above depends on: `arriving` flips as PHASE 7
          STARTS — the frame the plate begins dissolving, while it is still
          fully opaque — and `introDone` when the plate is gone. It read "as the
          zoom-in STARTS" until 2026-08-22; the instant is the same one, the
          tween carrying it is not. Collapsing the two values into one would
          make the hand-off a cut again. */}
    </section>
  );
}

export default Hero;
