/**
 * Frame-rate independence — the arithmetic that turns per-frame motion into
 * per-second motion.
 *
 * WHY THIS IS A SHARED MODULE AND NOT TWO PRIVATE CONSTANTS. The same three
 * numbers are needed by `lib/hero/commandSphere.ts` (the sphere's damping) and
 * by `components/hero/ParticleGrid.tsx` (the mesh's ambient drift and its
 * displacement lerp). Those are one decision — "how fast does the hero move in
 * SECONDS" — and this repo has repeatedly paid for expressing one decision as
 * two values that agree today. Getting the exponent subtly different in two
 * files would produce a sphere and a mesh that disagree about how fast a slow
 * frame is, which is invisible on the machine it was written on and wrong
 * everywhere else.
 *
 * Dependency-free, like `lib/animation/easing.ts` beside it, and for the same
 * reason: `commandSphere.ts` is deliberately framework-free and canvas-free,
 * so anything it imports has to be too.
 *
 * THE BUG THIS EXISTS TO PREVENT, stated once here rather than three times at
 * the call sites. `value += (target - value) * 0.06` closes a fixed 6% of the
 * gap PER FRAME. That is not a speed — it is a speed divided by the display's
 * refresh rate. On a 144Hz panel the same line runs 2.4x as often as on a 60Hz
 * one, so the hero drifts 2.4x faster, and a machine that drops to 30fps runs
 * it at half speed. Measured on this hero before the correction: the mesh moved
 * 0.056px per frame at both 60fps and 34fps — 3.37px/s against 1.91px/s for
 * identical code, and corr(dt, step) of 0.004, i.e. movement statistically
 * independent of elapsed time.
 */

/**
 * The frame duration every per-frame constant on this site was tuned against.
 *
 * 60Hz IS THE REFERENCE, NOT A TARGET. `DAMPING = 0.06` and `LERP = 0.12` were
 * both chosen by eye on a 60Hz display, and the whole point of the helpers
 * below is that those numbers keep their exact meaning: at `dtMs` equal to this
 * constant, `dampingFactor` returns its input unchanged and `frameScale`
 * returns 1. A 60Hz visitor therefore sees byte-identical motion to what
 * shipped before this module existed — which is what makes this a FIX rather
 * than a retune, and it is the acceptance check for it.
 */
export const REFERENCE_FRAME_MS = 1000 / 60;

/**
 * A single frame's elapsed time is clamped to this, in ms.
 *
 * MOVED HERE FROM `commandSphere.ts`, WHERE IT WAS `MAX_DT_MS = 50` AND
 * PRIVATE. The reason it moved is the reason it exists: rAF stops firing in a
 * background tab, so the first frame after a return carries the whole hidden
 * interval. Unclamped, a visitor coming back from another tab sees the sphere
 * teleport through half a revolution.
 *
 * The mesh did not need this while its motion was frame-locked — a fixed step
 * per frame cannot teleport — and so it never had it. Making the mesh
 * time-locked hands it the identical trap on the identical code path, and the
 * two clamps must be one number: a mesh that absorbed a 400ms frame while the
 * sphere absorbed 50ms of it would tear the two effects apart on exactly the
 * frame a returning visitor is looking at.
 */
export const MAX_FRAME_MS = 50;

/** Clamps a raw rAF delta into the usable range. Negative deltas clamp to 0. */
export function clampFrameMs(dtMs: number): number {
  return Math.min(Math.max(dtMs, 0), MAX_FRAME_MS);
}

/**
 * Converts a damping coefficient expressed PER FRAME at 60Hz into the
 * equivalent coefficient for a frame that actually lasted `dtMs`.
 *
 * `value += (target - value) * k` leaves `1 - k` of the gap behind. Over `n`
 * frames the remaining gap is `(1 - k)^n`, so the elapsed-time equivalent of
 * `n = dtMs / REFERENCE_FRAME_MS` frames is `1 - (1 - k)^n`. That is an
 * EXPONENTIAL identity, not an approximation: two 8.33ms frames compose to
 * exactly the same remaining gap as one 16.67ms frame, which a linear
 * `k * dt / 16.67` would not give and which is the whole reason the ease stays
 * smooth across a variable frame rate instead of pulsing with it.
 *
 * `dtMs <= 0` RETURNS 0, AND THAT IS CORRECT RATHER THAN DEFENSIVE. The first
 * frame after a mount or after a parked loop wakes has no previous timestamp,
 * so its `dt` is 0: no time has passed, so nothing should move. The frame is
 * still drawn and the next one carries a real delta, so nothing is stranded —
 * see the park/wake block in `ParticleGrid.tsx`, which queues the next frame
 * from `chasing`, a test that does not depend on this frame having moved.
 */
export function dampingFactor(perFrameK: number, dtMs: number): number {
  if (dtMs <= 0 || perFrameK <= 0) return 0;
  if (perFrameK >= 1) return 1;
  return 1 - Math.pow(1 - perFrameK, dtMs / REFERENCE_FRAME_MS);
}

/**
 * How many 60Hz frames' worth of time this frame was — the multiplier for a
 * LINEAR per-frame step such as a velocity.
 *
 * LINEAR, UNLIKE `dampingFactor`, and the two are not interchangeable. A
 * velocity integrates: twice the time is twice the distance, exactly. A damping
 * coefficient does not: twice the time is not twice the fraction closed, it is
 * `1 - (1 - k)²`. Using this one on a damping coefficient overshoots and can
 * exceed 1 on a long frame, which inverts the ease and flings the value past
 * its target.
 */
export function frameScale(dtMs: number): number {
  return dtMs / REFERENCE_FRAME_MS;
}
