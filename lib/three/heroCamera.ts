/**
 * Hero camera: viewport stops, fit-to-bounds maths, and the two poses.
 *
 * UNIT CONVENTION — everything here is in world units where the CAP HEIGHT of
 * the built wordmark is exactly 1.0 (see HeroName's `size`). Every number below
 * is therefore resolution- and viewport-independent, and they are all wrong
 * together if that normalisation is ever broken.
 *
 * The camera is described as a spherical offset from a look-at target rather
 * than as a raw position, because the pull-back animates BOTH the distance and
 * the angles — the composition assembles into its reading position instead of
 * the camera merely retreating from it.
 */

import { Box3, Matrix4, Vector3 } from "three";

export type ViewportBucket = "mobile" | "desktop";

export type CameraStop = {
  /** Vertical FOV in degrees. */
  fov: number;
  /** Fraction of frame WIDTH the wordmark spans. 0.62 => 19% margin each side. */
  widthFill: number;
  /** Maximum fraction of frame HEIGHT the wordmark may occupy. */
  heightFill: number;
  /**
   * Degrees, rotation about world Y. Negative puts the camera left of centre,
   * so the extrusion recedes to the right.
   */
  yaw: number;
  /**
   * Degrees. Positive puts the camera ABOVE the target, looking slightly down —
   * which is what brings the cyan rim on the top bevels into frame. A low
   * heroic angle would look up into unlit bevel undersides.
   */
  pitch: number;
};

/**
 * Three stops, chosen by viewport WIDTH.
 *
 * FOV stays long (30deg) on desktop deliberately. A wide 60-75deg lens is the
 * default in every R3F starter and it produces heavy convergence across the
 * word — the trailing D visibly larger than the S — which reads as "3D demo".
 * A long lens keeps the four letters typographically even, so the wordmark
 * reads as type that happens to be solid. Do not widen it.
 *
 * Mobile widens the lens only because the frame is narrow, and compensates for
 * the depth cue it loses by increasing yaw (and, in HeroName, extrusion depth):
 * at the mobile fit distance the front/back parallax of the extrusion is about
 * 1% of frame width, so without compensation the depth simply vanishes.
 */
export const CAMERA_STOPS = {
  desktop: { fov: 30, widthFill: 0.62, heightFill: 0.32, yaw: -12, pitch: 7 },
  tablet: { fov: 34, widthFill: 0.7, heightFill: 0.3, yaw: -14, pitch: 6 },
  mobile: { fov: 38, widthFill: 0.8, heightFill: 0.28, yaw: -18, pitch: 6 },
} as const satisfies Record<string, CameraStop>;

export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 40;

/**
 * Look-at target offset from the wordmark's centre.
 *
 * Pushing the target DOWN lifts the wordmark to ~42% of viewport height rather
 * than dead centre, which opens the lower third for the tagline and chevron
 * column. A dead-centre wordmark with text underneath is the generic stack.
 */
export const RESTING_TARGET_OFFSET = new Vector3(0, -0.3, 0);

/**
 * Start pose: tight enough to be ABSTRACT, not merely cropped.
 *
 * At 20% of the resting distance the frame is roughly 1.4 cap-heights wide —
 * about one and a third letters, held at an angle. It reads as extruded
 * surface, bevel edge and a cyan highlight, and is deliberately NOT legible as
 * text: "half the word visible" is the worst option, because AA briefly looks
 * like a different name.
 *
 * The rotation deltas do as much work as the dolly. Pulling back AND
 * un-rotating is what makes the composition assemble; a pure dolly at a fixed
 * angle is the generic version.
 */
export const START_DISTANCE_RATIO = 0.2;
export const START_TARGET_OFFSET = new Vector3(-1.05, 0.12, 0);
export const START_YAW_DELTA = -14;
export const START_PITCH_DELTA = 7;

export function stopForWidth(width: number): CameraStop {
  if (width >= 1024) return CAMERA_STOPS.desktop;
  if (width >= 640) return CAMERA_STOPS.tablet;
  return CAMERA_STOPS.mobile;
}

/**
 * Viewport bucket for scene COST (particle counts, segment counts) — a
 * different question from the camera stop above, which is about framing.
 *
 * Gated on pointer capability as well as width, so a narrow desktop window
 * keeps the desktop scene while a wide touch tablet does not get connection
 * lines it cannot afford. Bucketed ONCE at mount: reallocating typed arrays
 * mid-scroll is worse jank than the thing it would optimise.
 */
export function bucketForViewport(width: number): ViewportBucket {
  const finePointer =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches;
  return width >= 768 && finePointer ? "desktop" : "mobile";
}

const DEG = Math.PI / 180;

/** Unit vector pointing from the look-at target toward the camera. */
export function orbitDirection(yawDeg: number, pitchDeg: number): Vector3 {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  return new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ).normalize();
}

/**
 * Distance at which `bounds` fits the frame, given a stop and an aspect ratio.
 *
 * CONTAIN, not cover: the max of the width-driven and height-driven distances,
 * so an ultrawide viewport stops the wordmark growing at `heightFill` instead
 * of letting it become a 1600px-wide billboard.
 *
 * The bbox corners are projected into CAMERA SPACE before measuring, and that
 * matters: the yaw widens the projected footprint by a few percent, so fitting
 * against the raw axis-aligned width silently eats the margin and the wordmark
 * kisses the right edge on a narrow viewport.
 *
 * `bounds` must be the FRONT-FACE box (glyph silhouette), not the full extruded
 * box — otherwise tuning the extrusion depth would shrink the wordmark, which
 * reads as the fit being broken rather than as the depth changing.
 */
export function fitDistance(
  bounds: Box3,
  stop: CameraStop,
  aspect: number,
): number {
  const direction = orbitDirection(stop.yaw, stop.pitch);

  // Rotation only — a lookAt from `direction` toward the origin. Distance is
  // what we are solving for, so it must not appear here.
  const rotation = new Matrix4().lookAt(
    direction,
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0),
  );
  const inverse = rotation.clone().invert();

  const center = bounds.getCenter(new Vector3());
  const corner = new Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < 8; i++) {
    corner.set(
      i & 1 ? bounds.max.x : bounds.min.x,
      i & 2 ? bounds.max.y : bounds.min.y,
      i & 4 ? bounds.max.z : bounds.min.z,
    );
    corner.sub(center).applyMatrix4(inverse);
    minX = Math.min(minX, corner.x);
    maxX = Math.max(maxX, corner.x);
    minY = Math.min(minY, corner.y);
    maxY = Math.max(maxY, corner.y);
  }

  const projectedWidth = maxX - minX;
  const projectedHeight = maxY - minY;
  const tanHalfFov = Math.tan((stop.fov * DEG) / 2);

  const distanceForWidth =
    projectedWidth / (2 * tanHalfFov * aspect) / stop.widthFill;
  const distanceForHeight = projectedHeight / (2 * tanHalfFov) / stop.heightFill;

  return Math.max(distanceForWidth, distanceForHeight);
}

export type CameraPose = {
  position: Vector3;
  target: Vector3;
};

export function restingPose(
  textCenter: Vector3,
  stop: CameraStop,
  distance: number,
): CameraPose {
  const target = textCenter.clone().add(RESTING_TARGET_OFFSET);
  const position = target
    .clone()
    .add(orbitDirection(stop.yaw, stop.pitch).multiplyScalar(distance));
  return { position, target };
}

export function startPose(
  textCenter: Vector3,
  stop: CameraStop,
  distance: number,
): CameraPose {
  const target = textCenter.clone().add(START_TARGET_OFFSET);
  const position = target
    .clone()
    .add(
      orbitDirection(
        stop.yaw + START_YAW_DELTA,
        stop.pitch + START_PITCH_DELTA,
      ).multiplyScalar(distance * START_DISTANCE_RATIO),
    );
  return { position, target };
}

/**
 * Front-face box of an extruded geometry: the glyph silhouette flattened onto
 * the front plane. See `fitDistance` for why the extrusion must be excluded,
 * and ParticleField for the second consumer (the exclusion shell).
 */
export function frontFaceBounds(full: Box3): Box3 {
  return new Box3(
    new Vector3(full.min.x, full.min.y, full.max.z),
    new Vector3(full.max.x, full.max.y, full.max.z),
  );
}
