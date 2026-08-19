import {
  EXTERNAL_LINK_ON_HERO,
  ExternalLink,
} from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import {
  CONTACT_CLOSING_LINE,
  CONTACT_HEADING,
} from "@/components/sections/contactContent";
import { contact } from "@/content/contact";
import { STAGGER } from "@/lib/animation/easing";

/**
 * Contact / Close — the site's SMALL Tier 1 echo, and the end of the document.
 *
 * DELIBERATELY A SERVER COMPONENT, exactly as About, Skills, Projects,
 * ProjectDetail, Experience and CurrentlyLearning are. There is no "use client"
 * here and there must not be one: `Reveal` is the only client boundary on the
 * page. In particular there is NO COPY-TO-CLIPBOARD BUTTON — it would need
 * "use client", `useState`, a live region and a reduced-motion path, and it
 * would be INERT UNTIL HYDRATION. A visible control that does nothing for the
 * first few hundred milliseconds (or forever, with JS blocked) is a worse
 * failure than the one it was added to fix. The visible link text IS the
 * address, so the worst case without it is selecting sixteen characters that
 * are already on screen.
 *
 * ------------------------------------------------------------------------
 * IT IS A <footer>, A SIBLING OF <main>, NOT A SIXTH <section> INSIDE IT.
 * ------------------------------------------------------------------------
 * A <footer> whose nearest ancestor is <body> is the `contentinfo` landmark,
 * and author identification plus links to related documents is the textbook
 * content of that landmark — it is where a screen-reader user goes looking for
 * contact details. THE TRAP: a <footer> nested inside <main> is scoped to
 * <main> and is not a landmark at all. Nothing errors, nothing looks different,
 * and the entire benefit silently evaporates. See `app/(site)/page.tsx`.
 *
 * NOTHING COMES AFTER THIS SECTION. No copyright line, no colophon, no "built
 * with": a copyright line states nothing a visitor needs and nothing in
 * dispute, and a stack brag is the wrong thing on the one surface CLAUDE.md
 * reserves for real links. `CurrentlyLearning` already owns the site's only
 * freshness stamp. The panel's own bottom padding is the end of the document.
 *
 * ------------------------------------------------------------------------
 * THE TWO ACCENTS, AND THE ONE ERROR THIS FILE IS MOST LIKELY TO CONTAIN.
 * ------------------------------------------------------------------------
 * `hero-accent` and `accent-hero` are NEAR-ANAGRAMS FOR DIFFERENT COLOURS, and
 * both directions of the swap render something plausible on a dark panel:
 *
 *   --color-hero-accent  #14B8A6 teal.  HAS utilities (`text-hero-accent`,
 *                        `outline-hero-accent`). 8.00:1 here. It is the
 *                        AFFORDANCE colour: links and focus rings, and nothing
 *                        else on this panel.
 *   --accent-hero        #00E5FF cyan.  Has NO utilities, DELIBERATELY —
 *                        `text-accent-hero` / `bg-accent-hero` do not exist and
 *                        Tailwind renders nothing for an unknown utility rather
 *                        than erroring. It is a MARKER OF THE BEAT, never an
 *                        affordance. 12.96:1 here as a non-text graphic.
 *
 * NEVER `accent-working` ON THIS PANEL, and never `fg`, `on-accent`,
 * `elevated`, `tint-cool` or `tint-warm`. All six are theme-tuned and this
 * surface does not flip: `accent-working` becomes #0F766E in light mode, which
 * lands at ~3.6:1 here against 7.95:1 in dark — one affordance rendering at two
 * strengths for no reason anyone chose, visible only after a theme toggle.
 * `app/globals.css`'s HERO TOKENS block states this as a usage rule.
 *
 * THE OPACITY FLOOR HERE IS `/70`, AND IT WAS RE-MEASURED RATHER THAN ASSUMED.
 * `/70` is the site floor because LIGHT MODE is the binding constraint — and
 * this surface has no light mode, so that reasoning does not transfer. Against
 * #07090C with #E8EAEC: full 16.5:1, `/70` 8.21:1, `/50` 4.60:1, `/45` 3.91:1
 * fails. The arithmetic floor is `/50`. SHIP `/70` ANYWAY: 0.1 of headroom is
 * the same thin margin that got `/60` on `bg-elevated` rejected as unsafe, and
 * one site-wide floor is worth more than a correct-but-different second one,
 * because the second floor is the one a reviewer forgets exists.
 * (`HeroHeadline`'s reduced-motion chevron at `text-hero-fg/55` is an ICON on a
 * 3:1 floor. Do not cite it as precedent for text, and do not "fix" it.)
 *
 * ------------------------------------------------------------------------
 * HOW MUCH TIER 1 ECHO "SMALL" IS. Three things and no others.
 * ------------------------------------------------------------------------
 *   1. The surface. `bg-hero-surface`, full-bleed. This is the largest gesture
 *      and it was decided in Ticket 3 — a dark plate appearing exactly twice,
 *      at the two spectacle beats, is what makes it read as a system.
 *   2. A sequenced reveal, where every Tier 3 section is simultaneous.
 *   3. One 34x3px cyan mark.
 *
 * EXPLICITLY NOT, and each must stay absent: no R3F, no Canvas, no camera, no
 * `three` import, no GSAP, no ScrollTrigger, no parallax, no scroll-linked
 * value, no `useScroll`, no `100dvh` / `min-h-screen` / any viewport-unit
 * height, no particle field, no glow, no blur, no box-shadow, no gradient, no
 * radius (no token exists), no hover transform, no counter, no typewriter, no
 * marquee, and NO INFINITE OR REPEATING ANIMATION. The hero's chevron loops but
 * is gated on `cueActive`; a loop at the bottom of the page would run for as
 * long as the visitor sits there. Tier 1 is ONE expensive move, not many moving
 * things, and here the expensive move is the surface.
 *
 * NO `min-h`. A second viewport-height panel is a second hero. If this ever
 * reads thin, the fix is padding, not `dvh`.
 *
 * ------------------------------------------------------------------------
 * SPINE AND SEAM.
 * ------------------------------------------------------------------------
 * RULE S-1 HOLDS BYTE-IDENTICALLY inside the full-bleed panel: the same
 * `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl` the five shipped
 * sections use. Holding the spine INSIDE the panel is the main thing that stops
 * this reading as a bolted-on footer bar. Nothing is centred; the void stays on
 * the right.
 *
 * RULE S-2 DOES NOT APPLY, under S-2's own explicit permission ("The Contact
 * section may set its own vertical rhythm, and must say so where it does") —
 * recorded in docs/03_FRONTEND_SPEC.md as that rule requires. This is the
 * hero's hard colour edge MIRRORED: bg-base into bg-hero-surface instead of the
 * other way round, so it pays exactly what About's opening pays,
 * `pt-2xl sm:pt-3xl`. 89 + 144 = 233px of air across the seam at 640px and up
 * (89 + 89 = 178px below it), and the edge lands in empty space rather than
 * above a heading. NO GRADIENT FADE at this seam either: near-black to
 * warm-white gradients muddy both colours and are a recognisable hero-fadeout
 * trope. The bottom padding is symmetric because a plate with a short bottom
 * reads as content that got cut off, and there is no seam below this one.
 *
 * ------------------------------------------------------------------------
 * NO `.length` READ ANYWHERE IN THIS FILE.
 * ------------------------------------------------------------------------
 * Not a gate, not a branch, not a conditional class. The list is a column that
 * becomes a WRAPPING row at 640px and up, so n = 1, n = 2 and n = 4 are one
 * code path. No grid with a fixed column count, no `justify-between` (which
 * visibly redistributes when n changes), no separator glyphs. LinkedIn arrives
 * by adding four lines to `content/contact.ts` and nothing here changes.
 */
export function Contact() {
  return (
    <footer
      id="contact"
      aria-labelledby="contact-heading"
      // See SPINE AND SEAM above. `pt-2xl sm:pt-3xl` is byte-identical to
      // About's opening: same hard colour edge, same debt. The bottom mirrors
      // it because this is the end of the document, not a seam.
      className="w-full bg-hero-surface pt-2xl pb-2xl sm:pt-3xl sm:pb-3xl"
    >
      {/* Rule S-1, identical to About's, Skills', Projects' and Experience's
          container, byte for byte — inside a full-bleed panel, exactly as the
          hero does it. The spine is 21 / 55 / 89px inside a 1440px centred
          container. */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        {/*
          THE DELAYS MUST STAY MONOTONIC IN DOCUMENT ORDER: 0, then
          STAGGER.line, then STAGGER.line * 2. If these three blocks are ever
          reordered, the delays are reordered with them, and anything inserted
          in the middle takes the delay for its POSITION.

          This is the About defect (commit dc35cfa) stated as an invariant
          rather than a ban. There, delays of 0 / 0.10 / 0 rendered a sequence
          BACKWARDS when a jump link landed three units on one
          IntersectionObserver tick. The defect was the non-monotonicity, not
          the stagger: increasing delays still play top-to-bottom on a
          simultaneous tick, which is exactly what a jump to #contact causes.
          `easing.ts` sanctions reusing STAGGER.line rather than inventing a
          per-section cadence.

          ONE `Reveal` PER UNIT, never one around the whole panel — `Reveal`'s
          hardcoded `amount: 0.1` guard assumes its target is one unit. The list
          is one unit; the three blocks together are not.

          Sequence completes at 0.20 + 0.70 = 0.90s, inside `Reveal`'s stated
          ~1.0s budget. Under reduced motion `MotionProvider` drops the
          transform and keeps opacity, so this degrades to three fades.
        */}
        <Reveal>
          {/*
            THE ONE CYAN MARK — the site's only DOM path to `--accent-hero`,
            and the only cyan anywhere outside the hero's WebGL canvas.

            Three authorities license it here and nowhere else: CLAUDE.md
            ("Tier 1 ONLY — hero glow/particles/lighting, and sparingly in the
            Contact close beat"), `app/globals.css`'s TIER 1 ACCENT block, and
            .claude/handoff/ticket-3-design.md 11.6.

            READ VIA AN INLINE `var()`, BY DESIGN — NOT A CLASS, NOT A UTILITY,
            NOT A NEW TOKEN. `--accent-hero` is registered OUTSIDE Tailwind's
            `--color-*` namespace precisely so no utility can exist for it, and
            globals.css says in so many words: DO NOT "fix" this by moving it
            into that namespace. Adding `--color-accent-hero`, an `@utility`, or
            even a hand-written `.accent-hero-mark` class would recreate the
            leak the guard prevents, under a new name. The guard's intent is
            that reaching cyan in the DOM is a deliberate, visible, greppable
            act — `grep -rn "accent-hero" components/` returns the hero's
            `outline-hero-accent` (a DIFFERENT token) plus this one line, and a
            reviewer can audit the whole rule in one command.

            `aria-hidden` and carrying no text: it is a marker of the beat, not
            an affordance. Cyan TEXT was rejected on a stronger ground than
            contrast — a coloured short string reads as something to click, and
            a second link colour would break the locked rule that teal, and only
            teal, means "activate this". #00E5FF on #07090C is 12.96:1, against
            a 3:1 non-text floor.

            `h-3xs` is 3px from `--spacing-3xs`, NOT a literal. An earlier
            version of this used `h-[3px]` and said "there is no 3px SIZE
            token" — false, and `w-lg` on the same element disproves it: in
            Tailwind v4 the `--spacing-*` namespace generates size utilities as
            well as spacing ones, so `.h-3xs { height: var(--spacing-3xs) }` is
            generated and verified in the built CSS. globals.css reserves
            arbitrary and numeric values for 1-2px hairlines specifically
            BECAUSE the Fibonacci scale covers everything from 3px up.

            The bar is 34x3px on the pinned dark plate. globals.css's hard
            constraint for this ticket is satisfied by the surface, not the
            size: cyan is ~1.5:1 on `bg-base` and must never be a rule or
            hairline drawn there, but this sits on `bg-hero-surface` at
            12.96:1, which is the "its own dark surface" the rule requires.
            */}
          <span
            aria-hidden="true"
            className="mb-md block h-3xs w-lg"
            style={{ backgroundColor: "var(--accent-hero)" }}
          />
          {/* Weight left at the inherited 400, as in all five shipped sections:
              the type scale carries the size. */}
          <h2 id="contact-heading" className="text-h2 text-hero-fg">
            {CONTACT_HEADING}
          </h2>
        </Reveal>

        {/* Full opacity — this is primary content, not metadata. `34rem` is the
            site's reading measure, used by every shipped section. */}
        <Reveal delay={STAGGER.line}>
          <p className="mt-lg max-w-[34rem] text-body text-hero-fg">
            {CONTACT_CLOSING_LINE}
          </p>
        </Reveal>

        <Reveal delay={STAGGER.line * 2}>
          {/*
            A REAL LIST, so a screen reader announces the honest current count
            ("list, 2 items") and n = 3 needs zero markup change.

            THE GAP UNDER THE HEADING IS LARGER THAN THE GAP BETWEEN ITEMS
            (55/89 > 34), for the sixth time on this site, so "Contact" does not
            read as a peer item.

            `flex-wrap` IS THE WHOLE n-SAFETY STORY: one item is one block, four
            items wrap, and nothing balances only at a particular count. 89px
            horizontal at 640px and up is wide enough that the items read as
            separate blocks rather than as a nav bar; 34px vertical when it
            wraps, and 34px between items in the column below 640px, where every
            item sits on the spine.
          */}
          <ul className="mt-xl flex flex-col gap-lg sm:flex-row sm:flex-wrap sm:gap-x-2xl sm:gap-y-lg lg:mt-2xl">
            {/*
              ARRAY ORDER IS DISPLAY ORDER. No sort, no filter, no reverse.
              `content/contact.ts` states that rule; a sort here would be a
              second source of truth for an order the file already shows.

              `key` is the href: unique by construction — two links to the same
              destination would be the bug, not the collision.
            */}
            {contact.map((link) => (
              <li key={link.href}>
                {/* The same mono caption atom the shipped sections use as
                    META / BLOCK_LABEL, retargeted to the pinned foreground. */}
                <span className="text-caption font-mono text-hero-fg/70">
                  {link.label}
                </span>

                {/*
                  8px binds the label to its value as ONE unit — the same 8px
                  Experience uses to bind company to role.

                  `break-words` because a future `value` is an unknown-length
                  string: 360px minus `px-md` twice leaves 318px, and a wrapped
                  string is ugly while a horizontally scrolling page is a
                  defect.

                  `kind` DRIVES THE ANCHOR, NOT THE STYLING. Both branches use
                  the same class constant, so the two look identical and only
                  the semantics differ. A `mailto:` does NOT open a new tab, so
                  it must not carry `target`, `rel` or the new-tab note —
                  announcing a tab that never opens is a lie, which is exactly
                  why `ContactLink.kind` is an explicit discriminant rather than
                  a `href.startsWith("http")` sniff.
                */}
                <p className="mt-xs text-body">
                  {link.kind === "web" ? (
                    <ExternalLink
                      href={link.href}
                      className={`${EXTERNAL_LINK_ON_HERO} break-words`}
                    >
                      {link.value}
                    </ExternalLink>
                  ) : (
                    <a
                      href={link.href}
                      className={`${EXTERNAL_LINK_ON_HERO} break-words`}
                    >
                      {link.value}
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </footer>
  );
}

export default Contact;
