"use client";

import { useState, useEffect, useMemo } from "react";

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
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

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
      <div className="flex-1 flex items-center justify-center bg-[var(--md-surface)]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--md-primary)]/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-[var(--md-primary)] border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="title-medium text-[var(--md-on-surface)]">
              Loading Knowledge Graph
            </p>
            <p className="body-small text-[var(--md-on-surface-variant)] mt-1">
              Preparing 530 nodes and 6,765 connections...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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

      {/* Controls bar - refined styling */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 px-4 md:px-6 py-4",
          "bg-[var(--md-surface-container)]/50 backdrop-blur-sm",
          "border-b border-[var(--md-outline-variant)]/30"
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

        <div className="w-52 hidden sm:block">
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
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[var(--md-surface)] via-[var(--md-surface-container-lowest)] to-[var(--md-surface)]">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(var(--md-outline-variant) 1px, transparent 1px),
              linear-gradient(90deg, var(--md-outline-variant) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        
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

        {/* FAB controls - refined */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={handleReset}
            className={cn(
              "flex h-14 w-14 items-center justify-center",
              "rounded-2xl",
              "bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]",
              "border border-[var(--md-outline-variant)]/30",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95"
            )}
            title="Reset view"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {/* Stats badge */}
        <div className="absolute bottom-6 left-6 hidden md:block">
          <div className="glass-card rounded-xl px-4 py-3 border border-[var(--md-outline-variant)]/20">
            <p className="label-small text-[var(--md-on-surface-variant)]">
              Showing {visibleTypes.length} of 4 entity types
            </p>
            <p className="body-small text-[var(--md-on-surface)] mt-0.5">
              {data?.nodes.filter(n => visibleTypes.includes(n.type)).length || 0} visible nodes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
