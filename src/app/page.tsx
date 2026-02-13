"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/contexts/notification-context";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { BudgetCategorySlider } from "@/components/dashboard/budget-category-slider";
import { WalletSlider } from "@/components/dashboard/wallet-slider";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CurrencyConverterWidget } from "@/components/dashboard/currency-converter-widget";
import { ShimmerDashboard } from "@/components/shared/shimmer-loader";
import {
  getWallets,
  getRecentTransactions,
  getBudgets,
  computeTotalBalance,
  computeMonthlyTotals,
  type BudgetDoc,
  type WalletDoc,
} from "@/lib/firestore-service";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
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
  const [walletList, setWalletList] = useState<
    {
      id: string;
      name: string;
      type: "cash" | "bank" | "ewallet";
      balance: number;
      color?: string;
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

        // Save wallet list for slider
        setWalletList(
          wallets.map((w) => ({
            id: w.id,
            name: w.name,
            type: w.type,
            balance: w.balance,
            color: w.color,
          })),
        );

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
              categoryIcon: tx.categoryIcon || "others",
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

  return (
    <div className="space-y-6">
      {/* Full-bleed Balance Hero Card (includes header) */}
      <BalanceCard
        totalBalance={totalBalance}
        income={monthlyIncome}
        expense={monthlyExpense}
        userName={userName}
        budgetLimit={budgets.reduce((sum, b) => sum + b.limit, 0) || undefined}
        photoURL={profile?.photoURL}
        unreadCount={unreadCount}
      />

      <div className="space-y-6 px-4">
        {/* Quick Actions */}
        <QuickActions />

        {/* Wallet Slider */}
        <WalletSlider wallets={walletList} />

        {/* Budget Category Slider */}
        <BudgetCategorySlider budgets={budgets} />

        {/* Currency Converter */}
        <CurrencyConverterWidget />

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTx} />

        {/* Budget Progress */}
        <BudgetProgress budgets={budgets} />
      </div>
    </div>
  );
}
