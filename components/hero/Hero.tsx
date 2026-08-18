"use client";

/**
 * Tier 1. The phase machine, the camera timeline, and all three WebGL failure
 * paths.
 *
 * TIER 1 DOES NOT MEAN "MANY THINGS MOVE." It means ONE expensive, well
 * executed move — the camera pull-back — against a field that was already
 * alive, plus quiet DOM motion on the Tier 1 curve. Four simultaneous entrance
 * animations is the anatomy of a template hero. If a fix makes this busier, it
 * is the wrong fix.
 *
 * OWNERSHIP, so there are never two clocks:
 *   GSAP        the WebGL camera, and nothing else
 *   Framer      all DOM (loader, headline, cue)
 *   React state the two handoffs between them
 * The camera and the headline never animate concurrently: the headline starts
 * when the camera FINISHES, via one `onComplete -> setPhase("settled")`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invalidate } from "@react-three/fiber";
import type { PerspectiveCamera as ThreePerspectiveCamera } from "three";
import { Vector3 } from "three";

import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroLoader } from "@/components/hero/HeroLoader";
import { HeroScene, type SceneMeasurements } from "@/components/hero/HeroScene";
import { SceneCanvas } from "@/components/hero/SceneCanvas";
import { DURATION } from "@/lib/animation/easing";
import { GSAP_EASE, gsap, ScrollTrigger } from "@/lib/animation/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useWebGLSupport } from "@/lib/hooks/useWebGLSupport";
import { bucketForViewport, restingPose, startPose } from "@/lib/three/heroCamera";
import { useTypefaceLoader } from "@/lib/three/useTypefaceLoader";

const TYPEFACE_URL = "/fonts/space-grotesk-caps.typeface.json";

type HeroPhase = "loading" | "revealing" | "settled";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
  const measurementsRef = useRef<SceneMeasurements | null>(null);

  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();

  const [revealComplete, setRevealComplete] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [sceneInitFailed, setSceneInitFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  const { font, progress, indeterminate, error } = useTypefaceLoader(TYPEFACE_URL);

  /**
   * All three failure paths converge here, and the state lives OUTSIDE the
   * canvas deliberately: the fallback must not depend on anything inside the
   * thing that failed.
   *
   * A typeface that fails to load is included — without glyphs there is no
   * wordmark, so the honest outcome is the same one.
   */
  const heroFallback =
    !webglSupported || contextLost || sceneInitFailed || !!error;

  // Bucketed ONCE at mount. A coarse bucket changes only on orientation, and
  // reallocating particle buffers mid-scroll is worse jank than it saves.
  const bucket = useMemo(
    () => bucketForViewport(typeof window === "undefined" ? 1440 : window.innerWidth),
    [],
  );

  const handleCamera = useCallback((camera: ThreePerspectiveCamera) => {
    cameraRef.current = camera;
  }, []);

  const handleReady = useCallback((measurements: SceneMeasurements) => {
    measurementsRef.current = measurements;
    setSceneReady(true);
  }, []);

  /* ---------------------------------------------------------------------
     Phase machine — DERIVED, not stored.

     Written as a computation rather than a chain of effects calling setState
     on purpose: the phase is a pure function of four booleans, and expressing
     it that way makes the illegal states unrepresentable instead of merely
     unreached. `revealComplete` is the only stored bit, and it is written from
     a GSAP callback rather than from an effect.

     Reduced motion skips "revealing" ENTIRELY rather than playing it fast —
     the camera is already at its resting pose, which is the one frame such a
     visitor will ever see.
  --------------------------------------------------------------------- */

  const phase: HeroPhase = heroFallback
    ? "settled"
    : !sceneReady
      ? "loading"
      : reducedMotion || revealComplete
        ? "settled"
        : "revealing";

  /* ---------------------------------------------------------------------
     The camera pull-back. GSAP, one move, position + look-at target only.
  --------------------------------------------------------------------- */

  useEffect(() => {
    if (phase !== "revealing") return;

    const camera = cameraRef.current;
    const measurements = measurementsRef.current;
    // Defensive only, and cannot strand the phase: `sceneReady` is set by
    // `handleReady`, which HeroScene calls in the same effect that has already
    // populated both refs. If that ordering ever changes, this returns without
    // animating rather than animating from a wrong pose.
    if (!camera || !measurements) return;

    const { center, stop, distance } = measurements;
    const from = startPose(center, stop, distance);
    const to = restingPose(center, stop, distance);

    // Snap to the start pose, then animate back to the default. Building it
    // this way round is what keeps the resting pose the CONSTRUCTED state.
    camera.position.copy(from.position);
    camera.lookAt(from.target);

    const position = from.position.clone();
    const target = from.target.clone();
    const scratch = new Vector3();

    // Tweening a plain proxy rather than the camera itself, because the look-at
    // target has to be interpolated alongside the position — a bare
    // `gsap.to(camera.position, ...)` cannot express that.
    //
    // NOTE for anyone reusing this: mutating `camera.position` only animates
    // because the hero runs `frameloop="always"`. On a "demand" canvas the
    // tween would run and nobody would re-render it. Position-only changes do
    // NOT need `updateProjectionMatrix()`; FOV changes would, which is one more
    // reason the reveal does not animate FOV.
    const proxy = { t: 0 };

    const tween = gsap.to(proxy, {
      t: 1,
      duration: DURATION.hero,
      ease: GSAP_EASE.hero,
      onUpdate: () => {
        position.lerpVectors(from.position, to.position, proxy.t);
        scratch.lerpVectors(from.target, to.target, proxy.t);
        target.copy(scratch);
        camera.position.copy(position);
        camera.lookAt(target);
      },
      onComplete: () => setRevealComplete(true),
    });

    return () => {
      tween.kill();
    };
  }, [phase]);

  /* ---------------------------------------------------------------------
     Frameloop policy.
  --------------------------------------------------------------------- */

  // The particle field drifts continuously, so without this a full rAF + GPU
  // loop runs for the rest of a seven-section page — the majority of the
  // session — for pixels nobody can see.
  const frameloop = inView && tabVisible ? "always" : "demand";

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
    // R3F does not do this for you.
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    // After switching always -> demand, paint once so the canvas holds a
    // correct final frame rather than a stale one.
    if (frameloop === "demand") invalidate();
  }, [frameloop]);

  /* ---------------------------------------------------------------------
     Failure path 2 — runtime context loss.
  --------------------------------------------------------------------- */

  const handleCreated = useCallback(
    (state: { gl: { domElement: HTMLCanvasElement } }) => {
      const canvas = state.gl.domElement;

      const onLost = () => setContextLost(true);
      canvas.addEventListener("webglcontextlost", onLost);
    },
    [],
  );

  /*
   * UNMOUNTING IS THE SOLE MECHANISM for staying in the fallback, and the
   * causal chain matters because it is easy to describe wrongly:
   *
   * three registers its OWN `webglcontextlost` handler at renderer construction
   * and calls `preventDefault()` unconditionally, so restoration is enabled no
   * matter what we do — our listener is attached later and runs after it. That
   * is fine, because setting `contextLost` unmounts <SceneCanvas>: the canvas
   * element leaves the DOM, three's `dispose()` removes its listeners, and
   * there is no live tree left to restore into. Do NOT attempt to beat three to
   * the event with capture-phase tricks; the outcome is already achieved.
   *
   * Unmounting is also the right response on its own terms: on iOS the loss is
   * CAUSED by memory pressure, so releasing the context and its buffers is
   * correct, and immediately reallocating what was just reclaimed invites a
   * loss loop. We therefore stay in the fallback for the rest of the session
   * rather than rebuilding — replaying loader -> pull-back -> stagger after the
   * user has already read the page would look like a bug.
   */

  /* ---------------------------------------------------------------------
     Failure path 3 — the unhandled rejection from renderer construction.
  --------------------------------------------------------------------- */

  useEffect(() => {
    // Scoped to the few hundred milliseconds where this failure is reachable.
    if (phase !== "loading" || !webglSupported || heroFallback) return;

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      // Filtered deliberately: three's own throw text contains "WebGL".
      // Swallowing unrelated rejections would be worse than the bug being
      // fixed, and `preventDefault()` is NOT called — the error should still
      // reach the console for whoever is debugging.
      if (reason instanceof Error && /webgl/i.test(reason.message)) {
        setSceneInitFailed(true);
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, [phase, webglSupported, heroFallback]);

  const showCanvas = !heroFallback && !!font;
  const showLoader = !heroFallback && phase === "loading";

  return (
    <section
      ref={sectionRef}
      // 100dvh, not 100vh: the hero/About boundary is a hard colour edge, and a
      // URL-bar-induced overflow would put a visible sliver of the hero surface
      // under the fold on mobile.
      //
      // bg-hero-surface is a CSS background on this wrapper and is therefore
      // entirely independent of WebGL — it is present in EVERY path, including
      // the fallback where no canvas renders at all. That is what makes the
      // fallback legible, and why its text uses hero-fg rather than fg.
      className="relative h-dvh w-full overflow-hidden bg-hero-surface"
    >
      {showCanvas ? (
        <SceneCanvas
          frameloop={frameloop}
          className="absolute inset-0"
          onCreated={handleCreated}
          // Scene-graph fallback only (null): the DOM-level fallback is driven
          // by onSceneError below, which unmounts this entirely.
          sceneErrorFallback={null}
          onSceneError={() => setSceneInitFailed(true)}
        >
          <HeroScene
            font={font}
            bucket={bucket}
            onReady={handleReady}
            onCamera={handleCamera}
            applyRestingPose={phase !== "revealing"}
          />
        </SceneCanvas>
      ) : null}

      {showLoader ? (
        <HeroLoader
          // The last 15% is the scene-ready milestone: geometry built and
          // shaders compiled. Both boundaries are real events.
          progress={sceneReady ? 1 : progress}
          indeterminate={indeterminate}
          visible={phase === "loading"}
        />
      ) : null}

      <HeroHeadline
        revealed={phase === "settled"}
        fallback={heroFallback}
        cueActive={inView && tabVisible}
      />
    </section>
  );
}

export default Hero;
