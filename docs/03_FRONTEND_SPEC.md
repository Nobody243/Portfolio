# Frontend Specification Document — Muhammad Saad Portfolio

## Color system

**Dark mode (default):**
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#0A0A0B` | Primary background |
| `text-fg` | `#EDEDED` | Body/heading text |
| `bg-elevated` | `#121214` | Cards / elevated surfaces — one step up from base |
| `bg-tint-cool` | `#0B1116` | Faint blue undertone — reserved for cloud/infra-leaning content blocks, used sparingly |
| `bg-tint-warm` | `#0B120E` | Faint green undertone — reserved for code/dev-leaning content blocks, used sparingly |
| `accent-hero` | `#00E5FF` | Hero 3D glow/particles/lighting, and the small Contact-section echo ONLY |
| `accent-working` | `~#14B8A6` (tune in-browser for contrast) | Links, tags, highlights, borders — everywhere else |

**Light mode (toggle):**
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#FDFCFA` | Primary background (warm neutral) |
| `bg-elevated` | `#F4F4F4` | Cards / elevated surfaces — one step up from base |
| `bg-tint-cool` | `#F4F9FF` | Faint blue-white undertone — reserved for cloud/infra-leaning content blocks or hover states, used sparingly |
| `bg-tint-warm` | `#F8FBF8` | Faint green-white undertone — reserved for code/dev-leaning content blocks, used sparingly |
| `text-fg` | `#151515` | Body/heading text |
| `accent-hero` | `#00E5FF` — same hex as dark mode | Unchanged; renders on the 3D scene's own dark backdrop. See the accent-tuning clarification below |
| `accent-working` | `#0F766E` (dark mode: `#14B8A6`) | Same teal, darkened for contrast — `#14B8A6` on `#FDFCFA` is 2.44:1 and fails AA for text |

**Rule:** the two tinted whites are a subtle echo of the cyber(green)/cloud(blue) duality — they should
be used as occasional, quiet background tints (e.g. behind a "Systems Foundation" vs "Currently Building
Toward" skill group), never as competing primary surfaces. If in doubt, default to `bg-base` or
`bg-elevated`. No other accent or neutral colors are introduced anywhere in the system.

> **Both tints ship in BOTH modes.** An earlier version of these tables listed `bg-elevated` and the
> two tints under light mode only, which read as though they were a light-mode technique. They are
> not. Measured against their own base in CIE L\*a\*b\*, the dark tints sit at ΔE ~ 4.0 (cool) and 4.2
> (warm) versus ΔE ~ 4.7 for the light cool tint — comparable. And in dark mode both tints are *more*
> distinct from base than `bg-elevated` is (ΔE 2.89), because the tints differ mostly in chroma while
> `elevated` differs only in lightness. Ticket 6 should know that before assuming `elevated` reads as
> a card surface on dark — it may need a border to register.
>
> Caveat on the measurement: ΔE\*ab is least reliable near black, where both dark values sit on
> CIE Lab's linear branch. Treat these numbers as "clears the bar computationally, proceed on design
> grounds", not as "confirmed visible on every display". Verify tinted blocks on a dim screen.
>
> `app/globals.css` is the source of truth for all six hexes.

**Accent tuning clarification:** `accent-hero` is fixed across both themes (`#00E5FF`) — it's used only
as a glow/lighting effect on the hero's 3D scene, never for text, so contrast rules don't apply to it.
`accent-working` may be contrast-tuned per theme (e.g. a slightly different exact hex in light vs. dark)
to meet WCAG AA text-contrast requirements against that theme's specific background — this is expected
and correct, not a violation of the design system. The rule is "one consistent teal hue family, tuned
for readability per background," not "one identical hex regardless of background."

## Typography — golden ratio scale

Base unit: `16px` (1rem). Scale multiplier: `×1.618` per step.

| Token | Size | Approx. use |
|---|---|---|
| `text-caption` | `12px` (0.75rem) | Meta labels, tags, timestamps — set in JetBrains Mono |
| `text-body` | `16px` | Base reading size |
| `text-h4` | `~26px` (16 × 1.618) | Sub-headings, card titles |
| `text-h3` | `~42px` (16 × 1.618²) | Section sub-headers |
| `text-h2` | `~68px` (16 × 1.618³) | Section headers |
| `text-h1` | `~110px` (16 × 1.618⁴), clamp() for responsiveness | Hero headline only |

> **`text-caption` deviates from the ratio, on purpose.** A strict 16 ÷ 1.618 lands at ~9.9px, and
> the shipped token is `0.75rem` (12px). At 10px, JetBrains Mono with this scale's `0.08em` tracking
> is below comfortable reading size for the meta labels it is used on — the ratio was serving the
> scale instead of the reader. `app/globals.css` is the source of truth for every token value in this
> table; do not "restore" 10px to satisfy the multiplier.

**Line height:** `1.6` for body text (already near-golden-ratio, keeps long-form reading comfortable).
Headings tighter, around `1.1–1.2`.

**Spacing:** use a Fibonacci-derived scale (approximates the golden ratio and is easier to work with in
practice) for margins/padding/section gaps: `8, 13, 21, 34, 55, 89, 144` (px). This keeps the
heading-to-text relationship and overall rhythm consistent with the ×1.618 type scale rather than
arbitrary spacing values.

### Section layout rules

*Established in Ticket 4 and binding on every section ticket that follows. These lived only in an
untracked handoff file until 2026-08-19; they are site-wide architecture, not one section's notes.*

**Rule S-1 (site spine).** Every section, Tier 2 and Tier 3 alike, aligns its leading edge to the
same left inset inside the same 1440px centred container. **Nothing on this site is ever a centred
content column.** The site's negative space lives on the right. Shipped insets: `px-md` (21px) below
640px, `px-xl` (55px) at 640-1023px, `px-2xl` (89px) at 1024px and above, inside
`mx-auto w-full max-w-[1440px]`.

The hero established this deliberately — its wordmark is an object in a space and the text is an
annotation anchored to the frame. Re-centring any later section would retroactively demote that to an
artefact of the 3D layout rather than a compositional claim.

**Rule S-2 (section seam).** The standard seam between two adjacent `bg-base` sections is
`spacing-2xl` bottom + `spacing-2xl` top = **178px, uniform at all breakpoints**. There is exactly one
documented exception: About opens at `spacing-3xl` (144px) at ≥640px, because the hero ends in a hard
`bg-hero-surface` → `bg-base` colour edge with no gradient, and that edge has to land in empty space
rather than immediately above a heading. **Sections that do not follow a hard edge do not pay that
cost** — About's larger opening is hero debt, not precedent. The Contact section (Tier 1 echo, on its
own dark surface) may set its own vertical rhythm, and must say so where it does.

**Fonts:**
- Space Grotesk — all headings, UI, body text
- JetBrains Mono — technical labels, tags, stats, stack badges on project cards, hero name treatment
  (used deliberately, not everywhere — overuse turns it into a terminal gimmick)

## Motion system — three-tier energy curve (see CLAUDE.md for full rationale)

**Hero — load-in and reveal (Tier 1, peak):**
1. Minimal preloader while assets/fonts load — a thin progress line or small percentage counter, not a
   generic spinner
2. Reveal transition: camera pull-back preferred (3D scene starts zoomed/abstract, eases into resting
   composition as loader clears) — ties the loading moment directly into the 3D scene rather than being
   a separate decorative step
3. Headline text stagger-reveals immediately after the camera settles
4. `accent-hero` (`#00E5FF`) used for glow/particle color in this moment only

**About/Trajectory + Projects gallery (Tier 2, sustained):**
- Scroll-triggered reveals (fade/slide-in) as sections enter viewport
- Project cards: hover states with subtle depth/parallax, staggered entrance on scroll
- Card → detail transition: shared-element morph (Framer Motion `layoutId`) — the card itself
  visually expands/settles into the detail page rather than a hard route cut

**Project detail, Skills, Experience, Currently Learning (Tier 3, minimal):**
- Simple fade/slide reveals only, no 3D, no parallax
- Motion exists to support readability (guide the eye), never to compete with it

**Contact/close (small Tier 1 echo):**
- A modest uptick in polish — slightly more deliberate easing, a small `accent-hero` touch — so the
  site doesn't trail off flat after the minimal Tier 3 sections

**Global:** Lenis smooth scroll runs site-wide regardless of tier. Respect
`prefers-reduced-motion` — fall back to simple opacity fades and skip the 3D reveal/parallax for users
who have that OS setting enabled.

## Component styles

- **Buttons:** two variants — primary (filled, `accent-working`) and ghost (outlined/text-only). No
  gradients, no drop-shadow-heavy "glow" buttons outside the hero.
- **Cards (project gallery):** `bg-elevated` in light mode / a very slightly lighter-than-base surface
  in dark mode, generous padding (Fibonacci scale), subtle border using `accent-working` at low opacity
  rather than a hard-color border.
- **Nav:** minimal, likely a slim fixed bar or a corner menu — should not compete with the hero's first
  3 seconds of impact.
- **Theme toggle:** simple icon-based switch, persists user preference (local state / cookie, not
  localStorage per artifact constraints if built as an artifact — a real deployed Next.js site can use
  localStorage normally).

## Third-party integrations (kept intentionally minimal)

| Service | Purpose | Data sent |
|---|---|---|
| Vercel (hosting) | Deployment | Build output only |
| Optional: Resend or Formspree | Contact form handling, if added | Name/email/message submitted by visitor → routed server-side, never exposes the API key client-side |
| Optional: Vercel Analytics | Lightweight, privacy-respecting page/scroll analytics | Anonymous page-view/interaction events, no PII beyond standard web analytics |

No other third-party services are planned for v1. Anything beyond this list should be added deliberately,
not by default — each additional dependency is another thing to maintain over the "build once, update
over the year" lifespan of this project.
