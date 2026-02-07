"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ScanLine,
} from "lucide-react";

interface QuickActionsProps {
  className?: string;
}

const ACTIONS = [
  {
    labelKey: "addIncome" as const,
    icon: TrendingUp,
    href: "/transactions?action=income",
    color: "bg-teal-500/10 text-teal-600",
    iconColor: "text-teal-500",
  },
  {
    labelKey: "addExpense" as const,
    icon: TrendingDown,
    href: "/transactions?action=expense",
    color: "bg-rose-500/10 text-rose-600",
    iconColor: "text-rose-500",
  },
  {
    labelKey: "transfer" as const,
    icon: ArrowLeftRight,
    href: "/transactions?action=transfer",
    color: "bg-violet-500/10 text-violet-600",
    iconColor: "text-violet-500",
  },
  {
    labelKey: "scanReceipt" as const,
    icon: ScanLine,
    href: "/scan",
    color: "bg-indigo-500/10 text-indigo-600",
    iconColor: "text-indigo-500",
  },
];

export function QuickActions({ className }: QuickActionsProps) {
  const { t } = useLanguage();

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-base font-semibold">{t.dashboard.quickActions}</h2>
      <div className="grid grid-cols-4 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.labelKey}
              href={action.href}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 group-active:scale-95",
                  action.color,
                )}
              >
                <Icon
                  className={cn("h-5 w-5", action.iconColor)}
                  strokeWidth={2}
                />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
                {t.dashboard[action.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
