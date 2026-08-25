"use client";

import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type PropsWithChildren,
  type Ref,
} from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * A control whose hairline edge carries a highlight that walks around it, and
 * whose edge fills to full accent on hover.
 *
 * PROVENANCE, AND WHY THE FILE KEEPS ITS INSTALLED NAME. This arrived as
 * Aceternity's `hover-border-gradient` registry component (`components.json`
 * pins the `@aceternity` registry). It is kept at its installed path and under
 * its installed export name so the provenance stays greppable — the same rule
 * `components/ui/text-hover-effect.tsx` states for the same reason. What
 * survives is the IDEA and the geometry: four `radial-gradient` positions, one
 * per edge, rotated on an interval, with a bloom on hover. Every colour, every
 * radius and the whole animation transport were replaced, because the demo's
 * were unshippable here rather than merely unfashionable.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT WAS CHANGED, AND WHY EACH CHANGE WAS NOT OPTIONAL.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   1. `#3275F8` DELETED. The demo's hover bloom is a blue hex literal.
 *      CLAUDE.md allows TWO accents site-wide — `#00E5FF` (Tier 1 only) and
 *      `accent-working` — and `docs/03`'s whole-site sweep records ZERO hex
 *      literals in `app/` and `components/`. A blue here is a third accent in
 *      the affordance position, on a Tier 2 page. The bloom is now
 *      `bg-accent-working`, which is the colour the control was already filled
 *      with. This is the same refusal `text-hover-effect.tsx` records against
 *      the same vendor's five-hue gradient.
 *
 *   2. `bg-black` (x2) AND `text-white` DELETED. Both are theme-blind. The
 *      demo's plate is black in both modes, so on `/about` in light mode
 *      (`#FDFCFA`) it was a black slab beside two `accent-working`-outlined
 *      controls. The plate's only default is now `bg-base`; its ink is
 *      inherited, and the call site overrides the fill with the row's filled
 *      dressing. Neither box carries a `text-*` class by default — see
 *      `TRAVEL_GRADIENT` for the `cn()` collision that rule exists to avoid.
 *
 *   3. `dark:bg-white/20` DELETED. `app/globals.css` states the rule outright:
 *      components should not need `dark:` variants, because every token flips
 *      by redefining the variable under `html.light`, and a `dark:` prefix
 *      appearing in a component signals a MISSING TOKEN rather than a needed
 *      variant. The resting edge is `bg-accent-working/40` in both modes —
 *      the same `/40` the row's two secondary controls already carry, so the
 *      three edges match at rest.
 *
 *   4. `rounded-full`, `rounded-[100px]` AND `rounded-[inherit]` DELETED.
 *      `app/globals.css` ships no radius scale — there is exactly one radius
 *      token on the site and it names a single consumer — and
 *      `aboutButtonStyles.ts` states that the `/about` controls are square on
 *      purpose. A pill beside two square buttons is not a style preference,
 *      it is the row not lining up.
 *
 *   5. THE ANIMATION TRANSPORT WAS REBUILT, and this is the change that made
 *      1 and 2 possible at all. The demo animates the `background` SHORTHAND
 *      between two whole gradient strings, which forces every colour in the
 *      gradient to be a literal Framer Motion can parse and interpolate —
 *      `var(--color-fg)` in that string does not interpolate, it snaps. So the
 *      gradient is now written ONCE in `style`, with its colour as a bare token
 *      and its geometry as four custom properties, and motion animates only the
 *      four numbers. The colour is therefore resolved by CSS
 *      on every frame, which is what makes it theme-correct for free: flipping
 *      the theme re-paints the travelling highlight with no JS involved.
 *
 *   6. REDUCED MOTION HONOURED. `docs/07` §8 requires a branch of ALL motion
 *      and the demo has none. Under `prefers-reduced-motion: reduce` the
 *      interval never starts, so the highlight rests on the TOP edge, and the
 *      hover bloom crosses instantly instead of easing. The control keeps its
 *      full hover affordance — it simply stops moving on its own.
 *
 *   7. ARBITRARY TIMINGS REPLACED. The bloom used the demo's bare `duration`;
 *      it now uses `EASE.ui` / `DURATION.ui` from `lib/animation/easing.ts`.
 *
 *      THE TRAVEL IS THE ONE DISCLOSED DEPARTURE: it stays `linear`, which is
 *      not one of the three curves in `EASE`. A looping sweep is the case an
 *      eased curve is actively wrong for — any ease makes a continuous rotation
 *      pulse four times a cycle. The travel's DURATION is deliberately equal to
 *      the rotation interval so the highlight is always in motion rather than
 *      arriving and waiting.
 *
 *   8. `<div>` INSIDE `<button>` REPLACED WITH `<span>`. A button's content
 *      model is phrasing content; the demo's plate is a `div`, which is invalid
 *      inside it. Both are `display: flex` here, so nothing about the box
 *      changes.
 *
 *   9. `w-fit` IS STILL THE DEFAULT BUT IS NOW OVERRIDABLE, and the call site
 *      overrides it. `/about`'s action row stretches its children below 640px
 *      (`items-stretch`), and a `w-fit` control there would shrink to its label
 *      while the two beside it went full width.
 *
 *  10. THE `inset-[2px]` MASK PLATE WAS DELETED. It sat at z-1 under a plate
 *      that is inset 1px, opaque, and at z-10 — so it was covered by the very
 *      element it was masking for, in the demo as much as here. It is not
 *      load-bearing; keeping a second hardcoded `bg-black` alive to paint
 *      nothing was the worst of both.
 *
 *  11. `ref` IS DECLARED AND FORWARDED. The demo declares no ref and types its
 *      props as `HTMLAttributes`, so neither `ref` nor `type="button"` is
 *      accepted. `CvAction`'s modal focus-return calls `triggerRef.current
 *      ?.focus()` after close — without the ref reaching the real element,
 *      focus is silently dropped on the floor after every CV modal close, which
 *      is a keyboard trap in slow motion rather than a cosmetic loss.
 *
 * THE IDLE COST IS REAL AND IS THE ONE THING TO WEIGH BEFORE ADDING A SECOND
 * CALL SITE. While un-hovered and not reduced-motion, this runs a `setInterval`
 * for the life of the mount and repaints a blurred gradient once per second.
 * That is cheap for one control and it is NOT free — `/about` is otherwise
 * measured at zero idle canvas frames. Pass a longer `duration`, or gate the
 * rotation behind hover, before putting this on a page that has several.
 */

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

/**
 * The demo's four gradient geometries, decomposed into numbers.
 *
 * The values are the originals to the digit (its `41.199999999999996%` is
 * rounded to `41.2%` — that many decimals is float noise from whatever tool
 * exported it, and the difference is ~0.0000004px on a 44px control). They are
 * split out of the gradient string because of change 5 above: keeping the
 * colour out of the animated payload is what lets it be a token.
 */
const EDGE: Record<Direction, { x: string; y: string; w: string; h: string }> = {
  TOP: { x: "50%", y: "0%", w: "20.7%", h: "50%" },
  LEFT: { x: "0%", y: "50%", w: "16.6%", h: "43.1%" },
  BOTTOM: { x: "50%", y: "100%", w: "20.7%", h: "50%" },
  RIGHT: { x: "100%", y: "50%", w: "16.2%", h: "41.2%" },
};

/**
 * Rotation order. Walking this array BACKWARDS is clockwise on screen — the
 * demo's own convention, kept so `clockwise` keeps meaning what it says.
 */
const ORDER: readonly Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];

/**
 * The travelling highlight — a LUMINANCE event in the page's own foreground,
 * light in dark mode and dark in light mode, rather than a colour this file
 * had to name. That is the vocabulary `text-hover-effect.tsx` settled on for
 * the same problem.
 *
 * `var(--color-fg)` RATHER THAN `currentColor`, AND THE REASON IS A BUG THAT
 * WAS SHIPPED AND CAUGHT IN THE PRERENDERED HTML. `currentColor` works, but it
 * obliges the container to carry a `text-*` class — and the moment this
 * component's default `text-fg` met the call site's `text-caption` inside
 * `cn()`, tailwind-merge dropped one of them. It classifies `text-caption` as a
 * text-COLOUR utility, because `tailwind-merge` has no knowledge of this
 * project's `--text-caption` font-size token, so `text-caption` and
 * `text-on-accent` land in one conflict group and the LAST one wins. The label
 * silently rendered at body size with no tracking. Reading the token from CSS
 * directly means neither box needs a `text-*` class for the effect to work,
 * which removes the collision at its source rather than by ordering luck.
 *
 * THE GENERAL TRAP, since it will happen again: `cn()` is not string
 * concatenation. `aboutButtonStyles.ts`'s three older dressings compose with a
 * template literal and are therefore immune; anything routed through `cn()`
 * with a size token and a colour token in the same `text-` namespace is not.
 * Check the built markup, not the source, when a utility goes missing.
 */
const TRAVEL_GRADIENT =
  "radial-gradient(var(--hbg-w) var(--hbg-h) at var(--hbg-x) var(--hbg-y), var(--color-fg) 0%, transparent 100%)";

type HoverBorderGradientProps = PropsWithChildren<{
  as?: ElementType;
  containerClassName?: string;
  className?: string;
  /** Seconds an edge is held before the highlight walks to the next one. */
  duration?: number;
  clockwise?: boolean;
  ref?: Ref<HTMLElement>;
}> &
  ButtonHTMLAttributes<HTMLElement> &
  AnchorHTMLAttributes<HTMLElement>;

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ref,
  ...props
}: HoverBorderGradientProps) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("TOP");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (hovered || reducedMotion) return;
    const step = clockwise ? -1 : 1;
    const interval = setInterval(() => {
      setDirection(
        (previous) =>
          ORDER[(ORDER.indexOf(previous) + step + ORDER.length) % ORDER.length],
      );
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [hovered, reducedMotion, clockwise, duration]);

  const edge = EDGE[direction];

  return (
    <Tag
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex w-fit items-center justify-center overflow-visible bg-accent-working/40 p-px",
        containerClassName,
      )}
      {...props}
    >
      {/* THE TRAVEL. `overflow-hidden` clips the blurred glow to the container,
          so the plate above covers all but the 1px frame `p-px` opens up — that
          frame IS the border, and the arc is what walks around it. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ filter: "blur(2px)", background: TRAVEL_GRADIENT }}
        initial={{
          "--hbg-x": EDGE.TOP.x,
          "--hbg-y": EDGE.TOP.y,
          "--hbg-w": EDGE.TOP.w,
          "--hbg-h": EDGE.TOP.h,
        }}
        animate={{
          "--hbg-x": edge.x,
          "--hbg-y": edge.y,
          "--hbg-w": edge.w,
          "--hbg-h": edge.h,
        }}
        transition={{ ease: "linear", duration: reducedMotion ? 0 : duration }}
      />
      {/* THE HOVER BLOOM — the resting `/40` edge going to full accent. A flat
          fill rather than the demo's second gradient: the thing being filled is
          one pixel wide, so a gradient inside it is detail nobody can resolve,
          and a flat fill lands the hover state exactly on the colour the
          control is already filled with. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-accent-working"
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{
          ease: EASE.ui,
          duration: reducedMotion ? 0 : DURATION.ui,
        }}
      />
      <span
        className={cn(
          "relative z-10 flex w-full items-center justify-center bg-base px-md py-sm",
          className,
        )}
      >
        {children}
      </span>
    </Tag>
  );
}

export default HoverBorderGradient;
