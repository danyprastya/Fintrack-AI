"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { SwipeableTransactionItem } from "./swipeable-transaction-item";
import { ShimmerTransactionList } from "@/components/shared/shimmer-loader";

interface TransactionData {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  categoryIcon: string;
  categoryName: string;
  date: string;
  dateGroup: string;
  accountName?: string;
}

interface TransactionListProps {
  transactions: TransactionData[];
  currency?: string;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

export function TransactionList({
  transactions,
  currency = "IDR",
  isLoading = false,
  onDelete,
  onEdit,
  className,
}: TransactionListProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return <ShimmerTransactionList count={6} />;
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm font-medium">{t.transactions.noTransactions}</p>
      </div>
    );
  }

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, TransactionData[]>>(
    (acc, tx) => {
      const key = tx.dateGroup;
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    },
    {},
  );

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(grouped).map(([dateGroup, txns]) => (
        <div key={dateGroup}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            {dateGroup}
          </p>
          <div className="space-y-2.5">
            {txns.map((tx) => (
              <SwipeableTransactionItem
                key={tx.id}
                {...tx}
                currency={currency}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
