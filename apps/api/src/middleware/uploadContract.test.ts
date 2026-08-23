import { describe, expect, it } from "vitest";
import { maxUploadBytes, UploadValidationError, validateUploadBuffer } from "./uploadContract";

describe("upload safety contract", () => {
  it("accepts matching signatures for supported files", () => {
    expect(() => validateUploadBuffer(Buffer.from("%PDF-1.7\n"), "application/pdf")).not.toThrow();
    expect(() => validateUploadBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).not.toThrow();
  });

  it("rejects spoofed MIME types and oversized buffers", () => {
    expect(() => validateUploadBuffer(Buffer.from("not a pdf"), "application/pdf")).toThrow(UploadValidationError);
    const original = process.env.MAX_FILE_UPLOAD_MB;
    process.env.MAX_FILE_UPLOAD_MB = "1";
    try {
      expect(maxUploadBytes()).toBe(1024 * 1024);
      expect(() => validateUploadBuffer(Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(1024 * 1024)]), "application/pdf")).toThrow(/larger/i);
    } finally {
      if (original === undefined) delete process.env.MAX_FILE_UPLOAD_MB;
      else process.env.MAX_FILE_UPLOAD_MB = original;
    }
  });
});
