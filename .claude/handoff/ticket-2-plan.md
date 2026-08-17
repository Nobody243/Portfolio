# Ticket 2 — Content data layer — FINAL PLAN

Planner: planning agent. Rewritten 2026-08-17, superseding the first draft of the same date.
Amended 2026-08-17 (credit lines, image weight, SNA cover, amendment 3g approval).
Ticket source: `docs/04_FEATURE_TICKETS.md` line 21. Priority **M**. Dependency: Ticket 1 (CLOSED).

**Status: READY TO IMPLEMENT. No blockers. No open questions.**

Content intake is complete. The intake checklist and open-questions table that made up most of the
previous draft are deleted — every value they asked for is now supplied and recorded verbatim in §7.

> **One new item raised by the credit-line amendment: `content/types.ts` needs a DOC-COMMENT edit.**
> Its `credit` comment currently says the field is "NOT a claim about leading a team," and four of the
> five final credit values are exactly that. See §5. Comment only — no type change, no shape change.

---

## 0. What changed since the first draft, and which files are stale

This plan reconciles a draft written before content intake against the current repo. Read this table
before trusting anything you remember from the earlier version.

| Topic | First draft said | Now |
|---|---|---|
| Content intake | Hard gate, 20+ unanswered fields | **COMPLETE.** All values in §7. |
| Open questions | Nine (Q1–Q9) | **All closed.** No Saad input outstanding. |
| Images | one optional `cover?: { src: string; alt: string }` | **Superseded.** `coverImage: ProjectImage` (required) + `screenshots?: readonly Screenshot[]`, both **static imports**, not string paths. |
| Project count | 3 (FOLIO, Aero-Grid, ClashChat) | **5** — CCN and SNA added. |
| `content/types.ts` | proposed | **written, on disk.** One doc-comment edit needed (§5); no type change. |
| `role` field | proposed as `role` | **renamed `credit`** — final values in §7, revised 2026-08-17. |
| currentlyLearning typing | `as const satisfies` like the others | **plain annotation.** `[] as const` has element type `never` and `.map()` fails to compile. |
| Build-order contradiction | open, needed sign-off | **resolved by action** (§2.8) and the docs fix is **approved** (§13, amendment 3g). |
| Image weight | estimated, recommended compressing | **measured** (§17). Saad's decision: **commit as-is.** |

### Two stale files — verify against the filesystem, never against these

**`.claude/handoff/ticket-2-notes.md` is stale on both of its blocking items.** Its "Open — needs
Saad" list is closed:
- It says "screenshots don't exist yet; `public/images/` contains no image files." **Wrong now** — 10
  PNGs exist across five slug-matched folders (verified, §1).
- It says `public/images/Projects/` is misnested as a single chain `Projects/folio/aero-grid/clashchat`
  and carries a capital `P`. **Wrong now** — the directory is lowercase `public/images/projects/` with
  five proper siblings. The capital-`P` risk it raised was real and is worth recording as caught: a
  capital-`P` directory would have resolved fine on Windows locally and then failed Vercel's
  case-sensitive Linux build. That class of bug is invisible until deploy.
- Its items 3, 4 and 5 (amend the ticket docs / pick static-imports-vs-string-paths / captions and alt
  are content) are all now settled — see §13, §2.7 and §7 respectively.

That file should be treated as historical from here. It correctly declined to edit this plan, and its
`coverImage` naming recommendation was adopted.

**The previous `ticket-2-plan.md` (this file's predecessor) was stale on the image shape.** Anything
you recall about a single `cover` field is wrong.

### What carried over unchanged from the first draft

The reasoning below survived intake and is not re-argued here: the `tier` → `category` rename (§4),
`content/types.ts` as a deliberate unlisted file (§5), no barrel file (§5), `as const satisfies` for
projects and skills (§6), Ticket 2 owning the lookup helpers with `getProjectBySlug(slug: string)`
taking a plain string (§8), array order as display order (§2.6), absent things being absent keys, and
the constraint confirmation (§15).

---

## 1. Verified current state

Checked directly against the filesystem for this rewrite, not assumed:

| Check | Result |
|---|---|
| `npm run build` | Clean. Routes: `/`, `/_not-found`, `/projects/[slug]` |
| `npx tsc --noEmit` | Clean, exit 0 |
| `npm run lint` | Clean, exit 0 |
| `content/types.ts` | **EXISTS, written.** Exports `SkillGroup`, `LearningStatus`, `ProjectImage`, `Screenshot` (with `caption?`), `ProjectLinks`, `Project` (with `coverImage`, `screenshots?`, `credit?`, `category`), `Skill`, `LearningEntry` (with `completedDate?`). Uses `import type { StaticImageData } from "next/image"`. Types are correct; one doc comment needs updating (§5). |
| `content/projects.ts` | Does not exist — this ticket creates it |
| `content/skills.ts` | Does not exist — this ticket creates it |
| `content/currentlyLearning.ts` | Does not exist — this ticket creates it |
| `content/.gitkeep` | Exists — deleted by this ticket |
| `tsconfig.json` paths | `"@/*": ["./*"]` — so `@/public/images/...` resolves |
| Image folders | All five match their slugs exactly (below) |

```
public/images/projects/folio/              cover.png  results.png
public/images/projects/aero-grid/          cover.png  simulation.png  results.png
public/images/projects/clashchat/          cover.png  home-dark.png   home-light.png
public/images/projects/ccn-network/        cover.png
public/images/projects/sna-infrastructure/ cover.png
```

Also present: `public/images/.gitkeep`, `public/models/.gitkeep`.
Measured file sizes and dimensions: §17.

All five external URLs verified HTTP 200. The three GitHub repos are public and canonical — redirects
followed, none had moved.

---

## 2. Settled decisions — authoritative, do not reopen

**2.1 `projects` and `skills` use `as const satisfies readonly T[]`.** Compile-verified:
`ProjectSlug = (typeof projects)[number]["slug"]` yields a real literal union, `[...projects].sort()`
works, and `.map()` produces something that satisfies `generateStaticParams`.

**2.2 `currentlyLearning` uses a PLAIN annotation** — `readonly LearningEntry[] = []`, **not**
`as const`. Verified: `[] as const` has element type `never`, so any downstream `.map()` fails to
compile. Applying the house pattern uniformly here would have broken Ticket 9 with an error whose
cause is genuinely hard to see. This asymmetry is deliberate and must be commented in the file so
nobody "fixes" it into consistency.

**2.3 Types live in `content/types.ts`. No barrel file.**

**2.4 `tier` → `category`.** `tier` is reserved project-wide for the Tier 1/2/3 motion system. See §4.

**2.5 `role` → `credit`.** Final values in §7, revised 2026-08-17. The field states Saad's actual role
and ensures shared work is never silently presented as solo work. It is not a job title.

**2.6 Array order IS display order.** No `featured` field, no `order` field — an explicit ordering
field duplicating array position is a second source of truth that will drift. **Display order is
FOLIO, Aero-Grid, ClashChat, CCN, SNA, and it deliberately does NOT match date order** (SNA is the
newest at 2025-12 and sits last). This is a strength-first ordering, not a mistake. Do not "fix" it,
and do not add a date sort in Ticket 6.

**2.7 Static imports for every image.** Compile-verified against the real files. Two reasons, both
load-bearing: a missing or misnamed file becomes a **build error** instead of a broken `<img>` in
production, and `StaticImageData` carries real intrinsic width/height so Ticket 6 gets layout-shift
protection for free with no hand-copied dimensions. `import type { StaticImageData }` is the one
permitted `next/*` reference anywhere in `/content` — it is type-only, erased at compile time, and
creates no runtime coupling.

**2.8 The `docs/02` build-order contradiction is resolved by action.** Line 107 says "Populate real
content last"; Ticket 2 sits at position 2 and populates now. Ticket 2 wins, and the reasoning from
the first draft still holds: Tickets 5/6/7/9 have acceptance criteria that are no-op assertions over
empty arrays ("all three groups render from data", "each project in the data file has a working
detail page"), and the layout decisions those tickets must make — badge wrapping on a 14-item stack,
what a card does with `links: {}`, a gallery that renders 0/1/2 screenshots — are only makeable
against real strings. The two statements were never about the same thing: "populate real content
last" describes **narrative prose written directly into section components** (the hero identity line,
the About narrative, the Experience framing), none of which lives in `/content`. **Saad has approved
the corresponding docs fix** — §13, amendment 3g.

**2.9 `links` stays REQUIRED.** Projects with no URLs get `links: {}`, so consumers never have to
branch on key existence — only on `links.github`/`links.live`.

**2.10 Completed learning items GRADUATE.** A finished cert moves out of `currentlyLearning` into
`skills.ts` under `building-toward` rather than lingering as a `"completed"` entry. "Currently
Learning" stays literally true and the achievement stays visible. `completedDate` records the
transition. Already documented at the field in `types.ts`.

**2.11 Images ship as-is.** Measured, decided, closed — §17.

---

## 3. File manifest

**Creates:**
| File | Contents |
|---|---|
| `content/projects.ts` | 10 static image imports, `projects`, `ProjectSlug`, `projectSlugs`, `getProjectBySlug` |
| `content/skills.ts` | `skills`, `SKILL_GROUPS`, `getSkillsByGroup` |
| `content/currentlyLearning.ts` | `currentlyLearning` (empty), `CURRENTLY_LEARNING_UPDATED` |

**Modifies:**
| File | Change |
|---|---|
| `content/types.ts` | **Doc comment on `credit` only** (§5). No type change, no field change, no shape change. |

**Deletes:**
| File | Why |
|---|---|
| `content/.gitkeep` | Real files now land in `content/` — precedent `a71b59a` |
| `public/images/.gitkeep` | Optional, low-stakes: `public/images/` now has tracked content in five subdirectories, so the keeper is inert. Delete it in the same commit. **Keep `public/models/.gitkeep`** — that directory is still genuinely empty and Ticket 3 may need it. |

Nothing in `app/`, `components/`, `lib/`, or any config file is touched.

**Adds (untracked, needs staging):** `public/images/projects/**` — the 10 PNGs, committed **as-is**
(§17).

**Docs amendments** (§13) — written by the implementer, committed **separately** per the `5f8ac4e`
precedent of keeping doc edits out of code commits. All four files, all amendments approved.

---

## 4. The `tier` → `category` rename

*(Section number preserved deliberately — `content/types.ts` line 89 cross-references "see plan §4".
Renumbering this section breaks that reference.)*

`docs/02_TECHNICAL_ARCHITECTURE.md` line 58 names the field `tier`, meaning "which skill group it
belongs to." That collides head-on with Tier 1 / Tier 2 / Tier 3, the single most load-bearing piece
of vocabulary in this project — it names the motion system, the energy curve, the section grouping,
and half the reasoning in CLAUDE.md and the Frontend Spec.

Shipping it means `project.tier === "core-dev"` sitting inside a Tier 2 gallery component next to
Tier-2 motion config, and eventually someone writes `tier: 2` into a data file.

**Settled: the field is `category`, typed as `SkillGroup`.** `category` is the architecture doc's own
word for it — the field's parenthetical already says "if projects later get filtered by category."
Typing it as `SkillGroup` rather than a free string guarantees a project can only be classified into
a group that actually exists in the skills section.

**Project-wide convention: `tier` is reserved for the motion system and means nothing else, anywhere,
in any file.** Already recorded at the field in `types.ts`; §13 amendment 3 puts it in `docs/02` too.

**One downstream observation, not a problem:** four of the five projects are `systems-foundation` and
one is `core-dev`. `category` is therefore not currently useful as a gallery filter UI — a 4/1 split
isn't a filter, it's a label. Keep the field (it is the honest classification and it will balance out
as projects are added), but Ticket 6 should not build filter chips on it in v1.

---

## 5. `content/types.ts` — correct types, one doc comment to fix

The file exists, its **types are correct**, and it is aligned to `docs/02` commit `354011f`. **Plan
around it. Do not regenerate it.** It already carries `ProjectImage`, `Screenshot` (with `caption?`),
`ProjectLinks`, `Project` (with `coverImage`, `screenshots?`, `credit?`, `category`), `Skill`,
`LearningEntry` (with `completedDate?`), the static-import typing, and the hard rules for `/content`
in its header.

I checked specifically for anything that would force a **type** change and found none:

- `coverImage` is **required**, `screenshots` optional — correct for the real data, since all five
  projects have a cover and two (CCN, SNA) have nothing beyond it.
- `links` required, its two members optional — matches §2.9.
- `credit` optional — correct; all five projects happen to carry one, but the optionality is right.
- `Screenshot.caption` optional — correct; §7 uses no captions, and none are needed.

### 5a. REQUIRED: replace the `credit` doc comment (lines 93–99)

**This is a real conflict, not a nitpick.** The comment currently reads:

> This is NOT a job title and NOT a claim about leading a team — it exists so shared work is never
> silently presented as solo work, per CLAUDE.md's honesty rules.

Four of the five final credit values are precisely claims about leading a team — `"Led a team of 2"`,
`"Led a team of 4"`, and two `"Led design and development"`. The comment was written when the
proposed values were "team project with X, roughly equal contribution." Saad has since confirmed the
leadership framing, which makes the values authoritative and the **comment** the thing that is now
wrong.

Leaving it is worse than a cosmetic mismatch: it is a stated honesty rule in the codebase that the
committed data openly violates, and the next person to read it will either "correct" the data back or
lose trust in the comments generally. Replace lines 93–99 with:

```ts
  /**
   * Honest credit line. Omit when the work was solely Saad's.
   *
   * Two jobs: shared work is never silently presented as solo work, and where
   * Saad's role was a leading one, it says so plainly ("Led a team of 4").
   *
   * It is NOT a job title — it describes what happened on one project, not a
   * position held. Every value must be one Saad has explicitly confirmed, and
   * it never names a collaborator who has not consented to being named.
   */
```

No other line in the file changes. `readonly credit?: string;` stays exactly as-is.

### 5b. Standing notes

**One divergence to fix in the docs, not in the type.** `docs/02` lines 72–75 say to "omit
`coverImage` / `screenshots` rather than pointing at a file that does not exist yet," which implies
`coverImage` is optional. `types.ts` makes it required. **The type is right and the doc is stale** —
that instruction was written when no screenshots existed; all five projects now have a real cover,
and requiring it means Ticket 6 never has to design a fallback card for a case that cannot occur.
Folded into §13 amendment 3d. This holds even for SNA's small cover — see §7f and §14.

**Still true, still deliberate: `content/types.ts` is a file not enumerated in `docs/02`'s folder
listing.** Flagged in the same style as the `lib/hooks/` deviation in `review-fixes-2026-08-17.md`,
and §13 amendment 3a adds it to the listing so the deviation stops being one.

**No barrel `content/index.ts`.** Three data files with clear names; `import { projects } from
"@/content/projects"` already says where the data comes from. A barrel adds a second place to update
on every content change — exactly the wrong tradeoff for files designed to be hand-edited for a year
— and makes "who imports this content" harder to grep.

---

## 6. Typing approach, per file

```ts
// projects.ts, skills.ts
export const projects = [ /* ... */ ] as const satisfies readonly Project[];

// currentlyLearning.ts — DELIBERATELY DIFFERENT, see §2.2
export const currentlyLearning: readonly LearningEntry[] = [];
```

`satisfies` fully type-checks the shape — a missing `title` or a `category: "core-devv"` typo is a
compile error, exactly as with a `: Project[]` annotation. It is not a weaker check. What it adds is
literal preservation, which is the entire point: `ProjectSlug` becomes
`"folio" | "aero-grid" | "clashchat" | "ccn-network" | "sna-infrastructure"` rather than `string`.

**The tradeoff, stated plainly:** everything becomes deeply `readonly`, so in-place mutators don't
compile — `[...projects].sort()` instead of `projects.sort()`. `.map()`, `.filter()`, `.find()` and
`.slice()` are unaffected. Since array order *is* display order (§2.6), in-place sorting shouldn't be
happening anyway. The implementer should note the spread pattern in the implementation handoff so
Ticket 6 doesn't hit it cold.

---

## 7. Exact content to write

Every value below is Saad's supplied content, reproduced verbatim. **Do not paraphrase, do not
"improve" the prose, do not normalise the title casing.** Titles are content, not styling.

> **Credit lines were REVISED on 2026-08-17 and the values below are FINAL.** They supersede every
> earlier draft. **Uzair Ahmed is named on FOLIO and only on FOLIO.** His stated consent covered
> FOLIO, Aero-Grid and ClashChat, so naming him on one of those three sits comfortably inside what he
> agreed to. No consent question remains open.

### 7a. `content/projects.ts` — image imports

Ten static imports, one per file, at the top of the file:

```ts
import type { Project } from "./types";

import folioCover from "@/public/images/projects/folio/cover.png";
import folioResults from "@/public/images/projects/folio/results.png";
import aeroGridCover from "@/public/images/projects/aero-grid/cover.png";
import aeroGridSimulation from "@/public/images/projects/aero-grid/simulation.png";
import aeroGridResults from "@/public/images/projects/aero-grid/results.png";
import clashchatCover from "@/public/images/projects/clashchat/cover.png";
import clashchatHomeDark from "@/public/images/projects/clashchat/home-dark.png";
import clashchatHomeLight from "@/public/images/projects/clashchat/home-light.png";
import ccnCover from "@/public/images/projects/ccn-network/cover.png";
import snaCover from "@/public/images/projects/sna-infrastructure/cover.png";
```

Note: these files live under `public/` **and** are statically imported. Next serves `public/` verbatim
*and* bundles the imported copy through the optimizer. That double-availability is harmless and is
what `docs/02`'s `/public/images` folder spec asks for — not worth relocating to a non-public
`assets/` directory for a marginal build-output saving.

### 7b. Project 1 — FOLIO

```
slug        "folio"
title       "FOLIO"
date        "2025-05"
category    "systems-foundation"
credit      "Team project with Uzair Ahmed — roughly equal contribution"
links       github: "https://github.com/Nobody243/FOLIO"
            live:   "https://staging.d3lmw6s3chjejw.amplifyapp.com"
```

**oneLiner:** `Aggregates clothing listings from 150+ brands across 10 countries into one searchable interface — powered by Kafka and Spark`

**description:** `A real-time clothing search engine that scrapes product catalogues from 150+ brands across 10 countries, streams raw listings through Kafka, cleans and deduplicates them with Spark Structured Streaming, and serves results through a FastAPI backend to a React frontend. TF-IDF cosine similarity powers recommendations; a RandomForest ML discovery loop continuously finds new brands the system doesn't know about yet. Falls back to direct SQLite writes if Kafka is unavailable.`

**stack:** `Apache Kafka`, `Apache Spark (PySpark)`, `FastAPI`, `SQLite (FTS5)`, `React`, `Vite`, `Firebase Auth`, `Firestore`, `scikit-learn`, `Docker Compose`, `Python`

**coverImage:** `folioCover` — alt: `FOLIO search interface with Kafka pipeline actively scraping brands across 10 countries`

**screenshots:** `folioResults` — alt: `FOLIO results page showing 2144 listings across 43 brands with brand filter chips`

> **Two accuracy notes — recorded so a reviewer doesn't reopen them.**
>
> 1. **The brand count is 150+, not 40+.** Corrected by Saad; the project README's figure was
>    outdated. The 10 countries (US, CA, GB, IE, AU, DE, NL, FR, IT, PK) are correct. FOLIO is **not**
>    Pakistani-only — the international scope is real.
> 2. **150+ and 43 are not in tension.** FOLIO's search is **country-scoped by design**. 150+ is the
>    total across all 10 countries; 43 is the Pakistani brand count specifically, and `results.png`
>    captures a Pakistan-filtered search. These figures measure different things. **Do not reconcile
>    them, and do not add a caption explaining a gap that does not exist.** The alt text is correct as
>    written.
>
> **Operational note, not a blocker:** the live URL is an AWS Amplify **staging** deployment. It is
> verified 200 today. Staging environments get torn down; worth re-checking at Ticket 13 (deploy) and
> periodically after, since a dead link on a portfolio is worse than no link. If it ever 404s, the
> honest fix is deleting the `live` key, not replacing it.

### 7c. Project 2 — Aero-Grid

```
slug        "aero-grid"
title       "Aero-Grid"
date        "2025-04"
category    "systems-foundation"
credit      "Led design and development"
links       github: "https://github.com/Nobody243/Aero-Grid"
            live:   "https://aerogrid-simulator-ag24303.vercel.app"
```

**oneLiner:** `Drone routing engine — Genetic Algorithm optimizes delivery order, A* plots each leg around obstacles, Naive Bayes classifies weather`

**description:** `A full-stack visualization of four classical AI techniques cooperating to plan and execute a multi-stop drone delivery mission across a 40x40 city grid. Naive Bayes classifies weather conditions for a pre-flight go/no-go verdict. A Genetic Algorithm solves the delivery order as a TSP variant. A* pathfinds each individual leg around buildings and no-fly zones. Q-Learning trains a tabular policy and stress-tests it under obstacle perturbation. Every algorithm step is visualized in real time — generational fitness curves, A* frontier sweeps, Q-table heatmaps. FastAPI backend exposes each module as a stateless endpoint; the city grid is the frontend's state, passed with every request.`

**stack:** `Next.js`, `React`, `TypeScript`, `FastAPI`, `Python`, `scikit-learn`, `NumPy`, `pandas`, `Framer Motion`, `React Three Fiber`, `Zustand`, `Recharts`, `Render`, `Vercel`

**coverImage:** `aeroGridCover` — alt: `Aero-Grid 3D isometric simulation showing drone route plotted across city grid with algorithm names listed`

**screenshots, in this order:**
1. `aeroGridSimulation` — alt: `Live flight simulation mid-run showing leg 5 of 9 with heuristic comparison panel`
2. `aeroGridResults` — alt: `Mission Complete screen showing GA convergence across 55 generations, 51.2% route improvement`

### 7d. Project 3 — ClashChat

```
slug        "clashchat"
title       "ClashChat"
date        "2025-03"
category    "core-dev"
credit      "Led design and development"
links       github: "https://github.com/Nobody243/ClashChat"
            live:   "https://clashchat-54dc0.web.app"
```

**oneLiner:** `AI-powered debate app — argue any topic against Groq's LLM with timed rounds, stance tracking, and difficulty modes`

**description:** `A Flutter application for AI-powered structured debates. Users pick a topic and stance, then argue against Groq's LLM across timed rounds with difficulty levels — Casual (free practice), Ranked (competitive scoring), and Learning (coached feedback). Groq API calls route through a privately-hosted Cloudflare Worker proxy so the API key never touches the client. Firebase handles auth (email + Google Sign-In), Firestore stores debate history and user profiles, and a daily quota of 40 debates is enforced client-side for the demo build. A responsive web build is available alongside the native Android APK.`

**stack:** `Flutter`, `Dart`, `Firebase Auth`, `Firestore`, `Firebase Hosting`, `Groq API`, `Cloudflare Workers`, `Hive`, `Provider`

**coverImage:** `clashchatCover` — alt: `ClashChat active debate on Economy topic showing AI and user exchange with Debate Stats panel`

**screenshots, in this order:**
1. `clashchatHomeDark` — alt: `ClashChat home screen dark mode showing game modes`
2. `clashchatHomeLight` — alt: `ClashChat home screen light mode`

> **Privacy: cleared.** The cover image was inspected directly — no username visible, messages
> labelled "You" / "ClashBot" only.
>
> **Design note for Ticket 6:** the Debate Stats panel is clipped at the right frame edge. Not a
> blocker, but the card crop should not make it look accidental.
>
> **Security note:** the description mentions a Cloudflare Worker holding a Groq API key. That is a
> description of architecture, not a secret. No actual key appears anywhere, and none may enter the
> diff — `docs/05_GIT_SECURITY_CHECKLIST.md` §2 still applies in full.

### 7e. Project 4 — CCN

```
slug        "ccn-network"
title       "Multi-Floor Call Center Network Design"
date        "2024-12"
category    "systems-foundation"
credit      "Led a team of 2"
links       {}          // no repo, no live deployment — EMPTY OBJECT, not omitted (§2.9)
```

**oneLiner:** `Multi-floor enterprise network for a call center — VLANs per department, ACL-enforced segmentation, RIP routing, TFTP config backup`

**description:** `Designed and simulated a segmented enterprise network for a 4-floor call center — 3 operational VLANs per floor (Verifiers, CSR floors) plus 4 admin VLANs (IT, HR, QA, Finance). Configured DHCP scoped per VLAN, ACLs enforcing inter-VLAN access restriction, RIP for inter-floor routing, and centralized TFTP config backup across floors. Documents challenges (inter-VLAN security, congestion, config consistency) and future enhancements (redundancy, IDS, wireless). Built for Computer Communication Networks coursework at Bahria University.`

**stack:** `Cisco Packet Tracer`, `VLANs`, `DHCP`, `ACLs`, `RIP routing`, `TFTP`

**coverImage:** `ccnCover` — alt: `Cisco Packet Tracer topology showing multi-site call center network with color-coded VLANs across 4 floors and interconnecting routers`

**screenshots:** **omit the key entirely.** Not `[]` — absent.

> The topology is dense at full-topology zoom. **Saad approved it as-is** because the density
> communicates scale. Do not crop, downscale past legibility, or substitute a simplified diagram.

### 7f. Project 5 — SNA

```
slug        "sna-infrastructure"
title       "Secure & Scalable IT Infrastructure"
date        "2025-12"
category    "systems-foundation"
credit      "Led a team of 4"
links       {}          // EMPTY OBJECT, not omitted (§2.9)
```

**oneLiner:** `Full enterprise IT infrastructure — Active Directory, DNS, DHCP, IIS, RDS, WDS, and Cisco NAT across 7 configured phases`

**description:** `Designed and deployed a full enterprise IT infrastructure across 7 phases — an Active Directory domain controller with OU hierarchy (2 campuses, 3 departments each) and fine-grained password policies (PSO-Admin-Strict, 10-character minimum scoped to the Admin group only), DHCP with exclusion ranges and MAC-based reservations, DNS with forward and reverse lookup zones verified via nslookup, IIS with HTTPS binding and a self-signed SSL certificate, FTP with AD-attribute-based user isolation (msIIS-FTPDir), Remote Desktop Services with RemoteApp publishing verified through RD Web Access, Windows Deployment Services for PXE network OS deployment integrated with AD, Linux shell scripting for interactive file management automation (bash, chmod, case statements), and Cisco router NAT configuration — static 1:1, dynamic ACL+pool, and PAT/overload — all verified via `show ip nat translations`. Built for System and Network Administration coursework at Bahria University.`

**stack:** `Windows Server 2019`, `Active Directory`, `Group Policy`, `DHCP`, `DNS`, `IIS`, `FTP`, `Remote Desktop Services`, `WDS`, `Ubuntu/Bash`, `Cisco Packet Tracer`

**coverImage:** `snaCover` — alt: `Windows Server Manager dashboard showing all configured roles — AD DS, DHCP, DNS, IIS, RDS, WDS — with green health indicators`

**screenshots:** **omit the key entirely.**

> ### PRIVACY REQUIREMENT — binding, unchanged
>
> Two of the four collaborators have **not consented to being named publicly**. Their names must not
> appear in the data files, in this plan, in any handoff file, or in any commit message.
> `.claude/handoff/` is **tracked and headed for GitHub** — recording a name there publishes it just
> as surely as putting it on the website.
>
> The final credit value `"Led a team of 4"` **names no collaborator at all**, which resolves this
> cleanly: it states the team size and Saad's role, and there is no name to withhold. Uzair Ahmed is
> named on FOLIO only (§7b).
>
> **Cover image: RESOLVED, ships as-is.** `sna-infrastructure/cover.png` is 779×396, the smallest
> source in the set, and Saad cannot recapture it — the VM lab is decommissioned. **Explicitly not
> happening:** `coverImage` does not become optional, SNA does not gain a `screenshots` key, and there
> is no generated cover, no typographic fallback card, and no upscaling. The file is real and its alt
> text is accurate, which outranks sharpness. One awareness note for Ticket 6 is recorded in §14.
>
> **Syntax caution:** the description contains backticks around `show ip nat translations`. Use a
> **double-quoted string** for this description — a template literal would terminate early on the
> first backtick.

### 7g. `content/skills.ts`

```ts
export const SKILL_GROUPS = [
  { id: "core-dev",           label: "Core Dev" },
  { id: "systems-foundation", label: "Systems Foundation" },
  { id: "building-toward",    label: "Currently Building Toward" },
] as const;
```

**This order is a POSITIONING decision, not a formatting one** — proof → depth → direction. Ticket 5
must not re-sort, re-label, merge, or hide a group for layout reasons.

**`core-dev`** — exact order, **no notes**:
`React`, `Next.js`, `Flutter`, `ASP.NET`, `JavaScript`, `TypeScript`, `Tailwind CSS`, `Supabase`,
`Firebase`, `Node.js`

**`systems-foundation`** — `name` is the **COURSE**, `note` names the concepts. **Never a bare course
name standing alone as an unexplained claim:**

| name | note |
|---|---|
| Computer Networks | subnetting, routing, VLANs, ACLs |
| Operating Systems | process scheduling, memory management, file systems |
| Database Management Systems | relational design, SQL, normalization |
| Object-Oriented Programming | design patterns, inheritance, polymorphism (C++) |
| Data Structures & Algorithms | complexity analysis, trees, graphs, sorting (C++) |
| Assembly Language | low-level memory addressing, registers, instruction sets |
| Big Data Analytics | Kafka, Spark, distributed data pipelines |
| Design & Analysis of Algorithms | dynamic programming, greedy algorithms, NP-completeness |

**`building-toward`** — **ZERO entries.** Ships empty and honest. No padding, no invented entries, no
minimum count. The group still exists in `SKILL_GROUPS` and Ticket 5 still renders it — see §14.

### 7h. `content/currentlyLearning.ts`

```ts
export const currentlyLearning: readonly LearningEntry[] = [];

export const CURRENTLY_LEARNING_UPDATED = "2026-08-17";
```

**Empty array.** No entries — **not even a `"planned"` entry for Linux fundamentals**, which Saad
named as a likely start but has **not begun**. A "planned" entry for something not started is exactly
the kind of padding CLAUDE.md and the PRD's non-goals rule out.

`CURRENTLY_LEARNING_UPDATED` is an explicit, hand-edited constant — **not** derived from file mtime or
git. mtime is not preserved through a Vercel clone/build, and a git-derived date would need build-time
plumbing for one string. An explicit const also means the date reflects when the *content* was
reviewed, not when a formatting tweak touched the file, which is the honest meaning of "last updated."

---

## 8. Exports and the Ticket 7 boundary

Ticket 2 owns the lookup helpers. They live in the data files themselves, not in a `lib/` module —
they are three lines each, and colocating them is what makes the `as const` literal types usable,
since the helper is written once where `typeof projects` is in scope.

| Export | File | Consumer |
|---|---|---|
| `projects` | projects.ts | 6, 7 |
| `ProjectSlug` | projects.ts | 7 (typed params, internal links) |
| `projectSlugs` | projects.ts | Ticket 7's `generateStaticParams` |
| `getProjectBySlug(slug: string)` | projects.ts | Ticket 7's page + `notFound()` branch |
| `skills`, `SKILL_GROUPS`, `getSkillsByGroup` | skills.ts | 5 |
| `currentlyLearning`, `CURRENTLY_LEARNING_UPDATED` | currentlyLearning.ts | 9 |

```ts
export type ProjectSlug = (typeof projects)[number]["slug"];
export const projectSlugs = projects.map((p) => p.slug);

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
```

**`getProjectBySlug` takes `slug: string`, NOT `ProjectSlug`.** This is deliberate and must not be
"tightened." Ticket 7 receives an arbitrary user-supplied string from the URL; the entire reason it
calls this function is to decide whether that string is valid and call `notFound()` if not. A
`ProjectSlug` parameter would make the function impossible to call from the one place that needs it.
`ProjectSlug` is for `generateStaticParams` and internal links.

**Ticket 2 does not touch `app/(site)/projects/[slug]/page.tsx`.** Its two TODOs become actionable but
acting on them is Ticket 7's job.

---

## 9. Implementation steps

1. **Read `content/types.ts` first.** Its types are correct — match its field names exactly, and do
   not add or change any field.
2. **Apply the `credit` doc-comment replacement** from §5a (lines 93–99). Comment only.
3. Write `content/skills.ts` — `skills` (`as const satisfies readonly Skill[]`), `SKILL_GROUPS`,
   `getSkillsByGroup`. Skills first: it is the smallest file to validate the `as const satisfies`
   pattern on, and `Project.category` depends on `SkillGroup` being settled.
   - File-header comment: group order is a positioning decision; `building-toward` is intentionally
     empty and is not a bug.
4. Write `content/currentlyLearning.ts` — empty array with the **plain annotation**, plus
   `CURRENTLY_LEARNING_UPDATED`.
   - File-header comment must explain **why this file does not use `as const`** (§2.2), or someone
     will "fix" it into consistency and break Ticket 9.
5. Write `content/projects.ts` — the 10 static imports, then the five entries in the order of §7b–§7f,
   then `ProjectSlug` / `projectSlugs` / `getProjectBySlug`.
   - File-header comment: array order IS display order, and it deliberately is **not** date order.
   - `links: {}` for CCN and SNA. `screenshots` key **omitted entirely** for CCN and SNA — never `[]`.
   - Credit values verbatim from §7. **Uzair Ahmed appears on FOLIO only.**
   - SNA's description must use a **double-quoted string** (backticks inside).
6. **Delete `content/.gitkeep`** and **`public/images/.gitkeep`**. Keep `public/models/.gitkeep`.
7. Run the verification probes in §10. Record what each produced.
8. Run `npx tsc --noEmit`, `npm run lint`, `npm run build`. All three must be clean.
9. **Read back every URL and date character by character against §7**, then open each of the five
   external URLs in a browser and confirm it loads. A typo'd GitHub URL is indistinguishable from a
   fabricated one to a recruiter.
10. Commit (§11). Images go in **as-is** — the weight question is decided (§17), nothing to do.
11. Apply and commit the docs amendments (§13) as a **separate** docs-only commit. All four files.
12. Write `.claude/handoff/ticket-2-implementation.md` (§12).

---

## 10. Verification probes

Following the Ticket 1 `PageProps` precedent — prove the guards work, don't assume. Add each probe,
observe the error, **delete it**, and record the result in the implementation handoff.

| # | Probe | Expected |
|---|---|---|
| 1 | `const _c: ProjectSlug = "not-a-real-project";` | **TS2322** — proves the literal union is real, not `string` |
| 2 | Add `category: "core-devv"` to one entry | `satisfies` error — proves the union constrains |
| 3 | `projects.sort(() => 0);` | readonly error — proves immutability |
| 4 | `currentlyLearning.map((e) => e.title);` | **Compiles clean.** This is the regression guard for §2.2. If someone later changes this file to `as const`, this line starts failing with element type `never`. Leave a comment naming the risk. |
| 5 | **Rename an image import path** — e.g. `folio/cover.png` → `folio/cover-x.png` in the import statement only | **Module-not-found build error** (and TS2307). |

**Probe 5 is the entire justification for static imports (§2.7) and is not optional.** If a bad image
path silently compiles, the static-import decision has bought nothing over string paths and the
choice should be revisited. Run it, watch it fail, revert it.

---

## 11. Git

Follow `docs/05_GIT_SECURITY_CHECKLIST.md` §2 in order, without shortcuts:

1. `git status` and **actually read it**.
2. Confirm nothing matching `.env*`, `*secret*`, `*key*`, `*credential*` appears. ClashChat's
   description *mentions* an API key architecture — that is prose, not a credential. Confirm no
   literal key value is anywhere in the diff.
3. Confirm **no unconsented collaborator name** appears anywhere in the diff or the commit message.
4. `git add` **explicit paths**, not `git add .` — the working tree also has untracked
   `HANDOFF_CONTEXT.md` and handoff files that belong in different commits.

**Commit 1 — code + assets** (one commit; the files are interdependent and the diff is small and
reviewable):
```
content/projects.ts  content/skills.ts  content/currentlyLearning.ts
content/types.ts     public/images/projects/**
(deletions) content/.gitkeep  public/images/.gitkeep
```
Message: `Ticket 2: content data layer — five typed projects, skills, currentlyLearning`

`content/types.ts` is currently untracked and belongs in this commit — it is part of this ticket's
output even though it was written ahead of the plan, and it carries the §5a comment fix.

**Commit 2 — docs only**, per the `5f8ac4e` precedent. All four files, all amendments approved:
```
docs/04_FEATURE_TICKETS.md  docs/02_TECHNICAL_ARCHITECTURE.md  CLAUDE.md  HANDOFF_CONTEXT.md
```
Message: `Docs: record tier->category rename, screenshot scope, and the CCN/SNA positioning note`

**Commit 3 — handoff notes**, separately: this plan, `ticket-2-implementation.md`.

---

## 12. What the implementation handoff must record

`.claude/handoff/ticket-2-implementation.md` should carry: all five probe results (especially #5 and
#4); the `[...projects].sort()` spread requirement; the `tier`-is-reserved convention; why
`currentlyLearning` doesn't use `as const`; the `credit` doc-comment fix in `types.ts` and why it was
needed; that `projectSlugs` and `getProjectBySlug` already exist and are named, for Ticket 7; the
empty `building-toward` group being intentional, for Ticket 5; the 0/1/2 screenshot spread, for
Ticket 7; the SNA cover-resolution note, for Ticket 6; that images were committed as-is by decision
(§17); and a note that `ticket-2-notes.md` is now fully superseded.

**It must not record any unconsented collaborator name.**

---

## 13. Docs amendments — exact wording

**A note on who writes these.** My role restricts `Write` to this handoff file only — I don't edit
project files, including docs. So rather than writing the four files directly, the exact replacement
text is below as verbatim before/after blocks with line anchors. The implementer applies them
mechanically and commits them as the separate docs-only commit in §11. Nothing here needs
interpretation. **All amendments below are approved, including 3g.**

### Amendment 1 — `docs/04_FEATURE_TICKETS.md` (approved scope addition: screenshots)

**1a. Replace Ticket 2's description and acceptance criteria (lines 22–27):**

> **Description:** Create `content/types.ts`, `content/projects.ts`, `content/skills.ts`, and
> `content/currentlyLearning.ts` using the shapes defined in the Technical Architecture Document.
> Populate with real data: FOLIO, Aero-Grid, ClashChat, the Multi-Floor Call Center Network Design
> (CCN) and the Secure & Scalable IT Infrastructure build (SNA) for projects; the three skill groups
> (Core Dev, Systems Foundation, Currently Building Toward) for skills; and honest current-progress
> entries for Currently Learning — where an empty array is a valid and honest answer, not a gap to
> fill. Wire each project's `coverImage` and `screenshots` as **static imports** from
> `public/images/projects/<slug>/`.
> **Acceptance criteria:** All data files export typed arrays; no placeholder/fabricated content;
> every project entry has real links where they exist (omit the field, don't fake a URL, where they
> don't); **every image is a static import that resolves at build time — a missing or misnamed file
> must fail the build, not ship a broken image; every image carries accurate, hand-written `alt` text
> describing what is actually on screen.**

**1b. Append to Ticket 6's acceptance criteria (line 70), before the final period:**

> ; each card renders its project's `coverImage` through `next/image` using the intrinsic dimensions
> carried by `StaticImageData` — no hand-copied width/height, no layout shift

**1c. In Ticket 7's description (line 76), replace `(description, stack, real links, date)` with:**

> (description, stack, real links, date, and the project's screenshot gallery)

**1d. Append to Ticket 7's acceptance criteria (line 80), before the final period:**

> ; the screenshot gallery renders correctly for 0, 1 and n images — CCN and SNA have none beyond
> their cover, FOLIO has one, Aero-Grid and ClashChat have two — with no hardcoded two-up
> before/after assumption

### Amendment 2 — `CLAUDE.md` positioning (resolved by Saad)

**2a. Replace the final sentence of the "Who this is for" paragraph (lines 14–15):**

> Notable project: FOLIO (Kafka/Spark clothing aggregator, BDA). Also shipped: Aero-Grid (Next.js +
> FastAPI), ClashChat (Flutter + Firebase + Groq). Plus two hands-on academic infrastructure builds: a
> multi-floor call-center network design (Computer Communication Networks — VLANs, ACLs, RIP routing,
> DHCP, TFTP, in Cisco Packet Tracer) and a seven-phase Windows Server enterprise infrastructure
> (System & Network Administration — Active Directory, DNS, DHCP, IIS, FTP, RDS, WDS, Cisco NAT).

**2b. Replace the "Current direction" paragraph (lines 17–20):**

> **Current direction:** deliberately pivoting toward Cybersecurity, Cloud Infrastructure, and
> Networking/DevOps. No **self-directed or professional** projects in that direction yet — that is
> ~1 year out. But the direction is not starting from zero: the CCN and SNA coursework above is real,
> hands-on networking and infrastructure work. It is academic rather than self-directed, and the site
> must say so plainly — it is not nothing, and it is not professional depth either. The portfolio must
> NOT claim expertise he doesn't have yet. It should read as: proven builder with real shipped range
> and genuine hands-on infrastructure coursework behind him, who is intentionally and visibly building
> toward a specific technical direction.

**2c. Add to the Positioning section, after the "Currently Learning" bullet (line 28):**

> - Ticket 4's About/Trajectory narrative follows that arc: academic foundations through coursework
>   (CCN — VLANs/routing/ACLs; SNA — AD/DNS/NAT/IIS), now building toward professional depth via
>   self-directed projects and certifications. This framing is both stronger and more honest than
>   either "nothing yet" or an overclaim.

**2d. Update site structure item 3 (lines 82–84)** — append to the "Currently Building Toward"
description:

> (currently ships with **zero** entries — deliberately. The empty group is the honest state and Ticket
> 5 must render it without breaking.)

**2e. Update site structure item 4 (lines 85–87)** — replace the project list:

> 4. **Projects** (Tier 2 gallery → Tier 3 detail) — FOLIO, Aero-Grid, ClashChat, the CCN call-center
>    network design and the SNA enterprise infrastructure build as cards → click → smooth transition
>    into a clean detail page (problem, stack, what was built, real links, dates, screenshots). Old
>    `my-portfolio-ten-ruddy-35` site excluded or footnoted only, not featured.

### Amendment 2b — `HANDOFF_CONTEXT.md`, same positioning change

**Replace lines 9–16** (the "Notable prior projects" sentence and the "Current direction" paragraph)
with the equivalents from 2a and 2b above, keeping that file's existing "GitHub: Nobody243" note.

### Amendment 3 — `docs/02_TECHNICAL_ARCHITECTURE.md`

**3a. Folder structure block (lines 34–37), replace the `/content` entry:**

```
/content
  types.ts                   — shared content types. NOT in the original listing: a deliberate
                               fourth file, because Project.category is typed as SkillGroup and
                               colocating types would force projects.ts to import skills.ts.
                               Flagged in the style of the lib/hooks/ deviation recorded in
                               .claude/handoff/review-fixes-2026-08-17.md.
  projects.ts                — structured project data (see "Content shape" below)
  skills.ts                  — structured skills data, grouped by SkillGroup
  currentlyLearning.ts       — structured "in progress" entries
```

Note the deliberate wording fix on `skills.ts`: the original read "grouped by tier," which is the same
vocabulary collision as 3b.

**3b. Replace the `tier` bullet in the Project entry list (line 58):**

> - `category` — which skill group the project belongs to, typed as `SkillGroup` (useful if projects
>   are later filtered). **Renamed from `tier` in Ticket 2.** `tier` is reserved project-wide for the
>   Tier 1/2/3 motion system and is never used as a data field name, anywhere. The rename exists so
>   `project.tier === "core-dev"` can never sit inside a Tier 2 component next to Tier-2 motion config.

**3c. Add a `credit` bullet after `date` (the field is currently missing from this doc entirely):**

> - `credit` — optional honest credit line, omitted when the work was solely Saad's. It does two
>   things: it stops shared work from being silently presented as solo work, and where Saad's role was
>   a leading one it says so plainly ("Led a team of 4"). It is **not** a job title — it describes what
>   happened on one project, not a position held. Every value must be one Saad has explicitly
>   confirmed. Where a collaborator has not consented to being named publicly, the credit states the
>   team size and role without naming anyone — it never guesses at consent.

**3d. Replace the `coverImage` bullet (lines 59–62):**

> - `coverImage` — the single image the gallery card uses: `{ src, alt }`. **Required** — every project
>   has one, so Ticket 6 never needs a no-image fallback card. Kept as a separate field from
>   `screenshots` so the card's pick never depends on screenshot ordering; it may point at the same
>   file as one of them.

The stale parenthetical "(for FOLIO that's the results view, not the search form)" is **removed** —
FOLIO's actual cover is the search-interface-with-pipeline shot, and the results view is its
screenshot. The example no longer matches the content.

**3e. Replace the "Image notes that constrain Ticket 2's typing" block (lines 71–78):**

> Image notes — **settled in Ticket 2:**
> - Images are **static imports**, not string paths: `import cover from
>   "@/public/images/projects/folio/cover.png"`. Chosen over string paths + explicit `width`/`height`
>   for two reasons: a missing or misnamed file becomes a **build error** rather than a broken image in
>   production, and `StaticImageData` carries real intrinsic dimensions, so `next/image` prevents
>   layout shift with nothing hand-copied. `import type { StaticImageData } from "next/image"` is the
>   one permitted `next/*` reference under `/content` — it is type-only and erased at compile time.
> - Screenshot counts **vary**: 0 for CCN and SNA, 1 for FOLIO, 2 for Aero-Grid and ClashChat. Ticket 7
>   must render 0, 1 or n without assuming a pair. Projects with no additional images **omit the
>   `screenshots` key entirely** rather than setting `[]`.
> - `alt` is content and is required on every image — accurate, hand-written, describing what is
>   actually on screen. `caption` is separate, optional, visible editorial copy and never substitutes
>   for `alt`.

**3f. Add `completedDate` to the Currently Learning entry list (lines 83–85):**

> - `title`, `status` (`"in-progress" | "planned" | "completed"`), `description`, `startedDate`,
>   optional `completedDate`, optional `link` (cert page, course, etc.). Lifecycle: a completed item
>   **graduates** out of this section into `skills.ts` under `building-toward` rather than lingering
>   here, so "Currently Learning" stays literally true while the achievement stays visible;
>   `completedDate` records that transition. An **empty array is a valid, honest state** for this file.

**3g. Replace build-order step 6 (line 107). APPROVED by Saad.**

> 6. Write final narrative copy last — the hero identity line, the About/Trajectory narrative, the
>    Experience framing. The structured `/content` data layer is **not** part of this step: it lands
>    early, at Ticket 2, because Tickets 5/6/7/9 are built against real data and their acceptance
>    criteria are unverifiable against empty arrays.

---

## 14. Downstream requirements — record these, they are this plan's real output beyond the data files

| Ticket | Requirement |
|---|---|
| **5** | Must render **THREE** groups with the third (`building-toward`) **empty**, without breaking layout. An empty "Currently Building Toward" is **intended**, not a bug — it is the visible trajectory the whole positioning rests on. Do not hide the group, do not collapse the grid to two columns, do not add filler. An honest empty treatment is a design problem to solve, not a data problem. |
| **5** | Must render `SKILL_GROUPS` in order and must not re-sort, re-label, merge or hide a group for layout reasons (§7g). |
| **5** | `systems-foundation` entries are course names whose `note` carries the concepts. Never render the name without the note — a bare course name is an unexplained claim. |
| **9** | Needs an honest **empty state** for an empty `currentlyLearning`, and `CURRENTLY_LEARNING_UPDATED` must still render a meaningful date. "Nothing in progress right now, last reviewed August 2026" is honest; an apologetic tone or a fabricated placeholder entry is not. |
| **9** | Must not break if the array is later non-empty — the empty state is the current case, not the only case. |
| **7** | Must render **0, 1 or n** screenshots. **Do not assume a two-up before/after layout** — CCN and SNA have none, FOLIO has one, Aero-Grid and ClashChat have two. |
| **7** | Helpers already exist: `projectSlugs` for `generateStaticParams`, `getProjectBySlug` for the `notFound()` branch. Do not write a second lookup. |
| **7** | Must handle `links: {}` (CCN, SNA) — a detail page with no external links at all needs to not look broken or unfinished. |
| **6** | Gets intrinsic `width`/`height` free from `StaticImageData`. **No hand-copied dimensions.** |
| **6** | `sna-infrastructure/cover.png` is 779×396 — the smallest cover in the set. At a typical three-up gallery card width (~400–450px on a 1440px viewport) this is adequate at 1x and marginal on high-DPI. Saad has accepted it as-is; the file is real and its alt text is accurate, which outranks sharpness. If Ticket 6's layout ends up rendering cards significantly wider than ~450px, re-evaluate then — with the real gallery on screen, not in the abstract. **Not a blocker.** |
| **6** | Must handle a 14-item `stack` (Aero-Grid) and a 6-item one (CCN) in the same badge layout. |
| **6** | Must not build category filter chips in v1 — the 4/1 `systems-foundation`/`core-dev` split isn't a filter (§4). |
| **6** | ClashChat's cover has the Debate Stats panel clipped at the right frame edge; the card crop shouldn't make that read as accidental. |
| **6/7** | Must use `[...projects]` before any sort — the arrays are deeply `readonly` (§6). |
| **4** | About/Trajectory narrative arc, per amendment 2c: academic foundations through coursework (CCN, SNA) → building toward professional depth via self-directed projects and certifications. |

---

## 15. Constraint confirmation

**Three-tier motion system: untouched.** This ticket produces three `.ts` files containing literal
arrays, ten static image imports, and three trivial lookup functions, plus one doc-comment edit. No
component, no GSAP timeline, no Framer Motion, no ScrollTrigger, no Lenis interaction, no
`prefers-reduced-motion` branch. Nothing here can raise or lower the energy of any tier. The `tier` →
`category` rename (§4) actively *protects* that system's vocabulary.

**Locked colour/type system: untouched.** No CSS, no `globals.css` edit, no Tailwind config, no class
strings, no hex values, no font references. `content/types.ts` already states this as a hard rule for
everything under `/content`, because a per-entry `accentColor` or `className` field is the one
realistic way a content ticket could break the two-accent system — at the data layer, where it is
hardest to notice.

**Also enforced in `/content`:** no JSX, no `"use client"`, no React import, no **runtime** `next/*`
import. The single `import type { StaticImageData } from "next/image"` is type-only and erased at
compile time, so these files stay importable from both server components (Ticket 7's page) and client
components (Ticket 6's card).

**Absent things are ABSENT KEYS** — never `""`, never `"#"`, never a plausible placeholder URL. The
one exception is `links`, which is required as `{}` by §2.9 so consumers branch on `links.github`
rather than on key existence.

**The one indirect coupling, stated plainly.** The `SkillGroup` values and the `SKILL_GROUPS` order
determine Ticket 5's three-group structure, and that structure is a **positioning decision, not a
formatting one** — CLAUDE.md: "The grouping itself communicates the positioning." Moving a skill
between groups, re-labelling a group, or hiding the empty third group is a positioning change
requiring Saad's call, not an implementer's or a designer's.

**Positioning guardrail held.** `building-toward` ships with zero entries and `currentlyLearning`
ships empty. This plan proposes no filler, no example certs, no "planned" entry for the unstarted
Linux work, and no minimum count. Sparse is the feature.

---

## 16. Definition of done

- [ ] `content/skills.ts`, `content/projects.ts`, `content/currentlyLearning.ts` created
- [ ] `content/types.ts` modified: `credit` doc comment only (§5a) — no type or field change
- [ ] `content/.gitkeep` and `public/images/.gitkeep` deleted; `public/models/.gitkeep` kept
- [ ] Five projects in the order FOLIO → Aero-Grid → ClashChat → CCN → SNA, content verbatim from §7
- [ ] Credit values verbatim from §7; **Uzair Ahmed named on FOLIO only**
- [ ] No unconsented collaborator name in any file, commit message, or handoff note
- [ ] `links: {}` on CCN and SNA; `screenshots` key absent on CCN and SNA
- [ ] SNA cover shipped as-is; `coverImage` still required; no fallback card, no upscaling
- [ ] All 10 images wired as static imports; all `alt` text verbatim from §7
- [ ] `projects`/`skills` use `as const satisfies`; `currentlyLearning` uses the plain annotation, with a comment saying why
- [ ] `building-toward` empty; `currentlyLearning` empty; `CURRENTLY_LEARNING_UPDATED` set
- [ ] All five probes in §10 run and recorded — **including probe 5, the renamed-image build failure**
- [ ] All five external URLs opened in a browser and confirmed loading
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean
- [ ] No hex, class string, font name, JSX, `"use client"`, or runtime `next/*` import anywhere in `/content`
- [ ] Git checklist §2 followed; three separate commits per §11
- [ ] `.claude/handoff/ticket-2-implementation.md` written per §12

---

## 17. Image weight — measured, decided, closed

Measured, not estimated. The earlier version of this section was working from estimates and got two
things wrong; both are corrected below.

| File | Size | Dimensions |
|---|---|---|
| `folio/results.png` | 1.89 MB | 1918×897 |
| `folio/cover.png` | 1.57 MB | 1919×902 |
| `aero-grid/cover.png` | 1.12 MB | 1919×905 |
| `aero-grid/simulation.png` | 1.12 MB | 1919×901 |
| `aero-grid/results.png` | 1.10 MB | 1919×907 |
| `ccn-network/cover.png` | 0.44 MB | 1600×599 |
| `clashchat/cover.png` | 0.31 MB | 1918×904 |
| `sna-infrastructure/cover.png` | 0.17 MB | 779×396 |
| `clashchat/home-light.png` | 0.14 MB | 1919×903 |
| `clashchat/home-dark.png` | 0.14 MB | 1916×904 |
| **TOTAL** | **8.02 MB** | |

**Two corrections to the earlier draft:**

1. **The downscaling step is dropped entirely.** It assumed some captures might exceed ~2560px wide.
   None do — nothing is above ~1920. There was nothing for that step to act on.
2. **The weight is in FOLIO and Aero-Grid, not where the earlier draft guessed.** Those five files are
   6.80 MB, **85% of the total**. The CCN topology and SNA dashboard — the two the earlier draft
   pointed at — are **0.61 MB combined**, under 8%.

The caution against **lossy** compression on text-dense proof artifacts still stands: the CCN topology
and the SNA dashboard are exactly the images where palette quantisation would soften small text, and
Saad approved the CCN density specifically because it communicates scale. That caution is now about
*quality*, not about where the bytes are.

### DECISION: commit the images as-is.

8 MB is well inside anything that matters, and `next/image` re-encodes to WebP/AVIF at serve time
regardless — this was never a delivery-weight question, only repo history.

**Optional, not required, not a blocker:** a lossless `oxipng -o 4` pass over the FOLIO and Aero-Grid
files only would take ~6.8 MB to roughly 4–5 MB with pixel-identical output and no filename churn
(the `.png` extensions stay, so no import changes in `projects.ts`). If it isn't done before the
commit, it isn't worth doing afterwards — re-committing optimised copies leaves both versions in
history and saves nothing.

**Nothing here blocks implementation.** Proceed to §9 step 10 and commit.
