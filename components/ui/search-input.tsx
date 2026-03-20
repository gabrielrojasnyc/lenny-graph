"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { ENTITY_COLORS, EntityType } from "@/lib/graph-data";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  suggestions?: Array<{ id: string; label: string; type?: string }>;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const showSuggestions = isFocused && value.length > 0 && suggestions.length > 0;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          const selected = suggestions[highlightedIndex];
          onChange(selected.label);
          onSelect?.(selected.id);
          setIsFocused(false);
        }
        break;
      case "Escape":
        setIsFocused(false);
        break;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-3",
          "h-10 px-4 rounded-xl",
          "bg-[var(--md-surface-container-high)]/60",
          "border border-[var(--md-outline-variant)]/30",
          "transition-all duration-200",
          isFocused && "bg-[var(--md-surface-container-highest)] border-[var(--md-primary)]/50 shadow-lg"
        )}
      >
        <Search className="h-4 w-4 text-[var(--md-on-surface-variant)]" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent outline-none",
            "text-sm text-[var(--md-on-surface)]",
            "placeholder:text-[var(--md-on-surface-variant)]/60"
          )}
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              "text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]",
              "hover:bg-[var(--md-surface-container)] transition-colors"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul
          ref={listRef}
          className={cn(
            "absolute top-full left-0 right-0 mt-2 py-1.5 z-50",
            "rounded-xl",
            "bg-[var(--md-surface-container-high)]/95 backdrop-blur-xl",
            "border border-[var(--md-outline-variant)]/20",
            "shadow-xl",
            "max-h-72 overflow-auto"
          )}
        >
          {suggestions.slice(0, 8).map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                onClick={() => {
                  onChange(suggestion.label);
                  onSelect?.(suggestion.id);
                  setIsFocused(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5",
                  "text-left transition-colors",
                  highlightedIndex === index
                    ? "bg-[var(--md-surface-container-highest)]"
                    : "hover:bg-[var(--md-surface-container)]"
                )}
              >
                {/* Type indicator dot */}
                {suggestion.type && (
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ENTITY_COLORS[suggestion.type as EntityType] || 'var(--md-outline)' }}
                  />
                )}
                <span className="text-sm text-[var(--md-on-surface)] truncate">
                  {suggestion.label}
                </span>
                {suggestion.type && (
                  <span className="text-[10px] uppercase tracking-wider text-[var(--md-on-surface-variant)] ml-auto flex-shrink-0">
                    {suggestion.type}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
