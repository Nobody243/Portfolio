/**
 * Contact links — Ticket 10.
 *
 * EDIT THIS FILE to add, change or remove a link. Nothing about the Contact
 * section's layout lives here, and no styling may: see the hard rules in
 * ./types.ts. The heading and the closing line are copy and live in
 * components/sections/contactContent.ts.
 *
 * ARRAY ORDER IS DISPLAY ORDER. There is no sort, no filter and no reverse in
 * the consumer — reading this array top to bottom tells you what the page
 * renders. Email is first because it is the action the section exists for.
 *
 * TWO ENTRIES IS NOT A SPECIAL CASE, AND NEITHER IS THREE. `Contact.tsx` reads
 * no `.length` at all: the list is a flex column that becomes a wrapping row at
 * ≥640px, so n = 1, n = 2 and n = 4 are one code path with no layout that
 * balances only at a particular count. Adding a link is an edit to this file
 * and nothing else. That discipline is the same one shipped four times already
 * — screenshots at 0/1/n, Skills' empty group, Experience's single-entry map,
 * and In Progress returning null at zero.
 *
 * LINKEDIN IS DELIBERATELY ABSENT. Saad has not supplied the URL. An absent
 * link is an ABSENT ENTRY — never `href: "#"`, never `href: ""`, never a
 * guessed profile URL, and never a disabled-looking item. ./types.ts states
 * that rule and CLAUDE.md forbids placeholder social links by name, citing the
 * old my-portfolio-ten-ruddy-35 site's fake socials as the thing this build
 * exists not to repeat. When the real URL arrives, add four lines below.
 *
 * BOTH ENTRIES WERE VERIFIED 2026-08-19 (.claude/handoff/ticket-10-content.md):
 *   - saaddev.top has live MX records, so mail is deliverable. It has NO
 *     A/AAAA record — there is no website behind it. NEVER LINK THE BARE
 *     DOMAIN. It appears only inside the address string.
 *   - https://github.com/Nobody243 returned HTTP 200 with no redirect, so this
 *     is the canonical URL.
 *
 * No Twitter/X, Instagram, Dribbble or Behance: docs/04 Ticket 10 says real
 * links only. No CV link either — there is no resume PDF yet, and that is
 * Ticket 15.
 */

import type { ContactLink } from "./types";

export const contact: readonly ContactLink[] = [
  {
    label: "Email",
    // The visible string is the address itself, deliberately. If the mailto:
    // opens nothing on the visitor's machine, the worst case is that they
    // select sixteen characters that are already on screen — which is why the
    // section ships no copy-to-clipboard button.
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
];
