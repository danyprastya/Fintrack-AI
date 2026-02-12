"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency, calculatePercentage } from "@/lib/utils/currency";
import { CategoryIcon } from "@/lib/category-icons";

interface BudgetItem {
  id: string;
  categoryName: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  color: string;
}

interface BudgetCategorySliderProps {
  budgets: BudgetItem[];
  currency?: string;
  className?: string;
}

function getStatusColor(pct: number) {
  if (pct >= 90)
    return {
      bg: "from-rose-500/10 to-rose-500/5",
      bar: "bg-rose-500",
      text: "text-rose-500",
      ring: "border-rose-500/20",
    };
  if (pct >= 70)
    return {
      bg: "from-amber-500/10 to-amber-500/5",
      bar: "bg-amber-500",
      text: "text-amber-500",
      ring: "border-amber-500/20",
    };
  return {
    bg: "from-primary/10 to-primary/5",
    bar: "bg-primary",
    text: "text-primary",
    ring: "border-primary/20",
  };
}

export function BudgetCategorySlider({
  budgets,
  currency = "IDR",
  className,
}: BudgetCategorySliderProps) {
  const { t } = useLanguage();

  if (budgets.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-base font-semibold">{t.dashboard.thisMonthBudget}</h2>

      {/* Horizontal scroll container — free-flowing, no snap, no arrows */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {budgets.map((budget) => {
          const pct = calculatePercentage(budget.spent, budget.limit);
          const remaining = budget.limit - budget.spent;
          const isOver = remaining < 0;
          const colors = getStatusColor(pct);

          return (
            <div
              key={budget.id}
              className={cn(
                "flex-shrink-0 w-[140px] rounded-2xl p-3.5 border bg-linear-to-b",
                colors.bg,
                colors.ring,
              )}
            >
              {/* Icon + Name */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-background/60 flex items-center justify-center">
                  <CategoryIcon
                    icon={budget.categoryIcon}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </div>
                <span className="text-xs font-medium truncate leading-tight">
                  {t.categories[
                    budget.categoryName as keyof typeof t.categories
                  ] || budget.categoryName}
                </span>
              </div>

              {/* Amount spent */}
              <p className="text-sm font-bold mb-1">
                {formatCurrency(budget.spent, currency)}
              </p>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-muted/60 mb-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    colors.bar,
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              {/* Status text */}
              <p
                className={cn(
                  "text-[10px]",
                  isOver
                    ? "text-rose-500 font-medium"
                    : "text-muted-foreground",
                )}
              >
                {isOver
                  ? `${formatCurrency(Math.abs(remaining), currency)} ${t.dashboard.overBudget}`
                  : `${formatCurrency(remaining, currency)} ${t.dashboard.remaining}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
