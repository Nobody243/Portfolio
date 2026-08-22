/**
 * Contact links — Ticket 10.
 *
 * EDIT THIS FILE to add, change or remove a link. Nothing about the Contact
 * section's layout lives here, and no styling may: see the hard rules in
 * ./types.ts. The heading and the closing line are copy and live in
 * components/sections/contactContent.ts.
 *
 * THE CONSUMER IS `components/sections/RevealFooter.tsx`. Every reference in
 * this file used to name `Contact.tsx`, which was absorbed into the reveal
 * footer in Phase 5 and no longer exists — the links, the array-order
 * contract and the no-`.length` property all moved with it intact.
 *
 * ARRAY ORDER IS DISPLAY ORDER. There is no sort, no filter and no reverse in
 * the consumer — reading this array top to bottom tells you what the page
 * renders. Email is first because it is the action the section exists for.
 *
 * TWO ENTRIES IS NOT A SPECIAL CASE, AND NEITHER IS THREE. The consumer reads
 * no `.length` at all: the list is a flex column that becomes a wrapping row at
 * ≥640px, so n = 1, n = 2 and n = 4 are one code path with no layout that
 * balances only at a particular count. Adding a link is an edit to this file
 * and nothing else. That discipline is the same one shipped four times already
 * — screenshots at 0/1/n, Skills' empty group, Experience's single-entry map,
 * and In Progress returning null at zero.
 *
 * LINKEDIN ARRIVED 2026-08-19 and was added as a third entry — four lines, no
 * layout change, no code change, exactly as the paragraph above predicted. It
 * was absent rather than stubbed for the two hours it was unknown: an absent
 * link is an ABSENT ENTRY — never `href: "#"`, never `href: ""`, never a
 * guessed profile URL, never a disabled-looking item. ./types.ts states that
 * rule and CLAUDE.md forbids placeholder social links by name, citing the old
 * my-portfolio-ten-ruddy-35 site's fake socials as the thing this build exists
 * not to repeat. Keep that standard for the next one.
 *
 * BOTH ENTRIES WERE VERIFIED 2026-08-19 (.claude/handoff/ticket-10-content.md):
 *   - saaddev.top has live MX records, so mail is deliverable. It has NO
 *     A/AAAA record — there is no website behind it. NEVER LINK THE BARE
 *     DOMAIN. It appears only inside the address string.
 *   - https://github.com/Nobody243 returned HTTP 200 with no redirect, so this
 *     is the canonical URL.
 *   - LinkedIn COULD NOT BE MACHINE-VERIFIED and that is expected: LinkedIn
 *     answers automated requests with HTTP 999, an anti-bot code, not a 404.
 *     It is therefore neither evidence the profile exists nor evidence it does
 *     not. The trailing-slash form Saad supplied 301s to the slash-less URL
 *     stored below, which is the canonical one and avoids a redirect hop on
 *     every click. THIS IS THE ONE LINK ON THE SITE NOTHING HERE CAN CHECK —
 *     open it in a browser once before launch. A typo in the vanity slug would
 *     produce a plausible-looking dead link. Logged as a Ticket 13 check.
 *
 * No Twitter/X, Instagram, Dribbble or Behance: docs/04 Ticket 10 says real
 * links only.
 *
 * NO CV LINK HERE, AND THE REASON CHANGED. This paragraph used to end "No CV
 * link either — there is no resume PDF yet, and that is Ticket 15." Ticket 15
 * shipped: `public/resume/Muhammad_Saad_CV.pdf` is committed and `/about`
 * renders a "View CV" control for it (`components/about/aboutPageContent.ts`).
 * The CV stays out of THIS array anyway, on different grounds — these entries
 * are addressable identities the visitor can reach Saad at, all rendered by
 * one loop as label + value + href, and a PDF preview is a document with its
 * own modal-or-new-tab behaviour. Adding it here would make the loop branch on
 * a fourth `kind`, which is the special-casing the paragraph above rejects.
 */

import type { ContactLink } from "./types";

export const contact: readonly ContactLink[] = [
  {
    label: "Email",
    // The visible string is the address itself, deliberately: if the mailto:
    // opens nothing on the visitor's machine, the worst case is that they
    // select sixteen characters that are already on screen.
    //
    // THAT SENTENCE USED TO END "— which is why the section ships no
    // copy-to-clipboard button." It ships one. `RevealFooter.tsx` renders
    // `CopyEmailButton` for `kind: "email"`, and the navbar renders a second
    // copy control from the same entry. The visible-address property above is
    // still exactly why the button is SAFE to add — it degrades to selectable
    // text pre-hydration and with the Clipboard API unavailable — but it is no
    // longer an argument against the control, and it must not be read as one.
    value: "saad@saaddev.top",
    href: "mailto:saad@saaddev.top",
    kind: "email",
  },
  {
    label: "GitHub",
    value: "github.com/Nobody243",
    href: "https://github.com/Nobody243",
    kind: "web",
  },
  {
    label: "LinkedIn",
    // Stored without the trailing slash Saad supplied: that form 301s here.
    value: "linkedin.com/in/muhammad-saad-2911702a3",
    href: "https://www.linkedin.com/in/muhammad-saad-2911702a3",
    kind: "web",
  },
];
