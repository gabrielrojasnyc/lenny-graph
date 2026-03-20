"use client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Info, X } from "lucide-react";
import { useState } from "react";

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function TopAppBar({ title, subtitle, children }: TopAppBarProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header
        className={cn(
          "flex items-center justify-between",
          "h-14 px-4 md:px-6",
          "bg-[var(--md-surface)]/80 backdrop-blur-xl",
          "border-b border-[var(--md-outline-variant)]/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--md-on-surface)] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[var(--md-on-surface-variant)] -mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {children}
          <button
            onClick={() => setShowInfo(true)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]",
              "hover:bg-[var(--md-surface-container-high)]",
              "transition-all duration-200"
            )}
            aria-label="About this project"
          >
            <Info className="h-[18px] w-[18px]" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Info Dialog */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Dialog */}
          <div
            className={cn(
              "relative max-w-md w-full p-6 rounded-3xl",
              "bg-[var(--md-surface-container-high)]",
              "shadow-2xl border border-[var(--md-outline-variant)]/20"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--md-surface-container-highest)] transition-colors"
            >
              <X className="h-5 w-5 text-[var(--md-on-surface-variant)]" />
            </button>
            
            <h2 className="text-xl font-semibold text-[var(--md-on-surface)] mb-3">
              About The Lenny Graph
            </h2>
            <p className="text-sm text-[var(--md-on-surface-variant)] leading-relaxed mb-6">
              An interactive knowledge graph visualization of Lenny&apos;s
              Podcast, mapping relationships between people, companies, books,
              and concepts across years of episodes.
            </p>
            
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: "530", label: "Nodes" },
                { value: "6,765", label: "Edges" },
                { value: "289", label: "Episodes" },
                { value: "349", label: "Posts" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-2xl bg-[var(--md-surface-container)]">
                  <p className="text-lg font-bold text-[var(--md-on-surface)]">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--md-on-surface-variant)]">{stat.label}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInfo(false)}
                className={cn(
                  "px-5 py-2.5 rounded-full",
                  "bg-[var(--md-primary)] text-white",
                  "text-sm font-medium",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
