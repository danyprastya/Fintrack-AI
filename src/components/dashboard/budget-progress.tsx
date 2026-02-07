"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency, calculatePercentage } from "@/lib/utils/currency";
import { Progress } from "@/components/ui/progress";

interface BudgetItem {
  id: string;
  categoryName: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  color: string;
}

interface BudgetProgressProps {
  budgets: BudgetItem[];
  currency?: string;
  className?: string;
}

function getBudgetColor(percentage: number): string {
  if (percentage >= 90) return "bg-destructive";
  if (percentage >= 70) return "bg-amber-500";
  return "bg-primary";
}

export function BudgetProgress({
  budgets,
  currency = "IDR",
  className,
}: BudgetProgressProps) {
  const { t } = useLanguage();

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-base font-semibold">{t.dashboard.thisMonthBudget}</h2>

      {budgets.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          {t.general.noData}
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentage = calculatePercentage(budget.spent, budget.limit);
            const remaining = budget.limit - budget.spent;
            const isOverBudget = remaining < 0;

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{budget.categoryIcon}</span>
                    <span className="font-medium">{budget.categoryName}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {/* {formatCurrency(budget.spent, currency)}{" "} */}
                    <span className="text-xs">
                      {t.dashboard.limit} {formatCurrency(budget.limit, currency)}
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={percentage}
                    className="h-2.5 rounded-full bg-muted"
                  />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                      getBudgetColor(percentage),
                    )}
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      height: "100%",
                    }}
                  />
                </div>
                <p
                  className={cn(
                    "text-xs",
                    isOverBudget ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {isOverBudget
                    ? `${formatCurrency(Math.abs(remaining), currency)} ${t.dashboard.overBudget}`
                    : `${formatCurrency(remaining, currency)} ${t.dashboard.remaining}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
