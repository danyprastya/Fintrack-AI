"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency, formatCurrencyParts } from "@/lib/utils/currency";
import {
  Eye,
  EyeOff,
  TrendingDown,
  ArrowDown,
  ArrowUp,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expense: number;
  currency?: string;
  userName?: string;
  budgetLimit?: number;
  photoURL?: string | null;
  unreadCount?: number;
  onToggleHidden?: (hidden: boolean) => void;
  className?: string;
}

export function BalanceCard({
  totalBalance,
  income,
  expense,
  currency = "IDR",
  userName,
  budgetLimit,
  photoURL,
  unreadCount = 0,
  onToggleHidden,
  className,
}: BalanceCardProps) {
  const { t } = useLanguage();
  const [isHidden, setIsHidden] = useState(false);

  const masked = "------";
  const initials = (userName || "U").charAt(0).toUpperCase();

  const toggleHidden = () => {
    const next = !isHidden;
    setIsHidden(next);
    onToggleHidden?.(next);
  };

  /** Format amount showing symbol always, masking only the numeric value */
  const displayAmount = (amount: number) => {
    if (isHidden) {
      const { symbol } = formatCurrencyParts(amount, currency);
      return `${symbol} ${masked}`;
    }
    return formatCurrency(amount, currency);
  };

  // Budget comparison badge
  const budgetPercent =
    budgetLimit && budgetLimit > 0
      ? Math.round((expense / budgetLimit) * 100)
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-b-3xl px-5 pt-8 pb-5",
        "bg-linear-to-br from-[#1a237e] via-[#283593] to-[#1565c0]",
        "text-white shadow-xl shadow-indigo-900/20",
        className,
      )}
    >
      {/* Decorative shapes */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-sm" />
      <div className="absolute right-4 top-12 h-20 w-20 rounded-full bg-white/3" />
      <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/4" />

      <div className="relative z-10">
        {/* Top Bar: Avatar + App Branding + Notification */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Avatar className="h-10 w-10 border-2 border-white/20 shadow-sm">
                {photoURL ? (
                  <AvatarImage src={photoURL} alt={userName || ""} />
                ) : null}
                <AvatarFallback className="bg-white/15 text-white text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <p className="text-xs text-white/60">
                {t.dashboard.greeting}, {userName || t.dashboard.greeting}! 👋
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Image
                  src="/icons/icon-192.svg"
                  alt={t.general.appName}
                  width={18}
                  height={18}
                  className="h-4.5 w-4.5 brightness-0 invert"
                />
                <span className="text-sm font-bold text-white">
                  {t.general.appName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Bell className="h-4 w-4 text-white/70" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        {/* Total Balance */}
          <p className="text-[10px] uppercase tracking-widest text-white/50">
            {t.dashboard.totalBalance}
          </p>
        <div className="flex flex-row gap-4 justify-start items-center">
          <p className="text-3xl font-bold tracking-tight mt-0.5">
            {displayAmount(totalBalance)}
          </p>
          <button
            onClick={toggleHidden}
            className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {isHidden ? (
              <EyeOff className="h-4 w-4 text-white/70" />
            ) : (
              <Eye className="h-4 w-4 text-white/70" />
            )}
          </button>
        </div>

        {/* Income / Expense row */}
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20">
              <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/50">{t.dashboard.income}</p>
              <p className="text-sm font-semibold">
                {displayAmount(income)}
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
                {displayAmount(expense)}
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
