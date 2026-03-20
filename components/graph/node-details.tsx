"use client";

import { X, User, Building2, BookOpen, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GraphData,
  GraphNode,
  EntityType,
  ENTITY_COLORS,
  getNodeName,
} from "@/lib/graph-data";

const EntityIcon = ({ type, className }: { type: EntityType; className?: string }) => {
  const iconProps = { className: cn("h-5 w-5", className) };
  switch (type) {
    case "person":
      return <User {...iconProps} />;
    case "company":
      return <Building2 {...iconProps} />;
    case "book":
      return <BookOpen {...iconProps} />;
    case "concept":
      return <Lightbulb {...iconProps} />;
  }
};

interface NodeDetailsProps {
  node: GraphNode;
  data: GraphData;
  onClose: () => void;
  onNodeSelect: (nodeId: string) => void;
}

export function NodeDetails({
  node,
  data,
  onClose,
  onNodeSelect,
}: NodeDetailsProps) {
  // Get connected nodes
  const connections = data.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const connectedId = e.source === node.id ? e.target : e.source;
      const connectedNode = data.nodes.find((n) => n.id === connectedId);
      return {
        id: connectedId,
        node: connectedNode,
        weight: e.weight,
      };
    })
    .filter((c) => c.node)
    .sort((a, b) => b.weight - a.weight);

  const connectionsByType = connections.reduce(
    (acc, conn) => {
      const type = conn.node!.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(conn);
      return acc;
    },
    {} as Record<EntityType, typeof connections>
  );

  return (
    <div
      className={cn(
        "absolute top-4 right-4 z-10",
        "w-80 max-h-[calc(100%-2rem)]",
        "rounded-2xl",
        "bg-[var(--md-surface-container)]/95 backdrop-blur-xl",
        "border border-[var(--md-outline-variant)]/20",
        "shadow-2xl",
        "overflow-hidden flex flex-col"
      )}
    >
      {/* Header */}
      <div className="relative p-5">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${ENTITY_COLORS[node.type]}, transparent)` 
          }}
        />
        
        <div className="relative flex items-start gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-lg"
            style={{ 
              backgroundColor: ENTITY_COLORS[node.type],
              boxShadow: `0 8px 20px -4px ${ENTITY_COLORS[node.type]}60`
            }}
          >
            <EntityIcon type={node.type} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--md-on-surface)] truncate">
              {getNodeName(node)}
            </h3>
            <p className="text-xs text-[var(--md-on-surface-variant)] capitalize mt-0.5">
              {node.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]",
              "hover:bg-[var(--md-surface-container-high)] transition-colors"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-4">
        <div className="p-3 rounded-xl bg-[var(--md-surface-container-high)]/50">
          <p className="text-2xl font-bold text-[var(--md-on-surface)]">
            {connections.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--md-on-surface-variant)]">
            Connections
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--md-surface-container-high)]/50">
          <p className="text-2xl font-bold text-[var(--md-on-surface)]">
            {node.episodes?.length || 0}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--md-on-surface-variant)]">
            Episodes
          </p>
        </div>
      </div>

      {/* Connections list */}
      <div className="flex-1 overflow-auto px-5 pb-5">
        <h4 className="text-[10px] uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-3">
          Related entities
        </h4>
        <div className="space-y-4">
          {Object.entries(connectionsByType).map(([type, conns]) => (
            <div key={type}>
              <p className="text-xs font-medium text-[var(--md-on-surface-variant)] mb-2 capitalize flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ENTITY_COLORS[type as EntityType] }}
                />
                {type}s
                <span className="text-[var(--md-outline)]">({conns.length})</span>
              </p>
              <div className="space-y-0.5">
                {conns.slice(0, 5).map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => onNodeSelect(conn.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
                      "text-left group",
                      "hover:bg-[var(--md-surface-container-high)] transition-colors"
                    )}
                  >
                    <span className="text-sm text-[var(--md-on-surface)] truncate flex-1">
                      {getNodeName(conn.node!)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--md-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                {conns.length > 5 && (
                  <p className="text-xs text-[var(--md-on-surface-variant)] px-3 py-1">
                    +{conns.length - 5} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
