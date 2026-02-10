import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, isAdminConfigured } from "@/lib/firebase-admin";
import { sanitizePhone } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/auth/verify-otp
 *
 * Step 2 of registration: Verify OTP, create account, return custom token.
 *
 * Body: { phone, code, password }
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
    const { phone, code, password } = body;

    if (!phone || !code || !password) {
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

    // Rate limit by phone
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
        { error: "Kode OTP tidak ditemukan. Silakan daftar ulang.", code: "OTP_NOT_FOUND" },
        { status: 404 }
      );
    }

    const otpData = otpDoc.data()!;

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      await otpRef.delete();
      return NextResponse.json(
        { error: "Kode OTP sudah kedaluwarsa. Silakan daftar ulang.", code: "OTP_EXPIRED" },
        { status: 410 }
      );
    }

    // Check max attempts
    if (otpData.attempts >= 5) {
      await otpRef.delete();
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan daftar ulang.", code: "MAX_ATTEMPTS" },
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

    // --- OTP Valid — Create Firebase Auth account ---
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: otpData.email,
        emailVerified: true,
        password: password,
        displayName: otpData.name,
        phoneNumber: `+${sanitizedPhone.startsWith("0") ? "62" + sanitizedPhone.slice(1) : sanitizedPhone}`,
      });
    } catch (authError: unknown) {
      const errorMessage = authError instanceof Error ? authError.message : "Unknown error";
      if (errorMessage.includes("email-already-exists")) {
        await otpRef.delete();
        return NextResponse.json(
          { error: "Email sudah terdaftar.", code: "EMAIL_EXISTS" },
          { status: 409 }
        );
      }
      throw authError;
    }

    // --- Create user document in Firestore ---
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      displayName: otpData.name,
      email: otpData.email,
      phoneNumber: sanitizedPhone,
      phoneVerified: true,
      photoURL: null,
      currency: "IDR",
      language: "id",
      createdAt: FieldValue.serverTimestamp(),
    });

    // --- Clean up OTP ---
    await otpRef.delete();

    // --- Generate custom token for client sign-in ---
    const customToken = await auth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      success: true,
      customToken,
      message: "Akun berhasil dibuat!",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
