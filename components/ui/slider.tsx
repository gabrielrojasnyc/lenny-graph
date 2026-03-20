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
        <div className="flex items-center justify-between mb-2">
          <span className="label-medium text-[var(--md-on-surface-variant)]">
            {label}
          </span>
          <span className="label-medium text-[var(--md-on-surface)]">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div className="relative h-10 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1 bg-[var(--md-surface-container-highest)] rounded-full" />
        
        {/* Active track */}
        <div
          className="absolute h-1 bg-[var(--md-primary)] rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "absolute w-full h-10 opacity-0 cursor-pointer",
            "z-10"
          )}
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute w-5 h-5 rounded-full",
            "bg-[var(--md-primary)]",
            "shadow-[var(--shadow-1)]",
            "pointer-events-none",
            "transition-transform duration-100",
            "hover:scale-110"
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    </div>
  );
}
