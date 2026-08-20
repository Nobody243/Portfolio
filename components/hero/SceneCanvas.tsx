"use client";

import { Suspense, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * Presentation-agnostic <Canvas> wrapper — the project's single WebGL entry
 * point. It owns the boring-but-load-bearing defaults (DPR clamp, GL context
 * flags, frameloop policy, reduced-motion guard, suspense boundary) and nothing
 * about what is drawn.
 *
 * Ticket 3 composes the hero by passing scene children in, and MAY need to edit
 * this file — a real camera configuration (`camera={{ ... }}` or a manual
 * `<PerspectiveCamera>` for the pull-back) and post-processing for the
 * `--accent-hero` bloom both plausibly belong here rather than in the hero
 * component. Keep any such addition presentation-agnostic or make it a prop;
 * what does not belong here is hero-specific geometry, materials, or timing.
 *
 * SSR / client boundary
 *   `"use client"` alone is sufficient — verified, not assumed. R3F's Canvas
 *   renders a fixed `div > div > canvas` tree and pushes `children` into the
 *   three reconciler from a layout effect, so during prerender the scene graph
 *   never executes and the emitted HTML is identical on both sides. There is
 *   therefore no hydration mismatch and no reason to pay for
 *   `next/dynamic({ ssr: false })`, which would only delay the canvas behind an
 *   extra client-side chunk round-trip. If a future scene child touches
 *   `window`/`document` OUTSIDE the R3F tree, revisit this — not before.
 *
 * Sizing / resize
 *   R3F's Canvas hard-codes `width: 100%; height: 100%` on its wrapper and
 *   tracks the element with react-use-measure's ResizeObserver, resizing the
 *   drawing buffer and updating camera aspect itself. Nothing is hand-rolled
 *   here on purpose. The consequence: THE PARENT MUST HAVE A REAL HEIGHT. A
 *   zero-height parent means a 0x0 measurement, and R3F skips creating the root
 *   entirely — the classic "blank canvas, no errors" failure.
 */

type SceneCanvasProps = {
  children: ReactNode;
  /**
   * Defaults to "demand": R3F draws once on mount and again only when something
   * calls `invalidate()` or the element resizes. A static scene has no business
   * burning a rAF loop and a GPU on every frame — that is battery, not fidelity.
   *
   * TICKET 3: the animated hero (camera pull-back, particles) needs
   * `frameloop="always"`, passed in from the hero component. Do not flip the
   * default here — Tier 2/3 canvases, if any ever exist, should stay on demand.
   */
  frameloop?: CanvasProps["frameloop"];
  /** Applied to R3F's wrapper div, which is what actually gets measured. */
  className?: string;
  /**
   * Rendered in place of the scene when a scene CHILD throws.
   *
   * MUST BE SCENE-GRAPH CONTENT OR `null` — never DOM. This boundary lives
   * INSIDE <Canvas>, so whatever it renders goes through the three reconciler;
   * a `<div>` here throws "div is not part of the THREE namespace" and turns
   * one broken mesh into a broken page. Defaults to `null`, which is almost
   * always what you want: an empty scene plus `onSceneError` below.
   *
   * The DOM-level fallback is the CALLER's job, driven by `onSceneError`.
   *
   * Kept as a prop rather than hard-coded UI so this file stays
   * presentation-agnostic: it is the project's single WebGL entry point, which
   * makes it the right home for the guard, but it must not know what a hero
   * looks like.
   *
   * NOTE what this does NOT cover: WebGL context-creation failure, which is an
   * unhandled promise rejection inside R3F's async setup rather than a
   * render-phase throw. Callers must probe with `useWebGLSupport()` and simply
   * not mount this component. See that hook for the verified reasoning.
   */
  sceneErrorFallback?: ReactNode;
  /**
   * Called when the boundary catches. This is the real escape hatch: the
   * caller flips its own state and stops rendering <SceneCanvas> entirely,
   * replacing it with a DOM fallback.
   */
  onSceneError?: (error: Error) => void;
  /**
   * R3F's own `onCreated`, forwarded. The caller needs `state.gl.domElement` to
   * attach a `webglcontextlost` listener — the runtime-loss path, which is
   * distinct from both creation failure and a throwing scene child.
   */
  onCreated?: CanvasProps["onCreated"];
};

export function SceneCanvas({
  children,
  frameloop = "demand",
  className,
  sceneErrorFallback = null,
  onSceneError,
  onCreated,
}: SceneCanvasProps) {
  // Server snapshot is `false` (see the hook). Safe here because the value only
  // changes a Canvas prop after hydration, never the emitted DOM.
  const reducedMotion = useReducedMotion();

  // Reduced motion wins over whatever the caller asked for. "demand" still
  // paints the scene once, so the user sees a static image rather than a hole
  // in the layout — the requirement is "must not animate", not "must not
  // render". Anything using `useFrame` must ALSO check this preference; the
  // frameloop only stops the render loop, it does not pause state changes.
  const effectiveFrameloop = reducedMotion ? "demand" : frameloop;

  return (
    <Canvas
      className={className}
      frameloop={effectiveFrameloop}
      onCreated={onCreated}
      // Clamped, NOT `window.devicePixelRatio`. R3F renders at min(dpr, 2) —
      // uncapped DPR on a 3x phone or a Retina display means ~9x the fragments
      // for a difference nobody can see, and is the single most common R3F
      // performance failure.
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        // Transparent framebuffer so the page background shows through and the
        // theme token stays authoritative. Without this the canvas paints its
        // own opaque clear color and fights `--color-base` on theme toggle.
        alpha: true,
        // REQUIRED, and not a default. three.js flipped WebGLRenderer's
        // `stencil` default to FALSE, so the context comes up with no stencil
        // buffer unless it is asked for — and every stencil op then silently
        // does nothing. `HeroName` writes a stencil ref and `LiquidBlob` tests
        // against it; without this the liquid renders unclipped over the whole
        // quad, which is exactly what it did when this line was missing. There
        // is no error and no warning, just an effect that ignores its mask.
        stencil: true,
      }}
      // Decorative by definition — WebGL output is invisible to assistive tech
      // anyway. Any meaning the scene carries must exist as real text in the
      // DOM alongside it (Ticket 3's headline), not be announced from here.
      aria-hidden
    >
      {/*
        Explicit boundary with a null fallback. R3F wraps children in its own
        Suspense whose fallback suspends the OUTER Canvas component, so a drei
        loader or any future asset load would otherwise tear down and remount
        the whole canvas — including the WebGL context. Catching it in here
        keeps the suspension inside the scene graph.
      */}
      <Suspense fallback={null}>
        <ErrorBoundary fallback={sceneErrorFallback} onError={onSceneError}>
          {children}
        </ErrorBoundary>
      </Suspense>
    </Canvas>
  );
}

export default SceneCanvas;
