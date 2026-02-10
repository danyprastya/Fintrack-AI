"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";

interface BarChartComparisonProps {
  totalIncome: number;
  totalExpense: number;
  currency?: string;
  className?: string;
}

export function BarChartComparison({
  totalIncome,
  totalExpense,
  currency = "IDR",
  className,
}: BarChartComparisonProps) {
  const { t } = useLanguage();
  const max = Math.max(totalIncome, totalExpense, 1);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-end justify-center gap-6 h-48 pt-4">
        {/* Income bar */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-28">
          <motion.p
            className="text-xs font-bold text-income"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {formatCurrency(totalIncome, currency)}
          </motion.p>
          <div className="relative w-full h-36 flex items-end justify-center">
            <motion.div
              className="w-full rounded-t-xl bg-linear-to-t from-income/80 to-income"
              initial={{ height: 0 }}
              animate={{
                height: `${Math.max((totalIncome / max) * 100, 4)}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t.analytics.income}
          </p>
        </div>

        {/* Expense bar */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-28">
          <motion.p
            className="text-xs font-bold text-expense"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {formatCurrency(totalExpense, currency)}
          </motion.p>
          <div className="relative w-full h-36 flex items-end justify-center">
            <motion.div
              className="w-full rounded-t-xl bg-linear-to-t from-expense/80 to-expense"
              initial={{ height: 0 }}
              animate={{
                height: `${Math.max((totalExpense / max) * 100, 4)}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t.analytics.expense}
          </p>
        </div>
      </div>

      {/* Net summary */}
      <motion.div
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-muted/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      >
        <span className="text-xs text-muted-foreground">{t.analytics.net}:</span>
        <span
          className={cn(
            "text-sm font-bold",
            totalIncome - totalExpense >= 0 ? "text-income" : "text-expense",
          )}
        >
          {totalIncome - totalExpense >= 0 ? "+" : ""}
          {formatCurrency(Math.abs(totalIncome - totalExpense), currency)}
        </span>
      </motion.div>
    </div>
  );
}
