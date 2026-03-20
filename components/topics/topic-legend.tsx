"use client";

import { Chip, ChipGroup } from "@/components/ui/chip";
import { TOPIC_COLORS } from "@/lib/graph-data";

interface TopicLegendProps {
  visibleTopics: string[];
  onToggleTopic: (topic: string) => void;
  allTopics: string[];
  className?: string;
}

export function TopicLegend({
  visibleTopics,
  onToggleTopic,
  allTopics,
  className,
}: TopicLegendProps) {
  return (
    <ChipGroup className={`flex-wrap ${className || ""}`}>
      {allTopics.map((topic) => (
        <Chip
          key={topic}
          label={topic}
          selected={visibleTopics.includes(topic)}
          onClick={() => onToggleTopic(topic)}
          color={TOPIC_COLORS[topic] || "#888"}
        />
      ))}
    </ChipGroup>
  );
}
