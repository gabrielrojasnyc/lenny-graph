"use client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Info } from "lucide-react";
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
          "h-16 px-4 md:px-6",
          "bg-[var(--md-surface)]",
          "border-b border-[var(--md-outline-variant)]"
        )}
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="title-large text-[var(--md-on-surface)]">{title}</h1>
            {subtitle && (
              <p className="body-small text-[var(--md-on-surface-variant)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {children}
          <button
            onClick={() => setShowInfo(true)}
            className={cn(
              "state-layer flex h-10 w-10 items-center justify-center rounded-full",
              "text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]",
              "transition-colors duration-200"
            )}
            aria-label="About this project"
          >
            <Info className="h-5 w-5" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Info Dialog */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowInfo(false)}
        >
          <div
            className={cn(
              "mx-4 max-w-lg p-6 rounded-[var(--radius-lg)]",
              "bg-[var(--md-surface-container-high)]",
              "shadow-[var(--shadow-3)]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="headline-small text-[var(--md-on-surface)] mb-4">
              About The Lenny Graph
            </h2>
            <div className="space-y-3 body-medium text-[var(--md-on-surface-variant)]">
              <p>
                An interactive knowledge graph visualization of Lenny&apos;s
                Podcast, mapping relationships between people, companies, books,
                and concepts across 289 episodes.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="label-large text-[var(--md-on-surface)]">530</p>
                  <p className="body-small">Nodes</p>
                </div>
                <div>
                  <p className="label-large text-[var(--md-on-surface)]">
                    6,765
                  </p>
                  <p className="body-small">Connections</p>
                </div>
                <div>
                  <p className="label-large text-[var(--md-on-surface)]">289</p>
                  <p className="body-small">Episodes</p>
                </div>
                <div>
                  <p className="label-large text-[var(--md-on-surface)]">349</p>
                  <p className="body-small">Newsletters</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInfo(false)}
                className={cn(
                  "state-layer px-6 py-2.5 rounded-full",
                  "bg-[var(--md-primary)] text-[var(--md-on-primary)]",
                  "label-large"
                )}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
