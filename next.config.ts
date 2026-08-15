import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` otherwise appends a "nextjs-agent-rules" block to CLAUDE.md on
  // every start. CLAUDE.md is a hand-authored project brief — keep it ours.
  agentRules: false,
};

export default nextConfig;
