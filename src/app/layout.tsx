import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinTrack AI — Pelacak Keuangan Cerdas",
  description:
    "Aplikasi pelacak keuangan pribadi dengan AI-OCR untuk memindai struk dan Telegram Bot untuk pencatatan harian.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinTrack AI",
  },
  openGraph: {
    title: "FinTrack AI — Pelacak Keuangan Cerdas",
    description: "Pelacak keuangan pribadi dengan AI-OCR dan Telegram Bot",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-192.png"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <AuthGuard>
                <NotificationProvider>
                  <AppShell>{children}</AppShell>
                  <BottomNav />
                  <Toaster position="top-center" richColors />
                </NotificationProvider>
              </AuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
