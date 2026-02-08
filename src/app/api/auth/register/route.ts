import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { sanitizeEmail, sanitizePhone, sanitizeString, toInternationalPhone, isPasswordStrong, generateOTP } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendOTP, isWhatsAppConfigured } from "@/services/whatsapp/sender";

/**
 * POST /api/auth/register
 *
 * Step 1 of registration: Validate inputs, check uniqueness, send OTP.
 *
 * Body: { name, email, phone, password }
 * Returns: { success, message } or { error }
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateCheck = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Server belum dikonfigurasi. Hubungi admin.", code: "SERVER_ERROR" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    // --- Input Validation ---
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeString(name);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: "Nama harus 2-100 karakter.", code: "INVALID_NAME" },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: "Format email tidak valid.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: "Format nomor HP tidak valid. Gunakan format 08xx.", code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    if (!isPasswordStrong(password)) {
      return NextResponse.json(
        { error: "Password tidak memenuhi persyaratan keamanan.", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    // --- Rate limit OTP by phone ---
    const otpRateCheck = checkRateLimit(`otp:${sanitizedPhone}`, RATE_LIMITS.otpSend);
    if (!otpRateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan OTP. Tunggu beberapa menit.", code: "OTP_RATE_LIMITED" },
        { status: 429 }
      );
    }

    // --- Check phone uniqueness ---
    const db = getAdminDb();
    const usersRef = db.collection("users");
    const phoneQuery = await usersRef.where("phoneNumber", "==", sanitizedPhone).limit(1).get();

    if (!phoneQuery.empty) {
      return NextResponse.json(
        { error: "Nomor HP sudah terdaftar. Gunakan nomor lain atau masuk.", code: "PHONE_EXISTS" },
        { status: 409 }
      );
    }

    // --- Check email uniqueness ---
    const emailQuery = await usersRef.where("email", "==", sanitizedEmail).limit(1).get();
    if (!emailQuery.empty) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Gunakan email lain atau masuk.", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // --- Generate & store OTP ---
    const otp = generateOTP(6);
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    // Store pending registration
    await db.collection("otp_codes").doc(sanitizedPhone).set({
      phoneNumber: sanitizedPhone,
      email: sanitizedEmail,
      name: sanitizedName,
      code: otp,
      attempts: 0,
      createdAt: now,
      expiresAt: expiresAt,
    });

    // --- Send OTP via WhatsApp ---
    if (isWhatsAppConfigured()) {
      const internationalPhone = toInternationalPhone(sanitizedPhone);
      const result = await sendOTP(internationalPhone, otp);
      if (!result.success) {
        return NextResponse.json(
          { error: "Gagal mengirim kode OTP. Coba lagi.", code: "OTP_SEND_FAILED" },
          { status: 500 }
        );
      }
    } else {
      // Dev mode: log OTP to console
      console.log(`[DEV MODE] OTP for ${sanitizedPhone}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: "Kode verifikasi telah dikirim ke WhatsApp Anda.",
      phone: sanitizedPhone,
      // In dev mode, include OTP for testing
      ...(process.env.NODE_ENV === "development" && !isWhatsAppConfigured() ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
