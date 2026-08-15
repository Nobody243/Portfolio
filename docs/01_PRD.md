# Product Requirements Document — Muhammad Saad Portfolio

## What this is
A scrollable, cinematic personal portfolio site for Muhammad Saad — an IT undergraduate transitioning
from full-stack/mobile development toward Cybersecurity, Cloud Infrastructure, and Networking. The site
functions as a first impression before any recruiter, collaborator, or fellow engineer ever talks to him
directly — "make myself the product."

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

## What v1 (MVP) actually looks like
All seven sections from the site structure, real content throughout (no placeholder Lorem Ipsum, no
fabricated stats/testimonials), light/dark toggle working, responsive on mobile/tablet/desktop, deployed
live on Vercel with a real domain or vercel.app URL, all links real and working.

## Success metrics
Since this isn't a product with signups/revenue, success is qualitative + a few lightweight signals:
- Time-on-site and scroll depth (via analytics) — are people actually reading past the hero?
- Click-through rate from Projects gallery into detail pages
- Direct outcome signals: interview requests, LinkedIn connection requests, GitHub follows/stars
  attributable to the site
- Subjective: does it get an unprompted "this is different" reaction from people who've seen a lot of
  dev portfolios? That's the actual bar being aimed for.

## Explicitly NOT building in v1
- No CMS/admin panel — content updates happen by editing the structured data files directly and
  redeploying (this is intentional, see Technical Architecture doc)
- No authentication, accounts, or user-generated content of any kind
- No blog/CMS-backed writing platform (the "Currently Learning" section is static text, not a blog engine)
- No e-commerce, no downloadable gated content, no newsletter/email capture
- No multi-language support
- No CTF/write-up content until it genuinely exists — the section stays honest and sparse rather than
  padded with placeholder entries
