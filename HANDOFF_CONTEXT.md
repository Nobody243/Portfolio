# Handoff Context — Muhammad Saad Portfolio Project

This document is a full context transfer from a prior Claude conversation. Read it fully before
responding to anything else — it replaces the need to re-explain the project.

## Who this is for
Muhammad Saad — final-year IT undergraduate (Bahria University, 7th semester), full-stack/mobile dev
experience (React, Next.js, Flutter, ASP.NET), completed a 2-month fullstack internship at New Web
Order (React/Next.js/Tailwind/Supabase). Notable prior projects: FOLIO (Kafka/Spark, Big Data
Analytics coursework), Aero-Grid (Next.js + FastAPI drone routing), ClashChat (Flutter + Firebase +
Groq AI). Plus two hands-on academic infrastructure builds: a multi-floor call-center network design
(Computer Communication Networks — VLANs, ACLs, RIP routing, DHCP, TFTP, in Cisco Packet Tracer) and
a seven-phase Windows Server enterprise infrastructure (System & Network Administration — Active
Directory, DNS, DHCP, IIS, FTP, RDS, WDS, Cisco NAT). GitHub: Nobody243.

**Current direction:** deliberately pivoting toward Cybersecurity, Cloud Infrastructure, and
Networking/DevOps. No **self-directed or professional** projects in that direction yet — that is
~1 year out. But the direction is not starting from zero: the CCN and SNA coursework above is real,
hands-on networking and infrastructure work. It is academic rather than self-directed, and the site
must say so plainly — it is not nothing, and it is not professional depth either. This portfolio must
NOT claim expertise he doesn't have — positioning is "proven builder with real shipped range and
genuine hands-on infrastructure coursework behind him, deliberately and visibly building toward a
specific technical direction," not "cybersecurity expert."

## What's being built
A scrollable, cinematic, Three.js-driven personal portfolio site. Explicitly meant to avoid generic
AI-portfolio tropes (no fake stats, no fake testimonials, no templated centered-hero layouts). Built
once, designed to be updated with real content over the coming year rather than rebuilt.

## Design philosophy — three-tier energy curve (locked, do not deviate)
- **Tier 1 (peak):** Hero only, plus a small echo at the Contact/close section. Maximum visual
  spectacle budget spent here — this is the one "wow" moment, plus a smaller closing beat.
- **Tier 2 (sustained, lower):** About/Trajectory section, and the Projects *gallery* (card browsing,
  hover/parallax, scroll-triggered reveals). Motion continues but doesn't compete with reading.
  Clicking a project card triggers a shared-element/smooth-morph transition down into Tier 3.
- **Tier 3 (minimal, professional):** Project detail pages, Skills, Experience, Currently Learning.
  Clean, restrained, typography-driven. Motion = subtle reveals/fades only, never 3D spectacle. This
  is where recruiters actually evaluate substance — protect its credibility.
- Smoothness (Lenis-driven scroll feel) runs through the ENTIRE site regardless of tier. "Minimal" ≠
  "static" — it means visually quiet, not un-crafted.

## Hero concept (locked)
Three layered pieces in one React Three Fiber scene:
1. **The name** rendered as actual extruded 3D typography (real geometry, not a flat texture) — the
   main focal object.
2. **Ambient particle/node field** drifting slowly behind the typography, occasionally connected by
   thin lines — evokes a network/systems feel without being literal.
3. **Camera choreography:** starts tight/close on the typography, pulls back and settles into the
   resting hero composition as a minimal preloader (thin progress line or percentage counter, NOT a
   generic spinner) clears — the loading moment is tied directly into the 3D scene, not a separate
   decorative step.
`accent-hero` (#00E5FF) used only as rim-light/glow on the typography, never a flat fill.

**Photo policy:** no photo in the hero (fights the abstract/technical mood). A small, restrained
photo is allowed in the About section only — nowhere else on the site.

## Design system (locked)

**Colors — dark mode (default):**
- `bg-base`: `#0A0A0B` · `text-primary`: `#EDEDED`
- `accent-hero`: `#00E5FF` — fixed, identical in both themes, used ONLY for the hero's 3D glow/lighting
  and the small Contact-section echo. Never used for text/links (fails contrast in light mode).
- `accent-working`: `#14B8A6` (dark) / `#0F766E` (light) — same teal hue family, deliberately
  contrast-tuned per theme (verified 5.34:1+, passes WCAG AA) since a single hex can't pass contrast
  on both a near-black and a near-white background. This is a documented, correct amendment to the
  original "identical hex both modes" spec — the rule is "one consistent hue, tuned for readability
  per background," not literal hex identity for the *working* accent. `accent-hero` alone stays
  identical since it's never used for text.

**Colors — light mode:**
- `bg-base`: `#FDFCFA` · `bg-elevated`: `#F4F4F4` (cards/elevated surfaces)
- `bg-tint-cool`: `#F4F9FF` (faint blue-white, reserved for cloud/infra-leaning content blocks, used
  sparingly) · `bg-tint-warm-green`: `#F8FBF8` (faint green-white, code/dev-leaning blocks, sparingly)
- `text-primary`: `#151515`
- These two tinted whites are a deliberate, subtle echo of the cyber(green)/cloud(blue) duality —
  quiet background tints only, never competing primary surfaces.

**Typography — golden ratio scale (base 16px, ×1.618 per step):**
- `text-caption` ~10px target, but implemented as 12px deliberately (legibility/accessibility
  override — documented deviation, do not "fix" back to 10px)
- `text-body`: 16px · `text-h4`: ~26px · `text-h3`: ~42px · `text-h2`: ~68px · `text-h1`: ~110px
  (hero only, clamp() for responsiveness)
- Fonts: Space Grotesk (headings/UI/body), JetBrains Mono (technical labels/tags/stats only — not
  body copy, avoid overuse or it becomes a terminal gimmick)
- Spacing: Fibonacci scale `3, 5, 8, 13, 21, 34, 55, 89, 144, 233` (px) — approximates golden ratio,
  easier to work with than exact ×1.618 spacing.

## Site structure (7 sections)
1. Hero (Tier 1) — name, one-line identity statement, 3D moment, scroll cue
2. About/Trajectory (Tier 2) — dev foundation → systems coursework → deliberate pivot narrative,
   small photo allowed here
3. Skills (Tier 2→3) — three groups: Core Dev / Systems Foundation / Currently Building Toward
   (DevOps/Cloud/Security — sparse, meant to grow)
4. Projects (Tier 2 gallery → Tier 3 detail) — FOLIO, Aero-Grid, ClashChat cards → click → smooth
   transition into clean detail page
5. Experience (Tier 3) — New Web Order internship, resume-clean
6. Currently Learning / In Progress (Tier 3) — honest, sparse now, structured to update over time,
   optional "last updated" note
7. Contact/Close (small Tier 1 echo) — real links only (email, GitHub, LinkedIn), slight polish uptick

## Tech stack (locked)
Next.js (App Router) + TypeScript, React Three Fiber + drei, GSAP + ScrollTrigger, Lenis (smooth
scroll site-wide), Framer Motion (component-level/shared-element transitions), Tailwind CSS, deployed
to Vercel. No backend, no database, no auth — content lives in structured TS/JSON data files under
`/content` (or wherever the actual scaffold put it), not hardcoded in components — this is what makes
"build once, update over the year" work.

## Documents that exist (project root + /docs)
- `CLAUDE.md` — **must stay at project root**, not in /docs (Claude Code auto-loads it from root only)
- `docs/01_PRD.md` — product requirements, features, user flow, MVP scope, explicit non-goals
- `docs/02_TECHNICAL_ARCHITECTURE.md` — stack reasoning, folder structure, content-as-data shapes
- `docs/03_FRONTEND_SPEC.md` — full design system as detailed above, including the accent-tuning
  clarification
- `docs/04_FEATURE_TICKETS.md` — 16 tickets in build order (see below)
- `docs/05_GIT_SECURITY_CHECKLIST.md` — mandatory pre-commit checklist (gitignore hygiene, no
  hardcoded secrets, review `git status` before every commit, secret-scan discipline)

A Security & Access Document was deliberately NOT created — no auth/database/user roles exist on this
static site, so that template didn't apply.

## Feature tickets (16 total, in order)
1. Project scaffold — Next.js+TS+Tailwind+R3F+GSAP+Lenis+Framer Motion installed, folder structure,
   theme tokens as CSS variables, dark default
2. Content data layer — projects.ts, skills.ts, currentlyLearning.ts with real data
3. Hero section (loader + reveal + 3D scene) — the riskiest/most novel ticket
4. About/Trajectory section
5. Skills section (three groups)
6. Projects gallery + card component
7. Project detail page ([slug] route)
8. Experience section
9. Currently Learning section
10. Contact/close section
11. Theme toggle (light/dark)
12. Responsive + accessibility pass
13. Deploy to Vercel
14. Contact form (should-have) — first point a real secret/API key enters the project
15. Resume/CV download (should-have)
16. Lightweight analytics (should-have)

## Claude Code setup — skills installed
- `taste-design` (from `google-labs-code/stitch-skills` marketplace) — enforces anti-generic-AI-design
  rules (bans neon-everywhere, fake stats, centered-hero clichés, forces real typography/asymmetric
  layouts)
- `core-3d-animation` bundle (from `freshtechbro/claudedesignskills`, marketplace name
  `claude-design-skillstack` — NOT `claudedesignskills`, that's just the repo path) — 5 skills:
  babylonjs-engine, react-three-fiber, motion-framer, gsap-scrolltrigger, threejs-webgl
- `meta-skills` bundle (same marketplace) — 2 skills: modern-web-design, web3d-integration-patterns
- Both `core-3d-animation` and `meta-skills` are properly project-scoped (recorded in
  `.claude/settings.json` → `enabledPlugins`)
- Stitch's own generative screens (`stitch-design`/`stitch-build`/`stitch-utilities`) were installed
  but are **non-functional** — they require a separate Stitch MCP server (Google Cloud project +
  `gcloud` auth), which was deliberately NOT set up (not worth the GCP overhead given the design
  system is already fully locked). Stitch's web app (stitch.withgoogle.com) was also tried directly
  for a hero mockup and abandoned — it kept generating generic AI-portfolio aesthetics regardless of
  prompt constraints, confirming taste-design (rule-enforcement) was the better tool choice over
  Stitch (generation) for this project.

## Claude Code setup — 4 subagents
Files at `.claude/agents/{planner,designer,implementer,reviewer}.md`. Each must be launched as its
own dedicated session via `claude --agent <name>` (NOT plain `claude` — that does not enforce the
agent's tool restrictions, it just role-plays based on chat instructions). Saad runs 4 terminal tabs,
one per agent.

- **planner** — tools: Read, Write, Grep, Glob. Reads CLAUDE.md + all /docs files + the specific
  ticket, produces a numbered implementation plan, writes it to
  `.claude/handoff/ticket-{N}-plan.md`. Never edits code.
- **designer** — tools: Read, Write, Grep, Glob. Reads the plan handoff file, works strictly within
  `03_FRONTEND_SPEC.md`, uses taste-design skill, writes a design brief to
  `.claude/handoff/ticket-{N}-design.md`. Never edits code.
- **implementer** — tools: Read, Write, Edit, Bash, Grep, Glob. Reads plan + design handoff files,
  implements exactly what they specify, follows `05_GIT_SECURITY_CHECKLIST.md` before every commit
  without exception, writes `.claude/handoff/ticket-{N}-implementation.md` when done.
- **reviewer** — tools: Read, Grep, Glob ONLY (no Bash, no Write, no Edit — this is deliberate and
  mechanically enforced, not just instructed, after an earlier version with Bash access was found to
  have a loophole allowing file writes via shell redirection even without Write/Edit tools). Cannot
  run `npm run build`/`tsc`/`lint` itself — must ask Saad to run commands and paste output back.

**Known gap as of last check:** `.claude/handoff/` folder does not actually exist yet — no ticket
handoff notes have been saved despite the agent prompts requiring it. This should start happening
going forward; it's what makes the scope/context questions self-answering between agents.

**Important:** any time `.claude/agents/*.md` files are edited, ALL 4 terminal tabs must be fully
restarted (`claude --agent <name>` again, not resumed) for the new definitions to load — Claude Code
only reads the agent registry at session start.

## Git / security state
- `.gitignore` covers: `node_modules/`, `.next/`, `.env*` (with `!.env.example` exception added),
  `.DS_Store`, `*.log` (broadened from just npm/yarn/pnpm debug logs per the checklist), plus
  `.claude/settings.local.json` and `.mcp.json` / `**/.mcp.json` (pre-emptive — blocks future MCP
  server credentials from ever being committed if the Stitch MCP or similar is set up later)
- `.env.example` created at root with a placeholder `CONTACT_FORM_API_KEY` for future Ticket 14
- Full git history secret-scan completed by the reviewer agent: **clean**. No credential-format
  matches (AWS, GitHub, Google, Stripe, Slack, JWT, PEM, DB connection strings, etc.) across any
  reachable or orphaned commit. No remote connected yet — nothing has ever been pushed anywhere, so
  even if something had been missed, there's currently zero external exposure.
- One commit (`71b4176`) was amended to `8e70275` — verified via `git diff --stat` to be message-only
  (fixed a stray `@` typo in the commit subject), no content change. Benign, confirmed.
- Real secrets don't enter this project until Ticket 14 (contact form API key) — until then, low risk,
  but the checklist habit is meant to already be in place before that ticket arrives.

## Current implementation state (as of last reviewer audit)
Ticket 1 is largely complete (Next.js + TypeScript + Tailwind scaffold, Lenis smooth scroll working).
Early groundwork also landed for **Ticket 3** (hero: `PlaceholderScene.tsx`, `SceneCanvas.tsx`,
`accentHero.ts`) and **Ticket 7** (a `/projects/[slug]` stub with just a `.gitkeep`) — flagged and
reviewed as acceptable early risk-retirement (proving R3F renders correctly under React
19/Next 16/Turbopack early is genuinely valuable), NOT a problem to revert.

**Verified passing in review:**
- The Tier 1/Tier 2-3 accent color split is mechanically enforced, not just conventional: `--accent-hero`
  is declared once in `globals.css`, deliberately kept outside Tailwind's `--color-*` namespace so
  `bg-accent-hero`/`text-accent-hero` utility classes literally cannot be generated — a compile-level
  guard. Only consumer is `PlaceholderScene.tsx`'s mesh material. `accent-working` correctly differs
  per theme matching the documented contrast rationale.
- `SceneCanvas.tsx` is technically strong: DPR clamped to [1,2] (correct R3F perf practice), `alpha:
  true`, `frameloop="demand"` default, proper `aria-hidden`, inner `<Suspense>` boundary, correct SSR
  reasoning (R3F's Canvas emits identical HTML both sides, no `next/dynamic` needed).
- Security checklist: clean, no secrets in any staged file, commit messages specific and ticket-scoped.

**Outstanding action items given to the implementer agent (verify these were actually completed
before doing anything else — if this is a fresh session, check the current repo state first):**
1. Extract a `useReducedMotion` hook into `lib/` or `hooks/` BEFORE starting Ticket 3 — `SceneCanvas.tsx`
   itself declares "if a third consumer appears, extract it," and Ticket 3 will be that third consumer
2. Relabel `SceneCanvas.tsx`'s comment — it currently falsely claims "Ticket 3 should not need to edit
   this file," but Ticket 3 will need to add a camera prop and likely bloom post-processing on
   `--accent-hero`. Soften to something honest like "Ticket 3 may need to edit this file for camera
   configuration and scene content."
3. Commit `docs/05_GIT_SECURITY_CHECKLIST.md` — was untracked (the document governing every commit
   wasn't itself in git history)
4. Broaden `.gitignore`'s `*.log` coverage (was only npm/yarn/pnpm-debug-specific, narrower than the
   checklist itself specifies)
5. Replace "Lorem ipsum placeholder text" in `page.tsx` with a `TODO(ticket-N):` comment matching the
   convention used everywhere else in the codebase
6. Add a comment documenting the `--text-caption` 12px-vs-~10px golden-ratio deviation (deliberate
   legibility choice — do NOT revert the value, just document why it differs from the spec math)
7. Stage/commit the `.claude/agents/*.md` edits separately (were unstaged, at risk of being left
   behind if hero/code files were committed without them)
8. Start actually writing to `.claude/handoff/ticket-{N}-*.md` going forward — this hasn't been
   happening despite being required by every agent's system prompt

**Also still unverified — Saad needs to run these locally and share the output:**
```bash
npm run build
npx tsc --noEmit
npm run lint
```
Specifically need confirmation that Next 16's generated route types resolve correctly —
`PageProps<"/projects/[slug]">` and `LayoutProps<"/">` — since `.next/types` needs to have been
generated at least once for that to be checkable.

## What to do next
1. Confirm whether the 8-item punch list above was actually completed (check `git log`, check the
   actual files) — don't assume it was, verify against the real repo state.
2. Get the `npm run build` / `tsc` / `lint` output from Saad and confirm it's clean.
3. If both check out, move to closing out Ticket 1 fully, then Ticket 2 (content data layer — real
   project/skills/currently-learning data), then the big one: Ticket 3 (hero), using the
   planner → designer → implementer → reviewer chain with real handoff files this time.
4. Maintain the working style Saad has established throughout this project: he wants to direct and
   verify each step himself, not have large changes applied blindly — keep giving him reviewable,
   incremental checkpoints rather than large autonomous batches of work.
