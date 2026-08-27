# Muhammad Saad — portfolio

Personal portfolio site. IT undergrad at Bahria University, full-stack builder, deliberately heading
toward cybersecurity and cloud infrastructure — the site's job is to show real shipped work and say
plainly where the direction is going, without claiming expertise that isn't there yet.

Live at **[saaddev.top](https://www.saaddev.top)**.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 — tokens live in `app/globals.css`, which is the source of truth for every value |
| Scroll animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis (root mode, site-wide) |
| Transitions | Motion (Framer Motion) |
| Hero visual | Canvas2D particle field + SVG. **No WebGL** — the earlier Three.js scene was replaced and its packages removed |
| Fonts | Space Grotesk (headings, UI, body) and JetBrains Mono (labels, tags, stats), self-hosted via `next/font` |
| Hosting | Vercel |

No backend, no database, no auth. Everything is statically prerendered.

## Routes

| Route | What's on it |
|---|---|
| `/` | Hero, Trajectory, Skills, the three featured projects, a "Browse All" link, reveal footer |
| `/work` | Headed "Projects." — a fanned card deck of all five, a "Browse All" link to `/projects`, Certifications ("Coming soon."), Experience, Currently Learning, reveal footer |
| `/projects` | The same five as a full-bleed strip list, one row each, between two `Close` links back to `/work`. No reveal footer |
| `/about` | Portrait, longer bio, CV link. Composed to fit a 945px browser window without scrolling, and scrolls anywhere it doesn't |
| `/projects/<slug>` | Project detail. Also renders as an intercepted overlay from a card or strip-row click, at the same URL |

Five projects: FOLIO, Aero-Grid, ClashChat, and two academic infrastructure builds — a multi-floor
call-center network design and a Windows Server enterprise infrastructure. The first three are
featured on `/`; all five are on `/work` and on `/projects`, which hold the same set in two different
presentations rather than two different sets.

The navbar has two centre links, not four. `/projects` is reached from the "Browse All" control
on `/` and on `/work`; `WORK` shows as the active item while you are there.

## Running it locally

Requires npm and Node `>=20.9.0` (Next 16's own `engines` field).

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build — currently 17 prerendered pages
npm start        # serve the production build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## How content is organised

Content is **data, not JSX**. Adding a project, a skill or a certification means editing a file in
`/content`, not rebuilding a section:

```
content/projects.ts           the five projects, plus which three are featured
content/skills.ts             skills, grouped
content/currentlyLearning.ts  the living "in progress" list
content/experience.ts         the internship
content/contact.ts            the real links — email, GitHub, LinkedIn
content/types.ts              shared types
```

Section copy sits beside each component as a `*Content.ts` file (for example
`components/sections/skillsContent.ts`), so prose is never buried in markup either.

## Planning docs

The design and architecture decisions behind all of this are tracked in `/docs` — `01_PRD.md`,
`02_TECHNICAL_ARCHITECTURE.md`, `03_FRONTEND_SPEC.md`, `04_FEATURE_TICKETS.md`,
`05_GIT_SECURITY_CHECKLIST.md`, `06_INTRO_AND_CHROME.md` and `07_SITE_RESTRUCTURE.md`. They are in
the repo on purpose: most of what looks arbitrary in the code has a written reason there, including
the reasons that were later reversed.

---

> This README was `create-next-app` boilerplate until 2026-08-22 — it told the reader to edit
> `app/page.tsx` (a file that doesn't exist here) and said the project used Geist (it doesn't, and
> the design system rules it out). Recorded rather than quietly replaced, because "the docs described
> something that isn't true" is this project's recurring failure and the front page of the repo was
> the worst place for it.

> **The Routes table and the page count were reconstructed on 2026-08-25.** A `git-filter-repo` run
> reset every tracked file to its committed state and destroyed an uncommitted week of work; source
> files were recoverable from `.next` source maps, but markdown is never bundled, so no build
> artefact contained any of it. This table's `/projects` row, its `/work` row and the "17 prerendered
> pages" line are rewrites verified against the code and against a real `npm run build`, not restored
> originals. The `/about` row said "One screen, doesn't scroll" for far longer than that — it
> contradicted `CLAUDE.md` and `docs/07` §6, both of which record that no CSS enforces a single
> screen and that the page scrolls wherever the composition does not fit. That is now corrected here
> too.
