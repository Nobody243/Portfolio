"use client";

/**
 * PLACEHOLDER — DELETED IN TICKET 3.
 *
 * Exists only to prove the R3F pipeline actually renders under React 19 /
 * Next 16 / Turbopack: one unlit wireframe icosahedron in `accent-hero`, no
 * lights, no camera rig, no animation, no post-processing. Ticket 3 owns every
 * one of those and replaces this file wholesale.
 *
 * Deliberately a client component that renders <SceneCanvas> itself, rather
 * than the page passing three elements as children: `<mesh>` and friends are
 * not DOM elements, so handing them across the server/client boundary as
 * serialized RSC children is a trap worth not setting.
 */

import { useMemo } from "react";

import { SceneCanvas } from "@/components/hero/SceneCanvas";
import { readAccentHero } from "@/lib/three/accentHero";

function PlaceholderMesh() {
  // Safe to touch the DOM during render here: scene children are mounted by
  // R3F's reconciler on the client only. See lib/three/accentHero.ts.
  const accentHero = useMemo(() => readAccentHero(), []);

  return (
    <mesh>
      <icosahedronGeometry args={[1.4, 0]} />
      {/* Unlit on purpose — a lit material would mean a lighting setup, which
          is Tier 1 design work owned by Ticket 3. */}
      <meshBasicMaterial color={accentHero} wireframe />
    </mesh>
  );
}

export function PlaceholderScene() {
  return (
    <SceneCanvas>
      <PlaceholderMesh />
    </SceneCanvas>
  );
}

export default PlaceholderScene;
