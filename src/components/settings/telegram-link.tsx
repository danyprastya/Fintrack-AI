"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Copy,
  CheckCircle2,
  Loader2,
  Link2Off,
  RefreshCw,
} from "lucide-react";

export function TelegramLinkSection() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useDynamicIslandToast();

  const [code, setCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const t = {
    id: {
      title: "Hubungkan Telegram",
      desc: "Catat transaksi langsung dari Telegram Bot",
      generate: "Buat Kode",
      regenerate: "Buat Ulang",
      linked: "Terhubung",
      linkedAs: "Terhubung sebagai",
      unlink: "Putuskan",
      copied: "Tersalin!",
      copy: "Salin",
      expires: "Berlaku",
      sec: "detik",
      step1: "Buka bot Telegram:",
      step2: "Kirim perintah:",
      step3: "Mulai catat transaksi!",
      unlinkConfirm: "Telegram berhasil diputus.",
      error: "Gagal. Coba lagi.",
    },
    en: {
      title: "Link Telegram",
      desc: "Record transactions directly from Telegram Bot",
      generate: "Generate Code",
      regenerate: "Regenerate",
      linked: "Connected",
      linkedAs: "Connected as",
      unlink: "Unlink",
      copied: "Copied!",
      copy: "Copy",
      expires: "Valid for",
      sec: "seconds",
      step1: "Open Telegram bot:",
      step2: "Send command:",
      step3: "Start recording transactions!",
      unlinkConfirm: "Telegram unlinked successfully.",
      error: "Failed. Try again.",
    },
  };
  const l = t[language];

  // Countdown timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((p) => {
        if (p <= 1) {
          setCode(null);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  const generateCode = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    setCopied(false);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || l.error);
        showToast("error", data.error || l.error);
        return;
      }

      setCode(data.code);
      setExpiresIn(data.expiresIn);
      setIsLinked(data.isAlreadyLinked);
      setLinkedUsername(data.linkedUsername);
    } catch {
      setError(l.error);
      showToast("error", l.error);
    } finally {
      setIsLoading(false);
    }
  }, [user, l.error]);

  const handleUnlink = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/telegram/generate-code", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setIsLinked(false);
      setLinkedUsername(null);
      setCode(null);
      showToast("success", l.unlinkConfirm);
    } catch {
      setError(l.error);
      showToast("error", l.error);
    } finally {
      setIsLoading(false);
    }
  }, [user, l.error]);

  const copyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(`/link ${code}`);
    setCopied(true);
    showToast("success", l.copied);
    setTimeout(() => setCopied(false), 2000);
  }, [code, showToast, l.copied]);

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YourBot";

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {l.title}
      </p>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{l.title}</p>
            <p className="text-xs text-muted-foreground">{l.desc}</p>
          </div>
          {isLinked && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              {l.linked}
            </span>
          )}
        </div>

        {/* Already linked status */}
        {isLinked && linkedUsername && (
          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground">
              {l.linkedAs}{" "}
              <span className="font-medium text-foreground">
                @{linkedUsername}
              </span>
            </p>
            <button
              onClick={handleUnlink}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
            >
              <Link2Off className="h-3 w-3" />
              {l.unlink}
            </button>
          </div>
        )}

        {/* Code display */}
        {code && !isLinked && (
          <div className="space-y-3">
            {/* Code box */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-xl px-4 py-3 font-mono text-lg text-center font-bold tracking-[0.3em]">
                {code}
              </div>
              <button
                onClick={copyCode}
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                  copied
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                )}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Timer */}
            <p className="text-xs text-center text-muted-foreground">
              {l.expires}{" "}
              <span className="font-medium text-foreground">
                {Math.floor(expiresIn / 60)}:
                {String(expiresIn % 60).padStart(2, "0")}
              </span>
            </p>

            {/* Instructions */}
            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">1.</span>{" "}
                {l.step1}{" "}
                <a
                  href={`https://t.me/${botName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  @{botName}
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">2.</span>{" "}
                {l.step2}{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono font-medium">
                  /link {code}
                </code>
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">3.</span>{" "}
                {l.step3} 🎉
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}

        {/* Generate / Regenerate button */}
        {!isLinked && (
          <button
            onClick={generateCode}
            disabled={isLoading}
            className={cn(
              "w-full h-10 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50",
              code
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-[#0088cc] text-white hover:bg-[#0088cc]/90",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : code ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                {l.regenerate}
              </>
            ) : (
              l.generate
            )}
          </button>
        )}
      </div>
    </div>
  );
}
