"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Wallet,
  Plus,
  Loader2,
  Trash2,
  Banknote,
  Landmark,
  Smartphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  createWallet,
  deleteWallet,
  updateWallet,
  createTransactionWithBalance,
} from "@/lib/firestore-service";
import { Timestamp } from "firebase/firestore";

interface WalletData {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: number;
  icon: string;
  color?: string;
}

interface WalletSectionProps {
  wallets: WalletData[];
  currency?: string;
  className?: string;
  onRefresh?: () => void;
}

const WALLET_COLORS = [
  {
    key: "teal",
    bg: "bg-teal-500",
    border: "border-teal-200/50",
    gradient: "from-teal-500/10 to-teal-500/5",
  },
  {
    key: "indigo",
    bg: "bg-indigo-500",
    border: "border-indigo-200/50",
    gradient: "from-indigo-500/10 to-indigo-500/5",
  },
  {
    key: "violet",
    bg: "bg-violet-500",
    border: "border-violet-200/50",
    gradient: "from-violet-500/10 to-violet-500/5",
  },
  {
    key: "rose",
    bg: "bg-rose-500",
    border: "border-rose-200/50",
    gradient: "from-rose-500/10 to-rose-500/5",
  },
  {
    key: "amber",
    bg: "bg-amber-500",
    border: "border-amber-200/50",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
  {
    key: "emerald",
    bg: "bg-emerald-500",
    border: "border-emerald-200/50",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    key: "sky",
    bg: "bg-sky-500",
    border: "border-sky-200/50",
    gradient: "from-sky-500/10 to-sky-500/5",
  },
  {
    key: "pink",
    bg: "bg-pink-500",
    border: "border-pink-200/50",
    gradient: "from-pink-500/10 to-pink-500/5",
  },
];

const DEFAULT_TYPE_COLORS: Record<string, string> = {
  cash: "teal",
  bank: "indigo",
  ewallet: "violet",
};

function getWalletGradient(color?: string, type?: string): string {
  const colorKey = color || DEFAULT_TYPE_COLORS[type || "cash"] || "teal";
  const found = WALLET_COLORS.find((c) => c.key === colorKey);
  return found
    ? `${found.gradient} ${found.border}`
    : "from-teal-500/10 to-teal-500/5 border-teal-200/50";
}

const WALLET_TYPES: {
  key: "cash" | "bank" | "ewallet";
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "cash", Icon: Banknote },
  { key: "bank", Icon: Landmark },
  { key: "ewallet", Icon: Smartphone },
];

export function WalletSection({
  wallets,
  currency = "IDR",
  className,
  onRefresh,
}: WalletSectionProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useDynamicIslandToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bank" | "ewallet">("cash");
  const [balance, setBalance] = useState("");
  const [selectedColor, setSelectedColor] = useState("teal");
  const [isSaving, setIsSaving] = useState(false);

  // Edit sheet state
  const [editWallet, setEditWallet] = useState<WalletData | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"cash" | "bank" | "ewallet">("cash");
  const [editBalance, setEditBalance] = useState("");
  const [editColor, setEditColor] = useState("teal");
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const walletTypeLabel = (wType: string): string => {
    const labels: Record<string, string> = {
      cash: t.settings.cash,
      bank: t.settings.bank,
      ewallet: t.settings.ewallet,
    };
    return labels[wType] || wType;
  };

  const WalletTypeIcon = ({ wType, cls }: { wType: string; cls?: string }) => {
    const found = WALLET_TYPES.find((w) => w.key === wType);
    if (!found) return <Banknote className={cls} />;
    return <found.Icon className={cls} />;
  };

  const openEditSheet = (wallet: WalletData) => {
    setEditWallet(wallet);
    setEditName(wallet.name);
    setEditType(wallet.type);
    setEditBalance(String(wallet.balance));
    setEditColor(wallet.color || DEFAULT_TYPE_COLORS[wallet.type] || "teal");
  };

  const closeEditSheet = () => {
    setEditWallet(null);
    setEditName("");
    setEditBalance("");
    setShowDeleteConfirm(false);
    setShowColorPicker(false);
  };

  useEffect(() => {
    if (editWallet) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [editWallet]);

  const handleAdd = async () => {
    if (!user?.uid || !name.trim()) return;
    setIsSaving(true);
    try {
      const initialBalance = parseFloat(balance) || 0;
      // Create wallet with balance 0; the income transaction below will set it
      const walletId = await createWallet({
        userId: user.uid,
        name: name.trim(),
        type,
        balance: 0,
        icon: type,
        color: selectedColor,
      });

      if (initialBalance > 0) {
        await createTransactionWithBalance({
          userId: user.uid,
          type: "income",
          amount: initialBalance,
          description: `${t.settings.initialBalance} - ${name.trim()}`,
          category: "others",
          categoryIcon: "others",
          walletId,
          date: Timestamp.now(),
          source: "manual",
        });
      }

      showToast("success", t.toast.walletAdded);
      setShowForm(false);
      setName("");
      setBalance("");
      setSelectedColor("teal");
      onRefresh?.();
    } catch (err) {
      console.error("Add wallet error:", err);
      showToast("error", t.toast.walletAddFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editWallet || !editName.trim()) return;
    setIsEditSaving(true);
    try {
      await updateWallet(editWallet.id, {
        name: editName.trim(),
        type: editType,
        balance: parseFloat(editBalance) || 0,
        icon: editType,
        color: editColor,
      });
      showToast("success", t.toast.profileSaved);
      closeEditSheet();
      onRefresh?.();
    } catch (err) {
      console.error("Edit wallet error:", err);
      showToast("error", t.toast.saveFailed);
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editWallet || !user?.uid) return;
    setIsDeleting(true);
    try {
      await deleteWallet(editWallet.id, user.uid);
      showToast("success", t.toast.walletDeleted);
      closeEditSheet();
      onRefresh?.();
    } catch (err) {
      console.error("Delete wallet error:", err);
      showToast("error", t.toast.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          {t.settings.wallets}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t.settings.addWallet}
        </Button>
      </div>

      {/* Add Wallet Form */}
      {showForm && (
        <Card className="border">
          <CardContent className="p-3 space-y-3">
            <Input
              placeholder={t.settings.walletNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm rounded-lg"
            />
            <div className="flex gap-2">
              {WALLET_TYPES.map((wt) => (
                <button
                  key={wt.key}
                  onClick={() => setType(wt.key)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                    type === wt.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <wt.Icon className="h-3.5 w-3.5" />
                  {walletTypeLabel(wt.key)}
                </button>
              ))}
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedColor(c.key)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all flex items-center justify-center",
                    c.bg,
                    selectedColor === c.key
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  {selectedColor === c.key && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>

            <CurrencyInput
              placeholder={t.settings.initialBalance}
              value={balance}
              onChange={(v) => setBalance(v)}
              className="h-9 text-sm rounded-lg"
            />
            <Button
              className="w-full h-9 rounded-lg text-sm"
              disabled={isSaving || !name.trim()}
              onClick={handleAdd}
            >
              {isSaving ? t.general.saving : t.general.save}
            </Button>
          </CardContent>
        </Card>
      )}

      {wallets.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Wallet className="h-8 w-8 mb-2 text-muted-foreground/50" />
          <p className="text-sm font-medium">{t.emptyState.noWallets}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {t.emptyState.noWalletsDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={cn(
                "border bg-linear-to-r overflow-hidden cursor-pointer active:scale-[0.98] transition-transform",
                getWalletGradient(wallet.color, wallet.type),
              )}
              onClick={() => openEditSheet(wallet)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WalletTypeIcon
                    wType={wallet.type}
                    cls="h-5 w-5 text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {walletTypeLabel(wallet.type)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold">
                  {formatCurrency(wallet.balance, currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Wallet Bottom Sheet */}
      {editWallet && (
        <div
          className="fixed inset-0 z-55 flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditSheet();
          }}
        >
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative w-full max-w-lg bg-background rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {t.settings.editWallet}
              </h3>
              <button
                onClick={closeEditSheet}
                className="p-1 rounded-full hover:bg-muted"
              >
                <span className="sr-only">{t.general.close}</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <Input
                placeholder={t.settings.walletNamePlaceholder}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-10 rounded-xl"
              />

              <div className="flex gap-2">
                {WALLET_TYPES.map((wt) => (
                  <button
                    key={wt.key}
                    onClick={() => setEditType(wt.key)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                      editType === wt.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <wt.Icon className="h-3.5 w-3.5" />
                    {walletTypeLabel(wt.key)}
                  </button>
                ))}
              </div>

              {/* Color Picker Row */}
              <button
                onClick={() => setShowColorPicker(true)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  {t.settings.walletColor}
                </span>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full",
                    WALLET_COLORS.find((c) => c.key === editColor)?.bg ||
                      "bg-teal-500",
                  )}
                />
              </button>

              <CurrencyInput
                placeholder={t.settings.walletBalance}
                value={editBalance}
                onChange={(v) => setEditBalance(v)}
                className="h-10 rounded-xl"
              />

              <Button
                className="w-full h-10 rounded-xl"
                disabled={isEditSaving || !editName.trim()}
                onClick={handleEditSave}
              >
                {isEditSaving && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {isEditSaving ? t.general.saving : t.general.confirm}
              </Button>

              <Button
                variant="outline"
                className="w-full h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.general.delete}
              </Button>
            </div>
          </div>

          {/* Color Picker Overlay */}
          {showColorPicker && (
            <div
              className="absolute inset-0 z-10 flex items-end justify-center"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowColorPicker(false);
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative w-full max-w-lg bg-background rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {t.settings.walletColor}
                  </h3>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="p-1 rounded-full hover:bg-muted"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 justify-center pb-2">
                  {WALLET_COLORS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => {
                        setEditColor(c.key);
                        setShowColorPicker(false);
                      }}
                      className={cn(
                        "h-10 w-10 rounded-full transition-all flex items-center justify-center",
                        c.bg,
                        editColor === c.key
                          ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                          : "opacity-70 hover:opacity-100",
                      )}
                    >
                      {editColor === c.key && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        title={t.settings.deleteWalletTitle}
        message={t.settings.deleteWalletConfirm}
        confirmLabel={t.general.delete}
        cancelLabel={t.general.cancel}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
        isLoading={isDeleting}
      />
    </div>
  );
}
