"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PageHeader } from "@/components/shared/page-header";
import { SpendingRings } from "@/components/analytics/spending-rings";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { cn } from "@/lib/utils";

type Period = "weekly" | "monthly" | "yearly";

// Demo data
const DEMO_CATEGORIES = [
  {
    id: "1",
    name: "Makanan & Minuman",
    icon: "🍔",
    amount: 850000,
    color: "#f97316",
    percentage: 42,
  },
  {
    id: "2",
    name: "Transportasi",
    icon: "🚗",
    amount: 420000,
    color: "#3b82f6",
    percentage: 21,
  },
  {
    id: "3",
    name: "Belanja",
    icon: "🛍️",
    amount: 350000,
    color: "#ec4899",
    percentage: 17,
  },
  {
    id: "4",
    name: "Hiburan",
    icon: "🎬",
    amount: 200000,
    color: "#8b5cf6",
    percentage: 10,
  },
  {
    id: "5",
    name: "Tagihan",
    icon: "📄",
    amount: 150000,
    color: "#ef4444",
    percentage: 7,
  },
  {
    id: "6",
    name: "Lainnya",
    icon: "📦",
    amount: 60000,
    color: "#6b7280",
    percentage: 3,
  },
];

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>("monthly");

  const periods: { key: Period; label: string }[] = [
    { key: "weekly", label: t.analytics.weekly },
    { key: "monthly", label: t.analytics.monthly },
    { key: "yearly", label: t.analytics.yearly },
  ];

  const totalSpending = DEMO_CATEGORIES.reduce((sum, c) => sum + c.amount, 0);

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
        <SummaryCards totalIncome={5000000} totalExpense={totalSpending} />

        {/* Spending Chart */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">
            {t.analytics.spendingByCategory}
          </h2>
          <SpendingRings
            categories={DEMO_CATEGORIES}
            totalSpending={totalSpending}
          />
        </div>

        {/* Monthly Trend - Visual bar chart */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">
            {t.analytics.monthlyTrend}
          </h2>
          <div className="flex items-end gap-2 h-32 px-2">
            {[
              { month: t.months.jul, income: 4500000, expense: 3800000 },
              { month: t.months.aug, income: 5000000, expense: 4200000 },
              { month: t.months.sep, income: 4800000, expense: 3500000 },
              { month: t.months.oct, income: 5200000, expense: 4000000 },
              { month: t.months.nov, income: 5000000, expense: 3900000 },
              { month: t.months.dec, income: 5500000, expense: 4500000 },
            ].map((data, i) => {
              const maxVal = 5500000;
              const incomeH = (data.income / maxVal) * 100;
              const expenseH = (data.expense / maxVal) * 100;

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex items-end gap-0.5 w-full h-24">
                    <div
                      className="flex-1 rounded-t-sm bg-income/70 transition-all duration-500"
                      style={{ height: `${incomeH}%` }}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-expense/70 transition-all duration-500"
                      style={{ height: `${expenseH}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {data.month.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-income/70" />
              <span className="text-muted-foreground">
                {t.dashboard.income}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-expense/70" />
              <span className="text-muted-foreground">
                {t.dashboard.expense}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
