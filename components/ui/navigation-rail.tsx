"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Share2, GitBranch, BarChart3 } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Graph",
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    href: "/connections",
    label: "Connections",
    icon: <GitBranch className="h-5 w-5" />,
  },
  {
    href: "/topics",
    label: "Topics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export function NavigationRail() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navigation Rail */}
      <nav
        className={cn(
          "hidden md:flex flex-col items-center",
          "w-[72px] min-h-screen py-6 gap-2",
          "bg-[var(--md-surface-container)]/80 backdrop-blur-xl",
          "border-r border-[var(--md-outline-variant)]/20"
        )}
        aria-label="Main navigation"
      >
        {/* Logo mark */}
        <div className="mb-4 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--md-primary)] to-[var(--md-tertiary)] flex items-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 w-full",
                  "transition-all duration-200 group"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center",
                    "w-14 h-8 rounded-2xl transition-all duration-200",
                    isActive
                      ? "bg-[var(--md-primary)] text-white shadow-lg"
                      : "text-[var(--md-on-surface-variant)] group-hover:bg-[var(--md-surface-container-high)]"
                  )}
                  style={isActive ? { boxShadow: '0 4px 12px -2px var(--md-primary)' } : undefined}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium tracking-wide",
                    isActive
                      ? "text-[var(--md-on-surface)]"
                      : "text-[var(--md-on-surface-variant)]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50",
          "flex items-center justify-around",
          "h-16 px-4",
          "bg-[var(--md-surface-container)]/90 backdrop-blur-xl",
          "border-t border-[var(--md-outline-variant)]/20"
        )}
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-6",
                "transition-all duration-200"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-12 h-8 rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-[var(--md-primary)] text-white"
                    : "text-[var(--md-on-surface-variant)]"
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive
                    ? "text-[var(--md-on-surface)]"
                    : "text-[var(--md-on-surface-variant)]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
