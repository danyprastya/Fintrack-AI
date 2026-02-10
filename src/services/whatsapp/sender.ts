/**
 * WhatsApp message sender via Fonnte API
 *
 * Fonnte is a popular Indonesian WhatsApp API provider.
 * Sign up at https://fonnte.com to get your API token.
 *
 * Env var required: FONNTE_API_TOKEN
 *
 * Message templates are defined in `src/lib/message-templates.ts`.
 * Edit those templates to customize OTP format, notifications, etc.
 */

import {
  OTP_TEMPLATE,
  TRANSACTION_ADDED_TEMPLATE,
  BUDGET_WARNING_TEMPLATE,
  renderTemplate,
  DEFAULTS,
} from "@/lib/message-templates";

interface SendMessageResult {
  success: boolean;
  message: string;
}

/**
 * Send a WhatsApp message via Fonnte API
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
): Promise<SendMessageResult> {
  const token = process.env.FONNTE_API_TOKEN;

  if (!token) {
    console.error("FONNTE_API_TOKEN not configured");
    return { success: false, message: "WhatsApp API not configured" };
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: phoneNumber,
        message: message,
        countryCode: "62",
      }),
    });

    const data = await response.json();

    if (data.status) {
      return { success: true, message: "Message sent" };
    } else {
      console.error("Fonnte API error:", data);
      return {
        success: false,
        message: data.reason || "Failed to send message",
      };
    }
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, message: "Failed to connect to WhatsApp API" };
  }
}

/**
 * Send OTP code via WhatsApp.
 * Template is defined in `src/lib/message-templates.ts` → OTP_TEMPLATE.
 */
export async function sendOTP(
  phoneNumber: string,
  otp: string,
): Promise<SendMessageResult> {
  const message = renderTemplate(OTP_TEMPLATE, {
    otp,
    expiry: DEFAULTS.otpExpiry,
    appName: DEFAULTS.appName,
  });

  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send transaction notification via WhatsApp.
 * Template is defined in `src/lib/message-templates.ts` → TRANSACTION_ADDED_TEMPLATE.
 */
export async function sendTransactionNotification(
  phoneNumber: string,
  data: {
    type: string;
    amount: string;
    description: string;
    category: string;
    date: string;
  },
): Promise<SendMessageResult> {
  const message = renderTemplate(TRANSACTION_ADDED_TEMPLATE, data);
  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send budget warning notification via WhatsApp.
 * Template is defined in `src/lib/message-templates.ts` → BUDGET_WARNING_TEMPLATE.
 */
export async function sendBudgetWarning(
  phoneNumber: string,
  data: {
    percentage: string;
    spent: string;
    budget: string;
    remaining: string;
  },
): Promise<SendMessageResult> {
  const message = renderTemplate(BUDGET_WARNING_TEMPLATE, data);
  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Check if WhatsApp API is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!process.env.FONNTE_API_TOKEN;
}
