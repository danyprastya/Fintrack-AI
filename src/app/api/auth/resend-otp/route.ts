import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { sanitizePhone, generateOTP, toInternationalPhone } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendOTP, isWhatsAppConfigured } from "@/services/whatsapp/sender";

/**
 * POST /api/auth/resend-otp
 *
 * Resend OTP code to phone number.
 *
 * Body: { phone }
 * Returns: { success } or { error }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Server belum dikonfigurasi.", code: "SERVER_ERROR" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { phone } = body;

    const sanitizedPhone = sanitizePhone(phone);
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: "Format nomor HP tidak valid.", code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    // Rate limit
    const rateCheck = checkRateLimit(`otp:${sanitizedPhone}`, RATE_LIMITS.otpSend);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Tunggu beberapa menit.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const db = getAdminDb();
    const otpRef = db.collection("otp_codes").doc(sanitizedPhone);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Tidak ada pendaftaran yang menunggu. Silakan daftar ulang.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const now = Date.now();

    await otpRef.update({
      code: otp,
      attempts: 0,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000,
    });

    // Send via WhatsApp
    if (isWhatsAppConfigured()) {
      const result = await sendOTP(toInternationalPhone(sanitizedPhone), otp);
      if (!result.success) {
        return NextResponse.json(
          { error: "Gagal mengirim ulang OTP.", code: "SEND_FAILED" },
          { status: 500 }
        );
      }
    } else {
      console.log(`[DEV MODE] Resend OTP for ${sanitizedPhone}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: "Kode OTP baru telah dikirim.",
      ...(process.env.NODE_ENV === "development" && !isWhatsAppConfigured() ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
