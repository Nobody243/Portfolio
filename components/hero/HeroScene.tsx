"use client";

/**
 * Everything inside the canvas: camera, the three-light rig, the wordmark and
 * the field.
 *
 * THE CAMERA'S DEFAULT POSE IS THE RESTING POSE, not the start pose. Under
 * reduced motion exactly one frame is ever painted, so whatever a thing holds
 * at construction is the only value the user will ever see. The pull-back is
 * therefore implemented as "move AWAY from the default, then return to it" —
 * build it the other way round and a reduced-motion visitor gets one frame of
 * a broken composition.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera, Preload } from "@react-three/drei";
import type { FontData } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Box3,
  Color,
  Vector3,
  type PerspectiveCamera as ThreePerspectiveCamera,
} from "three";

import { HeroName } from "@/components/hero/HeroName";
import { LiquidBlob } from "@/components/hero/LiquidBlob";
import { readAccentHero } from "@/lib/three/accentHero";
import {
  CAMERA_FAR,
  CAMERA_NEAR,
  fitDistance,
  restingPose,
  stopForWidth,
  type CameraStop,
  type ViewportBucket,
} from "@/lib/three/heroCamera";
import {
  HERO_AMBIENT_COLOR,
  HERO_FILL_COLOR,
} from "@/lib/three/heroPalette";

export type SceneMeasurements = {
  bounds: Box3;
  center: Vector3;
  /** Fit-derived resting distance, in world units. */
  distance: number;
  /** The stop the fit was solved against — the hero needs it to build the
   *  start pose without re-deriving the breakpoint independently. */
  stop: CameraStop;
};

type HeroSceneProps = {
  font: FontData;
  bucket: ViewportBucket;
  /** Fires once the geometry is measured and the fit is solved, so the hero can
   *  build its camera timeline against real numbers. */
  onReady: (measurements: SceneMeasurements) => void;
  /** Registers the camera so the GSAP timeline can drive it from outside. */
  onCamera: (camera: ThreePerspectiveCamera) => void;
  /**
   * False while the pull-back is running.
   *
   * Without this, a resize mid-reveal would re-run the placement effect below
   * and snap the camera to its resting pose halfway through the animation —
   * the tween would keep writing, but from a position it never started at.
   */
  applyRestingPose: boolean;
};

export function HeroScene({
  font,
  bucket,
  onReady,
  onCamera,
  applyRestingPose,
}: HeroSceneProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const { size } = useThree();
  const [measured, setMeasured] = useState<{ bounds: Box3; center: Vector3 } | null>(
    null,
  );

  const accentHero = useMemo(() => readAccentHero(), []);

  /**
   * The same accent as a Vector3 for `LiquidBlob`'s shader uniform. Built here
   * rather than in that component so the hex is read from CSS exactly once per
   * scene, and so the blob and the key light are provably the same colour.
   *
   * `Color` handles the hex parse and the colour-space convention the renderer
   * expects; pulling `.r/.g/.b` off it avoids hand-rolling a second parser
   * that would drift from this one.
   */
  const accentVec = useMemo(() => {
    const c = new Color(accentHero);
    return new Vector3(c.r, c.g, c.b);
  }, [accentHero]);
  const stop = useMemo(() => stopForWidth(size.width), [size.width]);

  const handleMeasured = useCallback((bounds: Box3, center: Vector3) => {
    setMeasured((current) => (current ? current : { bounds, center }));
  }, []);

  /**
   * WIDTH ONLY — never height. `dvh` changes continuously on mobile as the URL
   * bar collapses and expands during scroll, which resizes the canvas and would
   * make a naive fit recompute `D` every frame, visibly rescaling the wordmark
   * mid-scroll. The URL bar only ever changes height, so keying on width (and
   * therefore on orientation) filters it out completely while still handling
   * rotation and desktop window resizing.
   *
   * R3F still updates `camera.aspect` itself on every resize; that is correct
   * and must not be suppressed. Only OUR distance recomputation is filtered.
   */
  const distance = useMemo(() => {
    if (!measured) return null;
    // `size.height` is read here but deliberately NOT a dependency: the height
    // in effect at the moment of a width change is the correct aspect to solve
    // against, and depending on it would reintroduce the URL-bar rescale.
    return fitDistance(measured.bounds, stop, size.width / Math.max(size.height, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, stop, size.width]);

  // Place the camera at its RESTING pose as soon as the fit is known, and hand
  // both the camera and the measurements upward. The hero decides whether to
  // animate away from here.
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera || !measured || distance === null) return;

    // FOV still tracks the stop even mid-reveal — it is a framing property, not
    // a position, and the reveal deliberately does not animate it.
    camera.fov = stop.fov;
    camera.updateProjectionMatrix();

    if (applyRestingPose) {
      const pose = restingPose(measured.center, stop, distance);
      camera.position.copy(pose.position);
      camera.lookAt(pose.target);
    }

    onCamera(camera);
    onReady({
      bounds: measured.bounds,
      center: measured.center,
      distance,
      stop,
    });
  }, [measured, distance, stop, onCamera, onReady, applyRestingPose]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={stop.fov}
        near={CAMERA_NEAR}
        far={CAMERA_FAR}
      />

      {/*
        THREE LIGHTS, ONE JOB EACH. If the answer to a lighting problem is "add
        a fourth light", the answer is actually "move one of these three".

        Deliberately absent: <Environment> (an HDR fetch on the LCP surface),
        <Stage>, <ContactShadows>, and <Float> — whose idle drift is an instant
        drei signature and would contradict the "one move" rule outright.
      */}
      <ambientLight color={HERO_AMBIENT_COLOR} intensity={0.15} />

      {/* The signature image. BEHIND the type (negative Z) so it grazes the top
          bevels and the camera-right side walls rather than washing the front
          faces — a grazing highlight tracing the letterforms is exactly how the
          accent policy wants cyan to appear: as a lighting result. */}
      <directionalLight
        color={accentHero}
        intensity={2.6}
        position={[2.2, 1.6, -1.4]}
      />

      {/* Neutral fill, front-left. This is what keeps the front faces from
          being pure black in a STILL — a hero that only looks like anything in
          motion is a hero that dies in a social preview. */}
      <directionalLight
        color={HERO_FILL_COLOR}
        intensity={0.45}
        position={[-1.8, 0.6, 2.4]}
      />

      <HeroName font={font} bucket={bucket} onMeasured={handleMeasured} />

      {/*
        The liquid. Ungated on `measured` — it clips against the STENCIL the
        wordmark writes, not against a measured bounding box, so there is
        nothing for it to wait on. Before the glyphs exist the stencil is empty
        and the shader simply paints nothing, which is the correct first frame.
      */}
      <LiquidBlob accent={accentVec} />

      {/* Forces shader compilation before the first visible frame, which is the
          "scene-ready" milestone the loader's last 15% actually measures. */}
      <Preload all />
    </>
  );
}

export default HeroScene;
