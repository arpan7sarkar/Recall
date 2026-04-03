import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── R2 Client (S3-compatible) ──────────────────────────────────────────────

const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? null; // optional public domain

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

// ── Types ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  key: string;       // storage key (path inside the bucket)
  url: string;       // publicly accessible URL (or pre-signed if no public domain)
  size: number;
  mimeType: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a scoped storage key.
 * Format: uploads/{userId}/{folder}/{filename}
 * Example: uploads/user_abc123/thumbnails/item_xyz.jpg
 */
export function buildKey(userId: string, folder: string, filename: string): string {
  // Sanitise filename – strip any path traversal and special chars
  const safe = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `uploads/${userId}/${folder}/${Date.now()}_${safe}`;
}

/**
 * Return a public URL if a custom public domain is set,
 * otherwise generate a 7-day pre-signed GET URL.
 */
async function resolveUrl(key: string, expiresIn = 60 * 60 * 24 * 7): Promise<string> {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }

  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

// ── Core Functions ─────────────────────────────────────────────────────────

/**
 * Upload a buffer to R2.
 *
 * @param buffer   - Raw file bytes
 * @param key      - Storage key (use buildKey() to construct it)
 * @param mimeType - MIME type string, e.g. "image/jpeg"
 * @returns        - UploadResult with key and accessible URL
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ContentLength: buffer.byteLength,
  });

  await r2.send(command);

  const url = await resolveUrl(key);

  return {
    key,
    url,
    size: buffer.byteLength,
    mimeType,
  };
}

/**
 * Delete a file from R2 by its key.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key });
  await r2.send(command);
}

/**
 * Generate a fresh pre-signed GET URL for an existing key.
 * Useful when a stored URL has expired.
 *
 * @param key       - Storage key
 * @param expiresIn - Expiry in seconds (default: 7 days)
 */
export async function getFileUrl(key: string, expiresIn?: number): Promise<string> {
  return resolveUrl(key, expiresIn);
}

/**
 * Upload a file fetched from a remote URL (e.g. a thumbnail scraped from the web).
 *
 * @param remoteUrl - The URL to fetch and re-upload
 * @param key       - Storage key
 * @param mimeType  - Expected MIME type (defaults to image/jpeg)
 */
export async function uploadFromUrl(
  remoteUrl: string,
  key: string,
  mimeType = "image/jpeg"
): Promise<UploadResult> {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote file: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);  

  return uploadFile(buffer, key, mimeType);
}

export { r2 };
