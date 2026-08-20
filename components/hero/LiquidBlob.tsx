"use client";

/**
 * The liquid that follows the cursor inside the letterforms.
 *
 * NOT A CIRCLE. The previous version lerped three fixed-radius circles through
 * a goo filter, which reads as a rigid disc with a soft edge — a shadow
 * following the pointer. This is a metaball field: three centres ORBIT the
 * cursor at different rates and radii, their influence sums, and the surface
 * is a threshold through that sum. The body therefore stretches, pinches and
 * re-merges continuously, which is what actually reads as liquid. Nothing here
 * has a fixed outline to be static.
 *
 * CONTAINMENT IS THE STENCIL BUFFER. `HeroName` writes stencil ref 1 wherever
 * the glyph geometry renders; this quad covers the whole view but is drawn
 * only where the stencil equals 1. The GPU does the clipping, so the liquid
 * cannot escape the letters at any viewport size, camera pose or blob shape —
 * the same guarantee the SVG mask gave, at a layer that also works for 3D
 * geometry, which an SVG mask does not.
 *
 * THE QUAD IS FITTED TO THE CAMERA every frame for the same reason `HeroGrid`
 * was: one UV unit is then one screen unit, so the cursor can be handed
 * straight to the shader in NDC without a projection round-trip, and it stays
 * correct through the reveal pull-back.
 *
 * DEPTH IS OFF, ORDER IS EXPLICIT. The quad sits in front of the type and must
 * not be depth-rejected by it, and must not write depth over it either. The
 * stencil test is the only thing deciding where it appears.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DoubleSide,
  EqualStencilFunc,
  KeepStencilOp,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** How far in front of the wordmark the quad sits, world units. */
const IN_FRONT = 1.2;
/** Cursor easing. Below the old 0.22 so the body trails and stretches. */
const LERP = 0.16;
/** Fade in/out of the whole effect, per second. */
const FADE_RATE = 3.2;

const FORWARD = new Vector3();
const ORIGIN = new Vector3(0, 0, 0);

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Metaball field. `r*r / d*d` rather than a gaussian: the inverse-square
 * falloff is what makes two centres BULGE toward each other and snap together
 * as they approach, instead of cross-fading. That merge is the whole read.
 */
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uCursor;
  uniform float uAspect;
  uniform float uOpacity;
  uniform vec3  uAccent;

  float ball(vec2 p, vec2 c, float r) {
    vec2 d = (p - c) * vec2(uAspect, 1.0);
    return (r * r) / max(dot(d, d), 1e-6);
  }

  void main() {
    if (uOpacity <= 0.001) discard;
    float t = uTime;
    vec2 c = uCursor;

    // Three centres on incommensurate orbits, so the silhouette never repeats
    // on a period a viewer can spot.
    vec2 c1 = c + vec2(cos(t * 0.90), sin(t * 1.30)) * 0.014;
    vec2 c2 = c + vec2(cos(t * 1.70 + 2.0), sin(t * 0.80 + 1.0)) * 0.024;
    vec2 c3 = c + vec2(cos(t * 0.60 + 4.0), sin(t * 1.90 + 3.0)) * 0.019;

    float f =
        ball(vUv, c1, 0.030)
      + ball(vUv, c2, 0.025)
      + ball(vUv, c3, 0.020);

    // Threshold well above 1 so only the merged core survives; the wide skirt
    // of the field is what lets neighbouring balls bulge before they touch.
    float a = smoothstep(0.85, 1.9, f);
    if (a <= 0.002) discard;

    // Hot white core cooling to the accent at the rim — the gradient is what
    // makes it read as a material rather than as a flat shape.
    vec3 col = mix(uAccent, vec3(1.0), smoothstep(1.1, 3.4, f));
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

type LiquidBlobProps = {
  /** Read from `--accent-hero`, passed in so this file owns no hex. */
  accent: Vector3;
};

export function LiquidBlob({ accent }: LiquidBlobProps) {
  const meshRef = useRef<Mesh | null>(null);
  const reducedMotion = useReducedMotion();
  const { camera, pointer, size } = useThree();

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: DoubleSide,
        // THE CLIP. Draw only where HeroName left a 1 in the stencil buffer.
        // `Keep` on every op because this pass must not disturb the buffer for
        // anything drawn after it.
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: EqualStencilFunc,
        stencilFail: KeepStencilOp,
        stencilZFail: KeepStencilOp,
        stencilZPass: KeepStencilOp,
        uniforms: {
          uTime: { value: 0 },
          uCursor: { value: new Vector2(0.5, 0.5) },
          uAspect: { value: 1 },
          uOpacity: { value: 0 },
          uAccent: { value: accent },
        },
      }),
    [accent],
  );

  useEffect(() => () => material.dispose(), [material]);

  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const u = material.uniforms;

    // Fit the quad to the view, in front of the type. Same construction as
    // HeroGrid: orientation from the camera, not just position, because the
    // hero camera is angled at a look-at target.
    const cam = camera as typeof camera & { fov?: number; aspect?: number };
    const dist = Math.max(cam.position.distanceTo(ORIGIN) - IN_FRONT, 0.5);
    FORWARD.set(0, 0, -1).applyQuaternion(cam.quaternion);
    mesh.quaternion.copy(cam.quaternion);
    mesh.position.copy(cam.position).addScaledVector(FORWARD, dist);
    const h = 2 * Math.tan(((cam.fov ?? 50) * Math.PI) / 360) * dist;
    const w = h * (cam.aspect ?? 1);
    mesh.scale.set(w, h, 1);

    u.uAspect.value = size.width / Math.max(size.height, 1);

    // NDC -> UV. Not clamped: a cursor beyond the wordmark drags the body out
    // past the glyphs and the stencil keeps only what is still inside one,
    // which is what reads as liquid draining toward the near edge.
    const tx = pointer.x * 0.5 + 0.5;
    const ty = pointer.y * 0.5 + 0.5;
    const cur = u.uCursor.value as Vector2;
    cur.x += (tx - cur.x) * LERP;
    cur.y += (ty - cur.y) * LERP;

    // Reduced motion: no churn and no body. The wordmark keeps its material,
    // which is the one frame such a visitor sees.
    const target = reducedMotion ? 0 : 1;
    u.uOpacity.value +=
      (target - (u.uOpacity.value as number)) * Math.min(delta * FADE_RATE, 1);
    if (!reducedMotion) u.uTime.value = (u.uTime.value as number) + delta;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <mesh ref={meshRef} material={material} renderOrder={10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default LiquidBlob;
