/**
 * The hero command sphere — geometry only.
 *
 * FRAMEWORK-FREE AND CANVAS-FREE, DELIBERATELY. Nothing in this file imports
 * React, touches the DOM, or calls a 2D context. It takes a viewport size and
 * an elapsed millisecond count and returns positioned / scaled / alpha'd
 * fragments in CSS pixels; `ParticleGrid.tsx` owns every `fillText`. That split
 * is the whole reason the module exists: the projection, the depth ramp and the
 * navbar cap are the parts most likely to be wrong, and they are the parts a
 * test can call without a canvas.
 *
 * ZERO ALLOCATION PER FRAME. The unit vectors, the projection records and the
 * sort index are all built once in `createCommandSphere` and mutated in place
 * afterwards. This runs inside the same rAF tick as an O(n²) link pass over up
 * to 300 nodes; a fresh array or a fresh object per fragment per frame is the
 * kind of cost that does not show up as a single slow function but as GC
 * sawtooth across the whole hero.
 *
 * THE ROTATION IS A PLAIN ACCUMULATING SCALAR, never derived from
 * `performance.now()`. It is advanced by real elapsed `dt` so it runs at the
 * same speed on a 60Hz and a 120Hz display, but the angle itself is state. A
 * clock-derived angle cannot later be driven by a ScrollTrigger scrub; this one
 * can, without restructuring anything.
 *
 * THAT PARAGRAPH WAS HALF TRUE UNTIL 2026-08-22, and the half it got wrong is
 * worth keeping on the record because the claim is the kind that reads as
 * verified. `idleY`/`idleX` — the TARGET — really were advanced by real elapsed
 * `dt` and really did run at the same speed on any display. The four damping
 * lines in `stepCommandSphere` that carry the RENDERED angles toward that
 * target did not: they closed a fixed 6% of the gap per frame, so a 69ms frame
 * moved the globe exactly as far as a 40ms one. Measured, corr(dt, step) was
 * -0.05 — the sphere's catch-up was statistically independent of elapsed time,
 * and the lag between angle and idle target was a function of the refresh rate.
 * The damping now goes through `dampingFactor`, which is the exponential
 * identity for the same coefficient over real time and returns 0.06 unchanged
 * at 60Hz. See `lib/animation/frameRate.ts`.
 */

import {
  clampFrameMs,
  dampingFactor,
} from "@/lib/animation/frameRate";

/* -------------------------------------------------------------------------
   Distribution
------------------------------------------------------------------------- */

/** π(3 − √5). The golden angle, in radians. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/* -------------------------------------------------------------------------
   Depth cueing — design §3. `t` is 0 at the far pole and 1 at the near pole.
------------------------------------------------------------------------- */

const ALPHA_FAR = 0.1;
const ALPHA_SPAN = 0.7;
/**
 * THE LOAD-BEARING NUMBER. Linear alpha leaves the back hemisphere too present
 * and the sphere reads as a flat disc of noise; the exponent pushes the far
 * half down fast so the near face separates and the thing reads as a volume.
 *
 * Rejection criterion from design §3: if the back reads as DIRT rather than as
 * DEPTH, raise this to 2.0 — do not touch `ALPHA_FAR` / `ALPHA_SPAN`.
 */
const ALPHA_EXPONENT = 1.6;

/**
 * `SCALE_FAR = 0.62` / `SCALE_SPAN = 0.38` USED TO LIVE HERE, FEEDING A LINEAR
 * RAMP `p.scale = SCALE_FAR + SCALE_SPAN * t`. BOTH ARE DELETED — 2026-08-24 —
 * AND THE SCALE IS NOW THE PROJECTION'S OWN PERSPECTIVE DIVIDE. The range
 * endpoints moved with it and are declared next to `PERSPECTIVE`, which is the
 * only constant they now depend on; see `SPHERE_SCALE_MIN` there.
 *
 * WHAT WAS WRONG WITH IT, MEASURED RATHER THAN ASSERTED. The ramp's stated
 * range was 0.62..1.00 — 1.61x — but the range that ever REACHES THE SCREEN is
 * much narrower, because `SPHERE_MIN_ALPHA` culls at `t = 0.382` and the ramp
 * is only at 0.765 by then. So the visible span was 0.765..1.00, i.e. **1.31x
 * across the entire drawn sphere**, and of the six font buckets only FOUR were
 * ever painted on desktop (12.35 / 13.57 / 14.78 / 16.00 — the rig reported
 * `min font seen 12.352` over a six-second capture, never lower).
 *
 * That is exactly the shape Saad reported: near-uniform size across most of the
 * sphere, then an edge. The cull was doing the work the depth ramp should have
 * been doing.
 */

/** Above this `t` a fragment takes the cool near-white tint instead of accent. */
const NEAR_TINT_T = 0.75;
/** Above this `t` a fragment gets the glow pass — roughly the front third. */
const GLOW_T = 0.6;

/* -------------------------------------------------------------------------
   Projection
------------------------------------------------------------------------- */

/**
 * Perspective distance, in radius units. Large flattens the sphere toward an
 * orthographic tag-cloud; small blows the near fragments up until they clip the
 * hero. 2.5 was the plan's starting value, tuning window 2.0–4.0.
 *
 * 2.5 -> 2.0 ON 2026-08-24, AT THE BOTTOM OF THAT WINDOW AND NOT PAST IT, on
 * Saad's instruction that the commands should "go behind and then appear from a
 * tiny level so it gives a proper depth sphere vibe".
 *
 * THIS IS THE ONE KNOB THAT NOW ANSWERS THAT ASK, and it is one knob rather
 * than three because of the change the day before: since `SCALE_NORM` made the
 * depth scale BE the perspective divide, `f` sets the size range and the
 * silhouette bulge together, as one physical fact. Lowering it is the whole of
 * "more depth" — no curve was invented, no exponent was tuned, and neither
 * alpha constant was touched.
 *
 *   geometric range   (f - 1) / (f + 1) .. 1     0.4286..1 = 2.33x at f 2.5
 *                                                0.3333..1 = 3.00x at f 2.0
 *
 * IT IS NOT TAKEN BELOW 2.0. The window's lower bound is where the near
 * fragments start blowing up into the hero, and a documented window is not a
 * suggestion.
 *
 * >> THIS REFUSAL USED TO HAVE A SECOND LEG AND IT EXPIRED THE SAME DAY:
 * >> "there is nothing left to buy anyway: the drawn range is quantised to the
 * >> bucket grid, so f 1.8 renders the same 2.05x band as f 2.0 and only shaves
 * >> the mean label area." That was true of the twelve-bucket grid it was
 * >> written against. The renderer quantises to a flat 0.25px grid now, so
 * >> f 1.8 WOULD render a genuinely wider band (0.286..1 = 3.5x geometric).
 * >> The refusal stands on its first leg alone, which is the one that was
 * >> always load-bearing; the arithmetic leg is withdrawn rather than left
 * >> standing to look like support.
 *
 * WHAT MOVED WITH IT, so nobody re-derives the numbers: `PERSPECTIVE_FIT`
 * 1.091 -> 1.1547 (the disc is still exactly `D` wide by construction, which is
 * the point of dividing it out), `SCALE_NORM` 0.6 -> 0.5, `SPHERE_SCALE_MIN`
 * 0.4286 -> 0.3333. Everything downstream of those is derived and needed no
 * edit; the renderer's font floor DID, and its own block in `ParticleGrid.tsx`
 * carries why. (This also named "the bucket count", which was a live constant
 * for one day and is now a retired one.)
 */
const PERSPECTIVE = 2.0;

/**
 * A perspective divide makes the SILHOUETTE bulge past the geometric radius —
 * the widest ring is not the equator but the circle at z = 1/f, and it projects
 * to `f / sqrt(f² − 1)` times the radius. **1.1547x at f = 2.0**, and it read
 * "1.091x at f = 2.5" until 2026-08-24: the constant above moved and this
 * paragraph did not follow it, which is exactly the drift the block up there
 * lists "WHAT MOVED WITH IT" to prevent. Caught in review, not by the code.
 *
 * THIS IS DIVIDED OUT, NOT IGNORED, and that is not cosmetic — and the case for
 * it got 70% stronger with the same move. Design §6's navbar cap is stated in
 * terms of the diameter D: `D = min(D, vh − 2(navH + 24))`. If the drawn disc
 * were **15.5%** wider than D the cap would be computing clearance for a sphere
 * that is not the one on screen, and the 1440x560 case the rule exists for
 * would fail by **~29.7px** (D capped to 384, so a 192px radius drawn at
 * 221.7) while the arithmetic still looked right. It was ~17px at f = 2.5.
 * Dividing here makes "the projected disc is exactly D wide" true.
 */
const PERSPECTIVE_FIT =
  PERSPECTIVE / Math.sqrt(PERSPECTIVE * PERSPECTIVE - 1);

/**
 * THE DEPTH SCALE IS THE PERSPECTIVE DIVIDE ITSELF, NORMALISED SO THE NEAR POLE
 * IS 1.0 — added 2026-08-24, replacing a linear ramp in `t`.
 *
 * WHY THIS AND NOT A TUNED CURVE. Saad asked for labels that "continuously
 * scale down as they rotate toward the back, proportional to their actual
 * depth/angle from the camera... genuine perspective depth". The projection
 * ALREADY computes exactly that number, one line above where the scale is set:
 * `s = PERSPECTIVE / (PERSPECTIVE - r.z)` is the factor the label's POSITION is
 * multiplied by. Using anything else for its SIZE means the label moves with
 * one perspective and is drawn with another. There is no curve to tune here and
 * no exponent to invent — a fragment at the far pole is 3.00x further from the
 * camera than one at the near pole, so it is drawn 3.00x smaller. (2.33x when
 * this was written, at `PERSPECTIVE` 2.5. See that constant for the move.)
 *
 *   scale = s / s(near pole) = (f - 1) / (f - z)      z in [-1, 1]
 *
 * `SCALE_NORM` is `(f - 1) / f`, so the per-frame cost is one MULTIPLY against
 * the `s` that is already in hand rather than a second divide.
 *
 * RANGE: 0.3333 .. 1.0 at f = 2.0, i.e. **3.00x**, against the retired ramp's
 * nominal 1.61x and its actual on-screen 1.31x. Over the range that survives
 * the alpha cull (`t >= 0.382`, so `z >= -0.236`) it is 0.447..1.0 = **2.24x**,
 * which is the number that matters because it is the one a viewer sees.
 *
 * AND THE NUMBER THAT MATTERS MORE IS WHAT IS ACTUALLY PAINTED. The renderer
 * used to quantise this range onto a bucket grid; as of 2026-08-24 it does not
 * quantise at all — `ParticleGrid.tsx` scales each glyph with a transform off
 * its exact depth — so every drawn label has its own size and the painted
 * range is the geometry's, minus whatever the alpha cull removes. MEASURED in
 * a single captured frame at 1440x900: **7.71..15.98px, FORTY-NINE distinct
 * sizes across 49 drawn labels, 2.07x**.
 *
 * THE PROGRESSION IS THE POINT AND IS WHY THE OLD FIGURES ARE KEPT: four
 * painted sizes over 12.35..16.00 (linear ramp), seven over 10.75..16.00
 * (perspective ramp), ten over 7.82..16.00 (perspective ramp, twelve buckets),
 * and now one per label. The first three were approximations of the fourth,
 * and each was reached by making the steps smaller rather than by removing
 * them.
 *
 * THE TWO CUES STAY COUPLED, which was the point of deriving size from the same
 * `z` the alpha already uses. Sampled down a captured frame, size against mean
 * alpha, monotone the whole way: 16.00px/0.799, 14.18/0.729, 12.36/0.636,
 * 10.55/0.517, 8.73/0.348, 7.82/0.291. Labels shrink and dim together and the
 * 175ms fade takes them off; there is no step and no cliff anywhere in that
 * list — and since the bucket grid was retired there is no step ANYWHERE,
 * which is the difference between a fine approximation of a recession and a
 * recession.
 *
 * THIS COUPLES TYPE SIZE TO `PERSPECTIVE`, AND THAT COUPLING IS CORRECT RATHER
 * THAN ACCIDENTAL. Retuning `PERSPECTIVE` inside its documented 2.0-4.0 window
 * now changes the labels' size range as well as the disc's bulge — because
 * those are the same physical fact. Note the direction: LARGER `f` flattens the
 * sphere toward orthographic and therefore FLATTENS THE SIZE RANGE too (2.5
 * gives 2.33x, 3.0 gives 2.0x, 4.0 gives 1.67x). If a future change wants the
 * tag-cloud look back, `PERSPECTIVE` is now the one knob, which is fewer knobs
 * than before — and on 2026-08-24 it was the one knob used, in the other
 * direction, to buy the depth Saad asked for.
 *
 * `ALPHA_EXPONENT` IS DELIBERATELY NOT REUSED HERE even though the two cues are
 * meant to read together. That constant carries its own rejection criterion
 * ("if the back reads as DIRT rather than as DEPTH, raise this to 2.0"), and a
 * shared exponent would make acting on it silently resize every label on the
 * sphere. Two cues, two independent knobs, one shared input `t`/`z`.
 */
const SCALE_NORM = (PERSPECTIVE - 1) / PERSPECTIVE;

/**
 * The scale range, exported so the draw pass can map into it.
 *
 * The renderer needs both endpoints to turn a fragment's `scale` into a drawn
 * size, and it cannot do that without knowing the range the ramp actually
 * produces. Exporting the two endpoints is cheaper than exporting a mapping
 * function that would drag a rendering concern into a module whose whole point
 * is not having any.
 *
 * IT USED TO SAY "so the draw pass can BUCKET into it", and justified the
 * export in terms of a bucket grid: "The renderer has to quantise `scale` to a
 * handful of steps — assigning `ctx.font` is a string parse and doing it
 * ninety times a frame is the single cheapest thing to get wrong here — and it
 * cannot pick sensible bucket boundaries without knowing the range." As of
 * 2026-08-24 the renderer assigns `ctx.font` exactly ONCE a frame and scales
 * glyphs with a transform; it still quantises, but onto a flat 0.25px grid
 * that needs no boundaries derived from this range. "Ninety" was also two
 * count-generations stale. The EXPORT and its justification survive — only
 * the reason the renderer wants the numbers has changed.
 *
 * BOTH ARE DERIVED FROM `PERSPECTIVE` NOW rather than being independent tuning
 * constants, so they cannot drift away from the ramp that produces them. The
 * min is the far pole (`z = -1`), the max is the near pole (`z = +1`).
 */
export const SPHERE_SCALE_MIN = (PERSPECTIVE - 1) / (PERSPECTIVE + 1);
export const SPHERE_SCALE_MAX = 1;

/* -------------------------------------------------------------------------
   Sizing and placement — design §5 and §6
------------------------------------------------------------------------- */

/**
 * The block the deleted `SaadGlass` wordmark occupied: `ml-[42%] w-[54%]
 * max-w-[900px]`, vertically centred. The sphere takes the same block's centre,
 * which is what keeps Rule S-1's composition intact — text annotation left,
 * object right, negative space on the right edge.
 */
const BLOCK_LEFT_FRACTION = 0.42;
const BLOCK_WIDTH_FRACTION = 0.54;
const BLOCK_MAX_WIDTH = 900;

/**
 * THE DESKTOP DIAMETER — 0.38 of the viewport width, floored at 280 and capped
 * at 660.
 *
 * `D_FRACTION` WENT 0.30 -> 0.38 AND `D_MAX` 520 -> 660 ON 2026-08-23, at
 * Saad's request that the sphere read larger. +26.7% radius, +60.4% projected
 * area at 1440x900: R 216 -> 273.6, D 432 -> 547.2.
 *
 * `D_MAX` IS DERIVED, NOT PICKED. `520 / 0.30 = 1733px` is the width at which
 * the cap engages today; `0.38 x 1733 = 658.6 -> 660`. The cap therefore
 * engages at the SAME viewport width it did before, so no viewport changes
 * which regime it is in and the 1920x1080 case stays a capped case.
 *
 * `D_MIN` STAYS AT 280, AND THAT IS THE LOAD-BEARING "DO NOT TOUCH". It engages
 * below `D_MIN / D_FRACTION`: 933px today, and 737px at 0.38 — which is BELOW
 * the desktop branch's floor of 768, so on desktop the floor is now inert and
 * every desktop width takes the plain `0.38 x vw`. Scaling it with the fraction
 * (to 355) would put the engagement point back at 934px and keep inflating the
 * 768-933 band, which is exactly the band where the clip guard is tightest.
 * The growth is therefore deliberately NON-UNIFORM across widths: +26.7% at
 * 1440, +4.2% at 768. That is the point, not a defect — 768 is where the rim
 * runs closest to the viewport edge and it is not the width being complained
 * about.
 *
 * THE COMPACT CONSTANTS BELOW DO NOT MOVE, and the reason is vertical room:
 * at 375x667 the sphere's bottom already sits at 449.8 against a tagline block
 * starting at ~467. Seventeen pixels. There is also no problem to fix there —
 * the compact disc is 232.5 of 375, i.e. 62% of the viewport width, and is
 * already the dominant object.
 *
 * THE NAV CAP IS NOT LOOSENED TO BUY RADIUS. It now binds at 1440x720, where it
 * did not before (547.2 against a 544 cap), and the outcome is a 272px radius
 * against an uncapped 273.6 — 1.6px. That is the cap working. Verify it; do not
 * "fix" it.
 */
const D_FRACTION = 0.38;
const D_MIN = 280;
const D_MAX = 660;

const D_FRACTION_COMPACT = 0.62;
const D_MIN_COMPACT = 200;
const D_MAX_COMPACT = 260;

/**
 * The navbar's occupied height, from `Navbar.tsx`'s container: `py-sm` below
 * 640, `sm:py-md` at 640 and above.
 *
 * THE TALLEST IN-FLOW CHILD IS 22px ONLY BELOW `md`. It is the mobile menu
 * button's `MenuIcon` at `h-[22px]`, which is `md:hidden`; from 768px up the
 * tallest in-flow child is the 17px MS mark (the centre cluster is
 * `position: absolute` and out of flow — `Navbar.tsx:189-192` states this).
 * So the bar actually measures **48px below 640, 64px from 640 to 767, and
 * 59px at 768 and above**.
 *
 * THIS COMMENT SAID "tallest child 22px" FLATLY, WHICH OVER-RESERVES 5px AT
 * `md` AND UP. The values below are unchanged and stay unchanged: 64 is exact
 * in the 640-767 band and conservative above it, and this constant feeds
 * `NAV_CLEARANCE`, where erring toward more clear air is the safe direction.
 * Corrected as a comment only — do not "fix" the number, which would tighten a
 * clearance for no gain.
 */
const NAV_HEIGHT_COMPACT = 48;
const NAV_HEIGHT = 64;
/** Minimum clear air between the sphere's disc and the navbar strip. */
const NAV_CLEARANCE = 24;
/** The width at which the navbar's vertical padding steps up. Tailwind `sm`. */
const NAV_BREAKPOINT = 640;

/**
 * How far past the sphere's projected radius the mesh is torn open, CSS px.
 *
 * An additive margin rather than a multiplier: the sphere's radius varies 3x
 * across the breakpoint range, and a multiplier would give a 111px sphere a
 * 28px margin and a 260px sphere a 65px one — the small case is where the
 * fragments most need the mesh out from behind them.
 */
const VOID_MARGIN = 40;

/* -------------------------------------------------------------------------
   Motion — design §8
------------------------------------------------------------------------- */

const DEG = Math.PI / 180;

/** Idle rotation, radians per millisecond. 6°/s about Y, 2°/s about X. */
const IDLE_RATE_Y = (6 * DEG) / 1000;
/** The X drift is what stops the spin reading as a flat carousel. */
const IDLE_RATE_X = (2 * DEG) / 1000;

/** Cursor tilt ceilings, radians. */
const CURSOR_MAX_Y = 18 * DEG;
const CURSOR_MAX_X = 12 * DEG;

/**
 * 0.06, NOT the field's 0.12. The mesh's nodes are 2px and snap convincingly; a
 * 432px object moving at the same rate reads as twitchy. The heavier damping is
 * what makes the sphere feel like it has mass.
 *
 * IT IS PER 60Hz FRAME, AND IT IS NOT APPLIED AS ONE. The number keeps its
 * original meaning — `dampingFactor(0.06, 16.667)` is 0.06 to the last bit — but
 * `stepCommandSphere` converts it to the elapsed time the frame actually took
 * before using it. Retune this by eye on a 60Hz display exactly as before; what
 * changed is that the feel now survives a 144Hz panel and a dropped frame.
 */
const DAMPING = 0.06;

/**
 * The frozen orientation under `prefers-reduced-motion`, and also the starting
 * orientation of the animated path so both open on the same frame.
 *
 * CHOSEN, NOT INCIDENTAL. Off-axis, so no fragment sits dead-centre facing the
 * viewer (which reads as a poster) and the silhouette shows the rim crowding
 * that sells the volume. A reduced-motion visitor sees exactly one frame of
 * this effect, forever; it should be the good one.
 */
export const SPHERE_REST_ANGLE_Y = 0.42;
export const SPHERE_REST_ANGLE_X = 0.18;

/**
 * THE ARRIVAL BURST — how much faster than idle the sphere turns on the frame
 * the Intro hands off, and how long it takes to ease back.
 *
 * WHAT IT IS FOR. The hero's stage settles out of a small over-scale over
 * `ARRIVAL_S` (1.30s, `Hero.tsx`) while the Intro's plate dissolves over 0.55s.
 * Before this, the sphere inside that stage turned at exactly its resting 6°/s
 * throughout — so the one element that is intrinsically in motion was the one
 * element that did not participate in the arrival. The burst makes the sphere
 * arrive too.
 *
 * 4x, 3.2s AND A SQUARED FALLOFF — 2026-08-24. IT WAS 2.5x, 1.6s AND A CUBIC
 * ONE, AND ALL THREE MOVED TOGETHER FOR ONE REASON.
 *
 * THE ASK: "increase the burst's peak and/or extend its duration specifically
 * so it reads clearly once the Intro's other motion has finished." That last
 * clause is a TIME, not a taste — `arrivalBurst` is incremented on the same
 * frame `Hero.tsx` starts its `ARRIVAL_S` tween, so the Intro's other motion is
 * over at **t + 1.30s**, and the question is only what the sphere is doing then.
 *
 * WHAT IT USED TO BE DOING AT THAT INSTANT: **1.010x**. Nothing. The old burst
 * had spent 99.3% of itself by the time the last other thing stopped moving, so
 * the beat it carried landed entirely UNDER the dissolve and the scale-in —
 * which is what the retired paragraph below was deliberately designing for, and
 * exactly what Saad is asking to change.
 *
 * WHAT IT IS NOW: **2.058x at t+1.30s**, i.e. the sphere is still turning at
 * twice idle at the instant it becomes the only thing on screen still moving,
 * and it eases from there to idle over the following 1.9s.
 *
 * THE THREE NUMBERS, EACH DOING ITS OWN JOB:
 *
 *   4x     the peak. The brief still asks for a beat, not a spin: 4x idle is
 *          24 deg/s, one revolution in 15s, and the labels stay readable at it.
 *   3.2s   the duration. 2.46x `ARRIVAL_S` — so the rotation is unambiguously
 *          the LAST thing to settle, rather than the 1.23x that made it merely
 *          the last thing to settle DURING the arrival.
 *   ^2     the falloff. THIS IS THE ONE THAT ACTUALLY DELIVERS THE ASK, and it
 *          is a deliberate reversal of the reasoning kept below.
 *
 * WHY THE EXPONENT HAD TO CHANGE AND NOT JUST THE OTHER TWO. Under a cubic
 * falloff the burst is nearly spent before it is half over — the same 4x/3.2s
 * curve CUBED reads 1.63x at t+1.30s against the squared curve's 2.06x, and by
 * t+2.0s it is 1.16x against 1.42x. The cubic was chosen to MATCH `Hero.tsx`'s
 * `power2.out` (GSAP's Power2 is cubic; Power1 is the quadratic), which was the
 * right instinct while the goal was for the burst to blend INTO the arrival.
 * The goal is now for it to be legible AFTER the arrival, and matching the
 * curve of the thing you are meant to outlast is precisely wrong for that.
 *
 * IT STILL REACHES EXACTLY 1.0 AT T rather than approaching it, and it is
 * within 5% of idle at `T(1 - sqrt(0.05/3))` = **2.787s**.
 *
 * >> THE PARAGRAPH THIS REPLACED IS KEPT BECAUSE ITS ARGUMENT WAS SOUND AND ITS
 * >> PREMISE EXPIRED, NOT BECAUSE IT WAS WRONG: "2.5 is the midpoint [of the
 * >> 2-3x brief], and 1.6s is 1.23x `ARRIVAL_S`, so the rotation is the LAST
 * >> thing to settle. A burst that ended with the scale would put two moves on
 * >> one frame and read as a single hard stop; ending after it means the sphere
 * >> carries the beat out." That reasoning is unchanged and is why the duration
 * >> is still expressed as a multiple of `ARRIVAL_S` rather than as a round
 * >> number of seconds. What changed is how far after the arrival "after" has
 * >> to be before anyone can SEE it.
 *
 * MEASURED AT THE NEW VALUES, BY THE TWO-BUILD RATIO METHOD AND NOT BY A SINGLE
 * RUN, because the per-label median screen speed this is recovered from carries
 * a +/-20% wobble with the sphere's orientation that no within-run reference
 * removes. (The single run reads its own pre-hand-off control at 0.664x where
 * it should read 1.000, and reports a 2.80x peak for a constant of 4.) Against
 * a `SPHERE_BURST_RATE = 1` build of the same geometry:
 *
 *   pre-hand-off control   0.980x   (should be 1.000)
 *   peak in [0,150]ms      4.054x   (the constant is 4)
 *
 * THE TAIL NEEDS ONE STATED CORRECTION AND IT IS THE BURST'S OWN DOING. The two
 * builds share an angle history until the hand-off and then separate
 * PERMANENTLY by the burst's extra travel — **19.2 deg**, against the old
 * burst's 3.6 — so the wobble stops cancelling and the raw ratio settles above
 * 1.000x once the burst is over. Dividing by a drift factor that grows with the
 * SPENT share of that extra angle, `1 + (D-1)*(1-(1-t/T)^3)`, tracks
 * `1 + 3(1-t/T)^2` closely:
 *
 *      t(ms)      0     800    1400    1600    2400    3200
 *   corrected  4.054   2.667   1.895   1.701   1.156   0.968
 *   predicted  4.000   2.688   1.949   1.750   1.188   1.000
 *
 * `D` IS 1.140, AND WHERE IT COMES FROM MATTERS BECAUSE THE FIRST DRAFT OF THIS
 * BLOCK GOT IT WRONG. It is the mean raw ratio over the **25 bins from 3.3s to
 * 4.5s**, i.e. the whole post-burst tail. The sampled bins printed below
 * (3.2 / 3.4 / 3.6s) average 1.111, and quoting those three as if they were the
 * source made the correction look like it had been fitted rather than measured.
 * They are the near end of a tail that drifts a little further out; the window
 * is the definition.
 *
 * THE ERROR FIGURE IS OVER ALL 50ms BINS IN [0, 3200], not over the six
 * sampled above: **mean absolute error 0.064, max 0.266**. The six samples
 * average 0.040, which is why they must not be presented as the substantiation.
 *
 * The raw ratio is FLAT from 3200ms on (1.104 / 1.102 / 1.128), which is the
 * independent confirmation that the burst terminates on schedule — a flat tail
 * cannot contain a decaying excess, whatever level it sits at, and this half of
 * the evidence needs no correction factor at all.
 *
 * UNDER 4x CPU THROTTLING the single-run profile is indistinguishable from the
 * unthrottled single-run profile at every sample (peak 2.842x vs 2.801x, the
 * same decay shape) — both under-read by the same wobble, and the point is
 * that the burst is `dt`-scaled and a starved frame rate does not spend it any
 * faster.
 *
 * WHAT THAT MEASUREMENT CANNOT SEE, stated rather than left implied: the
 * countdown uses `clampFrameMs`, so frames longer than `MAX_FRAME_MS` (50ms)
 * advance the burst by 50ms of budget and rather more of wall clock. A tab
 * starved that badly stretches the burst instead of truncating it, which is the
 * safe direction, and doubling T from 1.6s to 3.2s doubles the window over
 * which it can happen. 4x throttling does not push frames past 50ms and so does
 * not exercise it — the claim above is about `dt` scaling, not about a starved
 * tab's wall clock.
 *
 * IT IS APPLIED TO THE RENDERED ANGLE, NOT ONLY TO THE IDLE TARGET, AND THAT IS
 * MEASURED RATHER THAN PREFERRED. `angleY` chases `idleY` through `DAMPING`
 * 0.06/frame — a ~278ms time constant. Multiplying the target alone lets that
 * lag eat the burst: simulated at 60Hz, a 2.5x target produces a RENDERED peak
 * of only **1.52x**, and it peaks at **483ms** rather than at the hand-off, so
 * the sphere would speed UP while the plate dissolves and then slow down. That
 * is the opposite shape from the one asked for. Getting a rendered 2.5x out of
 * the target alone needs ~4.6x, which then overshoots at every other frame
 * rate. `stepCommandSphere` therefore advances the target AND the rendered
 * angle by the same excess, which leaves the lag between them exactly as it
 * was and delivers the burst at full amplitude on its first frame.
 *
 * IT DOES NOT SNAP, and the file's opening promise is intact: nothing is
 * ASSIGNED to an angle here. This is an integrated advance, in radians per
 * millisecond of real elapsed time, whose coefficient starts at
 * `SPHERE_BURST_RATE` and eases to 1. What steps discontinuously is a
 * VELOCITY, once, on the hand-off frame —
 * which is also true of the arrival tween it accompanies, since `power2.out`
 * is at its fastest on its first frame.
 *
 * THE CURSOR IS UNAFFECTED, BY CONSTRUCTION. The burst scales the IDLE term
 * only. `offsetY`/`offsetX` are a separate addend reaching the angle through
 * the same damping they always did, so "what wins if the visitor moves the
 * mouse during the burst" has the same answer as before: neither — they add.
 */
export const SPHERE_BURST_RATE = 4;
/** Milliseconds. See `SPHERE_BURST_RATE`. */
export const SPHERE_BURST_MS = 3200;
/**
 * The falloff's exponent. 2, and it was 3 — hard-coded as `r * r * r` — until
 * 2026-08-24. Named rather than inlined because it turned out to be a TUNING
 * DECISION with a stated reason rather than an implementation detail of the
 * multiply, and it was invisible as a decision while it lived in the
 * arithmetic. See `SPHERE_BURST_RATE` for why the curve family changed.
 */
export const SPHERE_BURST_EXPONENT = 2;

/* -------------------------------------------------------------------------
   Types
------------------------------------------------------------------------- */

type UnitFragment = {
  text: string;
  /** Position on the unit sphere. Computed once; the tick rotates a copy. */
  ux: number;
  uy: number;
  uz: number;
};

export type ProjectedFragment = {
  text: string;
  /** Anchor in CSS px, container coordinates. Text is centred on it. */
  x: number;
  y: number;
  /** Font scale, `SPHERE_SCALE_MIN`..1 — the perspective divide, normalised. */
  scale: number;
  /** `ALPHA_FAR`..`ALPHA_FAR + ALPHA_SPAN`. */
  alpha: number;
  /** True in the front band that takes the cool near-white tint. */
  near: boolean;
  /** True in the front third that gets the glow pass. */
  glow: boolean;
};

export type PointerInput = {
  /** Container-relative pointer position, CSS px. */
  x: number;
  y: number;
  /** False disables tilt entirely and lets the current offset damp back to 0. */
  active: boolean;
};

export type CommandSphere = {
  readonly fragments: UnitFragment[];
  /** Index-parallel to `fragments`. Mutated in place every frame. */
  readonly projected: ProjectedFragment[];
  /** Draw order, far to near. Preallocated; sorted in place every frame. */
  readonly order: number[];
  /** Rendered angles. Damped toward `idleY/idleX` plus the cursor offset. */
  angleY: number;
  angleX: number;
  /** The undamped idle target, advanced by real `dt`. */
  idleY: number;
  idleX: number;
  /** Damped cursor tilt offsets, radians. */
  offsetY: number;
  offsetX: number;
  /**
   * Milliseconds LEFT in the arrival burst, counted down by the same clamped
   * `dt` the rotation is advanced by. 0 means "not bursting", which is the
   * resting state and the state every sphere is built in — the burst is armed
   * by `startCommandSphereBurst` and by nothing else.
   */
  burstMs: number;
  centreX: number;
  centreY: number;
  /** Projected radius in CSS px. The drawn disc is exactly `2 * radius` wide. */
  radius: number;
};

/* -------------------------------------------------------------------------
   Construction
------------------------------------------------------------------------- */

/**
 * Standard golden-angle spiral on a unit sphere.
 *
 * THE RIM PILE-UP IS A FEATURE. Near the silhouette the surface turns edge-on
 * to the viewer, so projected fragments crowd there — and that crowding is what
 * draws the sphere's outline without any circle ever being stroked. Anything
 * that evens it out (area-weighted redistribution, latitude culling) flattens
 * the volume back into a wrapped texture. Do not compensate for it.
 *
 * A lat/long grid was the other option and is the one to avoid: it piles points
 * at the poles and reads as a wireframe globe, which is the template signature
 * this whole hero exists to not be.
 */
function fibonacciPoint(index: number, count: number) {
  const y = count < 2 ? 0 : 1 - (index / (count - 1)) * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN_ANGLE * index;
  return { x: Math.cos(theta) * ring, y, z: Math.sin(theta) * ring };
}

/**
 * Rotate a unit vector by Y then X.
 *
 * ORDER IS FIXED AND MATTERS. Y-then-X spins the sphere about its own vertical
 * axis and then tips that axis toward the viewer, which is the "object on a
 * turntable being looked down at" reading. X-then-Y tips first and then swings
 * the whole tipped thing around the screen's vertical, which wobbles. Swapping
 * these two blocks compiles, runs, and looks like a bug six months later.
 */
function rotate(
  ux: number,
  uy: number,
  uz: number,
  angleY: number,
  angleX: number,
) {
  const cy = Math.cos(angleY);
  const sy = Math.sin(angleY);
  const cx = Math.cos(angleX);
  const sx = Math.sin(angleX);

  const x1 = ux * cy + uz * sy;
  const z1 = -ux * sy + uz * cy;

  const y2 = uy * cx - z1 * sx;
  const z2 = uy * sx + z1 * cx;

  return { x: x1, y: y2, z: z2 };
}

/**
 * Picks `count` strings out of `texts` by an even stride rather than taking the
 * first N, with `required` guaranteed to survive.
 *
 * The fragment list in `heroContent.ts` is grouped by tool family — ten
 * Kubernetes lines, then eight Terraform, and so on — so slicing the head of it
 * would give a mobile visitor a sphere made almost entirely of `kubectl`. The
 * register mix is the point of the set (see the register note in that file on
 * why the `git` and `curl` entries are in there), and a stride preserves it.
 *
 * `required` IS NOT OPTIONAL POLISH — it was a real defect. The stride is
 * whatever `texts.length / count` happens to be, so it silently skipped
 * individual entries, and on the shipped 95-into-90 case one of the entries it
 * skipped was `docker ps -a` — a FEATURED command, the one thing in the set
 * that has a stated reason to be present. The caller had no way to see that:
 * the sphere still rendered, still had 90 fragments, and simply omitted the one
 * string whose placement the reduced-motion frame depends on. Reserving the
 * required strings first makes the guarantee structural instead of a property
 * of the arithmetic.
 */
function sample(
  texts: readonly string[],
  count: number,
  required: readonly string[],
): string[] {
  if (count >= texts.length) return texts.slice();

  const keep = required.filter((r) => texts.includes(r)).slice(0, count);
  const out = keep.slice();
  const rest = count - keep.length;
  if (rest > 0) {
    const pool = texts.filter((t) => !keep.includes(t));
    const stride = pool.length / rest;
    for (let i = 0; i < rest; i++) out.push(pool[Math.floor(i * stride)]);
  }
  return out;
}

/**
 * Builds the sphere once. Cheap enough to redo on a breakpoint change, but not
 * called per frame and not called on every resize — see `placeCommandSphere`,
 * which is the part that reacts to a viewport change.
 *
 * `featured` names the commands that must land in the FRONT hemisphere at the
 * rest orientation. A reduced-motion visitor never sees any other frame, so the
 * one they do see has to open with recognisable, fully-formed invocations
 * rather than whatever the spiral happened to put there. The assignment is
 * deterministic: rotate every point to the rest orientation, sort by depth, and
 * hand the frontmost slots to the featured strings.
 */
export function createCommandSphere(
  texts: readonly string[],
  count: number,
  featured: readonly string[] = [],
): CommandSphere {
  const pool = sample(texts, count, featured);
  const n = pool.length;

  // Depth of each spiral slot at the rest orientation, frontmost first.
  const slots = Array.from({ length: n }, (_, i) => {
    const p = fibonacciPoint(i, n);
    const r = rotate(p.x, p.y, p.z, SPHERE_REST_ANGLE_Y, SPHERE_REST_ANGLE_X);
    return { index: i, depth: r.z };
  });
  slots.sort((a, b) => b.depth - a.depth);

  const assigned: (string | null)[] = new Array(n).fill(null);
  const remaining = pool.slice();

  let cursor = 0;
  for (const label of featured) {
    if (cursor >= n) break;
    const found = remaining.indexOf(label);
    if (found === -1) continue; // Not in this sample (mobile strides some out).
    remaining.splice(found, 1);
    assigned[slots[cursor].index] = label;
    cursor++;
  }
  for (let i = 0; i < n; i++) {
    if (assigned[i] === null) assigned[i] = remaining.shift() ?? "";
  }

  const fragments: UnitFragment[] = [];
  const projected: ProjectedFragment[] = [];
  const order: number[] = [];

  for (let i = 0; i < n; i++) {
    const p = fibonacciPoint(i, n);
    fragments.push({ text: assigned[i] as string, ux: p.x, uy: p.y, uz: p.z });
    projected.push({
      text: assigned[i] as string,
      x: 0,
      y: 0,
      scale: 1,
      alpha: 0,
      near: false,
      glow: false,
    });
    order.push(i);
  }

  return {
    fragments,
    projected,
    order,
    angleY: SPHERE_REST_ANGLE_Y,
    angleX: SPHERE_REST_ANGLE_X,
    idleY: SPHERE_REST_ANGLE_Y,
    idleX: SPHERE_REST_ANGLE_X,
    offsetY: 0,
    offsetX: 0,
    burstMs: 0,
    centreX: 0,
    centreY: 0,
    radius: 0,
  };
}

/* -------------------------------------------------------------------------
   Placement
------------------------------------------------------------------------- */

/**
 * Sizes and centres the sphere for a viewport. Design §5 for the box, §6 for
 * the navbar cap.
 *
 * `compact` is passed in rather than derived from a second breakpoint constant:
 * `ParticleGrid` already owns the 768px gate (`INTERACTIVE_MIN_WIDTH`) for the
 * cursor void, and one rule for "this is a touch-sized viewport" is worth more
 * than two that agree today.
 *
 * TAKES NUMBERS, NOT ELEMENTS. It must never be handed a `getBoundingClientRect`
 * from inside the hero's stage wrapper: that wrapper carries a live GSAP
 * transform for the arrival's 1.30s, which puts anything measured against it in
 * a different coordinate space than the canvas. The canvas's own untransformed
 * CSS width and height are the correct source and are already read on rebuild.
 */
export function placeCommandSphere(
  sphere: CommandSphere,
  width: number,
  height: number,
  compact: boolean,
): void {
  // COMPACT IS CENTRED; WIDE INHERITS THE WORDMARK'S BLOCK.
  //
  // The 0.42 offset exists because `SaadGlass` was a WIDE HORIZONTAL BLOCK and
  // had to leave the hero's left third for the DOM tagline sitting beside it.
  // A sphere on a narrow viewport has no such neighbour — the tagline stacks
  // BELOW it, not next to it — so the offset buys nothing there and costs
  // everything: at 360px it put the rim at exactly 360.0px, the viewport edge,
  // before any fragment's text width was even counted, and rim text ran ~78px
  // off-screen.
  //
  // The design spec carried the desktop formula into the compact branch by
  // omission. Corrected here rather than in the spec alone, because the spec is
  // not what renders.
  const blockWidth = Math.min(BLOCK_WIDTH_FRACTION * width, BLOCK_MAX_WIDTH);
  sphere.centreX = compact
    ? width / 2
    : BLOCK_LEFT_FRACTION * width + blockWidth / 2;
  sphere.centreY = height / 2;

  let diameter = compact
    ? Math.min(
        Math.max(D_FRACTION_COMPACT * width, D_MIN_COMPACT),
        D_MAX_COMPACT,
      )
    : Math.min(Math.max(D_FRACTION * width, D_MIN), D_MAX);

  // §6 — a hard cap, not a guideline. The navbar has no scrim and no blur over
  // the hero, deliberately, so command text sliding under nav labels with
  // nothing between them is the worst available failure of that decision. The
  // binding case is a SHORT viewport: 1440x560 caps D from 432 to 384, while
  // 1440x820 and 1024x640 both clear untouched.
  const navHeight = width < NAV_BREAKPOINT ? NAV_HEIGHT_COMPACT : NAV_HEIGHT;
  const maxDiameter = height - 2 * (navHeight + NAV_CLEARANCE);
  diameter = Math.min(diameter, Math.max(0, maxDiameter));

  sphere.radius = diameter / 2;
}

/* -------------------------------------------------------------------------
   Motion
------------------------------------------------------------------------- */

/**
 * Advances the rotation by real elapsed time.
 *
 * NOTHING HERE EVER SNAPS, and that is structural rather than a matter of
 * care: there is no assignment of a pointer-derived value to an angle anywhere
 * in this function. The cursor only ever moves a TARGET, and both the target
 * offsets and the rendered angles reach it through the same lerp. Return to
 * idle is therefore not a separate code path — the target goes to zero and the
 * identical damping carries it home, exactly the way the field's cursor void
 * closes.
 *
 * Auto-rotation is never suspended while the pointer is present: the cursor
 * tilt is an offset ADDED TO the running idle angle, not a replacement for it.
 * A sphere that freezes its spin under the cursor looks broken.
 *
 * A `dtMs` OF 0 IS A NO-OP, BY CONSTRUCTION AND ON PURPOSE. `ParticleGrid`
 * passes 0 on the first frame after a mount or after a parked loop wakes,
 * because there is no previous timestamp to subtract. No time has passed, so
 * the idle target does not advance and `dampingFactor` returns 0, so neither do
 * the angles. The frame is still projected and drawn from the state it already
 * holds; the next frame carries a real delta. Nothing is stranded.
 */
export function startCommandSphereBurst(sphere: CommandSphere): void {
  sphere.burstMs = SPHERE_BURST_MS;
}

export function stepCommandSphere(
  sphere: CommandSphere,
  dtMs: number,
  width: number,
  height: number,
  pointer: PointerInput | null,
): void {
  const dt = clampFrameMs(dtMs);
  // ONE COEFFICIENT FOR ALL FOUR LINES BELOW, computed once. They damp the same
  // way over the same frame, and computing it four times would be four chances
  // for them to stop agreeing.
  const k = dampingFactor(DAMPING, dt);

  /* THE ARRIVAL BURST. `SPHERE_BURST_RATE` carries the whole derivation,
     including why the excess is added to the rendered angle as well as to the
     target and why that is not a snap.

     COUNTED DOWN BY THE CLAMPED `dt`, the same one the rotation uses, so a
     dropped frame or a throttled tab cannot advance the burst further than it
     advances the sphere — the two would otherwise disagree about how much of
     the ease has been spent, and the burst would end mid-amplitude. */
  let burstExcess = 0;
  if (sphere.burstMs > 0) {
    const remaining = sphere.burstMs / SPHERE_BURST_MS;
    // `Math.pow` RATHER THAN `r * r`, and the cost is nothing: this runs once
    // per FRAME for at most 3.2s after a hand-off, not once per fragment. What
    // it buys is that retuning the curve is a one-line edit to a named constant
    // instead of an edit to the arithmetic here — which is how it was written
    // before, and how the exponent came to be a fact about the code rather than
    // a decision with a reason attached to it.
    burstExcess =
      (SPHERE_BURST_RATE - 1) *
      Math.pow(remaining, SPHERE_BURST_EXPONENT);
    sphere.burstMs = Math.max(0, sphere.burstMs - dt);
  }

  sphere.idleY += IDLE_RATE_Y * dt;
  sphere.idleX += IDLE_RATE_X * dt;

  let targetOffsetY = 0;
  let targetOffsetX = 0;
  if (pointer && pointer.active && width > 0 && height > 0) {
    const nx = Math.min(Math.max((pointer.x / width) * 2 - 1, -1), 1);
    const ny = Math.min(Math.max((pointer.y / height) * 2 - 1, -1), 1);
    targetOffsetY = nx * CURSOR_MAX_Y;
    targetOffsetX = ny * CURSOR_MAX_X;
  }

  sphere.offsetY += (targetOffsetY - sphere.offsetY) * k;
  sphere.offsetX += (targetOffsetX - sphere.offsetX) * k;

  sphere.angleY += (sphere.idleY + sphere.offsetY - sphere.angleY) * k;
  sphere.angleX += (sphere.idleX + sphere.offsetX - sphere.angleX) * k;

  /* ADDED TO BOTH SIDES OF THE CHASE, so the difference `idle − angle` — the
     lag the damping maintains — is EXACTLY unchanged and the burst survives it
     at full amplitude. Written after the lerp rather than folded into the two
     lines above so that this property is visible: remove these four lines and
     the rotation is byte-for-byte what it was. `burstExcess` is 0 unless a
     burst is running, so the resting sphere pays two adds and no branch. */
  if (burstExcess !== 0) {
    const exY = IDLE_RATE_Y * dt * burstExcess;
    const exX = IDLE_RATE_X * dt * burstExcess;
    sphere.idleY += exY;
    sphere.angleY += exY;
    sphere.idleX += exX;
    sphere.angleX += exX;
  }
}

/* -------------------------------------------------------------------------
   Projection
------------------------------------------------------------------------- */

/**
 * Rotates, projects and depth-sorts. Writes into `sphere.projected` and returns
 * `sphere.order` sorted far-to-near — a painter's pass, because billboarded
 * flat text never intersects and so never needs a depth buffer.
 *
 * NO BACK-HEMISPHERE CULL HERE, and no mirrored back-hemisphere text. Culling
 * makes fragments pop at the silhouette; mirroring reads as broken rather than
 * as transparency. Small and dim is the correct treatment for the far half, and
 * the alpha ramp above is what delivers it.
 *
 * THE RENDERER NOW CULLS PART OF THE FAR HALF ANYWAY, AND THAT IS A KNOWN,
 * DELIBERATE EXCEPTION RATHER THAN THIS PARAGRAPH GOING STALE.
 * `ParticleGrid.tsx`'s `SPHERE_MIN_ALPHA` drops any fragment under 0.25 alpha,
 * which the ramp above reaches at t = 0.382 — behind the silhouette, so 38% of
 * the set. It was accepted because the alternative was measured and was worse:
 * at 90 fragments, 74.9% of every label drawn overlapped another one and 38.6%
 * of them were painted below 0.25 alpha, i.e. what the ramp was producing in
 * the far half was not depth, it was a haze of illegible strings that the near
 * face had to be read through.
 *
 * THE "POP" HALF OF THE WARNING NO LONGER APPLIES, AND THAT IS A CORRECTION TO
 * WHAT THIS PARAGRAPH SAID A COMMIT AGO. It read: "The paragraph's claim is
 * still true as written: those fragments DO pop, over roughly one frame, and
 * nothing here pretends otherwise." That was accurate when it was written and
 * is not any more. The cull was measured — 3.75 fragments per 5s at 1440 idle
 * leaving in a single frame, from a baseline of 0 — and the renderer now fades
 * them out over 175ms through `SPHERE_FADE_MS`, the same ramp its clip guard
 * uses. So the far half is still culled, and the culling no longer pops.
 *
 * WHICH LEAVES THE WARNING ABOVE INTACT AND WORTH KEEPING. It is the reason the
 * cull had to be paid for with a fade rather than shipped bare, and it is still
 * the reason not to add one HERE: the geometry has no business knowing what is
 * legible, and it has no `dt`, no per-fragment draw state and no way to fade
 * anything.
 *
 * "SMALL AND DIM IS THE CORRECT TREATMENT" IS NARROWED, NOT REVERSED:
 * it is correct down to the point where a fragment stops being readable text,
 * and past that point there is nothing left for it to be the correct treatment
 * OF. The ramp is unchanged and still owns the whole far half's appearance; the
 * renderer just stops painting the tail of it. Do not implement a cull in this
 * file — the geometry has no business knowing what is legible, and a second
 * cull that had to agree with the renderer's is how the two would drift.
 *
 * The returned order is also what makes the draw pass cheap: `t` is monotonic
 * along it, so the tint stop and the glow flag each change at most once across
 * the whole loop instead of per fragment. (It listed "the scale bucket" first
 * until 2026-08-24; there is no bucket, and `ctx.font` is assigned once per
 * frame regardless of order.)
 */
export function projectCommandSphere(sphere: CommandSphere): readonly number[] {
  const { fragments, projected, order, centreX, centreY, radius } = sphere;
  const scaled = radius / PERSPECTIVE_FIT;

  for (let i = 0; i < fragments.length; i++) {
    const f = fragments[i];
    const r = rotate(f.ux, f.uy, f.uz, sphere.angleY, sphere.angleX);

    const s = PERSPECTIVE / (PERSPECTIVE - r.z);
    const t = (r.z + 1) / 2;

    const p = projected[i];
    p.x = centreX + r.x * scaled * s;
    p.y = centreY + r.y * scaled * s;
    // The label is SIZED by the same divide that POSITIONS it — see
    // `SCALE_NORM`. `s * SCALE_NORM` is `(f - 1) / (f - z)`, one multiply
    // against the `s` already computed for x/y rather than a second divide.
    p.scale = s * SCALE_NORM;
    p.alpha = ALPHA_FAR + ALPHA_SPAN * Math.pow(t, ALPHA_EXPONENT);
    p.near = t > NEAR_TINT_T;
    p.glow = t > GLOW_T;
  }

  // INSERTION SORT, NOT `Array.prototype.sort`, for two reasons that both
  // matter inside a 60Hz tick. It takes no comparator, so nothing allocates a
  // closure per frame; and the array is already almost sorted — the sphere
  // turns a fraction of a degree between frames, so only a handful of adjacent
  // pairs ever swap. That makes this O(n) in practice where a general sort is
  // O(n log n) every time regardless.
  //
  // Keyed on `scale`, which is strictly increasing in `t` — no longer LINEAR in
  // it since the ramp became the perspective divide, but `d(scale)/dz` is
  // `(f-1)/(f-z)^2 > 0` everywhere on [-1, 1], so the ORDER this produces is
  // identical to a z-order and the near-sortedness this loop relies on is
  // exactly as true as it was. Monotonicity is what matters here, not shape,
  // and `scale` is a strictly increasing function of depth — so sorting on it
  // IS sorting on depth. Using it avoids carrying a second field whose only job
  // is to be the sort key, and it makes the size monotonicity the draw pass
  // relies on true by construction rather than by coincidence. (It said
  // "bucket monotonicity"; the buckets went on 2026-08-24, the property did
  // not.)
  //
  // (This sentence read "Monotonicity is what matters here, not shape —
  // therefore of depth." for two commits: a clause was lost in an edit and the
  // remainder still parsed as English. Repaired 2026-08-24.)
  for (let i = 1; i < order.length; i++) {
    const index = order[i];
    const key = projected[index].scale;
    let j = i - 1;
    while (j >= 0 && projected[order[j]].scale > key) {
      order[j + 1] = order[j];
      j--;
    }
    order[j + 1] = index;
  }
  return order;
}

/* -------------------------------------------------------------------------
   The void
------------------------------------------------------------------------- */

/**
 * The mesh's permanent tear, as a single circle.
 *
 * ONE ANCHOR, NOT FIVE, and that is the same reasoning as before applied to the
 * opposite shape rather than an abandonment of it. The wordmark got five
 * because a name is a wide rectangle and one circular void either failed to
 * clear the ends or blew a hole far taller than the text. A sphere is radially
 * symmetric, so one circle at its projected centre is exactly right.
 */
export function commandSphereVoid(sphere: CommandSphere): {
  cx: number;
  cy: number;
  radius: number;
} {
  return {
    cx: sphere.centreX,
    cy: sphere.centreY,
    radius: sphere.radius + VOID_MARGIN,
  };
}
