"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PageHeader } from "@/components/shared/page-header";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

type Period = "weekly" | "monthly" | "yearly";

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>("monthly");

  const periods: { key: Period; label: string }[] = [
    { key: "weekly", label: t.analytics.weekly },
    { key: "monthly", label: t.analytics.monthly },
    { key: "yearly", label: t.analytics.yearly },
  ];

  // TODO: Replace with real Firestore data
  const totalIncome = 0;
  const totalExpense = 0;

  const hasData = totalIncome > 0 || totalExpense > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t.analytics.title} />

      <div className="flex-1 p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                period === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <SummaryCards totalIncome={totalIncome} totalExpense={totalExpense} />

        {!hasData ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold">{t.emptyState.noAnalytics}</p>
            <p className="text-xs text-muted-foreground/70 mt-1 text-center max-w-[220px]">
              {t.emptyState.noAnalyticsDesc}
            </p>
          </div>
        ) : (
          <>
            {/* Spending Chart — will render when data exists */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">
                {t.analytics.spendingByCategory}
              </h2>
            </div>

            {/* Monthly Trend — will render when data exists */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">
                {t.analytics.monthlyTrend}
              </h2>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
