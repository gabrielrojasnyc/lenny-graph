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
    icon: <Share2 className="h-6 w-6" />,
  },
  {
    href: "/connections",
    label: "Connections",
    icon: <GitBranch className="h-6 w-6" />,
  },
  {
    href: "/topics",
    label: "Topics",
    icon: <BarChart3 className="h-6 w-6" />,
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
          "w-20 min-h-screen py-7 gap-3",
          "bg-[var(--md-surface-container)]",
          "border-r border-[var(--md-outline-variant)]"
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col items-center gap-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 w-full",
                  "transition-colors duration-200"
                )}
              >
                <div
                  className={cn(
                    "state-layer flex items-center justify-center",
                    "w-14 h-8 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]"
                      : "text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-highest)]"
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    "label-medium",
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
          "h-20 px-2",
          "bg-[var(--md-surface-container)]",
          "border-t border-[var(--md-outline-variant)]"
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
                "flex flex-col items-center gap-1 py-3 px-4",
                "transition-colors duration-200"
              )}
            >
              <div
                className={cn(
                  "state-layer flex items-center justify-center",
                  "w-16 h-8 rounded-full transition-all duration-200",
                  isActive
                    ? "bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]"
                    : "text-[var(--md-on-surface-variant)]"
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  "label-medium",
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
