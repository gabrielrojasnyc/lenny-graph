"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function Slider({
  value,
  min,
  max,
  onChange,
  label,
  formatValue,
  className,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)]">
            {label}
          </span>
          <span className="text-sm font-semibold text-[var(--md-on-surface)] tabular-nums">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-[var(--md-surface-container-highest)]/50 rounded-full" />
        
        {/* Active track with gradient */}
        <div
          className="absolute h-1.5 rounded-full"
          style={{ 
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--md-primary), var(--md-tertiary))'
          }}
        />

        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute w-4 h-4 rounded-full",
            "bg-white border-2 border-[var(--md-primary)]",
            "shadow-md",
            "pointer-events-none",
            "transition-all duration-150 ease-out"
          )}
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
}
