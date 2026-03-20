export type EntityType = "person" | "company" | "book" | "concept";

export interface GraphNode {
  id: string;
  type: EntityType;
  weight: number;
  episodes?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: {
    total_episodes: number;
    total_newsletters: number;
    date_range: [string, string];
  };
}

export interface TopicTimelineEntry {
  date: string;
  title: string;
  guest?: string;
  filename?: string;
  topics: Record<string, number>;
}

export interface TopicTimelineData {
  categories: string[];
  episodes: TopicTimelineEntry[];
}

export interface PathsIndex {
  [nodeId: string]: string[];
}

// Sophisticated muted color palette
export const ENTITY_COLORS: Record<EntityType, string> = {
  person: "#7C9EB2",    // Slate blue
  company: "#6B9B7A",   // Sage green
  book: "#C4956A",      // Warm terracotta
  concept: "#9B7AA0",   // Dusty purple
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  person: "People",
  company: "Companies",
  book: "Books",
  concept: "Concepts",
};

// Refined topic color palette - matching actual data categories
export const TOPIC_COLORS: Record<string, string> = {
  "AI/ML": "#6B8AAE",
  "Growth": "#6B9B7A",
  "Product": "#7BA3C4",
  "Leadership": "#B07A8A",
  "Design & UX": "#C4A86B",
  "Metrics": "#8B7AAE",
  "Strategy": "#6B9B9B",
  "Startups": "#C4886B",
  "Go-to-Market": "#A07AAE",
  "Engineering": "#7A9B6B",
};

export async function loadGraphData(): Promise<GraphData> {
  const response = await fetch("/graph.json");
  return response.json();
}

export async function loadTopicTimeline(): Promise<TopicTimelineData> {
  const response = await fetch("/topic_timeline.json");
  return response.json();
}

export async function loadPathsIndex(): Promise<PathsIndex> {
  const response = await fetch("/paths_index.json");
  return response.json();
}

export function formatEntityName(id: string): string {
  // Remove type prefix if present (e.g., "person:John Doe" -> "John Doe")
  const name = id.includes(":") ? id.split(":").slice(1).join(":") : id;
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getNodeName(node: GraphNode): string {
  // Use the name field if available, otherwise format the id
  return (node as { name?: string }).name || formatEntityName(node.id);
}

export function getEntityIcon(type: EntityType): string {
  switch (type) {
    case "person":
      return "user";
    case "company":
      return "building-2";
    case "book":
      return "book-open";
    case "concept":
      return "lightbulb";
  }
}
