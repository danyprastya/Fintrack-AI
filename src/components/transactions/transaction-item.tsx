"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";

interface TransactionItemProps {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  categoryIcon: string;
  categoryName: string;
  date: string;
  accountName?: string;
  currency?: string;
  onDelete?: (id: string) => void;
  className?: string;
}

const TYPE_STYLES = {
  income: { color: "text-income", prefix: "+", Icon: ArrowUpRight },
  expense: { color: "text-expense", prefix: "-", Icon: ArrowDownRight },
  transfer: { color: "text-transfer", prefix: "", Icon: ArrowLeftRight },
};

export function TransactionItem({
  id,
  type,
  amount,
  description,
  categoryIcon,
  categoryName,
  date,
  accountName,
  currency = "IDR",
  onDelete,
  className,
}: TransactionItemProps) {
  const style = TYPE_STYLES[type];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-all",
        className,
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
        {categoryIcon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-muted-foreground">{categoryName}</span>
          {accountName && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {accountName}
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <p className={cn("text-sm font-semibold", style.color)}>
          {style.prefix}
          {formatCurrency(amount, currency)}
        </p>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
