"use client";

/**
 * "Is there a hero stage on this route?" — asked of the DOM, once, in one
 * place.
 *
 * IT IS DELIBERATELY NOT A PATHNAME CHECK, and `docs/06_INTRO_AND_CHROME.md`
 * §6's Phase 2 amendment records why: with a project overlay open the pathname
 * is `/projects/<slug>` while Home — hero included — is still mounted BEHIND
 * the dialog, so a pathname check answers the question wrong in exactly the
 * case that matters. `Navbar.tsx` already made this call for its palette
 * ("`pathname` says when to re-check; `getElementById` says what is actually on
 * the page") and this function is that same read, extracted rather than
 * duplicated when the Intro needed the same answer to choose between its two
 * exits.
 *
 * DO NOT ADD A SECOND PREDICATE THAT CAN DISAGREE WITH THIS ONE. Two consumers
 * asking the same question two ways is how the navbar ends up on the hero
 * palette while the Intro plays the heroless seam.
 *
 * RETURNS THE ELEMENT, NOT A BOOLEAN, because `Navbar` needs the element to
 * build a ScrollTrigger against it and the Intro needs only its presence. One
 * return type serves both; a boolean would have forced the navbar to read the
 * DOM again.
 *
 * IT MUST BE CALLED FROM AN EFFECT OR A HANDLER, NEVER DURING RENDER. On the
 * server there is no document, and during hydration a render-time DOM read is
 * how a server/client mismatch is manufactured. Both call sites obey this: the
 * navbar reads it inside its palette effect, the Intro inside its timeline
 * effect.
 */

import { HERO_SECTION_ID } from "@/components/hero/heroContent";

export function getHeroStage(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(HERO_SECTION_ID);
}

export default getHeroStage;
