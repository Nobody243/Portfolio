import { Navbar } from "@/components/ui/Navbar";

/**
 * The `(chrome)` layout — the navbar, and nothing else.
 *
 * IT EXISTS BECAUSE THE NAVBAR IS NO LONGER A ONE-PAGE COMPONENT.
 * `docs/06_INTRO_AND_CHROME.md` §4 used to say the bar renders "on `/` and only
 * on `/`", and while the site was one page that was correct. It is not any
 * more: the centre cluster's WORK entry is a route link now, and a bar whose
 * entries point at pages it does not itself appear on is unusable. §4 is
 * amended in the same commit that made it false.
 *
 * A NESTED ROUTE GROUP, NOT A MOVE INTO `app/(site)/layout.tsx`. All three of
 * §4's reasons for keeping the bar out of the `(site)` layout still stand, and
 * all three are about `/projects/<slug>`:
 *
 *   1. `ProjectDetailFrame` already owns that top strip, with a back link and a
 *      theme toggle. Two fixed bars in the same 64px collide.
 *   2. Detail pages are Tier 3. A transparent bar carrying a Tier 1 mark is the
 *      wrong register for the surface where recruiters evaluate substance.
 *   3. `app/(site)/layout.tsx` states in its own header that it must render no
 *      DOM element and no wrapper, because every route on the site passes
 *      through it.
 *
 * `(chrome)` gets the bar onto the content routes without touching any of that.
 * `projects/[slug]` stays OUTSIDE this group, so it still gets no navbar.
 *
 * ROUTE GROUPS CONTRIBUTE NO URL SEGMENT, so this changes no URL and — this is
 * the part that matters — it does not move `page.tsx` or `work/page.tsx` off
 * segment level `/`. `app/(site)/@modal/(.)projects/[slug]` intercepts at that
 * same level, so interception is unaffected. It is nonetheless the kind of
 * routing subtlety that fails silently rather than at build time: TEST IT BY
 * CLICKING A CARD, never by typing the URL, because a typed URL is a hard load
 * which by design never intercepts and therefore proves nothing.
 *
 * IF INTERCEPTION EVER STOPS FIRING, the fallback is to delete this file and
 * mount `<Navbar />` in each page instead — three JSX lines, zero routing risk.
 *
 * IT RENDERS NO DOM ELEMENT OF ITS OWN, deliberately, and must not grow one.
 * A fragment keeps `<header>`'s nearest ancestor as `<body>`, which is what
 * makes it the `banner` landmark; a wrapper `<div>` here would also fight
 * `<body className="flex min-h-full flex-col">` in `app/layout.tsx`, exactly as
 * the `(site)` layout's header warns.
 *
 * THE BAR RENDERS BEFORE `{children}` and as a sibling of the page's `<main>`,
 * for that same landmark reason — the same trap `Contact`'s `<footer>` avoids
 * by staying outside `<main>`.
 *
 * NO "use client". `Navbar` carries its own directive; this file must stay a
 * server component or every page under it crosses the client boundary.
 */
export default function ChromeLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
