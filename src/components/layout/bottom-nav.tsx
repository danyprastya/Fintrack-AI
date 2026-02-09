"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  Home,
  ArrowLeftRight,
  ScanLine,
  BarChart3,
  Settings,
} from "lucide-react";
import { useNavbar } from "@/contexts/navbar-context";

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "home" as const },
  {
    href: "/transactions",
    icon: ArrowLeftRight,
    labelKey: "transactions" as const,
  },
  { href: "/scan", icon: ScanLine, labelKey: "scan" as const },
  { href: "/analytics", icon: BarChart3, labelKey: "analytics" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { visible } = useNavbar();

  // Hide bottom nav on login, profile pages, or when explicitly hidden
  if (pathname === "/login" || pathname === "/profile" || !visible) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-card/80 backdrop-blur-xl shadow-[0_-1px_3px_rgba(0,0,0,0.05)] pb-safe">
      <div className="mx-auto max-w-lg">
        <ul className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const isScan = item.labelKey === "scan";

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-1.5 transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isScan ? (
                    <div
                      className={cn(
                        "flex items-center justify-center h-11 w-11 -mt-5 rounded-2xl shadow-lg transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-primary/30"
                          : "bg-primary/90 text-primary-foreground shadow-primary/20 hover:bg-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform",
                        isActive && "scale-110",
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  )}
                  <span
                    className={cn(
                      "text-[10px] leading-none font-medium",
                      isScan && "mt-0.5",
                    )}
                  >
                    {t.nav[item.labelKey]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
