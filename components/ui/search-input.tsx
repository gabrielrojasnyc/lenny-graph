"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

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
          "h-14 px-4 rounded-full",
          "bg-[var(--md-surface-container-highest)]",
          "transition-all duration-200",
          isFocused && "shadow-[var(--shadow-2)]"
        )}
      >
        <Search className="h-5 w-5 text-[var(--md-on-surface-variant)]" />
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
            "body-large text-[var(--md-on-surface)]",
            "placeholder:text-[var(--md-on-surface-variant)]"
          )}
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className={cn(
              "state-layer flex h-8 w-8 items-center justify-center rounded-full",
              "text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
            )}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul
          ref={listRef}
          className={cn(
            "absolute top-full left-0 right-0 mt-2 py-2 z-50",
            "rounded-[var(--radius-md)]",
            "bg-[var(--md-surface-container)]",
            "shadow-[var(--shadow-2)]",
            "max-h-64 overflow-auto"
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
                  "w-full flex items-center gap-3 px-4 py-3",
                  "text-left transition-colors",
                  highlightedIndex === index
                    ? "bg-[var(--md-surface-container-highest)]"
                    : "hover:bg-[var(--md-surface-container-high)]"
                )}
              >
                <span className="body-large text-[var(--md-on-surface)]">
                  {suggestion.label}
                </span>
                {suggestion.type && (
                  <span className="label-small text-[var(--md-on-surface-variant)] ml-auto capitalize">
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
