"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "expense";
  timestamp: Date;
  read: boolean;
  icon?: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

// Demo notifications
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Anggaran hampir habis",
    message: "Anggaran Makanan & Minuman sudah terpakai 85%. Sisa Rp 150.000",
    type: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    icon: "⚠️",
  },
  {
    id: "n2",
    title: "Gaji diterima",
    message: "Pemasukan Rp 5.000.000 tercatat di Bank BCA",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    icon: "💰",
  },
  {
    id: "n3",
    title: "Pengeluaran besar terdeteksi",
    message: "Transaksi Rp 1.250.000 di Tokopedia melebihi rata-rata harian",
    type: "expense",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
    icon: "🔔",
  },
  {
    id: "n4",
    title: "Laporan mingguan siap",
    message: "Lihat ringkasan pengeluaran minggu ini di halaman Analitik",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    icon: "📊",
  },
];

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotif: Notification = {
        ...n,
        id: `n-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      removeNotification,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      removeNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
