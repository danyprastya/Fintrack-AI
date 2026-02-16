import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, isAdminConfigured } from "@/lib/firebase-admin";
import { sanitizePhone } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/auth/verify-login-otp
 *
 * Verify OTP for phone login. Handles two types:
 * - 'login': Phone already linked → find user → custom token
 * - 'link':  Phone not linked → link phone to account → custom token
 *
 * Body: { phone, code }
 * Returns: { success, customToken } or { error }
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
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Data tidak lengkap.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: "Format nomor HP tidak valid.", code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    // Rate limit
    const rateCheck = checkRateLimit(`otp-verify:${sanitizedPhone}`, RATE_LIMITS.otpVerify);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan verifikasi. Tunggu beberapa menit.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const db = getAdminDb();
    const auth = getAdminAuth();

    // --- Get stored OTP ---
    const otpRef = db.collection("otp_codes").doc(sanitizedPhone);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Kode OTP tidak ditemukan. Silakan coba lagi.", code: "OTP_NOT_FOUND" },
        { status: 404 }
      );
    }

    const otpData = otpDoc.data()!;

    // Must be a login or link type OTP
    if (otpData.type !== "login" && otpData.type !== "link") {
      return NextResponse.json(
        { error: "Kode OTP tidak valid untuk login.", code: "INVALID_OTP_TYPE" },
        { status: 400 }
      );
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      await otpRef.delete();
      return NextResponse.json(
        { error: "Kode OTP sudah kedaluwarsa. Silakan kirim ulang.", code: "OTP_EXPIRED" },
        { status: 410 }
      );
    }

    // Check max attempts
    if (otpData.attempts >= 5) {
      await otpRef.delete();
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan kirim ulang OTP.", code: "MAX_ATTEMPTS" },
        { status: 429 }
      );
    }

    // Verify code
    if (otpData.code !== code.trim()) {
      await otpRef.update({ attempts: FieldValue.increment(1) });
      const remaining = 5 - (otpData.attempts + 1);
      return NextResponse.json(
        {
          error: `Kode OTP salah. Sisa percobaan: ${remaining}.`,
          code: "INVALID_OTP",
          remaining,
        },
        { status: 400 }
      );
    }

    // --- OTP Valid ---
    const uid = otpData.uid;

    if (!uid) {
      await otpRef.delete();
      return NextResponse.json(
        { error: "Data akun tidak valid. Silakan coba lagi.", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    // Verify user still exists
    try {
      await auth.getUser(uid);
    } catch {
      await otpRef.delete();
      return NextResponse.json(
        { error: "Akun tidak ditemukan.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // If type is 'link', update the user's phone number
    if (otpData.type === "link") {
      // Update Firestore user document
      await db.collection("users").doc(uid).update({
        phoneNumber: sanitizedPhone,
        phoneVerified: true,
      });

      // Also update Firebase Auth phone number
      const internationalPhone = `+${sanitizedPhone.startsWith("0") ? "62" + sanitizedPhone.slice(1) : sanitizedPhone}`;
      try {
        await auth.updateUser(uid, { phoneNumber: internationalPhone });
      } catch (authErr) {
        // If phone already exists in Auth for another user, log but don't block login
        console.warn("Failed to update Auth phone number:", authErr);
      }
    }

    // --- Clean up OTP ---
    await otpRef.delete();

    // --- Generate custom token ---
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({
      success: true,
      customToken,
      linked: otpData.type === "link",
      message: otpData.type === "link"
        ? "Nomor HP berhasil terhubung! Anda sekarang login."
        : "Login berhasil!",
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
