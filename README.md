<div align="center">

# 💰 FinTrack AI

**Smart Personal Finance Tracker with AI-Powered Receipt Scanning & Telegram Bot**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.9-FFCA28?logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

A modern, mobile-first Progressive Web App for tracking personal finances. Scan receipts with AI-powered OCR, log expenses through a Telegram Bot, visualize spending with interactive analytics, and stay in control of your budget — all in one beautiful Neo-Bank inspired interface.

</div>

---

## ✨ Features

### Core

- 📊 **Dashboard** — At-a-glance financial overview with balance card, quick actions, and budget progress
- 💳 **Transaction Management** — Add, categorize, and browse income/expense/transfer records with swipeable actions
- 📸 **AI Receipt Scanner** — Snap a photo of any receipt and let Tesseract.js OCR extract the data automatically
- 🤖 **Telegram Bot** — Log transactions on-the-go via Telegram with natural language commands
- 📈 **Analytics** — Interactive Apple-style Activity Rings for top spending categories and monthly trends

### Design & UX

- 🎨 **Neo-Bank UI** — Glassmorphism design with backdrop blur, transparency, and smooth shadows
- 🌙 **Dark / Light Mode** — Fully themed with seamless toggle
- 🌐 **Bilingual** — Indonesian (default) and English with instant language switching
- 📱 **PWA** — Installable on any device, works offline, native app feel
- 🔔 **Notifications** — In-app notification center with unread badge

### Finance Tools

- 💱 **Currency Converter** — Real-time exchange rates with popular currency pairs
- 👛 **Multi-Wallet** — Track cash, bank accounts, and e-wallets separately
- 📋 **Budget Tracking** — Set monthly limits per category with visual progress bars
- 👁️ **Privacy Mode** — Toggle balance visibility with eye icon

### Authentication

- 🔐 **Firebase Auth** — Email/password and Google sign-in
- 👤 **Profile Management** — Avatar, display name, and account settings
- 🧪 **Demo Mode** — Full app experience without Firebase configuration

---

## 🛠️ Tech Stack

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| **Framework**  | Next.js 16.1.6 (App Router, Turbopack) |
| **UI Library** | React 19.2.3                           |
| **Language**   | TypeScript 5 (strict mode)             |
| **Styling**    | Tailwind CSS 4 + oklch color space     |
| **Components** | Shadcn/UI + Radix UI primitives        |
| **Icons**      | Lucide React                           |
| **Animations** | Motion (Framer Motion) 12              |
| **Backend**    | Firebase (Firestore, Auth, Storage)    |
| **OCR Engine** | Tesseract.js 7                         |
| **Toasts**     | Sonner 2                               |
| **Font**       | Geist Sans & Geist Mono                |
| **PWA**        | next-pwa 5                             |

---

## 📁 Project Structure

```
fintrack-ai/
├── public/
│   ├── icons/              # PWA icons (192×192, 512×512)
│   └── manifest.json       # PWA manifest
├── src/
│   ├── app/
│   │   ├── analytics/      # Spending analytics with Activity Rings
│   │   ├── api/bot/        # Telegram Bot webhook API route
│   │   ├── converter/      # Full currency converter page
│   │   ├── login/          # Login & register page
│   │   ├── notifications/  # Notification center
│   │   ├── profile/        # User profile editor
│   │   ├── scan/           # AI receipt scanner (OCR)
│   │   ├── settings/       # App settings
│   │   ├── transactions/   # Transaction list & management
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── page.tsx        # Dashboard home
│   │   └── globals.css     # Theme variables & global styles
│   ├── components/
│   │   ├── analytics/      # Spending rings, charts
│   │   ├── dashboard/      # Balance card, quick actions, widgets
│   │   ├── layout/         # App shell, bottom nav
│   │   ├── settings/       # Language selector, theme toggle
│   │   ├── shared/         # Shimmer loaders, reusable components
│   │   └── ui/             # Shadcn/UI base components
│   ├── contexts/           # Auth, Language, Theme, Notification providers
│   ├── lib/                # Firebase config, utilities
│   └── services/           # OCR, Telegram bot services
├── DATABASE_SCHEMA.md      # Firestore database schema documentation
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Firebase** project (optional — app works in demo mode without it)
- **Telegram Bot Token** (optional — for bot integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/fintrack-ai.git
cd fintrack-ai

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# App URL (for Telegram webhook)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

> **Note:** All Firebase variables are optional. If not configured, the app runs in **Demo Mode** with sample data and a guest profile.

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** → Sign-in methods: Email/Password + Google
3. Create a **Firestore Database** in production mode
4. (Optional) Enable **Storage** for receipt image uploads
5. Copy your Firebase config to `.env.local`
6. Deploy Firestore security rules from [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)

> For the full database schema including collections, fields, data types, and security rules, see [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md).

---

## 🤖 Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram and create a new bot
2. Copy the bot token to `TELEGRAM_BOT_TOKEN` in `.env.local`
3. Set the webhook URL:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-domain.com/api/bot/webhook
   ```
4. Users can link their accounts and log transactions by messaging the bot

---

## 📦 Scripts

| Command         | Description                             |
| --------------- | --------------------------------------- |
| `npm run dev`   | Start development server with Turbopack |
| `npm run build` | Create optimized production build       |
| `npm run start` | Start production server                 |
| `npm run lint`  | Run ESLint checks                       |

---

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/fintrack-ai)

1. Push to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Next.js configuration

### Other Platforms

The app can be deployed to any platform supporting Node.js:

```bash
npm run build
npm run start
```

---

## 🎨 Design System

| Token             | Value                                                             |
| ----------------- | ----------------------------------------------------------------- |
| **Primary Color** | Neo-Bank Blue `#2563EB`                                           |
| **Border Radius** | `1rem` (16px)                                                     |
| **Font**          | Geist Sans / Geist Mono                                           |
| **Color Space**   | oklch (Tailwind CSS 4)                                            |
| **Theme**         | Glassmorphism with `backdrop-blur`, transparency, layered shadows |

---

## 📄 License
