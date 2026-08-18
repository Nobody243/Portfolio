"use client";

/**
 * The extruded `SAAD` wordmark — real geometry, not an SDF plane or a texture.
 *
 * CAP HEIGHT IS NORMALISED TO 1.0 WORLD UNIT. Every 3D number in this ticket
 * (camera distances, particle slab bounds, glow radius) is expressed in those
 * units, so they are all wrong together if this is broken. See `TEXT_SIZE`.
 *
 * It reports its measured front-face bounds upward, because two other things
 * are derived from them and neither may hardcode a width:
 *   - the camera fit (heroCamera.fitDistance)
 *   - the particle exclusion shell (ParticleField)
 */

import { useCallback, useMemo } from "react";
import { Center, Text3D } from "@react-three/drei";
import type { FontData } from "@react-three/drei";
import { Box3, Vector3, type Mesh } from "three";

import { HERO_WORDMARK } from "@/components/hero/heroContent";
import { frontFaceBounds, type ViewportBucket } from "@/lib/three/heroCamera";
import { readAccentHero } from "@/lib/three/accentHero";
import { HERO_TEXT_COLOR } from "@/lib/three/heroPalette";

/**
 * Space Grotesk's OS/2 capHeight is 700 per 1000 em (recorded in
 * public/fonts/README.md), so a `size` of 1/0.7 makes the cap height exactly
 * 1.0 world unit. Derived rather than typed as 1.4286 so the relationship
 * survives a font change.
 */
const CAP_HEIGHT_EM = 0.7;
export const TEXT_SIZE = 1 / CAP_HEIGHT_EM;

/**
 * Tracking, in WORLD UNITS — verified against three-stdlib's FontLoader, which
 * does `offsetX += glyph.ha * scale + letterSpacing`, i.e. it adds this value
 * raw rather than scaling it by `size`.
 *
 * Space Grotesk's default caps tracking is tight, and the bevel visually
 * thickens every stem, so extruded `SAAD` reads as jammed together without
 * this. The gap between letters is the difference between a wordmark and a
 * noun.
 */
const LETTER_SPACING_EM = 0.06;
const LETTER_SPACING = LETTER_SPACING_EM * TEXT_SIZE;

type GeometryProfile = {
  /** Extrusion depth as a ratio of cap height. NOT 0.5+ — a deep slab is the
   *  3D-logo look this hero is specifically avoiding. */
  height: number;
  bevelSegments: number;
  curveSegments: number;
};

/**
 * Mobile gets a DEEPER extrusion, which looks backwards for a perf profile and
 * is not one: it is a design compensation. At the mobile fit distance the
 * front/back parallax of a 0.22 extrusion is ~1% of frame width, so the depth
 * would effectively vanish. The perf levers here are the two segment counts.
 */
const GEOMETRY: Record<ViewportBucket, GeometryProfile> = {
  desktop: { height: 0.22, bevelSegments: 4, curveSegments: 10 },
  mobile: { height: 0.28, bevelSegments: 2, curveSegments: 5 },
};

/** A hairline chamfer whose only job is to catch one bright line off the rim
 *  light. A large soft bevel gives rounded plastic/chrome and blurs the
 *  silhouette, which is the thing actually carrying the identity. */
const BEVEL_THICKNESS = 0.018;
const BEVEL_SIZE = 0.014;

type HeroNameProps = {
  font: FontData;
  bucket: ViewportBucket;
  /** Receives the FRONT-FACE bounds and centre once the geometry is built. */
  onMeasured: (bounds: Box3, center: Vector3) => void;
};

export function HeroName({ font, bucket, onMeasured }: HeroNameProps) {
  const profile = GEOMETRY[bucket];

  // Safe to read CSS during render: R3F mounts scene children on the client
  // only, through the three reconciler. See lib/three/accentHero.ts.
  const accentHero = useMemo(() => readAccentHero(), []);

  const handleRef = useCallback(
    (mesh: Mesh | null) => {
      if (!mesh?.geometry) return;

      mesh.geometry.computeBoundingBox();
      const full = mesh.geometry.boundingBox;
      if (!full) return;

      // <Center> offsets the GROUP, so geometry-local bounds are still centred
      // on the wordmark's own origin — which is what both consumers want.
      const front = frontFaceBounds(full);
      onMeasured(front, front.getCenter(new Vector3()));
    },
    [onMeasured],
  );

  return (
    <Center>
      <Text3D
        ref={handleRef}
        font={font}
        size={TEXT_SIZE}
        height={profile.height}
        letterSpacing={LETTER_SPACING}
        bevelEnabled
        bevelThickness={BEVEL_THICKNESS}
        bevelSize={BEVEL_SIZE}
        bevelOffset={0}
        bevelSegments={profile.bevelSegments}
        curveSegments={profile.curveSegments}
      >
        {HERO_WORDMARK}
        {/*
          `color` is NEAR-BLACK and must stay that way. Setting it to
          accent-hero is a flat fill and the single most likely accent
          violation in this hero — cyan reaches this mesh only as rim LIGHT,
          as bounded emissive below, and (if ever built) the cursor glow.

          `emissiveIntensity` has a HARD CEILING OF 0.12. Emissive is
          technically a flat additive across the whole surface; it is
          compliant only because it is bounded well below the point where the
          letters stop reading as a dark material catching cyan light and
          start reading as cyan-coloured objects. If the front faces read as
          flat black in a still, lower `metalness` toward 0.45 FIRST — do not
          reach for emissive.
        */}
        <meshStandardMaterial
          color={HERO_TEXT_COLOR}
          metalness={0.6}
          roughness={0.38}
          emissive={accentHero}
          emissiveIntensity={0.06}
        />
      </Text3D>
    </Center>
  );
}

export default HeroName;
