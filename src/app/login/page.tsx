"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    id: {
      welcome: "Selamat Datang",
      subtitle: "Kelola keuangan Anda dengan cerdas",
      login: "Masuk",
      register: "Daftar",
      name: "Nama Lengkap",
      email: "Email",
      password: "Kata Sandi",
      orWith: "atau masuk dengan",
      google: "Google",
      noAccount: "Belum punya akun?",
      hasAccount: "Sudah punya akun?",
      registerHere: "Daftar di sini",
      loginHere: "Masuk di sini",
      errorLogin: "Email atau kata sandi salah",
      errorRegister: "Gagal mendaftar. Coba lagi.",
      errorGoogle: "Gagal masuk dengan Google",
    },
    en: {
      welcome: "Welcome",
      subtitle: "Manage your finances smartly",
      login: "Sign In",
      register: "Sign Up",
      name: "Full Name",
      email: "Email",
      password: "Password",
      orWith: "or sign in with",
      google: "Google",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      registerHere: "Register here",
      loginHere: "Sign in here",
      errorLogin: "Invalid email or password",
      errorRegister: "Failed to register. Try again.",
      errorGoogle: "Failed to sign in with Google",
    },
  };

  const l = t[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      router.push("/");
    } catch {
      setError(isRegister ? l.errorRegister : l.errorLogin);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch {
      setError(l.errorGoogle);
    } finally {
      setIsLoading(false);
    }
  };

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
        <p className="text-sm text-muted-foreground mt-1">{l.subtitle}</p>
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
          {l.login}
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
          {l.register}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {isRegister && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={l.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required={isRegister}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder={l.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 rounded-xl"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={l.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-xl"
            required
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

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRegister ? (
            l.register
          ) : (
            l.login
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{l.orWith}</span>
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
        {l.google}
      </button>

      {/* Toggle */}
      <p className="text-sm text-muted-foreground mt-6">
        {isRegister ? l.hasAccount : l.noAccount}{" "}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          className="text-primary font-medium hover:underline"
        >
          {isRegister ? l.loginHere : l.registerHere}
        </button>
      </p>
    </div>
  );
}
