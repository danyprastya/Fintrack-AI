"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Plus, SlidersHorizontal } from "lucide-react";

type FilterType = "all" | "income" | "expense" | "transfer";

// Demo data
const DEMO_TRANSACTIONS = [
  {
    id: "1",
    type: "expense" as const,
    amount: 45000,
    description: "Makan Siang di Warteg",
    categoryIcon: "🍔",
    categoryName: "Makanan & Minuman",
    date: "12:30",
    dateGroup: "Hari Ini",
    accountName: "Tunai",
  },
  {
    id: "2",
    type: "expense" as const,
    amount: 15000,
    description: "Grab ke Kantor",
    categoryIcon: "🚗",
    categoryName: "Transportasi",
    date: "08:15",
    dateGroup: "Hari Ini",
    accountName: "GoPay",
  },
  {
    id: "3",
    type: "income" as const,
    amount: 5000000,
    description: "Gaji Bulanan",
    categoryIcon: "💰",
    categoryName: "Gaji",
    date: "09:00",
    dateGroup: "Kemarin",
    accountName: "Bank BCA",
  },
  {
    id: "4",
    type: "expense" as const,
    amount: 250000,
    description: "Belanja di Indomaret",
    categoryIcon: "🛍️",
    categoryName: "Belanja",
    date: "17:45",
    dateGroup: "Kemarin",
    accountName: "Tunai",
  },
  {
    id: "5",
    type: "transfer" as const,
    amount: 1000000,
    description: "Transfer ke Tabungan",
    categoryIcon: "🔄",
    categoryName: "Transfer",
    date: "10:00",
    dateGroup: "3 hari lalu",
    accountName: "Bank BCA",
  },
  {
    id: "6",
    type: "expense" as const,
    amount: 75000,
    description: "Nonton Bioskop",
    categoryIcon: "🎬",
    categoryName: "Hiburan",
    date: "19:30",
    dateGroup: "3 hari lalu",
    accountName: "E-Wallet",
  },
];

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t.transactions.all },
    { key: "income", label: t.transactions.incomeType },
    { key: "expense", label: t.transactions.expenseType },
    { key: "transfer", label: t.transactions.transferType },
  ];

  const filteredTransactions = DEMO_TRANSACTIONS.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (
      searchQuery &&
      !tx.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t.transactions.title}
        rightAction={
          <Button size="sm" className="h-8 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t.general.add}
          </Button>
        }
      />

      <div className="p-4 space-y-4 flex-1">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.transactions.search}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <TransactionList
          transactions={filteredTransactions}
          onDelete={(id) => console.log("Delete:", id)}
          onEdit={(id) => console.log("Edit:", id)}
        />
      </div>
    </div>
  );
}
