"use client";

/**
 * The ambient field the wordmark sits inside.
 *
 * INTENDED READ: a thin stratum of instrumented space — mostly dark, mostly
 * neutral, with a minority of live cyan nodes and occasional hairline links
 * between them. NOT a starfield, not a snowglobe, not particles.js.
 *
 * The single most important rule here is the colour split: the field is ~80%
 * neutral grey and only ~20% accent. An all-cyan field is a screensaver, and it
 * spends the Tier 1 accent on the cheapest layer in the scene.
 *
 * ORDERING CONSTRAINT — the buffers are memoised on [bucket, bounds], NOT on
 * bucket alone. The exclusion shell below is defined against the wordmark's
 * measured front-face bbox, which does not exist until the typeface resolves
 * and the geometry is built. Generate before that and the shell silently
 * no-ops: particles sit inside the counters of A/A/D, and it reads as "the
 * field looks a bit noisy" rather than as a bug. Because the bbox resolves
 * exactly once, this is still a single generation — no per-resize reallocation.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Box3,
  BufferGeometry,
  Color,
  ShaderMaterial,
  type Points,
} from "three";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { readAccentHero } from "@/lib/three/accentHero";
import { HERO_MOTE_COLOR } from "@/lib/three/heroPalette";
import type { ViewportBucket } from "@/lib/three/heroCamera";

/* -------------------------------------------------------------------------
   Field constants. World units, cap height = 1.0.
------------------------------------------------------------------------- */

/** A flattened, anisotropic slab — deeper behind the type than in front of it,
 *  so the field reads as a band that thins out rather than a box that ends. */
const SLAB = { x: 5.6, y: 2.6, zBack: -4.5, zFront: 1.0 };

/** Reject samples within this distance of the expanded front-face bbox, but
 *  ONLY near the reading plane. Particles further back still read as behind
 *  the type, which is the point — this shell exists to keep the letterforms
 *  clean, not to hollow out the field. */
const EXCLUSION_MARGIN = 0.3;
const EXCLUSION_Z = 0.6;

const COUNTS: Record<ViewportBucket, number> = { desktop: 1100, mobile: 320 };
const NODE_SHARE = 0.2;

/** Links are desktop-only. On mobile the neighbour recomputation competes with
 *  scroll for main-thread time, and at ~64 nodes in a small frame the links
 *  would read as random noise rather than as a network — so their absence is
 *  not a visible downgrade. */
const LINKS_ENABLED: Record<ViewportBucket, boolean> = {
  desktop: true,
  mobile: false,
};

const LINK_DISTANCE = 0.55;
const LINK_MAX_PER_NODE = 2;
const LINK_MAX_SEGMENTS = 256;
const LINK_PEAK_ALPHA = 0.18;
/** Drift is 1-4 px/s on screen, so nobody can perceive a 100ms-stale link.
 *  This is a design-sanctioned licence, not a corner cut. */
const LINK_REBUILD_HZ = 10;

const DRIFT_MIN = 0.008;
const DRIFT_MAX = 0.02;
const WANDER_AMPLITUDE = 0.02;
const WANDER_PERIOD_MIN = 6;
const WANDER_PERIOD_MAX = 11;

/** Deterministic PRNG so the t=0 distribution is identical every load — which
 *  matters because under reduced motion that frame is the ONLY frame painted. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

type FieldBuffers = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  /** Per-particle drift velocity. */
  velocities: Float32Array;
  /** Per-particle [amplitude, angularFrequency, phase] for the Y wander. */
  wander: Float32Array;
  /** Indices of the accent-coloured subset, for link building. */
  nodeIndices: Uint16Array;
  count: number;
};

function buildField(
  bucket: ViewportBucket,
  bounds: Box3,
  accentHex: string,
): FieldBuffers {
  const count = COUNTS[bucket];
  const random = makeRandom(0x5a4d);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const sizes = new Float32Array(count);
  const velocities = new Float32Array(count * 3);
  const wander = new Float32Array(count * 3);
  const nodeIndices: number[] = [];

  const accent = new Color(accentHex);
  const mote = new Color(HERO_MOTE_COLOR);

  const shell = bounds.clone().expandByScalar(EXCLUSION_MARGIN);

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let z = 0;

    // Rejection sampling against three shaping rules at once: the quadratic Y
    // taper (no hard top/bottom edge), the front-sparse Z taper, and the
    // exclusion shell around the letterforms.
    for (let attempt = 0; attempt < 64; attempt++) {
      x = (random() * 2 - 1) * SLAB.x;
      y = (random() * 2 - 1) * SLAB.y;
      z = SLAB.zBack + random() * (SLAB.zFront - SLAB.zBack);

      const yDensity = 1 - (Math.abs(y) / SLAB.y) ** 2;
      const zDensity = 1 - 0.7 * smoothstep(-1, 1, z);
      if (random() > yDensity * zDensity) continue;

      const nearReadingPlane = Math.abs(z) < EXCLUSION_Z;
      const insideShell =
        x >= shell.min.x &&
        x <= shell.max.x &&
        y >= shell.min.y &&
        y <= shell.max.y;
      if (nearReadingPlane && insideShell) continue;

      break;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const isNode = random() < NODE_SHARE;
    const colour = isNode ? accent : mote;
    const alpha = isNode
      ? 0.55 + random() * 0.35
      : 0.22 + random() * 0.33;

    colors[i * 4] = colour.r;
    colors[i * 4 + 1] = colour.g;
    colors[i * 4 + 2] = colour.b;
    colors[i * 4 + 3] = alpha;
    if (isNode) nodeIndices.push(i);

    // A size POPULATION, not one uniform dot — a single dot size is what makes
    // a field read as a generated grid.
    const sizeRoll = random();
    sizes[i] = sizeRoll < 0.7 ? 0.014 : sizeRoll < 0.95 ? 0.022 : 0.034;

    // Independent per-particle direction. No global rotation anywhere: a
    // turntable on the field is an instant drei tell.
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(random() * 2 - 1);
    const speed = DRIFT_MIN + random() * (DRIFT_MAX - DRIFT_MIN);
    velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i * 3 + 2] = Math.cos(phi) * speed;

    wander[i * 3] = WANDER_AMPLITUDE;
    wander[i * 3 + 1] =
      (Math.PI * 2) /
      (WANDER_PERIOD_MIN + random() * (WANDER_PERIOD_MAX - WANDER_PERIOD_MIN));
    wander[i * 3 + 2] = random() * Math.PI * 2;
  }

  return {
    positions,
    colors,
    sizes,
    velocities,
    wander,
    nodeIndices: Uint16Array.from(nodeIndices),
    count,
  };
}

/* -------------------------------------------------------------------------
   Points shader.

   A custom shader rather than PointsMaterial because the design needs a
   per-vertex SIZE attribute (PointsMaterial has one uniform size) and
   per-particle alpha. Additive blending is what makes the cyan read as light
   rather than as paint — it is the substitute for bloom, and the reason the
   hero surface must stay dark in both themes.
------------------------------------------------------------------------- */

const pointsVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec4 aColor;
  varying vec4 vColor;
  uniform float uScale;
  uniform float uMaxPixels;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // sizeAttenuation, matching three's own formula. Clamped because a single
    // particle drifting near the camera and ballooning into a visible disc is
    // the classic attenuation bug.
    float attenuated = aSize * uScale / max(-mvPosition.z, 0.0001);
    gl_PointSize = min(attenuated, uMaxPixels);
  }
`;

const pointsFragmentShader = /* glsl */ `
  varying vec4 vColor;

  void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float d = length(offset);
    if (d > 0.5) discard;

    // Soft round sprite. A hard-edged square point is the other classic tell.
    float falloff = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor.rgb, vColor.a * falloff);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Rebuild the visible links from current particle positions.
 *
 * MODULE SCOPE on purpose: it mutates buffers, and a function declared in the
 * component body is treated as render-phase code by the React Compiler rules.
 * It reads and writes only what it is handed.
 *
 * NODE-TO-NODE ONLY. Ambient motes never connect. That single rule cuts the
 * candidate pairs by ~96% and, more importantly, makes the lines MEAN
 * something — links between live things. Capped at 2 per node so the field can
 * never hairball, and at a fixed segment budget so a dense moment drops links
 * rather than growing a buffer mid-frame.
 */
function rebuildLinks(
  linkGeometry: BufferGeometry,
  particlePositions: Float32Array,
  nodeIndices: Uint16Array,
) {
  const positionAttribute = linkGeometry.attributes.position;
  const alphaAttribute = linkGeometry.attributes.aAlpha;
  if (!positionAttribute || !alphaAttribute) return;

  const linkPositions = positionAttribute.array as Float32Array;
  const linkAlphas = alphaAttribute.array as Float32Array;
  let segment = 0;

  for (let a = 0; a < nodeIndices.length && segment < LINK_MAX_SEGMENTS; a++) {
    const ia = nodeIndices[a];
    let linked = 0;

    for (
      let b = a + 1;
      b < nodeIndices.length &&
      linked < LINK_MAX_PER_NODE &&
      segment < LINK_MAX_SEGMENTS;
      b++
    ) {
      const ib = nodeIndices[b];
      const dx = particlePositions[ia * 3] - particlePositions[ib * 3];
      const dy = particlePositions[ia * 3 + 1] - particlePositions[ib * 3 + 1];
      const dz = particlePositions[ia * 3 + 2] - particlePositions[ib * 3 + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance > LINK_DISTANCE) continue;

      // Maximum at contact, zero at the threshold — hairlines that fade in and
      // out as nodes drift past each other. If they are individually noticeable
      // as LINES rather than as texture, this is too high.
      const alpha = LINK_PEAK_ALPHA * (1 - distance / LINK_DISTANCE);
      const offset = segment * 6;
      linkPositions[offset] = particlePositions[ia * 3];
      linkPositions[offset + 1] = particlePositions[ia * 3 + 1];
      linkPositions[offset + 2] = particlePositions[ia * 3 + 2];
      linkPositions[offset + 3] = particlePositions[ib * 3];
      linkPositions[offset + 4] = particlePositions[ib * 3 + 1];
      linkPositions[offset + 5] = particlePositions[ib * 3 + 2];
      linkAlphas[segment * 2] = alpha;
      linkAlphas[segment * 2 + 1] = alpha;
      segment++;
      linked++;
    }
  }

  // Collapse unused segments to zero alpha rather than resizing the buffer.
  for (let s = segment; s < LINK_MAX_SEGMENTS; s++) {
    linkAlphas[s * 2] = 0;
    linkAlphas[s * 2 + 1] = 0;
  }

  positionAttribute.needsUpdate = true;
  alphaAttribute.needsUpdate = true;
}

type ParticleFieldProps = {
  bucket: ViewportBucket;
  /** Front-face bounds of the wordmark. Required — see the ordering constraint
   *  in the file header. */
  bounds: Box3;
};

export function ParticleField({ bucket, bounds }: ParticleFieldProps) {
  const reducedMotion = useReducedMotion();
  const pointsRef = useRef<Points>(null);
  const linkGeometryRef = useRef<BufferGeometry>(null);
  /** Monotonic scene clock for the Y wander. Deliberately SEPARATE from the
   *  link timer below — sharing one ref and resetting it on each link rebuild
   *  would jerk every particle's wander phase back to zero ten times a second. */
  const elapsedRef = useRef(0);
  const linkTimerRef = useRef(0);
  const { size, viewport } = useThree();

  const accentHero = useMemo(() => readAccentHero(), []);

  // Memoised on BOTH the bucket and the bounds. See the file header.
  const field = useMemo(
    () => buildField(bucket, bounds, accentHero),
    [bucket, bounds, accentHero],
  );

  const pointsMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: pointsVertexShader,
        fragmentShader: pointsFragmentShader,
        uniforms: {
          // Constructed with the correct values so the very first painted
          // frame is right — which matters because under reduced motion it is
          // the ONLY painted frame. The effect below only handles resizes.
          uScale: { value: (size.height * viewport.dpr) / 2 },
          uMaxPixels: { value: 4 * viewport.dpr },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
      }),
    // Intentionally NOT depending on size/dpr: those are captured once for the
    // first frame and tracked thereafter by the effect below. Adding them here
    // would rebuild the material — and recompile its shader — on every resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // three's attenuation scale is half the drawing-buffer height, so it has to
  // follow resizes. Reached through the ref rather than through the memoised
  // material: recreating the material instead would recompile its shader on
  // every resize event, and mutating the memo value directly is what the
  // compiler's immutability rule forbids.
  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    const material = points.material as ShaderMaterial;
    material.uniforms.uScale.value = (size.height * viewport.dpr) / 2;
    material.uniforms.uMaxPixels.value = 4 * viewport.dpr;
  }, [size.height, viewport.dpr]);

  const linkMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            gl_FragColor = vec4(uColor, vAlpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        uniforms: { uColor: { value: new Color(accentHero) } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [accentHero],
  );

  const linkBuffers = useMemo(() => {
    if (!LINKS_ENABLED[bucket]) return null;
    return {
      positions: new Float32Array(LINK_MAX_SEGMENTS * 2 * 3),
      alphas: new Float32Array(LINK_MAX_SEGMENTS * 2),
    };
  }, [bucket]);

  useFrame((_, delta) => {
    // Reduced motion: the constructed distribution IS the frame the user sees.
    // Nothing here may run — the frameloop alone does not stop this callback.
    if (reducedMotion) return;

    const points = pointsRef.current;
    if (!points) return;

    // Clamped: a tab returning from the background delivers a delta measured
    // in seconds, which would teleport the whole field in one step.
    const dt = Math.min(delta, 1 / 30);
    // Positions are read off the GEOMETRY, which owns the live array. The
    // memoised buffers below are read-only from here on.
    const positionAttribute = points.geometry.attributes.position;
    const positions = positionAttribute.array as Float32Array;
    const { velocities, wander, count } = field;
    const elapsed = (elapsedRef.current += dt);
    linkTimerRef.current += dt;

    for (let i = 0; i < count; i++) {
      const px = i * 3;
      positions[px] += velocities[px] * dt;
      positions[px + 1] +=
        velocities[px + 1] * dt +
        wander[px] * wander[px + 1] * Math.cos(wander[px + 1] * elapsed + wander[px + 2]) * dt;
      positions[px + 2] += velocities[px + 2] * dt;

      // Wrap by modulo, never reflect: reflection produces visible synchronised
      // turnarounds along the slab faces.
      if (positions[px] > SLAB.x) positions[px] -= SLAB.x * 2;
      else if (positions[px] < -SLAB.x) positions[px] += SLAB.x * 2;
      if (positions[px + 1] > SLAB.y) positions[px + 1] -= SLAB.y * 2;
      else if (positions[px + 1] < -SLAB.y) positions[px + 1] += SLAB.y * 2;
      if (positions[px + 2] > SLAB.zFront)
        positions[px + 2] -= SLAB.zFront - SLAB.zBack;
      else if (positions[px + 2] < SLAB.zBack)
        positions[px + 2] += SLAB.zFront - SLAB.zBack;
    }

    positionAttribute.needsUpdate = true;

    const linkGeometry = linkGeometryRef.current;
    if (linkGeometry && linkTimerRef.current * LINK_REBUILD_HZ >= 1) {
      linkTimerRef.current = 0;
      rebuildLinks(linkGeometry, positions, field.nodeIndices);
    }
  });

  return (
    <group>
      <points ref={pointsRef} material={pointsMaterial} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[field.positions, 3]}
          />
          <bufferAttribute attach="attributes-aColor" args={[field.colors, 4]} />
          <bufferAttribute attach="attributes-aSize" args={[field.sizes, 1]} />
        </bufferGeometry>
      </points>

      {linkBuffers ? (
        <lineSegments material={linkMaterial} frustumCulled={false}>
          <bufferGeometry ref={linkGeometryRef}>
            <bufferAttribute
              attach="attributes-position"
              args={[linkBuffers.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-aAlpha"
              args={[linkBuffers.alphas, 1]}
            />
          </bufferGeometry>
        </lineSegments>
      ) : null}
    </group>
  );
}

export default ParticleField;
