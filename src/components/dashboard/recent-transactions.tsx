"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

interface TransactionPreview {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  categoryIcon: string;
  date: string;
}

interface RecentTransactionsProps {
  transactions: TransactionPreview[];
  currency?: string;
  className?: string;
}

const TYPE_CONFIG = {
  income: {
    icon: ArrowUpRight,
    color: "text-income",
    bgColor: "bg-income/10",
    prefix: "+",
  },
  expense: {
    icon: ArrowDownRight,
    color: "text-expense",
    bgColor: "bg-expense/10",
    prefix: "-",
  },
  transfer: {
    icon: ArrowLeftRight,
    color: "text-transfer",
    bgColor: "bg-transfer/10",
    prefix: "",
  },
};

export function RecentTransactions({
  transactions,
  currency = "IDR",
  className,
}: RecentTransactionsProps) {
  const { t } = useLanguage();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {t.dashboard.recentTransactions}
        </h2>
        <Link
          href="/transactions"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t.dashboard.viewAll}
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">{t.dashboard.noTransactions}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => {
            const config = TYPE_CONFIG[tx.type];

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-2xl p-3 bg-card shadow-sm ring-1 ring-border/60 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                  {tx.categoryIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {tx.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {tx.date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">
                      {tx.category}
                    </span>
                    <p
                      className={cn(
                        "text-sm font-semibold shrink-0",
                        config.color,
                      )}
                    >
                      {config.prefix}
                      {formatCurrency(tx.amount, currency)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
