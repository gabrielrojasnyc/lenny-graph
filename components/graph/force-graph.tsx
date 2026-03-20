"use client";

import { useEffect, useRef, useCallback } from "react";
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

  const getNodeRadius = useCallback((weight: number) => {
    return Math.max(4, Math.min(20, Math.sqrt(weight) * 2));
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

    // Create container groups
    const g = svg.append("g");
    const linkGroup = g.append("g").attr("class", "links");
    const nodeGroup = g.append("g").attr("class", "nodes");

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
          .distance(80)
          .strength((d) => Math.min(0.5, d.weight / 10))
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) => getNodeRadius(d.weight) + 2)
      );

    simulationRef.current = simulation;

    // Draw links
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--md-outline-variant)")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", (d) => Math.max(0.5, Math.sqrt(d.weight) * 0.5));

    // Draw nodes
    const node = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => getNodeRadius(d.weight))
      .attr("fill", (d) => getNodeColor(d.type))
      .attr("stroke", "var(--md-surface)")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .attr("opacity", (d) => {
        if (searchHighlight && d.id !== searchHighlight) return 0.2;
        return 1;
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeSelect(d.id);
      })
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", getNodeRadius(d.weight) * 1.3);

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
          return 0.2;
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
            if (sourceId === d.id || targetId === d.id) return 0.8;
            return 0.1;
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
              return "var(--md-primary)";
            return "var(--md-outline-variant)";
          });
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", getNodeRadius(d.weight));

        node.attr("opacity", (n) => {
          if (searchHighlight && n.id !== searchHighlight) return 0.2;
          return 1;
        });

        link
          .attr("stroke-opacity", 0.3)
          .attr("stroke", "var(--md-outline-variant)");
      });

    // Add labels for larger nodes
    const labels = nodeGroup
      .selectAll("text")
      .data(nodes.filter((n) => n.weight > 15))
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getNodeRadius(d.weight) + 14)
      .attr("fill", "var(--md-on-surface)")
      .attr("font-size", "11px")
      .attr("font-weight", 500)
      .attr("pointer-events", "none")
      .text((d) => getNodeName(d));

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

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

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
      return node.id === selectedNode ? 3 : 1.5;
    });
  }, [selectedNode]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
