"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  GraphNode,
  EntityType,
  ENTITY_COLORS,
  getNodeName,
} from "@/lib/graph-data";
import { User, Building2, BookOpen, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";

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

interface PathResultProps {
  path: string[];
  nodeMap: Map<string, GraphNode>;
}

export function PathResult({ path, nodeMap }: PathResultProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= path.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [path]);

  if (path.length === 0) {
    return (
      <Card variant="outlined" className="text-center py-8">
        <p className="body-large text-[var(--md-on-surface-variant)]">
          No path found between these nodes
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="title-medium text-[var(--md-on-surface)]">
          {path.length - 1} degrees of separation
        </p>
        <Link
          href="/"
          className={cn(
            "label-large text-[var(--md-primary)]",
            "hover:text-[var(--md-primary-container)]",
            "transition-colors"
          )}
        >
          View in Graph
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {path.map((nodeId, index) => {
          const node = nodeMap.get(nodeId);
          const isVisible = index < visibleCount;

          return (
            <div
              key={`${nodeId}-${index}`}
              className="flex items-center gap-2"
            >
              <Card
                variant="filled"
                className={cn(
                  "flex items-center gap-3 p-3",
                  "transition-all duration-300",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{
                    backgroundColor: node
                      ? ENTITY_COLORS[node.type]
                      : "var(--md-outline)",
                  }}
                >
                  {node && <EntityIcon type={node.type} />}
                </div>
                <div>
                  <p className="title-small text-[var(--md-on-surface)]">
                    {node ? getNodeName(node) : nodeId}
                  </p>
                  <p className="label-small text-[var(--md-on-surface-variant)] capitalize">
                    {node?.type || "Unknown"}
                  </p>
                </div>
              </Card>

              {index < path.length - 1 && (
                <ArrowRight
                  className={cn(
                    "h-5 w-5 text-[var(--md-outline)]",
                    "transition-opacity duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
