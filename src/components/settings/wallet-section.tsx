"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
}

const WALLET_COLORS: Record<string, string> = {
  cash: "from-teal-500/10 to-teal-500/5 border-teal-200/50",
  bank: "from-indigo-500/10 to-indigo-500/5 border-indigo-200/50",
  ewallet: "from-violet-500/10 to-violet-500/5 border-violet-200/50",
};

export function WalletSection({
  wallets,
  currency = "IDR",
  className,
}: WalletSectionProps) {
  const { t } = useLanguage();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          {t.settings.wallets}
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-primary">
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t.settings.addWallet}
        </Button>
      </div>

      <div className="space-y-2">
        {wallets.map((wallet) => (
          <Card
            key={wallet.id}
            className={cn(
              "border bg-gradient-to-r overflow-hidden",
              WALLET_COLORS[wallet.type] || WALLET_COLORS.cash,
            )}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{wallet.icon}</span>
                <div>
                  <p className="text-sm font-medium">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {wallet.type}
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
    </div>
  );
}
