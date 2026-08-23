import { describe, expect, it } from "vitest";
import {
  normalizeSaveMetadata,
  normalizeSaveUrl,
  parseYoutubeTimestamp,
  SaveValidationError,
} from "./saveContract";

describe("save request contract", () => {
  it("rejects malformed URLs and unsupported schemes before persistence", () => {
    expect(() => normalizeSaveUrl("not-a-url")).toThrowError(SaveValidationError);
    expect(() => normalizeSaveUrl("ftp://example.com/file")).toThrow(/http or https/i);
    expect(() => normalizeSaveUrl("https://")).toThrow(/valid URL/i);
  });

  it("normalizes a valid URL without losing its path", () => {
    expect(normalizeSaveUrl("  HTTPS://Example.com/article#comments  ")).toBe("https://example.com/article");
  });

  it("parses numeric and clock-form YouTube timestamps as seconds", () => {
    expect(parseYoutubeTimestamp("1:23:45")).toBe(5025);
    expect(parseYoutubeTimestamp("12:34")).toBe(754);
    expect(parseYoutubeTimestamp("90")).toBe(90);
    expect(parseYoutubeTimestamp(undefined)).toBeNull();
  });

  it("normalizes optional metadata", () => {
    expect(normalizeSaveMetadata({ title: " A title ", author: " Jane ", podcastName: " Show ", note: " Note " })).toEqual({
      title: "A title",
      author: "Jane",
      podcastName: "Show",
      note: "Note",
    });
  });
});
