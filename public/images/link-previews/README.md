# Link preview stills — what each one is, and the rule for adding more

`components/ui/link-preview.tsx` shows a small screenshot of where an external link goes, in a hover
card. It takes a **static import**, never a path, so a missing or misnamed file is a build error
rather than a broken image in production — the rule at the top of `content/projects.ts`.

This directory holds no images. It is the index; the files live beside the content that uses them,
which is the convention `public/images/projects/<slug>/` already set.

## Every preview currently shipping

| Where | Link | Image |
|---|---|---|
| Reveal footer (`/`, `/work`) | github.com/Nobody243 | `public/images/contact/github.png` |
| Reveal footer (`/`, `/work`) | linkedin.com/in/muhammad-saad-2911702a3 | `public/images/contact/linkedin.png` |
| Experience | New Web Order | `public/images/experience/new-web-order.png` |
| `/projects/folio` | GitHub repo | `public/images/projects/folio/github.png` |
| `/projects/aero-grid` | GitHub repo | `public/images/projects/aero-grid/github.png` |
| `/projects/clashchat` | GitHub repo | `public/images/projects/clashchat/github.png` |
| `/projects/<slug>` | Live site | That project's own `coverImage` — no new file |

All captured 2026-08-25 except the covers, which are Ticket 6's.

The live-site links reuse the cover because a live link goes to the running project and the cover is
already a verified screenshot of exactly that. `content/types.ts` records why there is deliberately
**no** `livePreview` field: a second image of the same thing is a second source of truth that drifts
the first time one of them is re-captured.

## What does NOT get a preview, deliberately

- **The `/about` GitHub and LinkedIn controls**, even though they read the same two `content/contact.ts`
  entries the footer does. Saad's call, 2026-08-25: *"it's only for the links not the buttons."* Those
  two are dressed as brutal buttons; a hover card hanging off a button reads as a tooltip that failed.
- **The email entry.** A `mailto:` has no page to screenshot.
- **CCN and SNA.** `links` is `{}` for both — no repo, no live site, nothing to preview.
- **Currently Learning.** `content/currentlyLearning.ts` is an empty array today, deliberately, per
  CLAUDE.md. The `LearningEntry.linkPreview` field and its call site are wired, so the first entry with
  both a `link` and a screenshot gets a preview with no code change.

## Two captures with a caveat, both recorded at their call site

- **`contact/github.png` was taken signed in**, so it shows the owner-only controls (Edit profile, the
  settings gear). At 200px wide what actually reads is the profile photo, the pinned-project grid and
  the README — none of which differ signed out. Recapture if it ever matters.
- **`contact/linkedin.png` is the LOGGED-OUT view**, on purpose: that is what a recruiter following the
  link actually gets, wall and all. An authenticated capture would have promised a page most visitors
  cannot reach, which is the one thing a link preview must not do.

## Adding another

1. Capture the real page. **It must be a real screenshot of that exact URL** — CLAUDE.md forbids
   fabricated content outright, and this is where it matters most: a stock image, a logo, or a shot of
   a different page is a small lie about where a link goes, told to someone deciding whether to click
   it. If you cannot capture the real page, leave the field unset; the link degrades to a plain link,
   which is honest.
2. Drop the PNG beside the content that uses it.
3. Import it in the content file and set the field — `links.githubPreview`, `urlPreview`,
   `linkPreview`, or `previewImage` depending on the type.

```ts
import folioGithub from "@/public/images/projects/folio/github.png";
// ...
links: {
  github: "https://github.com/Nobody243/FOLIO",
  githubPreview: folioGithub,
  live: "https://staging.d3lmw6s3chjejw.amplifyapp.com",
},
```

No component change is ever needed — every external link on the site is already wrapped, and a link
with no image renders byte-identically to one that was never wrapped: no wrapper element, no Radix, no
listeners.

**Sizing is not your problem.** The sources here are full-page captures at roughly 1919×908; the card
crops them to a fixed 200×125 box anchored to the top, and `next/image` generates the served sizes.
Do not pre-crop — a full capture stays re-croppable, and the optimiser never serves the original.

## Why there is no automatic fallback

The component this was adapted from defaults to `https://api.microlink.io/?url=…&screenshot=true`,
which generates these on the fly. That path was deleted rather than kept as an option, and
`link-preview.tsx`'s header carries the full reasoning: it would be the site's only runtime external
dependency on an otherwise fully static build, its free tier is IP-rate-limited so previews silently
stop rendering partway through a browsing session, and it sends the URL a visitor is considering to a
third party from their own browser. `qss`, which existed only to build that query string, was
uninstalled with it.
