"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/contexts/notification-context";
import { useRouter } from "next/navigation";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CurrencyConverterWidget } from "@/components/dashboard/currency-converter-widget";
import { ShimmerDashboard } from "@/components/shared/shimmer-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getWallets,
  getRecentTransactions,
  getBudgets,
  computeTotalBalance,
  computeMonthlyTotals,
  type WalletDoc,
  type TransactionDoc,
  type BudgetDoc,
} from "@/lib/firestore-service";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Real data from Firestore
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [recentTx, setRecentTx] = useState<
    {
      id: string;
      type: "income" | "expense" | "transfer";
      amount: number;
      description: string;
      category: string;
      categoryIcon: string;
      date: string;
    }[]
  >([]);
  const [budgets, setBudgets] = useState<
    {
      id: string;
      categoryName: string;
      categoryIcon: string;
      spent: number;
      limit: number;
      color: string;
    }[]
  >([]);

  useEffect(() => {
    async function loadDashboard() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Fetch all data in parallel
        const [wallets, transactions, budgetDocs] = await Promise.all([
          getWallets(user.uid),
          getRecentTransactions(user.uid, 10),
          getBudgets(user.uid, month, year).catch(() => [] as BudgetDoc[]),
        ]);

        // Balance from wallets
        setTotalBalance(computeTotalBalance(wallets));

        // Monthly totals from recent transactions (fetch more for full month)
        const { income, expense } = computeMonthlyTotals(
          transactions,
          month,
          year,
        );
        setMonthlyIncome(income);
        setMonthlyExpense(expense);

        // Recent transactions for display (take 5)
        setRecentTx(
          transactions.slice(0, 5).map((tx) => {
            const d =
              tx.date?.toDate?.() || tx.createdAt?.toDate?.() || new Date();
            return {
              id: tx.id,
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              category: tx.category || "others",
              categoryIcon: tx.categoryIcon || "📦",
              date: d.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          }),
        );

        // Budgets
        setBudgets(
          budgetDocs.map((b) => ({
            id: b.id,
            categoryName: b.categoryName,
            categoryIcon: b.categoryIcon,
            spent: b.spent || 0,
            limit: b.limit || 0,
            color: b.color || "#6b7280",
          })),
        );
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadDashboard();
    }
  }, [user?.uid, authLoading]);

  if (isLoading || authLoading) {
    return <ShimmerDashboard />;
  }

  const userName = profile?.displayName || t.dashboard.greeting;
  const initials = userName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 p-4">
      {/* Top Bar: Avatar + App Branding + Notification */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
              {profile?.photoURL ? (
                <AvatarImage src={profile.photoURL} alt={userName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.greeting}, {userName}! 👋
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Image
                src="/icons/icon-192.svg"
                alt="FinTrack AI"
                width={18}
                height={18}
                className="h-[18px] w-[18px]"
              />
              <span className="text-sm font-bold text-foreground">
                FinTrack AI
              </span>
            </div>
          </div>
        </div>
        <Link
          href="/notifications"
          className="relative h-10 w-10 rounded-xl bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Balance Card */}
      <BalanceCard
        totalBalance={totalBalance}
        income={monthlyIncome}
        expense={monthlyExpense}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Currency Converter */}
      <CurrencyConverterWidget />

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentTx} />

      {/* Budget Progress */}
      <BudgetProgress budgets={budgets} />
    </div>
  );
}
