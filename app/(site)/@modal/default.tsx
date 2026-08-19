/**
 * The `@modal` slot's default — Ticket 6b.
 *
 * MANDATORY, NOT OPTIONAL. On any navigation where the interception does not
 * match — a hard load of `/`, a hard load or refresh of `/projects/<slug>`,
 * a 404, or a client navigation back to `/` — Next has to render *something*
 * for the slot. With no `default.tsx` it cannot recover the slot's state and
 * the route errors outright. Returning `null` is what makes the slot invisible
 * on every path except the intercepted one.
 *
 * IT MUST RETURN `null`, NOT AN EMPTY FRAGMENT AND NOT AN EMPTY ELEMENT. This
 * renders on every route under `(site)`, so anything with a DOM footprint —
 * even a `<div>` with no classes — would ship on the homepage and on all five
 * detail pages to represent an overlay that is not open.
 */
export default function ModalSlotDefault() {
  return null;
}
