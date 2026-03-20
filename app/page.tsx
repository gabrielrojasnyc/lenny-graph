"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Slider } from "@/components/ui/slider";
import { ForceGraph } from "@/components/graph/force-graph";
import { NodeDetails } from "@/components/graph/node-details";
import { GraphLegend } from "@/components/graph/graph-legend";
import {
  GraphData,
  EntityType,
  loadGraphData,
  getNodeName,
} from "@/lib/graph-data";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<EntityType[]>([
    "person",
    "company",
    "book",
    "concept",
  ]);
  const [yearRange, setYearRange] = useState(2026);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHighlight, setSearchHighlight] = useState<string | null>(null);

  useEffect(() => {
    loadGraphData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const suggestions = useMemo(() => {
    if (!data || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return data.nodes
      .filter((node) => {
        const name = getNodeName(node).toLowerCase();
        return name.includes(query);
      })
      .slice(0, 10)
      .map((node) => ({
        id: node.id,
        label: getNodeName(node),
        type: node.type,
      }));
  }, [data, searchQuery]);

  const handleToggleType = (type: EntityType) => {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSearchSelect = (nodeId: string) => {
    setSearchHighlight(nodeId);
    setSelectedNode(nodeId);
    // Clear highlight after animation
    setTimeout(() => setSearchHighlight(null), 2000);
  };

  const handleReset = () => {
    setSelectedNode(null);
    setSearchHighlight(null);
    setSearchQuery("");
    setVisibleTypes(["person", "company", "book", "concept"]);
    setYearRange(2026);
  };

  const selectedNodeData = useMemo(() => {
    if (!data || !selectedNode) return null;
    return data.nodes.find((n) => n.id === selectedNode) || null;
  }, [data, selectedNode]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--md-primary)] border-t-transparent animate-spin" />
            <p className="body-large text-[var(--md-on-surface-variant)]">
              Loading knowledge graph...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopAppBar
        title="The Lenny Graph"
        subtitle={`${data?.nodes.length || 0} nodes · ${data?.edges.length || 0} connections`}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSelect={handleSearchSelect}
          suggestions={suggestions}
          placeholder="Search nodes..."
          className="w-64 hidden lg:block"
        />
      </TopAppBar>

      {/* Controls bar */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 px-4 md:px-6 py-3",
          "bg-[var(--md-surface-container-low)]",
          "border-b border-[var(--md-outline-variant)]"
        )}
      >
        {/* Mobile search */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSelect={handleSearchSelect}
          suggestions={suggestions}
          placeholder="Search nodes..."
          className="w-full lg:hidden"
        />

        <GraphLegend
          visibleTypes={visibleTypes}
          onToggleType={handleToggleType}
          className="flex-wrap"
        />

        <div className="flex-1" />

        <div className="w-48">
          <Slider
            value={yearRange}
            min={2019}
            max={2026}
            onChange={setYearRange}
            label="Through"
            formatValue={(v) => v.toString()}
          />
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative overflow-hidden">
        {data && (
          <ForceGraph
            data={data}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            visibleTypes={visibleTypes}
            minYear={2019}
            maxYear={yearRange}
            searchHighlight={searchHighlight}
          />
        )}

        {/* Node details panel */}
        {selectedNodeData && data && (
          <NodeDetails
            node={selectedNodeData}
            data={data}
            onClose={() => setSelectedNode(null)}
            onNodeSelect={setSelectedNode}
          />
        )}

        {/* FAB controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button
            onClick={handleReset}
            className={cn(
              "state-layer flex h-14 w-14 items-center justify-center",
              "rounded-[var(--radius-lg)]",
              "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]",
              "shadow-[var(--shadow-3)]",
              "hover:shadow-[var(--shadow-4)]",
              "transition-shadow duration-200"
            )}
            title="Reset view"
          >
            <RotateCcw className="h-6 w-6" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
