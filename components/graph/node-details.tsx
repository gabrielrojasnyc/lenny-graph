"use client";

import { X, User, Building2, BookOpen, Lightbulb, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GraphData,
  GraphNode,
  EntityType,
  ENTITY_COLORS,
  getNodeName,
} from "@/lib/graph-data";

const EntityIcon = ({ type }: { type: EntityType }) => {
  const iconProps = { className: "h-5 w-5" };
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
        "rounded-[var(--radius-lg)]",
        "bg-[var(--md-surface-container)]",
        "shadow-[var(--shadow-3)]",
        "overflow-hidden flex flex-col"
      )}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 border-b border-[var(--md-outline-variant)]"
        style={{ backgroundColor: ENTITY_COLORS[node.type] + "20" }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: ENTITY_COLORS[node.type] }}
        >
          <EntityIcon type={node.type} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="title-medium text-[var(--md-on-surface)] truncate">
            {getNodeName(node)}
          </h3>
          <p className="label-medium text-[var(--md-on-surface-variant)] capitalize">
            {node.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "state-layer flex h-8 w-8 items-center justify-center rounded-full",
            "text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-[var(--md-outline-variant)]">
        <div>
          <p className="headline-small text-[var(--md-on-surface)]">
            {connections.length}
          </p>
          <p className="body-small text-[var(--md-on-surface-variant)]">
            Connections
          </p>
        </div>
        <div>
          <p className="headline-small text-[var(--md-on-surface)]">
            {node.episodes?.length || 0}
          </p>
          <p className="body-small text-[var(--md-on-surface-variant)]">
            Episodes
          </p>
        </div>
      </div>

      {/* Connections list */}
      <div className="flex-1 overflow-auto p-4">
        <h4 className="label-large text-[var(--md-on-surface-variant)] mb-3 flex items-center gap-2">
          <Link className="h-4 w-4" />
          Related
        </h4>
        <div className="space-y-4">
          {Object.entries(connectionsByType).map(([type, conns]) => (
            <div key={type}>
              <p className="label-small text-[var(--md-on-surface-variant)] mb-2 capitalize">
                {type}s ({conns.length})
              </p>
              <div className="space-y-1">
                {conns.slice(0, 5).map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => onNodeSelect(conn.id)}
                    className={cn(
                      "state-layer w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]",
                      "text-left hover:bg-[var(--md-surface-container-high)]"
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ENTITY_COLORS[conn.node!.type] }}
                    />
                    <span className="body-medium text-[var(--md-on-surface)] truncate flex-1">
                      {getNodeName(conn.node!)}
                    </span>
                    <span className="label-small text-[var(--md-on-surface-variant)]">
                      {conn.weight}
                    </span>
                  </button>
                ))}
                {conns.length > 5 && (
                  <p className="body-small text-[var(--md-on-surface-variant)] px-3 py-1">
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
