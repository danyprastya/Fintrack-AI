"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { SpendingChart } from "@/components/analytics/spending-chart";
import { cn } from "@/lib/utils";
import { BarChart3, Loader2 } from "lucide-react";
import {
  getTransactions,
  computeMonthlyTotals,
  computeCategorySpending,
  type TransactionDoc,
} from "@/lib/firestore-service";

type Period = "weekly" | "monthly" | "yearly";

const CATEGORY_COLORS: Record<string, string> = {
  foodDrinks: "#ef4444",
  transportation: "#f97316",
  shopping: "#a855f7",
  entertainment: "#ec4899",
  bills: "#6366f1",
  health: "#14b8a6",
  education: "#3b82f6",
  salary: "#22c55e",
  investment: "#eab308",
  freelance: "#06b6d4",
  gift: "#f43f5e",
  others: "#78716c",
};

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);

  const periods: { key: Period; label: string }[] = [
    { key: "weekly", label: t.analytics.weekly },
    { key: "monthly", label: t.analytics.monthly },
    { key: "yearly", label: t.analytics.yearly },
  ];

  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);
    getTransactions(user.uid, 500)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user?.uid]);

  // Compute analytics data based on selected period
  const { totalIncome, totalExpense, categoryData, totalSpending } =
    useMemo(() => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      let filtered: TransactionDoc[];

      if (period === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = transactions.filter((tx) => {
          const d = tx.date?.toDate?.() || tx.createdAt?.toDate?.();
          return d && d >= weekAgo;
        });
      } else if (period === "yearly") {
        filtered = transactions.filter((tx) => {
          const d = tx.date?.toDate?.() || tx.createdAt?.toDate?.();
          return d && d.getFullYear() === year;
        });
      } else {
        filtered = transactions.filter((tx) => {
          const d = tx.date?.toDate?.() || tx.createdAt?.toDate?.();
          return d && d.getMonth() + 1 === month && d.getFullYear() === year;
        });
      }

      let income = 0;
      let expense = 0;
      for (const tx of filtered) {
        if (tx.type === "income") income += tx.amount;
        else if (tx.type === "expense") expense += tx.amount;
      }

      // Category spending (expense only)
      const catMap = new Map<string, { icon: string; amount: number }>();
      for (const tx of filtered) {
        if (tx.type !== "expense") continue;
        const key = tx.category || "others";
        const existing = catMap.get(key) || {
          icon: tx.categoryIcon || "📦",
          amount: 0,
        };
        existing.amount += tx.amount;
        catMap.set(key, existing);
      }

      const catArr = Array.from(catMap.entries())
        .map(([cat, d]) => ({ category: cat, icon: d.icon, amount: d.amount }))
        .sort((a, b) => b.amount - a.amount);

      const total = catArr.reduce((s, c) => s + c.amount, 0);

      const catData = catArr.map((c, i) => ({
        id: c.category,
        name: c.category,
        icon: c.icon,
        amount: c.amount,
        color:
          CATEGORY_COLORS[c.category] || `hsl(${(i * 47) % 360}, 65%, 55%)`,
        percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0,
      }));

      return {
        totalIncome: income,
        totalExpense: expense,
        categoryData: catData,
        totalSpending: total,
      };
    }, [transactions, period]);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasData ? (
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
            {/* Spending Chart by Category */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">
                {t.analytics.spendingByCategory}
              </h2>
              <SpendingChart
                categories={categoryData}
                totalSpending={totalSpending}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
