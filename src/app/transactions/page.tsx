"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Plus, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useNavbar } from "@/contexts/navbar-context";
import {
  getTransactions,
  getWallets,
  createTransactionWithBalance,
  deleteTransaction,
  groupTransactionsByDate,
  type TransactionDoc,
  type WalletDoc,
} from "@/lib/firestore-service";

type FilterType = "all" | "income" | "expense" | "transfer";

// Default categories for the add form
const CATEGORIES = [
  { name: "foodDrinks", icon: "🍔", type: "expense" },
  { name: "transportation", icon: "🚗", type: "expense" },
  { name: "shopping", icon: "🛍️", type: "expense" },
  { name: "entertainment", icon: "🎬", type: "expense" },
  { name: "bills", icon: "📄", type: "expense" },
  { name: "health", icon: "💊", type: "expense" },
  { name: "education", icon: "📚", type: "expense" },
  { name: "salary", icon: "💰", type: "income" },
  { name: "investment", icon: "📈", type: "income" },
  { name: "freelance", icon: "💻", type: "income" },
  { name: "gift", icon: "🎁", type: "income" },
  { name: "others", icon: "📦", type: "both" },
] as const;

export default function TransactionsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useDynamicIslandToast();
  const { hide: hideNav, show: showNav } = useNavbar();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);
  const [wallets, setWallets] = useState<WalletDoc[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [addAmount, setAddAmount] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addCategory, setAddCategory] = useState("others");
  const [addWalletId, setAddWalletId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t.transactions.all },
    { key: "income", label: t.transactions.incomeType },
    { key: "expense", label: t.transactions.expenseType },
    { key: "transfer", label: t.transactions.transferType },
  ];

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const [txs, wls] = await Promise.all([
        getTransactions(user.uid, 100),
        getWallets(user.uid),
      ]);
      setTransactions(txs);
      setWallets(wls);
      if (wls.length > 0 && !addWalletId) {
        setAddWalletId(wls[0].id);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, addWalletId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTransaction(id);
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        showToast("success", t.toast.transactionDeleted);
      } catch (err) {
        console.error("Delete error:", err);
        showToast(
          "error",
          language === "id" ? "Gagal menghapus" : "Failed to delete",
        );
      }
    },
    [showToast, language, t],
  );

  const handleAdd = useCallback(async () => {
    if (!user?.uid || !addAmount || !addDesc) return;
    const amount = parseFloat(addAmount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount <= 0) return;

    setIsSaving(true);
    try {
      const cat = CATEGORIES.find((c) => c.name === addCategory);
      await createTransactionWithBalance({
        userId: user.uid,
        type: addType,
        amount,
        description: addDesc,
        category: addCategory,
        categoryIcon: cat?.icon || "📦",
        walletId: addWalletId || undefined,
        date: Timestamp.now(),
        source: "manual",
      });
      showToast("success", t.toast.transactionAdded);
      setShowAddForm(false);
      showNav();
      setAddAmount("");
      setAddDesc("");
      setAddCategory("others");
      await loadData();
    } catch (err) {
      console.error("Add error:", err);
      showToast(
        "error",
        language === "id" ? "Gagal menambahkan" : "Failed to add",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    user?.uid,
    addType,
    addAmount,
    addDesc,
    addCategory,
    addWalletId,
    showToast,
    language,
    loadData,
    showNav,
    t,
  ]);

  // Group and filter transactions for display
  const grouped = groupTransactionsByDate(
    transactions,
    language === "id" ? "id-ID" : "en-US",
  );
  const filteredTransactions = grouped.filter((tx) => {
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
          <Button
            size="sm"
            className="h-8 rounded-xl text-xs"
            onClick={() => {
              setShowAddForm(true);
              hideNav();
            }}
          >
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
          isLoading={isLoading}
          onDelete={handleDelete}
          onEdit={() => {}}
        />
      </div>

      {/* Add Transaction Bottom Sheet */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-background rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {language === "id" ? "Tambah Transaksi" : "Add Transaction"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  showNav();
                }}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() => setAddType(tp)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                    addType === tp
                      ? tp === "expense"
                        ? "bg-rose-500 text-white"
                        : "bg-teal-500 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tp === "expense"
                    ? t.transactions.expenseType
                    : t.transactions.incomeType}
                </button>
              ))}
            </div>

            {/* Amount */}
            <Input
              type="number"
              inputMode="numeric"
              placeholder={
                language === "id" ? "Jumlah (contoh: 50000)" : "Amount"
              }
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="h-12 text-lg rounded-xl"
            />

            {/* Description */}
            <Input
              placeholder={
                language === "id"
                  ? "Deskripsi (contoh: Makan siang)"
                  : "Description"
              }
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              className="h-10 rounded-xl"
            />

            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(
                (c) => c.type === addType || c.type === "both",
              ).map((c) => (
                <button
                  key={c.name}
                  onClick={() => setAddCategory(c.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    addCategory === c.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>

            {/* Wallet selector */}
            {wallets.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {addType === "income"
                    ? t.settings.depositTo
                    : t.settings.payFrom}
                </label>
                <select
                  value={addWalletId}
                  onChange={(e) => setAddWalletId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-muted px-3 text-sm"
                >
                  <option value="">
                    {language === "id" ? "Pilih dompet" : "Select wallet"}
                  </option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Save button */}
            <Button
              className="w-full h-11 rounded-xl"
              disabled={isSaving || !addAmount || !addDesc}
              onClick={handleAdd}
            >
              {isSaving
                ? language === "id"
                  ? "Menyimpan..."
                  : "Saving..."
                : language === "id"
                  ? "Simpan"
                  : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
