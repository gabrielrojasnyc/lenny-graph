#!/usr/bin/env npx tsx
/**
 * Generate supplementary data files for The Lenny Graph tabs.
 * Reads from existing graph.json and index.json + podcast/newsletter files.
 * Outputs: topic_timeline.json, paths_index.json
 */

import fs from "node:fs";
import path from "node:path";

const BASE_DIR = path.dirname(new URL(import.meta.url).pathname);

// ── Topic categories mapping ──

const TOPIC_CATEGORIES: Record<string, string[]> = {
  "AI/ML": [
    "AI product work", "ai product work", "agentic", "agentic AI", "agentic ai",
    "LLM", "llm", "fine-tuning", "evals", "rag", "RAG",
    "prompt engineering", "context engineering", "vibe coding",
    "scaling laws", "second brain",
  ],
  "Growth": [
    "growth loops", "retention", "activation", "churn",
    "viral loops", "word of mouth", "community-led growth",
    "network effects", "flywheel", "flywheels", "compounding",
    "product velocity", "shipping fast",
  ],
  "Product": [
    "product-market fit", "product strategy", "product sense",
    "roadmap", "prioritization", "customer discovery",
    "jobs to be done", "minimum viable product", "personas",
    "product-led growth", "product org", "feedback loops",
  ],
  "Leadership": [
    "OKRs", "okrs", "engineering culture", "first principles",
    "mental models",
  ],
  "Design & UX": [
    "design thinking", "design systems", "prototyping",
    "user research", "onboarding",
  ],
  "Metrics": [
    "north star", "north star metric", "NPS", "nps",
    "A/B testing", "a/b testing", "experimentation",
    "data-driven", "CAC", "cac", "LTV", "ltv",
    "net revenue retention", "unit economics", "payback period",
  ],
  "Strategy": [
    "moats", "positioning", "pricing", "marketplace",
    "ideal customer profile", "total addressable market",
    "product velocity",
  ],
  "Startups": [
    "fundraising", "runway", "founder-led sales",
    "freemium", "land and expand",
  ],
  "Go-to-Market": [
    "go-to-market", "demand generation", "content marketing",
    "seo", "SEO", "sales-led growth",
  ],
  "Engineering": [
    "APIs", "apis", "DX", "dx", "technical debt",
    "open source",
  ],
};

// Build reverse lookup: concept name -> category
const CONCEPT_TO_CATEGORY = new Map<string, string>();
for (const [cat, concepts] of Object.entries(TOPIC_CATEGORIES)) {
  for (const c of concepts) {
    CONCEPT_TO_CATEGORY.set(c.toLowerCase(), cat);
  }
}

interface GraphData {
  nodes: { id: string; name: string; type: string; connections: number }[];
  edges: { source: string; target: string; relationship: string; weight: number; episodes: string[] }[];
}

interface IndexData {
  podcasts: { title: string; filename: string; date: string; guest?: string }[];
}

function loadJson<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(BASE_DIR, filename), "utf-8"));
}

function generateTopicTimeline(): void {
  const graph = loadJson<GraphData>("graph.json");
  const index = loadJson<IndexData>("index.json");

  // Build episode -> concept weights from edges
  const episodeConcepts = new Map<string, Map<string, number>>();

  for (const edge of graph.edges) {
    const srcType = edge.source.split(":")[0];
    const tgtType = edge.target.split(":")[0];

    let conceptId: string | null = null;
    if (tgtType === "concept") {
      conceptId = edge.target;
    } else if (srcType === "concept") {
      conceptId = edge.source;
    }

    if (!conceptId) continue;

    const conceptName = conceptId.split(":").slice(1).join(":").toLowerCase();
    const category = CONCEPT_TO_CATEGORY.get(conceptName);
    if (!category) continue;

    for (const ep of edge.episodes) {
      if (!episodeConcepts.has(ep)) episodeConcepts.set(ep, new Map());
      const epMap = episodeConcepts.get(ep)!;
      epMap.set(category, (epMap.get(category) ?? 0) + edge.weight);
    }
  }

  // Build timeline (only podcasts, sorted by date)
  const sortedPodcasts = [...index.podcasts].sort((a, b) => a.date.localeCompare(b.date));

  const timeline = sortedPodcasts.map(ep => {
    const topics = episodeConcepts.get(ep.filename) ?? new Map<string, number>();

    const vector: Record<string, number> = {};
    for (const cat of Object.keys(TOPIC_CATEGORIES)) {
      vector[cat] = Math.round((topics.get(cat) ?? 0) * 10) / 10;
    }

    return {
      date: ep.date,
      title: ep.title,
      guest: ep.guest ?? "",
      filename: ep.filename,
      topics: vector,
    };
  });

  const output = {
    categories: Object.keys(TOPIC_CATEGORIES),
    episodes: timeline,
  };

  const outPath = path.join(BASE_DIR, "topic_timeline.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  const stat = fs.statSync(outPath);
  console.log(`topic_timeline.json: ${timeline.length} episodes, ${(stat.size / 1024).toFixed(1)} KB`);
}

function generatePathsIndex(): void {
  const graph = loadJson<GraphData>("graph.json");

  // Build adjacency list
  const adj = new Map<string, { node: string; relationship: string; weight: number; episodes: string[] }[]>();

  for (const edge of graph.edges) {
    const info = {
      relationship: edge.relationship,
      weight: edge.weight,
      episodes: edge.episodes.slice(0, 3), // Limit for size
    };

    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push({ node: edge.target, ...info });

    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.target)!.push({ node: edge.source, ...info });
  }

  // Node info lookup
  const nodeInfo: Record<string, { name: string; type: string; connections: number }> = {};
  for (const node of graph.nodes) {
    nodeInfo[node.id] = {
      name: node.name,
      type: node.type,
      connections: node.connections,
    };
  }

  const output = {
    adjacency: Object.fromEntries(adj),
    nodes: nodeInfo,
  };

  const outPath = path.join(BASE_DIR, "paths_index.json");
  fs.writeFileSync(outPath, JSON.stringify(output));
  const stat = fs.statSync(outPath);
  console.log(`paths_index.json: ${adj.size} nodes, ${(stat.size / 1024).toFixed(1)} KB`);
}

generateTopicTimeline();
generatePathsIndex();
console.log("\nDone!");
