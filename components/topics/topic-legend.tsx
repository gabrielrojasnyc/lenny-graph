"use client";

import { Chip, ChipGroup } from "@/components/ui/chip";
import { TOPIC_COLORS } from "@/lib/graph-data";

interface TopicLegendProps {
  visibleTopics: string[];
  onToggleTopic: (topic: string) => void;
  className?: string;
}

const allTopics = Object.keys(TOPIC_COLORS);

export function TopicLegend({
  visibleTopics,
  onToggleTopic,
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
          color={TOPIC_COLORS[topic]}
        />
      ))}
    </ChipGroup>
  );
}
