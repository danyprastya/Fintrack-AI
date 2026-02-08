/**
 * WhatsApp message sender via Fonnte API
 *
 * Fonnte is a popular Indonesian WhatsApp API provider.
 * Sign up at https://fonnte.com to get your API token.
 *
 * Env var required: FONNTE_API_TOKEN
 */

interface SendMessageResult {
  success: boolean;
  message: string;
}

/**
 * Send a WhatsApp message via Fonnte API
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
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
      return { success: false, message: data.reason || "Failed to send message" };
    }
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, message: "Failed to connect to WhatsApp API" };
  }
}

/**
 * Send OTP code via WhatsApp
 */
export async function sendOTP(phoneNumber: string, otp: string): Promise<SendMessageResult> {
  const message =
    `🔐 *FinTrack AI - Kode Verifikasi*\n\n` +
    `Kode OTP Anda: *${otp}*\n\n` +
    `Kode ini berlaku selama 5 menit.\n` +
    `Jangan bagikan kode ini kepada siapapun.\n\n` +
    `_Jika Anda tidak meminta kode ini, abaikan pesan ini._`;

  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Check if WhatsApp API is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!process.env.FONNTE_API_TOKEN;
}
