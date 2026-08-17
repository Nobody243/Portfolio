# Ticket 2 — notes from Saad, captured before implementation

Not a plan — `ticket-2-plan.md` is the plan and takes precedence on everything else. This file
records directives from Saad that arrived **after** that plan was written, so they don't live only in
a chat transcript.

## Projects need multiple screenshots, not one cover image

**2026-08-17 — Saad.** FOLIO's search interface and its results view are on **separate pages**, not
one dynamic view the way Aero-Grid and ClashChat are. Both need to be captured and shown, likely on
the detail page as a small gallery or a before/after pair.

Consequences, now written into `docs/02_TECHNICAL_ARCHITECTURE.md`:
- `screenshots` — ordered array of `{ src, alt, caption }`. Not a single image.
- `coverImage` — separate single `{ src, alt }` for the gallery card. For FOLIO this is the results
  view, since that's the stronger proof shot.
- Aero-Grid and ClashChat will have shorter arrays. Ticket 7's detail page must render 1, 2, or n
  screenshots — do not hardcode a two-up before/after layout.

## Conflict with `ticket-2-plan.md` — needs one decision from Saad

The plan predates this directive and assumes a single image per project:
- Plan §7 types it as `cover?: { readonly src: string; readonly alt: string }`.
- Plan §1a P11 asks only "is there a real screenshot for the gallery card?"
- Plan Q9 asks whether assets exist at all, framed as image-card vs. typographic-card for Ticket 6.

Saad's directive answers Q9 in part (screenshots will exist, at least for FOLIO) and supersedes the
single-`cover` shape. **The naming is the open item:** the plan says `cover`, the architecture doc now
says `coverImage`. Recommend `coverImage` + `screenshots` — `cover` alone reads ambiguously once a
sibling array of images exists, and the two field names should look related. Either is fine; it just
has to be settled before the data files are written, because Tickets 6 and 7 both consume it.

I have not edited `ticket-2-plan.md` — that file belongs to the planner. This note is the amendment
until the planner reconciles it.

## Open — needs Saad before Ticket 2 writes data

1. **Screenshots don't exist yet.** `public/images/` contains no image files. Nothing can be wired
   until the captures exist; omit the fields rather than referencing missing paths in the meantime.
2. **`public/images/Projects/` is nested wrong** — currently `Projects/folio/aero-grid/clashchat`,
   one chain rather than three siblings. Looks like a `mkdir -p` slip. Intended is presumably
   `public/images/projects/{folio,aero-grid,clashchat}/`. Also note the capital `P`: everything else
   in `public/` is lowercase, and case matters on Vercel's Linux builders even though it doesn't
   locally on Windows. Not fixed unasked — empty directories aren't tracked by git anyway.
3. **`docs/04_FEATURE_TICKETS.md` says nothing about images** in Tickets 2, 6 or 7 — their
   acceptance criteria list description/stack/links/date only. Adding screenshots is a real scope
   addition to all three. Saad's call whether to amend those ticket texts; not doing it unasked.
4. **Static imports vs. string paths + explicit width/height** for `next/image`. Either is fine, but
   Ticket 2 must pick one and apply it uniformly or the gallery gets layout shift.
5. **Captions are content.** "Search" / "Results" are Saad's words to confirm, and every image needs
   real `alt` text describing what's actually on screen — that cannot be written before the
   screenshots exist and are looked at.
