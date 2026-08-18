import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` otherwise appends a "nextjs-agent-rules" block to CLAUDE.md on
  // every start. CLAUDE.md is a hand-authored project brief — keep it ours.
  agentRules: false,

  images: {
    /**
     * ALLOWLIST, NOT A DEFAULT — and without it `quality={85}` is a no-op.
     *
     * Next 16 ships `images.qualities: [75]`, and `get-img-props` silently
     * drops any `quality` prop not on that list back to the default. Verified
     * here in Ticket 6: `ProjectCard.tsx` asked for 85 and the optimiser was
     * serving `?q=75`, with the mismatch visible only in the request URL —
     * `next build` stays green and the page renders perfectly. The warning
     * (`next-image-unconfigured-qualities`) is a dev-only `warnOnce`.
     *
     * 85 is Ticket 6's approved value for the five project covers: they are
     * all UI screenshots, and sharp text on flat fields is the worst case for
     * lossy encoding. SNA's cover is a 779px source that cannot be recaptured,
     * so it would otherwise be re-encoded at 75 on top of being scaled.
     *
     * 75 STAYS ON THE LIST. It is next/image's default, so removing it would
     * make every future <Image> that does not pass `quality` an error rather
     * than a default. Two values, both intentional; do not prune either
     * without checking every <Image> call site.
     *
     * The optimiser appends its own BLUR_QUALITY internally for
     * `placeholder="blur"`, so blur placeholders need no entry here.
     */
    qualities: [75, 85],
  },
};

export default nextConfig;
