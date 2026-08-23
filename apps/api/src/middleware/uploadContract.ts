export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export class UploadValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function maxUploadBytes(value = process.env.MAX_FILE_UPLOAD_MB): number {
  const megabytes = Number(value ?? 20);
  if (!Number.isFinite(megabytes) || megabytes <= 0) return 20 * 1024 * 1024;
  return Math.floor(megabytes * 1024 * 1024);
}

function hasSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/gif") return buffer.subarray(0, 4).toString("ascii") === "GIF8";
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export function validateUploadBuffer(buffer: Buffer, mimeType: string): void {
  if (!ALLOWED_UPLOAD_TYPES.includes(mimeType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
    throw new UploadValidationError("Invalid file type. Only PDF and images are allowed.");
  }
  if (buffer.byteLength > maxUploadBytes()) {
    throw new UploadValidationError("File is larger than the configured upload limit.");
  }
  if (!hasSignature(buffer, mimeType)) {
    throw new UploadValidationError("The file content does not match its declared type.");
  }
}
