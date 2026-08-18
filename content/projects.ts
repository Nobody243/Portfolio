/**
 * Projects — Ticket 2.
 *
 * EDIT THIS FILE to add, remove or amend a project. Adding one means adding an
 * object here plus its images under public/images/projects/<slug>/ — no layout
 * code changes. See the hard rules in ./types.ts (no styling, no hexes, no
 * class strings, absent things are absent keys).
 *
 * ARRAY ORDER IS DISPLAY ORDER, AND IT IS DELIBERATELY NOT DATE ORDER.
 * The gallery renders FOLIO -> Aero-Grid -> ClashChat -> CCN -> SNA. SNA is the
 * newest entry (2025-12) and sits last on purpose: this is a strength-first
 * ordering. Ticket 6 must not add a date sort, and there is deliberately no
 * `featured` or `order` field — an explicit ordering field that duplicates
 * array position is a second source of truth that will drift.
 *
 * IMAGES ARE STATIC IMPORTS, never string paths. A missing or misnamed file is
 * then a BUILD ERROR instead of a broken <img> in production, and
 * StaticImageData carries real intrinsic width/height so next/image prevents
 * layout shift with nothing hand-copied. Verified: renaming an import path here
 * fails the build.
 *
 * SCREENSHOT COUNTS VARY — 0 (CCN, SNA), 1 (FOLIO), 2 (Aero-Grid, ClashChat).
 * Projects with no additional images omit the `screenshots` key entirely rather
 * than setting []. Ticket 7 must render 0, 1 or n without assuming a two-up
 * before/after pair.
 *
 * `links` is always present, as {} where a project has neither a repo nor a
 * deployment, so consumers branch on links.github / links.live rather than on
 * whether the key exists.
 *
 * NOTE FOR ANY SORT: these arrays are deeply readonly. Use [...projects] before
 * .sort() or .reverse(); .map/.filter/.find/.slice are unaffected.
 */

import type { Project } from "./types";

import folioCover from "@/public/images/projects/folio/cover.png";
import folioResults from "@/public/images/projects/folio/results.png";
import aeroGridCover from "@/public/images/projects/aero-grid/cover.png";
import aeroGridSimulation from "@/public/images/projects/aero-grid/simulation.png";
import aeroGridResults from "@/public/images/projects/aero-grid/results.png";
import clashchatCover from "@/public/images/projects/clashchat/cover.png";
import clashchatHomeDark from "@/public/images/projects/clashchat/home-dark.png";
import clashchatHomeLight from "@/public/images/projects/clashchat/home-light.png";
import ccnCover from "@/public/images/projects/ccn-network/cover.png";
import snaCover from "@/public/images/projects/sna-infrastructure/cover.png";

export const projects = [
  {
    slug: "folio",
    title: "FOLIO",
    oneLiner:
      "Aggregates clothing listings from 150+ brands across 10 countries into one searchable interface — powered by Kafka and Spark",
    description:
      "A real-time clothing search engine that scrapes product catalogues from 150+ brands across 10 countries, streams raw listings through Kafka, cleans and deduplicates them with Spark Structured Streaming, and serves results through a FastAPI backend to a React frontend. TF-IDF cosine similarity powers recommendations; a RandomForest ML discovery loop continuously finds new brands the system doesn't know about yet. Falls back to direct SQLite writes if Kafka is unavailable.",
    stack: [
      "Apache Kafka",
      "Apache Spark (PySpark)",
      "FastAPI",
      "SQLite (FTS5)",
      "React",
      "Vite",
      "Firebase Auth",
      "Firestore",
      "scikit-learn",
      "Docker Compose",
      "Python",
    ],
    links: {
      github: "https://github.com/Nobody243/FOLIO",
      // Staging deployment. Verified loading; staging environments do get torn
      // down, so re-check at Ticket 13 and periodically after. If it ever 404s
      // the honest fix is deleting this key, not swapping in another URL.
      live: "https://staging.d3lmw6s3chjejw.amplifyapp.com",
    },
    date: "2025-05",
    category: "systems-foundation",
    credit: "Team project with Uzair Ahmed — roughly equal contribution",
    coverImage: {
      src: folioCover,
      alt: "FOLIO search interface with Kafka pipeline actively scraping brands across 10 countries",
    },
    // The 150+ brands above and the 43 below are NOT in tension and must not be
    // "reconciled": FOLIO's search is country-scoped by design, 150+ is the
    // total across all 10 countries, and this shot is a Pakistan-filtered
    // search. They measure different things.
    screenshots: [
      {
        src: folioResults,
        alt: "FOLIO results page showing 2144 listings across 43 brands with brand filter chips",
      },
    ],
  },
  {
    slug: "aero-grid",
    title: "Aero-Grid",
    oneLiner:
      "Drone routing engine — Genetic Algorithm optimizes delivery order, A* plots each leg around obstacles, Naive Bayes classifies weather",
    description:
      "A full-stack visualization of four classical AI techniques cooperating to plan and execute a multi-stop drone delivery mission across a 40x40 city grid. Naive Bayes classifies weather conditions for a pre-flight go/no-go verdict. A Genetic Algorithm solves the delivery order as a TSP variant. A* pathfinds each individual leg around buildings and no-fly zones. Q-Learning trains a tabular policy and stress-tests it under obstacle perturbation. Every algorithm step is visualized in real time — generational fitness curves, A* frontier sweeps, Q-table heatmaps. FastAPI backend exposes each module as a stateless endpoint; the city grid is the frontend's state, passed with every request.",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "FastAPI",
      "Python",
      "scikit-learn",
      "NumPy",
      "pandas",
      "Framer Motion",
      "React Three Fiber",
      "Zustand",
      "Recharts",
      "Render",
      "Vercel",
    ],
    links: {
      github: "https://github.com/Nobody243/Aero-Grid",
      live: "https://aerogrid-simulator-ag24303.vercel.app",
    },
    date: "2025-04",
    category: "systems-foundation",
    // Nominally a group submission, but Saad did the work (confirmed
    // 2026-08-18). No team count here on purpose: "Team of 4" would credit
    // contribution that did not happen. "Led design and development" is the
    // accurate line — it does not claim solo authorship and it does not
    // inflate anyone else's part.
    credit: "Led design and development",
    coverImage: {
      src: aeroGridCover,
      alt: "Aero-Grid 3D isometric simulation showing drone route plotted across city grid with algorithm names listed",
    },
    screenshots: [
      {
        src: aeroGridSimulation,
        alt: "Live flight simulation mid-run showing leg 5 of 9 with heuristic comparison panel",
      },
      {
        src: aeroGridResults,
        alt: "Mission Complete screen showing GA convergence across 55 generations, 51.2% route improvement",
      },
    ],
  },
  {
    slug: "clashchat",
    title: "ClashChat",
    oneLiner:
      "Text-based AI debate app — argue any topic against Groq's LLM with timed rounds, stance tracking, and difficulty modes",
    description:
      "A Flutter application for text-based, AI-powered structured debates. Users pick a topic and stance, then argue against Groq's LLM across timed rounds with difficulty levels — Casual (free practice), Ranked (competitive scoring), and Learning (coached feedback). Groq API calls route through a privately-hosted Cloudflare Worker proxy so the API key never touches the client. Firebase handles auth (email + Google Sign-In), Firestore stores debate history and user profiles, and a daily quota of 40 debates is enforced client-side for the demo build. A responsive web build is available alongside the native Android APK.",
    stack: [
      "Flutter",
      "Dart",
      "Firebase Auth",
      "Firestore",
      "Firebase Hosting",
      "Groq API",
      "Cloudflare Workers",
      "Hive",
      "Provider",
    ],
    links: {
      github: "https://github.com/Nobody243/ClashChat",
      live: "https://clashchat-54dc0.web.app",
    },
    date: "2025-03",
    category: "core-dev",
    credit: "Team of 2 — led design and development",
    coverImage: {
      src: clashchatCover,
      alt: "ClashChat active debate on Economy topic showing AI and user exchange with Debate Stats panel",
    },
    screenshots: [
      {
        src: clashchatHomeDark,
        alt: "ClashChat home screen dark mode showing game modes",
      },
      {
        src: clashchatHomeLight,
        alt: "ClashChat home screen light mode",
      },
    ],
  },
  {
    slug: "ccn-network",
    title: "Multi-Floor Call Center Network Design",
    oneLiner:
      "Multi-floor enterprise network for a call center — VLANs per department, ACL-enforced segmentation, RIP routing, TFTP config backup",
    description:
      "Designed and simulated a segmented enterprise network for a 4-floor call center — 3 operational VLANs per floor (Verifiers, CSR floors) plus 4 admin VLANs (IT, HR, QA, Finance). Configured DHCP scoped per VLAN, ACLs enforcing inter-VLAN access restriction, RIP for inter-floor routing, and centralized TFTP config backup across floors. Documents challenges (inter-VLAN security, congestion, config consistency) and future enhancements (redundancy, IDS, wireless). Built for Computer Communication Networks coursework at Bahria University.",
    stack: [
      "Cisco Packet Tracer",
      "VLANs",
      "DHCP",
      "ACLs",
      "RIP routing",
      "TFTP",
    ],
    // No repo and no deployment. Empty object, not an omitted key — see header.
    links: {},
    date: "2024-12",
    category: "systems-foundation",
    credit: "Team of 2, led by me",
    // Dense at full-topology zoom, approved as-is: the density communicates
    // scale. DO NOT CROP, and do not swap in a simplified diagram.
    //
    // This comment used to end "or downscale past legibility". That clause was
    // removed on 2026-08-19 because it described a state the file never had:
    // opened at its native 1600x599, the node labels are ALREADY unreadable.
    // The instruction was therefore unsatisfiable at any card size rather than
    // only at small ones, and a later ticket would have chased it.
    //
    // What the image is actually for: the shape of the thing — colour-coded
    // VLAN groups, per-floor star topologies, the routers tying them together.
    // It reads as structure, never as text. Judge any resize against whether
    // that structure still reads, not against the labels.
    coverImage: {
      src: ccnCover,
      alt: "Cisco Packet Tracer topology showing multi-site call center network with color-coded VLANs across 4 floors and interconnecting routers",
    },
    // No `screenshots` key on purpose — absent, not [].
  },
  {
    slug: "sna-infrastructure",
    title: "Secure & Scalable IT Infrastructure",
    oneLiner:
      "Full enterprise IT infrastructure — Active Directory, DNS, DHCP, IIS, RDS, WDS, and Cisco NAT across 7 configured phases",
    // Double-quoted deliberately: this string contains backticks, which would
    // terminate a template literal early.
    description:
      "Designed and deployed a full enterprise IT infrastructure across 7 phases — an Active Directory domain controller with OU hierarchy (2 campuses, 3 departments each) and fine-grained password policies (PSO-Admin-Strict, 10-character minimum scoped to the Admin group only), DHCP with exclusion ranges and MAC-based reservations, DNS with forward and reverse lookup zones verified via nslookup, IIS with HTTPS binding and a self-signed SSL certificate, FTP with AD-attribute-based user isolation (msIIS-FTPDir), Remote Desktop Services with RemoteApp publishing verified through RD Web Access, Windows Deployment Services for PXE network OS deployment integrated with AD, Linux shell scripting for interactive file management automation (bash, chmod, case statements), and Cisco router NAT configuration — static 1:1, dynamic ACL+pool, and PAT/overload — all verified via `show ip nat translations`. Built for System and Network Administration coursework at Bahria University.",
    stack: [
      "Windows Server 2019",
      "Active Directory",
      "Group Policy",
      "DHCP",
      "DNS",
      "IIS",
      "FTP",
      "Remote Desktop Services",
      "WDS",
      "Ubuntu/Bash",
      "Cisco Packet Tracer",
    ],
    links: {},
    date: "2025-12",
    category: "systems-foundation",
    credit: "Team of 4, led by me",
    // 779x396 — the smallest source in the set, and not recapturable (the VM
    // lab is decommissioned). Ships as-is by decision: the file is real and its
    // alt text is accurate, which outranks sharpness. Ticket 6 note only.
    coverImage: {
      src: snaCover,
      alt: "Windows Server Manager dashboard showing all configured roles — AD DS, DHCP, DNS, IIS, RDS, WDS — with green health indicators",
    },
    // No `screenshots` key on purpose — absent, not [].
  },
] as const satisfies readonly Project[];

/** Literal union of every real slug — "folio" | "aero-grid" | ... — not string.
 *  For generateStaticParams and internal links. */
export type ProjectSlug = (typeof projects)[number]["slug"];

/** For Ticket 7's generateStaticParams. */
export const projectSlugs = projects.map((project) => project.slug);

/**
 * Takes `slug: string`, NOT ProjectSlug — deliberate, do not "tighten" it.
 *
 * Ticket 7 receives an arbitrary user-supplied string from the URL, and the
 * entire reason it calls this is to decide whether that string is valid and
 * call notFound() if not. A ProjectSlug parameter would make this function
 * impossible to call from the one place that needs it.
 */
export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
