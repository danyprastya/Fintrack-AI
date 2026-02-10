/**
 * Configurable message templates for WhatsApp (Fonnte) and other notifications.
 *
 * Variables use {placeholder} syntax and are replaced at runtime.
 * Edit these templates to customize the format of outgoing messages.
 */

export interface MessageTemplate {
  /** Template string with {variable} placeholders */
  body: string;
  /** Description of what this template is for */
  description: string;
  /** Available placeholder variables */
  variables: string[];
}

// ─── OTP / AUTHENTICATION ────────────────────────────────────────────

export const OTP_TEMPLATE: MessageTemplate = {
  description: "Verification code sent during registration",
  variables: ["{otp}", "{expiry}", "{appName}"],
  body: [
    "*{appName}*",
    "",
    "Kode OTP Anda: *{otp}*",
    "",
    "Kode ini berlaku selama {expiry} menit.",
    "Jangan bagikan kode ini kepada siapapun.",
    "",
    "_Jika Anda tidak meminta kode ini, abaikan pesan ini._",
  ].join("\n"),
};

// ─── TRANSACTION NOTIFICATIONS ───────────────────────────────────────

export const TRANSACTION_ADDED_TEMPLATE: MessageTemplate = {
  description: "Notification when a new transaction is recorded",
  variables: ["{type}", "{amount}", "{description}", "{category}", "{date}"],
  body: [
    "📝 *Transaksi Baru Tercatat*",
    "",
    "Tipe: {type}",
    "Jumlah: {amount}",
    "Deskripsi: {description}",
    "Kategori: {category}",
    "Tanggal: {date}",
  ].join("\n"),
};

export const DAILY_SUMMARY_TEMPLATE: MessageTemplate = {
  description: "Daily spending summary",
  variables: ["{date}", "{totalIncome}", "{totalExpense}", "{balance}", "{transactionCount}"],
  body: [
    "📊 *Ringkasan Harian - {date}*",
    "",
    "💰 Pemasukan: {totalIncome}",
    "💸 Pengeluaran: {totalExpense}",
    "📈 Saldo: {balance}",
    "📋 Total transaksi: {transactionCount}",
  ].join("\n"),
};

export const BUDGET_WARNING_TEMPLATE: MessageTemplate = {
  description: "Warning when spending approaches budget limit",
  variables: ["{percentage}", "{spent}", "{budget}", "{remaining}"],
  body: [
    "⚠️ *Peringatan Budget*",
    "",
    "Pengeluaran bulan ini sudah mencapai *{percentage}%* dari budget.",
    "Terpakai: {spent} dari {budget}",
    "Sisa: {remaining}",
  ].join("\n"),
};

// ─── TEMPLATE RENDERER ──────────────────────────────────────────────

/**
 * Render a message template by replacing {variable} placeholders with actual values.
 *
 * @example
 * ```ts
 * const msg = renderTemplate(OTP_TEMPLATE, {
 *   otp: "123456",
 *   expiry: "5",
 *   appName: "FinTrack AI",
 * });
 * ```
 */
export function renderTemplate(
  template: MessageTemplate,
  values: Record<string, string>,
): string {
  let result = template.body;
  for (const [key, value] of Object.entries(values)) {
    // Support both {key} and key formats
    const placeholder = key.startsWith("{") ? key : `{${key}}`;
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

// ─── DEFAULT VALUES ─────────────────────────────────────────────────

export const DEFAULTS = {
  appName: "FinTrack AI",
  otpExpiry: "5",
} as const;
