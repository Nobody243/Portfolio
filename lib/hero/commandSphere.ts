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
 */

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

const SCALE_FAR = 0.62;
const SCALE_SPAN = 0.38;

/**
 * The scale range, exported so the draw pass can bucket into it.
 *
 * The renderer has to quantise `scale` to a handful of steps — assigning
 * `ctx.font` is a string parse and doing it ninety times a frame is the single
 * cheapest thing to get wrong here — and it cannot pick sensible bucket
 * boundaries without knowing the range the ramp actually produces. Exporting
 * the two endpoints is cheaper than exporting a bucketing function that would
 * drag a rendering concern into a module whose whole point is not having any.
 */
export const SPHERE_SCALE_MIN = SCALE_FAR;
export const SPHERE_SCALE_MAX = SCALE_FAR + SCALE_SPAN;

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
 * hero. 2.5 is the plan's starting value, tuning window 2.0–4.0.
 */
const PERSPECTIVE = 2.5;

/**
 * A perspective divide makes the SILHOUETTE bulge past the geometric radius —
 * the widest ring is not the equator but the circle at z = 1/f, and it projects
 * to `f / sqrt(f² − 1)` times the radius (1.091x at f = 2.5).
 *
 * THIS IS DIVIDED OUT, NOT IGNORED, and that is not cosmetic. Design §6's
 * navbar cap is stated in terms of the diameter D: `D = min(D, vh − 2(navH +
 * 24))`. If the drawn disc were 9% wider than D the cap would be computing
 * clearance for a sphere that is not the one on screen, and the 1440x560 case
 * the rule exists for would fail by ~17px while the arithmetic still looked
 * right. Dividing here makes "the projected disc is exactly D wide" true.
 */
const PERSPECTIVE_FIT =
  PERSPECTIVE / Math.sqrt(PERSPECTIVE * PERSPECTIVE - 1);

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

const D_FRACTION = 0.3;
const D_MIN = 280;
const D_MAX = 520;

const D_FRACTION_COMPACT = 0.62;
const D_MIN_COMPACT = 200;
const D_MAX_COMPACT = 260;

/**
 * The navbar's occupied height, from `Navbar.tsx`'s container: `py-sm` below
 * 640, `sm:py-md` at 640 and above, tallest child 22px.
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
 */
const DAMPING = 0.06;

/**
 * A single frame's `dt` is clamped to this. rAF stops firing in a background
 * tab, so the first frame after a return carries the whole hidden interval —
 * unclamped, a visitor coming back from another tab sees the sphere teleport
 * through half a revolution.
 */
const MAX_DT_MS = 50;

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
  /** Font scale, `SCALE_FAR`..1. */
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
 * transform for the arrival's 1.6s, which puts anything measured against it in
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
 */
export function stepCommandSphere(
  sphere: CommandSphere,
  dtMs: number,
  width: number,
  height: number,
  pointer: PointerInput | null,
): void {
  const dt = Math.min(Math.max(dtMs, 0), MAX_DT_MS);

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

  sphere.offsetY += (targetOffsetY - sphere.offsetY) * DAMPING;
  sphere.offsetX += (targetOffsetX - sphere.offsetX) * DAMPING;

  sphere.angleY += (sphere.idleY + sphere.offsetY - sphere.angleY) * DAMPING;
  sphere.angleX += (sphere.idleX + sphere.offsetX - sphere.angleX) * DAMPING;
}

/* -------------------------------------------------------------------------
   Projection
------------------------------------------------------------------------- */

/**
 * Rotates, projects and depth-sorts. Writes into `sphere.projected` and returns
 * `sphere.order` sorted far-to-near — a painter's pass, because billboarded
 * flat text never intersects and so never needs a depth buffer.
 *
 * NO BACK-HEMISPHERE CULL, and no mirrored back-hemisphere text. Culling makes
 * fragments pop at the silhouette; mirroring reads as broken rather than as
 * transparency. Small and dim is the correct treatment for the far half, and
 * the alpha ramp above is what delivers it.
 *
 * The returned order is also what makes the draw pass cheap: `t` is monotonic
 * along it, so the scale bucket, the tint stop and the glow flag each change at
 * most once across the whole loop instead of per fragment.
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
    p.scale = SCALE_FAR + SCALE_SPAN * t;
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
  // Keyed on `scale`, which is a strictly increasing linear function of `t` and
  // therefore of depth. Using it avoids carrying a second field whose only job
  // is to be the sort key, and it makes the bucket monotonicity the draw pass
  // relies on true by construction rather than by coincidence.
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
