"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Card } from "@/components/ui/card";
import { PathResult } from "@/components/connections/path-result";
import {
  GraphData,
  GraphNode,
  PathsIndex,
  loadGraphData,
  loadPathsIndex,
  getNodeName,
} from "@/lib/graph-data";
import { findShortestPath, getRandomPair } from "@/lib/pathfinding";
import { cn } from "@/lib/utils";
import { Shuffle, Search, GitBranch } from "lucide-react";

export default function ConnectionsPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [pathsIndex, setPathsIndex] = useState<PathsIndex | null>(null);
  const [loading, setLoading] = useState(true);

  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | null>(null);

  useEffect(() => {
    Promise.all([loadGraphData(), loadPathsIndex()])
      .then(([graphData, paths]) => {
        setData(graphData);
        setPathsIndex(paths);
      })
      .finally(() => setLoading(false));
  }, []);

  const nodeMap = useMemo(() => {
    if (!data) return new Map<string, GraphNode>();
    return new Map(data.nodes.map((n) => [n.id, n]));
  }, [data]);

  const getSuggestions = (query: string) => {
    if (!data || query.length < 2) return [];
    const q = query.toLowerCase();
    return data.nodes
      .filter((node) => getNodeName(node).toLowerCase().includes(q))
      .slice(0, 8)
      .map((node) => ({
        id: node.id,
        label: getNodeName(node),
        type: node.type,
      }));
  };

  const handleFindPath = () => {
    if (!startNode || !endNode || !pathsIndex) return;
    const pathResult = findShortestPath(startNode, endNode, pathsIndex);
    setResult(pathResult.path);
  };

  const handleRandomPair = () => {
    if (!data || !pathsIndex) return;
    const nodeIds = data.nodes.map((n) => n.id);
    const pair = getRandomPair(nodeIds, pathsIndex);
    if (pair) {
      const [start, end] = pair;
      setStartNode(start);
      setEndNode(end);
      const startNodeData = nodeMap.get(start);
      const endNodeData = nodeMap.get(end);
      setStartQuery(startNodeData ? getNodeName(startNodeData) : start);
      setEndQuery(endNodeData ? getNodeName(endNodeData) : end);
      const pathResult = findShortestPath(start, end, pathsIndex);
      setResult(pathResult.path);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--md-primary)] border-t-transparent animate-spin" />
            <p className="body-large text-[var(--md-on-surface-variant)]">
              Loading data...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopAppBar
        title="Six Degrees"
        subtitle="Find connections between any two entities"
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
          {/* Intro card */}
          <Card variant="filled" className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full",
                  "bg-[var(--md-primary)] text-[var(--md-on-primary)]"
                )}
              >
                <GitBranch className="h-6 w-6" />
              </div>
              <div>
                <h2 className="title-large text-[var(--md-on-surface)] mb-2">
                  Find Hidden Connections
                </h2>
                <p className="body-medium text-[var(--md-on-surface-variant)]">
                  Discover how any two people, companies, books, or concepts are
                  connected through the Lenny&apos;s Podcast knowledge graph.
                </p>
              </div>
            </div>
          </Card>

          {/* Search inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-medium text-[var(--md-on-surface-variant)] mb-2 block">
                Starting Point
              </label>
              <SearchInput
                value={startQuery}
                onChange={(v) => {
                  setStartQuery(v);
                  if (!v) setStartNode(null);
                }}
                onSelect={(id) => {
                  setStartNode(id);
                  const node = nodeMap.get(id);
                  setStartQuery(node ? getNodeName(node) : id);
                }}
                suggestions={getSuggestions(startQuery)}
                placeholder="Search for a node..."
              />
            </div>
            <div>
              <label className="label-medium text-[var(--md-on-surface-variant)] mb-2 block">
                Destination
              </label>
              <SearchInput
                value={endQuery}
                onChange={(v) => {
                  setEndQuery(v);
                  if (!v) setEndNode(null);
                }}
                onSelect={(id) => {
                  setEndNode(id);
                  const node = nodeMap.get(id);
                  setEndQuery(node ? getNodeName(node) : id);
                }}
                suggestions={getSuggestions(endQuery)}
                placeholder="Search for a node..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFindPath}
              disabled={!startNode || !endNode}
              className={cn(
                "state-layer flex items-center gap-2 px-6 py-3 rounded-full",
                "label-large transition-all duration-200",
                startNode && endNode
                  ? "bg-[var(--md-primary)] text-[var(--md-on-primary)]"
                  : "bg-[var(--md-surface-container-highest)] text-[var(--md-on-surface-variant)]"
              )}
            >
              <Search className="h-5 w-5" />
              Find Path
            </button>
            <button
              onClick={handleRandomPair}
              className={cn(
                "state-layer flex items-center gap-2 px-6 py-3 rounded-full",
                "label-large",
                "border border-[var(--md-outline)]",
                "text-[var(--md-primary)]",
                "hover:bg-[var(--md-primary-container)]",
                "transition-colors duration-200"
              )}
            >
              <Shuffle className="h-5 w-5" />
              Random Pair
            </button>
          </div>

          {/* Result */}
          {result !== null && (
            <div className="pt-4">
              <PathResult path={result} nodeMap={nodeMap} />
            </div>
          )}

          {/* Empty state */}
          {result === null && (
            <Card
              variant="outlined"
              className="text-center py-12 border-dashed"
            >
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-[var(--md-outline)]" />
              <p className="body-large text-[var(--md-on-surface-variant)]">
                Select two nodes to find the path between them
              </p>
              <p className="body-medium text-[var(--md-on-surface-variant)] mt-2">
                or click &quot;Random Pair&quot; to discover surprising
                connections
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
