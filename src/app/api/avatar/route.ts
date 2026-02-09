import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";
import {
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
  isR2Configured,
} from "@/services/cloudflare/r2";

// Max file size: 10 MB (photos go through client-side crop/resize to 512x512)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Extract and verify Firebase ID token from Authorization header */
async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.slice(7);
  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

// ─── POST: Upload / Update Avatar ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Check services
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Firebase Admin not configured" },
      { status: 503 },
    );
  }
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Cloudflare R2 not configured" },
      { status: 503 },
    );
  }

  // Verify auth
  const decodedToken = await verifyAuth(req);
  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = decodedToken.uid;

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP" },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 10 MB" },
        { status: 400 },
      );
    }

    // Read file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get old avatar URL from Firestore to delete it
    const adminDb = getAdminDb();
    let oldAvatarUrl: string | null = null;

    if (adminDb) {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      oldAvatarUrl = userDoc.data()?.photoURL || null;
    }

    // Upload (or update if old exists)
    const newUrl = oldAvatarUrl
      ? await updateAvatar(userId, buffer, file.type, oldAvatarUrl)
      : await uploadAvatar(userId, buffer, file.type);

    // Update Firestore
    if (adminDb) {
      await adminDb.collection("users").doc(userId).set(
        { photoURL: newUrl },
        { merge: true },
      );
    }

    // Update Firebase Auth profile
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      await adminAuth.updateUser(userId, { photoURL: newUrl });
    }

    return NextResponse.json({ photoURL: newUrl });
  } catch (error) {
    console.error("[Avatar] Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 },
    );
  }
}

// ─── DELETE: Remove Avatar ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Firebase Admin not configured" },
      { status: 503 },
    );
  }

  const decodedToken = await verifyAuth(req);
  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = decodedToken.uid;

  try {
    const adminDb = getAdminDb();
    let avatarUrl: string | null = null;

    // Get current avatar URL
    if (adminDb) {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      avatarUrl = userDoc.data()?.photoURL || null;
    }

    // Delete from R2 if it's an R2 URL
    if (avatarUrl && isR2Configured()) {
      await deleteAvatar(avatarUrl);
    }

    // Clear in Firestore
    if (adminDb) {
      await adminDb.collection("users").doc(userId).set(
        { photoURL: null },
        { merge: true },
      );
    }

    // Clear in Firebase Auth
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      await adminAuth.updateUser(userId, { photoURL: "" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Avatar] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 },
    );
  }
}
