"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * App shell wrapper that provides consistent padding
 * for content area above the bottom navigation bar.
 */
export function AppShell({ children, className }: AppShellProps) {
  const pathname = usePathname();
  const isFullScreen = pathname === "/login" || pathname === "/profile";

  return (
    <main
      className={cn(
        "min-h-screen mx-auto max-w-lg w-full",
        !isFullScreen && "pb-20",
        className,
      )}
    >
      {children}
    </main>
  );
}
