import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ─── Configuration ──────────────────────────────────────────────────────────

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

function getS3Client(): S3Client {
  const config = getR2Config();
  if (!config) {
    throw new Error("Cloudflare R2 is not configured. Check environment variables.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a unique object key for avatar: avatars/{userId}.{ext} */
function getAvatarKey(userId: string, mimeType: string): string {
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  // Add timestamp to bust caches on update
  const ts = Date.now();
  return `avatars/${userId}-${ts}.${ext}`;
}

/** Extract the object key from a full R2 public URL */
export function extractKeyFromUrl(url: string): string | null {
  const config = getR2Config();
  if (!config || !url.startsWith(config.publicUrl)) return null;
  // URL format: https://pub-xxx.r2.dev/avatars/userId-ts.jpg
  return url.replace(`${config.publicUrl}/`, "");
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

/**
 * Upload an avatar image to R2.
 * Returns the public URL of the uploaded image.
 */
export async function uploadAvatar(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const config = getR2Config();
  if (!config) throw new Error("Cloudflare R2 is not configured");

  const client = getS3Client();
  const key = getAvatarKey(userId, mimeType);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${config.publicUrl}/${key}`;
}

/**
 * Delete an avatar from R2 by its public URL.
 * Returns true if deletion was successful or file didn't exist.
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  const config = getR2Config();
  if (!config) return false;

  const key = extractKeyFromUrl(avatarUrl);
  if (!key) return false;

  const client = getS3Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );
    return true;
  } catch {
    console.error("[R2] Failed to delete avatar:", key);
    return false;
  }
}

/**
 * Update avatar: delete old → upload new.
 * Returns the new public URL.
 */
export async function updateAvatar(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
  oldAvatarUrl?: string | null,
): Promise<string> {
  // Delete old avatar if it exists and is an R2 URL
  if (oldAvatarUrl) {
    await deleteAvatar(oldAvatarUrl);
  }

  // Upload new avatar
  return uploadAvatar(userId, fileBuffer, mimeType);
}
