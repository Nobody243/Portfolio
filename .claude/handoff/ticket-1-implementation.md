# Ticket 1 — Project scaffold — implementation

Status: **complete**, including the post-review fix pass.
Last updated: 2026-08-17.

## What was built

**Scaffold.** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4. Folder structure per
`docs/02_TECHNICAL_ARCHITECTURE.md`: `app/(site)`, `app/(site)/projects/[slug]`, `components/{hero,
sections,projects,ui}`, `content/`, `lib/{three,animation}`, `public/{images,models}`. Deps installed
and wired: R3F + drei, GSAP + ScrollTrigger, Lenis, Framer Motion (`motion`).

**Design tokens — `app/globals.css`.** All colour, type-scale and spacing tokens from
`docs/03_FRONTEND_SPEC.md`.
- `@theme static` so tokens are emitted even when no utility references them — required because the
  3D layer reads colours as `var()` values, not classes.
- Dark is the default; light mode is opt-in via `html.light`, which redefines the same variables. No
  `dark:` prefixes needed in components — a `dark:` prefix appearing later means a missing token.
- `--accent-hero` (`#00e5ff`) is registered OUTSIDE the `--color-*` namespace on purpose, so
  `text-accent-hero` / `bg-accent-hero` do not exist. Mechanical enforcement of the Tier 1-only rule.
- `--color-accent-working` is `#14b8a6` dark / `#0f766e` light (contrast-tuned, same hue).
- Fonts via `next/font`: Space Grotesk (`font-sans`), JetBrains Mono (`font-mono`). No serif token.
- Documented deviations from the spec: `--text-caption` is 12px not ~10px (legibility floor), `h1`
  line-height is 1.05 not 1.1 (gappy at 110px). Both annotated at the token.

**Smooth scroll.** `components/ui/LenisProvider.tsx` — `ReactLenis root`, which renders no wrapper
element. `lenis/dist/lenis.css` is imported in globals (load-bearing: it undoes the `h-full` /
`min-h-full` pinning in `app/layout.tsx` that would otherwise leave Lenis driving an unscrollable
document). Under `prefers-reduced-motion` Lenis is not instantiated at all.

**Reduced motion.** `lib/hooks/useReducedMotion.ts` — one `useSyncExternalStore` read, consumed by
LenisProvider and SceneCanvas. Server snapshot is `false`, so every consumer must keep both branches
emitting identical DOM.

**Accepted early (not Ticket 1 scope, kept because it is sound).**
- `lib/animation/easing.ts`, `lib/animation/gsap.ts`, `components/ui/MotionProvider.tsx`
- `components/hero/SceneCanvas.tsx` — the project's single WebGL entry point (DPR clamp,
  `frameloop="demand"` default, alpha framebuffer, inner Suspense, `aria-hidden`). **Permanent
  architecture.** Ticket 3 may edit it to add camera configuration and post-processing.
- `lib/three/accentHero.ts` — reads `--accent-hero` from CSS. Client-only. No JS fallback hex, by
  decision: a duplicated literal that can drift silently is worse than the failure it would mask.
- `app/(site)/projects/[slug]/page.tsx` — route stub so the segment resolves. Ticket 7 replaces it.

**Throwaway, deleted in Ticket 3.** `components/hero/PlaceholderScene.tsx` (one unlit wireframe
icosahedron proving the R3F pipeline renders) and the whole of `app/(site)/page.tsx` (token swatches,
type-scale specimens, five tall sections for feeling Lenis easing).

## How to run / view locally

```
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck
npm run lint
```

What to check on the scaffold page:
- Swatches resolve for `base`, `fg`, `accent-working`, `accent-hero` (the last read via `var()`).
- Headings render in Space Grotesk, captions in JetBrains Mono.
- Scrolling between the five sections feels eased, not native — that is Lenis.
- Section two shows a cyan wireframe icosahedron — that is the R3F pipeline.
- **Light mode** has no toggle until Ticket 11: in devtools, swap `class="dark"` for `class="light"`
  on `<html>`.
- **Reduced motion**: devtools → Rendering → "Emulate CSS prefers-reduced-motion". Scroll should go
  native/instant and the canvas should still paint a static image, not leave a hole.

## Acceptance criteria

> Project builds and runs locally with no errors; theme tokens are usable via Tailwind classes or CSS
> variables in both modes; Lenis smooth scroll is active on an empty page.

All three met. `npm run build` and `npm run lint` are clean.

## Follow-ups left for later tickets

- Ticket 3 deletes `PlaceholderScene.tsx` and rewrites `app/(site)/page.tsx`; it also owns the
  Lenis ↔ ScrollTrigger sync, which is deliberately still absent.
- Ticket 11's toggle must REMOVE `dark` when adding `light` — the classes are mutually exclusive.
- Tickets 5/6: verify `--color-elevated` and the two tints in a real layout; a 2% luminance step can
  look right in a swatch and be invisible in a section.
- Ticket 10: `#00e5ff` is ~1.5:1 on the light background — the close beat's hero-accent touch must
  sit on its own dark surface, never as hairline text or a thin rule.
