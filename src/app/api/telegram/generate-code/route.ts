import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, isAdminConfigured } from "@/lib/firebase-admin";
import { generateLinkCode } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/telegram/generate-code
 *
 * Generate a one-time code for linking Telegram account.
 * Requires Firebase Auth ID token in Authorization header.
 *
 * Returns: { code, expiresIn }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Server belum dikonfigurasi." },
        { status: 500 }
      );
    }

    // Verify auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Token tidak valid." },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Rate limit
    const rateCheck = checkRateLimit(`telegram-link:${userId}`, RATE_LIMITS.telegramLink);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const db = getAdminDb();

    // Delete any existing codes for this user
    const existingCodes = await db.collection("telegram_link_codes")
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();
    existingCodes.docs.forEach(doc => batch.delete(doc.ref));
    if (!existingCodes.empty) await batch.commit();

    // Generate new code
    const code = generateLinkCode(6);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await db.collection("telegram_link_codes").doc(code).set({
      userId,
      code,
      createdAt: Date.now(),
      expiresAt,
    });

    // Check if already linked
    const linkDoc = await db.collection("telegram_links").doc(userId).get();
    const isLinked = linkDoc.exists && linkDoc.data()?.isActive === true;

    return NextResponse.json({
      code,
      expiresIn: 300, // 5 minutes in seconds
      isAlreadyLinked: isLinked,
      linkedUsername: isLinked ? linkDoc.data()?.username : null,
    });
  } catch (error) {
    console.error("Generate link code error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Detail:", errMsg);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server.",
        detail: process.env.NODE_ENV === "development" ? errMsg : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/telegram/generate-code
 *
 * Unlink Telegram from the account.
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: "Server belum dikonfigurasi." }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 401 });
    }

    const db = getAdminDb();
    const userId = decodedToken.uid;

    await db.collection("telegram_links").doc(userId).update({ isActive: false });
    await db.collection("users").doc(userId).update({ telegramChatId: null }).catch(() => {});

    return NextResponse.json({ success: true, message: "Telegram berhasil diputus." });
  } catch (error) {
    console.error("Unlink error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
