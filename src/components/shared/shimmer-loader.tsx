"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ShimmerProps {
  className?: string;
}

/**
 * Synchronized shimmer loader components.
 * All shimmer elements use the same CSS animation class
 * so they pulse in sync, creating a unified loading effect.
 */

export function ShimmerLine({ className }: ShimmerProps) {
  return (
    <Skeleton className={cn("shimmer h-4 w-full rounded-md", className)} />
  );
}

export function ShimmerCircle({ className }: ShimmerProps) {
  return (
    <Skeleton className={cn("shimmer h-10 w-10 rounded-full", className)} />
  );
}

export function ShimmerCard({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <ShimmerCircle />
        <div className="flex-1 space-y-2">
          <ShimmerLine className="h-4 w-3/4" />
          <ShimmerLine className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function ShimmerBalanceCard({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 p-5 space-y-4",
        className,
      )}
    >
      <ShimmerLine className="h-3 w-24" />
      <ShimmerLine className="h-8 w-48" />
      <div className="flex gap-6 pt-2">
        <div className="space-y-2">
          <ShimmerLine className="h-3 w-16" />
          <ShimmerLine className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <ShimmerLine className="h-3 w-16" />
          <ShimmerLine className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ShimmerTransactionItem({ className }: ShimmerProps) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <ShimmerCircle className="h-10 w-10 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <ShimmerLine className="h-4 w-2/3" />
        <ShimmerLine className="h-3 w-1/3" />
      </div>
      <ShimmerLine className="h-4 w-20 shrink-0" />
    </div>
  );
}

export function ShimmerTransactionList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerTransactionItem key={i} />
      ))}
    </div>
  );
}

export function ShimmerBudgetBar({ className }: ShimmerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between">
        <ShimmerLine className="h-3 w-24" />
        <ShimmerLine className="h-3 w-16" />
      </div>
      <ShimmerLine className="h-2.5 w-full rounded-full" />
    </div>
  );
}

export function ShimmerQuickActions({ className }: ShimmerProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="shimmer h-12 w-12 rounded-2xl" />
          <ShimmerLine className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ShimmerDashboard() {
  return (
    <div className="space-y-6 p-4">
      <ShimmerLine className="h-6 w-32" />
      <ShimmerBalanceCard />
      <ShimmerQuickActions />
      <div className="space-y-3">
        <div className="flex justify-between">
          <ShimmerLine className="h-5 w-36" />
          <ShimmerLine className="h-4 w-20" />
        </div>
        <ShimmerTransactionList count={3} />
      </div>
      <div className="space-y-3">
        <ShimmerLine className="h-5 w-36" />
        <ShimmerBudgetBar />
        <ShimmerBudgetBar />
        <ShimmerBudgetBar />
      </div>
    </div>
  );
}
