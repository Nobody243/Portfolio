"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   `/work`'S PROJECT DECK — A FAN AT `lg`+ AND A PILE BELOW IT.
   ═══════════════════════════════════════════════════════════════════════════

   **THE FILE WAS `FannedDeckPhase1.tsx` AND THE COMPONENT WAS THE VENDOR'S
   `Cards` UNTIL 2026-08-28.** The phase number was the status, the status is
   no longer phase 1, and `ProjectDeckSection.tsx` aliasing `Cards` on import
   was the tell that the export had never been named for what it is. One
   importer, renamed with it.

   ═══ WHAT SHIPS BELOW 1024, AS OF 2026-08-28 ═══

   **THE FAN IS ROTATED 90 DEGREES AND BECOMES A PILE.** Five full-width
   coloured slabs stacked `BAND_H` (89px) apart, so what every card shows at
   rest is a full-width BAND carrying its own title. Tapping a band opens
   that card in place — cover, one-liner and `Details`, all inside the card —
   by growing the card downward out of its own band while the cards BELOW it
   slide down on the same `SPRING`, and the container grows in flow exactly
   as it does at `lg`+. The cards above do not move, the cards below stay
   visible as bands, and one tap on any other band switches.

   ═══ A CLOSED CARD IS CLOSED BY ITS OWN BOX. READ THIS BEFORE CHANGING IT.
   ═══

   The first version of this branch hid a closed card the way the picture
   suggests: every card stayed at its full natural height and the NEXT CARD
   painted over all but its top 89px. It looked right in four places out of
   five and it was wrong, because **the mechanism is positional and the last
   card has no next card.** Found in a browser at 360x740: SNA rendered its
   whole body at rest — cover, one-liner and a 79x44 `Details` link that was
   painted, `inert`, and therefore a dead control under the finger. It was
   invisible at 360x640 because the body fell below the fold.

   So a closed card now measures exactly `BAND_H` and clips its own cover and
   body with the `overflow-hidden` it already had. **No card's appearance
   depends on a neighbour, on the container, or on its position in the
   stack.** Three independent guards, and the first two are new:

     the card       `height: BAND_H` while closed, `overflow-hidden` — the
                    cover and body are clipped away, not covered up
     the body       `opacity: 0` while closed, at BOTH breakpoints
     `inert`        while closed — out of the tab order, out of hit-testing,
                    out of the accessibility tree

   **WHAT THIS COST, STATED PLAINLY:** closed cards are now 89px tall and
   89px apart, so they ABUT rather than overlap. The design's argument for
   the pile over an accordion leaned partly on the overlap — each card's
   bottom corners cut by the card in front, so only the top arcs show and the
   wedges peeking through them read as slabs on slabs. Those wedges are gone;
   what shows at each seam is the page behind, through two 13px corner arcs.
   The overlap can be had back by making a closed card `BAND_H + n` tall and
   accepting that the LAST one is `n` px taller than the other four, which is
   a per-position rule and therefore Saad's call, not an implementer's. It is
   not taken here: correctness first, and "the last card must show its 89px
   band like the rest" was the instruction.

   It is the same five objects, the same five faces, the same radius, the
   same spring, the same one-tap switching and the same "the document below
   actually moves" — with the exposure axis changed from horizontal to
   vertical, because horizontal is the axis a phone does not have.

   Saad's three load-bearing properties, checked one at a time:

     content stays INSIDE the card    nothing leaves it. No panel, no sheet,
                                      no region below the deck.
     the other four stay visible      all five are on screen in every state,
                                      above and below, each still showing its
                                      own full-width band and its own title.
     switching is ONE tap             every band is live in every state.

   **"GROWS IN PLACE" IS READ AS "REVEALED WITHOUT MOVING", ON SAAD'S CALL.**
   The `lg`+ card literally scales (`ACTIVE_SCALE` 1.15). The pile card does
   not move a pixel — it stops being covered. A full-width card cannot scale:
   5% of 318px is 16px and the box clips.

   ═══ WHAT WAS DELETED RATHER THAN KEPT AS A FALLBACK ═══

   The below-`lg` values were not a fallback worth keeping "just in case" —
   they were the broken treatment the pile replaces, and leaving them makes a
   dead branch look authoritative. Gone in the same commit:

     `Math.round(CARD_SPACING * 0.39)`  the 70px strip, and the `spacing`
                                        state that held it
     `DECK_H_ACTIVE` (866)              the below-`lg` fan's active height
     `[--height:300px] [--width:220px]` the 220x300 card
     `aspect-[5/2]`                     the second cover silhouette
     the base halves of `p-xs`,         each is now the pile's value with the
     `pt-2xs`, `mt-2xs` and the         `lg:` half untouched
     title's `text-body`
     `min-h-[570px]`                    now `min-h-[445px] lg:min-h-[570px]`,
                                        where 445 is `5 * BAND_H`

   ═══ ALTERNATIVES CONSIDERED AND REFUSED (do not re-derive these) ═══

   A SWIPE CAROUSEL — the design that already exists on disk, in the retired
   `ProjectDeck.tsx`'s `DeckStack`. Refused on five counts: it shows ONE
   project at a time (the ruling says the other four stay visible; its own
   comment concedes the peek slabs are empty and `aria-hidden`); switching is
   four swipes or a pager, and the pager is a second control invented to undo
   the carousel's own defect; drag is a THIRD motion driver on a site whose
   rule is "elapsed time and scroll position, never a third"; it needs a
   guard against its own most common gesture (a thumb that lands on `Details`
   and swipes) which was never verified in a browser; and it hides how many
   projects there are, where the pile's rest state IS that answer.

   A SHRUNK FAN. Arithmetic, not taste: at 768 a five-card fan exposes 111px
   per card, below the 180px title-legibility floor at any type size, and at
   360 it is 70px, which cannot hold a word. There is no type size that fixes
   it because the constraint is a WORD.

   A PLAIN VERTICAL LIST. Worse than generic here — redundant. The site would
   then carry three vertical five-item project lists: Home's featured cards,
   `/projects`' Index rows, and this. The deck exists to be a different
   object from those two, and separated cards with gaps between them are
   exactly those two lists again.

   AN ACCORDION. **This is the alternative the shipped pile came closest to,
   and the honest record is that the browser round moved it closer.** The
   original argument was that a self-clipped card shows `rounded-deck` on its
   top AND bottom corners, so five bands become five separate pills — a
   settings screen — whereas the pile's cards were cut by the card in front,
   showing only the top arcs. A closed card is self-clipped now, so that
   distinction is weakened; see the note above for what it cost and how to
   buy it back. **What still separates the two is the interaction, and it is
   not cosmetic:** an accordion collapses its neighbours and reflows a list,
   the pile leaves every band exactly where it is and slides only the cards
   BELOW the open one, so the thing you tapped never moves and every other
   project stays one tap away. There are no dividers, no chevrons and no
   per-row height animation of a list item; the one height that animates is
   the OPEN card's, out of flow, on the same spring as the cards it displaces.

   Also refused, each because it is the generic move: a chevron or
   "tap to expand" hint per band (this site has no icon system); `01`-`05`
   numerals down the left edge (that is `/projects`' device and its identity,
   and borrowing it re-opens the IA problem the "Index" heading fixed); a
   splayed stack with each card inset a few px (five leading edges on a page
   whose compositional rule is one); dimming the inactive cards to 40%
   (refused, and the reason differs by branch — **at `lg`+ the cards OVERLAP,
   so a translucent card shows the card behind it, which is why the inactive
   treatment there is scale and translate rather than a fade; below `lg` they
   abut instead, and the refusal stands on contrast: `opacity` composites the
   face AND its ink toward `bg-base` TOGETHER, and `text-fg` on these five
   faces has a measured floor of 5.02:1 with no headroom to spend. Worked on
   the binding pair — `#EDEDED` on ClashChat's `#346E68` over `#0A0A0B`, at
   `opacity: 0.4`, compositing in sRGB as CSS does — the ink lands at
   `#646464` and the face at `#1B3230`, which is **2.32:1**: under the 3:1
   non-text floor, let alone AA. That is arithmetic from the tokens, not a
   browser reading. `/projects` can dim its rows because a row there is ink on
   the page; a band here IS a coloured surface, and the surface is the
   project's identity**); a shadow under the open card; and
   auto-scrolling the opened card into view (refused by Saad — the site's
   scroll is Lenis-driven, the reduced-motion path has no Lenis instance at
   all, and the card opens downward from the band the finger is already on).

   ═══ THE ACCEPTED COSTS, STATED RATHER THAN DISCOVERED ═══

   - **THE SPLIT IS BY BREAKPOINT, NEVER BY POINTER CAPABILITY**, which means
     a finger-only tablet at >=1024 landscape gets the fan. `ProjectStripRow`
     accepts the same cost for the same two reasons: `useHoverCapable()`
     renders one branch on the server and swaps it at hydration, and
     `pointer-coarse:` is Rule S-5's silent failure.
   - **THE COVER IS BEHIND A TAP BELOW `lg`, WHICH IS A REAL DIVERGENCE FROM
     `/projects`' MOBILE RULING** ("the cover is simply always visible").
     Stated rather than smuggled. It is not the same failure because on
     `/projects` the tap NAVIGATES, so withheld information is withheld
     forever, while here the tap OPENS. Putting a thumbnail in the 89px band
     would mean the cover changes position and size between states, which is
     a layout animation of an image — the one thing §4 exists to prevent.
     What is never behind a tap is the TITLE, which is the thing that answers
     "which project is this", and which the shipped fan got wrong.
   - **THE FIVE CARDS ARE ONE SUBTREE AT BOTH WIDTHS.** The branch is JS for
     transform targets and `lg:` utilities for box, type and order — never
     two DOM trees. `ProjectDeck.tsx` shipped two switched by `hidden
     xl:block` and had to withdraw its claim that the hidden branch's covers
     never download. With one subtree the question does not arise.

   ───────────────────────────────────────────────────────────────────────────
   PHASE 3 (REVISED, THEN REVERTED) — THE CONTENT IS BACK INSIDE THE CARD.
   ───────────────────────────────────────────────────────────────────────────

   Phase 1 reproduced Aceternity's `interface-crafts-cards` unmodified with the
   vendor's placeholder deck, so a human could answer "does the mechanism work
   in this app at all" in a real browser. Phase 2 swapped in the five real
   projects. Phase 3 restyled the card onto a neutral five-step elevation ramp.
   A revised Phase 3 then moved the description and `Details` OUT of the card
   into a separate panel below the deck — **and Saad rejected that on sight and
   ordered it reverted.** It is preserved on branch `deck-panel-split-backup`
   and tag `deck-panel-split`, and it is NOT what ships.

   ═══ READ THIS BEFORE "FIXING" THE STRUCTURE AGAIN ═══

   The split is the textbook answer to the two bugs below and it is the wrong
   answer here. Saad's ruling, and the reason it is binding:

     "The reference's cards grow IN PLACE, description and Details appear
      WITHIN the expanded card, the other four stay visible fanned below, and
      switching between projects is one click. The split lost all of that.
      That's a different interaction than what was asked for, not a smoother
      version of it."

   All three of those are load-bearing and all three are verified below. **If
   you are about to move content out of this card, you are re-deriving a
   rejected design.** The bugs it was meant to fix are fixed surgically instead:

     `<a>` inside `<button>`   the BAND is a `<div role="button" tabIndex>`
                               and `Details` is its SIBLING, not its child.
                               Zero `button a, a button` matches on the page,
                               and no focusable descendant inside a
                               `role="button"` either — see the ARIA note
                               under STILL OPEN, which is now CLOSED.
     inactive cards tabbable   `tabIndex={-1}` while another card is open —
                               **at `lg`+ ONLY**, because that reasoning is
                               about a card thrown 400px down at `scale: 0.7`
                               and a pile band is none of those things. Back
                               to `0` when none is open. NOT `inert` and NOT
                               `pointer-events-none` — they stay CLICKABLE,
                               because that is what one-click switching is.

   **NOT CHANGED, AND NOT TO BE CHANGED** — confirmed by Saad in a real browser
   and by live CDP measurement across every phase: the fan rest transforms, the
   tilts, the z-order, the click behaviour, the 400px drop of the inactive
   cards, `ACTIVE_SCALE` 1.15, the rotations, the spring, the JS-driven 1024px
   spacing breakpoint, the animated outer height, the `min-h-120` floor, the
   three `DECK_H_*` constants, `h-120`, `max-w-5xl` and the hard cap.

   **THE LOCK IS DESKTOP-SCOPED, AND SAAD SCOPED IT EXPLICITLY ON 2026-08-28.**
   Read literally it contradicted the mobile brief: "the JS-driven 1024px
   spacing breakpoint" and "the three `DECK_H_*` constants" named things that
   existed ONLY for the sub-`lg` fan being replaced. The ruling: the list is a
   lock on the DESKTOP presentation Saad confirmed in a browser. **Nothing at
   or above 1024px may change** — the fan rest transforms, the tilts, the
   z-order, the click behaviour, the 400px drop, `ACTIVE_SCALE` 1.15, the
   rotations, `SPRING`, the animated outer height, `min-h-120`, `DECK_H_REST`,
   `DECK_H_ACTIVE_LG`, `h-120`, `max-w-5xl` and the hard cap. Below `lg` the
   list is superseded, and the constants that were only ever the small fan's
   are deleted rather than renamed.

   (`min-h-120` is quoted here because that is how the lock names it, in both
   Saad's original wording and the 08-28 ruling. **No such utility has ever
   been in this file's markup** — the floor has always shipped as a literal,
   and it is now two literals. §3 has the three of them.)

   **ONE THING AT `lg`+ DID CHANGE ON PURPOSE AND IT IS NOT GEOMETRY: THE
   FOCUS RING NOW PAINTS.** The card carried `outline-none
   focus-visible:outline-2 focus-visible:outline-offset-4
   focus-visible:outline-accent-working`, and in Tailwind v4 `outline-none`
   sets `--tw-outline-style: none` on the element unconditionally while
   `outline-2` resolves `outline-style: var(--tw-outline-style)`. Both were on
   the same element, so the ring computed to `outline-style: none` and never
   drew. Verified in the emitted stylesheet rather than inferred. The rebuild
   moves the indicator onto an element that carries no `outline-none`, so a
   keyboard user finally sees the ring the code has claimed since Phase 1.

   **WHAT THE RESTYLE KEPT FROM THE REVISION** — none of it depended on the
   split, and all of it survived the revert: the ten per-project deck faces, the
   borderless card, `rounded-deck`, the full-bleed cover clipped by the card's
   radius, the one-aspect letterbox, `--text-deck-title`, and the CIEDE2000
   correction in §1.

   **WHAT THE REVERT RETIRED, so it is not restored from memory:** `DeckPanel`,
   the `role="group"` region, the deck box fixed at 480 in both states, `inert`
   on dropped cards, and the panel's `text-body` one-liner.

   ───────────────────────────────────────────────────────────────────────────
   1. THE PALETTE — ONE COLOUR PER PROJECT
   ───────────────────────────────────────────────────────────────────────────

   `bg-deck-1` … `bg-deck-5` still name the five surfaces, but **they are now
   bound to the PROJECT and not to the stacking position.** The superseded rule
   is quoted in full at `FAN_PRESENTATION`; `app/globals.css` carries the ten
   hexes, the per-card contrast against `--color-fg`, and the mapping rule that
   re-ordering `content/projects.ts` must re-order the tokens with it.

   **ONE INK, `text-fg`, ON EVERY SURFACE.** Verified rather than assumed, as
   the brief required: the floor is ClashChat at 5.02:1 in dark, AA at any
   size; light runs 14.71 to 16.03. There is no per-card ink and none is needed.

   **NO BORDER.** Removed by name in the brief. It holds — every overlapping
   pair separates at ΔE 7.4+ in light and 9.1+ in dark. Measure that with
   CIEDE2000, never with a WCAG ratio: the ratio is luminance-only, the light
   faces are near-isoluminant and hue-separated, and it reports 1.03:1 on a
   boundary that is plainly visible. That mistake was made here first and the
   correction is written up in `app/globals.css`.

   **THE RADIUS IS `rounded-deck`, THE SITE'S SECOND RADIUS TOKEN**, added on
   Saad's instruction in the same brief. `--radius-photo`'s docblock said a
   second consumer was a decision for Saad and not for an implementer; he took
   it. Still not a scale — two tokens, each naming what it may touch.

   NO SHADOW. `projectButtonStyles.ts` records the split: the brutal offset
   treatment is for CONTROLS, never for content surfaces, and five overlapping
   tilted slabs each casting five shadow layers is the largest possible version
   of the thing that split exists to prevent.

   ───────────────────────────────────────────────────────────────────────────
   2. THE TYPE — AND WHY THE TITLE IS A NEW TOKEN
   ───────────────────────────────────────────────────────────────────────────

   **`text-base` IS A COLOUR UTILITY ON THIS SITE AND IT IS NOT IN THIS FILE.**
   `app/globals.css` defines `--color-base` and no `--text-base`, so Tailwind
   resolves the name against the colour namespace and emits
   `.text-base{color:var(--color-base)}` — no font-size, no line-height. So are
   `text-sm`, `md:text-3xl`, `text-white` and `text-black`: they resolve against
   Tailwind's default scale, which survives alongside this site's and is not it.

                            at `lg`+                     below `lg`
     card title  `text-deck-title` 21 / 1.2 / -0.01em   `text-h4` (21 floor)
     one-liner   `text-caption` + `font-mono` 12px      `text-body` 16 / 1.6
     Details     `text-caption` 12 / 1.4 / 0.08em + `font-mono uppercase`, both

   Space Grotesk throughout except the two `font-mono` cells. **This table
   listed the one-liner as `text-body` "(in the PANEL)" and had a fourth row,
   "Close", until 2026-08-28** — the panel is the REVERTED design and its
   `Close` control went with it, so both rows described markup that has not
   existed since the Phase 3 revert. The two per-branch splits each have their
   own paragraph below and their own note at the call site.

   **THE TITLE GREW 16px -> 21px AND 21 IS A CEILING, NOT A PREFERENCE.** The
   brief asked for a larger resting title to fill the card's dead space. The fan
   shows a 180px strip of every card but the last (`CARD_SPACING`), which is
   167px of measure after `lg:px-sm`. Measured in Space Grotesk at this site's
   tracking, the longest unbreakable word in the five titles —
   "Infrastructure" — is 139px at 21px and **173px at 26px**, which is what
   `--text-h4` resolves to at any viewport the deck is actually shown at. So h4
   overflows the strip by 6px and clips, which is the defect this phase existed
   to fix. `--text-deck-title` is h4's floor with the clamp removed; the full
   table is in `app/globals.css`. Going bigger means widening `CARD_SPACING`,
   which is on the do-not-change list.

   **THE ONE-LINER IS `text-caption` + `font-mono` AT `lg`+ AND `text-body` IN
   SPACE GROTESK BELOW IT — ONE STRING, TWO REGISTERS, ON PURPOSE.**
   `globals.css` pairs caption with JetBrains Mono for "labels / stats /
   tags", not for sentences, so the mono setting was always a compromise
   recorded as one: the fan card's measure is 274px, `text-body` renders the
   longest one-liner at 154px of what used to be a 204px box, and the site has
   no step between 12 and 16. **The measure that forced it does not exist
   below `lg` any more.** The pile card is the full column — 292px of measure
   at 360, 550 at the 576px cap — so the sentence is set in the face the design
   system mandates for sentences, and the compromise survives only where its
   cause does. Saad approved the split on 2026-08-28. The remaining
   alternative at `lg`+ is shorter copy, which is content, which is Saad's
   alone.

   **THE TITLE IS `text-h4` BELOW `lg` AND `lg:text-deck-title` (21px) AT IT.**
   It was `text-body` (16px) below `lg` until 2026-08-28, and the reason was a
   height budget rather than taste: on the 220x300 card a three-line
   reservation at 21px cost 20.6px more than at 16px against 231px of
   available height, worst-case slack 24px on CCN, and `overflow-hidden` would
   have eaten the `Details` link. **That budget died with the 220x300 card.**
   The pile card is `height: auto`, so the constraint moved from the card's
   height to the BAND's: `text-h4` resolves to its own 21px floor at 360, two
   lines is 50.4px in an 89px band, and the maintenance rule is now `BAND_H`'s
   rather than the card's.

   ───────────────────────────────────────────────────────────────────────────
   3. THE SPACING
   ───────────────────────────────────────────────────────────────────────────

   `p-2 md:p-4`, `mt-5`, `mt-3`, `max-h-50` and `gap-2` are gone. The card is
   `p-sm` (13) at every width — it was `p-xs lg:p-sm` until 2026-08-28, and the
   8px base half belonged to the 220x300 card — and every internal gap is
   `mt-sm` / `pt-sm` off the Fibonacci scale. `BAND_H` (89) is `--spacing-2xl`
   off the same scale.

   **THERE ARE THREE OFF-SCALE HEIGHT LITERALS, NOT TWO, AND EACH NAMES A
   CONSTANT THAT LIVES IN THIS FILE.** This paragraph said "`h-120` AND
   `min-h-120` … THE TWO EXCEPTIONS" until 2026-08-28; `min-h-120` was never
   in the markup even then — the floor has always shipped as a literal — and
   the pile added a second floor. What is actually there:

     `h-120`             480   the inner positioning wrapper. The vendor's
                               resting box, and the whole Phase 1b extent
                               arithmetic derives from it.
     `lg:min-h-[570px]`  570   `DECK_H_REST`, the fan's floor.
     `min-h-[445px]`     445   `5 * BAND_H`, the pile's floor.

   There is no 480 and no 570 on the Fibonacci scale, and inventing one to
   launder a locked constant would be worse than the inconsistency. 445 is
   off-scale only because it is five times something that is ON it, which is
   why it is written as a literal with a must-track comment rather than as a
   new token. `max-lg:h-[89px]` on the card is NOT a fourth: 89 is
   `--spacing-2xl` and it is spelled as an arbitrary value only because it has
   to lose a specificity fight to Motion — see the card's class list.
   `max-w-5xl` on the inner wrapper is the vendor's container and is untouched
   for the same reason as `h-120`.

   **THE TITLE'S `min-h` RESERVATION IS GONE AND IS NOT TO BE RE-ADDED.** It was
   `min-h-xl lg:min-h-[76px]`, sized to three lines, and it existed to keep the
   description starting at the same height on all five cards. Bottom-anchoring
   supersedes it and gives a better constant — `Details` is now the same
   distance off the card's bottom edge on every card in both states — and it
   removes the ~50px of empty card that the reservation left under the three
   one-line titles, which was on the flagged list. Nor is it needed to keep the
   cover off the title: the cover is fixed-aspect and `shrink-0`, so it cannot
   grow into anything.

   ───────────────────────────────────────────────────────────────────────────
   4. THE TRANSITION — FIXED STRUCTURALLY, AND RE-MEASURED
   ───────────────────────────────────────────────────────────────────────────

   Phase 2's cover was `flex-1 max-h-50`, so its height was a function of the
   text block's height; the description's height was animated on the spring, the
   cover's flex basis re-solved against it every frame, and the cover collapsed
   200 -> 117 while the title travelled 109px.

   **THE TITLE NOW MOVES ON PURPOSE, AND THAT IS NOT THE SAME THING.** Saad
   asked for the name to sit at the bottom of the card and "then transform with
   the content", so at `lg`+ the cover is pinned to the top, the title and the
   body are bottom-anchored as one group, and the body's height animates from 0
   to **a measured pixel value** on the card's own spring — which lifts the
   title.

   **THE UTILITY THAT DOES IT IS `lg:mb-auto` ON THE COVER, NOT
   `justify-between` ON THE CARD.** It was `justify-between` until 2026-08-28,
   when the card went from two children to three — band, cover, body — and
   `justify-between` distributes free space between EVERY pair, which would
   have opened a gap between the title and the body it is supposed to be glued
   to. An auto margin absorbs the free space in one place instead. The
   MECHANISM is unchanged and so is the rendered result at `lg`+; only the
   utility moved.

   **NOT `"auto"`. THAT WAS TRIED AND IT IS THE THIRD DISTINCT VERSION OF THIS
   BUG.** `CardExpandedBody`'s docblock carries the frame-by-frame trace; the
   short version is that Motion resolved `"auto"` to a target of ~183 when the
   content had always measured 129, then handed the height back to `auto` on
   completion and everything below the title dropped 54px in one frame. Saad
   reported it as "the content glitches to the bottom of the card".

   Phase 2 also animated a height here and that WAS a bug for a third reason
   again: the cover was `flex-1` and re-solved against this block every frame,
   so the screenshot itself scaled 200 -> 117 and the title chased it.

   What holds now: the cover is fixed-aspect and `shrink-0`, the target is a
   number rather than a keyword, and the body's content is pinned to the BOTTOM
   of the collapsing box (`justify-end`) so it is revealed rather than moved.

   RE-VERIFIED ON THE PRODUCTION BUILD in transform-free layout coordinates —
   `getBoundingClientRect` is useless here, because a resting card is rotated up
   to 15 degrees and its bounding box is not its box:

     COVER   [w, h, offsetTop]        274,154,13   one value throughout
     DETAILS bottom, above the card    2px -> 2px  **travel 0.0px**
     TITLE   bottom, above the card    0px -> 132  the intended lift
     body height                       peak 133, settles 129 (no snap)

   Zero travel on `Details` is the invariant; 132px on the title is the feature.
   A title with ONE sampled position would mean it jumped rather than animated,
   and the check asserts against that too. Endpoint measurement would have
   passed all three versions of this bug, which is why this samples the middle.

   ───────────────────────────────────────────────────────────────────────────
   5. LETTERBOXING — ONE SILHOUETTE, NO CROP
   ───────────────────────────────────────────────────────────────────────────

   `content/projects.ts` carries an explicit "DO NOT CROP, and do not swap in a
   simplified diagram" on the CCN cover with no scale qualifier, and Saad
   confirmed it stays authoritative for all five. `object-contain`, always.

   The cover box is ONE fixed aspect at EVERY width now, shared by all five, so
   the deck has a single silhouette everywhere — 274x154 on every card at `lg`,
   verified; below `lg` it is `16/9` of whatever the column gives, which is one
   width for all five at any given viewport — and **the letterbox fill is the
   card's own surface**, because the box declares no background and what shows
   through the bars is literally `bg-deck-N`.

   IT IS INSET ON ALL FOUR SIDES by the card's `p-sm` and carries
   `rounded-deck` of its own, since it no longer reaches the card's corners to
   be clipped by them. Below `lg` it also carries a `border-fg/25` hairline —
   the NEUTRAL image-frame family, not the teal interactive one — reinstated
   by Saad on 2026-08-28 and scoped `lg:border-0`. See the call site.

   **ONE RATIO NOW: `16/9` AT EVERY WIDTH.** `aspect-[5/2]` was the below-`lg`
   box and it went with the 220x300 card on 2026-08-28. It was also the one
   place the deck had two silhouette behaviours: 2.5 sits inside the sources'
   range, so SNA pillarboxed there while the other four letterboxed. At 16/9
   all five letterbox at every breakpoint. The paragraph below is the record
   of how the two ratios were derived while both existed.

   **THE TWO RATIOS WERE A HEIGHT BUDGET** set by CCN, whose one-liner is the
   longest of the five — the cover gets what the expanded text block does not
   need. `lg:aspect-[16/9]` leaves 15px of headroom at 300x400; `aspect-[5/2]`
   leaves 4px at 220x300. Measured bars at `lg`, native aspect against the
   1.778 box:

     FOLIO      2.143   13.1px top and bottom
     Aero-Grid  2.130   12.7px
     ClashChat  2.130   12.7px
     CCN        2.674   25.5px   ← the worst case
     SNA        1.971    7.6px

   Every source is wider than the 1.778 box, so all five letterbox and none
   pillarboxes. A squarer box would fill more of the card and cost CCN more bar;
   a wider one would shrink the photo the margin was just added to show off.
   Below `lg` the 2.5 box was inside the sources' range, so SNA pillarboxed
   there while the rest letterboxed — the deck's one two-silhouette behaviour,
   and it is gone with the box.

   `style={{ objectFit: "contain" }}` AND NOT ONLY THE CLASS. `next/image` reads
   `objectFit` from the prop or from `style`, never from `className`; with both
   absent the blur placeholder falls through to `background-size: cover` and the
   plate crops while the loaded image letterboxes, producing a visible pop on
   load. `ProjectStripRow.tsx` carries the full diagnosis.

   `sizes` HAS THREE CLAUSES AND EACH IS DERIVED FROM A DIFFERENT BOX:

     (min-width: 1024px) 315px    the fan card, 300 painted at `ACTIVE_SCALE`
                                  1.15 = 345, declared 315
     (min-width: 640px) 550px     the pile card at its 576px cap, less the
                                  card's 26px of `p-sm`
     calc(100vw - 68px)           the pile card under 640: the viewport less
                                  the spine's 42 and the card's 26

   **It read `"(min-width: 1024px) 315px, 235px"` until 2026-08-28**, where 235
   was the 220px card scaled by 1.15 — a card that no longer exists. A stale
   `sizes` ships the wrong candidate and nothing reports it;
   `ProjectStripRow.tsx` records that bug shipping for a day. `quality={85}`
   uniformly, never per image. No `priority`: five covers competing for the
   connection is worse than five arriving a beat late, and on this route they
   are behind the Intro plate for ~2.7s regardless.

   ───────────────────────────────────────────────────────────────────────────
   STILL OPEN
   ───────────────────────────────────────────────────────────────────────────

     - **NO `prefers-reduced-motion` BRANCH — PHASE 2.** No branch exists for
       either the fan or the pile. Note the shape of the problem before
       writing one: `MotionProvider` already sets `reducedMotion="user"`
       site-wide, which drops the card TRANSFORMS, so what actually survives
       for such a visitor is the two HEIGHT animations — `BOX_GROW` on the
       outer box and, at `lg`+ only, `CardExpandedBody`'s. Height is neither a
       transform nor a layout projection, so Motion keeps animating it. The
       container's transition has to become `{ duration: 0 }` under
       `useReducedMotion()`; a 0.7s, 360px height animation that pushes four
       sections and the reveal footer while the cards snap is the worst of
       both. Nothing is removed either way — every state, card and link stays
       reachable and the expand becomes a hard cut. Nothing in the pile
       depends on a transition to be understood: its meaning is carried by
       layout and colour, both static.
     - **THE DECK STILL OFFERS NO PROJECT LINKS WITH JS OFF — and the anchor
       count no longer shows that.** Since the expanded body is always mounted
       (it has to be, for the `ResizeObserver` to measure it), all five
       `/projects/<slug>` anchors ARE now in `.next/server/app/work.html`, where
       there used to be none. **They are not usable.** Each sits inside
       `style="height:0px;opacity:0"` and carries `inert=""`, both server-
       rendered, so with JavaScript off they are invisible and inactive and the
       only route onward is still the single "Browse All" control. Do not
       read the grep as a fix. Making the deck degrade to real links is a design
       decision, not a cleanup.
     - **DROPPED-ROW TITLES ARE OCCLUDED BY THE NEXT CARD, AND NOTHING IS
       "CLIPPED" IN THE CSS SENSE.** Every title has `scrollWidth ===
       clientWidth`, so no element is overflowing its own box. What happens is
       that while a card is open the other four collapse to `offsetX * 0.4`
       (72px between centres) and each dropped card is PAINTED OVER by the one
       after it. At rest all five are completely clear — hit-tested on the
       painted line boxes, widest line 157px against the 167px cap.

       **THE COUNT IS NOT A PROPERTY OF THE DECK AND MUST NOT BE WRITTEN AS
       ONE.** Which titles lose their tails depends on WHICH CARD IS OPEN,
       because the last card in the dropped row has nothing in front of it and
       is never occluded. Measured with FOLIO open: Aero-Grid reads in full,
       ClashChat loses its tail, CCN loses its tail, SNA reads in full — two
       of the four. Open a different card and the row re-orders and so does
       the answer.

       **THIS ENTRY HAS BEEN WRONG TWICE AND BOTH ARE RECORDED RATHER THAN
       QUIETLY REPLACED.** It read "ONE DROPPED-ROW TITLE IS CLIPPED … Aero-
       Grid loses the tail of its title — one probe in five" until 2026-08-28,
       which was wrong about the mechanism, the card and the count; the
       correction that day said "three of the four dropped cards", which was
       still wrong about the count and stated it as a fixed number. `lg`+-only,
       and Phase 1 does not touch it: fixing it means changing the drop
       geometry, which is on the do-not-change list, or giving the dropped
       state a presentation of its own.
     - **THE DECK STILL OFFERS NO PROJECT LINKS WITH JS OFF, AND THE PILE DOES
       NOT CHANGE THAT** — see the entry above; it is repeated here only
       because the mobile branch is the obvious place to assume otherwise. The
       prerendered HTML is built with `isLg` seeded `true`, i.e. as the fan,
       and `inert` is applied from the same state on both branches, so a
       JavaScript-less visitor at any width gets exactly what they got before.
       The cheap path the pile makes AVAILABLE, if it is ever wanted: the rest
       transform is a plain `y = i * BAND_H`, so it can be written into the
       SSR HTML as a `style` (the technique `ProjectDeck.tsx` used) instead of
       being animated up from `initial={{ scale: 0 }}`, and `inert` can be
       applied from client state only — which would leave five real, visible,
       working `Details` links with JavaScript off. Saad's ruling stands: that
       is a design decision, not a cleanup, and it was explicitly not taken
       here.
     - **FOLIO'S COVER STILL HAS NO EDGE AGAINST FOLIO'S CARD AT `lg`+.**
       `#F5EFEB` and the FOLIO screenshot's own cream page background are
       close enough that the image dissolves into the surface in light mode.
       **Below `lg` this is fixed** — Saad reinstated `border-fg/25` on the
       cover box there on 2026-08-28, scoped with `lg:border-0` so the desktop
       card keeps its borderless silhouette. See the cover's own comment for
       why that is not a violation of `globals.css`'s "do not add a border
       back". At `lg`+ the defect is unchanged and the pile made it more
       visible, not less, by painting the cover at 292-550px instead of 204.
     - **THE PILE HAS HAD ONE BROWSER ROUND AND IT FOUND ONE DEFECT, NOW
       FIXED.** At 360x740 on a production build the last card rendered its
       whole body at rest, with a visible dead `Details` link; the closed-card
       clip above is the fix, and the cause is recorded there rather than in
       a commit message because the shape of it — a positional mechanism that
       silently has no effect on the final element — is the kind of thing
       that gets re-derived. **Everything else in that round passed.** The
       figures below are still DERIVED rather than observed and are still to
       be confirmed, in this order: (1) the longest title —
       "Multi-Floor Call Center Network Design" — wraps to at most TWO lines
       at 320, 360 and 375, because three lines is 75.6px in an 89px band and
       `BAND_H` moves if it happens; (2) the longest one-liner's line count at
       252 / 292 / 307 / 550px of measure, which sets `H` and therefore the
       box; (3) `H` and the box's active height at 320, 360, 375, 768 and
       1023, and the flush landing of card k+1 on card k's bottom edge —
       sampled MID-ANIMATION, never only at the endpoints, per §4's rule; (4)
       the resting fan at `lg`+ byte-identical to before, measured in
       transform-free layout coordinates because `getBoundingClientRect` is
       useless on a rotated card; (5) the focus ring on every band and every
       card, both themes, all five faces, keyboard-only; (6) `sizes` against
       the painted width, comparing `currentSrc`'s `w=` to the painted box and
       not to `naturalWidth`; (7) `document.scrollHeight` and the
       Certifications heading's offset, rest -> expanded, below `lg` — if they
       are equal the pile was built the wrong way.
   ═══════════════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import Link from "next/link";

import { DECK_DETAILS_LABEL } from "@/components/sections/projectDeckContent";
import { DURATION, EASE } from "@/lib/animation/easing";
import type { Project } from "@/content/types";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/**
 * `useLayoutEffect` ON THE CLIENT, `useEffect` ON THE SERVER — the same guard
 * `Navbar.tsx` and `ProjectOverlay.tsx` both declare locally, and for the same
 * reason: React warns that `useLayoutEffect` does nothing during SSR, and the
 * warning is correct but useless for an effect that exists precisely to
 * resolve a value BEFORE the first client paint.
 *
 * `isLg` is why this file needs it now. It used to select a height that was
 * only reachable once a card was active, so a post-paint `useEffect` could not
 * flash; it now selects the whole BRANCH — pile or fan — and a branch selector
 * gets no such guarantee.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The four fields the deck draws, and no more.
 *
 * A `Pick`, not `Project`, for the reason `ProjectDeckSection.tsx` states: this
 * is a client component, so every field handed to it is serialised into the RSC
 * payload. `description` — by a wide margin the longest strings in the data
 * file — has no business crossing that boundary for a card that never renders
 * it. `ProjectStripRow.tsx` narrows the same way.
 */
export type DeckCardProject = Pick<
  Project,
  "slug" | "title" | "oneLiner" | "coverImage"
>;

type Card = DeckCardProject & {
  surface: string;
  config: {
    y: number;
    x: number;
    rotate: number;
    zIndex: number;
  };
};

type SpringConfig = {
  type: "spring";
  bounce?: number;
  visualDuration?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
};

/* The demo's plain defaults, as ordinary constants. The demo's
   `export const controls` tuning panel is deliberately NOT reproduced — it is
   the Aceternity docs site's own live-tweaking UI, the same category as the
   `tweakpane` dependency already stripped from another vendor component here.
   Do not wire this component to `useDialKit`, `useControls` or `tweakpane`. */
const SPRING: SpringConfig = {
  type: "spring",
  visualDuration: 0.6,
  bounce: 0.25,
};
/**
 * THE OUTER BOX'S HEIGHT GETS A TWEEN, NOT THE CARDS' SPRING, AND THE REASON IS
 * MEASURED RATHER THAN AESTHETIC.
 *
 * ═══ WHAT THIS PROPERTY COSTS ═══
 *
 * `height` on this box is the single most expensive thing the deck animates,
 * because it is the only one that changes DOCUMENT FLOW: every frame, the
 * heading, "Browse All", Certifications, Experience, Currently Learning
 * and the sticky reveal footer all move, and everything that moves repaints.
 * Isolated on the production build with the CPU throttled 6x — driving each
 * animation alone, from the page, with nothing else running:
 *
 *   the outer box height, 570 -> 906     545.7ms main thread   (Paint 232.1ms
 *                                                               over 763 calls)
 *   all five card transforms together    355.4ms main thread   (Paint   9.6ms)
 *
 * The five cards moving, rotating and scaling at once cost LESS than the one
 * box getting taller, and almost none of their cost is paint — that is what
 * `will-change: transform` on the card buys.
 *
 * ═══ WHY A TWEEN FIXES THE JUDDER ═══
 *
 * A spring does not stop; it asymptotes. `SPRING` above overshoots by 2.84% and
 * then spends a long tail creeping back, and on a 336px height change that is
 * a ~9.5px overshoot of the ENTIRE DOCUMENT BELOW, followed by several hundred
 * milliseconds of sub-pixel frames — each one a full reflow and repaint of
 * everything under the deck. Bouncing the page and then juddering it back is
 * exactly what "the content is stuttering when transform" describes.
 *
 * So this one property gets a bounded curve: it starts and it stops. The CARDS
 * keep the spring — they are composited, they cost almost nothing, and the
 * spring is the reference's own feel, which Saad confirmed in a browser and
 * which is on the do-not-change list.
 *
 * `EASE.reveal` and `DURATION.reveal` are the site's own tokens, from
 * `lib/animation/easing.ts`, and this is that file's first consumer inside the
 * deck. 0.7s against the cards' 0.6s visual duration is deliberate: the box has
 * to still be growing when the deepest dropped card arrives, or the card lands
 * against a clip edge that has not finished moving.
 */
const BOX_GROW = {
  duration: DURATION.reveal,
  ease: EASE.reveal,
} as const;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `restDelta` FOR `scale`, AND WHY THE DEFAULT IS WRONG FOR IT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Saad: "as the content pulls up it goes slightly down with a stutter." It did,
 * and it was one frame wide. Sampling the card's computed transform matrix on
 * every frame of a real expand, the scale channel:
 *
 *   t=351.6ms   1.13918 -> 1.14015   (+0.0010)
 *   t=356.5ms   1.14015 -> 1.14108   (+0.0009)
 *      ... 60 more frames, every step <= 0.001, all upward ...
 *   t=526.5ms   1.15410 -> 1.15000   (-0.0041)   <- FOUR TIMES ANY OTHER STEP,
 *                                                   AND IT REVERSES DIRECTION
 *
 * **A SPRING DOES NOT DO THAT. Motion stopped it and wrote the target.** Its
 * springs finish when the remaining distance drops under `restDelta`, whose
 * default is 0.01 — a sensible pixel tolerance and a terrible one for `scale`,
 * which is dimensionless. On a 400px card, 0.01 of scale is **4px**, so the
 * animation was entitled to end up to 4px away from where it was going and
 * jump the rest. It took 0.0041, which is 1.64px, in one frame, downward, while
 * the card was still travelling up — and everything drawn inside the card moved
 * with it. That is the stutter, exactly as described.
 *
 * 0.0002 is 0.08px on the same card: below one device pixel, so the spring now
 * settles into place instead of arriving at it.
 *
 * **THE BOUNCE IS NOT THE BUG AND IS NOT REMOVED.** The card still overshoots
 * `ACTIVE_SCALE` by ~0.4% and comes back — that is the reference's feel, Saad
 * confirmed it in a browser, and it is on the do-not-change list. What changed
 * is that the last 1.64px of that return is now animated rather than snapped.
 */
const SCALE_REST_DELTA = 0.0002;

/**
 * THE BODY'S GROWTH — the same spring with the bounce taken out.
 *
 * The card's height lifts the title; a bounce on it meant the title rose 1.4px
 * PAST its resting position and then crept back down over ~350ms. Measured, the
 * body wrapper settled at **886.6ms** and the title at **811.5ms**, long after
 * the card itself was done at 526.5 — a slow reverse drift with nothing else
 * moving, which reads as a second, separate motion rather than a tail.
 *
 * `bounce: 0` is critically damped: monotonic, no overshoot, and it stops. The
 * CARD keeps `SPRING` unchanged — the fix is to the one property whose overshoot
 * had nothing to bounce against.
 *
 * ═══ IT MUST STAY A SPRING, AND `BOX_GROW` IS NOT A SUBSTITUTE ═══
 *
 * Giving this the outer box's bounded tween was tried and measured WORSE. The
 * title's position on screen is the sum of two things: its layout position
 * inside the card, which this animates, and the card's own transform, which
 * `SPRING` animates. A 0.7s tween finishes the first at 679ms while the second
 * is still settling out of its overshoot until ~864ms — so the title arrived,
 * then got dragged **16.0px past its resting place and back** by the card
 * moving underneath it, with 2 direction reversals and 4 frame-to-frame jumps
 * over 0.6px. Sharing `visualDuration` with `SPRING` is what keeps the two
 * halves of that sum in step: measured, the title's screen overshoot is
 * **0.0px**.
 */
const BODY_GROW = {
  type: "spring",
  visualDuration: SPRING.visualDuration,
  bounce: 0,
} as const;

const ACTIVE_SCALE = 1.15;
const CARD_SPACING = 180;

/**
 * THE FAN, POSITION BY POSITION — the vendor's five `config` blocks, unchanged,
 * zipped against `content/projects.ts` by index.
 *
 * IT LIVES HERE AND NOT IN `content/`. `content/types.ts`'s hard rules forbid
 * colour and class strings in the data layer outright, and a rotation in
 * degrees is presentation by the same argument. A project's position in the fan
 * is a property of the fan, not of the project.
 *
 * ═══ `surface` IS PER-PROJECT NOW, NOT PER-STACKING-POSITION (2026-08-26) ═══
 *
 * **The rule that used to live here has been REVERSED and must not be restored
 * from memory.** It read, in full: "THE RAMP IS ORDERED, NOT ASSORTED, AND THE
 * ORDER IS `zIndex`'s … the card carrying step *n* is the card at stacking
 * position *n* … do not re-shuffle these five class strings." That was correct
 * for the neutral elevation ramp it described, where lightness encoded DEPTH.
 *
 * Saad replaced that ramp with ten hand-picked hexes, one colour per project,
 * in the Phase 3 brief. `bg-deck-1` is FOLIO's colour because it is FOLIO's,
 * not because FOLIO sits at the bottom of the stack. **So these five strings
 * are now bound to `content/projects.ts`'s ARRAY ORDER and re-ordering that
 * file must re-order `--color-deck-*` in `app/globals.css` with it.** The
 * `config` blocks beside them are still bound to the stacking position and
 * still must not be shuffled.
 *
 * **NO BORDER, ON SAAD'S INSTRUCTION.** `border-accent-working/30` was on every
 * card until 2026-08-26 and the brief removed it by name: "no border — seamless
 * card, background color is the card's only edge definition". It holds: every
 * overlapping pair separates at ΔE 7.4 or better in light and 9.1 or better in
 * dark. **Measure that with CIEDE2000 and not with a WCAG ratio** — the ratio
 * is luminance-only, the light faces are near-isoluminant and separated by hue,
 * and it reports 1.03:1 on a boundary that is plainly visible. `app/globals.css`
 * carries both tables and the reason the first measurement was misleading.
 *
 * NO PER-CARD INK. One `text-fg` on all five, verified rather than assumed:
 * the floor is ClashChat at 5.02:1 in dark, which is AA at any size. The ten
 * per-card figures are tabulated in `app/globals.css`.
 */
const FAN_PRESENTATION = [
  {
    surface: "bg-deck-1",
    config: { y: -20, x: 0, rotate: -15, zIndex: 2 },
  },
  {
    surface: "bg-deck-2",
    config: { y: 20, x: 180, rotate: 8, zIndex: 3 },
  },
  {
    surface: "bg-deck-3",
    config: { y: -80, x: 360, rotate: -5, zIndex: 4 },
  },
  {
    surface: "bg-deck-4",
    config: { y: 20, x: 540, rotate: 12, zIndex: 5 },
  },
  {
    surface: "bg-deck-5",
    config: { y: 20, x: 720, rotate: -5, zIndex: 6 },
  },
] as const;

/**
 * The circle-and-arrow beside "Details". Hand-authored, `currentColor`,
 * `aria-hidden` — the word next to it is the accessible name.
 *
 * NO ICON PACKAGE. `skillLogos.tsx` records the standing reason: this site has
 * no icon system, inline SVG is the answer, and a dependency for one 14px glyph
 * is the wrong trade.
 *
 * Drawn in a 24-unit box: a ring, and an arrow pointing along the reading
 * direction because the control moves you FORWARD into the project rather than
 * out to a third-party site.
 *
 * 14px against a 12px `text-caption` line is deliberate and it does not set the
 * row's height: the label's line box is 16.8px, so the glyph sits inside it and
 * the `Details` row measures 17px flat, which is the figure the budget in §6
 * uses.
 */
function DetailsArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      className="shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.5 12h5.25" />
      <path d="M12.5 9.25 15.25 12l-2.75 2.75" />
    </svg>
  );
}

/* ===========================================================================
   CONTAINER SIZING - PHASE 1b. THE ONLY NON-VENDOR *BEHAVIOUR* IN THIS FILE.
   ===========================================================================

   CONFIRMED BY SAAD IN A REAL BROWSER AND BY LIVE MEASUREMENT. Neither Phase 2
   nor Phase 3 changed anything here, and neither had to: the card's LAYOUT box
   is unchanged (300x400 at `lg`), the drop is still `y: 400` at `scale: 0.7`,
   and the rotations and spring are untouched, so every figure below still
   holds. Phase 3 restyled what is INSIDE the card and moved one breakpoint that
   lives inside the card; the fan's geometry never entered the diff.

   WHY THE INNER WRAPPER CAN NEVER GROW. Cards are `absolute; top: 50%;
   margin-top: calc(var(--height) / -2)` inside the INNER positioning wrapper,
   so all five are centred on that wrapper's midpoint. The inner is `h-120` =
   480px, so the midpoint is 240px and it MUST NOT MOVE. Growing the inner from
   480 to ~820 would move the midpoint 240 -> 410 and push every card down
   170px - including the EXPANDED one, which has to stay exactly where it is.
   So the inner stays 480 forever and the OUTER box grows instead.
   `items-start` (was `items-center`) pins the inner's top edge to the outer's
   top edge at any outer height; at rest the two are equal and `items-start`
   renders identically to `items-center`, so the confirmed resting fan is
   untouched.

   `overflow-hidden` STAYS ON THE OUTER, and removing it is not an alternative.
   It is what horizontally clips the two end cards between ~1024 and ~1198px of
   viewport width, which is intended; without it that becomes a horizontal
   scrollbar. And CSS cannot clip one axis only - `overflow-x: hidden` with
   `overflow-y: visible` computes the visible axis to `auto`. So the vertical
   fix has to be HEIGHT.

   ---------------------------------------------------------------------------
   VERTICAL EXTENT, measured downward from the inner wrapper's top edge (y = 0).
   Includes the rotation each card carries and the spring's overshoot, both of
   which a naive y + height/2 sum misses. A w x h box rotated by T has
   half-height (w/2)*sin T + (h/2)*cos T. `bounce: 0.25` is damping ratio
   z = 0.75, whose first peak overshoots its target by exp(-pi*z/sqrt(1-z^2)) =
   2.84%.

   **THIS TABLE IS `lg`+ ONLY.** It carried a second, live "base (<1024)"
   column until 2026-08-28 — 220/300 card, resting bottom +429.6, container
   expanded 800.0 — and every figure in it described the shrunken sub-`lg` FAN,
   which is deleted. A reader would have taken it as shipping geometry. The
   pile's arithmetic is not a variant of this and is not tabulated here: it is
   `BAND_H` and a measured card height, and it lives at `pileBoxHeight`.

                                                         lg (>=1024)
     card --width / --height                              300 / 400
     resting fan, top edge                                  -52.3
     resting fan, bottom edge                              +486.8
     expanded card, top / bottom                      10.0 / 470.0
     inactive cards, end of drop                           +785.3
       ...at the spring's peak                             +794.9  <- the max
     CONTAINER, expanded                                    840.0
     clear air below the deepest card                       +45.1

   THE TWO CLIPPED RESTING EDGES AT `lg` ARE THE VENDOR'S OWN AND ARE NOT
   TOUCHED HERE. Card 3's bottom corner sits 6.8px below the 480 box and card
   2's top corner 52.3px above it, at rest, in the state Saad confirmed against
   the vendor reference. (Hovering a resting card scales it 1.05 and deepens the
   first to 18.2px.) The rest height is still exactly 480 at every breakpoint.
   Only the ACTIVE height is new.

   ---------------------------------------------------------------------------
   THE GROWTH IS REAL, IN-FLOW BLOCK HEIGHT. THIS IS A REQUIREMENT, NOT AN
   IMPLEMENTATION DETAIL.

   The point is not only that the dropped cards become visible - it is that
   Certifications and Experience are genuinely PUSHED DOWN THE DOCUMENT while a
   card is open. Anything that merely accommodates the cards visually
   (`overflow: visible`, an absolutely-positioned spacer, a transform, a
   negative margin cancelled at rest) would un-clip the cards and leave the flow
   below untouched, which is the wrong build. Measured on the production build
   at 1440x900, rest -> expanded:

     outer wrapper computed height        480px  ->  840px
     outer wrapper offsetHeight             480  ->    840
     INNER wrapper offsetHeight             480  ->    480   (never moves)
     "Browse All" doc offset       753.80  -> 1113.80
     Certifications <h2> doc offset      991.59  -> 1351.59   (+360.00)
     Experience <h2> doc offset         1316.19  -> 1676.19   (+360.00)
     document.scrollHeight                 2770  ->   3130    (+360)

   Those two heading offsets are the proof. If they were equal in both states,
   this would be the wrong build.

   ---------------------------------------------------------------------------
   THE HEIGHT ANIMATES, ON THE CARDS' OWN SPRING. **THAT IS SAAD'S CALL, MADE
   ON VISUAL GROUNDS, IN A REAL BROWSER** - "the animated was good rather than
   instant, it showed smoothness like below the fanned deck section". The
   smooth downward slide of Certifications and Experience is the wanted effect,
   not a side effect to be minimised. **No performance measurement justified
   this choice and none is claimed to.**

   WHAT WAS MEASURED, AND WHAT IT DOES AND DOES NOT SETTLE. An instant-switch
   version was built and both were measured on PRODUCTION builds at 1440x900,
   driving a real browser over CDP and reading `Performance.getMetrics` across
   identical windows.

   The clean comparison is the COLLAPSE, and it is clean for a specific reason:
   the description block animates its height on the way IN, so during an EXPAND
   there is already a per-frame layout that belongs to the card and swamps the
   container. On the way OUT its `exit` is opacity/x/y only, so the container's
   height is the ONLY height in play:

     collapse, identical 2500ms window   animated   instant   idle
       LayoutCount                             68         8      0
       LayoutDuration (ms)                   5.56      0.55      0

   So the animated box does cost ~60 extra layout passes and ~5ms of layout
   across the transition, on itself and on every section after it in flow.
   That is a real cost and it is the honest number.

   THE EXPAND NUMBERS ARE DELIBERATELY NOT QUOTED AS A VERDICT, BECAUSE THEY
   ARE NOT INTERPRETABLE. Animated 66 / 5.92ms against instant 122 / 5.50ms -
   the INSTANT build counting nearly twice the layouts of the animated one is
   the tell that something other than the container dominates them (the
   paragraph tween above, plus the sampler's own per-frame
   `getBoundingClientRect`).

   AND THE THING THAT ACTUALLY MATTERS - FRAME COST DURING THE TRANSITION -
   **COULD NOT BE MEASURED CREDIBLY IN THAT ENVIRONMENT.** Both versions held a
   16.6ms median frame interval with an 18.1 / 18.4ms maximum and dropped
   nothing, but that was a software-rendered headless shell on one developer
   machine, which is not a valid proxy for real hardware under a real
   compositor. Anyone revisiting this should treat "no dropped frames" as
   unproven rather than as evidence.

   THE ONE CHEAP THING THE ANIMATED VERSION STILL DOES: it performs no layout
   READ. The height is written from a spring and nothing calls
   `getBoundingClientRect` in the loop, so it never forces synchronous layout.
   And the five cards are `absolute` against the INNER wrapper, whose height
   never changes, so the growing box does not re-resolve a single card's
   position. What reflows is static flow content below the deck.

   REUSING `cardSpring` IS LOAD-BEARING, NOT TIDINESS. Container and cards then
   share one normalised progress s, so clearance is a function of s alone and
   holds in BOTH directions without being re-proved. Worst card at `lg`
   (index 0), container bottom minus card bottom: s=0 -> +28.0, s=0.5 -> +42.2,
   s=1 -> +54.7, s=1.0284 (peak) -> +55.3. A CSS transition with a fixed
   duration would have to be re-argued per direction, and would be wrong on the
   return, where the container must LAG the cards rather than lead them.

   THE FLOOR IS LOAD-BEARING - IT FIXES A REAL BUG IN THE OBVIOUS
   IMPLEMENTATION, AND THE BUG WAS MEASURED RATHER THAN PREDICTED. (It ships as
   `min-h-[445px] lg:min-h-[570px]`; this paragraph called it `min-h-120` until
   2026-08-28 and no such utility has ever been in the markup. Everything below
   was measured on the FAN and describes the `lg` floor, 570 against the 480
   box the numbers were taken in. The pile's floor is 445 and the same argument
   applies to it unmeasured.) A
   bouncy spring undershoots on the way back down. Sampled every frame of a
   collapse on the shipped build, reading the RAW animated value off
   `element.style.height` alongside the USED height:

     minimum inline animated height     469.79px   (at t = 614.2ms)
     frames with the inline value < 480       32   of 121
     minimum USED height                   480px   <- the floor holding

   Unguarded, that is ~10px below the vendor's own 480 box for half a second at
   exactly the moment the fan returns - clipping the RESTING fan and bobbing
   every section below it. CSS `min-height` wins over `height`, so the box can
   never be shorter than the resting fan; with the guard the used height never
   leaves [480, 850.2] in either direction. It also holds the box at 480 in the
   prerendered HTML, which emits no inline height at all.

   THE ONE NEGATIVE CLEARANCE IS THE PRE-EXISTING ONE, AND IT IS NOT MADE
   WORSE. Card 3 at `lg` sits 6.8px below the box at rest (above). Sampled
   every frame of both transitions, the worst clearance anywhere is **-6.82 on
   the expand and -6.84 on the collapse** - the resting overhang and nothing
   else. No card is ever clipped by more than it already is when the deck is
   idle.

   A SIBLING SPACER IS NOT A THIRD OPTION. The clipping is done by the outer
   box's OWN `overflow-hidden`, so reserving space beside that box un-clips
   nothing; the box still has to be tall enough.
   =========================================================================== */

/* ═══════════════════════════════════════════════════════════════════════════
   THE BOX, AND WHY THE FAN SITS 64px DOWN INSIDE IT
   ═══════════════════════════════════════════════════════════════════════════

   ═══ THE RESTING FAN IS 539px TALL AND IT WAS IN A 480px BOX ═══

   Saad: "the cards are cut off on the top." They were, and by a lot. Measured
   on the production build at 1440, each card's painted box against the deck
   viewport's own edges:

     card 0  FOLIO       top  -12.0   <- cut
     card 1  Aero-Grid   top   41.1
     card 2  ClashChat   top  -52.3   <- cut, and this is the binding one
     card 3  CCN                      bottom  -6.8   <- cut
     card 4  SNA         top   47.7

   A card is 400px tall and up to 300px wide, so a 15-degree tilt paints a box
   `300*sin15 + 400*cos15 = 464px` tall, and the five `config.y` offsets spread
   another 100px on top of that. **The resting fan's true extent is 539.1px,
   from -52.3 to 486.8 in the old box's coordinates** — it never fitted in 480
   and no amount of re-centring would have made it, because the fan is not
   symmetric about its own middle.

   ═══ WHAT FIXES IT ═══

   `FAN_OFFSET_Y` pushes the fan down inside the box, and the box is 570 rather
   than 480. Measured on the production build, worst card in each direction:

                           top clear    bottom clear
     at rest                 13.7          17.2
     with a card hovered      3.1           5.8

   The hover row is why the box is not sized to the resting fan alone.
   `whileHover` scales a resting card to 1.05, so card 2 grows ~10.6px taller
   and card 3 ~11.3px, and a fit with no slack clips on mouse-over. An earlier
   pass at 565/64 measured **1.1px** clear on a hovered card 2 — positive, but
   inside rounding noise, so five more pixels were spent.

   The offset is on the OUTER box and is constant in both states. Making it
   rest-only would move the entire fan 66px the instant a card was clicked.

   ═══ THE COST, AND IT IS SAAD'S TO SPEND ═══

   `ProjectDeckSection.tsx` budgets this section against a real `innerHeight`.
   The deck's resting box was 480 and is now 570, so the section's resting
   height goes 805.6 -> 895.6 from the top of the viewport:

     at 945 innerHeight   +49.4 clear   (was +139.4)
     at 905                +9.4 clear   (was  +99.4)
     at 875               -20.6         (was  +69.4)   <- crosses the fold
     at 860               -35.6

   **A 1920x1080 display with a bookmarks bar still fits; add an infobar too and
   the "Browse All" control drops below the fold by ~21px.** The
   alternative is to reclaim 21px by taking the heading gap from `mt-xl` (55) to
   `mt-lg` (34) — that gap was already cut from 89 for exactly this reason and
   the section's docblock says so — which would clear 875 by 0.4px.
   NOT TAKEN HERE: it is a spacing decision on a section Saad composed, and a
   visibly cut card is a defect on every visit while 875 is a narrower case.

   ═══ THE ACTIVE HEIGHTS MOVE WITH IT ═══

   The four cards thrown `y: 400` at `scale: 0.7` reach 759.1px below the fan's
   own top below `lg` and 794.9 at `lg`; with the fan 66px down they reach 825
   and 861. **They must stay VISIBLE — that is what makes one-click switching
   between projects possible**, which is the interaction the reference has and
   the reason the panel-split version was rejected. So the box grows to hold
   them rather than clipping them away.

   A SIBLING SPACER IS NOT A THIRD OPTION. The clipping is done by the outer
   box's OWN `overflow-hidden`, so reserving space beside that box un-clips
   nothing; the box still has to be tall enough.
   ═══════════════════════════════════════════════════════════════════════════ */

/** How far the fan sits below the box's top edge. 52.3 of measured overflow,
    plus air for `whileHover`'s 1.05 — a hovered card 2 grows ~10.6px taller and
    is the binding case. Measured hovered: 3.1px clear at the top. */
const FAN_OFFSET_Y = 66;
/** 486.8 lowest resting card + `FAN_OFFSET_Y` + 17.2 breathing room.
    Measured with card 3 hovered, the binding case at the bottom: 5.8px clear. */
const DECK_H_REST = 570;
/** 794.9 deepest dropped card + `FAN_OFFSET_Y` + 45.1 breathing room. */
const DECK_H_ACTIVE_LG = 906;

/* ===========================================================================
   THE PILE - THE BELOW-`lg` BRANCH, AND THE THREE NUMBERS IT NEEDS
   ===========================================================================

   `DECK_H_ACTIVE` (866) USED TO SIT HERE AND IT IS DELETED, not superseded.
   It was the below-`lg` FAN's active height and the below-`lg` fan is gone.
   `DECK_H_REST` and `DECK_H_ACTIVE_LG` are untouched. The pile computes both
   of its own heights from `BAND_H` and a MEASURED card height, so it adds no
   third height constant.
   =========================================================================== */

/**
 * HOW MUCH OF EACH CARD THE PILE LEAVES SHOWING. 89px, and it is
 * `--spacing-2xl` off the Fibonacci scale rather than a tuned number: there is
 * no locked constant here to launder, unlike `h-120`, so it comes off the
 * scale.
 *
 * **IT IS DERIVED FROM THE TITLE'S WORST CASE.** Two lines of `text-h4` at its
 * 21px floor is 50.4px, leaving 25.6px of clear air inside the band — where
 * the 220x300 fan card had 4. Three lines is 75.6px and leaves 0.4, so **if
 * any title ever wraps to three lines at 360px, `BAND_H` moves.** That is this
 * branch's maintenance rule, and it is the pile's equivalent of the fan's
 * "lengthening a one-liner requires re-measuring".
 */
const BAND_H = 89;
/** The card's own padding below `lg` — `p-sm`, `--spacing-sm`. The band is
    `BAND_H` measured from the CARD'S top edge, so its own box is that less the
    card's top padding. */
const CARD_PAD = 13;
/** `BAND_H - CARD_PAD`. Applied as an inline style and not as a `h-[76px]`
    utility, for `FAN_OFFSET_Y`'s reason: the constant is then the only place
    the number lives, and Tailwind cannot see a computed class name. */
const BAND_TITLE_H = BAND_H - CARD_PAD;

/**
 * THE EXPANDED BODY — one-liner and `Details`, and the thing whose height
 * lifts the title off the bottom of the card.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * IT ANIMATES TO A MEASURED PIXEL HEIGHT. IT MUST NEVER ANIMATE TO `"auto"`.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `animate={{ height: "auto" }}` shipped here for a few hours and produced the
 * defect Saad reported as "the content glitches to the bottom of the card".
 * Traced on the production build with a `requestAnimationFrame` sampler on
 * CCN — the worst card — reading the wrapper's inline height, its `offsetHeight`
 * and its `scrollHeight` on every frame:
 *
 *   t(ms)     inline height    scrollHeight (the TRUE content height)
 *      27       58.9px         129
 *     157      111.7px         129
 *     502      186.3px         129   ← already 44% past the real height
 *     577      186.6px         129   ← peak
 *    1002      183.1px         129   ← still drifting down, not settled
 *    1012      auto  ->  129px       ← **54px SNAP, in one frame**
 *
 * Two separate faults, and the second is the visible one. Motion resolved
 * `"auto"` to a target of ~183 when the content had always measured 129 —
 * `scrollHeight` reads 129 from the first frame, the `<p>` is 84px tall at a
 * 274px measure the whole time, and `document.fonts.status` is already
 * `loaded` before the click, so nothing reflowed. Then, on completion, Motion
 * hands the inline height back to `auto`, the real value takes over, and
 * everything below the title drops 54px in a single frame. That drop is what
 * reads as content glitching down into the bottom of the card.
 *
 * So the height is measured here instead, with a `ResizeObserver`, and animated
 * to a NUMBER. There is no `"auto"`, nothing to hand back, and nothing to snap.
 * The observer is what keeps it honest across the 1024px breakpoint — the card
 * goes from a full-column pile slab to the fan's fixed 300x400 box, the
 * one-liner changes size AND face with it (`text-body` below, `text-caption` +
 * `font-mono` at `lg`+) and re-wraps — and across a late webfont, an
 * orientation change, and any edit to the copy in `content/projects.ts`.
 *
 * ═══ THE CONTENT IS PINNED TO THE BOTTOM, NOT THE TOP ═══
 *
 * `justify-end` on the collapsing box. At `lg`+ the cover carries `lg:mb-auto`
 * (it was `justify-between` on the card until 2026-08-28), so this box's BOTTOM
 * edge sits on the card's bottom padding and never moves; anchoring the content
 * to that edge means the one-liner and `Details` **do not travel at all**
 * during the expand, they are only revealed. Anchored to the top — the
 * ordinary flow default — the content would start a full content-height below
 * its final position and ride up into place, which is the same downward motion
 * the `"auto"` bug produced, just intentional. Measured: `Details`' bottom edge
 * holds to within a pixel across the whole animation.
 *
 * ═══ ALWAYS MOUNTED, NEVER `AnimatePresence` ═══
 *
 * It has to be in the DOM at rest for the observer to have something to measure,
 * so it collapses to `height: 0` rather than unmounting, and `AnimatePresence`
 * is gone from this file entirely. `inert` is what makes a collapsed body
 * inactive — it takes `Details` out of the tab order, out of hit-testing and out
 * of the accessibility tree in one attribute, which is exactly the set of things
 * unmounting used to do for free.
 */
function CardExpandedBody({
  card,
  isActive,
  isLg,
  grow,
  onMeasure,
}: {
  card: Card;
  isActive: boolean;
  isLg: boolean;
  grow: SpringConfig;
  onMeasure: (slug: string, height: number) => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    /* THE SAME NUMBER IS NEEDED TWO LEVELS UP. Below `lg` the card is
       clipped to its band, so a `ResizeObserver` on the CARD only ever sees
       an 89px box and cannot notice that a late webfont or an edited
       one-liner changed what is inside it. This observer does see it, so it
       reports up and the deck re-measures. See `bodyHeights` there. */
    const measure = () => {
      const height = el.offsetHeight;
      setContentHeight(height);
      onMeasure(card.slug, height);
    };
    measure();
    /* The card's width changes at 1024 and the one-liner re-wraps with it, so a
       height measured once would be wrong on the other side of the breakpoint.
       `ResizeObserver` also covers a webfont arriving late and any edit to the
       copy. */
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [card.slug, onMeasure]);

  return (
    <motion.div
      /* `initial={false}` so the collapsed state is the first paint rather than
         an animation from it — five cards must not play a collapse on load. */
      initial={false}
      /* ═══ `opacity` IS STATE-DRIVEN AT BOTH WIDTHS, AND THAT IS A FIX ═══
         It read `isLg ? (isActive ? 1 : 0) : 1` for a few hours on
         2026-08-28: the pile branch held every body at full opacity and
         relied on the NEXT CARD to hide it. **That is a positional mechanism
         and the last card in the pile has no next card**, so its entire body
         painted — including a 79x44 `Details` link that was visible, `inert`
         and therefore dead under the pointer. A closed body is now closed
         because it IS closed, at every width and every stacking position.
         Nothing about a card's appearance may depend on a neighbour again.

         `height` STILL DIFFERS BY BRANCH, DELIBERATELY. At `lg`+ this box's
         growth is what lifts the title, so it animates 0 -> a measured pixel
         value on the card's spring. Below `lg` the CARD animates between
         `BAND_H` and its own measured full height and does the revealing, so
         this box holds still at its natural size — two heights animating
         against each other would fight, and the card's height is the one the
         followers have to stay flush with. `contentHeight` is the
         `ResizeObserver`'s measured NUMBER on both branches, never `"auto"`,
         so the three-times-shipped `"auto"` bug cannot recur on either.

         `inert` IS UNCHANGED AND STILL TRACKS `isActive` ALONE. It is the
         third guard, after the card's clip and this opacity: a closed body
         is not painted, not hit-testable and not in the tab order. It is
         also what keeps the no-JS story exactly where it was — see STILL
         OPEN.

         ═══ BELOW `lg` THE OPACITY IS ASYMMETRIC: HARD CUT IN, FADED OUT ═══

         **THE HARD CUT IN IS THE DESIGN.** The content is already there at
         full size and the CARD grows to uncover it, so a fade-in would be a
         second, slower motion laid over a reveal that is already happening —
         the card would open onto something that then arrived late.

         **THE HARD CUT OUT WAS A MEASURED DEFECT AND IS FIXED.** Both
         directions ran on the blanket `{ duration: 0 }` until 2026-08-28.
         Sampled every animation frame at 360x900 on a production build,
         collapsing an open card:

           t(ms)    card height   body opacity
             11         451            1
             31         444            0      <- gone by frame two
            191         248            0
            391          98            0
            511          79            0      <- spring undershoot, 2.76% of
                                                 a 362px travel
            891          88            0      <- settled

         So the content vanished on the second frame and the card spent
         **~520ms shrinking as an empty coloured slab**, then another ~370ms
         settling: half a second of animation on an empty box. Not a
         preference — the card was animating nothing.

         `opacity: grow` ON THE CLOSING DIRECTION ONLY. `grow` is `BODY_GROW`,
         which shares `visualDuration` with the card's `SPRING` and drops its
         bounce, so the fade and the shrink finish together and the content is
         still on screen through the part of the collapse that used to be
         empty. Matching the card's curve exactly would mean plumbing `SPRING`
         into this component; `grow` is close enough for an opacity and the
         plumbing is a larger change than the defect warrants. Saad's call, and
         I agree with it.

         **WHY THE TERNARY RATHER THAN THE FLAT `{ duration: 0, opacity: grow }`.**
         That form is what the fix was proposed as, and it fades in as well as
         out — Motion reads one transition per key regardless of direction. The
         hard cut in has to survive, so the curve is selected on the target:
         `isActive` is the state being animated TO, so `{ duration: 0 }` when
         it is true is the arrival and `grow` when it is false is the
         departure.

         NOTHING IS INTERACTIVE DURING THE FADE. `inert` flips on the frame of
         the tap, so the departing `Details` is out of hit-testing and out of
         the tab order for the whole 0.6s it is still visible. The fade is
         purely what the eye sees close. */
      animate={{
        height: isLg ? (isActive ? contentHeight : 0) : contentHeight,
        opacity: isActive ? 1 : 0,
      }}
      transition={
        isLg
          ? grow
          : { duration: 0, opacity: isActive ? { duration: 0 } : grow }
      }
      /* `shrink-0` IS NEW AND IT IS A NO-OP AT `lg`+. This block used to sit
         inside a `w-full shrink-0` wrapper alongside the title; flattening the
         card to three children made it a flex item in its own right, so it
         needs the property the wrapper was carrying for it. Without it a card
         whose content overruns its 400px box would shrink the body instead of
         overflowing, which is a different bug from the one being avoided. */
      className="flex shrink-0 flex-col justify-end overflow-hidden text-left"
    >
      <div
        ref={innerRef}
        inert={isActive ? undefined : true}
        /* `pt-2xs lg:pt-sm` UNTIL 2026-08-28. The 5px base half belonged to
           the 220x300 card, which is gone; both branches are 13 now and the
           `lg:` value is the one that survived. */
        className="pt-sm"
      >
        {/* === ONE STRING, TWO REGISTERS, SPLIT AT 1024 - DELIBERATELY ===
            At `lg`+ it is `text-caption font-mono`, and that is still the
            compromise it always was: `globals.css` pairs caption with
            JetBrains Mono for "labels / stats / tags", not for sentences, but
            `text-body` renders the longest one-liner at 154px in the fan
            card's 274px measure and the site has no step between 12 and 16.

            **BELOW `lg` THE COMPROMISE IS LIFTED**, because the measure that
            forced it no longer exists: the pile card is the full column, 292px
            of measure at 360 and 550 at the cap, so the sentence is set in the
            face the design system mandates for sentences. The same string is
            therefore typeset differently either side of 1024. That is a
            per-breakpoint register split, recorded as one so nobody
            "harmonises" it back. The ink is inherited `text-fg` from the
            card. */}
        <p className="text-body lg:text-caption lg:font-mono">
          {card.oneLiner}
        </p>
        {/* THE ONE ACTION, AND A VALID ONE — a real `<a>` with no `<button>`
            above it in the tree, which is what the card being a
            `<div role="button">` buys. GitHub and Live Site are on the detail
            page, deliberately: Phase 2's ruling. `stopPropagation` keeps a click
            on the link from also reaching the card and toggling it shut on the
            way out. */}
        {/* `min-h-[44px] lg:min-h-0` - A 12px mono word has a 16.8px line box,
            which is a 16.8px TAP target. 44 is the detail-page chrome's own
            rule applied here; at `lg`+ it is released so the fan card's height
            budget is untouched. `mt-2xs` (5) became `mt-sm` (13) on the same
            grounds — the enlarged target must not sit on the one-liner — and
            13 was already the `lg:` value, so the two branches agree again.

            `lg:relative lg:z-10` IS LOAD-BEARING AND IT IS NOT DECORATION.
            The band throws `lg:after:absolute lg:after:inset-0` across the
            whole card to keep the desktop's whole-card hit area; that
            pseudo-element is positioned and this link's wrapper is not, so
            without a stacking bump the overlay paints on top of `Details` and
            eats its click. `ProjectStripRow.tsx` documents the identical
            hazard from the other side (a sibling subtree painting OVER a
            stretched link) and records that it is invisible to `tsc`, ESLint,
            the build and every screenshot. Below `lg` there is no
            pseudo-element and nothing to out-rank. */}
        <Link
          href={`/projects/${card.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-sm inline-flex min-h-[44px] items-center gap-xs text-caption font-mono uppercase underline-offset-4 hover:underline lg:relative lg:z-10 lg:min-h-0"
        >
          {DECK_DETAILS_LABEL}
          <DetailsArrowIcon />
        </Link>
      </div>
    </motion.div>
  );
}

export const FannedDeck = ({
  projects,
}: {
  projects: readonly DeckCardProject[];
}) => {
  const [active, setActive] = useState<Card | null>(null);
  /* `isLg` NOW SELECTS THE BRANCH, NOT JUST A HEIGHT, AND THAT IS WHY IT
     RESOLVES IN A LAYOUT EFFECT. Its old docblock argued it could not flash
     because the height it chose was only reachable once a card was active. A
     branch selector gets no such guarantee, so `useIsomorphicLayoutEffect`
     settles it before the first client paint. Still seeded `true`, which is
     what the prerendered HTML is built against.

     `spacing` STATE IS GONE. It existed to hold `Math.round(CARD_SPACING *
     0.39)` = 70 below `lg` — the shrunken fan this branch replaces — and
     `CARD_SPACING` is now read directly, which is what it always was at
     `lg`+. */
  const [isLg, setIsLg] = useState(true);
  /** Each card's MEASURED full height below `lg`, by slug — the height it is
      animated TO when it opens, and the single number the followers and the
      box are both derived from. A NUMBER for the same reason
      `CardExpandedBody`'s is; see that docblock's frame-by-frame trace of
      what `"auto"` did. Empty and unused at `lg`+, where the card is a fixed
      400px box. */
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  /** Each card's BODY content height, reported up by `CardExpandedBody`.
      **It is a re-measure trigger, not an input to the arithmetic.** A closed
      pile card is clipped to `BAND_H`, so the `ResizeObserver` on the card
      sees a constant 89px box and never fires when the content inside it
      changes — a late webfont, an orientation change that re-wraps a
      one-liner, or an edit to `content/projects.ts`. The body's own observer
      does see those, and this is how it says so. */
  const [bodyHeights, setBodyHeights] = useState<Record<string, number>>({});
  const handleBodyMeasure = useCallback((slug: string, height: number) => {
    setBodyHeights((prev) =>
      prev[slug] === height ? prev : { ...prev, [slug]: height },
    );
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  /** Every card's BAND node, by slug, so focus can be handed back to whichever
      one was open. A single ref written from a `ref` callback guarded on
      `isActive` looked equivalent and is not: React invokes an inline `ref`
      with `null` and then with the node on EVERY render, so the guard skips
      both calls for the card that has just been deactivated. A map holds every
      node unconditionally and does not depend on that.

      **IT IS THE BAND AND NO LONGER THE CARD**, because the band is now the
      element carrying `role="button"` and `tabIndex` — focus has to go back to
      the thing that can take it. */
  const bandRefs = useRef(new Map<string, HTMLDivElement | null>());
  /** Every card's OUTER node, by slug, for measurement only. Separate from
      `bandRefs` on purpose: the focusable element and the element whose height
      the pile needs are two different boxes now. */
  const cardBoxRefs = useRef(new Map<string, HTMLDivElement | null>());
  /** Remembered one render behind `active` — by the time the closing effect
      runs, `active` is already null. */
  const lastActiveSlug = useRef<string | null>(null);
  /** Set by `close()`, cleared by the effect. FOCUS MUST MOVE AFTER THE STATE
      CHANGE COMMITS: calling `.focus()` inside the `setActive` updater runs it
      during render, React then re-renders, and focus falls to `<body>`. Caught
      by CDP, not by reading the code, which looked correct. */
  const restoreFocus = useRef(false);

  const cardSpring = SPRING;

  const close = useCallback(() => {
    setActive((current) => {
      if (!current) return null;
      /* Only take focus back if it is currently somewhere inside the deck —
         otherwise a click on unrelated page background would yank the caret
         out of whatever the visitor was actually using. */
      if (
        ref.current &&
        document.activeElement &&
        ref.current.contains(document.activeElement)
      ) {
        restoreFocus.current = true;
      }
      return null;
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  /* ESCAPE — the third exit, alongside a click outside and a click on the open
     card itself. Bound only while a card is open, so this component adds no
     document-level key listener to a page that is merely showing a fan. */
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, close]);

  useEffect(() => {
    if (active) {
      lastActiveSlug.current = active.slug;
      return;
    }
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    const slug = lastActiveSlug.current;
    if (slug) bandRefs.current.get(slug)?.focus({ preventScroll: true });
  }, [active]);

  /* THE ONE QUERY, AND IT NOW CHOOSES A BRANCH. The vendor watched this for
     `spacing`; Phase 1b added `isLg` to the same handler; the mobile treatment
     deleted `spacing`'s below-`lg` value and left this reading the query for
     `isLg` alone. 1024 is `lg`, it is Tailwind's own default, and it is the
     only breakpoint in this file — the CSS half of the split is written with
     `lg:` / `max-lg:` utilities against the same number. */
  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ═══ THE PILE'S ONE MEASUREMENT ═══
     Below `lg` a card's full height is a property of its own copy — a two-line
     title, a four-line one-liner and a 44px tap target all move it, and it
     differs per card and per width. The pile needs that number twice: to push
     the cards below an open one down by `H - BAND_H`, and to size the box to
     `4 * BAND_H + H`. It is also the height the open card itself animates to.

     A `ResizeObserver` and not a one-shot read, for the reason
     `CardExpandedBody` already gives: it survives an orientation change, a
     late webfont and any edit to a one-liner in `content/projects.ts`.

     **`scrollHeight`, NOT `offsetHeight`.** A closed pile card's border box IS
     `BAND_H` — that is how it is clipped to its band — so `offsetHeight` would
     report 89 on every card in every state and the deck would never learn how
     tall an open card should be. `scrollHeight` reports the content.

     ═══ THE ACTIVE CARD IS SKIPPED, AND THAT IS THE WHOLE GUARD ═══

     This comment claimed until 2026-08-28 that "the observer cannot fire on a
     frame of the card's own height animation". **It can and it does** — the
     observer watches the card's box and Motion writes that box's height every
     frame below `lg`. What was being relied on, unstated, is that
     `scrollHeight` is floored by the CONTENT height, so an animating box
     smaller than its content still reads as the content. That holds for all
     of the travel except the top of it: `scrollHeight` is floored by
     `clientHeight` as well, so through `SPRING`'s 2.84% overshoot — about 10px
     on an 89 -> 452 expand — the box is TALLER than its content and the read
     comes back as the animated height. The followers and the box would then
     re-target mid-flight, off a number that is about to come back down.

     So the ACTIVE card is skipped. Every card that is measured has a box
     pinned at a constant 89, which is below its content by construction, so
     its `scrollHeight` is exactly its content height and nothing else. A card
     that is closing is not active and IS measured, and that is safe for the
     same reason: a collapse only ever travels DOWNWARD from the content
     height, undershoot included. The value an open card needs was measured
     while it was closed.

     **THE COST OF THE SKIP, DECLARED:** a card that is ALREADY OPEN when the
     viewport rotates, or when a late webfont re-wraps its one-liner, keeps the
     height it was measured at before the change until it is closed again —
     its own body observer still fires and still re-runs this, and this still
     skips it. The card, the followers and the box are then all consistently
     wrong together rather than fighting, and one tap corrects all three. That
     is the right trade against re-targeting a live spring off a number taken
     mid-overshoot, but it is a trade and not a free win.

     `bodyHeights` IS IN THE DEPENDENCY LIST AS A TRIGGER, not as data. The
     observed box is a constant 89, so a content change inside a closed card
     produces no resize to observe; the body's own observer reports it and
     re-runs this. `active` is in the list for the skip.

     NO FEEDBACK LOOP. What this state drives is `y` (a transform), the card's
     own height, and the box's height. None of those changes the CONTENT
     height of a card this reads. The updater also returns the previous object
     unless a number actually moved. */
  useIsomorphicLayoutEffect(() => {
    if (isLg) return;
    const nodes = cardBoxRefs.current;
    const activeSlug = active?.slug;
    const measure = () => {
      setCardHeights((prev) => {
        let next = prev;
        nodes.forEach((node, slug) => {
          if (!node || slug === activeSlug) return;
          const height = node.scrollHeight;
          if (prev[slug] === height) return;
          if (next === prev) next = { ...prev };
          next[slug] = height;
        });
        return next;
      });
    };
    const observer = new ResizeObserver(measure);
    nodes.forEach((node) => {
      if (node) observer.observe(node);
    });
    measure();
    return () => observer.disconnect();
  }, [isLg, projects, bodyHeights, active]);

  /* THE HARD CAP, salvaged from the retired `ProjectDeck.tsx`. The fan has five
     hand-tuned positions; a sixth project has nowhere to go. Throwing during
     render fails `next build` LOUDLY on this statically-prerendered route,
     which is the whole point - the silent alternative is a deck that quietly
     stops rendering the last project and looks fine in every screenshot.
     FEWER than five is fine: `middle` below re-centres the fan. */
  if (projects.length > FAN_PRESENTATION.length) {
    throw new Error(
      `FannedDeck: ${projects.length} projects but only ${FAN_PRESENTATION.length} fan positions. ` +
        "Add a position to FAN_PRESENTATION in components/sections/FannedDeck.tsx, " +
        "or reduce what /work passes.",
    );
  }

  const cards: Card[] = projects.map((project, index) => ({
    ...project,
    ...FAN_PRESENTATION[index],
  }));

  const middle = (cards.length - 1) / 2;

  /* ═══ THE PILE'S ARITHMETIC, IN FOUR LINES, WITH NO FUDGE CONSTANT ═══
     Card i rests at `y = i * BAND_H`. With card k open, every card BELOW it
     moves down by `H_k - BAND_H` and every card at or above it does not move
     at all. Card k+1's top is then `(k+1)B + H_k - B = kB + H_k`, which is
     exactly card k's bottom edge — flush, by construction. The box is card
     4's top plus one band, `4B + H_k`, for every k including k = 4.

     `Math.max` guards the frame before the observer has reported: an
     unmeasured card falls back to its band, which is the rest state, so the
     worst case is that nothing moves rather than that something jumps. */
  const activeIndex = active
    ? cards.findIndex((card) => card.slug === active.slug)
    : -1;
  const activeCardHeight = active
    ? Math.max(cardHeights[active.slug] ?? BAND_H, BAND_H)
    : BAND_H;
  const pileShift = activeCardHeight - BAND_H;
  const pileBoxHeight =
    activeIndex >= 0
      ? (cards.length - 1) * BAND_H + activeCardHeight
      : cards.length * BAND_H;

  const isAnyCardActive = () => {
    return active?.slug;
  };

  const isCurrentActive = (card: Card) => {
    return active?.slug === card.slug;
  };

  return (
    /* PHASE 1b - the only edited element of the vendor's own two wrappers.
       `h-full` (which resolved to `auto` against a block parent, i.e. to the
       inner wrapper's 480) is gone, replaced by a REAL, IN-FLOW block height on
       the cards' own spring, with a 480 floor; `items-center` is `items-start`
       so the inner never moves. `height` and not a transform, deliberately: the
       point is that the document below actually moves.

       THE BOX GROWS ON BOTH BRANCHES, FOR THE SAME REASON. At `lg`+ it is the
       two `DECK_H_*` constants; below `lg` it is `pileBoxHeight`, computed from
       `BAND_H` and the open card's measured height. Both are REAL in-flow block
       height on `BOX_GROW`, so Certifications, Experience, Currently Learning
       and the reveal footer are genuinely pushed down the document at every
       width. If those offsets were ever equal in the two states the pile would
       have been built the wrong way. */
    <motion.div
      animate={{
        height: isLg
          ? active
            ? DECK_H_ACTIVE_LG
            : DECK_H_REST
          : pileBoxHeight,
      }}
      transition={BOX_GROW}
      /* `min-h-[445px] lg:min-h-[570px]` — THE TWO FLOORS, AND EACH MUST TRACK
         ITS OWN CONSTANT: 570 is `DECK_H_REST` and 445 is `5 * BAND_H`. They
         are the height before hydration, when `animate` has not yet written an
         inline height; a stale floor paints a clipped deck for a frame and then
         jumps.

         `paddingTop` IS THE FAN'S TILT OVERFLOW AND THE PILE HAS NONE. 66px
         exists because a 15-degree card paints 52.3px above the box; nothing in
         the pile rotates, so below `lg` it is 0. Still an inline style rather
         than a `pt-[66px]` utility so the constant is the only place the number
         lives — Tailwind cannot see a computed class name.

         `justify-start lg:justify-center` — Rule S-1. The fan's centring is
         sanctioned because the fan FILLS its box; the pile does not, so it is
         left-anchored and the slack sits on the right. */
      style={{ paddingTop: isLg ? FAN_OFFSET_Y : 0 }}
      className="relative flex min-h-[445px] w-full items-start justify-start overflow-hidden lg:min-h-[570px] lg:justify-center"
    >
      {/* `max-w-[36rem]` (576) BELOW `lg` IS A READING MEASURE AND `max-w-5xl`
          AT `lg`+ IS THE FAN'S FOOTPRINT. `ProjectDeckSection.tsx` says the deck
          "deliberately declares no inner cap: unlike the gallery it is not a
          reading measure" — that is true of the fan and false of the pile,
          whose one-liner is set in 16px Space Grotesk across the whole card.
          At the cap the card's inner measure is 550px, about 68 characters.

          **IT IS AN ARBITRARY VALUE BECAUSE `max-w-xl` IS POISONED ON THIS
          SITE, AND THAT IS WORTH A LINE.** The design brief specified
          `max-w-xl` for Tailwind's `--container-xl` (36rem). `globals.css`
          declares `--spacing-xl: 55px`, and Tailwind v4 resolves `max-w-<name>`
          against the spacing namespace when a match exists there — verified in
          the emitted stylesheet, which compiled it to
          `max-width:var(--spacing-xl)`, a **55px** column. It does not error,
          it does not warn, and it renders. Every `max-w-*` name on the
          Fibonacci scale (xs…3xl) carries the same trap; `max-w-5xl` is safe
          only because there is no `--spacing-5xl`.

          `onClick` NOW GUARDS ON `event.target === event.currentTarget`, AND
          AT `lg`+ THAT IS THE BEHAVIOUR IT ALREADY HAD. Every click on a card
          at `lg`+ lands on the band's stretched pseudo-element, which calls
          `stopPropagation`, so the only clicks that ever reached this handler
          were clicks on this wrapper's own background. Below `lg` only the
          band is a target, so without the guard a tap on an open card's cover
          or one-liner would bubble to here and close the deck — "tap the
          screenshot to dismiss" is a gesture nobody has, and people tap images
          to enlarge them. Clicks outside this wrapper still close, through the
          document `mousedown` listener above. */}
      <motion.div
        ref={ref}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="relative flex h-120 w-full max-w-[36rem] items-center justify-center lg:mx-auto lg:max-w-5xl lg:[--height:400px] lg:[--width:300px]"
      >
        {cards.map((card, index) => {
          const offsetX = (index - middle) * CARD_SPACING;
          const isActive = isCurrentActive(card);
          const anyActive = Boolean(isAnyCardActive());
          /* The pile's whole layout, per card. See the arithmetic above. */
          const pileY =
            index * BAND_H +
            (activeIndex >= 0 && index > activeIndex ? pileShift : 0);
          const toggle = () => {
            if (isActive) close();
            else setActive(card);
          };
          return (
            <motion.div key={card.slug}>
              {/* ═══ THE CARD IS NO LONGER THE BUTTON — THE BAND IS ═══
                  (2026-08-28, Saad's ruling, and it closes a standing item.)

                  `role="button"` used to sit on this element with `Details`
                  nested inside it. That was valid HTML — a `<div role=button>`
                  may contain an `<a>` where a `<button>` may not — but ARIA
                  still says a `role="button"` should not contain focusable
                  descendants, and this file carried that as an open defect.
                  Moving the role down onto the band makes `Details` a SIBLING
                  of the button rather than a descendant, on **both** branches,
                  and the item is closed rather than mitigated.

                  **ONE THING AT `lg`+ DID CHANGE AND IT IS AN IMPROVEMENT:
                  THE ACCESSIBLE NAME.** The card was the `role="button"`, so
                  its name was computed from ALL of its text — the title, the
                  cover's `alt`, the one-liner and the word "Details", read as
                  one string on focus. The band is the button now, so the name
                  is the project's title and nothing else. This is the same
                  argument `ProjectCard` and `ProjectStripRow` both make for
                  wrapping the link around the title rather than the row, and
                  it is recorded here because it is a behaviour change at a
                  breakpoint that was otherwise meant to be untouched.

                  **POINTER BEHAVIOUR AT `lg`+ IS UNCHANGED, BY CONSTRUCTION.**
                  The band throws `lg:after:absolute lg:after:inset-0`, whose
                  containing block is this card (it is `position: absolute`),
                  so the pseudo-element is exactly the card's padding box — the
                  same rectangle the old `onClick` covered. The cover is
                  `pointer-events-none` so it cannot take the hit test off the
                  overlay, and `Details` carries `lg:relative lg:z-10` so the
                  overlay cannot take the hit test off IT. Both of those are
                  `ProjectStripRow.tsx`'s documented hazards, in both
                  directions, and neither is visible to `tsc`, ESLint, the build
                  or a screenshot.

                  **THE PANEL-SPLIT VERSION IS STILL THE REJECTED DESIGN.** It
                  is preserved on branch `deck-panel-split-backup` / tag
                  `deck-panel-split`. It moved the content OUT of the card into
                  a sibling region and cost the three things that ARE the
                  interaction: growth in place, the other four staying visible,
                  and one-click switching. Promoting `Details` out of the card
                  was named in this file as "the clean answer" to the ARIA item;
                  it is not what happened here. Nothing left the card. */}
              <motion.div
                ref={(node) => {
                  cardBoxRefs.current.set(card.slug, node);
                }}
                initial={{
                  x: 0,
                  scale: 0,
                }}
                /* ═══ TWO BRANCHES, ONE SUBTREE ═══
                   At `lg`+ this is the fan, unchanged to the digit: the rest
                   transforms, the 400px drop, the 0.4 collapse, the 0.2 rotate,
                   the 0.7 scale and `ACTIVE_SCALE` 1.15.

                   Below `lg` it is the PILE. The card does not rotate, does not
                   translate horizontally and **does not scale** — it is
                   revealed by growing downward out of its own band while the
                   cards in front of it move down. A full-width card cannot
                   scale: 5% of 318px is 16px and the box clips. The mount
                   entrance (`scale: 0` -> 1 on `SPRING`) reads in the new axis
                   as the five cards dealing themselves down.

                   ═══ `height` IS ON THE SAME CURVE AS `y`, AND THAT IS WHAT
                   KEEPS THE SEAM FLUSH ═══

                   A closed pile card is exactly `BAND_H` tall and clips its
                   own cover and body; an open one animates to its measured
                   full height. Card k's bottom is `k*B + h(t)` and card k+1's
                   top is `(k+1)*B + s(t)`, so they are flush iff
                   `h(t) = B + s(t)`. `h` runs `B -> H` and `s` runs `0 -> H-B`
                   on the SAME spring over the same duration, so both are the
                   same normalised progress times `H-B` and the identity holds
                   at **every frame, including the overshoot** — not just at
                   the endpoints. Give either one a different curve and a strip
                   of `bg-base` opens between the cards mid-transition.

                   IT IS A HEIGHT ANIMATION AND §4'S WARNING DOES NOT APPLY.
                   That warning is about the outer box, whose height changes
                   DOCUMENT FLOW and repaints every section below the deck.
                   This card is `position: absolute` inside a wrapper of fixed
                   height, so its height moves nothing but itself. The target
                   is a measured NUMBER and never `"auto"`. */
                animate={
                  isLg
                    ? {
                        y: isActive ? 0 : anyActive ? 400 : card.config.y,
                        x: isActive ? 0 : anyActive ? offsetX * 0.4 : offsetX,
                        rotate: isActive
                          ? 0
                          : anyActive
                            ? 0.2 * card.config.rotate
                            : card.config.rotate,
                        scale: isActive ? ACTIVE_SCALE : anyActive ? 0.7 : 1,
                      }
                    : {
                        y: pileY,
                        x: 0,
                        rotate: 0,
                        scale: 1,
                        height: isActive
                          ? Math.max(cardHeights[card.slug] ?? BAND_H, BAND_H)
                          : BAND_H,
                      }
                }
                /* GATED TO `lg`+ AND THAT IS NOT TIDINESS. Touch browsers
                   synthesise a hover on tap, so an ungated `whileHover` would
                   inflate a full-width pile card by 16px into the box's clip
                   edge on every single tap. */
                whileHover={
                  isLg
                    ? {
                        scale: isActive ? ACTIVE_SCALE : anyActive ? 0.7 : 1.05,
                      }
                    : undefined
                }
                /* Per-channel override: `scale` needs a far tighter rest
                   threshold than px values do — see `SCALE_REST_DELTA`. x, y
                   and rotate keep the default, where 0.01 is 0.01px / 0.01deg
                   and already invisible. It is kept on both branches: the pile
                   never animates `scale` after its entrance, so the override
                   has nothing to apply to there, and deleting it would take the
                   frame trace with it. */
                transition={{
                  ...cardSpring,
                  scale: { ...cardSpring, restDelta: SCALE_REST_DELTA },
                }}
                /* ═══ THE BOX, PER BRANCH ═══
                   At `lg`+: `top: 50%` with a negative half-margin, so all five
                   are centred on the inner wrapper's 240px midpoint — the whole
                   reason that wrapper can never grow. `--width` / `--height`
                   are `lg:`-only custom properties now; the `[--height:300px]
                   [--width:220px]` base pair was the 220x300 card and is
                   deleted.

                   Below `lg`: `top: 0` with no margin and a full-column width,
                   so a card's own `y` IS its offset in the pile. **The height
                   is MOTION'S ALONE on this branch and React must not write
                   it** — it is in `animate` above, because it has to travel on
                   the cards' own spring, and `undefined` here is deliberate.
                   A `height` in this object would be re-written into the style
                   attribute on every render of this component, and any render
                   on which Motion did not happen to re-apply its own value
                   would collapse an OPEN card back to its band. The
                   pre-Motion resting height comes from `max-lg:h-[89px]` in
                   the class list instead, where an inline value always
                   out-ranks it and there is nothing to fight.

                   **THAT CLASS DOES NOT REACH THE PRERENDERED HTML, AND THIS
                   NOTE CLAIMED IT DID UNTIL 2026-08-28.** `isLg` is seeded
                   `true`, so `work.html` ships `style="…height:var(--height)"`
                   on every card; below `lg` nothing declares `--height`, the
                   declaration is invalid at computed-value time, and `height`
                   computes to `auto` — but the DECLARATION still wins the
                   cascade, so the class never applies. A phone with JavaScript
                   off therefore gets five auto-height cards at `scale(0)`,
                   which is the same nothing it got before. The class governs
                   from the FIRST CLIENT PAINT, which is what it is for: the
                   layout effect resolves `isLg` false before that paint, the
                   inline height goes away with it, and Motion reads 89 rather
                   than a natural height it would then have to collapse.

                   THE 4px-HEADROOM ITEM IS STILL CLOSED. The card's CONTENT is
                   unconstrained below `lg` — no fixed box for it to overflow —
                   and the height above is measured FROM that content rather
                   than imposed on it.

                   NO `z-50` ON THE OPEN CARD BELOW `lg`. `config.zIndex` is
                   already 2,3,4,5,6 — index order — so the natural stacking
                   does every bit of the pile's occlusion, and a card lifted to
                   50 would paint over the cards sliding out from under it. */
                style={{
                  width: isLg ? `var(--width)` : "100%",
                  height: isLg ? `var(--height)` : undefined,
                  marginLeft: isLg ? `calc(var(--width) / -2)` : 0,
                  marginTop: isLg ? `calc(var(--height) / -2)` : 0,
                  zIndex: isLg && isActive ? 50 : card.config.zIndex,
                  /* ═══ `will-change: transform` IS A MEASURED FIX, NOT A
                     SUPERSTITION ═══
                     Motion drives these transforms by writing inline style on
                     every frame. That is NOT a CSS animation, so Chrome does
                     not promote the element for it, and each frame the card —
                     screenshot and all — was re-rastered on the main thread.
                     Profiled on the production build, CPU throttled 6x, across
                     one expand/collapse cycle:

                       RasterTask   1824 calls, 232.0ms   ->   627 calls, 45.9ms

                     an 80% cut. Paint for the four DROPPED cards fell to
                     2.7-4.8ms each, from being part of the root document's
                     repaint. The cost is five permanent compositor layers,
                     which on this page is the only heavy thing on screen.
                     CHECKED FOR THE OBVIOUS REGRESSION: a promoted layer
                     scaled to `ACTIVE_SCALE` can render blurry until it is
                     re-rastered. Captured the settled active card's title at
                     7x — the type is crisp. */
                  willChange: "transform",
                }}
                /* ═══ THE CHILD ORDER, AND THE ONE UTILITY THAT FLIPS IT ═══
                   The DOM is [title][cover][body] at every width. Below `lg`
                   that is also the painted order, top-anchored: band, cover,
                   one-liner, `Details`.

                   At `lg`+ the cover takes `lg:order-first lg:mb-auto`, which
                   reproduces the old `justify-between` exactly — cover pinned
                   to the top, title and body bottom-anchored as one group, so
                   the body's growth still lifts the TITLE and nothing else.
                   That mechanism is untouched: the cover is still fixed-aspect
                   and `shrink-0`, so the only thing that moves is the title,
                   deliberately, on the card's own spring. `justify-between`
                   itself is gone because it distributes free space between
                   EVERY pair, and there are three children now; `mb-auto`
                   absorbs it in one place instead.

                   Moving the `<h2>` ahead of the cover in the DOM is also a
                   small win on both branches: the title is announced before the
                   cover's alt text, which is the order `ProjectStripRow.tsx`
                   deliberately keeps.

                   `p-xs lg:p-sm` IS NOW `p-sm`. The 8px base half was the
                   220x300 card's; 13 was already the `lg:` value and it is the
                   margin around the photo Saad asked for.

                   `max-lg:h-[89px]` IS `BAND_H` AND MUST TRACK IT, the same
                   way `min-h-[445px]` on the box tracks `5 * BAND_H`. It is
                   the height a closed pile card has before Motion takes the
                   property over — the value the prerendered markup and the
                   first client frame paint — and Motion's inline value
                   out-ranks it from then on. A class rather than an inline
                   style precisely BECAUSE it must lose to Motion; the
                   `FAN_OFFSET_Y` rule about keeping a constant in one place
                   is what the comment is for.

                   THE FOCUS RING AT `lg`+ IS DRAWN HERE, ON THE CARD, VIA
                   `:has()` — and it has to be. The operable element is the
                   band, but the operable REGION at `lg`+ is the whole card, so
                   an `outline-offset-4` ring around the band would be a WCAG
                   2.4.11 mismatch: a ring around the title inside a 300x400
                   target. `has-[[role=button]:focus-visible]` puts the
                   indicator back on the same rectangle as the hit area, which
                   is what `ProjectCard` and `ProjectStripRow` both do with
                   `has-[a:focus-visible]`. Drawn 4px OUTSIDE the card, on
                   `bg-base`, because `accent-working` is 2.36:1 on ClashChat's
                   face and `globals.css` bans teal controls on the deck faces
                   by name.

                   **THIS RING IS NEWLY VISIBLE AND THE OLD ONE WAS DEAD.** The
                   card carried `outline-none focus-visible:outline-2 …` — and
                   in Tailwind v4 `outline-none` sets `--tw-outline-style: none`
                   on the element unconditionally, while `outline-2` resolves
                   `outline-style: var(--tw-outline-style)`. The two were on the
                   same element, so the ring computed to `outline-style: none`
                   and never painted. Verified in the emitted stylesheet, not
                   assumed. The rebuild puts the ring on an element that carries
                   no `outline-none`, so it paints. It is the one thing at
                   `lg`+ this pass changes on purpose. */
                className={cn(
                  "absolute top-0 left-0 flex flex-col overflow-hidden rounded-deck p-sm text-fg max-lg:h-[89px] lg:top-1/2 lg:left-1/2 lg:has-[[role=button]:focus-visible]:outline-2 lg:has-[[role=button]:focus-visible]:outline-offset-4 lg:has-[[role=button]:focus-visible]:outline-accent-working",
                  card.surface,
                )}
              >
                {/* ═══ THE BAND — THE OPERABLE ELEMENT ON BOTH BRANCHES ═══

                    BELOW `lg` IT IS THE WHOLE INTERACTION. Every card shows its
                    top `BAND_H` (89px) and nothing else, so what a visitor sees
                    at rest is five full-width bands, each carrying its own
                    title, each a permanent one-tap target. That is the fix for
                    the title overlap and it is STRUCTURAL rather than tuned:
                    the edge that ends a card is now horizontal and below the
                    title's box — the card's own bottom edge, at `BAND_H` —
                    so the title's measure is the card's full width (292px at
                    360, 550 at the cap) instead of the shrunken fan's 70px
                    sliver. There is no card to the right of any card, and
                    since 2026-08-28 there is nothing above any card either:
                    the band is what the card IS while closed, not the part of
                    it a neighbour left showing.

                    THE HEIGHT IS `BAND_TITLE_H`, INLINE, AND ONLY BELOW `lg`.
                    At `lg`+ the band is a plain block whose height is the
                    title's own line count — which is what lets the title sit ON
                    the card's bottom edge at rest — so the inline height is
                    `undefined` there rather than overridden, because a class
                    cannot override an inline style.

                    THE RING BELOW `lg` IS 2px INSET, IN `--color-fg`, AND IT IS
                    THE SITE'S SECOND FOCUS-RING TREATMENT. Scoped to this
                    component and this breakpoint band, and stated here the way
                    the two radius tokens are. An OUTSET ring is occluded on
                    three sides in a pile — its bottom edge is under the next
                    card and there is no bleed room at the sides inside an
                    `overflow-hidden` box — which is the exact defect
                    `ProjectStripRow.tsx` used `-outline-offset-2` to avoid. And
                    an inset TEAL ring lands on the card face, where it is
                    2.36:1 on ClashChat and fails 1.4.11's 3:1 floor on two of
                    the five. `--color-fg` runs 5.02 to 14.89:1 in dark and
                    14.71 to 16.03 in light against these faces — every one
                    clears 3:1 with room, and the ink and the ring are then the
                    same colour.

                    `max-lg:` AND `lg:` RATHER THAN A RULE THAT UNDOES ANOTHER.
                    The two are mutually exclusive media queries, so there is no
                    cascade argument to win and no dependence on the order the
                    compiler happens to sort variants in — the trap
                    `ProjectStripRow.tsx` records against `motion-reduce:`
                    undos. `lg:outline-none` is what suppresses the UA ring on
                    the band at `lg`+, where the card draws the real one.

                    **THERE IS NO BARE `outline-none` HERE AND THERE MUST NEVER
                    BE ONE**, which looks like an omission and is the opposite.
                    In Tailwind v4 `outline-none` sets `--tw-outline-style: none`
                    on the element unconditionally, and every `outline-<width>`
                    utility resolves `outline-style: var(--tw-outline-style)` —
                    so an `outline-none` on this element would silently compute
                    the ring below to `outline-style: none` and paint nothing.
                    That is exactly how the card's own ring was dead from Phase
                    1 until 2026-08-28. `lg:outline-none` is safe because it is
                    inside the `lg` media query, where this element draws no ring
                    of its own. Nothing reports this: it type-checks, it lints,
                    it builds, and only a keyboard user in a browser sees it.

                    `lg:after:absolute lg:after:inset-0` IS THE WHOLE-CARD HIT
                    AREA. See the card's docblock above for why it lands exactly
                    on the old click target, and `Details`' for the z-order that
                    keeps it off the link. */}
                <div
                  ref={(node) => {
                    bandRefs.current.set(card.slug, node);
                  }}
                  role="button"
                  /* THE TABBABILITY GATE, AND IT IS FAN-ONLY.

                     AT `lg`+ an inactive card is thrown 400px down the box at
                     `scale: 0.7` behind the open one. It is still a real,
                     clickable target — that is what one-click switching needs —
                     but it should not be the next thing Tab lands on, so `-1`
                     keeps it clickable and programmatically focusable while
                     taking it out of the tab order. NOT `inert` and NOT
                     `pointer-events-none`: both would kill the click, and the
                     click is the feature.

                     **BELOW `lg` THE GATE MUST NOT APPLY, AND IT DID UNTIL
                     2026-08-28.** The premise above is a property of the FAN:
                     a dropped card is small, behind another card and hard to
                     aim at. A pile band is none of those things — it stays
                     exactly where it was, full width, 89px tall, in plain
                     sight, with its title legible. Taking it out of the tab
                     order meant a keyboard user had to CLOSE the open card
                     before they could reach another one, while a pointer user
                     switched in a single tap. This file claims "switching is
                     ONE tap — every band is live in every state" at the top;
                     `isLg &&` is what makes that true for the keyboard too. */
                  tabIndex={isLg && anyActive && !isActive ? -1 : 0}
                  aria-expanded={isActive}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                  /* The two keys `<button>` would have handled. `preventDefault`
                     on Space stops the page scrolling. The `e.target !==
                     e.currentTarget` guard that used to sit here is gone with
                     the reason for it: `Details` is no longer a descendant of
                     this element, so an Enter on the link cannot bubble through
                     it and toggle the card shut on the way out. */
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    e.stopPropagation();
                    toggle();
                  }}
                  style={{ height: isLg ? undefined : BAND_TITLE_H }}
                  className="flex shrink-0 cursor-pointer items-center max-lg:focus-visible:outline-2 max-lg:focus-visible:-outline-offset-2 max-lg:focus-visible:outline-fg lg:block lg:outline-none lg:after:absolute lg:after:inset-0"
                >
                  {/* ═══ THE TITLE ═══
                      **NO `min-h` RESERVATION ANY MORE.** It had one until
                      Phase 3, sized to three lines, to keep the description
                      starting at the same height on all five cards — and it
                      left ~50px of empty card under one-line titles.
                      Bottom-anchoring at `lg`+ makes it unnecessary AND gives a
                      better constant: `Details` is now always the same distance
                      off the card's bottom edge, on every card, in both states.

                      `lg:max-w-[167px]` IS THE FIX FOR THE CLIPPED TITLES AT
                      `lg`+. `CARD_SPACING` is 180, so every card but the last
                      shows a 180px strip before the next one paints over it —
                      167px of measure after the 13px `lg:p-sm`. Re-verified
                      after the title moved to the bottom of the card: the
                      covering card's left edge is a SLANTED line, because the
                      fan tilts and vertically offsets every card, so clearance
                      is a function of y. Measured on the painted line boxes at
                      the new position, all five are clear at rest.

                      **BELOW `lg` THE CAP IS ABSENT AND THE SIZE IS `text-h4`,
                      NOT `text-body`.** The 16px base half existed because a
                      three-line title at 21px cost 20.6px the 220x300 card's
                      height budget did not have. There is no such budget now —
                      the card is `height: auto` — and `text-h4` resolves to its
                      own 21px floor at 360, so two lines is 50.4px inside an
                      89px band with 25.6px of clear air. The cap is absent for
                      the opposite reason it used to be: not because 70px cannot
                      hold a word, but because the title has the whole card. */}
                  <h2 className="text-left text-h4 lg:max-w-[167px] lg:text-deck-title">
                    {card.title}
                  </h2>
                </div>

                {/* ═══ THE COVER — INSET, WITH ITS OWN CORNERS ═══
                    It sits inside the card's `p-sm`, so there is a margin on all
                    four sides, and it carries `rounded-deck` itself because it
                    no longer reaches the card's own corners to be clipped by
                    them. **This is the third revision of this box and each one
                    was Saad's call on sight:** framed and inset (Phase 3, read
                    as "chopped"), full-bleed to three edges (the revision, no
                    margin at all), and now inset again with a radius of its own.

                    **ONE ASPECT AT EVERY WIDTH NOW: `16/9`.** `aspect-[5/2]`
                    was the below-`lg` box and it is deleted with the 220x300
                    card. It was also the one place the deck had TWO silhouette
                    behaviours — 2.5 sits inside the sources' range, so SNA
                    (1.966) pillarboxed there while the other four letterboxed.
                    Every source is wider than 1.778, so at 16/9 all five
                    letterbox at every breakpoint and the deck finally has one
                    silhouette. The bars are still the card's own face, because
                    the box declares no background. Measured bars against the
                    1.778 box: FOLIO 13.1px, Aero-Grid 12.7, ClashChat 12.7,
                    CCN 25.5 (the worst), SNA 7.6.

                    **`border-fg/25` IS BACK BELOW `lg` ONLY, ON SAAD'S CALL
                    (2026-08-28), AND `globals.css`'S "DO NOT ADD A BORDER BACK"
                    IS NOT BEING VIOLATED.** That line is about the CARD's
                    border — `border-accent-working/30`, the teal interactive
                    family, removed because a WCAG ratio was measuring the wrong
                    thing on near-isoluminant faces. This is the neutral
                    IMAGE-FRAME family (`CvAction`, `CoverFrame`, the same
                    `border-fg/25` hairline), on the cover box, and it is here
                    because the pile paints FOLIO's cover at 292-550px instead
                    of 204 and `#F5EFEB` against that screenshot's own cream
                    page background has no edge at all in light mode. `lg:border-0`
                    keeps the desktop card's borderless silhouette exactly as it
                    is; the FOLIO edge remains open at `lg`+.

                    `pointer-events-none` RATHER THAN `after:z-10` ON THE BAND.
                    Both would work — the band is not a stacking context — but
                    this one states the intent (the image is decoration, it is
                    never interactive) and does not touch paint order, so it
                    cannot be undone by a future z-index. Without it the cover,
                    which is `relative` and later in DOM order than the band,
                    paints above the band's stretched pseudo-element and takes
                    the hit test off it: at `lg`+ the top half of every card
                    would silently stop being clickable.
                    `ProjectStripRow.tsx` carries the same fix for the same
                    failure.

                    **IT IS UNSCOPED, SO IT IS NEW BEHAVIOUR AT `lg`+ TOO, AND
                    THAT IS DECLARED RATHER THAN OVERLOOKED.** The image is no
                    longer a hit target at any width: it cannot be dragged out,
                    long-pressed, or right-clicked for "Save image as" — the
                    context menu opens on whatever is beneath it, which is the
                    band's overlay. Nothing else about the card changed. It is
                    NOT scoped `lg:pointer-events-none`, because below `lg` the
                    same property is doing a second job: the band is the only
                    tap target there, and a tap that lands on the cover has to
                    fall through rather than be swallowed. The cost is the one
                    `ProjectStripRow.tsx` accepted for its own cover, and the
                    covers are decorative duplicates of assets that are on the
                    project's own detail page one tap away. */}
                <div className="pointer-events-none relative mt-sm aspect-[16/9] w-full shrink-0 overflow-hidden rounded-deck border border-fg/25 lg:order-first lg:mt-0 lg:mb-auto lg:border-0">
                  <Image
                    src={card.coverImage.src}
                    alt={card.coverImage.alt}
                    fill
                    /* RE-DERIVED IN THE SAME COMMIT AS THE BOX, because a stale
                       `sizes` ships the wrong candidate and nothing reports it —
                       `ProjectStripRow.tsx` records that bug shipping for a day.
                       The `lg` clause is untouched (300 painted at
                       `ACTIVE_SCALE` 1.15 = 345, declared 315). Below `lg` the
                       painted width is the column less the card's 26px of
                       padding: `100vw - 42 - 26` under 640, and the 576px cap
                       less 26 = 550 above it. */
                    sizes="(min-width: 1024px) 315px, (min-width: 640px) 550px, calc(100vw - 68px)"
                    placeholder="blur"
                    quality={85}
                    className="object-contain"
                    /* `next/image` reads `objectFit` from the prop or from
                       `style`, never from `className`; with both absent the
                       blur placeholder falls through to `background-size:
                       cover` and the plate crops while the loaded image
                       letterboxes. `ProjectStripRow.tsx` has the diagnosis. */
                    style={{ objectFit: "contain" }}
                  />
                </div>

                {/* ═══ THE CONTENT THAT PUSHES THE TITLE UP ═══
                    At `lg`+ its height animates 0 -> a MEASURED pixel value on
                    the card's own spring, and because the title and this block
                    are bottom-anchored as one group that growth lifts the title.
                    One motion, not two. Below `lg` this box does not animate
                    its height at all: it holds its natural size and the CARD
                    grows out of its band to reveal it, on the same spring the
                    displaced cards travel on. What it does animate on both
                    branches is `opacity`, which is the guard that makes a
                    closed body unpaintable wherever it sits in the stack.
                    `CardExpandedBody`'s docblock carries the trace of what
                    `height: "auto"` did here instead, and why the number is
                    measured rather than named — at both breakpoints. */}
                <CardExpandedBody
                  card={card}
                  isActive={isActive}
                  isLg={isLg}
                  grow={BODY_GROW}
                  onMeasure={handleBodyMeasure}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default FannedDeck;
