# Technical Architecture Document — Muhammad Saad Portfolio

## Tech stack, with reasoning

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Saad already knows it from the internship; strong performance/SEO defaults matter since recruiters will cold-load this link |
| 3D | React Three Fiber + drei | Three.js expressed as React components — avoids fighting React's render loop with imperative Three.js code; drei supplies common helpers (camera rigs, loaders) so we're not reinventing them |
| Scroll-synced animation | GSAP + ScrollTrigger | Industry standard for precisely choreographed scroll timelines — this is what actually drives the Tier 1 → 2 → 3 energy curve |
| Smooth scroll | Lenis | Gives the whole site the "buttery" felt-smoothness that's part of the brief even in the minimal Tier 3 sections |
| Component-level transitions | Framer Motion | Handles the project-card → detail shared-element transition and general UI micro-interactions; kept separate from GSAP so the two don't fight over the same elements |
| Styling | Tailwind CSS | Fast, already known, works well for the restrained Tier 3 sections |
| Hosting | Vercel | Zero-friction with Next.js, already used for other projects (Aero-Grid) |
| Fonts | Space Grotesk (headings/UI), JetBrains Mono (technical accents) | See Frontend Spec doc |

No backend framework, no database, no auth provider — this is a static/content-driven site. If a contact
form is added, it posts to a lightweight serverless function or a third-party form endpoint (see
"Third-party services" below) rather than a custom backend.

## Folder structure

```
/app
  /(site)
    /page.tsx                — Hero + all sections composed on one scroll (or routed sections, TBD at build time)
    /projects/[slug]/page.tsx — Project detail pages
  /layout.tsx
  /globals.css
/components
  /hero                      — 3D scene, loader, reveal transition
  /sections                  — About, Skills, Experience, CurrentlyLearning, Contact
  /projects                  — ProjectCard, ProjectGallery, ProjectDetail
  /ui                        — shared primitives (buttons, section wrappers, theme toggle)
/content
  types.ts                   — shared content types. NOT in the original listing: a deliberate
                               fourth file, because Project.category is typed as SkillGroup and
                               colocating types would force projects.ts to import skills.ts.
                               Flagged in the style of the lib/hooks/ deviation recorded in
                               .claude/handoff/review-fixes-2026-08-17.md.
  projects.ts                — structured project data (see "Content shape" below)
  skills.ts                  — structured skills data, grouped by SkillGroup
  currentlyLearning.ts       — structured "in progress" entries
/lib
  /three                     — reusable R3F scene helpers
  /animation                 — GSAP timeline configs, shared easing curves
/public
  /fonts, /models, /images
```

## Content shape (plain English — this replaces a database schema)

There is no database. Content lives in typed data files under `/content`, imported directly into
components. This is what makes "build once, update over the year" actually work — adding a project or
cert later means editing an array, not touching layout code.

**Project entry** — one object per project (FOLIO, Aero-Grid, ClashChat, future security projects):
- `slug` — URL-safe identifier, used for the detail page route
- `title`, `oneLiner` — name and a one-sentence description for the gallery card
- `description` — fuller write-up for the detail page (problem, approach, what was built)
- `stack` — array of technologies used
- `links` — object with optional `github` and `live` URLs (omit rather than fabricate if one doesn't exist)
- `date` — when it was built/shipped
- `credit` — optional honest credit line, omitted when the work was solely Saad's. It does two
  things: it stops shared work from being silently presented as solo work, and where Saad's role was
  a leading one it says so plainly ("Led a team of 4"). It is **not** a job title — it describes what
  happened on one project, not a position held. Every value must be one Saad has explicitly
  confirmed. Where a collaborator has not consented to being named publicly, the credit states the
  team size and role without naming anyone — it never guesses at consent.
- `category` — which skill group the project belongs to, typed as `SkillGroup` (useful if projects
  are later filtered). **Renamed from `tier` in Ticket 2.** `tier` is reserved project-wide for the
  Tier 1/2/3 motion system and is never used as a data field name, anywhere. The rename exists so
  `project.tier === "core-dev"` can never sit inside a Tier 2 component next to Tier-2 motion config.
- `coverImage` — the single image the gallery card uses: `{ src, alt }`. **Required** — every project
  has one, so Ticket 6 never needs a no-image fallback card. Kept as a separate field from
  `screenshots` so the card's pick never depends on screenshot ordering; it may point at the same
  file as one of them.
- `screenshots` — ORDERED array of `{ src, alt, caption }` for the detail page. Deliberately an array,
  not one image: a project's interface is not always one view. FOLIO puts its search interface and its
  results view on **separate pages**, and both need capturing and showing — as a small gallery or a
  before/after pair — or the detail page misrepresents how the thing actually works. Single-view
  projects (Aero-Grid, ClashChat) simply have a shorter array, so the detail page must render 1, 2, or
  n images without assuming a pair. `caption` is what labels each view ("Search", "Results"); `alt` is
  the accessibility description and is required, not optional (see Ticket 12).

Image notes — **settled in Ticket 2:**
- Images are **static imports**, not string paths: `import cover from
  "@/public/images/projects/folio/cover.png"`. Chosen over string paths + explicit `width`/`height`
  for two reasons: a missing or misnamed file becomes a **build error** rather than a broken image in
  production, and `StaticImageData` carries real intrinsic dimensions, so `next/image` prevents
  layout shift with nothing hand-copied. `import type { StaticImageData } from "next/image"` is the
  one permitted `next/*` reference under `/content` — it is type-only and erased at compile time.
- Screenshot counts **vary**: 0 for CCN and SNA, 1 for FOLIO, 2 for Aero-Grid and ClashChat. Ticket 7
  must render 0, 1 or n without assuming a pair. Projects with no additional images **omit the
  `screenshots` key entirely** rather than setting `[]`.
- `alt` is content and is required on every image — accurate, hand-written, describing what is
  actually on screen. `caption` is separate, optional, visible editorial copy and never substitutes
  for `alt`.

**Skill entry** — one object per skill:
- `name`, `group` (`"core-dev" | "systems-foundation" | "building-toward"`), optional `note`

**Currently Learning entry** — one object per in-progress item:
- `title`, `status` (`"in-progress" | "planned" | "completed"`), `description`, `startedDate`,
  optional `completedDate`, optional `link` (cert page, course, etc.). Lifecycle: a completed item
  **graduates** out of this section into `skills.ts` under `building-toward` rather than lingering
  here, so "Currently Learning" stays literally true while the achievement stays visible;
  `completedDate` records that transition. An **empty array is a valid, honest state** for this file.

## Configuration / environment notes

- No secrets are required for the core site (no auth, no database).
- If a contact form is added: store the form-handling service's API key (e.g. Resend, Formspree) as an
  environment variable in Vercel's project settings — never commit it to the repo, and never expose it
  client-side (route form submissions through a server action or API route, not directly from the
  browser).
- If analytics is added (Vercel Analytics or similar), no manual API key handling is typically needed —
  confirm against that service's current docs at setup time.
- Standard baseline security hygiene, even without a security document: keep dependencies updated,
  don't expose any `.env` file in the repo (confirm `.gitignore` covers it, per the lesson already
  learned on ClashChat), and if a form endpoint exists, add basic rate-limiting or a honeypot field to
  deter spam — full auth/role-based security modeling isn't applicable since there are no user accounts.

## Build order (repeated from CLAUDE.md for reference)
1. Scaffold routing + empty tier structure
2. Hero 3D scene + loader/reveal (highest-risk, most novel — validate first)
3. Tier 2 sections (About, Projects gallery + transition)
4. Tier 3 sections (Project detail, Skills, Experience, Currently Learning)
5. Polish pass: easing, loading states, responsiveness, accessibility, theme toggle
6. Write final narrative copy last — the hero identity line, the About/Trajectory narrative, the
   Experience framing. The structured `/content` data layer is **not** part of this step: it lands
   early, at Ticket 2, because Tickets 5/6/7/9 are built against real data and their acceptance
   criteria are unverifiable against empty arrays.
