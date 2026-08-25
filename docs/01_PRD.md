# Product Requirements Document — Muhammad Saad Portfolio

> ## AMENDED 2026-08-22 — this file describes a site shape that no longer exists.
>
> `docs/07_SITE_RESTRUCTURE.md` is the governing spec and it turned **one scrolling page with seven
> sections into four routes** — `/`, `/about`, `/work` and `/projects`. This document predates it by a
> wide margin and nobody had reconciled the two. The amendment blocks below do that, section by
> section, in place.
>
> > **That sentence read "into three routes — `/`, `/about`, `/work`" until 2026-08-25**, and it was
> > right when it was written: `docs/07` moved three. `/projects` arrived later, under
> > `.claude/specs/projects-architecture-spec.md` §3, which is a different spec — so this line was
> > describing `docs/07`'s scope accurately and describing the site inaccurately at the same time. It
> > now names all four and says which spec moved which, because the ambiguity is the whole reason the
> > count went stale unnoticed.
>
> **Nothing is deleted and nothing is silently rewritten.** Every superseded claim is kept in its
> original wording with the correction beside it. This is a decision record; its value is showing what
> was decided and when, and an edit that merely made the file correct would destroy the reason it
> exists. The house style is `docs/06` §2 and `docs/07` §3.
>
> **What this pass does NOT touch, deliberately:** the audience, the problem statement, the
> positioning, and the no-fabricated-content rule. The restructure changed the site's shape, not who
> it is for and not what it is allowed to claim. `CLAUDE.md`'s positioning section is binding and is
> unchanged by this pass. **No new success metric is invented here** — where a metric became
> unmeasurable, it says so and stays on the list.
>
> Every "as built" statement below was checked against the repo at `23d890d` on branch
> `hero-rebuild`, not inferred from the other docs.
>
> ---
>
> ### RECONSTRUCTED 2026-08-25 — read this before trusting a diff of this file
>
> A `git-filter-repo` run reset every tracked file to its committed state and destroyed an
> uncommitted week of work. Source files were recovered verbatim from `.next` source maps; **markdown
> is never bundled, so no build artefact contained a single line of documentation.** Every amendment
> in this file dated **2026-08-25** is a rewrite from
> `.claude/specs/projects-architecture-spec.md` — which survived only because `.claude/` is
> gitignored — and not a restored original. The decisions are the spec's; the *wording* is new, and
> where the spec quotes a superseded sentence that quote is used verbatim and where it does not, the
> superseded sentence is quoted from this file's own committed state.
>
> **Every claim carrying a number or a route was verified against the code before being written
> here**, not taken from the spec: the 17/17 page count off a real `npm run build`, the route list
> off `app/`, the navbar grouping off `components/ui/navContent.ts`, `/work`'s section order off
> `app/(site)/(chrome)/work/page.tsx`. Where the spec described something as finished and the code
> disagrees, the code won — see the fanned deck, which the spec plans in full and which ships
> mid-rebuild as `components/sections/FannedDeckPhase1.tsx`.

## What this is
A scrollable, cinematic personal portfolio site for Muhammad Saad — an IT undergraduate transitioning
from full-stack/mobile development toward Cybersecurity, Cloud Infrastructure, and Networking. The site
functions as a first impression before any recruiter, collaborator, or fellow engineer ever talks to him
directly — "make myself the product."

> **AMENDED 2026-08-22, EXTENDED 2026-08-25 — "a scrollable, cinematic site" is now four routes, not
> one page.** The paragraph above is otherwise accurate and stays as written: the audience, the
> framing and "make myself the product" are unchanged. What changed is the shape.
>
> > **This headline read "is now three routes" until 2026-08-25.** The fourth is `/projects`; its row
> > is below.
>
> | Route | What it carries |
> |---|---|
> | `/` | The cinematic narrative: Hero → Trajectory → Stack → **three** featured projects → reveal footer. Scroll-scrubbed, desktop only. |
> | `/work` | The complete record: all five projects, Experience, Currently Learning. Normal scroll, no pinning, no scrubbing. Reveal footer. |
> | `/projects` | The same five projects as a **full-bleed strip list** — one row each, numeral plus title, the cover fading in from the right at `lg`+. Two `Close` links, above and below, both fixed to `/work` rather than returning to the referrer. Normal scroll. **No reveal footer.** |
> | `/about` | One screen that **deliberately does not scroll at `lg` and up**; it scrolls below `lg`. No footer at all. |
>
> > **That `/about` cell read "The one page with no footer at all" until 2026-08-25, and it is no longer the only one.** `/projects` has no reveal footer either — ruled separately, for a different reason. About's absence is about keeping one page fully quiet (`docs/07` §6); `/projects`' absence is that the page is a list which already ends in its own fixed `Close`, and a curtain would put a second exit under the one the spec asked for. Same outcome, two unrelated arguments, and collapsing them into "the one page" would lose both. `docs/07` §5 now carries the `/projects` ruling.
>
> > **That cell read "One screen that deliberately does not scroll" until 2026-08-23.** One screen that does not scroll AT `lg` (1024px) AND UP; it SCROLLS below `lg`, so the portrait can take the full measure as a square. `docs/07` §6 carries the split, the 252.7px shortfall that forced it and what it does not change. The no-footer half is unchanged and is not a consequence of the scroll rule.
> | `/projects/<slug>` ×5 | Tier 3 detail pages, reachable as a real route or as an intercepted overlay. |
>
> Entry is an asset **Loader** followed by the choreographed **Intro**, whose **phase 7 — a 0.55s
> dissolve of the plate out from under the settled mark — *is* the transition into whatever route was
> loaded** — two separate things with two separate jobs, split in `docs/06_INTRO_AND_CHROME.md` §1 and
> sequenced in its §2.
>
> > **This said "whose `scale: 17` zoom-in *is* the transition into the Hero" until 2026-08-25, and
> > the camera it named had already been retired for three days.** `CLAUDE.md` took that correction on
> > 2026-08-22; this file never got it, which is precisely the "invisible-because-unlisted" failure the
> > header above exists to prevent — the amendment pass that rewrote everything around this sentence
> > left the sentence. Two things were wrong with it. The ×17 zoom-in was **Home's** phase 7 only —
> > `/work` and `/about` already ended on the dissolve — so it described one route out of three and
> > named the Hero as the destination on all of them. And the zoom-in is now retired outright:
> > `docs/07` §3 step 7 has the reasoning, `docs/06` §2 has the phase table (phase 7, `DISSOLVE_S`
> > 0.55s, `power2.in`), and the retired camera is preserved on branch `intro-zoom-in-backup` / tag
> > `intro-zoom-in`. `Hero.tsx`'s arrival was re-derived against it — `ARRIVAL_S` 1.6 → 1.30s,
> > `ARRIVAL_SCALE` 1.12 → 1.04.

## Who it's for
- **Primary:** recruiters and hiring managers evaluating him for internships/entry roles, especially in
  or adjacent to security/cloud/DevOps.
- **Secondary:** fellow engineers/students ("companions") who land on the site via GitHub, LinkedIn, or
  word of mouth and are evaluating credibility/taste as much as content.
- **Tertiary:** future-Saad, six to twelve months from now, using the "Currently Learning" section as an
  honest, visible changelog of his own progress.

## Problem this solves
Right now there's no properly built, unified place that (a) proves real engineering competence through
shipped work, (b) is honest about being early in the security/cloud/DevOps direction rather than
overclaiming it, and (c) doesn't read as a templated, AI-generated, cookie-cutter portfolio — which is
what the overwhelming majority of dev portfolios currently look like.

## Core features

### Must-have (v1)
- Hero section with cinematic load-in/reveal and a signature 3D moment (Tier 1 motion)
- About/Trajectory section narrating the dev-foundation → systems-coursework → security/cloud pivot
- Skills section grouped into Core Dev / Systems Foundation / Currently Building Toward
- Projects gallery (FOLIO, Aero-Grid, ClashChat) with a smooth transition into individual project detail
  pages (problem, stack, what was built, real links, dates)
- Experience section covering the New Web Order internship, framed accurately
- Currently Learning / In Progress section — honest, sparse now, structured to be trivially updated
- Contact/close section with real links only (email, GitHub, LinkedIn)
- Light/dark theme toggle using the locked palette
- Fully responsive (this is the version recruiters will most often open on mobile first)

> **AMENDED 2026-08-22 — six of these nine shipped somewhere other than where this list puts them.**
> All nine still ship; none was dropped. Verified against the repo, not assumed.
>
> | Must-have, as written above | Where it actually is |
> |---|---|
> | Hero with "a signature 3D moment (Tier 1 motion)" | Shipped on `/`, and **it is not 3D**. The scene is a single Canvas2D context plus SVG (`components/hero/ParticleGrid.tsx`, `lib/hero/commandSphere.ts`). **No source module in `app/`, `components/`, `lib/` or `content/` imports `@react-three/fiber`, `@react-three/drei` or `three`** — and the packages themselves were **uninstalled on 2026-08-22**, together with the `"overrides"` block that pinned them. This line read "the three packages are still declared in `package.json` dependencies and are no longer used by anything" until 2026-08-22: `docs/02` recorded the removal and this sentence did not. `package.json` now declares four runtime dependencies plus React — `gsap`, `lenis`, `motion`, `next`, `react`, `react-dom`. The "cinematic load-in" is the Loader/Intro split, not a preloader. |
> | About/Trajectory section | **Split in two.** The dev-foundation → coursework → pivot narrative is the `Trajectory` section on `/`; the 65-word first-person paragraph is `/about`, a separate route (`docs/07` §6). |
> | Skills, three groups | Shipped on `/` as Stack, reading `content/skills.ts`. **"Currently Building Toward" ships with zero entries on purpose** and renders a designed empty state rather than being hidden. |
> | Projects gallery (FOLIO, Aero-Grid, ClashChat) | `/` renders exactly those three, from `featuredProjects`. **`/work` renders all five** as a fanned card deck, adding the CCN and SNA builds; **`/projects` renders the same five** as a strip list. *(This cell said the CCN and SNA builds "are archive-only and are linked from no other route" until 2026-08-25. They now have TWO in-app entry points. `/projects` did that, and it falsified the same sentence in three other places — `ProjectOverlay.tsx`, the `@modal` interceptor page, and `content/projects.ts`.)* |
> | Experience section | **Moved off `/` onto `/work`.** |
> | Currently Learning | **Moved off `/` onto `/work`, after Experience.** `content/currentlyLearning.ts` is an empty array, so the component returns `null` and no section, heading or "last updated" note reaches the HTML. That is the honest state, not a gap. |
> | Contact/close section | **Absorbed into the reveal footer** (`components/sections/RevealFooter.tsx`), on `/` and `/work` only. `components/sections/Contact.tsx` no longer exists. **`/about` and `/projects` each have no footer and zero `contentinfo` landmarks** — About because `docs/07` §6 keeps it deliberately quiet, `/projects` because `docs/07` §5 ruled a curtain would put a second exit under the fixed `Close` the page already ends on. Two routes, two different arguments, same outcome. |
> | Light/dark theme toggle | Shipped, and **it lives in the navbar** — a reversal recorded in `docs/06` §5. The Hero is a pinned dark plate in *both* themes by design (`docs/07` §9.4); that is not a half-built light mode. |
> | Fully responsive | Unchanged as a requirement. Home's scroll-scrub becomes Intersection-Observer reveals below `md` (`docs/07` §7). |

### Should-have (v1 if time allows, else fast-follow)
- Resume/CV download (PDF) synced with site content
- Subtle sound design on key interactions (optional, off by default — many recruiters browse with sound
  muted or in an office; must never autoplay audio)
- Basic on-page analytics (privacy-respecting, e.g. Vercel Analytics) to see what recruiters actually
  look at

### Nice-to-have (post-v1)
- Blog/write-up section for security learning (CTF walkthroughs, cert notes) once there's real content
- A visible timeline/changelog widget for the trajectory (currently handled via the static "Currently
  Learning" section instead — upgrade to a dynamic timeline once there's enough history to show)
- Command-palette style navigation (⌘K) as an easter egg for technically-inclined visitors

> **AMENDED 2026-08-22 — status of the should-haves and the nice-to-haves.**
>
> - **Resume/CV download — SHIPPED, in a different place.** This list and Ticket 15 both say "linked
>   from the hero or contact section". It is neither: it is the **View CV** control on `/about`,
>   opening `public/resume/Muhammad_Saad_CV.pdf` in a modal on desktop and a new tab on mobile.
>   `docs/07` §6 owns that placement.
> - **Sound design — NOT BUILT.** Still optional, still off-by-default if it is ever built.
> - **Analytics — NOT BUILT.** There is no `@vercel/analytics` dependency and no analytics call
>   anywhere in `app/`, `components/` or `lib/`. This is why two of the four success metrics below
>   are currently unmeasurable.
> - **None of the three nice-to-haves is built**, which is the expected state — they are post-v1.

## User flow (primary path)
1. Visitor lands → brief cinematic load-in → hero reveal (name, one-line identity statement, 3D moment)
2. Scrolls into About/Trajectory → understands the "who and why" in under 30 seconds of reading
3. Scrolls into Skills → sees the three-tier grouping, immediately understands positioning without it
   being stated outright
4. Scrolls into Projects gallery → browses cards → clicks one → smooth transition into a clean detail
   page → can leave via a real link (GitHub/live URL) or scroll back
5. Scrolls into Experience → confirms real professional credibility (the internship)
6. Scrolls into Currently Learning → understands this is a person actively building toward something,
   not someone finished
7. Reaches Contact/close → takes an action (email, GitHub, LinkedIn) or leaves with a clear impression

> **AMENDED 2026-08-22 — steps 2 through 7 describe one continuous scroll, and there is not one any
> more.** The primary path as built:
>
> 1. Land on `/` → `AssetLoader` resolves the two above-the-fold webfaces → the seven-phase `Intro`
>    plays → **its phase-7 plate dissolve** hands off into the Hero, with the navbar sliding down on
>    the same frame. *(This step said "its zoom-in hands off" until 2026-08-25 — the second of two
>    references in this file to a camera retired on 2026-08-22. See the entry amendment above.)*
> 2. Scroll into **Trajectory** — the same narrative step 2 above describes, scroll-scrubbed on desktop.
> 3. Scroll into **Stack** — the three groups, with "Currently Building Toward" visibly empty.
> 4. Scroll into the **three featured cards** → click → the overlay morph into project detail → leave
>    by a real link, or close back to the gallery at the same scroll position.
> 5. Scroll past the last section → the **reveal footer** wipes up from behind the page: click-to-copy
>    email, LinkedIn, the MS mark and a year stamp. This is where the old step 7 went.
> 6. **WORK** in the navbar → `/work`: the fanned card deck holding all five projects, a
>    `Browse as a list` exit, Certifications ("Coming soon."), then Experience, then Currently
>    Learning (which currently renders nothing).
> 7. **`Browse as a list`**, from Home's featured row or from `/work` → `/projects`: the same five as
>    full-width strip rows, `Close` back to `/work`. The navbar does not link here and `WORK` stays
>    the active item; this control is the only way in.
> 8. **ABOUT** in the navbar → `/about`: the paragraph, the static mark, and View CV / GitHub /
>    LinkedIn. No footer.
>
> **What that costs, recorded rather than glossed: Experience and Currently Learning are no longer on
> the primary path.** The original steps 5 and 6 put "confirms real professional credibility" and
> "this person is actively building toward something" in front of every visitor who kept scrolling.
> Both now need a click to `/work`. `docs/07` §5 made that trade on purpose — Home is the curated
> narrative, Work is the complete record — and CLAUDE.md calls Currently Learning "the living part of
> the site", so the cost is real and belongs written down. **This is a note, not a request to move
> them back.**

## What v1 (MVP) actually looks like
All seven sections from the site structure, real content throughout (no placeholder Lorem Ipsum, no
fabricated stats/testimonials), light/dark toggle working, responsive on mobile/tablet/desktop, deployed
live on Vercel with a real domain or vercel.app URL, all links real and working.

> **AMENDED 2026-08-22, RECOUNTED 2026-08-25.** "All seven sections from the site structure" is no
> longer the shape. v1 is **four routes plus five project detail pages**, and every one of them is
> prerendered — `next build` reports **17/17 static pages generated**, with no route falling back to
> server rendering. *(Was "three routes … 16/16" until 2026-08-25; `/projects` is the seventeenth
> page. Re-run, not inferred: the route table still lists all five `(.)projects/<slug>` interceptor
> entries and all five `/projects/<slug>` pages, so adding an index route beside `[slug]` did not
> shadow the interception.)* Every
> other clause in the paragraph binds unchanged, and each is still true: real content throughout, no
> Lorem Ipsum, no fabricated stats or testimonials, light/dark working, responsive, deployed, all
> links real.

## Success metrics
Since this isn't a product with signups/revenue, success is qualitative + a few lightweight signals:
- Time-on-site and scroll depth (via analytics) — are people actually reading past the hero?
- Click-through rate from Projects gallery into detail pages
- Direct outcome signals: interview requests, LinkedIn connection requests, GitHub follows/stars
  attributable to the site
- Subjective: does it get an unprompted "this is different" reaction from people who've seen a lot of
  dev portfolios? That's the actual bar being aimed for.

> **AMENDED 2026-08-22 — two of these four cannot be measured today, and nothing is being added to
> compensate.**
>
> - **Time-on-site and scroll depth** — **unmeasured, because no analytics is installed** (see the
>   should-have amendment above). The metric is not wrong; it is switched off. It stays on the list
>   as the thing Ticket 16 turns on. Note also that "scroll depth" meant one page when this was
>   written and now spans four routes, so whatever gets installed has to be read per route.
> - **Click-through from Projects gallery into detail pages** — **still valid, now ambiguous.** There
>   are three surfaces (`/`'s featured three, `/work`'s deck of five, `/projects`' strip list of the
>   same five) and the same click can land as an intercepted overlay or, on a hard load, as the real
>   route. Anything measuring this has to count all three surfaces and both arrival paths, or it will
>   undercount. *(Was "two galleries" until 2026-08-25.)*
> - **Direct outcome signals** and **the subjective "this is different" bar** — unchanged, and still
>   the actual bar being aimed for.
>
> **No new metric is invented here.** Where one became unmeasurable this says so and leaves it.

## Explicitly NOT building in v1
- No CMS/admin panel — content updates happen by editing the structured data files directly and
  redeploying (this is intentional, see Technical Architecture doc)
- No authentication, accounts, or user-generated content of any kind
- No blog/CMS-backed writing platform (the "Currently Learning" section is static text, not a blog engine)
- No e-commerce, no downloadable gated content, no newsletter/email capture
- No multi-language support
- No CTF/write-up content until it genuinely exists — the section stays honest and sparse rather than
  padded with placeholder entries

> **CHECKED 2026-08-22 — this section is unchanged and every exclusion still holds against the built
> site.** No CMS or admin panel; no auth or accounts; no blog engine; no e-commerce, gated content or
> email capture — **there is no `<form>` element anywhere in `app/` or `components/`**, and Ticket
> 14's contact form is [S] and unbuilt; no multi-language; and `content/currentlyLearning.ts` is
> still an empty array rather than a padded one. It is recorded as checked rather than left silent,
> because "unchanged" is itself a finding when everything around it moved.
