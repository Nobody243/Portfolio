# Review fix pass — 2026-08-17

Fixes from Saad's review of the Ticket 1 scaffold + the early groundwork committed alongside it. One
focused commit each, in the order given.

| # | Fix | Commit |
|---|---|---|
| 1 | Extract `useReducedMotion` into `lib/hooks/` — Ticket 3 is the third consumer, and SceneCanvas's own comment named that as the extraction trigger | `b741c86` |
| 2 | Relabel `SceneCanvas.tsx` honestly (it is permanent architecture, and Ticket 3 *will* edit it for camera + bloom); commit message separates kept infrastructure from throwaway placeholders | `8805757` |
| 3 | Track `docs/05_GIT_SECURITY_CHECKLIST.md` — it governs every commit but was untracked | `3ea8d8c` |
| 4 | Add bare `*.log` to `.gitignore` per the checklist's own baseline | `90cea32` |
| 5 | Replace lorem ipsum in `app/(site)/page.tsx` with a `TODO(ticket-3):` note matching the codebase convention | `d8facd1` |
| 6 | Document the `--text-caption` 12px-vs-10px legibility deviation at the token (value unchanged) | `f464a39` |
| 7 | Commit the `.claude/agents/*.md` edits separately from any code | `5f8ac4e` |
| 8 | Start using `.claude/handoff/` — this file and `ticket-1-implementation.md` | this commit |

## Decisions worth remembering

- **`lib/hooks/` is a new folder** not enumerated in `docs/02_TECHNICAL_ARCHITECTURE.md`, which lists
  only `lib/three` and `lib/animation`. Chosen because the hook is a browser-preference read owned by
  neither. Same domain-subfolder pattern; flag it if that reading is wrong.
- **`lib/three/accentHero.ts` keeps no `?? "#00e5ff"` fallback** — reviewer and Saad both agreed the
  duplicated-hex drift risk outweighs the safety net. Do not add one.
- **`--text-caption` stays 12px.** Reverting to the spec's ~10px is an accessibility regression, not
  a correction.
- **Git history was not rewritten.** The hero files were still staged-but-uncommitted at review time,
  so the framing fix went into their real commit message. No amend, no force push, no remote exists
  yet.

## Process note

`.claude/handoff/` did not exist before this pass — no handoff notes had been written for Ticket 1
even though the agent definitions call for them. Going forward: planner writes
`ticket-{N}-plan.md`, designer writes `ticket-{N}-design.md`, implementer writes
`ticket-{N}-implementation.md`, reviewer writes `ticket-{N}-review.md`.
