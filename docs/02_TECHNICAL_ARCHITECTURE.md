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
  projects.ts                — structured project data (see "Content shape" below)
  skills.ts                  — structured skills data, grouped by tier
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
- `tier` — which skill group it belongs to (useful if projects later get filtered by category)

**Skill entry** — one object per skill:
- `name`, `group` (`"core-dev" | "systems-foundation" | "building-toward"`), optional `note`

**Currently Learning entry** — one object per in-progress item:
- `title`, `status` (`"in-progress" | "planned" | "completed"`), `description`, `startedDate`,
  optional `link` (cert page, course, etc.)

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
6. Populate real content last
