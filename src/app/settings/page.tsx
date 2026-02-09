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
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { getWallets, type WalletDoc } from "@/lib/firestore-service";

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

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const { profile, user, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { showToast } = useDynamicIslandToast();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletDoc[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    getWallets(user.uid).then(setWallets).catch(console.error);
  }, [user?.uid]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      showToast(
        "error",
        language === "id" ? "Gagal keluar" : "Sign out failed",
      );
    }
  }, [signOut, router, showToast, language]);

  const userName = profile?.displayName || t.settings.profile;
  const userEmail = profile?.email || "";
  const initials = userName.charAt(0).toUpperCase();

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

      <div className="flex-1 p-4 space-y-6">
        {/* Profile */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
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
          />
          <SettingsItem
            icon={<span className="text-sm">💰</span>}
            label={t.settings.currency}
          />
          <SettingsItem
            icon={<span className="text-sm">📊</span>}
            label={t.settings.monthlyBudget}
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
          />
          <SettingsItem
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.security}
          />
        </div>

        <Separator />

        {/* About & Sign Out */}
        <div className="space-y-1">
          <SettingsItem
            icon={<Info className="h-4 w-4 text-muted-foreground" />}
            label={t.settings.about}
            value="v0.1.0"
          />
          <SettingsItem
            icon={<LogOut className="h-4 w-4 text-destructive" />}
            label={t.settings.signOut}
            danger
            onClick={handleSignOut}
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
    </div>
  );
}
