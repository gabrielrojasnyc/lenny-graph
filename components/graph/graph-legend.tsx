"use client";

import { cn } from "@/lib/utils";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { EntityType, ENTITY_COLORS, ENTITY_LABELS } from "@/lib/graph-data";
import { User, Building2, BookOpen, Lightbulb } from "lucide-react";

const EntityIcon = ({ type }: { type: EntityType }) => {
  const iconProps = { className: "h-4 w-4" };
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

interface GraphLegendProps {
  visibleTypes: EntityType[];
  onToggleType: (type: EntityType) => void;
  className?: string;
}

const allTypes: EntityType[] = ["person", "company", "book", "concept"];

export function GraphLegend({
  visibleTypes,
  onToggleType,
  className,
}: GraphLegendProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ChipGroup>
        {allTypes.map((type) => (
          <Chip
            key={type}
            label={ENTITY_LABELS[type]}
            selected={visibleTypes.includes(type)}
            onClick={() => onToggleType(type)}
            color={ENTITY_COLORS[type]}
            icon={<EntityIcon type={type} />}
          />
        ))}
      </ChipGroup>
    </div>
  );
}
