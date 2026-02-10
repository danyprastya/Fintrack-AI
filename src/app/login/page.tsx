"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { checkPasswordStrength, type PasswordCheck } from "@/lib/sanitize";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

type Step = "form" | "otp";

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithToken } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useDynamicIslandToast();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<Step>("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Password strength
  const pwChecks: PasswordCheck = checkPasswordStrength(password);
  const allPwValid = Object.values(pwChecks).every(Boolean);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // --- Login handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signIn(email, password);
      showToast("success", t.toast.loginSuccess);
      router.push("/");
    } catch {
      setError(t.login.errorLogin);
      showToast("error", t.toast.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Register Step 1: Send OTP ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allPwValid) {
      setError(
        language === "id"
          ? "Password belum memenuhi semua persyaratan."
          : "Password doesn't meet all requirements.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Check if account already exists
        if (
          data.error?.includes("already") ||
          data.error?.includes("sudah") ||
          res.status === 409
        ) {
          showToast("error", t.toast.accountExists);
          setError(t.toast.accountExists);
        } else {
          setError(data.error || "Registration failed");
        }
        return;
      }

      if (data.devOtp) setDevOtp(data.devOtp);
      setResendTimer(60);
      setStep("otp");
    } catch {
      setError(
        language === "id"
          ? "Gagal menghubungi server."
          : "Failed to connect to server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP Input handlers ---
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newDigits = [...otpDigits];
      newDigits[index] = value.slice(-1);
      setOtpDigits(newDigits);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits],
  );

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newDigits = [...Array(6)].map((_, i) => pasted[i] || "");
    setOtpDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  }, []);

  // --- Register Step 2: Verify OTP ---
  const handleVerify = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) return;

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      // Sign in with custom token
      await signInWithToken(data.customToken);
      router.push("/");
    } catch {
      setError(t.login.verifyFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Resend OTP ---
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      if (data.devOtp) setDevOtp(data.devOtp);
      setResendTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch {
      setError(t.login.resendFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google sign-in ---
  const handleGoogle = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      showToast("success", t.toast.loginSuccess);
      router.push("/");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === "auth/unauthorized-domain") {
        setError(t.toast.unauthorized);
        showToast("error", t.toast.unauthorized);
      } else if (firebaseError.code === "auth/popup-closed-by-user") {
        setError(t.toast.popupClosed);
        showToast("warning", t.toast.popupClosed);
      } else if (
        firebaseError.code === "auth/operation-not-allowed" ||
        firebaseError.code === "auth/admin-restricted-operation"
      ) {
        setError(t.toast.googleNotEnabled);
        showToast("error", t.toast.googleNotEnabled);
      } else if (firebaseError.code === "auth/cancelled-popup-request") {
        // User opened multiple popups, ignore silently
      } else {
        setError(
          `${t.toast.googleFailed}${firebaseError.code ? ` (${firebaseError.code})` : ""}`,
        );
        showToast("error", t.toast.googleFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===== OTP VERIFICATION SCREEN =====
  if (step === "otp") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Back */}
          <button
            onClick={() => {
              setStep("form");
              setOtpDigits(["", "", "", "", "", ""]);
              setError("");
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.login.back}
          </button>

          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t.login.verifyTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              {t.login.verifySub}
            </p>
            <p className="text-sm font-medium text-primary mt-2">
              +62 {phone.replace(/^0/, "")}
            </p>
          </div>

          {/* OTP Inputs */}
          <div
            className="flex justify-center gap-2.5 mb-6"
            onPaste={handleOtpPaste}
          >
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={cn(
                  "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all outline-none",
                  digit
                    ? "border-primary text-foreground"
                    : "border-border text-muted-foreground focus:border-primary",
                )}
              />
            ))}
          </div>

          {/* Dev OTP indicator */}
          {devOtp && (
            <div className="text-center mb-4 p-2 bg-amber-500/10 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                {t.login.devOtpLabel}: {devOtp}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center mb-4">{error}</p>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || otpDigits.join("").length !== 6}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t.login.verify
            )}
          </button>

          {/* Resend */}
          <div className="text-center mt-4">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.login.resendIn}{" "}
                <span className="font-medium text-foreground">
                  {resendTimer}s
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
              >
                {t.login.resend}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN LOGIN/REGISTER FORM =====
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
          <Image
            src="/icons/icon-192.svg"
            alt="FinTrack AI"
            width={40}
            height={40}
            className="h-10 w-10"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground">FinTrack AI</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.login.subtitle}</p>
      </div>

      {/* Tab */}
      <div className="w-full max-w-sm flex gap-1 p-1 bg-muted rounded-xl mb-6">
        <button
          onClick={() => {
            setIsRegister(false);
            setError("");
          }}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
            !isRegister
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {t.login.login}
        </button>
        <button
          onClick={() => {
            setIsRegister(true);
            setError("");
          }}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
            isRegister
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {t.login.register}
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={isRegister ? handleRegister : handleLogin}
        className="w-full max-w-sm space-y-4"
      >
        {/* Name (register only) */}
        {isRegister && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t.login.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
              autoComplete="name"
            />
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder={t.login.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 rounded-xl"
            required
            autoComplete="email"
          />
        </div>

        {/* Phone (register only) */}
        {isRegister && (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder={t.login.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
              className="pl-10 h-12 rounded-xl"
              required
              autoComplete="tel"
              maxLength={15}
            />
          </div>
        )}

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t.login.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-xl"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Password Strength Checklist (register only) */}
        {isRegister && password.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t.login.pwStrength}
            </p>
            <PwCheck passed={pwChecks.minLength} label={t.login.pwMin} />
            <PwCheck passed={pwChecks.hasUppercase} label={t.login.pwUpper} />
            <PwCheck passed={pwChecks.hasLowercase} label={t.login.pwLower} />
            <PwCheck passed={pwChecks.hasNumber} label={t.login.pwNumber} />
            <PwCheck passed={pwChecks.hasSpecial} label={t.login.pwSpecial} />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || (isRegister && !allPwValid)}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRegister ? (
            t.login.sendOtp
          ) : (
            t.login.login
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{t.login.orWith}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={isLoading}
        className="w-full max-w-sm h-12 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {t.login.google}
      </button>

      {/* Toggle + Security badge */}
      <p className="text-sm text-muted-foreground mt-6">
        {isRegister ? t.login.hasAccount : t.login.noAccount}{" "}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          className="text-primary font-medium hover:underline"
        >
          {isRegister ? t.login.loginHere : t.login.registerHere}
        </button>
      </p>

      <div className="flex items-center gap-1.5 mt-4 text-muted-foreground/60">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="text-[11px]">{t.login.secureInfo}</span>
      </div>
    </div>
  );
}

/** Password check item */
function PwCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      )}
      <span
        className={cn(
          "text-xs transition-colors",
          passed
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
