import { PathsIndex } from "./graph-data";

export interface PathResult {
  path: string[];
  found: boolean;
}

/**
 * Breadth-First Search to find shortest path between two nodes
 */
export function findShortestPath(
  start: string,
  end: string,
  adjacencyList: PathsIndex
): PathResult {
  if (start === end) {
    return { path: [start], found: true };
  }

  if (!adjacencyList[start] || !adjacencyList[end]) {
    return { path: [], found: false };
  }

  const visited = new Set<string>();
  const queue: Array<{ node: string; path: string[] }> = [
    { node: start, path: [start] },
  ];

  visited.add(start);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    const neighbors = adjacencyList[node] || [];

    for (const neighbor of neighbors) {
      if (neighbor === end) {
        return { path: [...path, neighbor], found: true };
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return { path: [], found: false };
}

/**
 * Get a random pair of nodes that have a valid path between them
 */
export function getRandomPair(
  nodes: string[],
  adjacencyList: PathsIndex
): [string, string] | null {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const start = nodes[Math.floor(Math.random() * nodes.length)];
    const end = nodes[Math.floor(Math.random() * nodes.length)];

    if (start !== end) {
      const result = findShortestPath(start, end, adjacencyList);
      if (result.found && result.path.length >= 3 && result.path.length <= 7) {
        return [start, end];
      }
    }

    attempts++;
  }

  return null;
}
