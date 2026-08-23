export const DEFAULT_MAX_UPLOAD_MB = 20;
export const ALLOWED_UPLOAD_MIME_TYPES = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

export class UploadFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadFormValidationError";
  }
}

export function maxUploadBytes(value = process.env.NEXT_PUBLIC_MAX_UPLOAD_MB): number {
  const megabytes = Number(value ?? DEFAULT_MAX_UPLOAD_MB);
  return Number.isFinite(megabytes) && megabytes > 0
    ? Math.floor(megabytes * 1024 * 1024)
    : DEFAULT_MAX_UPLOAD_MB * 1024 * 1024;
}

export function validateBrowserUpload(file: Pick<File, "name" | "size" | "type">, kind: "pdf" | "image"): void {
  if (file.size > maxUploadBytes()) {
    throw new UploadFormValidationError(`File must be smaller than ${Math.round(maxUploadBytes() / 1024 / 1024)} MB.`);
  }
  const allowed = ALLOWED_UPLOAD_MIME_TYPES[kind] as readonly string[];
  if (file.type && !allowed.includes(file.type)) {
    throw new UploadFormValidationError(`Choose a supported ${kind === "pdf" ? "PDF" : "image"} file.`);
  }
  const extension = file.name.toLowerCase().split(".").pop();
  if (kind === "pdf" && extension !== "pdf") {
    throw new UploadFormValidationError("Choose a PDF file.");
  }
  if (kind === "image" && !["jpg", "jpeg", "png", "webp", "gif"].includes(extension ?? "")) {
    throw new UploadFormValidationError("Choose a supported image file.");
  }
}
