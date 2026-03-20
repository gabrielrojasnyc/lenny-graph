#!/usr/bin/env python3
"""
Generate supplementary data files for The Lenny Graph tabs.
Reads from existing graph.json and index.json + podcast/newsletter files.
Outputs: topic_timeline.json, paths_index.json
"""

import json
import re
from collections import defaultdict, Counter
from pathlib import Path

BASE_DIR = Path(__file__).parent

# ── Topic categories mapping ──
TOPIC_CATEGORIES = {
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
}

# Build reverse lookup: concept name -> category
CONCEPT_TO_CATEGORY = {}
for cat, concepts in TOPIC_CATEGORIES.items():
    for c in concepts:
        CONCEPT_TO_CATEGORY[c.lower()] = cat


def load_json(filename):
    with open(BASE_DIR / filename) as f:
        return json.load(f)


def generate_topic_timeline():
    """Generate per-episode topic vectors for the Topic DNA tab."""
    graph = load_json("graph.json")
    index = load_json("index.json")

    # Build episode -> concept weights from edges
    # Each edge connects a person to a concept in an episode
    episode_concepts = defaultdict(lambda: defaultdict(float))

    for edge in graph["edges"]:
        src_type = edge["source"].split(":")[0]
        tgt_type = edge["target"].split(":")[0]

        concept_id = None
        if tgt_type == "concept":
            concept_id = edge["target"]
        elif src_type == "concept":
            concept_id = edge["source"]

        if not concept_id:
            continue

        concept_name = concept_id.split(":", 1)[1].lower()
        category = CONCEPT_TO_CATEGORY.get(concept_name)
        if not category:
            continue

        for ep in edge["episodes"]:
            episode_concepts[ep][category] += edge["weight"]

    # Build episode metadata lookup
    ep_dates = {}
    ep_titles = {}
    ep_guests = {}
    for ep in index.get("podcasts", []):
        ep_dates[ep["filename"]] = ep["date"]
        ep_titles[ep["filename"]] = ep["title"]
        ep_guests[ep["filename"]] = ep.get("guest", "")

    # Build timeline data (only podcasts, sorted by date)
    timeline = []
    for ep in sorted(index.get("podcasts", []), key=lambda x: x["date"]):
        fn = ep["filename"]
        topics = episode_concepts.get(fn, {})
        if not topics:
            # Still include with zero weights
            topics = {}

        # Normalize: create vector with all categories
        vector = {}
        for cat in TOPIC_CATEGORIES:
            vector[cat] = round(topics.get(cat, 0), 1)

        timeline.append({
            "date": ep["date"],
            "title": ep["title"],
            "guest": ep.get("guest", ""),
            "filename": fn,
            "topics": vector,
        })

    output = {
        "categories": list(TOPIC_CATEGORIES.keys()),
        "episodes": timeline,
    }

    out_path = BASE_DIR / "topic_timeline.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"topic_timeline.json: {len(timeline)} episodes, {out_path.stat().st_size/1024:.1f} KB")


def generate_paths_index():
    """Generate adjacency list for BFS pathfinding."""
    graph = load_json("graph.json")

    # Build adjacency list
    adj = defaultdict(list)
    for edge in graph["edges"]:
        src = edge["source"]
        tgt = edge["target"]
        info = {
            "relationship": edge["relationship"],
            "weight": edge["weight"],
            "episodes": edge["episodes"][:3],  # Limit for size
        }
        adj[src].append({"node": tgt, **info})
        adj[tgt].append({"node": src, **info})

    # Node info lookup
    node_info = {}
    for node in graph["nodes"]:
        node_info[node["id"]] = {
            "name": node["name"],
            "type": node["type"],
            "connections": node["connections"],
        }

    output = {
        "adjacency": dict(adj),
        "nodes": node_info,
    }

    out_path = BASE_DIR / "paths_index.json"
    with open(out_path, "w") as f:
        json.dump(output, f)
    print(f"paths_index.json: {len(adj)} nodes, {out_path.stat().st_size/1024:.1f} KB")


if __name__ == "__main__":
    generate_topic_timeline()
    generate_paths_index()
    print("\nDone!")
