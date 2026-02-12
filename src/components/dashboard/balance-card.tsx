"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { Eye, EyeOff, TrendingDown, ArrowDown, ArrowUp } from "lucide-react";

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expense: number;
  currency?: string;
  userName?: string;
  budgetLimit?: number;
  className?: string;
}

export function BalanceCard({
  totalBalance,
  income,
  expense,
  currency = "IDR",
  userName,
  budgetLimit,
  className,
}: BalanceCardProps) {
  const { t } = useLanguage();
  const [isHidden, setIsHidden] = useState(false);

  const masked = "••••••••";

  // Budget comparison badge
  const budgetPercent =
    budgetLimit && budgetLimit > 0
      ? Math.round((expense / budgetLimit) * 100)
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        "bg-linear-to-br from-[#1a237e] via-[#283593] to-[#1565c0]",
        "text-white shadow-xl shadow-indigo-900/20",
        className,
      )}
    >
      {/* Decorative shapes */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-sm" />
      <div className="absolute right-4 top-12 h-20 w-20 rounded-full bg-white/[0.03]" />
      <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/[0.04]" />

      <div className="relative z-10">
        {/* Greeting + Eye toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/70">
            {t.dashboard.greeting}
            {userName ? `, ${userName}` : ""} 👋
          </p>
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {isHidden ? (
              <EyeOff className="h-3.5 w-3.5 text-white/70" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-white/70" />
            )}
          </button>
        </div>

        {/* Total Balance */}
        <p className="text-[10px] uppercase tracking-widest text-white/50 mt-3">
          {t.dashboard.totalBalance}
        </p>
        <p className="text-3xl font-bold tracking-tight mt-0.5">
          {isHidden ? masked : formatCurrency(totalBalance, currency)}
        </p>

        {/* Income / Expense row */}
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20">
              <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/50">{t.dashboard.income}</p>
              <p className="text-sm font-semibold">
                {isHidden ? masked : formatCurrency(income, currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-400/20">
              <ArrowUp className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/50">{t.dashboard.expense}</p>
              <p className="text-sm font-semibold">
                {isHidden ? masked : formatCurrency(expense, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget comparison badge */}
        {budgetPercent !== null && !isHidden && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium",
                budgetPercent >= 90
                  ? "bg-rose-500/20 text-rose-300"
                  : budgetPercent >= 70
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300",
              )}
            >
              <TrendingDown className="h-3 w-3" />
              {budgetPercent}% {t.dashboard.budgetUsed}
            </div>
            <span className="text-[10px] text-white/40">
              {t.dashboard.of} {formatCurrency(budgetLimit!, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
