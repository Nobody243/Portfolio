"use client";

/**
 * The LOADER — the functional one. It answers exactly one question: are the
 * assets the Intro and the Hero need actually ready yet?
 *
 * IT IS NOT THE INTRO, AND THE DISTINCTION IS THE WHOLE REASON THIS FILE
 * EXISTS. `Intro.tsx` is the branded, choreographed reveal with a scripted
 * timeline and known durations. This has no personality, no choreography and
 * no fixed duration. It resolves in 0ms on a warm cache and in whatever the
 * network takes on a cold one. See `docs/06_INTRO_AND_CHROME.md` §1.
 *
 * THE FAILURE MODE THIS FILE IS BUILT AGAINST: a "loader" that runs a
 * `setTimeout` for 2–3 seconds "so it feels intentional". A loader that pads
 * its duration or reports a number it did not measure is lying to the visitor
 * about their connection, and it is a bug, not a design decision. Everything
 * below is measured. `progress` is settled-tasks over total-tasks and nothing
 * else; there is no smoothing, no minimum, and no easing applied to the value.
 *
 * WHAT IS TRACKED, AND WHY IT IS SHORT. The tracked set is derived from what
 * the Intro and Hero genuinely block on, not from an ambition to track
 * everything:
 *
 *   - THE TWO WEBFONTS. Both surfaces are typographic. The Intro's opening
 *     beat measures "Muhammad Saad" at runtime and FLIPs the two initials by
 *     the measured delta; run that against fallback metrics and the letters
 *     slide to the wrong place, then jump when the real face lands.
 *
 *     THIS CLAUSE USED TO CITE A SECOND REASON — "the hero wordmark has the
 *     same exposure, `SaadGlass` re-measures on `fonts.ready`". `SaadGlass`
 *     was deleted with the R3F hero; there is no wordmark and no WebGL. It was
 *     written in the present tense about a component that no longer exists,
 *     and it was one of only two stated justifications for tracking the fonts
 *     at all — so it read as though half the reason had survived when none of
 *     it had.
 *
 *     THE REMAINING REASON IS STILL TRUE, AND HAS A KNOWN EXPIRY. The Intro
 *     measures the name at runtime today, so the gate is load-bearing today.
 *     Phase 1 replaces that measurement with pre-extracted outline data from
 *     `public/fonts/space-grotesk-latin.typeface.json`, after which the INTRO
 *     no longer needs the face — but the gate still does, because the hero
 *     tagline and the navbar are above the fold and set in these two families.
 *     Re-read this comment when Phase 1 lands; do not let the Intro's release
 *     be mistaken for the Loader's.
 *   - NOTHING ELSE, TODAY, AND THAT IS A FINDING RATHER THAN AN OMISSION. The
 *     hero is Canvas2D plus SVG since the R3F scene was removed: no GLTF, no
 *     textures, no WASM, and no `<img>` above the fold. The project cover
 *     images are below the fold and are `next/image`'s problem, not the
 *     Intro's — blocking the entry animation on them would be the mirror
 *     mistake to padding the timer.
 *
 * ADD TO `assetTasks()` WHEN THAT CHANGES. It is one function returning an
 * array of promises, and `progress` is derived from its length, so a new asset
 * is one push and the progress readout stays correct with no other edit.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Below this, no progress UI is ever painted.
 *
 * NOT A DELAY — the loader still resolves the instant the assets do, and
 * nothing downstream waits for this window to elapse. It only decides whether
 * a bar is allowed to APPEAR. A cached repeat visit settles in single-digit
 * milliseconds, and a progress bar that exists for 40ms is a flash: strictly
 * worse than no bar at all, and precisely the "don't force users to rewatch a
 * progress bar for assets already in memory" case in the spec.
 */
const GRACE_MS = 150;

/**
 * The stall guard. If the tracked promises have not settled by here, give up
 * waiting and hand off anyway.
 *
 * THIS IS NOT THE PADDING THE HEADER WARNS ABOUT, and the direction is what
 * separates them. Padding makes a fast load SLOWER so the loader gets screen
 * time. This makes a broken load FINISH so the visitor is not trapped behind a
 * plate by a font CDN that never answers. It can only ever shorten the wait.
 *
 * `document.fonts.ready` in particular has no timeout of its own, and a
 * `font-display: swap` face that never arrives leaves it pending indefinitely.
 * The page is entirely usable with fallback metrics; it is not usable behind a
 * plate that never lifts.
 */
const STALL_MS = 8000;

/** The next/font CSS variables, in the order they are declared on `<html>`. */
const FONT_VARS = ["--font-space-grotesk", "--font-jetbrains-mono"] as const;

/**
 * Kick off every load the Intro and Hero block on, and return one promise per
 * unit of progress.
 *
 * `document.fonts.ready` ALONE IS NOT ENOUGH, and this is the subtle part.
 * `ready` resolves once the font loading system is idle — which, for a face
 * nothing has requested yet, means immediately. next/font emits `@font-face`
 * rules with `font-display: swap`; the browser does not fetch a face until
 * some element actually needs it, and at the moment this runs the Intro plate
 * has not painted its text. So `ready` can resolve true against a font that
 * has not been downloaded. `fonts.load(...)` is what REQUESTS the face; `ready`
 * afterwards is what waits for the whole system to settle.
 *
 * The family value is READ FROM THE CUSTOM PROPERTY rather than written here.
 * next/font generates a hashed family name at build time (`__Space_Grotesk_…`)
 * and it changes whenever the font config does. A literal would be wrong on
 * the next build, and — because every call below is caught — it would be wrong
 * SILENTLY, reporting a load that never happened.
 */
function assetTasks(): Promise<unknown>[] {
  const fonts = document.fonts;
  // Every engine the site targets ships the CSS Font Loading API, but a
  // missing one must degrade to "ready", never to "wait forever".
  if (!fonts) return [Promise.resolve()];

  const styles = getComputedStyle(document.documentElement);
  const tasks: Promise<unknown>[] = [];

  for (const cssVar of FONT_VARS) {
    const family = styles.getPropertyValue(cssVar).trim();
    if (!family) continue;
    // Two weights, because both are used above the fold: 500 is the Intro's
    // name and the hero wordmark, 400 is the tagline and the mono labels.
    // `fonts.load` rejects on an unparseable shorthand rather than throwing,
    // hence the catch on each — a font that fails to load must not deadlock
    // the gate, it must simply stop being waited on.
    tasks.push(fonts.load(`500 1rem ${family}`).catch(() => {}));
    tasks.push(fonts.load(`400 1rem ${family}`).catch(() => {}));
  }

  tasks.push(fonts.ready.catch(() => {}));
  return tasks;
}

type AssetLoaderProps = {
  /**
   * Fired exactly once, the moment everything tracked has settled (or the
   * stall guard fires). Nothing downstream — the Intro, the hero canvas, any
   * GSAP timeline — may start before this.
   */
  onReady: () => void;
};

export function AssetLoader({ onReady }: AssetLoaderProps) {
  /** 0..1, measured. Never interpolated, never floored. */
  const [progress, setProgress] = useState(0);
  /** Flips only if the grace window elapses with work still outstanding. */
  const [visible, setVisible] = useState(false);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  /* -----------------------------------------------------------------------
     One effect, one run.

     EVERY `setState` BELOW IS INSIDE AN ASYNC CALLBACK — a promise `.then`, or
     a timer — never in the effect body. Next 16's
     `react-hooks/set-state-in-effect` rule hard-errors on the synchronous
     shape, and it is right to: that is a cascading render. Deferred writes in
     response to real events are the shape this rule exists to leave alone.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    let settled = 0;
    let done = false;

    const finish = () => {
      if (done || cancelled) return;
      done = true;
      onReadyRef.current();
    };

    const tasks = assetTasks();
    const total = tasks.length || 1;

    for (const task of tasks) {
      task.then(() => {
        if (cancelled) return;
        settled += 1;
        setProgress(settled / total);
        if (settled >= total) finish();
      });
    }

    // Nothing to wait on at all (no Font Loading API, no declared families):
    // resolve on the microtask queue rather than pretending to load.
    if (tasks.length === 0) Promise.resolve().then(finish);

    const graceTimer = window.setTimeout(() => {
      if (cancelled || done) return;
      setVisible(true);
    }, GRACE_MS);

    const stallTimer = window.setTimeout(() => {
      if (cancelled || done) return;
      // Say so. A silent fail-open looks identical to a fast load in
      // production and there is otherwise no way to tell them apart.
      console.warn(
        `[AssetLoader] assets still pending after ${STALL_MS}ms — handing off anyway`,
      );
      finish();
    }, STALL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(graceTimer);
      window.clearTimeout(stallTimer);
    };
  }, []);

  return (
    <div
      // The plate is up from FIRST PAINT even while the readout is not, and
      // that is deliberate. The Intro's plate follows immediately on the same
      // `bg-hero-surface`, so the two are visually one continuous surface and
      // the hand-off between them has no seam to see.
      className="fixed inset-0 z-[60] flex items-center justify-center bg-hero-surface"
      // Not a `role="progressbar"`: this is a pre-content gate, not a control,
      // and the whole plate is transient chrome. Announcing a percentage that
      // is usually gone within one frame is noise, not information.
      aria-hidden="true"
    >
      <div
        className="flex flex-col items-center gap-sm transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/*
          A 1px rule and a number. Utilitarian on purpose — this surface is not
          where the design system gets shown off, and anything more expressive
          here competes with the Intro that is about to play on the same pixels.

          `scaleX` off a `transform-origin: left` track, not an animated width:
          width is a layout property and this can tick many times per second.
        */}
        <div className="h-px w-[120px] overflow-hidden bg-hero-fg/15">
          <div
            className="h-full w-full origin-left bg-hero-accent"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <span className="text-caption font-mono text-hero-fg/45 tabular-nums">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

/**
 * The readiness gate as a hook, for callers that want the signal without the
 * plate.
 *
 * NOT USED YET, and it ships anyway for one reason: the moment a second
 * surface needs "are the fonts in", the alternative is a second copy of
 * `assetTasks()`, and two copies of a load-tracking list drift. Keeping the
 * measurement in one place and the presentation in another is the split this
 * whole file is about.
 */
export function useAssetsReady(): boolean {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    let cancelled = false;
    const tasks = assetTasks();
    const settle = () => {
      if (!cancelled) markReady();
    };
    Promise.all(tasks).then(settle, settle);
    const stall = window.setTimeout(settle, STALL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(stall);
    };
  }, [markReady]);

  return ready;
}

export default AssetLoader;
