# The Lenny Graph

## What
An interactive knowledge graph of Lenny's Podcast universe — mapping people, companies, books, and concepts, showing how ideas propagate and who influences whom.

## Architecture
1. **Extract** — NLP pipeline over 50 transcripts → entities (people, companies, books, concepts)
2. **Connect** — Co-occurrence within episodes, cross-episode references, direct mentions
3. **Visualize** — Interactive D3.js force-directed graph, filterable by entity type, time, episode

## Entity Types
- **People** — guests, people mentioned by guests
- **Companies** — companies discussed, worked at, referenced
- **Books** — books recommended or referenced
- **Concepts** — frameworks, mental models, recurring ideas

## Edge Types
- **co-appearance** — two entities mentioned in same episode
- **direct-reference** — one guest mentions another person/company by name
- **works-at** — person → company relationship
- **recommends** — guest → book/concept

## Tech Stack
- Python for extraction (spacy + custom rules)
- JSON graph intermediate format
- HTML + D3.js for visualization (single deployable page)

## Deliverable
Single `index.html` that loads the graph JSON and renders an interactive, explorable network.
