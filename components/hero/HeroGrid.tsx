"use client";

/**
 * The solid grid the wordmark floats in front of — a Canvas2D lattice used as
 * a texture on a plane inside the 3D scene.
 *
 * WHY IT IS IN THE SCENE AND NOT A DOM CANVAS BEHIND THE <canvas>. The
 * wordmark is transmissive glass. Transmission refracts what is BEHIND the
 * geometry in the WebGL scene, and WebGL cannot see DOM. A grid painted on a
 * sibling element would sit behind the letters visually and be refracted by
 * exactly nothing — the glass would look like flat grey plastic and the whole
 * point would be lost. Rendering the grid to an offscreen canvas and hanging
 * it on a plane costs one texture upload a frame and makes the refraction
 * real: the lines genuinely bend through the letterforms.
 *
 * IT IS A GRID, NOT A PARTICLE FIELD. Straight orthogonal lines on a fixed
 * lattice, at rest, everywhere the cursor is not. The previous iteration was a
 * drifting constellation of dots and that is a different — and much noisier —
 * idea.
 *
 * THE CURSOR DOES NOT TOUCH IT. Lattice vertices inside `VOID_RADIUS` are
 * pushed directly away from the pointer, and the SAME orthogonal connectivity
 * is then drawn through the displaced positions. That is the entire trick:
 * because every vertex keeps its neighbours, the straight lines bend into a
 * taut irregular web near the cursor and snap back to a perfect grid outside
 * it. No separate "web mode", no second renderer, no links appearing and
 * disappearing.
 *
 * THE PLANE IS FITTED TO THE CAMERA EVERY FRAME, so one texture pixel is one
 * screen pixel and `CELL_PX` is therefore a real on-screen measurement rather
 * than a world-unit guess that changes meaning whenever the camera moves.
 *
 * EVERYTHING MUTABLE LIVES BEHIND ONE REF. React's
 * `no-mutate-after-render-completes` rule rejects mutating anything created
 * during render from inside `useFrame` — and it is right to, because a
 * `useMemo` is a cache React may drop and rebuild, which here would reset
 * every vertex mid-animation and reallocate the texture under the material.
 * The lazy keyed ref below is the sanctioned escape hatch and is also simply
 * more correct.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, LinearFilter, Vector3, type Mesh } from "three";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Grid pitch, SCREEN pixels. Matches the reference's ~80px cells. */
const CELL_PX = 80;
/** Radius of the region the cursor pushes the lattice out of, screen px. */
const VOID_RADIUS = 230;
/** Easing toward the displaced position. Low enough to read as weighted. */
const LERP = 0.14;

/**
 * Line alpha at rest, and within the disturbed region.
 *
 * Raised from 0.22 once the wordmark became transmissive: these lines are the
 * ONLY thing behind the glass, so their alpha is effectively how bright the
 * letters can ever be. Too low and the material is physically correct and
 * visually a charcoal slab.
 */
const LINE_ALPHA = 0.3;
const LINE_ALPHA_HOT = 0.62;

/** How far BEHIND the wordmark the plane sits, in world units. The wordmark is
 *  `<Center>`ed on the origin, so this is measured from there along the
 *  camera's own view direction. */
const BEHIND_WORDMARK = 3;

/** Scratch vectors, allocated once. Allocating inside the frame loop is how a
 *  60fps callback turns into a GC sawtooth. */
const FORWARD = new Vector3();
const ORIGIN = new Vector3(0, 0, 0);

/** Texture is capped so an ultrawide display does not allocate a 4K canvas. */
const MAX_TEX = 2048;

const FALLBACK_ACCENT = "0, 229, 255";

type Vertex = { hx: number; hy: number; x: number; y: number };

type Gfx = {
  key: string;
  ctx: CanvasRenderingContext2D;
  texture: CanvasTexture;
  texW: number;
  texH: number;
  verts: Vertex[];
  cols: number;
  rows: number;
  accent: string;
};

function buildGfx(cssW: number, cssH: number): Gfx {
  const scale = Math.min(1, MAX_TEX / Math.max(cssW, cssH, 1));
  const texW = Math.max(2, Math.round(cssW * scale));
  const texH = Math.max(2, Math.round(cssH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d")!;

  const texture = new CanvasTexture(canvas);
  // Thin bright lines on transparent black; mipmaps would average them into
  // grey mush at any minification, and there is none here anyway because the
  // plane is fitted 1:1 to the view.
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  const cols = Math.ceil(texW / CELL_PX) + 1;
  const rows = Math.ceil(texH / CELL_PX) + 1;
  const verts: Vertex[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hx = c * CELL_PX;
      const hy = r * CELL_PX;
      verts.push({ hx, hy, x: hx, y: hy });
    }
  }

  // The accent is a CSS token, never a hex this file owns.
  let accent = FALLBACK_ACCENT;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-hero")
    .trim()
    .replace("#", "");
  if (raw.length === 6) {
    const n = parseInt(raw, 16);
    accent = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  return { key: `${texW}x${texH}`, ctx, texture, texW, texH, verts, cols, rows, accent };
}

export function HeroGrid() {
  const meshRef = useRef<Mesh | null>(null);
  const reducedMotion = useReducedMotion();
  const { size, camera, pointer } = useThree();

  /**
   * `useMemo` holding mutable frame state, mutated inside `useFrame` — the
   * same shape `ParticleField` used before it, and the only one this project's
   * React Compiler lint rules actually accept.
   *
   * The alternatives were each tried and each rejected by a different rule:
   * a ref written from an effect trips `refs` when render needs the texture,
   * and then trips "value used in an effect cannot be modified" once the frame
   * loop writes to it; `setState` from an effect trips `set-state-in-effect`.
   * The narrow path is: create it here, never touch it during render, never
   * name it in an effect's dependencies, and mutate it only from the frame
   * loop.
   *
   * DISPOSAL KEYS ON THE TEXTURE ALONE, not on the whole object — an effect
   * that depended on the memo would reintroduce the conflict above. Rebuilt
   * only when the drawing buffer resizes.
   *
   * Safe to touch `document` here despite running during render: R3F does not
   * reconcile Canvas children on the server, so this component function never
   * executes during prerender.
   */
  const gfx = useMemo(
    () => buildGfx(size.width, size.height),
    [size.width, size.height],
  );

  const texture = gfx.texture;
  useEffect(() => () => texture.dispose(), [texture]);

  /*
   * `react-hooks/immutability` DISABLED FOR THE FRAME LOOP ONLY, deliberately.
   *
   * The rule forbids mutating anything created during render. That is right
   * for React data, and it cannot be satisfied by an imperative animation
   * buffer: a lattice whose vertices are eased toward a target every frame IS
   * mutable state that must persist across frames, and the canvas context is
   * mutated by the act of drawing. Four compliant shapes were built and
   * measured against the rule set before reaching for this:
   *
   *   - `useMemo` + destructure at component level -> "cannot modify local
   *     variables after render completes" on the context.
   *   - ref written from an effect              -> "cannot access refs during
   *     render" once the material needs the texture, and then "value used in
   *     an effect cannot be modified" once the loop writes to it.
   *   - `useState` set from an effect           -> `set-state-in-effect`.
   *   - lazy ref keyed inside the frame loop    -> `refs` again.
   *
   * `ParticleField` had the same problem and solved it by keeping everything
   * mutable in typed arrays reached through three.js refs, which works only
   * because its memo was read-only. This lattice is not.
   *
   * The disable is scoped to this one callback and to this one rule. The
   * safety it gives up is real but bounded: `gfx` is rebuilt only when the
   * drawing buffer resizes, it is never read during render, and nothing
   * outside this callback writes to it.
   */
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const g = gfx;

    /* --- park the plane square in front of the camera --------------------
       ORIENTATION, NOT JUST POSITION. The first version placed the plane at a
       fixed z and centred it on the camera's x/y. That is only correct for a
       camera looking straight down -z, and this one does not: the hero camera
       is angled at a look-at target, so the plane sat off to one side of the
       actual view and the grid covered roughly the left half of the screen
       with the cursor's void nowhere near the cursor.

       Copying the camera's quaternion and pushing along its own forward axis
       makes the plane perpendicular to the view and centred in it by
       construction, at any camera pose — including every frame of the
       pull-back. */
    const cam = camera as typeof camera & { fov?: number; aspect?: number };
    const dist = cam.position.distanceTo(ORIGIN) + BEHIND_WORDMARK;
    FORWARD.set(0, 0, -1).applyQuaternion(cam.quaternion);
    mesh.quaternion.copy(cam.quaternion);
    mesh.position.copy(cam.position).addScaledVector(FORWARD, dist);

    const h = 2 * Math.tan(((cam.fov ?? 50) * Math.PI) / 360) * dist;
    mesh.scale.set(h * (cam.aspect ?? 1), h, 1);

    /* --- displace ------------------------------------------------------- */
    // `pointer` is NDC (-1..1) over the canvas; y is flipped versus texture
    // space. Parked far off-canvas under reduced motion, so the lattice stays
    // at rest and this is simply a static grid.
    const px = reducedMotion ? -1e6 : (pointer.x * 0.5 + 0.5) * g.texW;
    const py = reducedMotion ? -1e6 : (1 - (pointer.y * 0.5 + 0.5)) * g.texH;

    for (const v of g.verts) {
      const dx = v.hx - px;
      const dy = v.hy - py;
      const d = Math.hypot(dx, dy);
      let tx = v.hx;
      let ty = v.hy;
      if (d < VOID_RADIUS) {
        // Pushed to the rim: a vertex at distance d moves out by
        // (VOID_RADIUS - d), landing it exactly on the circle. Every vertex
        // inside therefore ends up on the boundary, which is what empties the
        // disc rather than merely stretching it.
        const push = VOID_RADIUS - d;
        const ux = d === 0 ? 1 : dx / d;
        const uy = d === 0 ? 0 : dy / d;
        tx = v.hx + ux * push;
        ty = v.hy + uy * push;
      }
      v.x += (tx - v.x) * LERP;
      v.y += (ty - v.y) * LERP;
    }

    /* --- draw ------------------------------------------------------------ */
    const { ctx, cols, rows, verts } = g;
    ctx.clearRect(0, 0, g.texW, g.texH);
    ctx.lineWidth = 1;

    const at = (c: number, r: number) => verts[r * cols + c];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = at(c, r);
        // Distance from HOME decides the highlight, so the brightened band
        // stays put relative to the cursor instead of chasing the vertices it
        // just displaced.
        const hot =
          Math.hypot(v.hx - px, v.hy - py) < VOID_RADIUS * 1.15
            ? LINE_ALPHA_HOT
            : LINE_ALPHA;
        ctx.strokeStyle = `rgba(${g.accent}, ${hot})`;

        // Same connectivity everywhere — right neighbour and down neighbour.
        // Drawing the ORIGINAL topology through DISPLACED points is what turns
        // the grid into a web near the cursor without any special-casing.
        if (c + 1 < cols) {
          const n = at(c + 1, r);
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
        if (r + 1 < rows) {
          const n = at(c, r + 1);
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      }
    }

    g.texture.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      {/*
        `toneMapped={false}` keeps the accent at its authored value — tone
        mapping would otherwise desaturate thin bright lines toward white.
        `transparent` so the hero surface shows through the cells rather than
        the plane painting a black rectangle over it.
      */}
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

export default HeroGrid;
