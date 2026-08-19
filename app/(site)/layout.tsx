/**
 * The `(site)` layout — Ticket 6b. It exists for exactly one reason.
 *
 * A PARALLEL ROUTE SLOT IS DELIVERED AS A PROP TO THE LAYOUT AT ITS OWN LEVEL.
 * `app/(site)/@modal/` is that slot, and without this file there is nothing to
 * receive it. Before 6b there was no `app/(site)/layout.tsx` at all — the
 * detail route's header used to say so in as many words — and creating one is
 * unavoidable rather than a design choice.
 *
 * IT RENDERS NO DOM ELEMENT, NO CLASSNAME, AND NO PROVIDER, AND IT MUST NOT
 * GROW ANY. Every route under `(site)` — `/` and all five `/projects/<slug>`
 * pages — passes through here, so a wrapper `<div>` would silently change the
 * DOM of the entire site to hold a slot, and a `flex`/`min-h` class here would
 * fight `<body className="flex min-h-full flex-col">` in `app/layout.tsx`,
 * which is where site-wide structure lives. A fragment is the whole component.
 *
 * NO "use client". `{modal}` is an RSC slot; making this a client component
 * would pull every page under `(site)` behind a client boundary.
 *
 * `(site)` IS A ROUTE GROUP AND CONTRIBUTES NO URL SEGMENT, so this layout and
 * the `@modal` slot beside it both sit at segment level `/`. That is what lets
 * `@modal/(.)projects/[slug]` intercept `/projects/[slug]`: `(.)` means "the
 * same level as me".
 *
 * `{modal}` RENDERS AFTER `{children}` deliberately. On a normal visit the slot
 * resolves to `@modal/default.tsx`, which returns `null`, so this is a fragment
 * around one child and the output is unchanged. When the interception matches,
 * the overlay mounts after the page — and it is a modal `<dialog>` in the top
 * layer, so paint order is decided by the top layer rather than by document
 * order anyway. DOM order still matters for the accessibility tree, and "after
 * the page content" is the correct place for it.
 */
export default function SiteLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
