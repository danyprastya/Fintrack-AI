"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  currency?: string;
  className?: string;
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  currency = "IDR",
  className,
}: SummaryCardsProps) {
  const { t } = useLanguage();
  const netBalance = totalIncome - totalExpense;

  const cards = [
    {
      label: t.analytics.totalIncome,
      amount: totalIncome,
      icon: TrendingUp,
      color: "text-income",
      bgColor: "bg-income/10",
    },
    {
      label: t.analytics.totalExpense,
      amount: totalExpense,
      icon: TrendingDown,
      color: "text-expense",
      bgColor: "bg-expense/10",
    },
    {
      label: t.analytics.netBalance,
      amount: netBalance,
      icon: Minus,
      color: netBalance >= 0 ? "text-income" : "text-expense",
      bgColor: netBalance >= 0 ? "bg-income/10" : "bg-expense/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  card.bgColor,
                )}
              >
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">
                  {card.label}
                </p>
                <p className={cn("text-sm font-bold mt-1", card.color)}>
                  {formatCurrency(card.amount, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
