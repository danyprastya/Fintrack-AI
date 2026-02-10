"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface DynamicIslandToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const DynamicIslandToastContext = createContext<
  DynamicIslandToastContextValue | undefined
>(undefined);

const TOAST_EMOJI: Record<ToastType, string> = {
  success: "👍",
  error: "👎",
  warning: "⚡",
  info: "💡",
};

const TOAST_BG: Record<ToastType, string> = {
  success: "bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900",
  error: "bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900",
  warning: "bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900",
  info: "bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900",
};

const AUTO_DISMISS_MS = 3000;

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
      className={`flex items-center gap-2.5 px-5 py-3 rounded-[22px] shadow-2xl backdrop-blur-xl ${TOAST_BG[toast.type]}`}
      style={{
        minWidth: 180,
        maxWidth: 340,
      }}
    >
      <span className="text-lg shrink-0">{TOAST_EMOJI[toast.type]}</span>
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </motion.div>
  );
}

export function DynamicIslandToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <DynamicIslandToastContext.Provider value={value}>
      {children}

      {/* Toast Container — iOS Dynamic Island position */}
      <div className="fixed top-3 left-0 right-0 z-9999 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </DynamicIslandToastContext.Provider>
  );
}

export function useDynamicIslandToast(): DynamicIslandToastContextValue {
  const context = useContext(DynamicIslandToastContext);
  if (!context) {
    throw new Error(
      "useDynamicIslandToast must be used within DynamicIslandToastProvider",
    );
  }
  return context;
}
