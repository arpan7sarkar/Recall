import { describe, expect, it } from "vitest";
import { maxUploadBytes, UploadFormValidationError, validateBrowserUpload } from "@/lib/uploadContract";

describe("browser upload safety contract", () => {
  it("rejects oversized and mismatched files", () => {
    const original = process.env.NEXT_PUBLIC_MAX_UPLOAD_MB;
    process.env.NEXT_PUBLIC_MAX_UPLOAD_MB = "1";
    try {
      expect(() => validateBrowserUpload({ name: "report.pdf", size: maxUploadBytes("1") + 1, type: "application/pdf" }, "pdf")).toThrow(UploadFormValidationError);
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_MAX_UPLOAD_MB;
      else process.env.NEXT_PUBLIC_MAX_UPLOAD_MB = original;
    }
    expect(() => validateBrowserUpload({ name: "report.pdf", size: 10, type: "image/png" }, "pdf")).toThrow(/supported PDF/i);
  });

  it("accepts a valid image", () => {
    expect(() => validateBrowserUpload({ name: "cover.webp", size: 1024, type: "image/webp" }, "image")).not.toThrow();
  });
});
