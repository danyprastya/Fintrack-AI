"use client";

import { useLanguage } from "@/contexts/language-context";
import {
  useNotifications,
  Notification,
} from "@/contexts/notification-context";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(date: Date, t: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string }): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t.justNow;
  if (minutes < 60) return `${minutes} ${t.minutesAgo}`;
  if (hours < 24) return `${hours} ${t.hoursAgo}`;
  return `${days} ${t.daysAgo}`;
}

const TYPE_STYLES: Record<string, string> = {
  warning: "border-l-amber-500 bg-amber-500/5",
  success: "border-l-income bg-income/5",
  expense: "border-l-expense bg-expense/5",
  info: "border-l-primary bg-primary/5",
};

function NotificationCard({
  notification,
  timeTranslations,
  onRead,
  onRemove,
}: {
  notification: Notification;
  timeTranslations: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string };
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "relative border-l-4 rounded-xl p-3.5 transition-all",
        TYPE_STYLES[notification.type] || TYPE_STYLES.info,
        notification.read && "opacity-60",
      )}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted/80 text-muted-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="text-xl shrink-0 mt-0.5">
          {notification.icon || "🔔"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">
              {notification.title}
            </p>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            {timeAgo(notification.timestamp, timeTranslations)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    markAsRead,
    removeNotification,
  } = useNotifications();

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t.settings.notifications}
        showBack
        rightAction={
          unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              {t.notificationsPage.markAllRead}
            </Button>
          ) : notifications.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive"
              onClick={clearAll}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t.notificationsPage.clearAll}
            </Button>
          ) : null
        }
      />

      <div className="flex-1 p-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <span className="text-4xl mb-3">🔕</span>
            <p className="text-sm font-medium">
              {t.notificationsPage.noNotifications}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                timeTranslations={t.notificationsPage}
                onRead={markAsRead}
                onRemove={removeNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
