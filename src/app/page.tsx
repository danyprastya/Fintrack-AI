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

// Demo data — will be replaced with Firebase data
const DEMO_TRANSACTIONS = [
  {
    id: "1",
    type: "expense" as const,
    amount: 45000,
    description: "Makan Siang",
    category: "foodDrinks",
    categoryIcon: "🍔",
    date: "Hari Ini",
  },
  {
    id: "2",
    type: "expense" as const,
    amount: 15000,
    description: "Grab ke Kantor",
    category: "transportation",
    categoryIcon: "🚗",
    date: "Hari Ini",
  },
  {
    id: "3",
    type: "income" as const,
    amount: 5000000,
    description: "Gaji Bulanan",
    category: "salary",
    categoryIcon: "💰",
    date: "Kemarin",
  },
  {
    id: "4",
    type: "expense" as const,
    amount: 250000,
    description: "Belanja Bulanan",
    category: "shopping",
    categoryIcon: "🛍️",
    date: "Kemarin",
  },
  {
    id: "5",
    type: "transfer" as const,
    amount: 1000000,
    description: "Transfer ke Bank",
    category: "others",
    categoryIcon: "🔄",
    date: "3 hari lalu",
  },
];

const DEMO_BUDGETS = [
  {
    id: "1",
    categoryName: "Makanan & Minuman",
    categoryIcon: "🍔",
    spent: 850000,
    limit: 1500000,
    color: "#f97316",
  },
  {
    id: "2",
    categoryName: "Transportasi",
    categoryIcon: "🚗",
    spent: 420000,
    limit: 500000,
    color: "#3b82f6",
  },
  {
    id: "3",
    categoryName: "Hiburan",
    categoryIcon: "🎬",
    spent: 200000,
    limit: 300000,
    color: "#8b5cf6",
  },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || authLoading) {
    return <ShimmerDashboard />;
  }

  const userName = profile?.displayName || "Pengguna";
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
      <BalanceCard totalBalance={4240000} income={5000000} expense={760000} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Currency Converter */}
      <CurrencyConverterWidget />

      {/* Recent Transactions */}
      <RecentTransactions transactions={DEMO_TRANSACTIONS} />

      {/* Budget Progress */}
      <BudgetProgress budgets={DEMO_BUDGETS} />
    </div>
  );
}
