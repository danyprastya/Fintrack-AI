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
  X,
  Download,
  Lock,
  Loader2,
} from "lucide-react";
import {
  getWallets,
  getTransactions,
  type WalletDoc,
} from "@/lib/firestore-service";
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

// Bottom Sheet wrapper
function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-55 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-background rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
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

  useEffect(() => {
    if (!user?.uid) return;
    getWallets(user.uid).then(setWallets).catch(console.error);
  }, [user?.uid]);

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

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    localStorage.setItem("fintrack-currency", code);
    showToast("success", t.toast.currencyChanged);
    setShowCurrency(false);
  };

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
    icon: w.icon || "💳",
  }));

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

        {/* Wallets — fetched from Firestore */}
        <WalletSection
          wallets={walletData}
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
            icon={<span className="text-sm">💰</span>}
            label={t.settings.currency}
            value={selectedCurrency}
            onClick={() => setShowCurrency(true)}
          />
          <SettingsItem
            icon={<span className="text-sm">📊</span>}
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

      {/* Categories */}
      <BottomSheet
        open={showCategories}
        onClose={() => setShowCategories(false)}
        title={t.settings.categories}
      >
        <p className="text-xs text-muted-foreground mb-3">
          {t.settings.categoriesDesc}
        </p>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t.transactions.expenseType}
          </p>
          {ALL_CATEGORIES.filter(
            (c) => c.type === "expense" || c.type === "both",
          ).map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 py-2.5 px-2 rounded-lg"
            >
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm font-medium">
                {t.categories[c.name as keyof typeof t.categories] || c.name}
              </span>
            </div>
          ))}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
            {t.transactions.incomeType}
          </p>
          {ALL_CATEGORIES.filter(
            (c) => c.type === "income" || c.type === "both",
          ).map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 py-2.5 px-2 rounded-lg"
            >
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm font-medium">
                {t.categories[c.name as keyof typeof t.categories] || c.name}
              </span>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Currency */}
      <BottomSheet
        open={showCurrency}
        onClose={() => setShowCurrency(false)}
        title={t.settings.selectCurrency}
      >
        <p className="text-xs text-muted-foreground mb-3">
          {t.settings.currencyDesc}
        </p>
        <div className="space-y-1">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={cn(
                "flex items-center justify-between w-full py-3 px-3 rounded-xl transition-colors",
                selectedCurrency === c.code
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-mono font-bold w-6">
                  {c.symbol}
                </span>
                <div>
                  <p className="text-sm font-medium">{c.code}</p>
                  <p className="text-xs text-muted-foreground">{c.name}</p>
                </div>
              </div>
              {selectedCurrency === c.code && (
                <span className="text-primary text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Monthly Budget */}
      <BottomSheet
        open={showBudget}
        onClose={() => setShowBudget(false)}
        title={t.settings.monthlyBudget}
      >
        <p className="text-xs text-muted-foreground mb-3">
          {t.settings.budgetDesc}
        </p>
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm font-medium">{t.emptyState.noBudgets}</p>
          <p className="text-xs text-muted-foreground/70 mt-1 text-center">
            {t.emptyState.noBudgetsDesc}
          </p>
        </div>
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
            <span className="text-3xl">💰</span>
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
