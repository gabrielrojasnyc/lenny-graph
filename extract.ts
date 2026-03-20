#!/usr/bin/env npx tsx
/**
 * Entity extraction pipeline for The Lenny Graph.
 * Reads podcast transcripts and newsletters, extracts entities and relationships,
 * outputs graph.json for D3.js visualization.
 */

import fs from "node:fs";
import path from "node:path";

const BASE_DIR = path.dirname(new URL(import.meta.url).pathname);

// ── Seed lists ──────────────────────────────────────────────────────────────

const CONCEPT_SEEDS: string[] = [
  "product-market fit", "product market fit", "PMF",
  "jobs to be done", "JTBD",
  "north star metric", "north star",
  "growth loops", "growth loop",
  "flywheel", "flywheels",
  "network effects", "network effect",
  "retention", "logo retention", "logo churn",
  "activation", "user activation",
  "onboarding",
  "churn", "churn rate",
  "NPS", "net promoter score",
  "OKRs", "OKR",
  "A/B testing", "A/B test",
  "user research",
  "pricing", "pricing strategy",
  "positioning",
  "ideal customer profile", "ICP",
  "net revenue retention", "NRR",
  "total addressable market", "TAM",
  "minimum viable product", "MVP",
  "design thinking",
  "first principles",
  "founder-led sales",
  "product-led growth", "PLG",
  "sales-led growth", "SLG",
  "bottom-up adoption",
  "freemium",
  "land and expand",
  "compounding", "compound growth",
  "moat", "moats", "competitive moat",
  "mental model", "mental models",
  "roadmap", "product roadmap",
  "prioritization",
  "customer discovery",
  "user persona", "personas",
  "product sense",
  "product strategy",
  "marketplace", "two-sided marketplace",
  "vibe coding", "vibe coder",
  "AI product work", "AI-native",
  "prompt engineering", "context engineering",
  "agentic", "agentic AI", "AI agents",
  "LLM", "large language model",
  "fine-tuning", "fine tuning",
  "evals", "evaluations",
  "RAG", "retrieval augmented generation",
  "scaling laws",
  "product velocity",
  "shipping fast", "ship fast",
  "growth stall", "growth stalls",
  "product-channel fit",
  "viral loop", "viral loops", "virality",
  "word of mouth",
  "community-led growth",
  "content marketing",
  "SEO",
  "demand generation",
  "go-to-market", "GTM",
  "series A", "series B", "fundraising",
  "unit economics",
  "CAC", "customer acquisition cost",
  "LTV", "lifetime value", "CLV",
  "payback period",
  "burn rate", "runway",
  "product org", "product organization",
  "engineering culture",
  "design system", "design systems",
  "prototyping", "prototype",
  "feedback loops", "feedback loop",
  "data-driven", "data driven",
  "experimentation",
  "technical debt", "tech debt",
  "microservices",
  "developer experience", "DX",
  "open source",
  "API", "APIs",
  "second brain",
];

function normalizeConcept(name: string): string {
  const n = name.trim().toLowerCase();
  const mappings: Record<string, string> = {
    "pmf": "product-market fit",
    "product market fit": "product-market fit",
    "jtbd": "jobs to be done",
    "growth loop": "growth loops",
    "flywheel": "flywheels",
    "network effect": "network effects",
    "logo retention": "retention",
    "logo churn": "churn",
    "user activation": "activation",
    "churn rate": "churn",
    "net promoter score": "NPS",
    "okr": "OKRs",
    "a/b test": "A/B testing",
    "pricing strategy": "pricing",
    "icp": "ideal customer profile",
    "nrr": "net revenue retention",
    "tam": "total addressable market",
    "mvp": "minimum viable product",
    "plg": "product-led growth",
    "slg": "sales-led growth",
    "moat": "moats",
    "competitive moat": "moats",
    "mental model": "mental models",
    "framework": "frameworks",
    "product roadmap": "roadmap",
    "user persona": "personas",
    "two-sided marketplace": "marketplace",
    "platform strategy": "platform",
    "vibe coder": "vibe coding",
    "ai-native": "AI product work",
    "ai agents": "agentic AI",
    "large language model": "LLM",
    "fine tuning": "fine-tuning",
    "evaluations": "evals",
    "retrieval augmented generation": "RAG",
    "ship fast": "shipping fast",
    "growth stalls": "growth stall",
    "viral loop": "viral loops",
    "virality": "viral loops",
    "gtm": "go-to-market",
    "series b": "fundraising",
    "series a": "fundraising",
    "customer acquisition cost": "CAC",
    "lifetime value": "LTV",
    "clv": "LTV",
    "burn rate": "runway",
    "product organization": "product org",
    "design system": "design systems",
    "ux": "user experience",
    "prototype": "prototyping",
    "iterate": "iteration",
    "feedback loop": "feedback loops",
    "data driven": "data-driven",
    "tech debt": "technical debt",
    "developer experience": "DX",
    "api": "APIs",
    "flywheels": "flywheel",
  };
  return mappings[n] ?? n;
}

const COMPANY_SEEDS: string[] = [
  "Google", "Meta", "Facebook", "Apple", "Amazon", "Microsoft", "Netflix",
  "Stripe", "Airbnb", "Uber", "Lyft", "Slack", "Dropbox", "Spotify",
  "Twitter", "X", "Pinterest", "Snap", "Snapchat",
  "Tesla", "SpaceX", "OpenAI", "Anthropic", "DeepMind", "Mistral",
  "HubSpot", "Salesforce", "Adobe", "Figma", "Notion", "Airtable",
  "Shopify", "Square", "Block", "PayPal", "Plaid", "Robinhood",
  "Coinbase", "Canva", "Atlassian", "Intercom", "Amplitude",
  "Mixpanel", "Segment", "Twilio", "Snowflake", "Databricks",
  "MongoDB", "Cloudflare", "Vercel", "GitHub", "GitLab",
  "Replit", "Cursor", "Bolt", "Lovable", "v0",
  "a16z", "Andreessen Horowitz", "Sequoia", "Y Combinator", "YC",
  "Benchmark", "Accel", "Greylock", "Kleiner Perkins",
  "WP Engine", "WordPress",
  "Duolingo", "Calm", "Headspace",
  "TikTok",
  "Perplexity", "ChatGPT", "Claude", "Gemini",
  "Substack", "Medium",
  "Lenny's Podcast", "Lenny's Newsletter",
  "Sierra", "Intercom",
  "Disney", "Amazon Prime", "Hulu",
  "Cisco", "WebEx",
];

const COMPANY_NORMALIZE: Record<string, string> = {
  "facebook": "Meta",
  "meta": "Meta",
  "x": "X (Twitter)",
  "twitter": "X (Twitter)",
  "andreessen horowitz": "a16z",
  "y combinator": "Y Combinator",
  "yc": "Y Combinator",
  "snapchat": "Snap",
  "block": "Square",
  "whatsapp": "WhatsApp",
  "instagram": "Instagram",
  "youtube": "YouTube",
  "tiktok": "TikTok",
  "wordpress": "WordPress",
  "lenny's podcast": "Lenny's Podcast",
  "lenny's newsletter": "Lenny's Newsletter",
  "chatgpt": "ChatGPT",
  "webex": "WebEx",
  "amazon prime": "Amazon",
};

const BOOK_PATTERNS: RegExp[] = [
  /(?:book|books)\s+(?:called|titled|named)\s+"([^"]+)"/gi,
  /(?:book|books)\s+(?:called|titled|named)\s+["\u201c]([^"\u201d]+)["\u201d]/gi,
  /(?:wrote|written|authored)\s+(?:a\s+)?(?:book\s+)?(?:called\s+)?"([^"]+)"/gi,
  /(?:recommend|recommends|recommended|reading)\s+"([^"]+)"/gi,
  /"([^"]+)"\s+(?:by|from)\s+[A-Z][a-z]+/g,
  /(?:the\s+book\s+)"([^"]+)"/gi,
  /["\u201c]([^"\u201d]{5,60})["\u201d]\s+(?:is\s+)?(?:a\s+)?(?:great|amazing|incredible|fantastic|good|wonderful|excellent)\s+book/gi,
];

const BOOK_SEEDS: string[] = [
  "The Lean Startup", "Zero to One", "Crossing the Chasm",
  "The Hard Thing About Hard Things", "Good to Great",
  "The Innovator's Dilemma", "Inspired", "Empowered",
  "Thinking, Fast and Slow", "Atomic Habits",
  "High Output Management", "The Mom Test",
  "Hooked", "Measure What Matters", "The Cold Start Problem",
  "Blitzscaling", "The Score Takes Care of Itself",
  "Obviously Awesome", "Play Bigger",
  "Influence", "Never Split the Difference",
  "Range", "Shoe Dog", "Creative Selection",
  "Working Backwards", "No Rules Rules",
  "An Elegant Puzzle", "Staff Engineer",
  "The Phoenix Project", "Accelerate",
  "Continuous Discovery Habits", "Shape Up",
  "Don't Make Me Think", "The Design of Everyday Things",
  "Sprint", "Lean Analytics", "Hacking Growth",
  "Product-Led Growth", "The SaaS Playbook",
  "Scaling People", "What You Do Is Who You Are",
  "Super Pumped", "Power and Prediction",
  "Co-Intelligence", "The Coming Wave",
  "Chip War", "The Alignment Problem",
  "Competing Against Luck",
];

const AMBIGUOUS_BOOKS = new Set([
  "Range", "Accelerate", "Influence", "Inspired", "Empowered",
  "Sprint", "Hooked", "Shape Up",
]);

const WELL_KNOWN_PEOPLE: string[] = [
  "Jeff Bezos", "Elon Musk", "Steve Jobs", "Mark Zuckerberg",
  "Satya Nadella", "Tim Cook", "Sundar Pichai", "Jensen Huang",
  "Sam Altman", "Dario Amodei", "Demis Hassabis",
  "Reid Hoffman", "Peter Thiel", "Paul Graham", "Ben Horowitz",
  "Brian Chesky", "Travis Kalanick", "Drew Houston",
  "Stewart Butterfield", "Daniel Ek",
  "Marissa Mayer", "Sheryl Sandberg", "Susan Wojcicki",
  "Tobi Lutke", "Patrick Collison", "John Collison",
  "Naval Ravikant", "Balaji Srinivasan",
  "Eric Schmidt", "Larry Page", "Sergey Brin",
  "Bill Gates", "Warren Buffett", "Charlie Munger",
  "Andy Grove", "Clayton Christensen",
  "Packy McCormick", "Shreyas Doshi", "Julie Zhuo",
  "Lenny Rachitsky",
  "Adam Grant", "Brené Brown", "Simon Sinek",
  "Sahil Lavingia", "David Sacks", "Keith Rabois",
];

const COMPANY_BLACKLIST = new Set([
  "The", "This", "That", "What", "Which", "Where", "When", "How", "Why",
  "And", "But", "Not", "For", "All", "You", "Are", "Was", "Were", "Has",
  "Have", "Had", "His", "Her", "Its", "Our", "Their", "My", "Your",
  "One", "Two", "Three", "First", "Second", "Third", "Last",
  "So", "Now", "Then", "Here", "There", "Just", "Like", "Well",
  "Yeah", "Yes", "No", "Right", "Very", "Really", "Actually",
  "People", "Things", "Good", "Great", "Big", "New", "Old",
  "Product", "Company", "Companies", "Team", "Teams", "Market",
  "Way", "Part", "Time", "Kind", "Thing", "Stuff", "Sort",
  "Something", "Someone", "Somebody", "Whatever", "Think",
  "Maybe", "Look", "See", "Know", "Say", "Said", "Tell",
  "Let", "Got", "Get", "Go", "Going", "Went", "Come", "Take",
  "Other", "Another", "Many", "Some", "Most", "More", "Much",
  "Own", "Still", "Also", "Every", "Each", "Both", "Few",
  "Same", "Different", "Whole", "Sure", "Long", "High",
  "Little", "World", "Lot", "Okay", "Step", "Question",
  "Point", "Problem", "Answer", "Idea", "Example",
  "Awesome", "Amazing", "Incredible", "Love", "Thanks",
  "Pretty", "Super", "Interesting", "Important", "Literally",
  "Start", "End", "Help", "Work", "Working", "Built",
  "Absolutely", "Exactly", "Basically", "Obviously",
  "Especially", "Probably", "Definitely", "Totally",
  "Meanwhile", "However", "Although", "Because",
  "Everything", "Nothing", "Anything", "Everyone",
  "Series", "Growth", "Revenue", "Customers", "Users",
  "Silicon Valley", "San Francisco", "New York",
  "America", "Europe", "China", "Asia", "India",
  "English", "French", "German", "Spanish",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
  "LinkedIn", "Email", "Website", "YouTube", "Instagram",
]);

// ── Types ───────────────────────────────────────────────────────────────────

interface Episode {
  title: string;
  filename: string;
  tags: string[];
  word_count: number;
  date: string;
  description: string;
  guest: string;
}

interface IndexData {
  schema_version: string;
  generated_at: string;
  podcasts: Episode[];
  newsletters: { title: string; filename: string; tags: string[]; word_count: number; date: string; subtitle: string }[];
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  episodes: string[];
  weight: number;
  connections: number;
  bridge?: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  episodes: string[];
  weight: number;
  cross_episode?: boolean;
}

// ── Loading data ────────────────────────────────────────────────────────────

function loadIndex(): IndexData {
  return JSON.parse(fs.readFileSync(path.join(BASE_DIR, "index.json"), "utf-8"));
}

function loadTranscript(filename: string): string {
  const filepath = path.join(BASE_DIR, filename);
  if (!fs.existsSync(filepath)) return "";
  return fs.readFileSync(filepath, "utf-8");
}

function loadNewsletters(): Map<string, string> {
  const dir = path.join(BASE_DIR, "newsletters");
  const texts = new Map<string, string>();
  if (!fs.existsSync(dir)) return texts;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".md")) {
      texts.set(f, fs.readFileSync(path.join(dir, f), "utf-8"));
    }
  }
  return texts;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function countAll(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Extraction ──────────────────────────────────────────────────────────────

function extractCompanies(text: string, _episodeId: string): Map<string, number> {
  const found = new Map<string, number>();

  for (const company of COMPANY_SEEDS) {
    if (company.length <= 2 && company !== "YC" && company !== "X") continue;

    if (company.length <= 3) {
      const pattern = new RegExp(`\\b${escapeRegex(company)}\\b`, "g");
      const count = countAll(text, pattern);
      if (count >= 2) {
        const normalized = COMPANY_NORMALIZE[company.toLowerCase()] ?? company;
        found.set(normalized, (found.get(normalized) ?? 0) + count);
      }
    } else {
      const pattern = new RegExp(`\\b${escapeRegex(company)}\\b`, "gi");
      const count = countAll(text, pattern);
      if (count > 0) {
        const normalized = COMPANY_NORMALIZE[company.toLowerCase()] ?? company;
        found.set(normalized, (found.get(normalized) ?? 0) + count);
      }
    }
  }

  // Dynamic company detection patterns
  const atPatterns: RegExp[] = [
    /(?:at|from|joined|left|ran|running|leading|lead|built|building)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b/g,
    /(?:founded|co-founded|cofounded|started|created|launched)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b/g,
    /(?:CEO|CTO|CPO|VP|SVP|EVP|CMO|COO|CFO|president|head)\s+(?:of|at)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b/g,
  ];

  for (const pattern of atPatterns) {
    let match: RegExpExecArray | null;
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (COMPANY_BLACKLIST.has(name) || name.length < 3) continue;
      const normalized = COMPANY_NORMALIZE[name.toLowerCase()] ?? name;
      if (found.has(normalized)) {
        found.set(normalized, found.get(normalized)! + 1);
      }
      // Only add new companies if already known (same behavior as Python)
    }
  }

  return found;
}

function extractConcepts(text: string): Map<string, number> {
  const found = new Map<string, number>();
  const textLower = text.toLowerCase();

  for (const concept of CONCEPT_SEEDS) {
    const cl = concept.toLowerCase();
    const pattern = new RegExp(`\\b${escapeRegex(cl)}\\b`, "g");
    const count = countAll(textLower, pattern);
    if (count > 0) {
      const canonical = normalizeConcept(cl);
      found.set(canonical, (found.get(canonical) ?? 0) + count);
    }
  }

  return found;
}

function extractBooks(text: string): Map<string, number> {
  const found = new Map<string, number>();

  // Check seed books
  for (const book of BOOK_SEEDS) {
    if (AMBIGUOUS_BOOKS.has(book)) {
      const patterns = [
        new RegExp(`(?:book|read|reading|wrote|recommend)\\w*\\s+.*?\\b${escapeRegex(book)}\\b`, "i"),
        new RegExp(`\\b${escapeRegex(book)}\\b.*?(?:book|read|wrote|author)`, "i"),
        new RegExp(`["\u201c]${escapeRegex(book)}["\u201d]`, "i"),
      ];
      for (const pat of patterns) {
        if (pat.test(text)) {
          found.set(book, (found.get(book) ?? 0) + 1);
          break;
        }
      }
    } else {
      if (text.toLowerCase().includes(book.toLowerCase())) {
        found.set(book, (found.get(book) ?? 0) + 1);
      }
    }
  }

  // Regex patterns for dynamic book detection
  for (const pattern of BOOK_PATTERNS) {
    let match: RegExpExecArray | null;
    // Create a fresh regex instance since they're global
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null) {
      const title = match[1].trim();
      if (title.length > 4 && title.length < 80) {
        let already = false;
        for (const seed of found.keys()) {
          if (seed.toLowerCase() === title.toLowerCase()) {
            already = true;
            break;
          }
        }
        if (!already) {
          found.set(title, (found.get(title) ?? 0) + 1);
        }
      }
    }
  }

  return found;
}

function extractPeople(text: string, knownGuests: Set<string>): Map<string, number> {
  const found = new Map<string, number>();

  // Check known guest names
  for (const guest of knownGuests) {
    if (guest === "Lenny Rachitsky") continue;
    const parts = guest.split(" ");
    if (parts.length >= 2) {
      // Full name match
      if (text.includes(guest)) {
        const count = text.split(guest).length - 1;
        found.set(guest, (found.get(guest) ?? 0) + count);
      }
      // Last name match
      const last = parts[parts.length - 1];
      if (last.length > 3 && text.includes(last)) {
        const lastCount = text.split(last).length - 1;
        const currentCount = found.get(guest) ?? 0;
        const additional = Math.max(0, lastCount - currentCount);
        if (additional > 0) {
          found.set(guest, currentCount + additional);
        }
      }
    }
  }

  // Well-known people
  for (const person of WELL_KNOWN_PEOPLE) {
    if (person === "Lenny Rachitsky") continue;
    if (text.includes(person)) {
      const count = text.split(person).length - 1;
      found.set(person, (found.get(person) ?? 0) + count);
    }
  }

  return found;
}

// ── Graph Building ──────────────────────────────────────────────────────────

function buildGraph(): void {
  const index = loadIndex();
  const podcasts = index.podcasts;
  const newsletters = loadNewsletters();

  // Collect all guest names
  const guestNames = new Set<string>();
  const guestEpisodes = new Map<string, string[]>();
  const episodeDates = new Map<string, string>();
  const episodeTitles = new Map<string, string>();

  for (const ep of podcasts) {
    const guests = ep.guest.split(/\s*[+&]\s*/);
    for (let g of guests) {
      g = g.replace(/\s+V\d+$/, "").replace(/\s+\d+\.\d+$/, "");
      guestNames.add(g);
      if (!guestEpisodes.has(g)) guestEpisodes.set(g, []);
      guestEpisodes.get(g)!.push(ep.filename);
    }
    episodeDates.set(ep.filename, ep.date);
    episodeTitles.set(ep.filename, ep.title);
  }

  guestNames.add("Lenny Rachitsky");

  // Nodes and edges
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  function addNode(name: string, ntype: string, episode?: string, weight = 1): string {
    const nid = `${ntype}:${name}`;
    if (!nodes.has(nid)) {
      nodes.set(nid, {
        id: nid,
        name,
        type: ntype,
        episodes: [],
        weight: 0,
        connections: 0,
      });
    }
    const node = nodes.get(nid)!;
    if (episode && !node.episodes.includes(episode)) {
      node.episodes.push(episode);
    }
    node.weight += weight;
    return nid;
  }

  function addEdge(source: string, target: string, rel: string, episode?: string, weight = 1): void {
    const sorted = [source, target].sort();
    const key = `${sorted[0]}||${sorted[1]}||${rel}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        source,
        target,
        relationship: rel,
        episodes: episode ? [episode] : [],
        weight,
      });
    } else {
      // Update existing edge
      for (const e of edges) {
        const eSorted = [e.source, e.target].sort();
        const eKey = `${eSorted[0]}||${eSorted[1]}||${e.relationship}`;
        if (eKey === key) {
          if (episode && !e.episodes.includes(episode)) {
            e.episodes.push(episode);
          }
          e.weight += weight;
          break;
        }
      }
    }
  }

  // Add guest nodes
  for (const guest of guestNames) {
    if (guest === "Lenny Rachitsky") continue;
    for (const ep of guestEpisodes.get(guest) ?? []) {
      addNode(guest, "person", ep);
    }
  }

  // Process each podcast
  console.log(`Processing ${podcasts.length} podcasts...`);

  for (const ep of podcasts) {
    const filename = ep.filename;
    const text = loadTranscript(filename);
    if (!text) {
      console.log(`  Skipping ${filename} (not found)`);
      continue;
    }

    let epGuests = ep.guest.split(/\s*[+&]\s*/);
    epGuests = epGuests.map(g => g.replace(/\s+V\d+$/, "").replace(/\s+\d+\.\d+$/, ""));

    console.log(`  ${filename} (${epGuests.join(", ")})`);

    // Extract entities
    const companies = extractCompanies(text, filename);
    const concepts = extractConcepts(text);
    const books = extractBooks(text);
    const people = extractPeople(text, guestNames);

    // Add company nodes and edges
    for (const [company, count] of companies) {
      if (count < 2) continue;
      const cid = addNode(company, "company", filename, count);
      for (const guest of epGuests) {
        const gid = `person:${guest}`;
        addEdge(gid, cid, "discusses", filename, count);
      }
    }

    // Add concept nodes and edges
    for (const [concept, count] of concepts) {
      if (count < 1) continue;
      const cid = addNode(concept, "concept", filename, count);
      for (const guest of epGuests) {
        const gid = `person:${guest}`;
        addEdge(gid, cid, "discusses", filename, count);
      }
    }

    // Add book nodes and edges
    for (const [book, count] of books) {
      const bid = addNode(book, "book", filename, count);
      for (const guest of epGuests) {
        const gid = `person:${guest}`;
        addEdge(gid, bid, "recommends", filename, count);
      }
    }

    // Add person-to-person edges
    for (const [person, count] of people) {
      if (epGuests.includes(person)) continue;
      const pid = addNode(person, "person", filename, count);
      for (const guest of epGuests) {
        const gid = `person:${guest}`;
        addEdge(gid, pid, "mentions", filename, count);
      }
    }
  }

  // Process newsletters
  console.log(`\nProcessing ${newsletters.size} newsletters...`);
  for (const [name, text] of newsletters) {
    const epId = `newsletters/${name}`;

    const companies = extractCompanies(text, epId);
    const concepts = extractConcepts(text);
    const books = extractBooks(text);
    const people = extractPeople(text, guestNames);

    for (const [company, count] of companies) {
      if (count < 2) continue;
      addNode(company, "company", epId, count);
    }

    for (const [concept, count] of concepts) {
      addNode(concept, "concept", epId, count);
    }

    for (const [book, count] of books) {
      addNode(book, "book", epId, count);
    }

    for (const [person, count] of people) {
      addNode(person, "person", epId, count);
    }
  }

  // ── Post-processing ─────────────────────────────────────────────────────

  // Count connections for each node
  for (const edge of edges) {
    const srcNode = nodes.get(edge.source);
    const tgtNode = nodes.get(edge.target);
    if (srcNode) srcNode.connections += 1;
    if (tgtNode) tgtNode.connections += 1;
  }

  // Filter low-value nodes
  console.log("\nFiltering low-confidence entities...");
  const filteredNodes = new Map<string, GraphNode>();
  for (const [nid, node] of nodes) {
    // Keep all guest nodes
    if (node.type === "person" && guestNames.has(node.name)) {
      filteredNodes.set(nid, node);
      continue;
    }
    // Keep nodes with multiple connections or multi-episode appearances
    if (node.connections >= 2 || node.episodes.length >= 2) {
      filteredNodes.set(nid, node);
      continue;
    }
    // Keep high-weight nodes
    if (node.weight >= 3) {
      filteredNodes.set(nid, node);
      continue;
    }
  }

  // Filter edges
  let filteredEdges = edges.filter(
    e => filteredNodes.has(e.source) && filteredNodes.has(e.target)
  );

  // Recalculate connections
  for (const [, node] of filteredNodes) {
    node.connections = 0;
  }
  for (const edge of filteredEdges) {
    const srcNode = filteredNodes.get(edge.source);
    const tgtNode = filteredNodes.get(edge.target);
    if (srcNode) srcNode.connections += 1;
    if (tgtNode) tgtNode.connections += 1;
  }

  // Remove orphan nodes
  const finalNodes = new Map<string, GraphNode>();
  for (const [nid, node] of filteredNodes) {
    if (node.connections > 0) {
      finalNodes.set(nid, node);
    }
  }

  const finalEdges = filteredEdges.filter(
    e => finalNodes.has(e.source) && finalNodes.has(e.target)
  );

  // Episode metadata
  const episodeMeta = podcasts.map(ep => ({
    id: ep.filename,
    title: ep.title,
    date: ep.date,
    guest: ep.guest,
  }));

  // Mark cross-episode edges
  let crossEpisodeCount = 0;
  for (const edge of finalEdges) {
    edge.cross_episode = edge.episodes.length >= 2;
    if (edge.cross_episode) crossEpisodeCount++;
  }

  // Mark bridge nodes
  for (const [, node] of finalNodes) {
    node.bridge = node.episodes.length >= 3;
  }

  // Stats
  const typeCounts: Record<string, number> = {};
  for (const [, node] of finalNodes) {
    typeCounts[node.type] = (typeCounts[node.type] ?? 0) + 1;
  }

  const mostConnected = [...finalNodes.values()]
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 10);

  console.log(`\n${"=".repeat(60)}`);
  console.log("GRAPH STATISTICS");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total nodes: ${finalNodes.size}`);
  console.log(`Total edges: ${finalEdges.length}`);
  console.log(`Cross-episode edges: ${crossEpisodeCount}`);
  console.log("\nBy type:");
  for (const [t, c] of Object.entries(typeCounts).sort()) {
    console.log(`  ${t}: ${c}`);
  }
  console.log("\nMost connected:");
  for (const n of mostConnected) {
    console.log(`  ${n.name} (${n.type}): ${n.connections} connections`);
  }

  // Build output
  const graph = {
    nodes: [...finalNodes.values()],
    edges: finalEdges,
    episodes: episodeMeta,
    stats: {
      total_nodes: finalNodes.size,
      total_edges: finalEdges.length,
      cross_episode_edges: crossEpisodeCount,
      by_type: typeCounts,
      most_connected: mostConnected.map(n => ({
        name: n.name,
        type: n.type,
        connections: n.connections,
      })),
    },
  };

  const outputPath = path.join(BASE_DIR, "graph.json");
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));

  const stat = fs.statSync(outputPath);
  console.log(`\nGraph written to ${outputPath}`);
  console.log(`File size: ${(stat.size / 1024).toFixed(1)} KB`);
}

buildGraph();
