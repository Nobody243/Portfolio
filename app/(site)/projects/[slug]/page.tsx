/**
 * TEMPORARY route stub — REPLACED IN TICKET 7 (project detail page).
 *
 * Exists so the route defined in the Technical Architecture Document actually
 * resolves. A `[slug]` directory holding only a .gitkeep is inert: Next.js
 * needs a `page.tsx` for the segment to exist at all, so without this the
 * scaffold's routing was structurally incomplete.
 *
 * Deliberately omits `generateStaticParams` — the project list it would map
 * over is `content/projects.ts`, which Ticket 2 owns. Until then this segment
 * renders on demand and accepts ANY slug. Ticket 7 adds the param generation
 * and a real `notFound()` for unknown slugs.
 *
 * Tier 3 rules apply here: typography and whitespace only, no 3D, no parallax.
 * All copy below is scaffolding, not content.
 */

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;

  return (
    <main className="px-md py-2xl">
      <p className="text-caption font-mono uppercase text-accent-working">
        placeholder / project detail
      </p>

      <h1 className="mt-md text-h2">
        {/* Echoing the slug proves param resolution works — it is not a title. */}
        <span className="font-mono">{slug}</span>
      </h1>

      <p className="text-body mt-lg max-w-prose">
        TODO(ticket-7): render this project from{" "}
        <code className="font-mono text-accent-working">content/projects.ts</code>{" "}
        — description, stack, real links, date.
      </p>
    </main>
  );
}
