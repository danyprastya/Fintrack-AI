import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

/**
 * POST /api/bot/setup
 *
 * One-click Telegram Bot setup:
 * - Set bot commands
 * - Set bot description
 * - Set bot short description
 * - Set webhook URL
 *
 * Body (optional): { "webhookUrl": "https://your-domain.com/api/bot/webhook" }
 * If webhookUrl is not provided, uses NEXT_PUBLIC_APP_URL from env.
 */
export async function POST(req: NextRequest) {
  const token = getBotToken();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const results: Record<string, unknown> = {};

  // ─── 1. Set Bot Commands ────────────────────────────────────────────────
  try {
    const commandsRes = await fetch(`${TELEGRAM_API}${token}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          {
            command: "start",
            description: "👋 Mulai dan lihat panduan",
          },
          {
            command: "help",
            description: "📖 Panduan lengkap penggunaan bot",
          },
          {
            command: "link",
            description: "🔗 Hubungkan ke akun FinTrack AI",
          },
          {
            command: "unlink",
            description: "❌ Putuskan hubungan akun",
          },
          {
            command: "balance",
            description: "👛 Lihat saldo semua dompet",
          },
          {
            command: "history",
            description: "📝 Lihat 5 transaksi terakhir",
          },
        ],
      }),
    });
    results.commands = await commandsRes.json();
  } catch (err) {
    results.commands = { error: String(err) };
  }

  // ─── 2. Set Bot Description (shown when user opens bot for first time) ──
  try {
    const descRes = await fetch(
      `${TELEGRAM_API}${token}/setMyDescription`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description:
            "🤖 FinTrack AI — Asisten keuangan pribadi Anda!\n\n" +
            "✅ Catat pengeluaran & pemasukan langsung dari Telegram\n" +
            "✅ Lihat saldo & riwayat transaksi\n" +
            "✅ Terhubung dengan aplikasi web FinTrack AI\n\n" +
            "Ketik /start untuk mulai!",
        }),
      },
    );
    results.description = await descRes.json();
  } catch (err) {
    results.description = { error: String(err) };
  }

  // ─── 3. Set Bot Short Description (shown in chat list) ─────────────────
  try {
    const shortDescRes = await fetch(
      `${TELEGRAM_API}${token}/setMyShortDescription`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_description:
            "Catat keuangan langsung dari Telegram 💰",
        }),
      },
    );
    results.shortDescription = await shortDescRes.json();
  } catch (err) {
    results.shortDescription = { error: String(err) };
  }

  // ─── 4. Set Webhook ────────────────────────────────────────────────────
  const webhookUrl =
    body.webhookUrl ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/bot/webhook`
      : null);

  if (webhookUrl) {
    try {
      const webhookRes = await fetch(
        `${TELEGRAM_API}${token}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ["message"],
            drop_pending_updates: true,
          }),
        },
      );
      results.webhook = await webhookRes.json();
      results.webhookUrl = webhookUrl;
    } catch (err) {
      results.webhook = { error: String(err) };
    }
  } else {
    results.webhook = {
      skipped: true,
      reason: "No webhookUrl provided and NEXT_PUBLIC_APP_URL not set",
    };
  }

  // ─── 5. Get Bot Info ──────────────────────────────────────────────────
  try {
    const meRes = await fetch(`${TELEGRAM_API}${token}/getMe`);
    results.botInfo = await meRes.json();
  } catch (err) {
    results.botInfo = { error: String(err) };
  }

  return NextResponse.json({
    success: true,
    message: "Bot setup completed",
    results,
  });
}

/**
 * GET /api/bot/setup — Check current webhook status
 */
export async function GET() {
  const token = getBotToken();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 503 },
    );
  }

  try {
    const [webhookRes, meRes] = await Promise.all([
      fetch(`${TELEGRAM_API}${token}/getWebhookInfo`),
      fetch(`${TELEGRAM_API}${token}/getMe`),
    ]);

    const webhookInfo = await webhookRes.json();
    const botInfo = await meRes.json();

    return NextResponse.json({ webhookInfo, botInfo });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
