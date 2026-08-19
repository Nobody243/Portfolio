/**
 * Shared metadata constants. Ticket 17.
 *
 * WHY THIS FILE EXISTS RATHER THAN `app/opengraph-image.png`. Next's
 * file-convention OG image is the idiomatic approach and it was tried first.
 * It is inherited only by routes that do NOT declare an `openGraph` object of
 * their own — and `/projects/[slug]` declares one, because its title,
 * description, type and canonical are all per-project. The measured result was
 * that the five project detail pages, the most shareable URLs on the site,
 * emitted no `og:image` at all while `/` and `not-found` looked perfect. The
 * build was green and the homepage preview was correct, so nothing surfaced it
 * except reading the generated HTML.
 *
 * `openGraph` is resolved per segment and is NOT deep-merged into the parent's.
 * So the rule here is: any page that declares `openGraph` must spread
 * `OG_IMAGE` into it. That is a rule a person can follow and a reviewer can
 * check, which the silent inheritance was not.
 */

/**
 * A real screenshot of the settled hero on the live site, dark mode, captured
 * at 1200x630 with a 2x device pixel ratio.
 *
 * NOT a designed card and not a composite. `ticket-3-design.md` §17.4 asked for
 * "a still frame of this hero", and §7.2's neutral fill light plus §8's
 * "legible silhouette at zero motion" acceptance test exist precisely so that
 * frame is publishable without retouching. The only alteration is the theme
 * toggle, hidden for the capture because it is site chrome rather than hero
 * content. Nothing was added, brightened or invented — the acceptance criterion
 * for this ticket forbids showing content that is not really on the site.
 *
 * Regenerate by rescreenshotting, never by editing: if the hero changes, this
 * asset is stale, and a preview card that no longer matches the page is worse
 * than a plain one.
 */
export const OG_IMAGE = {
  url: "/og-hero.png",
  width: 2400,
  height: 1260,
  alt: 'The site\'s hero: the name SAAD as extruded 3D type lit by a cyan rim, over a dark particle field, above the line "Engineer building toward cybersecurity & cloud."',
} as const;
