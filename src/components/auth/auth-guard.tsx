"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/** Pages that don't require authentication */
const PUBLIC_PATHS = ["/login"];

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side auth guard.
 * Redirects unauthenticated users to /login.
 * Redirects authenticated users away from /login.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.replace("/login");
    } else if (isAuthenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show nothing while loading auth state (layout shows shimmer)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-xl bg-primary/20 animate-pulse" />
      </div>
    );
  }

  // Don't render protected content for unauthenticated users
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-xl bg-primary/20 animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
