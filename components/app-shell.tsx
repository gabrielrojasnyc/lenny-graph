"use client";

import { NavigationRail } from "@/components/ui/navigation-rail";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--md-surface)]">
      <NavigationRail />
      <main
        className={cn(
          "flex-1 flex flex-col",
          "pb-20 md:pb-0" // Account for mobile bottom nav
        )}
      >
        {children}
      </main>
    </div>
  );
}
