# Muhammad Saad — Portfolio Project

## Reference docs
Full planning documents live in `docs/`. Read the relevant one before working on a related area:
- `docs/01_PRD.md` — product requirements, audience, scope boundaries, success metrics
- `docs/02_TECHNICAL_ARCHITECTURE.md` — stack reasoning, folder structure, content shapes, env/config notes
- `docs/03_FRONTEND_SPEC.md` — color tokens, type scale, motion system, component styles
- `docs/04_FEATURE_TICKETS.md` — the 16 build tickets, prioritized, with acceptance criteria

## Who this is for
Muhammad Saad — IT undergrad (Bahria University, 7th semester), completed a 2-month fullstack internship
(React/Next.js/Tailwind/Supabase) at New Web Order. Strong foundation across full-stack web + mobile
(React, Next.js, Flutter, ASP.NET) and systems coursework (OOP, DSA, C++, Computer Networks, OS,
Assembly, DBMS, Big Data Analytics, DAA). Notable project: FOLIO (Kafka/Spark clothing aggregator, BDA).
Also shipped: Aero-Grid (Next.js + FastAPI), ClashChat (Flutter + Firebase + Groq).

**Current direction:** deliberately pivoting toward Cybersecurity, Cloud Infrastructure, and Networking/DevOps.
No dedicated projects in that direction yet — this is ~1 year out. The portfolio must NOT claim expertise
he doesn't have yet. It should read as: proven builder with real shipped range, who is intentionally and
visibly building toward a specific technical direction.

## Positioning (do not deviate from this)
- NOT "I am a cybersecurity/DevOps expert."
- IS "all-rounder with a clear edge" — real engineering competence (proof: shipped projects + internship),
  pointed deliberately at infra/security as the next chapter.
- The "Currently Learning / In Progress" section is meant to be honest and sparse right now, and updated
  over time as certs/projects/CTFs happen. This is a feature (visible trajectory), not something to hide
  or pad with fluff.
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
1. **Hero** (Tier 1) — name, one-line identity statement (not "full-stack developer" — something that
   signals the trajectory), big 3D moment, scroll cue.
2. **About / Trajectory** (Tier 2) — dev foundation → systems coursework → deliberate pivot narrative.
   Honest, not oversold.
3. **Skills / Stack** (Tier 2–3) — three groups: "Core Dev" (React/Next.js/Flutter/ASP.NET/JS/TS),
   "Systems Foundation" (OOP/DSA/OS/DBMS/Networks/DAA/C++), "Currently Building Toward"
   (DevOps/Cloud/Security — sparse, meant to grow). The grouping itself communicates the positioning.
4. **Projects** (Tier 2 gallery → Tier 3 detail) — FOLIO, Aero-Grid, ClashChat as cards → click → smooth
   transition into clean detail page (problem, stack, what was built, real links, dates). Old
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

## Working style
- Saad prefers to direct and verify changes himself rather than have them applied blindly — propose a
  plan before large changes, keep diffs reviewable.
- Iterative, step-by-step. Don't jump ahead of the current build phase.
- No fabricated content, stats, or testimonials — ever. If something is unknown or not yet true, leave a
  clearly marked placeholder rather than inventing a plausible-sounding fact.
