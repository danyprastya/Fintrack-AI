"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";

interface CategorySpending {
  id: string;
  name: string;
  icon: string;
  amount: number;
  color: string;
  percentage: number;
}

interface SpendingChartProps {
  categories: CategorySpending[];
  totalSpending: number;
  currency?: string;
  className?: string;
}

export function SpendingChart({
  categories,
  totalSpending,
  currency = "IDR",
  className,
}: SpendingChartProps) {
  const { t } = useLanguage();

  if (categories.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm">{t.analytics.noData}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Donut Chart Placeholder - Simple visual bar chart */}
      <div className="flex justify-center py-4">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            {
              categories.reduce<{
                elements: React.ReactNode[];
                offset: number;
              }>(
                (acc, cat) => {
                  const dashArray = (cat.percentage / 100) * 100;
                  acc.elements.push(
                    <circle
                      key={cat.id}
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="4"
                      strokeDasharray={`${dashArray} ${100 - dashArray}`}
                      strokeDashoffset={-acc.offset}
                      className="transition-all duration-700"
                    />,
                  );
                  acc.offset += dashArray;
                  return acc;
                },
                { elements: [], offset: 0 },
              ).elements
            }
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground">
              {t.analytics.totalExpense}
            </p>
            <p className="text-base font-bold">
              {formatCurrency(totalSpending, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-base">
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{cat.name}</span>
                <span className="text-sm font-semibold shrink-0 ml-2">
                  {formatCurrency(cat.amount, currency)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
              {cat.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
