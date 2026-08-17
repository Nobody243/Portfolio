# Ticket 2 — Content data layer — implementation

Status: **complete.** Implemented 2026-08-18 against `ticket-2-plan.md` (the final, post-intake plan).
Commits: `1f8722e` (code + assets), `26a42ed` (docs), plus this handoff.

`.claude/handoff/ticket-2-notes.md` is now **fully superseded** — both of its blocking items were
closed before implementation. Treat it as historical.

## What was built

| File | Contents |
|---|---|
| `content/types.ts` | Pre-existing; only the `credit` doc comment changed (see below). No type change. |
| `content/projects.ts` | 10 static image imports, 5 projects, `ProjectSlug`, `projectSlugs`, `getProjectBySlug` |
| `content/skills.ts` | 18 skills, `SKILL_GROUPS`, `getSkillsByGroup` |
| `content/currentlyLearning.ts` | empty `currentlyLearning`, `CURRENTLY_LEARNING_UPDATED` |

Deleted `content/.gitkeep` and `public/images/.gitkeep`. **Kept `public/models/.gitkeep`** — that
directory is still genuinely empty and Ticket 3 may need it.

The `credit` doc comment in `types.ts` claimed the field is "NOT a claim about leading a team," while
four of the five real values are exactly that (`"Led a team of 4"`, etc.). Left as-is it would have
been a stated honesty rule that the committed data openly violates. Replaced with wording that covers
both jobs the field actually does, and the consent rule.

## Probe results (plan §10) — one did not go as the plan predicted

| # | Probe | Result |
|---|---|---|
| 1 | `const _c: ProjectSlug = "not-a-real-project"` | **TS2322** as expected. Error named the real union: `"folio" \| "aero-grid" \| "clashchat" \| "ccn-network" \| "sna-infrastructure"`. The literal union is real, not `string`. |
| 2 | `category: "core-devv"` | **TS2820** at the entry (`Did you mean "core-dev"?`) plus a knock-on TS2322 at `getProjectBySlug`. The union constrains. |
| 3 | `projects.sort(() => 0)` | **TS2339** — `sort` does not exist on the readonly tuple. Immutability holds. |
| 4 | `currentlyLearning.map((e) => e.title)` | **Compiled clean.** This is the regression guard for the plain-annotation decision. If someone converts that file to `as const`, this line starts failing with element type `never`. |
| 5 | Rename an image import to `cover-x.png` | **DID NOT FAIL — see below.** |

### Probe 5 — the static-import guarantee is real but DEFERRED, not immediate

Renaming `folio/cover.png` → `folio/cover-x.png` in the import produced **no error at all**: `tsc`
clean, `npm run build` clean, exit 0. Two separate causes, both worth knowing:

1. **`tsc` can never catch this.** Next declares `declare module '*.png'` as a **wildcard** (verified
   in `node_modules/next/image-types/global.d.ts`). Any `.png` path typechecks whether or not the
   file exists. Type-checking is structurally incapable of validating an image path — only the
   bundler can.
2. **The bundler only sees modules in the build graph.** Nothing imports `content/projects.ts` yet,
   so it was never compiled.

Verified the guarantee does hold once the module is reachable: temporarily importing `projects` into
`app/(site)/page.tsx` and rebuilding with the bad path produced a hard
`Module not found ... ./public/images/projects/folio/cover-x.png` with a full import trace. Reverted
the path, rebuilt with the temporary import still in place to confirm **all 10 image paths resolve**,
then reverted `page.tsx` completely (`git diff` on it is empty).

**Consequence for Ticket 6:** the build-error safety net switches on the moment the first component
imports `content/projects.ts`. Until then a bad image path in that file is silent. The static-import
decision is still correct — it just doesn't protect anything during Ticket 2's own window.

## Verification

- `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean, in that order, after the final revert.
- All **six** external URLs returned HTTP 200 with no redirects (plan §1 says "five"; there are three
  GitHub repos plus three live deployments — arithmetic slip in the plan, not a content problem).
- Dates and URLs read back character by character against plan §7.
- Credential scan across `/content`: no matches for key/secret/token/password/credential patterns, or
  for AWS/GitHub/OpenAI/JWT prefixes. ClashChat's description *describes* a Cloudflare Worker holding
  a Groq key — architecture prose, no key value anywhere.
- Only one collaborator is named, on FOLIO only, with consent confirmed. No unconsented name appears
  in any file, commit message, or handoff note.

## Conventions later tickets inherit

- **`tier` is reserved project-wide** for the Tier 1/2/3 motion system. The project field is
  `category`. Never reintroduce `tier` as a data field name, anywhere.
- **Arrays are deeply readonly.** Use `[...projects].sort(...)` — `projects.sort(...)` will not
  compile. `.map` / `.filter` / `.find` / `.slice` are unaffected.
- **`currentlyLearning` deliberately does not use `as const`** (`[] as const` has element type
  `never`, which breaks `.map`). Do not "fix" this into consistency; the file says why.
- **Array order is display order** in both data files, and in `projects.ts` it is deliberately NOT
  date order (strength-first: SNA is newest and sits last). No `featured`/`order` field exists.

## Notes for specific tickets

- **Ticket 5** — three groups render, and the third (`building-toward`) is **empty by design**. Do not
  hide it, collapse to two columns, or add filler. `systems-foundation` entries are course names whose
  `note` carries the concepts; never render the name without the note.
- **Ticket 6** — `coverImage` gives intrinsic width/height free via `StaticImageData`; no hand-copied
  dimensions. Must handle a 14-item `stack` (Aero-Grid) and a 6-item one (CCN) in one badge layout.
  `sna-infrastructure/cover.png` is 779×396, the smallest in the set and not recapturable — accepted
  as-is; re-evaluate only if cards end up much wider than ~450px. ClashChat's cover has its Debate
  Stats panel clipped at the right frame edge; don't let the crop read as accidental. No category
  filter chips in v1 — the 4/1 split isn't a filter.
- **Ticket 7** — helpers already exist: `projectSlugs` for `generateStaticParams`,
  `getProjectBySlug(slug: string)` for the `notFound()` branch. Do not write a second lookup, and do
  not tighten that parameter to `ProjectSlug` — it must accept arbitrary URL input. Screenshot counts
  are 0/1/2, so render 0, 1 or n. CCN and SNA have `links: {}`, so a detail page with no external
  links must not look broken.
- **Ticket 9** — needs an honest (not apologetic) empty state, and `CURRENTLY_LEARNING_UPDATED` must
  still render a real date. Must not break when the array later becomes non-empty.
- **Ticket 13** — FOLIO's `live` URL is an AWS Amplify **staging** deployment. Verified 200 today;
  staging gets torn down. Re-check at deploy and periodically. If it dies, the honest fix is deleting
  the `live` key, not substituting another URL.

## Deliberate deviations from the docs, already reconciled

- `content/types.ts` is a fourth file not in the original architecture listing. Added to the listing
  in `26a42ed` with the reasoning, so it is no longer an unexplained deviation.
- Images were committed **as-is** by decision (plan §17): 8.02 MB total, 85% of it in the FOLIO and
  Aero-Grid captures. `next/image` re-encodes to WebP/AVIF at serve time, so this was only ever a
  repo-history question. The optional lossless `oxipng` pass was not run; per the plan it is not worth
  doing after the fact, since re-committing optimised copies leaves both versions in history.

## One thing to confirm

`CURRENTLY_LEARNING_UPDATED` is `"2026-08-17"`, verbatim from the plan — the date the content was
reviewed with Saad. Implementation landed a day later. That is the correct semantics for a
last-reviewed date, but bump it if the intent was "date the file shipped."
