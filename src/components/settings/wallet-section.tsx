"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { formatCurrency } from "@/lib/utils/currency";
import { Wallet, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createWallet, deleteWallet } from "@/lib/firestore-service";

interface WalletData {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: number;
  icon: string;
}

interface WalletSectionProps {
  wallets: WalletData[];
  currency?: string;
  className?: string;
  onRefresh?: () => void;
}

const WALLET_COLORS: Record<string, string> = {
  cash: "from-teal-500/10 to-teal-500/5 border-teal-200/50",
  bank: "from-indigo-500/10 to-indigo-500/5 border-indigo-200/50",
  ewallet: "from-violet-500/10 to-violet-500/5 border-violet-200/50",
};

const WALLET_TYPES: { key: "cash" | "bank" | "ewallet"; icon: string }[] = [
  { key: "cash", icon: "💵" },
  { key: "bank", icon: "🏦" },
  { key: "ewallet", icon: "📱" },
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
  const [isSaving, setIsSaving] = useState(false);

  const walletTypeLabel = (wType: string): string => {
    const labels: Record<string, string> = {
      cash: t.settings.cash,
      bank: t.settings.bank,
      ewallet: t.settings.ewallet,
    };
    return labels[wType] || wType;
  };

  const handleAdd = async () => {
    if (!user?.uid || !name.trim()) return;
    setIsSaving(true);
    try {
      const icon = WALLET_TYPES.find((w) => w.key === type)?.icon || "💳";
      await createWallet({
        userId: user.uid,
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        icon,
      });
      showToast("success", t.toast.walletAdded);
      setShowForm(false);
      setName("");
      setBalance("");
      onRefresh?.();
    } catch (err) {
      console.error("Add wallet error:", err);
      showToast("error", t.toast.walletAddFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWallet(id);
      showToast("success", t.toast.walletDeleted);
      onRefresh?.();
    } catch (err) {
      console.error("Delete wallet error:", err);
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
          {showForm ? (
            <X className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-1" />
          )}
          {showForm ? t.general.cancel : t.settings.addWallet}
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
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                    type === wt.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {wt.icon} {walletTypeLabel(wt.key)}
                </button>
              ))}
            </div>
            <Input
              type="number"
              inputMode="numeric"
              placeholder={t.settings.initialBalance}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
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
          <span className="text-3xl mb-2">👛</span>
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
                "border bg-linear-to-r overflow-hidden",
                WALLET_COLORS[wallet.type] || WALLET_COLORS.cash,
              )}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{wallet.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {walletTypeLabel(wallet.type)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">
                    {formatCurrency(wallet.balance, currency)}
                  </p>
                  <button
                    onClick={() => handleDelete(wallet.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
