# Muhammad Saad — Portfolio Project

## Reference docs
Full planning documents live in `docs/`. Read the relevant one before working on a related area:
- `docs/01_PRD.md` — product requirements, audience, scope boundaries, success metrics
- `docs/02_TECHNICAL_ARCHITECTURE.md` — stack reasoning, folder structure, content shapes, env/config notes
- `docs/03_FRONTEND_SPEC.md` — color tokens, type scale, motion system, component styles
- `docs/04_FEATURE_TICKETS.md` — the **18** build tickets, prioritized, with acceptance criteria.
  (This line said 16 until 2026-08-22. Tickets 17 (`og:image`) and 18 (error / not-found pages)
  were added later; `docs/04` itself already flagged the discrepancy against this file.)
- `docs/05_GIT_SECURITY_CHECKLIST.md` — the pre-commit checklist. Binding on **every** commit,
  not just the first. It was the only one of the seven docs missing from this list until
  2026-08-22 — the same invisible-because-unlisted failure recorded against `docs/07` below,
  and worse, because the omitted doc was the security one.
- `docs/07_SITE_RESTRUCTURE.md` — **the governing spec for the three-page site.** Read it before any
  work on the navbar, the Intro, the MS mark, Home's structure, `/work`, `/about`, the scroll-scrub or
  the reveal footer — which is nearly everything. It reverses Rule S-1 for chrome, retires the
  four-category Stack grid, locks the featured three, defines `/about`, and scopes the scrub to Home.
  It was absent from this list until 2026-08-22, which meant the spec governing the entire restructure
  was invisible to any agent that read only this file — precisely the failure the section below exists
  to prevent.
- `docs/06_INTRO_AND_CHROME.md` — the Loader/Intro split and the Intro's confirmed sequence;
  the navbar's scope, its legibility escalation, and where the theme toggle lives now.
  Read it before touching anything named "loader", "intro", "nav", or the theme toggle.

## Who this is for
Muhammad Saad — IT undergrad (Bahria University, 7th semester), completed a 2-month fullstack internship
(React/Next.js/Tailwind/Supabase) at New Web Order. Strong foundation across full-stack web + mobile
(React, Next.js, Flutter, ASP.NET) and systems coursework (OOP, DSA, C++, Computer Networks, OS,
Assembly, DBMS, Big Data Analytics, DAA). Notable project: FOLIO (Kafka/Spark clothing aggregator, BDA).
Also shipped: Aero-Grid (Next.js + FastAPI), ClashChat (Flutter + Firebase + Groq). Plus two hands-on
academic infrastructure builds: a multi-floor call-center network design (Computer Communication
Networks — VLANs, ACLs, RIP routing, DHCP, TFTP, in Cisco Packet Tracer) and a seven-phase Windows
Server enterprise infrastructure (System & Network Administration — Active Directory, DNS, DHCP, IIS,
FTP, RDS, WDS, Cisco NAT).

**Current direction:** deliberately pivoting toward Cybersecurity, Cloud Infrastructure, and
Networking/DevOps. No **self-directed or professional** projects in that direction yet — that is
~1 year out. But the direction is not starting from zero: the CCN and SNA coursework above is real,
hands-on networking and infrastructure work. It is academic rather than self-directed, and the site
must say so plainly — it is not nothing, and it is not professional depth either. The portfolio must
NOT claim expertise he doesn't have yet. It should read as: proven builder with real shipped range
and genuine hands-on infrastructure coursework behind him, who is intentionally and visibly building
toward a specific technical direction.

## Positioning (do not deviate from this)
- NOT "I am a cybersecurity/DevOps expert."
- IS "all-rounder with a clear edge" — real engineering competence (proof: shipped projects + internship),
  pointed deliberately at infra/security as the next chapter.
- The "Currently Learning / In Progress" section is meant to be honest and sparse right now, and updated
  over time as certs/projects/CTFs happen. This is a feature (visible trajectory), not something to hide
  or pad with fluff.
- Ticket 4's About/Trajectory narrative follows that arc: academic foundations through coursework
  (CCN — VLANs/routing/ACLs; SNA — AD/DNS/NAT/IIS), now building toward professional depth via
  self-directed projects and certifications. This framing is both stronger and more honest than
  either "nothing yet" or an overclaim.
- Avoid generic portfolio tropes: no fake stats ("50+ projects," "25+ happy clients"), no fake
  testimonials, no vague marketing copy ("I craft exceptional digital experiences"). Every claim on the
  site must be true and specific.

## Design philosophy — three-tier energy curve
The site's visual intensity is deliberately NOT flat. It decreases in stages as the user moves from
identity/spectacle toward content/proof:

- **Tier 1 (peak)** — Hero only, and a small echo at the final Contact/Close section. Full 3D spectacle
  budget spent here. This is the one "wow, this isn't a template" moment (+ a smaller closing beat).
- **Tier 2 (sustained, lower)** — About/Trajectory section, and the Projects *gallery* (card browsing,
  hover states, parallax, scroll-triggered reveals). Motion continues but doesn't compete with reading.
  Clicking a project card should use a shared-element / smooth morph transition down into Tier 3.
- **Tier 3 (minimal, professional)** — Project detail pages, Skills, Experience, Currently Learning.
  Clean, restrained, typography- and whitespace-driven. Motion here = subtle reveals/fades only, never
  3D spectacle. This is where recruiters actually evaluate substance — protect its credibility.

Smoothness (Lenis-driven scroll feel, well-eased transitions) should run through the ENTIRE site
regardless of tier. "Minimal" ≠ "static" — it means visually quiet, not un-crafted.

## Tech stack
- Next.js (App Router)
- **No WebGL.** The hero is Canvas2D (`ParticleGrid`) plus SVG (the MS mark). This line read
  "React Three Fiber + drei (Three.js in React)" until 2026-08-22; the R3F scene was replaced
  during the hero rebuild and the four packages were uninstalled with zero importers. See
  `docs/02`'s stack table for the full record — including the one file that still looks like
  three.js debris and must not be deleted.
- GSAP + ScrollTrigger (scroll-synced animation timelines — drives the tier energy curve)
- Lenis (smooth scroll, used site-wide)
- Framer Motion (component-level / shared-element transitions, e.g. project card → detail)
- Tailwind CSS
- Deploy target: Vercel

## Design system
**Color (dark mode = default, light mode via toggle, same accent hue in both — lightness tuned per mode
for contrast):**
- Dark bg: `#0A0A0B` · Dark text: `#EDEDED`
- Light bg: `#FDFCFA` · Light text: `#151515`
- Hero accent (Tier 1 ONLY — hero glow/particles/lighting, and sparingly in the Contact close beat):
  `#00E5FF`, identical in both modes. It renders on the 3D scene's own dark backdrop, so the page theme
  never applies to it. On `#FDFCFA` directly it is ~1.5:1 — so the Contact close beat must sit it on its
  own dark surface, never as hairline text or a thin rule on the page background.
- Working accent (Tier 2 & 3 — links, tags, highlights, borders, everywhere else): `#14B8A6` in dark
  (7.95:1), `#0F766E` in light (5.34:1). Same teal, darkened for light mode because `#14B8A6` on
  `#FDFCFA` is 2.44:1 and fails AA for text. One hue family, tuned per background — not two accents.
- Rule: no other accent colors. Two accents total, each with one clear job. Never mix.
- `--field-ink` (Tier 2/3, ONE consumer — `/about`'s particle field): `#9EC9D4` in dark, `#33474C` in
  light. **It is not a third accent and must never be used as one** — no utilities exist for it, by the
  same mechanical guard `accent-hero` uses. It exists because `/about` renders the hero's particle mesh
  and, until 2026-08-22, the canvas hardcoded `--accent-hero` — so a Tier 2 page painted a
  full-viewport Tier 1 accent in *both* themes. Teal was refused as the replacement: a full-viewport
  non-interactive layer in the affordance colour is the largest possible version of "a teal frame
  around something you cannot click". Full arithmetic in `docs/03_FRONTEND_SPEC.md` and
  `app/globals.css`.
- **Tier is a property of RENDER SITES, not of code paths.** The leak above was invisible for exactly
  that reason: `grep -rn "accent-hero" components/` returned two hits and reported clean the whole
  time, because generalising a component carried the colour to a new tier without anyone typing the
  token. A component that reads a colour is a render site for that colour everywhere it is mounted.

**Typography:**
- Headings / UI / body: Space Grotesk
- Technical accents / labels / stats / tags: JetBrains Mono
- No serif fonts anywhere (serif reads editorial/creative-agency, wrong signal for this direction)

## Site structure

**THE SITE IS THREE PAGES, NOT ONE SCROLL.** `docs/07_SITE_RESTRUCTURE.md` is the governing spec and
this summary is downstream of it. The numbered list below keeps its original numbering because the
*content* and its tier assignments did not change — only which route each lands on:

| Route | Sections, in order |
|---|---|
| `/` | Hero · Trajectory · Skills · Projects (**the featured three only**) · reveal footer |
| `/work` | The full five-project archive · Experience · Currently Learning · reveal footer |
| `/about` | **Composed to fit 1920×1080 without scrolling; scrolls anywhere it does not fit.** There is no CSS enforcing a single screen any more — no `h-dvh`, no `overflow-hidden` — so the non-scroll outcome is a property of the composition rather than a rule, and nothing is ever clipped. The guarantee narrowed twice on 2026-08-23: `lg`+ → `xl`+ → 1920×1080 only, each time on Saad's call. `docs/07` §6 carries all three and the 252.7px shortfall that forced the first. No reveal footer, deliberately, at any width — see `docs/07` §5–6 |
| `/projects/<slug>` | Tier 3 detail, plus an intercepted overlay at the same URL. **No navbar** |

0. **Chrome** — a fixed, transparent navbar on `/`, `/work` and `/about` (MS mark + location,
   ABOUT/[icon]/WORK, theme toggle, copy-to-clipboard email + LinkedIn). It is permanently visible
   and carries an active-route indicator. Entry is a real asset Loader followed by the choreographed
   Intro, whose **final phase — a 0.55s dissolve of the plate out from under the settled mark —
   *is* the transition into whatever route was loaded**. Both are specified in
   `docs/06_INTRO_AND_CHROME.md` — do not re-derive either.

   > **This said "whose zoom-in *is* the transition into the Hero" until 2026-08-22.** Two things
   > were wrong with it by then. The ×17 zoom-in was Home's phase 7 only — `/work` and `/about`
   > already ended on the dissolve — so the sentence described one route in three and named the Hero
   > as the destination on all of them. The zoom-in is now retired outright and the dissolve is the
   > only ending on every route: `docs/07` §3 step 7 has the reasoning, `docs/06` §2 has the phase
   > table, and the retired camera is preserved on branch `intro-zoom-in-backup` / tag
   > `intro-zoom-in`. `Hero.tsx`'s arrival was re-derived against it — `ARRIVAL_S` 1.6 → 1.30s,
   > `ARRIVAL_SCALE` 1.12 → 1.04.

   > **This bullet said "a fixed, transparent navbar on `/` only" and "NO theme toggle in it,
   > deliberately". Both were reversed in Phase 0 (2026-08-21).** `docs/07` §1 put the bar on all
   > three content routes — a one-page site's navbar is optional, a three-page site's is not — and
   > `docs/06` §5 put the toggle back into it, because a desktop visitor on `/` otherwise had no way
   > to switch themes without opening a project or narrowing the window. Hide-on-scroll was deleted
   > separately on 2026-08-22, so the bar no longer retracts. None of these is an oversight to be
   > re-fixed in the other direction.
1. **Hero** (Tier 1) — name, one-line identity statement (not "full-stack developer" — something that
   signals the trajectory), big 3D moment, scroll cue.
2. **About / Trajectory** (Tier 2) — dev foundation → systems coursework → deliberate pivot narrative.
   Honest, not oversold.
3. **Skills / Stack** (Tier 2–3) — three groups: "Core Dev" (React/Next.js/Flutter/ASP.NET/JS/TS),
   "Systems Foundation" (OOP/DSA/OS/DBMS/Networks/DAA/C++), "Currently Building Toward"
   (DevOps/Cloud/Security — sparse, meant to grow; currently ships with **zero** entries —
   deliberately. The empty group is the honest state and Ticket 5 must render it without breaking).
   The grouping itself communicates the positioning.
4. **Projects** (Tier 2 gallery → Tier 3 detail) — FOLIO, Aero-Grid, ClashChat, the CCN call-center
   network design and the SNA enterprise infrastructure build as cards → click → smooth transition
   into a clean detail page (problem, stack, what was built, real links, dates, screenshots). Old
   `my-portfolio-ten-ruddy-35` site excluded or footnoted only, not featured.
5. **Experience** (Tier 3) — New Web Order internship, framed accurately, resume-clean.
6. **Currently Learning / In Progress** (Tier 3) — certs in progress, current focus, optionally a
   "last updated" note. Built to be trivially edited as things change — this is the living part of the
   site.
7. **Contact / Close** (small Tier 1 echo) — real links only (email, GitHub, LinkedIn — no placeholder
   socials), a small polish uptick so the site doesn't trail off flat. **Shipped as
   `components/sections/RevealFooter.tsx`**, a sticky curtain the page scrolls off, on `/` and
   `/work`. The old `Contact.tsx` was absorbed into it in Phase 5 and no longer exists.

## Content architecture (critical)
Projects, skills, and "currently learning" entries must be structured data (TS/JSON arrays), not
hardcoded per-section JSX. Adding a project or cert later = editing a data file, not rebuilding a
section. This is the whole point of building once and updating over the year — do not hardcode content
directly into components.

## Build order (recommended)
1. Scaffold routing + empty tier structure
2. Hero 3D scene first (highest risk/most novel — validate early)
3. Tier 2 sections (About, Projects gallery + transition)
4. Tier 3 sections (Project detail, Skills, Experience, Currently Learning)
5. Polish pass: easing curves, loading states, responsiveness, accessibility, light/dark toggle
6. Populate real content last

## Where decisions live (read before writing any planning doc)

`/docs` is tracked. `.claude/` is gitignored, session-local, and has already been lost mid-task more
than once.

**Any decision that governs more than one ticket belongs in `/docs`, not in a handoff file.** Handoff
files under `.claude/handoff/` are for *this ticket's* working state: intake answers, step lists,
verification notes, findings. The moment a decision constrains a later ticket, it is architecture and
it moves.

This rule exists because it was broken. Rules S-1 and S-2 — the site's spine and section-seam rules,
binding on every remaining section — sat only in `.claude/handoff/ticket-4-design.md` until a Ticket 5
review caught it. Anyone reading only `/docs` would not have known they existed.

**`app/globals.css` is the source of truth for every token value.** `docs/03_FRONTEND_SPEC.md`
describes the system; where the two disagree, the code is right and the doc gets corrected. Four such
divergences have already been found and fixed (`text-caption` size, `bg-tint-warm-green`,
`text-primary`, and a dark-mode table missing three surfaces). Verify a token against `globals.css`
before writing a class name that depends on it — Tailwind does not error on an unknown utility, it
silently renders nothing.

## Working style
- Saad prefers to direct and verify changes himself rather than have them applied blindly — propose a
  plan before large changes, keep diffs reviewable.
- Iterative, step-by-step. Don't jump ahead of the current build phase.
- No fabricated content, stats, or testimonials — ever. If something is unknown or not yet true, leave a
  clearly marked placeholder rather than inventing a plausible-sounding fact.
