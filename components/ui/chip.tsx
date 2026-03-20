"use client";

import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  onClick,
  color,
  icon,
  className,
}: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "state-layer inline-flex items-center gap-2",
        "h-8 px-4 rounded-[var(--radius-sm)]",
        "label-large transition-all duration-200",
        "border",
        selected
          ? "bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)] border-transparent"
          : "bg-transparent text-[var(--md-on-surface-variant)] border-[var(--md-outline)]",
        "hover:shadow-[var(--shadow-1)]",
        className
      )}
      style={
        color && selected
          ? {
              backgroundColor: color,
              color: "#fff",
              borderColor: "transparent",
            }
          : undefined
      }
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  );
}

interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ChipGroup({ children, className }: ChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>
  );
}
