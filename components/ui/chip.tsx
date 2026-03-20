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
        "chip-refined inline-flex items-center gap-2",
        "h-9 px-4 rounded-full",
        "text-sm font-medium tracking-wide",
        "transition-all duration-200 ease-out",
        "border border-transparent",
        selected
          ? "text-white shadow-md"
          : "bg-[var(--md-surface-container-high)]/60 text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)]/50",
        "hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      style={
        selected && color
          ? {
              backgroundColor: color,
              boxShadow: `0 4px 14px -3px ${color}60`,
            }
          : selected
          ? {
              backgroundColor: "var(--md-primary)",
              boxShadow: "0 4px 14px -3px var(--md-primary)",
            }
          : undefined
      }
    >
      {icon && <span className="w-4 h-4 opacity-80">{icon}</span>}
      <span>{label}</span>
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
