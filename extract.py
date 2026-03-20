#!/usr/bin/env python3
"""
Entity extraction pipeline for The Lenny Graph.
Reads podcast transcripts and newsletters, extracts entities and relationships,
outputs graph.json for D3.js visualization.
"""

import json
import os
import re
from collections import defaultdict, Counter
from pathlib import Path

BASE_DIR = Path(__file__).parent

# ── Seed lists ──────────────────────────────────────────────────────────────

CONCEPT_SEEDS = [
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
    # "framework", "frameworks",  # too generic
    "roadmap", "product roadmap",
    "prioritization",
    "customer discovery",
    "user persona", "personas",
    "product sense",
    "product strategy",
    "marketplace", "two-sided marketplace",
    # "platform", "platform strategy",  # too generic
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
    # "user experience", "UX",  # too generic
    "prototyping", "prototype",
    # "iteration", "iterate",  # too generic
    "feedback loops", "feedback loop",
    "data-driven", "data driven",
    "experimentation",
    "technical debt", "tech debt",
    "microservices",
    # "infrastructure",  # too generic
    "developer experience", "DX",
    "open source",
    "API", "APIs",
    "second brain",
]

# Normalize concept seeds into canonical forms
def normalize_concept(name):
    """Normalize concept to canonical form."""
    name = name.strip().lower()
    # Merge plurals and variants
    mappings = {
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
    }
    return mappings.get(name, name)

# Major tech companies to look for
COMPANY_SEEDS = [
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
]

COMPANY_NORMALIZE = {
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
}

# Book patterns
BOOK_PATTERNS = [
    r'(?:book|books)\s+(?:called|titled|named)\s+"([^"]+)"',
    r'(?:book|books)\s+(?:called|titled|named)\s+["\u201c]([^"\u201d]+)["\u201d]',
    r'(?:wrote|written|authored)\s+(?:a\s+)?(?:book\s+)?(?:called\s+)?"([^"]+)"',
    r'(?:recommend|recommends|recommended|reading)\s+"([^"]+)"',
    r'"([^"]+)"\s+(?:by|from)\s+[A-Z][a-z]+',
    r'(?:the\s+book\s+)"([^"]+)"',
    r'["\u201c]([^"\u201d]{5,60})["\u201d]\s+(?:is\s+)?(?:a\s+)?(?:great|amazing|incredible|fantastic|good|wonderful|excellent)\s+book',
]

# Known books that appear in product/startup contexts
BOOK_SEEDS = [
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
]

# Person name patterns (for finding mentioned people)
PERSON_PATTERNS = [
    r'(?:my friend|our friend|talked to|spoke with|interview(?:ed)?(?:\s+with)?|conversation with|chat(?:ted)? with|mentioned|said|according to|as .+ (?:says?|said|puts? it|described|explains?|told|argues?))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})',
    r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:told me|said|mentioned|explained|described|argues?|believes?|thinks?|wrote|founded|built|created|started|runs?|leads?|manages?)',
    r'(?:CEO|CTO|CPO|VP|founder|co-founder|head|director|partner)\s+(?:of\s+\w+\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})',
]

# ── Loading data ────────────────────────────────────────────────────────────

def load_index():
    with open(BASE_DIR / "index.json") as f:
        return json.load(f)

def load_transcript(filename):
    filepath = BASE_DIR / filename
    if not filepath.exists():
        return ""
    with open(filepath) as f:
        return f.read()

def load_newsletters():
    newsletters_dir = BASE_DIR / "newsletters"
    texts = {}
    if newsletters_dir.exists():
        for f in newsletters_dir.glob("*.md"):
            texts[f.name] = f.read_text()
    return texts

# ── Extraction ──────────────────────────────────────────────────────────────

def extract_companies(text, episode_id):
    """Extract company mentions from text."""
    found = {}
    text_lower = text.lower()
    
    for company in COMPANY_SEEDS:
        # Case-insensitive search but skip very short/ambiguous names
        if len(company) <= 2 and company not in ("YC", "X"):
            continue
        
        # For short names, require word boundaries
        if len(company) <= 3:
            pattern = r'\b' + re.escape(company) + r'\b'
            if re.search(pattern, text):
                normalized = COMPANY_NORMALIZE.get(company.lower(), company)
                count = len(re.findall(pattern, text))
                if count >= 2:  # Require at least 2 mentions for short names
                    found[normalized] = found.get(normalized, 0) + count
        else:
            pattern = r'\b' + re.escape(company) + r'\b'
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                normalized = COMPANY_NORMALIZE.get(company.lower(), company)
                found[normalized] = found.get(normalized, 0) + len(matches)
    
    # Also look for "at <Company>" / "founded <Company>" / "worked at <Company>" patterns
    at_patterns = [
        r'(?:at|from|joined|left|ran|running|leading|lead|built|building)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b',
        r'(?:founded|co-founded|cofounded|started|created|launched)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b',
        r'(?:CEO|CTO|CPO|VP|SVP|EVP|CMO|COO|CFO|president|head)\s+(?:of|at)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b',
    ]
    
    # Common words that look like companies but aren't
    COMPANY_BLACKLIST = {
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
        "LinkedIn", "Email", "Website", "YouTube", "Instagram",  # Keep these out of dynamic detection
    }
    
    for pattern in at_patterns:
        for match in re.finditer(pattern, text):
            name = match.group(1).strip()
            if name in COMPANY_BLACKLIST or len(name) < 3:
                continue
            # Check if it's already a known company or a reasonable new one
            normalized = COMPANY_NORMALIZE.get(name.lower(), name)
            if normalized in found:
                found[normalized] += 1
            # Only add new companies if mentioned multiple times
    
    return found

def extract_concepts(text):
    """Extract concept/framework mentions."""
    found = {}
    text_lower = text.lower()
    
    for concept in CONCEPT_SEEDS:
        cl = concept.lower()
        # Word boundary search
        pattern = r'\b' + re.escape(cl) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            canonical = normalize_concept(cl)
            found[canonical] = found.get(canonical, 0) + len(matches)
    
    return found

def extract_books(text):
    """Extract book mentions."""
    found = {}
    
    # Ambiguous book titles that are common words - require "book" context
    AMBIGUOUS_BOOKS = {
        "Range", "Accelerate", "Influence", "Inspired", "Empowered",
        "Sprint", "Hooked", "Shape Up",
    }
    
    # First check seed books
    for book in BOOK_SEEDS:
        if book in AMBIGUOUS_BOOKS:
            # Require book context for ambiguous titles
            patterns = [
                rf'(?:book|read|reading|wrote|recommend)\w*\s+.*?\b{re.escape(book)}\b',
                rf'\b{re.escape(book)}\b.*?(?:book|read|wrote|author)',
                rf'["\u201c]{re.escape(book)}["\u201d]',
            ]
            for pat in patterns:
                if re.search(pat, text, re.IGNORECASE):
                    found[book] = found.get(book, 0) + 1
                    break
        else:
            if book.lower() in text.lower():
                found[book] = found.get(book, 0) + 1
    
    # Then use regex patterns
    for pattern in BOOK_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            title = match.group(1).strip()
            if len(title) > 4 and len(title) < 80:
                # Check it's not already a seed book (avoid duplicates)
                already = False
                for seed in found:
                    if seed.lower() == title.lower():
                        already = True
                        break
                if not already:
                    found[title] = found.get(title, 0) + 1
    
    return found

def extract_people(text, known_guests):
    """Extract people mentioned in text."""
    found = {}
    
    # Check for known guest names
    for guest in known_guests:
        if guest == "Lenny Rachitsky":
            continue
        # Search for last name or full name
        parts = guest.split()
        if len(parts) >= 2:
            # Full name match
            if guest in text:
                found[guest] = found.get(guest, 0) + text.count(guest)
            # Last name match (only if fairly unique)
            last = parts[-1]
            if len(last) > 3 and last in text:
                found[guest] = found.get(guest, 0) + max(0, text.count(last) - found.get(guest, 0))
    
    # Also extract from patterns
    well_known_people = [
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
    ]
    
    for person in well_known_people:
        if person == "Lenny Rachitsky":
            continue
        if person in text:
            found[person] = found.get(person, 0) + text.count(person)
    
    return found

# ── Graph Building ──────────────────────────────────────────────────────────

def build_graph():
    index = load_index()
    podcasts = index["podcasts"]
    newsletters = load_newsletters()
    
    # Collect all guest names
    guest_names = set()
    guest_episodes = defaultdict(list)  # guest -> list of episode ids
    episode_dates = {}
    episode_titles = {}
    
    for ep in podcasts:
        guest = ep["guest"]
        # Handle multi-guest episodes
        guests = [g.strip() for g in re.split(r'\s*[+&]\s*', guest)]
        for g in guests:
            # Clean up guest names
            g = re.sub(r'\s+V\d+$', '', g)  # Remove "V2" suffix
            g = re.sub(r'\s+\d+\.\d+$', '', g)  # Remove "4.0" suffix
            guest_names.add(g)
            guest_episodes[g].append(ep["filename"])
        episode_dates[ep["filename"]] = ep["date"]
        episode_titles[ep["filename"]] = ep["title"]
    
    # Also add "Lenny Rachitsky" as host
    guest_names.add("Lenny Rachitsky")
    
    # Nodes and edges
    nodes = {}  # id -> node data
    edges = []  # list of edge objects
    edge_set = set()  # dedup
    
    # Node helper
    def add_node(name, ntype, episode=None, weight=1):
        nid = f"{ntype}:{name}"
        if nid not in nodes:
            nodes[nid] = {
                "id": nid,
                "name": name,
                "type": ntype,
                "episodes": [],
                "weight": 0,
                "connections": 0,
            }
        if episode and episode not in nodes[nid]["episodes"]:
            nodes[nid]["episodes"].append(episode)
        nodes[nid]["weight"] += weight
        return nid
    
    def add_edge(source, target, rel, episode=None, weight=1):
        key = tuple(sorted([source, target])) + (rel,)
        if key not in edge_set:
            edge_set.add(key)
            edges.append({
                "source": source,
                "target": target,
                "relationship": rel,
                "episodes": [episode] if episode else [],
                "weight": weight,
            })
        else:
            # Update existing edge
            for e in edges:
                if tuple(sorted([e["source"], e["target"]])) + (e["relationship"],) == key:
                    if episode and episode not in e["episodes"]:
                        e["episodes"].append(episode)
                    e["weight"] += weight
                    break
    
    # Add guest nodes
    for guest in guest_names:
        if guest == "Lenny Rachitsky":
            continue
        for ep in guest_episodes[guest]:
            add_node(guest, "person", ep)
    
    # Process each podcast
    print(f"Processing {len(podcasts)} podcasts...")
    
    for ep in podcasts:
        filename = ep["filename"]
        text = load_transcript(filename)
        if not text:
            print(f"  Skipping {filename} (not found)")
            continue
        
        guest_raw = ep["guest"]
        ep_guests = [g.strip() for g in re.split(r'\s*[+&]\s*', guest_raw)]
        ep_guests = [re.sub(r'\s+V\d+$', '', g) for g in ep_guests]
        ep_guests = [re.sub(r'\s+\d+\.\d+$', '', g) for g in ep_guests]
        
        print(f"  {filename} ({', '.join(ep_guests)})")
        
        # Extract entities
        companies = extract_companies(text, filename)
        concepts = extract_concepts(text)
        books = extract_books(text)
        people = extract_people(text, guest_names)
        
        # Add company nodes and edges
        for company, count in companies.items():
            if count < 2:
                continue
            cid = add_node(company, "company", filename, count)
            for guest in ep_guests:
                gid = f"person:{guest}"
                add_edge(gid, cid, "discusses", filename, count)
        
        # Add concept nodes and edges
        for concept, count in concepts.items():
            if count < 1:
                continue
            cid = add_node(concept, "concept", filename, count)
            for guest in ep_guests:
                gid = f"person:{guest}"
                add_edge(gid, cid, "discusses", filename, count)
        
        # Add book nodes and edges
        for book, count in books.items():
            bid = add_node(book, "book", filename, count)
            for guest in ep_guests:
                gid = f"person:{guest}"
                add_edge(gid, bid, "recommends", filename, count)
        
        # Add person-to-person edges (guest mentions another guest)
        for person, count in people.items():
            if person in ep_guests:
                continue  # Skip self-references
            pid = add_node(person, "person", filename, count)
            for guest in ep_guests:
                gid = f"person:{guest}"
                add_edge(gid, pid, "mentions", filename, count)
    
    # Process newsletters
    print(f"\nProcessing {len(newsletters)} newsletters...")
    for name, text in newsletters.items():
        ep_id = f"newsletters/{name}"
        
        companies = extract_companies(text, ep_id)
        concepts = extract_concepts(text)
        books = extract_books(text)
        people = extract_people(text, guest_names)
        
        for company, count in companies.items():
            if count < 2:
                continue
            add_node(company, "company", ep_id, count)
        
        for concept, count in concepts.items():
            add_node(concept, "concept", ep_id, count)
        
        for book, count in books.items():
            add_node(book, "book", ep_id, count)
        
        for person, count in people.items():
            add_node(person, "person", ep_id, count)
    
    # ── Post-processing ─────────────────────────────────────────────────────
    
    # Count connections for each node
    for edge in edges:
        if edge["source"] in nodes:
            nodes[edge["source"]]["connections"] += 1
        if edge["target"] in nodes:
            nodes[edge["target"]]["connections"] += 1
    
    # Filter out low-value nodes (mentioned once, no connections beyond 1)
    print("\nFiltering low-confidence entities...")
    filtered_nodes = {}
    for nid, node in nodes.items():
        # Keep all guest nodes
        if node["type"] == "person" and node["name"] in guest_names:
            filtered_nodes[nid] = node
            continue
        # Keep nodes with multiple connections or appearances in multiple episodes
        if node["connections"] >= 2 or len(node["episodes"]) >= 2:
            filtered_nodes[nid] = node
            continue
        # Keep high-weight nodes
        if node["weight"] >= 3:
            filtered_nodes[nid] = node
            continue
    
    # Filter edges to only include nodes that survived
    filtered_edges = [
        e for e in edges
        if e["source"] in filtered_nodes and e["target"] in filtered_nodes
    ]
    
    # Recalculate connections
    for nid in filtered_nodes:
        filtered_nodes[nid]["connections"] = 0
    for edge in filtered_edges:
        if edge["source"] in filtered_nodes:
            filtered_nodes[edge["source"]]["connections"] += 1
        if edge["target"] in filtered_nodes:
            filtered_nodes[edge["target"]]["connections"] += 1
    
    # Remove orphan nodes (zero connections after filtering)
    final_nodes = {nid: n for nid, n in filtered_nodes.items() if n["connections"] > 0}
    final_edges = [
        e for e in filtered_edges
        if e["source"] in final_nodes and e["target"] in final_nodes
    ]
    
    # Add episode metadata to graph
    episode_meta = []
    for ep in podcasts:
        episode_meta.append({
            "id": ep["filename"],
            "title": ep["title"],
            "date": ep["date"],
            "guest": ep["guest"],
        })
    
    # Identify cross-episode connections (most interesting!)
    # An edge that appears in multiple episodes means the same relationship
    # was discussed in different conversations
    cross_episode_edges = []
    for edge in final_edges:
        if len(edge["episodes"]) >= 2:
            edge["cross_episode"] = True
            cross_episode_edges.append(edge)
        else:
            edge["cross_episode"] = False
    
    # Also mark nodes that bridge episodes (appear in 3+ episodes)
    for nid, node in final_nodes.items():
        node["bridge"] = len(node["episodes"]) >= 3
    
    # Stats
    type_counts = Counter(n["type"] for n in final_nodes.values())
    most_connected = sorted(final_nodes.values(), key=lambda n: n["connections"], reverse=True)[:10]
    
    print(f"\n{'='*60}")
    print(f"GRAPH STATISTICS")
    print(f"{'='*60}")
    print(f"Total nodes: {len(final_nodes)}")
    print(f"Total edges: {len(final_edges)}")
    print(f"Cross-episode edges: {len(cross_episode_edges)}")
    print(f"\nBy type:")
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")
    print(f"\nMost connected:")
    for n in most_connected:
        print(f"  {n['name']} ({n['type']}): {n['connections']} connections")
    
    # Build output
    graph = {
        "nodes": list(final_nodes.values()),
        "edges": final_edges,
        "episodes": episode_meta,
        "stats": {
            "total_nodes": len(final_nodes),
            "total_edges": len(final_edges),
            "cross_episode_edges": len(cross_episode_edges),
            "by_type": dict(type_counts),
            "most_connected": [
                {"name": n["name"], "type": n["type"], "connections": n["connections"]}
                for n in most_connected
            ]
        }
    }
    
    output_path = BASE_DIR / "graph.json"
    with open(output_path, "w") as f:
        json.dump(graph, f, indent=2)
    
    print(f"\nGraph written to {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    build_graph()
