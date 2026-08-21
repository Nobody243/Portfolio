# Muhammad Saad — Portfolio Project

## Reference docs
Full planning documents live in `docs/`. Read the relevant one before working on a related area:
- `docs/01_PRD.md` — product requirements, audience, scope boundaries, success metrics
- `docs/02_TECHNICAL_ARCHITECTURE.md` — stack reasoning, folder structure, content shapes, env/config notes
- `docs/03_FRONTEND_SPEC.md` — color tokens, type scale, motion system, component styles
- `docs/04_FEATURE_TICKETS.md` — the 16 build tickets, prioritized, with acceptance criteria
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
- React Three Fiber + drei (Three.js in React)
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

**Typography:**
- Headings / UI / body: Space Grotesk
- Technical accents / labels / stats / tags: JetBrains Mono
- No serif fonts anywhere (serif reads editorial/creative-agency, wrong signal for this direction)

## Site structure
0. **Chrome** — a fixed, transparent navbar on `/` only (MS mark + location, ABOUT/[icon]/WORK,
   copy-to-clipboard email + LinkedIn). NO theme toggle in it, deliberately. Entry is a real
   asset Loader followed by the choreographed Intro, whose zoom-in *is* the transition into the
   Hero. Both are specified in `docs/06_INTRO_AND_CHROME.md` — do not re-derive either.
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
   socials), a small polish uptick so the site doesn't trail off flat.

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
