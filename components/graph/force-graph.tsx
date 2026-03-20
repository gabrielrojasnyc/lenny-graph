"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import {
  GraphData,
  GraphNode,
  EntityType,
  ENTITY_COLORS,
  getNodeName,
} from "@/lib/graph-data";

interface SimNode extends d3.SimulationNodeDatum, GraphNode {
  x?: number;
  y?: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  weight: number;
}

interface ForceGraphProps {
  data: GraphData;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  visibleTypes: EntityType[];
  minYear?: number;
  maxYear?: number;
  searchHighlight?: string | null;
}

export function ForceGraph({
  data,
  selectedNode,
  onNodeSelect,
  visibleTypes,
  minYear = 2019,
  maxYear = 2026,
  searchHighlight,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getNodeRadius = useCallback((weight: number) => {
    return Math.max(5, Math.min(24, Math.sqrt(weight) * 2.5));
  }, []);

  const getNodeColor = useCallback((type: EntityType) => {
    return ENTITY_COLORS[type];
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Filter nodes by type and time range
    const filteredNodes = data.nodes.filter((node) => {
      if (!visibleTypes.includes(node.type)) return false;
      if (node.episodes && node.episodes.length > 0) {
        const years = node.episodes.map((ep) => {
          const match = ep.match(/\d{4}/);
          return match ? parseInt(match[0]) : 2022;
        });
        const nodeMinYear = Math.min(...years);
        const nodeMaxYear = Math.max(...years);
        return nodeMaxYear >= minYear && nodeMinYear <= maxYear;
      }
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredEdges = data.edges.filter(
      (edge) =>
        filteredNodeIds.has(edge.source as string) &&
        filteredNodeIds.has(edge.target as string)
    );

    // Create simulation nodes and links
    const nodes: SimNode[] = filteredNodes.map((n) => ({ ...n }));
    const links: SimLink[] = filteredEdges.map((e) => ({
      source: e.source as string,
      target: e.target as string,
      weight: e.weight,
    }));

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Add defs for glow effect
    const defs = svg.append("defs");
    
    // Create glow filter for each entity type
    ["person", "company", "book", "concept"].forEach((type) => {
      const filter = defs.append("filter")
        .attr("id", `glow-${type}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "coloredBlur");
      
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Create container groups
    const g = svg.append("g");
    const linkGroup = g.append("g").attr("class", "links");
    const nodeGroup = g.append("g").attr("class", "nodes");
    const labelGroup = g.append("g").attr("class", "labels");

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(100)
          .strength((d) => Math.min(0.4, d.weight / 15))
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) => getNodeRadius(d.weight) + 4)
      );

    simulationRef.current = simulation;

    // Draw links - subtle curved lines
    const link = linkGroup
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "var(--md-outline-variant)")
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", (d) => Math.max(0.5, Math.sqrt(d.weight) * 0.3));

    // Draw nodes with gradient-like appearance
    const node = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => getNodeRadius(d.weight))
      .attr("fill", (d) => getNodeColor(d.type))
      .attr("stroke", (d) => getNodeColor(d.type))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.3)
      .attr("cursor", "pointer")
      .attr("opacity", (d) => {
        if (searchHighlight && d.id !== searchHighlight) return 0.15;
        return 0.85;
      })
      .style("filter", (d) => `url(#glow-${d.type})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeSelect(d.id);
      })
      .on("mouseenter", function (event, d) {
        setHoveredNode(d.id);
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", getNodeRadius(d.weight) * 1.2)
          .attr("opacity", 1);

        // Highlight connected nodes and links
        const connectedIds = new Set<string>();
        links.forEach((l) => {
          const sourceId =
            typeof l.source === "object" ? (l.source as SimNode).id : l.source;
          const targetId =
            typeof l.target === "object" ? (l.target as SimNode).id : l.target;
          if (sourceId === d.id) connectedIds.add(targetId);
          if (targetId === d.id) connectedIds.add(sourceId);
        });

        node.attr("opacity", (n) => {
          if (n.id === d.id || connectedIds.has(n.id)) return 1;
          return 0.1;
        });

        link
          .attr("stroke-opacity", (l) => {
            const sourceId =
              typeof l.source === "object"
                ? (l.source as SimNode).id
                : l.source;
            const targetId =
              typeof l.target === "object"
                ? (l.target as SimNode).id
                : l.target;
            if (sourceId === d.id || targetId === d.id) return 0.6;
            return 0.05;
          })
          .attr("stroke", (l) => {
            const sourceId =
              typeof l.source === "object"
                ? (l.source as SimNode).id
                : l.source;
            const targetId =
              typeof l.target === "object"
                ? (l.target as SimNode).id
                : l.target;
            if (sourceId === d.id || targetId === d.id)
              return getNodeColor(d.type);
            return "var(--md-outline-variant)";
          });
      })
      .on("mouseleave", function (event, d) {
        setHoveredNode(null);
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", getNodeRadius(d.weight))
          .attr("opacity", searchHighlight && d.id !== searchHighlight ? 0.15 : 0.85);

        node.attr("opacity", (n) => {
          if (searchHighlight && n.id !== searchHighlight) return 0.15;
          return 0.85;
        });

        link
          .attr("stroke-opacity", 0.15)
          .attr("stroke", "var(--md-outline-variant)");
      });

    // Only show labels for top weighted nodes or hovered
    const topNodes = nodes.filter((n) => n.weight > 25);
    
    const labels = labelGroup
      .selectAll("text")
      .data(topNodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getNodeRadius(d.weight) + 16)
      .attr("fill", "var(--md-on-surface)")
      .attr("font-size", "10px")
      .attr("font-weight", 500)
      .attr("letter-spacing", "0.02em")
      .attr("pointer-events", "none")
      .attr("opacity", 0.7)
      .text((d) => {
        const name = getNodeName(d);
        return name.length > 20 ? name.slice(0, 18) + "..." : name;
      });

    // Drag behavior
    const drag = d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Update positions on tick with curved links
    simulation.on("tick", () => {
      link.attr("d", (d) => {
        const source = d.source as SimNode;
        const target = d.target as SimNode;
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    // Click on background to deselect
    svg.on("click", () => {
      onNodeSelect(null);
    });

    // Center on search highlight
    if (searchHighlight) {
      const targetNode = nodes.find((n) => n.id === searchHighlight);
      if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
        setTimeout(() => {
          svg
            .transition()
            .duration(750)
            .call(
              zoom.transform,
              d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(2)
                .translate(-targetNode.x!, -targetNode.y!)
            );
        }, 500);
      }
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [
    data,
    visibleTypes,
    minYear,
    maxYear,
    searchHighlight,
    onNodeSelect,
    getNodeRadius,
    getNodeColor,
  ]);

  // Highlight selected node
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll("circle").attr("stroke-width", (d: unknown) => {
      const node = d as SimNode;
      return node.id === selectedNode ? 4 : 2;
    });
  }, [selectedNode]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
      
      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="glass-card rounded-xl px-4 py-3 shadow-lg border border-[var(--md-outline-variant)]/30">
            <p className="title-small text-[var(--md-on-surface)]">
              {getNodeName(data.nodes.find(n => n.id === hoveredNode) || { id: hoveredNode, type: "person", weight: 0 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
