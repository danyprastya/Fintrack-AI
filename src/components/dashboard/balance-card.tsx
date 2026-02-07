"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expense: number;
  currency?: string;
  className?: string;
}

export function BalanceCard({
  totalBalance,
  income,
  expense,
  currency = "IDR",
  className,
}: BalanceCardProps) {
  const { t } = useLanguage();
  const [isHidden, setIsHidden] = useState(false);

  const masked = "••••••••";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-5 text-primary-foreground",
        "shadow-xl shadow-primary/15",
        "before:absolute before:inset-0 before:bg-white/10 before:backdrop-blur-sm before:rounded-2xl",
        className,
      )}
    >
      {/* Decorative glass orbs */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/5" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary-foreground/80">
            {t.dashboard.totalBalance}
          </p>
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            {isHidden ? (
              <EyeOff className="h-3.5 w-3.5 text-primary-foreground/80" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-primary-foreground/80" />
            )}
          </button>
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {isHidden ? masked : formatCurrency(totalBalance, currency)}
        </p>

        <div className="mt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">
                {t.dashboard.income}
              </p>
              <p className="text-sm font-semibold">
                {isHidden ? masked : formatCurrency(income, currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">
                {t.dashboard.expense}
              </p>
              <p className="text-sm font-semibold">
                {isHidden ? masked : formatCurrency(expense, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
