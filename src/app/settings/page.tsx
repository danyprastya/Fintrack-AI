"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useNotifications } from "@/contexts/notification-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LanguageSelector } from "@/components/settings/language-selector";
import { WalletSection } from "@/components/settings/wallet-section";
import { TelegramLinkSection } from "@/components/settings/telegram-link";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import {
  IconPickerDialog,
  IconPickerButton,
} from "@/components/shared/icon-picker";
import { CategoryIcon } from "@/lib/category-icons";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Shield,
  Database,
  Info,
  LogOut,
  ChevronRight,
  Moon,
  Tag,
  Download,
  Lock,
  Loader2,
  Plus,
  Trash2,
  Coins,
  BarChart3,
  Check,
} from "lucide-react";
import {
  getWallets,
  getTransactions,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  updateWallet,
  getCustomCategories,
  createCustomCategory,
  deleteCustomCategory,
  type WalletDoc,
  type BudgetDoc,
  type CustomCategoryDoc,
} from "@/lib/firestore-service";
import { CurrencyInput } from "@/components/ui/currency-input";
import { convertCurrency } from "@/lib/utils/exchange-rates";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsItem({
  icon,
  label,
  value,
  onClick,
  danger,
}: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${danger ? "bg-destructive/10" : "bg-muted"}`}
        >
          {icon}
        </div>
        <span
          className={`text-sm font-medium ${danger ? "text-destructive" : ""}`}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {value && (
          <span className="text-xs text-muted-foreground">{value}</span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

const CURRENCIES = [
  { code: "IDR", symbol: "Rp", name: "Rupiah Indonesia" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
];

const ALL_CATEGORIES = [
  { name: "foodDrinks", icon: "foodDrinks", type: "expense" },
  { name: "transportation", icon: "transportation", type: "expense" },
  { name: "shopping", icon: "shopping", type: "expense" },
  { name: "entertainment", icon: "entertainment", type: "expense" },
  { name: "bills", icon: "bills", type: "expense" },
  { name: "health", icon: "health", type: "expense" },
  { name: "education", icon: "education", type: "expense" },
  { name: "salary", icon: "salary", type: "income" },
  { name: "investment", icon: "investment", type: "income" },
  { name: "freelance", icon: "freelance", type: "income" },
  { name: "gift", icon: "gift", type: "income" },
  { name: "others", icon: "others", type: "both" },
];

export default function SettingsPage() {
  const { t } = useLanguage();
  const { profile, user, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { showToast } = useDynamicIslandToast();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletDoc[]>([]);

  // Dialog states
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Filter states for categories & budget
  const [catFilter, setCatFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [budgetFilter, setBudgetFilter] = useState<
    "all" | "income" | "expense"
  >("all");

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fintrack-currency") || "IDR";
    }
    return "IDR";
  });

  // Security state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Budget state
  const [budgets, setBudgets] = useState<BudgetDoc[]>([]);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Custom categories state
  const [customCategories, setCustomCategories] = useState<CustomCategoryDoc[]>(
    [],
  );
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("package");
  const [newCatType, setNewCatType] = useState<"expense" | "income" | "both">(
    "expense",
  );
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getWallets(user.uid).then(setWallets).catch(console.error);
    getCustomCategories(user.uid)
      .then(setCustomCategories)
      .catch(console.error);
  }, [user?.uid]);

  // Load budgets when budget sheet opens
  useEffect(() => {
    if (!showBudget || !user?.uid) return;
    const now = new Date();
    getBudgets(user.uid, now.getMonth() + 1, now.getFullYear())
      .then(setBudgets)
      .catch(console.error);
  }, [showBudget, user?.uid]);

  const handleSaveBudget = useCallback(async () => {
    if (!user?.uid || !budgetCategory || !budgetAmount) return;
    setIsSavingBudget(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const cat = ALL_CATEGORIES.find((c) => c.name === budgetCategory);
      const existing = budgets.find((b) => b.categoryName === budgetCategory);

      if (existing) {
        await updateBudget(existing.id, {
          limit: parseFloat(budgetAmount) || 0,
        });
      } else {
        await createBudget({
          userId: user.uid,
          categoryName: budgetCategory,
          categoryIcon: cat?.icon || "others",
          limit: parseFloat(budgetAmount) || 0,
          spent: 0,
          month,
          year,
          color: "",
        });
      }

      const updated = await getBudgets(user.uid, month, year);
      setBudgets(updated);
      setBudgetCategory("");
      setBudgetAmount("");
      showToast("success", t.toast.budgetSaved);
    } catch (err) {
      console.error("Budget save error:", err);
      showToast("error", t.toast.saveFailed);
    } finally {
      setIsSavingBudget(false);
    }
  }, [user?.uid, budgetCategory, budgetAmount, budgets, showToast, t]);

  const handleDeleteBudget = useCallback(
    async (id: string) => {
      try {
        await deleteBudget(id);
        setBudgets((prev) => prev.filter((b) => b.id !== id));
        showToast("success", t.toast.budgetDeleted);
      } catch (err) {
        console.error("Delete budget error:", err);
      }
    },
    [showToast, t],
  );

  const handleAddCustomCategory = useCallback(async () => {
    if (!user?.uid || !newCatName.trim()) return;
    try {
      await createCustomCategory({
        userId: user.uid,
        name: newCatName.trim(),
        icon: newCatIcon,
        type: newCatType,
      });
      const updated = await getCustomCategories(user.uid);
      setCustomCategories(updated);
      setNewCatName("");
      setNewCatIcon("package");
      setShowAddCategory(false);
      showToast("success", t.toast.transactionAdded);
    } catch (err) {
      console.error("Add custom category error:", err);
      showToast("error", t.toast.addFailed);
    }
  }, [user?.uid, newCatName, newCatIcon, newCatType, showToast, t]);

  const handleDeleteCustomCategory = useCallback(
    async (id: string) => {
      try {
        await deleteCustomCategory(id);
        setCustomCategories((prev) => prev.filter((c) => c.id !== id));
        showToast("success", t.toast.transactionDeleted);
      } catch (err) {
        console.error("Delete custom category error:", err);
      }
    },
    [showToast, t],
  );

  // Merge default + custom categories for budget
  const allBudgetCategories = [
    ...ALL_CATEGORIES.filter((c) => c.type === "expense" || c.type === "both"),
    ...customCategories
      .filter((c) => c.type === "expense" || c.type === "both")
      .map((c) => ({ name: c.name, icon: c.icon, type: c.type })),
  ];

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      showToast("success", t.toast.signOutSuccess);
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      showToast("error", t.toast.signOutFailed);
    } finally {
      setIsSigningOut(false);
      setShowSignOutConfirm(false);
    }
  }, [signOut, router, showToast, t]);

  const handleCurrencyChange = useCallback(
    async (code: string) => {
      const oldCurrency = selectedCurrency;
      setSelectedCurrency(code);
      localStorage.setItem("fintrack-currency", code);

      if (oldCurrency !== code && wallets.length > 0 && user?.uid) {
        try {
          for (const w of wallets) {
            const newBalance = Math.round(
              convertCurrency(w.balance || 0, oldCurrency, code),
            );
            await updateWallet(w.id, { balance: newBalance });
          }
          const updated = await getWallets(user.uid);
          setWallets(updated);
        } catch (err) {
          console.error("Currency conversion error:", err);
        }
      }

      showToast("success", t.toast.currencyChanged);
      setShowCurrency(false);
    },
    [selectedCurrency, wallets, user?.uid, showToast, t],
  );

  const handleChangePassword = async () => {
    if (!newPw || newPw !== confirmPw) {
      showToast("error", t.toast.passwordMismatch);
      return;
    }
    if (newPw.length < 6) {
      showToast("error", t.toast.passwordTooShort);
      return;
    }

    setIsChangingPw(true);
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("No user");

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPw,
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      showToast("success", t.toast.passwordChanged);
      setShowSecurity(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      console.error("Password change error:", err);
      showToast("error", t.toast.passwordFailed);
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleExport = async () => {
    if (!user?.uid) return;
    setIsExporting(true);
    try {
      const txs = await getTransactions(user.uid, 10000);
      if (txs.length === 0) {
        showToast("error", t.toast.noDataExport);
        setIsExporting(false);
        return;
      }

      const headers = "Date,Type,Amount,Description,Category,Wallet ID\n";
      const rows = txs
        .map((tx) => {
          const d =
            tx.date?.toDate?.() || tx.createdAt?.toDate?.() || new Date();
          return `"${d.toISOString()}","${tx.type}",${tx.amount},"${tx.description}","${tx.category || ""}","${tx.walletId || ""}"`;
        })
        .join("\n");

      const csv = headers + rows;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fintrack-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("success", t.toast.dataExported);
      setShowExport(false);
    } catch (err) {
      console.error("Export error:", err);
      showToast("error", t.toast.exportFailed);
    } finally {
      setIsExporting(false);
    }
  };

  const userName = profile?.displayName || t.settings.profile;
  const userEmail = profile?.email || "";
  const initials = userName.charAt(0).toUpperCase();

  const isPasswordUser = user?.providerData?.some(
    (p) => p.providerId === "password",
  );

  // Map WalletDoc to WalletData for the component
  const walletData = wallets.map((w) => ({
    id: w.id,
    name: w.name,
    type: (w.type as "cash" | "bank" | "ewallet") || "cash",
    balance: w.balance || 0,
    icon: w.icon || "cash",
    color: w.color,
  }));

  // Filtered categories for display
  const filteredCategories = ALL_CATEGORIES.filter((c) => {
    if (catFilter === "all") return true;
    if (catFilter === "expense")
      return c.type === "expense" || c.type === "both";
    return c.type === "income" || c.type === "both";
  });

  // Filtered budget categories
  const filteredBudgetCategories = (() => {
    const base = [
      ...ALL_CATEGORIES,
      ...customCategories.map((c) => ({
        name: c.name,
        icon: c.icon,
        type: c.type,
      })),
    ];
    if (budgetFilter === "all")
      return base.filter(
        (c) => c.type === "expense" || c.type === "both" || c.type === "income",
      );
    if (budgetFilter === "expense")
      return base.filter((c) => c.type === "expense" || c.type === "both");
    return base.filter((c) => c.type === "income" || c.type === "both");
  })();

  // Filter tabs component
  const FilterTabs = ({
    value,
    onChange,
  }: {
    value: "all" | "income" | "expense";
    onChange: (v: "all" | "income" | "expense") => void;
  }) => (
    <div className="flex gap-1.5">
      {(["all", "expense", "income"] as const).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
            value === f
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {f === "all"
            ? t.analytics.all
            : f === "expense"
              ? t.transactions.expenseType
              : t.transactions.incomeType}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t.settings.title} />

      <div className="flex-1 p-4 space-y-6 pb-24">
        {/* Profile */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/10">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            {profile?.photoURL ? (
              <AvatarImage src={profile.photoURL} alt={userName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold">{userName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="text-xs text-primary font-medium hover:underline"
          >
            {t.settings.editProfile}
          </button>
        </div>

        {/* Language Selector */}
        <LanguageSelector />

        <Separator />

        {/* Wallets */}
        <WalletSection
          wallets={walletData}
          currency={selectedCurrency}
          onRefresh={() => {
            if (user?.uid) getWallets(user.uid).then(setWallets);
          }}
        />

        <Separator />

        {/* General Settings */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t.settings.general}
          </p>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted">
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">{t.settings.darkMode}</span>
            </div>
            <div
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                resolvedTheme === "dark"
                  ? "bg-primary"
                  : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                  resolvedTheme === "dark" ? "translate-x-6" : "translate-x-1",
                )}
              />
            </div>
          </button>
          <SettingsItem
            icon={
              <div className="relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            }
            label={t.settings.notifications}
            onClick={() => router.push("/notifications")}
          />
          <SettingsItem
            icon={<Tag className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.categories}
            onClick={() => setShowCategories(true)}
          />
          <SettingsItem
            icon={<Coins className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.currency}
            value={selectedCurrency}
            onClick={() => setShowCurrency(true)}
          />
          <SettingsItem
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.monthlyBudget}
            onClick={() => setShowBudget(true)}
          />
        </div>

        <Separator />

        {/* Integration */}
        <TelegramLinkSection />

        <Separator />

        {/* Data & Security */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t.settings.data} & {t.settings.security}
          </p>
          <SettingsItem
            icon={<Database className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.exportData}
            onClick={() => setShowExport(true)}
          />
          <SettingsItem
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.security}
            onClick={() => setShowSecurity(true)}
          />
        </div>

        <Separator />

        {/* About & Sign Out */}
        <div className="space-y-1">
          <SettingsItem
            icon={<Info className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.about}
            value="v0.1.0"
            onClick={() => setShowAbout(true)}
          />
          <SettingsItem
            icon={<LogOut className="h-4 w-4 text-destructive" />}
            label={t.settings.signOut}
            danger
            onClick={() => setShowSignOutConfirm(true)}
          />
        </div>

        {/* App Branding */}
        <div className="text-center py-6">
          <p className="text-lg font-bold text-primary">{t.general.appName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.general.appTagline}
          </p>
        </div>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Sign Out Confirmation */}
      <ConfirmationDialog
        open={showSignOutConfirm}
        title={t.settings.signOutTitle}
        message={t.settings.signOutConfirm}
        confirmLabel={t.settings.signOut}
        cancelLabel={t.settings.cancel}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
        danger
        isLoading={isSigningOut}
      />

      {/* Categories (<50vh, filter, add in header) */}
      <BottomSheet
        open={showCategories}
        onClose={() => {
          setShowCategories(false);
          setShowAddCategory(false);
        }}
        title={t.settings.categories}
        maxHeight="48vh"
        headerRight={
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
        headerExtra={<FilterTabs value={catFilter} onChange={setCatFilter} />}
      >
        {/* Add custom category form */}
        {showAddCategory && (
          <div className="space-y-2 p-3 rounded-xl bg-muted/50 mb-3">
            <div className="flex gap-2">
              <Input
                placeholder={t.settings.categoryName}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-9 text-sm rounded-lg flex-1"
              />
              <IconPickerButton
                value={newCatIcon}
                onClick={() => setShowIconPicker(true)}
              />
            </div>
            <div className="flex gap-2">
              {(["expense", "income", "both"] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() => setNewCatType(tp)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                    newCatType === tp
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {tp === "expense"
                    ? t.transactions.expenseType
                    : tp === "income"
                      ? t.transactions.incomeType
                      : t.analytics.all}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-8 rounded-lg text-xs"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCatName("");
                }}
              >
                {t.general.cancel}
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 rounded-lg text-xs"
                disabled={!newCatName.trim()}
                onClick={handleAddCustomCategory}
              >
                {t.general.save}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-0.5">
          {filteredCategories.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 py-2.5 px-2 rounded-lg"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <CategoryIcon
                  icon={c.icon}
                  className="h-4 w-4 text-muted-foreground"
                />
              </div>
              <span className="text-sm font-medium">
                {t.categories[c.name as keyof typeof t.categories] || c.name}
              </span>
            </div>
          ))}

          {/* Custom categories */}
          {customCategories
            .filter((c) => {
              if (catFilter === "all") return true;
              if (catFilter === "expense")
                return c.type === "expense" || c.type === "both";
              return c.type === "income" || c.type === "both";
            })
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2.5 px-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <CategoryIcon
                      icon={c.icon}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </div>
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteCustomCategory(c.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
        </div>
      </BottomSheet>

      {/* Icon Picker */}
      <IconPickerDialog
        open={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(key) => setNewCatIcon(key)}
        selected={newCatIcon}
      />

      {/* Currency Bottom Sheet */}
      <BottomSheet
        open={showCurrency}
        onClose={() => setShowCurrency(false)}
        title={t.settings.selectCurrency}
      >
        <div className="space-y-0.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={cn(
                "flex items-center justify-between w-full py-3 px-3 rounded-xl transition-colors",
                selectedCurrency === c.code
                  ? "bg-primary/10"
                  : "hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold w-6">
                  {c.symbol}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium">{c.code}</p>
                  <p className="text-xs text-muted-foreground">{c.name}</p>
                </div>
              </div>
              {selectedCurrency === c.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Monthly Budget */}
      <BottomSheet
        open={showBudget}
        onClose={() => {
          setShowBudget(false);
          setBudgetCategory("");
          setBudgetAmount("");
        }}
        title={t.settings.monthlyBudget}
        headerExtra={
          <FilterTabs value={budgetFilter} onChange={setBudgetFilter} />
        }
      >
        <p className="text-xs text-muted-foreground mb-3">
          {t.settings.budgetDesc}
        </p>

        {/* Add/Edit Budget Form */}
        <div className="space-y-3 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {filteredBudgetCategories.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  if (budgetCategory === c.name) {
                    setBudgetCategory("");
                    setBudgetAmount("");
                  } else {
                    setBudgetCategory(c.name);
                    const existing = budgets.find(
                      (b) => b.categoryName === c.name,
                    );
                    if (existing) setBudgetAmount(String(existing.limit));
                    else setBudgetAmount("");
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all",
                  budgetCategory === c.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <CategoryIcon
                  icon={c.icon}
                  className={cn(
                    "h-4.5 w-4.5",
                    budgetCategory === c.name ? "text-primary-foreground" : "",
                  )}
                />
                <span className="truncate max-w-full px-1">
                  {t.categories[c.name as keyof typeof t.categories] || c.name}
                </span>
              </button>
            ))}
          </div>

          {budgetCategory && (
            <div className="flex gap-2">
              <CurrencyInput
                placeholder={t.settings.budgetAmount}
                value={budgetAmount}
                onChange={(v) => setBudgetAmount(v)}
                currencyPrefix={
                  CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol
                }
                className="h-10 flex-1 rounded-xl"
              />
              <Button
                className="h-10 rounded-xl px-6"
                onClick={handleSaveBudget}
                disabled={isSavingBudget || !budgetAmount}
              >
                {isSavingBudget ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.general.save
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Existing budgets */}
        {budgets.length > 0 ? (
          <div className="space-y-2">
            {budgets.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <CategoryIcon
                      icon={b.categoryIcon}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t.categories[
                        b.categoryName as keyof typeof t.categories
                      ] || b.categoryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat().format(b.limit)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p className="text-xs">{t.emptyState.noBudgets}</p>
          </div>
        )}
      </BottomSheet>

      {/* Export Data */}
      <BottomSheet
        open={showExport}
        onClose={() => setShowExport(false)}
        title={t.settings.exportData}
      >
        <p className="text-sm text-muted-foreground mb-4">
          {t.settings.exportDesc}
        </p>
        <Button
          className="w-full h-11 rounded-xl"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isExporting ? t.settings.exporting : t.settings.downloadCsv}
        </Button>
      </BottomSheet>

      {/* Security */}
      <BottomSheet
        open={showSecurity}
        onClose={() => {
          setShowSecurity(false);
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        }}
        title={t.settings.security}
      >
        <p className="text-xs text-muted-foreground mb-3">
          {t.settings.securityDesc}
        </p>
        {isPasswordUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {t.settings.changePassword}
              </span>
            </div>
            <Input
              type="password"
              placeholder={t.settings.currentPassword}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="h-10 rounded-xl"
            />
            <Input
              type="password"
              placeholder={t.settings.newPassword}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="h-10 rounded-xl"
            />
            <Input
              type="password"
              placeholder={t.settings.confirmPassword}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="h-10 rounded-xl"
            />
            <Button
              className="w-full h-10 rounded-xl"
              onClick={handleChangePassword}
              disabled={isChangingPw || !currentPw || !newPw || !confirmPw}
            >
              {isChangingPw ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.settings.changePassword
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <Shield className="h-8 w-8 mb-2 text-muted-foreground/60" />
            <p className="text-sm text-center">{t.settings.googleAuthInfo}</p>
          </div>
        )}
      </BottomSheet>

      {/* About */}
      <BottomSheet
        open={showAbout}
        onClose={() => setShowAbout(false)}
        title={t.settings.about}
      >
        <div className="flex flex-col items-center py-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">{t.general.appName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">v0.1.0</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed text-center px-2">
          {t.settings.aboutDesc}
        </p>
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground/50">© 2026 FinTrack AI</p>
        </div>
      </BottomSheet>
    </div>
  );
}
