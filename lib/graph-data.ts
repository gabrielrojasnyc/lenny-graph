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
  episode: string;
  date: string;
  title: string;
  topics: Record<string, number>;
}

export interface PathsIndex {
  [nodeId: string]: string[];
}

export const ENTITY_COLORS: Record<EntityType, string> = {
  person: "var(--color-entity-person)",
  company: "var(--color-entity-company)",
  book: "var(--color-entity-book)",
  concept: "var(--color-entity-concept)",
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  person: "People",
  company: "Companies",
  book: "Books",
  concept: "Concepts",
};

export const TOPIC_COLORS: Record<string, string> = {
  "AI & ML": "var(--color-topic-ai)",
  "Growth & Marketing": "var(--color-topic-growth)",
  "Product Management": "var(--color-topic-product)",
  "Leadership & Management": "var(--color-topic-leadership)",
  "Company Culture": "var(--color-topic-culture)",
  "Strategy & Business": "var(--color-topic-strategy)",
  "Hiring & Talent": "var(--color-topic-hiring)",
  "Metrics & Analytics": "var(--color-topic-metrics)",
  "Psychology & Behavior": "var(--color-topic-psychology)",
  "Fundraising & Finance": "var(--color-topic-fundraising)",
};

export async function loadGraphData(): Promise<GraphData> {
  const response = await fetch("/graph.json");
  return response.json();
}

export async function loadTopicTimeline(): Promise<TopicTimelineEntry[]> {
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
