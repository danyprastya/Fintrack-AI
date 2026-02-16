import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { sanitizePhone, sanitizeEmail, generateOTP, toInternationalPhone } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendOTP, isWhatsAppConfigured } from "@/services/whatsapp/sender";

/**
 * POST /api/auth/login-phone
 *
 * Send OTP for phone-based login.
 * If phone is found in users collection → type 'login'
 * If phone not found and email provided → try to link phone to existing email account → type 'link'
 *
 * Body: { phone, email? }
 * Returns: { success, type } or { error, code }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateCheck = checkRateLimit(`login-phone:${ip}`, RATE_LIMITS.login);
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
    const { phone, email } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Nomor HP wajib diisi.", code: "MISSING_FIELDS" },
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

    // Rate limit OTP sends by phone
    const otpRateCheck = checkRateLimit(`otp:${sanitizedPhone}`, RATE_LIMITS.otpSend);
    if (!otpRateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan OTP. Tunggu beberapa menit.", code: "OTP_RATE_LIMITED" },
        { status: 429 }
      );
    }

    const db = getAdminDb();
    const usersRef = db.collection("users");

    // --- Check if phone exists in users collection ---
    const phoneQuery = await usersRef.where("phoneNumber", "==", sanitizedPhone).limit(1).get();

    if (!phoneQuery.empty) {
      // Phone found → login flow
      const userDoc = phoneQuery.docs[0];
      const userData = userDoc.data();

      const otp = generateOTP(6);
      const now = Date.now();

      await db.collection("otp_codes").doc(sanitizedPhone).set({
        phoneNumber: sanitizedPhone,
        email: userData.email || "",
        uid: userDoc.id,
        type: "login",
        code: otp,
        attempts: 0,
        createdAt: now,
        expiresAt: now + 5 * 60 * 1000,
      });

      // Send OTP via WhatsApp
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
        console.log(`[DEV MODE] Login OTP for ${sanitizedPhone}: ${otp}`);
      }

      return NextResponse.json({
        success: true,
        type: "login",
        message: "Kode verifikasi telah dikirim ke WhatsApp Anda.",
        phone: sanitizedPhone,
        ...(process.env.NODE_ENV === "development" && !isWhatsAppConfigured() ? { devOtp: otp } : {}),
      });
    }

    // --- Phone not found ---
    if (!email) {
      // No email provided → tell client to ask for email
      return NextResponse.json(
        {
          found: false,
          code: "PHONE_NOT_FOUND",
          message: "Nomor HP belum terdaftar. Masukkan email akun Anda untuk menghubungkan.",
        },
        { status: 404 }
      );
    }

    // --- Email provided → try to link phone to existing account ---
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: "Format email tidak valid.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    // Rate limit link attempts by email (stricter)
    const linkRateCheck = checkRateLimit(`link-phone:${sanitizedEmail}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 3 per hour
    });
    if (!linkRateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const emailQuery = await usersRef.where("email", "==", sanitizedEmail).limit(1).get();

    if (emailQuery.empty) {
      return NextResponse.json(
        { error: "Akun dengan email tersebut tidak ditemukan.", code: "EMAIL_NOT_FOUND" },
        { status: 404 }
      );
    }

    const userDoc = emailQuery.docs[0];
    const userData = userDoc.data();

    // Check if account already has a different phone linked
    if (userData.phoneNumber && userData.phoneNumber !== sanitizedPhone) {
      return NextResponse.json(
        {
          error: "Akun ini sudah memiliki nomor HP lain. Gunakan nomor tersebut untuk masuk.",
          code: "PHONE_MISMATCH",
        },
        { status: 409 }
      );
    }

    // Account has no phone or same phone → send OTP to link
    const otp = generateOTP(6);
    const now = Date.now();

    await db.collection("otp_codes").doc(sanitizedPhone).set({
      phoneNumber: sanitizedPhone,
      email: sanitizedEmail,
      uid: userDoc.id,
      type: "link",
      code: otp,
      attempts: 0,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000,
    });

    // Send OTP
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
      console.log(`[DEV MODE] Link OTP for ${sanitizedPhone}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      type: "link",
      message: "Kode verifikasi telah dikirim. Setelah verifikasi, nomor HP akan terhubung ke akun Anda.",
      phone: sanitizedPhone,
      ...(process.env.NODE_ENV === "development" && !isWhatsAppConfigured() ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Login phone error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
