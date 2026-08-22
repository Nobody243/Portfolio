import { IntroProvider } from "@/components/intro/IntroProvider";
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
 * `<IntroProvider>` DOES NOT BREAK THAT RULE. A context provider is not an
 * element, and the gate it mounts renders two `position: fixed` plates — out of
 * flow, and therefore not flex items of `<body>`. `<header>`'s nearest ancestor
 * is still `<body>`. Both stated reasons for the no-DOM rule survive intact.
 *
 * IT IS THE ENTRY GATE'S MOUNT POINT, AND THIS GROUP IS EXACTLY THE RIGHT
 * SCOPE. `(chrome)` contains `/`, `/work` and `/about` and nothing else, which
 * is the set of routes the Intro is meant to play on; `projects/[slug]` sits
 * outside it and keeps its Tier 3 register, for the same reason
 * reason 2 above gives about the navbar.
 *
 * IT IS ALSO THE THING THAT MAKES THE "once per document" RULE STRUCTURAL. This
 * layout persists across every navigation inside the group, so the provider
 * never remounts on a `/` <-> `/work` <-> `/about` click and the Intro
 * structurally CANNOT replay — the same safeguard `PageStack.tsx` records for
 * the navbar's entrance, and the reason the gate is NOT mounted per page.
 * Before this commit it was mounted by `Hero`, i.e. by Home, and the two
 * failures that produced were one bug: a hard load of `/about` played no Intro,
 * and the first click to HOME played one on a CLIENT NAVIGATION.
 *
 * THE BAR RENDERS BEFORE `{children}` and as a sibling of the page's `<main>`,
 * for that same landmark reason — the same trap `RevealFooter`'s `<footer>`
 * avoids by staying outside `<main>`.
 *
 * NO "use client". `Navbar` carries its own directive and so does
 * `IntroProvider`; this file must stay a server component or every page under
 * it crosses the client boundary. `<Navbar />` and `{children}` are passed to
 * the provider AS CHILDREN, which is what keeps them server-rendered — a client
 * component's `children` are rendered by the server and handed through, so
 * nothing under here is pulled across the boundary.
 *
 * MEASURED RATHER THAN ASSUMED, because "the children pass-through held" is
 * exactly the kind of claim that is true until it silently is not. Total JS
 * fetched on a cold load, before and after this commit: `/` 820.9 -> 821.3 KB,
 * `/work` 845.2 -> 845.7 KB, `/about` 820.9 -> 821.3 KB. One chunk each, and
 * it is this provider's own module — nothing resembling page content, and in
 * particular none of `/work`'s five project descriptions.
 */
export default function ChromeLayout({ children }: LayoutProps<"/">) {
  return (
    <IntroProvider>
      <Navbar />
      {children}
    </IntroProvider>
  );
}
